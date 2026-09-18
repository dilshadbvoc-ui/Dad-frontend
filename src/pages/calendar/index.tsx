import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getEvents, createEvent, deleteEvent, type CalendarEvent, type CreateEventData } from "@/services/eventService"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { EventDetailsDialog } from "@/components/EventDetailsDialog"
import { toast } from "sonner"
import { formatIST } from "@/lib/dateUtils"


const typeColors: Record<string, string> = { meeting: 'bg-blue-500', call: 'bg-green-500', task: 'bg-orange-500', demo: 'bg-purple-500', follow_up: 'bg-pink-500', reminder: 'bg-yellow-500' }
// Complete literal classes (not built from typeColors via string ops) so Tailwind's
// static scanner actually generates them — the previous approach built a `border-color`
// inline style from a CSS custom property like `var(--blue-500)`, which was never defined
// anywhere in index.css, so every mobile event card's border tint was silently a no-op.
const typeBorderColors: Record<string, string> = { meeting: 'border-blue-500/40', call: 'border-green-500/40', task: 'border-orange-500/40', demo: 'border-purple-500/40', follow_up: 'border-pink-500/40', reminder: 'border-yellow-500/40' }
// Same story as typeBorderColors — Tailwind v4 dropped the old `bg-opacity-*` utility in
// favor of the `/10` slash syntax, so `bg-blue-500 bg-opacity-10` used to render as a fully
// opaque solid color instead of a light 10% tint. These are the literal replacements.
const typeBgTintColors: Record<string, string> = { meeting: 'bg-blue-500/10', call: 'bg-green-500/10', task: 'bg-orange-500/10', demo: 'bg-purple-500/10', follow_up: 'bg-pink-500/10', reminder: 'bg-yellow-500/10' }

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const queryClient = useQueryClient()

  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
  startOfWeek.setHours(0, 0, 0, 0) // Start of day

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // 6 days later (Sun-Sat)
  endOfWeek.setHours(23, 59, 59, 999) // End of day



  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['calendar-events', startOfWeek.toISOString()],
    queryFn: () => getEvents(startOfWeek.toISOString(), endOfWeek.toISOString()),
  })

  const events = (eventsData?.events || []).filter((e: CalendarEvent | null) => e && typeof e === 'object');


  const createMutation = useMutation({
    mutationFn: (data: CreateEventData) => createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setIsDialogOpen(false)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event deleted')
    }
  })

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsDetailsOpen(true)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const startTime = new Date(`${date}T${time}`)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour default

    createMutation.mutate({
      title: formData.get('title') as string,
      type: formData.get('type') as string,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: formData.get('location') as string,
    })
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8 AM to 7 PM

  const getEventsForDay = (date: Date) => {
    return events.filter((e: CalendarEvent) => {
      const eventDate = new Date(e.startTime)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  return (
    <div className="bg-white space-y-4 sm:space-y-8 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-medium font-poppins tracking-tight text-foreground">Calendar</h1>
          <p className="text-muted-foreground font-poppins mt-0.5 text-[12px] sm:text-[14px] opacity-80">Schedule and manage your events.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/60 rounded-[10px] p-1">
            <Button variant="ghost" size="icon" onClick={() => navigateWeek(-1)} className="h-8 w-8 text-muted-foreground hover:text-[hsl(var(--chart-5))]"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="font-semibold min-w-45 sm:min-w-50 text-center text-xs sm:text-sm text-foreground">{startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <Button variant="ghost" size="icon" onClick={() => navigateWeek(1)} className="h-8 w-8 text-muted-foreground hover:text-[hsl(var(--chart-5))]"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-semibold bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/90">
                <Plus className="h-3.5 w-3.5" />New Event
              </Button>
            </DialogTrigger>
            <DialogContent>
                    <form onSubmit={handleSubmit}>
                      <DialogHeader>
                        <DialogTitle>Create Event</DialogTitle>
                        <DialogDescription className="sr-only">Schedule a new meeting, call, or task.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div><Label>Title</Label><Input name="title" required /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div><Label>Type</Label>
                            <Select name="type" defaultValue="meeting">
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="meeting">Meeting</SelectItem>
                                <SelectItem value="call">Call</SelectItem>
                                <SelectItem value="demo">Demo</SelectItem>
                                <SelectItem value="follow_up">Follow Up</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label>Date</Label><Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div><Label>Time</Label><Input name="time" type="time" required defaultValue="09:00" /></div>
                          <div><Label>Location</Label><Input name="location" placeholder="Optional" /></div>
                        </div>
                      </div>
                      <DialogFooter><Button type="submit">Create Event</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-[10px] bg-card border border-border overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-border">
                {[
                  { label: "This Week", value: events.length, accent: "bg-[hsl(var(--chart-5))]" },
                  { label: "Meetings", value: events.filter((e: CalendarEvent) => e.type === 'meeting').length, accent: "bg-[hsl(var(--chart-2))]" },
                  { label: "Demos", value: events.filter((e: CalendarEvent) => e.type === 'demo').length, accent: "bg-purple-500" },
                  { label: "Completed", value: events.filter((e: CalendarEvent) => e.status === 'completed').length, accent: "bg-amber-500" },
                ].map((tile) => (
                  <div key={tile.label} className="relative flex flex-col items-center justify-center gap-1 px-4 py-4">
                    <span className={`absolute top-0 left-0 right-0 h-0.5 ${tile.accent} opacity-70`} />
                    <span className="text-xs font-poppins text-muted-foreground">{tile.label}</span>
                    <span className="text-xl sm:text-2xl font-medium font-poppins text-black">{tile.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly View (Desktop) / Daily List (Mobile) */}
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 rounded-full border-4 border-[hsl(var(--chart-5))] border-t-transparent animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading calendar...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile View: Vertically Stacked Days */}
                <div className="lg:hidden space-y-4">
                  {weekDays.map((_, i) => {
                    const date = new Date(startOfWeek)
                    date.setDate(startOfWeek.getDate() + i)
                    const dayEvents = getEventsForDay(date)
                    const isToday = date.toDateString() === new Date().toDateString()
                    
                    if (dayEvents.length === 0 && !isToday) return null;

                    return (
                      <Card key={i} className={`overflow-hidden rounded-[10px] border-l-4 ${isToday ? 'border-l-[hsl(var(--chart-5))] bg-[hsl(var(--chart-5))]/5' : 'border-l-muted'}`}>
                        <div className="p-3 border-b border-border flex justify-between items-center">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{weekDays[i]}</span>
                            <h3 className="text-lg font-bold">{date.getDate()} {date.toLocaleDateString('en-US', { month: 'short' })}</h3>
                          </div>
                          {isToday && <Badge className="bg-[hsl(var(--chart-5))] text-white text-[10px]">TODAY</Badge>}
                        </div>
                        <CardContent className="p-3 space-y-2">
                          {dayEvents.length > 0 ? (
                            dayEvents.sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((event: CalendarEvent) => (
                              <div
                                key={event.id}
                                onClick={() => handleEventClick(event)}
                                className={`flex items-center gap-3 p-3 rounded-[10px] border transition-all active:scale-[0.98] ${typeBgTintColors[event.type] || 'bg-muted'} ${typeBorderColors[event.type] || 'border-border'}`}
                              >
                                <div className={`w-2 h-10 rounded-full ${typeColors[event.type]}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm truncate">{event.title}</h4>
                                    <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                                      {formatIST(event.startTime, 'h:mm a')}
                                    </span>
                                  </div>
                                  {event.description && <p className="text-[10px] text-muted-foreground truncate italic">{event.description}</p>}
                                  <div className="flex items-center gap-1 mt-1">
                                    <Badge variant="outline" className="text-[9px] uppercase h-4 px-1.5 font-bold">
                                      {event.type.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic py-2 text-center">No events scheduled</p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                  {events.length === 0 && (
                    <div className="text-center py-12 px-6 bg-card rounded-[14px] border border-dashed border-border">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                      <h3 className="text-lg font-bold">Clear Schedule</h3>
                      <p className="text-sm text-muted-foreground">You have no events scheduled for this week.</p>
                      <Button variant="outline" className="mt-4 rounded-[10px]" onClick={() => setIsDialogOpen(true)}>Schedule an Event</Button>
                    </div>
                  )}
                </div>

                {/* Desktop View: Weekly Grid */}
                <Card className="hidden lg:block overflow-hidden rounded-[10px] shadow-sm">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-8 border-b border-border">
                      <div className="p-4 border-r border-border bg-muted/30"></div>
                      {weekDays.map((day, i) => {
                        const date = new Date(startOfWeek)
                        date.setDate(startOfWeek.getDate() + i)
                        const isToday = date.toDateString() === new Date().toDateString()
                        return (
                          <div key={day} className={`p-4 text-center border-r border-border ${isToday ? 'bg-[hsl(var(--chart-5))]/5' : 'bg-background'}`}>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{day}</p>
                            <p className={`text-xl font-bold mt-1 ${isToday ? 'text-[hsl(var(--chart-5))]' : 'text-foreground'}`}>{date.getDate()}</p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="max-h-150 overflow-y-auto custom-scrollbar">
                      {hours.map(hour => (
                        <div key={hour} className="grid grid-cols-8 border-b border-border min-h-25">
                          <div className="p-2 border-r border-border text-[10px] text-muted-foreground font-bold text-right pr-4 bg-muted/30 uppercase tracking-tighter">{hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}</div>
                          {weekDays.map((_, i) => {
                            const date = new Date(startOfWeek)
                            date.setDate(startOfWeek.getDate() + i)
                            const dayEvents = getEventsForDay(date).filter((e: CalendarEvent) => new Date(e.startTime).getHours() === hour)
                            return (
                              <div key={i} className="border-r border-border p-1 relative hover:bg-muted/10 transition-colors">
                                {dayEvents.map((event: CalendarEvent) => (
                                  <div
                                    key={event.id}
                                    className={`${typeColors[event.type] || 'bg-primary'} text-white text-[11px] p-2 rounded-lg shadow-sm mb-1 cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all`}
                                    onClick={() => handleEventClick(event)}
                                  >
                                    <div className="font-bold truncate">{event.title}</div>
                                    {event.description && <div className="truncate opacity-80 text-[9px] mt-0.5">{event.description}</div>}
                                  </div>
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  )
}
