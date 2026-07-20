import { useState } from "react"
import { format, isPast, isToday } from "date-fns"
import { Clock, Phone, Edit, MoreHorizontal, User2, Building2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { LogCallDialog } from "@/components/LogCallDialog"
import { UpdateFollowUpDialog } from "@/components/UpdateFollowUpDialog"
import { api } from "@/services/api"
import { createInteraction } from "@/services/interactionService"
import { type FollowUpTask } from "@/services/followUpService"
import { cn } from "@/lib/utils"

export function FollowUpMobileCard({ task }: { task: FollowUpTask }) {
  const queryClient = useQueryClient()
  const [showCallDialog, setShowCallDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)

  const related = task.relatedTo as any
  const leadId = task.leadId || (task.onModel === 'Lead' ? related?.id : null)
  const name = related
    ? (`${related.firstName || ''} ${related.lastName || ''}`.trim() || related.company || 'Unknown')
    : 'Unknown'
  const leadPhone = related?.phone || ''

  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = dueDate && isPast(dueDate) && task.status !== 'completed'
  const isDueToday = dueDate && isToday(dueDate) && !isOverdue && task.status !== 'completed'

  const updateStatus = async (newStatus: string) => {
    try {
      await api.put(`/follow-ups/${task.id}`, { status: newStatus })
      if (leadId) {
        await createInteraction({
          type: 'note',
          direction: 'outbound',
          status: 'completed',
          subject: `Task Status: ${newStatus.replace('_', ' ')}`,
          description: `Follow-up status changed to ${newStatus.replace('_', ' ')} for task: ${task.subject}`,
          date: new Date().toISOString(),
          relatedTo: leadId,
          onModel: 'Lead'
        })
        queryClient.invalidateQueries({ queryKey: ['timeline', 'lead', leadId] })
      }
      toast.success('Status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  let statusVariant: "default" | "secondary" | "destructive" | "outline" = "outline"
  switch (task.status) {
    case 'completed': statusVariant = "default"; break
    case 'in_progress': statusVariant = "secondary"; break
    case 'not_started': statusVariant = "outline"; break
    case 'deferred': statusVariant = "destructive"; break
  }

  let priorityColor = ""
  switch (task.priority) {
    case 'high': priorityColor = "text-red-600 bg-red-50 border-red-200"; break
    case 'medium': priorityColor = "text-yellow-700 bg-yellow-50 border-yellow-200"; break
    case 'low': priorityColor = "text-green-700 bg-green-50 border-green-200"; break
  }

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden rounded-xl bg-card">
      <CardContent className="p-0">
        {/* Colored left accent for overdue/today */}
        {(isOverdue || isDueToday) && (
          <div className={cn(
            "h-1 w-full",
            isOverdue ? "bg-destructive" : "bg-orange-400"
          )} />
        )}

        <div className="p-4 space-y-3">
          {/* Row 1: Status badge + Priority badge */}
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant={statusVariant}
              className="capitalize text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            >
              {task.status.replace('_', ' ')}
            </Badge>
            {task.priority && (
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                priorityColor
              )}>
                {task.priority}
              </span>
            )}
          </div>

          {/* Row 2: Lead name / Subject */}
          <div className="space-y-0.5 min-w-0">
            {leadId ? (
              <Link
                to={`/leads/${leadId}`}
                className="font-semibold text-base text-foreground hover:text-primary transition-colors line-clamp-1 block"
              >
                {name}
              </Link>
            ) : (
              <p className="font-semibold text-base text-foreground line-clamp-1">{task.subject}</p>
            )}
            {task.onModel === 'Lead' && task.subject !== name && (
              <p className="text-xs text-muted-foreground line-clamp-1">{task.subject}</p>
            )}
          </div>

          {/* Row 3: Metadata */}
          <div className="flex flex-col gap-1.5 text-xs rounded-lg bg-muted/40 border border-border/30 px-3 py-2.5">
            {/* Due Date */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Clock className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isOverdue ? "text-destructive" : isDueToday ? "text-orange-500" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "font-medium truncate",
                  isOverdue ? "text-destructive" : isDueToday ? "text-orange-600" : "text-foreground/80"
                )}>
                  {dueDate ? format(dueDate, "MMM d, yyyy · h:mm a") : "No due date"}
                </span>
              </div>
              {isOverdue && (
                <span className="shrink-0 text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-bold">
                  OVERDUE
                </span>
              )}
              {isDueToday && (
                <span className="shrink-0 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">
                  TODAY
                </span>
              )}
            </div>

            {/* User + Branch row */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <User2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-foreground/70 truncate">
                  {task.assignedTo
                    ? `${task.assignedTo.firstName} ${task.assignedTo.lastName || ''}`.trim()
                    : '—'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-foreground/70 truncate">{task.branch?.name || 'Main Branch'}</span>
              </div>
            </div>
          </div>

          {/* Row 4: Action buttons */}
          <div className="flex items-center gap-2 pt-0.5">
            {task.onModel === 'Lead' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 h-9 gap-1.5 rounded-lg text-xs font-semibold border-border/60"
                onClick={() => setShowCallDialog(true)}
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 h-9 gap-1.5 rounded-lg text-xs font-semibold border-border/60",
                task.onModel !== 'Lead' && "w-full"
              )}
              onClick={() => setShowUpdateDialog(true)}
            >
              <Edit className="h-3.5 w-3.5" />
              Update
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-lg border-border/60"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {leadId && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to={`/leads/${leadId}`} className="w-full cursor-pointer h-10 text-sm">
                        View Lead
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuLabel>Quick Status</DropdownMenuLabel>
                <DropdownMenuItem className="h-10 text-sm" onClick={() => updateStatus('not_started')}>
                  Not Started
                </DropdownMenuItem>
                <DropdownMenuItem className="h-10 text-sm" onClick={() => updateStatus('in_progress')}>
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem className="h-10 text-sm" onClick={() => updateStatus('completed')}>
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-10 text-sm text-destructive focus:text-destructive"
                  onClick={() => updateStatus('deferred')}
                >
                  Deferred
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>

      {showCallDialog && (
        <LogCallDialog
          open={showCallDialog}
          onOpenChange={setShowCallDialog}
          leadId={leadId as string}
          leadName={name}
          leadPhone={leadPhone}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['follow-ups'] })}
        />
      )}

      {showUpdateDialog && (
        <UpdateFollowUpDialog
          open={showUpdateDialog}
          onOpenChange={setShowUpdateDialog}
          task={task as any}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['follow-ups'] })}
        />
      )}
    </Card>
  )
}
