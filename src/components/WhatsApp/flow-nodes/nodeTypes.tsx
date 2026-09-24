import { Handle, Position, type NodeProps } from "@xyflow/react"
import {
  MessageSquare,
  ListChecks,
  Rows3,
  Image as ImageIcon,
  FormInput,
  GitBranch,
  Clock,
  UserCheck,
  Flag,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type FlowNodeType =
  | "message"
  | "buttons"
  | "list"
  | "media"
  | "form_input"
  | "condition"
  | "delay"
  | "agent_handoff"
  | "end"

interface NodeMeta {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  requiresInput: boolean
  defaultData: Record<string, any>
}

export const NODE_META: Record<FlowNodeType, NodeMeta> = {
  message: {
    label: "Message",
    icon: MessageSquare,
    color: "border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800",
    requiresInput: false,
    defaultData: { message: "Hi! 👋" },
  },
  buttons: {
    label: "Quick Reply Buttons",
    icon: ListChecks,
    color: "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800",
    requiresInput: true,
    defaultData: { message: "Please choose an option", buttons: [{ id: "opt1", title: "Option 1" }] },
  },
  list: {
    label: "List Menu",
    icon: Rows3,
    color: "border-teal-300 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800",
    requiresInput: true,
    defaultData: { message: "Please pick one", buttonText: "Choose", sections: [{ title: "Options", rows: [{ id: "row1", title: "Row 1" }] }] },
  },
  media: {
    label: "Media",
    icon: ImageIcon,
    color: "border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800",
    requiresInput: false,
    defaultData: { mediaType: "image", mediaId: "", caption: "" },
  },
  form_input: {
    label: "Collect Answer",
    icon: FormInput,
    color: "border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800",
    requiresInput: true,
    defaultData: { message: "What's your name?", variableLabel: "name" },
  },
  condition: {
    label: "Condition",
    icon: GitBranch,
    color: "border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800",
    requiresInput: false,
    defaultData: { field: "", value: "" },
  },
  delay: {
    label: "Delay",
    icon: Clock,
    color: "border-slate-300 bg-slate-50 dark:bg-slate-900/20 dark:border-slate-800",
    requiresInput: false,
    defaultData: { seconds: 5 },
  },
  agent_handoff: {
    label: "Hand Off to Agent",
    icon: UserCheck,
    color: "border-rose-300 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800",
    requiresInput: false,
    defaultData: { message: "Please wait, we're connecting you with an agent." },
  },
  end: {
    label: "End",
    icon: Flag,
    color: "border-gray-300 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-800",
    requiresInput: false,
    defaultData: {},
  },
}

export const NODE_PALETTE: FlowNodeType[] = [
  "message",
  "buttons",
  "list",
  "media",
  "form_input",
  "condition",
  "delay",
  "agent_handoff",
  "end",
]

function preview(type: FlowNodeType, data: Record<string, any>): string {
  switch (type) {
    case "message":
    case "form_input":
    case "agent_handoff":
      return data.message || ""
    case "buttons":
      return `${data.message || ""} (${(data.buttons || []).length} buttons)`
    case "list":
      return `${data.message || ""} (${(data.sections || []).reduce((n: number, s: any) => n + (s.rows?.length || 0), 0)} options)`
    case "media":
      return `${data.mediaType || "image"}${data.caption ? `: ${data.caption}` : ""}`
    case "condition":
      return data.field ? `${data.field} == ${data.value}` : "No condition set"
    case "delay":
      return `${data.seconds || 0}s`
    default:
      return ""
  }
}

function GenericFlowNode({ type: nodeType, data: rawData, selected }: NodeProps) {
  const type = (nodeType as FlowNodeType) || "message"
  const data = rawData as Record<string, any>
  const meta = NODE_META[type]
  const Icon = meta.icon
  const isRoot = data?.isRoot as boolean

  return (
    <div
      className={cn(
        "min-w-[220px] max-w-[260px] rounded-xl border-2 shadow-sm px-3 py-2.5 text-left",
        meta.color,
        selected ? "ring-2 ring-primary" : ""
      )}
    >
      {!isRoot && <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />}
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-xs font-semibold">{meta.label}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 break-words">
        {preview(type, data) || "Click to configure"}
      </p>

      {type === "buttons" ? (
        (data.buttons || []).map((b: any) => (
          <Handle
            key={b.id}
            type="source"
            position={Position.Bottom}
            id={b.id}
            style={{ left: undefined }}
            className="!bg-emerald-500"
          />
        ))
      ) : type === "list" ? (
        (data.sections || []).flatMap((s: any) => s.rows || []).map((r: any) => (
          <Handle key={r.id} type="source" position={Position.Bottom} id={r.id} className="!bg-teal-500" />
        ))
      ) : type === "condition" ? (
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>true</span>
          <span>false</span>
        </div>
      ) : null}

      {type === "condition" ? (
        <>
          <Handle type="source" position={Position.Bottom} id="true" style={{ left: "30%" }} className="!bg-green-500" />
          <Handle type="source" position={Position.Bottom} id="false" style={{ left: "70%" }} className="!bg-red-500" />
        </>
      ) : type !== "buttons" && type !== "list" && type !== "end" && type !== "agent_handoff" ? (
        <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
      ) : null}
    </div>
  )
}

export const nodeTypes = {
  message: GenericFlowNode,
  buttons: GenericFlowNode,
  list: GenericFlowNode,
  media: GenericFlowNode,
  form_input: GenericFlowNode,
  condition: GenericFlowNode,
  delay: GenericFlowNode,
  agent_handoff: GenericFlowNode,
  end: GenericFlowNode,
}
