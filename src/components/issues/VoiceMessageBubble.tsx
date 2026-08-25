import { useEffect, useRef, useState } from "react"
import { Play, Pause, Loader2 } from "lucide-react"
import type { IssueAttachment } from "@/services/issueService"

const BAR_COUNT = 40

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

// Deterministic pseudo-random fallback so the bar heights are still varied
// (not a flat line) if the real audio can't be decoded for some reason.
function fallbackPeaks(seed: string): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const peaks: number[] = []
  for (let i = 0; i < BAR_COUNT; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    peaks.push(0.25 + (h % 1000) / 1000 * 0.7)
  }
  return peaks
}

async function decodePeaks(url: string): Promise<number[]> {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const audioContext = new AudioCtx()
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const channel = audioBuffer.getChannelData(0)
    const bucketSize = Math.max(1, Math.floor(channel.length / BAR_COUNT))
    const peaks: number[] = []
    let max = 0.0001
    for (let i = 0; i < BAR_COUNT; i++) {
      const start = i * bucketSize
      let peak = 0
      for (let j = start; j < start + bucketSize && j < channel.length; j++) {
        const v = Math.abs(channel[j])
        if (v > peak) peak = v
      }
      peaks.push(peak)
      if (peak > max) max = peak
    }
    return peaks.map((p) => Math.max(0.12, p / max))
  } finally {
    audioContext.close().catch(() => {})
  }
}

interface VoiceMessageBubbleProps {
  attachment: IssueAttachment
  isMine: boolean
}

export function VoiceMessageBubble({ attachment, isMine }: VoiceMessageBubbleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(attachment.duration || 0)
  const [peaks, setPeaks] = useState<number[] | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!attachment.url) return
    decodePeaks(attachment.url)
      .then((p) => {
        if (!cancelled) setPeaks(p)
      })
      .catch(() => {
        if (!cancelled) setPeaks(fallbackPeaks(attachment.documentId || attachment.name))
      })
    return () => {
      cancelled = true
    }
  }, [attachment.url, attachment.documentId, attachment.name])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    }
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("ended", onEnded)
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("ended", onEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  const seekToRatio = (ratio: number) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const time = Math.min(duration, Math.max(0, ratio * duration))
    audio.currentTime = time
    setCurrentTime(time)
  }

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    seekToRatio((e.clientX - rect.left) / rect.width)
  }

  const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0
  const playedBars = Math.round(progressRatio * BAR_COUNT)

  return (
    <div className={`flex items-center gap-2.5 min-w-[230px] max-w-[270px] rounded-2xl px-3 py-2.5 ${isMine ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted/60"}`}>
      <audio ref={audioRef} src={attachment.url} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={togglePlay}
        className={`shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full transition-colors ${isMine ? "bg-primary-foreground/20 hover:bg-primary-foreground/30" : "bg-background hover:bg-accent"}`}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {peaks ? (
          <div
            className="flex items-center gap-[2px] h-6 cursor-pointer select-none"
            onClick={handleBarClick}
          >
            {peaks.map((p, i) => (
              <span
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  i < playedBars
                    ? isMine
                      ? "bg-primary-foreground"
                      : "bg-primary"
                    : isMine
                      ? "bg-primary-foreground/35"
                      : "bg-foreground/20"
                }`}
                style={{ height: `${Math.round(p * 100)}%` }}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-6">
            <Loader2 className={`h-3.5 w-3.5 animate-spin ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
          </div>
        )}
        <div className={`flex items-center gap-1 text-[10px] ${isMine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          <span>{formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}</span>
        </div>
      </div>
    </div>
  )
}
