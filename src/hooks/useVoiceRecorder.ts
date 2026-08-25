import { useCallback, useRef, useState } from "react"

export type VoiceRecorderState = "idle" | "recording" | "locked" | "stopping"

export interface VoiceRecordingResult {
  blob: Blob
  mimeType: string
  durationSeconds: number
}

interface UseVoiceRecorderOptions {
  /** Auto-stop ceiling in seconds so a forgotten hands-free recording can't grow unbounded. Default 300 (5 min). */
  maxDurationSeconds?: number
  /** Fired when the recorder auto-stops because maxDurationSeconds was hit (still resolves via stop()'s caller). */
  onMaxDurationReached?: () => void
}

// Voice notes only need to carry speech clearly, so a low mono bitrate keeps
// files small (a multi-minute note stays well under 1MB) without any audible
// quality loss for the use case.
const TARGET_BITS_PER_SECOND = 32000

const CANDIDATE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/webm",
  "audio/ogg;codecs=opus",
]

function pickSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return ""
  for (const type of CANDIDATE_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ""
}

const LEVEL_WINDOW = 32

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const { maxDurationSeconds = 300, onMaxDurationReached } = options

  const [state, setState] = useState<VoiceRecorderState>("idle")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [levels, setLevels] = useState<number[]>([])

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeTypeRef = useRef<string>("")
  const startedAtRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const resolveStopRef = useRef<((result: VoiceRecordingResult | null) => void) | null>(null)
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopLevelLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const teardown = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current)
      maxDurationTimerRef.current = null
    }
    stopLevelLoop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    analyserRef.current = null
    recorderRef.current = null
    chunksRef.current = []
    setLevels([])
  }, [stopLevelLoop])

  const runLevelLoop = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Uint8Array(analyser.fftSize)
    const tick = () => {
      analyser.getByteTimeDomainData(data)
      let sumSquares = 0
      for (let i = 0; i < data.length; i++) {
        const centered = (data[i] - 128) / 128
        sumSquares += centered * centered
      }
      const rms = Math.sqrt(sumSquares / data.length)
      setLevels((prev) => {
        const next = [...prev, Math.min(1, rms * 4)]
        return next.length > LEVEL_WINDOW ? next.slice(next.length - LEVEL_WINDOW) : next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const finalize = useCallback((): VoiceRecordingResult | null => {
    const mimeType = mimeTypeRef.current || "audio/webm"
    const durationSeconds = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
    const chunks = chunksRef.current
    if (chunks.length === 0 || durationSeconds === 0) return null
    const blob = new Blob(chunks, { type: mimeType })
    return { blob, mimeType, durationSeconds }
  }, [])

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    streamRef.current = stream

    const mimeType = pickSupportedMimeType()
    mimeTypeRef.current = mimeType
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: TARGET_BITS_PER_SECOND })
      : new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const result = finalize()
      teardown()
      setState("idle")
      setElapsedSeconds(0)
      resolveStopRef.current?.(result)
      resolveStopRef.current = null
    }
    recorderRef.current = recorder

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioContext = new AudioCtx()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      runLevelLoop()
    } catch {
      // Waveform is a visual nicety - recording still works without it.
    }

    startedAtRef.current = Date.now()
    recorder.start(250)
    setState("recording")
    setElapsedSeconds(0)
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000))
    }, 200)

    if (maxDurationSeconds > 0) {
      maxDurationTimerRef.current = setTimeout(() => {
        onMaxDurationReached?.()
        recorderRef.current?.stop()
      }, maxDurationSeconds * 1000)
    }
  }, [finalize, maxDurationSeconds, onMaxDurationReached, runLevelLoop, teardown])

  const lock = useCallback(() => {
    setState((prev) => (prev === "recording" ? "locked" : prev))
  }, [])

  const stop = useCallback((): Promise<VoiceRecordingResult | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state === "inactive") {
        resolve(null)
        return
      }
      setState("stopping")
      resolveStopRef.current = resolve
      recorder.stop()
    })
  }, [])

  const cancel = useCallback(() => {
    const recorder = recorderRef.current
    resolveStopRef.current = null
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null
      recorder.stop()
    }
    teardown()
    setState("idle")
    setElapsedSeconds(0)
  }, [teardown])

  return { state, elapsedSeconds, levels, start, stop, lock, cancel }
}
