import type { Node } from "@xyflow/react"
import { X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NODE_META, type FlowNodeType } from "./nodeTypes"

interface NodeSettingsPanelProps {
  node: Node
  onChange: (nodeId: string, data: Record<string, any>) => void
  onClose: () => void
  onDelete: (nodeId: string) => void
}

export function NodeSettingsPanel({ node, onChange, onClose, onDelete }: NodeSettingsPanelProps) {
  const type = node.type as FlowNodeType
  const meta = NODE_META[type]
  const data = node.data as Record<string, any>

  const update = (patch: Record<string, any>) => onChange(node.id, { ...data, ...patch })

  return (
    <div className="w-[320px] border-l bg-card h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <meta.icon className="h-4 w-4" /> {meta.label}
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(type === "message" || type === "form_input" || type === "agent_handoff") && (
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              className="h-28 resize-none"
              value={data.message || ""}
              onChange={(e) => update({ message: e.target.value })}
              placeholder="What should the bot say?"
            />
          </div>
        )}

        {type === "form_input" && (
          <div className="space-y-2">
            <Label>Save answer as</Label>
            <Input
              value={data.variableLabel || ""}
              onChange={(e) => update({ variableLabel: e.target.value })}
              placeholder="e.g. customer_name"
            />
          </div>
        )}

        {(type === "buttons" || type === "list") && (
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              className="h-20 resize-none"
              value={data.message || ""}
              onChange={(e) => update({ message: e.target.value })}
            />
          </div>
        )}

        {type === "buttons" && (
          <div className="space-y-2">
            <Label>Buttons (max 3)</Label>
            {(data.buttons || []).map((b: any, idx: number) => (
              <div key={b.id} className="flex gap-2">
                <Input
                  value={b.title}
                  onChange={(e) => {
                    const buttons = [...data.buttons]
                    buttons[idx] = { ...b, title: e.target.value }
                    update({ buttons })
                  }}
                  placeholder="Button label"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => update({ buttons: data.buttons.filter((_: any, i: number) => i !== idx) })}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {(data.buttons || []).length < 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  update({
                    buttons: [...(data.buttons || []), { id: `opt_${Date.now()}`, title: "New option" }],
                  })
                }
              >
                <Plus className="h-3 w-3 mr-1" /> Add button
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Connect each button's bottom handle on the canvas to where that reply should lead.
            </p>
          </div>
        )}

        {type === "list" && (
          <div className="space-y-2">
            <Label>Menu button label</Label>
            <Input value={data.buttonText || ""} onChange={(e) => update({ buttonText: e.target.value })} placeholder="Choose" />
            <Label>Options (max 10)</Label>
            {(data.sections?.[0]?.rows || []).map((r: any, idx: number) => (
              <div key={r.id} className="flex gap-2">
                <Input
                  value={r.title}
                  onChange={(e) => {
                    const rows = [...data.sections[0].rows]
                    rows[idx] = { ...r, title: e.target.value }
                    update({ sections: [{ ...data.sections[0], rows }] })
                  }}
                  placeholder="Option label"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    const rows = data.sections[0].rows.filter((_: any, i: number) => i !== idx)
                    update({ sections: [{ ...data.sections[0], rows }] })
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {(data.sections?.[0]?.rows || []).length < 10 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const section = data.sections?.[0] || { title: "Options", rows: [] }
                  const rows = [...(section.rows || []), { id: `row_${Date.now()}`, title: "New option" }]
                  update({ sections: [{ ...section, rows }] })
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add option
              </Button>
            )}
          </div>
        )}

        {type === "media" && (
          <div className="space-y-2">
            <Label>Media Type</Label>
            <Select value={data.mediaType || "image"} onValueChange={(v) => update({ mediaType: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
            <Label>Media ID</Label>
            <Input
              value={data.mediaId || ""}
              onChange={(e) => update({ mediaId: e.target.value })}
              placeholder="Meta media ID (uploaded via /whatsapp/media)"
            />
            <Label>Caption (optional)</Label>
            <Input value={data.caption || ""} onChange={(e) => update({ caption: e.target.value })} />
          </div>
        )}

        {type === "condition" && (
          <div className="space-y-2">
            <Label>Variable</Label>
            <Input
              value={data.field || ""}
              onChange={(e) => update({ field: e.target.value })}
              placeholder="Node id of a 'Collect Answer' step"
            />
            <Label>Equals</Label>
            <Input value={data.value || ""} onChange={(e) => update({ value: e.target.value })} />
            <p className="text-xs text-muted-foreground">
              Connect the "true" and "false" handles below the node to different paths.
            </p>
          </div>
        )}

        {type === "delay" && (
          <div className="space-y-2">
            <Label>Seconds</Label>
            <Input
              type="number"
              value={data.seconds ?? 5}
              onChange={(e) => update({ seconds: Number(e.target.value) })}
            />
          </div>
        )}

        {type === "end" && (
          <p className="text-xs text-muted-foreground">This ends the flow session for this contact.</p>
        )}
      </div>

      <div className="p-4 border-t">
        <Button variant="destructive" size="sm" className="w-full" onClick={() => onDelete(node.id)}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete node
        </Button>
      </div>
    </div>
  )
}
