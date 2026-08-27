import { useEffect, useRef, useState } from "react"
import { Mic, Square, Trash2, Send, Play, Pause, ChevronUp, ChevronLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder"
import { uploadIssueVoiceNote, type IssueAttachment } from "@/services/issueService"
import { isAndroidWebView } from "@/utils/androidBridge"

const LOCK_THRESHOLD_PX = 60
const CANCEL_THRESHOLD_PX = 80

function isCoarsePointer() {
  return typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

type UiMode = "idle" | "held" | "locked" | "preview" | "finishing"

interface VoiceRecorderProps {
  onSend: (attachment: IssueAttachment) => void
  onActiveChange: (active: boolean) => void
  disabled?: boolean
  /** Passed through to the upload call for platform-level users (e.g. super admin) who have no organisationId of their own. */
  organisationId?: string
}

export function VoiceRecorder({ onSend, onActiveChange, disabled, organisationId }: VoiceRecorderProps) {
  const recorder = useVoiceRecorder({
    onMaxDurationReached: () => toast.info("Voice note reached the 5 minute limit and was sent."),
  })
  const [mode, setMode] = useState<UiMode>("idle")
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewPlaying, setPreviewPlaying] = useState(false)
  const [previewDuration, setPreviewDuration] = useState(0)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const uploadPromiseRef = useRef<Promise<IssueAttachment> | null>(null)
  const blobRef = useRef<Blob | null>(null)
  const gestureStartRef = useRef({ x: 0, y: 0 })
  const lockedRef = useRef(false)
  const autoSendRef = useRef(false)

  useEffect(() => {
    onActiveChange(mode !== "idle")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const kickUpload = (durationSeconds: number) => {
    const blob = blobRef.current
    if (!blob) return
    uploadPromiseRef.current = uploadIssueVoiceNote(blob, blob.type, durationSeconds, organisationId).catch((err) => {
      toast.error(err?.message || "Failed to upload voice message")
      throw err
    })
  }

  const handleStart = async () => {
    if (disabled) return
    try {
      await recorder.start()
      lockedRef.current = false
      gestureStartRef.current = { x: 0, y: 0 }
      setDragX(0)
      setDragY(0)
      setMode("held")
    } catch (err: unknown) {
      const error = err as { name?: string }
      if (error?.name === "NotAllowedError") {
        toast.error(
          isAndroidWebView()
            ? "Microphone permission denied. Enable it for this app in your phone's Settings."
            : "Microphone permission denied. Please allow microphone access."
        )
      } else if (error?.name === "NotFoundError") {
        toast.error("No microphone found on this device.")
      } else {
        toast.error("Could not start recording.")
      }
    }
  }

  const finishAndSend = async () => {
    setMode("finishing")
    const result = await recorder.stop()
    if (!result) {
      setMode("idle")
      return
    }
    blobRef.current = result.blob
    kickUpload(result.durationSeconds)
    try {
      const attachment = await uploadPromiseRef.current
      if (attachment) onSend(attachment)
    } catch {
      // toasted in kickUpload
    } finally {
      setMode("idle")
    }
  }

  const stopToPreview = async () => {
    const result = await recorder.stop()
    if (!result) {
      setMode("idle")
      return
    }
    blobRef.current = result.blob
    kickUpload(result.durationSeconds)
    setPreviewDuration(result.durationSeconds)
    setPreviewUrl(URL.createObjectURL(result.blob))
    setMode("preview")
  }

  const handleCancel = () => {
    recorder.cancel()
    blobRef.current = null
    uploadPromiseRef.current = null
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewPlaying(false)
    setPreviewDuration(0)
    setDragX(0)
    setDragY(0)
    setMode("idle")
  }

  const handlePreviewSend = async () => {
    setMode("finishing")
    try {
      const attachment = await uploadPromiseRef.current
      if (attachment) onSend(attachment)
    } catch {
      // toasted in kickUpload
    } finally {
      setMode("idle")
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const togglePreviewPlay = () => {
    const audio = previewAudioRef.current
    if (!audio) return
    if (previewPlaying) {
      audio.pause()
      setPreviewPlaying(false)
    } else {
      audio.play().catch(() => {})
      setPreviewPlaying(true)
    }
  }

  // --- Touch gesture wiring (press-hold, slide-left-to-cancel, swipe-up-to-lock) ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isCoarsePointer()) return
    e.preventDefault()
    gestureStartRef.current = { x: e.clientX, y: e.clientY }
    autoSendRef.current = false
    handleStart().then(() => {
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
      window.addEventListener("pointercancel", handlePointerUp)
    })
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (lockedRef.current) return
    const dx = e.clientX - gestureStartRef.current.x
    const dy = e.clientY - gestureStartRef.current.y
    setDragX(Math.min(0, dx))
    setDragY(Math.min(0, dy))
    if (dy < -LOCK_THRESHOLD_PX) {
      lockedRef.current = true
      recorder.lock()
      setMode("locked")
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)
    }
  }

  const handlePointerUp = (e: PointerEvent) => {
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
    window.removeEventListener("pointercancel", handlePointerUp)
    if (lockedRef.current) return
    const dx = e.clientX - gestureStartRef.current.x
    setDragX(0)
    setDragY(0)
    if (dx < -CANCEL_THRESHOLD_PX) {
      handleCancel()
    } else {
      finishAndSend()
    }
  }

  // --- Desktop tap-to-toggle ---
  const handleTapMic = () => {
    if (isCoarsePointer()) return
    handleStart()
  }

  if (mode === "idle") {
    return (
      <button
        type="button"
        disabled={disabled}
        onPointerDown={handlePointerDown}
        onClick={handleTapMic}
        className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none touch-none"
        title="Record a voice message"
      >
        <Mic className="h-4 w-4" />
      </button>
    )
  }

  if (mode === "finishing") {
    return (
      <div className="flex-1 flex items-center gap-2 rounded-md border border-input bg-muted/40 px-3 h-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Sending voice message...
      </div>
    )
  }

  if (mode === "preview") {
    return (
      <div className="flex-1 flex items-center gap-2 rounded-md border border-input bg-background px-2 h-10">
        <audio
          ref={previewAudioRef}
          src={previewUrl || undefined}
          onEnded={() => setPreviewPlaying(false)}
          className="hidden"
        />
        <button type="button" onClick={togglePreviewPlay} className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-muted hover:bg-accent">
          {previewPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </button>
        <span className="text-xs text-muted-foreground flex-1">{formatTime(previewDuration)} voice message</span>
        <button type="button" onClick={handleCancel} className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={handlePreviewSend} className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  // mode === "held" | "locked"
  const coarse = isCoarsePointer()
  return (
    <div className="flex-1 relative flex items-center gap-2 rounded-md border border-input bg-background px-3 h-10 overflow-hidden">
      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
      <span className="text-xs font-medium tabular-nums shrink-0">{formatTime(recorder.elapsedSeconds)}</span>
      <div className="flex-1 flex items-end gap-0.5 h-5 min-w-0" style={{ transform: coarse && mode === "held" ? `translateX(${dragX}px)` : undefined }}>
        {recorder.levels.map((lvl, i) => (
          <span
            key={i}
            className="w-0.5 rounded-full bg-primary/70 shrink-0"
            style={{ height: `${Math.max(10, lvl * 100)}%` }}
          />
        ))}
      </div>

      {mode === "held" && coarse && (
        <>
          <span
            className="absolute right-3 text-xs text-muted-foreground flex items-center gap-1 pointer-events-none"
            style={{ opacity: Math.max(0, 1 - Math.abs(dragX) / CANCEL_THRESHOLD_PX) }}
          >
            <ChevronLeft className="h-3 w-3" /> Slide to cancel
          </span>
          <span
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 text-[10px] text-muted-foreground flex flex-col items-center pointer-events-none"
            style={{ opacity: Math.max(0, 1 - Math.abs(dragY) / LOCK_THRESHOLD_PX) }}
          >
            <ChevronUp className="h-3 w-3" /> Lock
          </span>
        </>
      )}

      {mode === "held" && !coarse && (
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={handleCancel} className="h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={stopToPreview} className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Square className="h-3 w-3" fill="currentColor" />
          </button>
        </div>
      )}

      {mode === "locked" && (
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={handleCancel} className="h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={finishAndSend} className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
