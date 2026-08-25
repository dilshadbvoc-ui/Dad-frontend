import { useEffect, useRef, useState } from "react"
import { Play, Pause, Mic } from "lucide-react"
import type { IssueAttachment } from "@/services/issueService"

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const value = Number(e.target.value)
    audio.currentTime = value
    setCurrentTime(value)
  }

  return (
    <div className={`flex items-center gap-2 min-w-[220px] max-w-[260px] rounded-2xl px-3 py-2.5 ${isMine ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted/60"}`}>
      <audio ref={audioRef} src={attachment.url} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={togglePlay}
        className={`shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full transition-colors ${isMine ? "bg-primary-foreground/20 hover:bg-primary-foreground/30" : "bg-background hover:bg-accent"}`}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={handleSeek}
          className={`w-full h-1 rounded-full appearance-none cursor-pointer accent-current ${isMine ? "opacity-90" : ""}`}
        />
        <div className={`flex items-center gap-1 text-[10px] ${isMine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          <Mic className="h-2.5 w-2.5" />
          <span>{formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}</span>
        </div>
      </div>
    </div>
  )
}
