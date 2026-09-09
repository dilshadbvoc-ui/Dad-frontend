import { useNavigate } from "react-router-dom"
import { type Lead } from "@/services/leadService"

// A small fixed palette so each lead's avatar gets a consistent (but varied)
// color derived from their name, rather than every row looking identical.
const AVATAR_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-5))",
]

function avatarColorFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export const NameCell = ({ lead }: { lead: Lead }) => {
  const navigate = useNavigate()
  const fullName = `${lead.firstName} ${lead.lastName || ''}`.trim() || 'Unnamed'
  const initial = lead.firstName?.[0]?.toUpperCase() || '?'

  return (
    <div
      className="flex items-center gap-2.5 cursor-pointer group min-w-0"
      onClick={(e) => {
        e.stopPropagation()
        navigate(`/leads/${lead.id}`)
      }}
    >
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: avatarColorFor(fullName) }}
      >
        {initial}
      </div>
      <span className="font-medium text-foreground group-hover:text-[hsl(var(--chart-5))] group-hover:underline truncate">
        {fullName}
      </span>
    </div>
  )
}
