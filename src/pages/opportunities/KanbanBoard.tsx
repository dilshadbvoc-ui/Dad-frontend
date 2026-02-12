import { useState, useMemo } from "react";
import { type Opportunity, updateOpportunity } from "@/services/opportunityService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";
import { MoreHorizontal, DollarSign, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { differenceInDays } from "date-fns";

interface KanbanBoardProps {
    opportunities: Opportunity[];
}

const STAGES: { id: string; label: string; color: string }[] = [
    { id: "prospecting", label: "Prospecting", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
    { id: "qualification", label: "Qualification", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
    { id: "proposal", label: "Proposal", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
    { id: "negotiation", label: "Negotiation", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
    { id: "closed_won", label: "Closed Won", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
    { id: "closed_lost", label: "Closed Lost", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
];

export function KanbanBoard({ opportunities: initialOpportunities }: KanbanBoardProps) {
    const [opportunities, setOpportunities] = useState(initialOpportunities);

    // Group opportunities by stage
    const columns = useMemo(() => {
        const cols: Record<string, Opportunity[]> = {};
        STAGES.forEach((stage) => (cols[stage.id] = []));

        opportunities.forEach((opp) => {
            const stage = opp.stage || "prospecting";
            if (!cols[stage]) {
                if (cols["prospecting"]) cols["prospecting"].push(opp);
            } else {
                cols[stage].push(opp);
            }
        });
        return cols;
    }, [opportunities]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("text/plain", id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");

        // Optimistic update
        setOpportunities(prev => prev.map(opp =>
            opp.id === id ? { ...opp, stage: stageId as Opportunity['stage'], updatedAt: new Date().toISOString() } : opp
        ));

        try {
            await updateOpportunity(id, { stage: stageId as Opportunity['stage'] });
        } catch (error) {
            console.error("Failed to update opportunity stage:", error);
            // Revert on failure (reload from props or fetch)
        }
    };

    return (
        <div className="flex h-full overflow-x-auto gap-4 pb-4">
            <TooltipProvider>
                {STAGES.map((stage) => {
                    const stageOpps = columns[stage.id] || [];
                    const totalValue = stageOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);

                    return (
                        <div
                            key={stage.id}
                            className="flex-shrink-0 w-80 bg-muted/50 rounded-xl border border-border flex flex-col"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage.id)}
                        >
                            <div className="p-3 border-b border-border flex flex-col gap-2 bg-background/50 backdrop-blur-sm sticky top-0 rounded-t-xl z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className={`${stage.color} font-semibold`}>
                                            {stage.label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground font-medium bg-background px-1.5 py-0.5 rounded-md border border-border">
                                            {stageOpps.length}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-muted-foreground pl-1">
                                    {formatCurrency(totalValue)}
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-3">
                                <div className="flex flex-col gap-3">
                                    {stageOpps.map((opp) => {
                                        const daysInStage = differenceInDays(new Date(), new Date(opp.updatedAt));
                                        const isStagnant = daysInStage > 30;
                                        const isWarning = daysInStage > 14 && daysInStage <= 30;

                                        return (
                                            <Card
                                                key={opp.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, opp.id)}
                                                className={`cursor-move hover:shadow-md transition-all duration-200 border-border bg-card group ${isStagnant ? 'border-l-4 border-l-destructive' : isWarning ? 'border-l-4 border-l-warning' : ''
                                                    }`}
                                            >
                                                <CardContent className="p-3 space-y-3">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="space-y-1">
                                                            {opp.account && (
                                                                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate max-w-[150px]">
                                                                    {opp.account.name}
                                                                </div>
                                                            )}
                                                            <div className="flex items-start gap-2">
                                                                <h4 className="font-semibold text-sm line-clamp-2 text-card-foreground leading-tight">
                                                                    {opp.name}
                                                                </h4>
                                                                {opp.paymentStatus === 'paid' && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <CheckCircle2 className="h-4 w-4 text-success fill-success/10" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Payment Complete</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem>Edit</DropdownMenuItem>

                                                                <DropdownMenuSub>
                                                                    <DropdownMenuSubTrigger>Move to Stage</DropdownMenuSubTrigger>
                                                                    <DropdownMenuPortal>
                                                                        <DropdownMenuSubContent>
                                                                            {STAGES.map((s) => (
                                                                                <DropdownMenuItem
                                                                                    key={s.id}
                                                                                    disabled={s.id === opp.stage}
                                                                                    onClick={() => {
                                                                                        const mockEvent = {
                                                                                            preventDefault: () => { },
                                                                                            dataTransfer: {
                                                                                                getData: () => opp.id
                                                                                            }
                                                                                        } as unknown as React.DragEvent;
                                                                                        handleDrop(mockEvent, s.id);
                                                                                        toast.success(`Moved to ${s.label}`);
                                                                                    }}
                                                                                >
                                                                                    {s.label}
                                                                                </DropdownMenuItem>
                                                                            ))}
                                                                        </DropdownMenuSubContent>
                                                                    </DropdownMenuPortal>
                                                                </DropdownMenuSub>

                                                                {opp.stage === 'closed_won' && opp.paymentStatus !== 'paid' && (
                                                                    <DropdownMenuItem
                                                                        onClick={async () => {
                                                                            // Optimistic update
                                                                            setOpportunities(prev => prev.map(o =>
                                                                                o.id === opp.id ? { ...o, paymentStatus: 'paid', paymentDate: new Date().toISOString() } : o
                                                                            ));
                                                                            try {
                                                                                await updateOpportunity(opp.id, { paymentStatus: 'paid', paymentDate: new Date().toISOString() });
                                                                                toast.success("Marked as Paid");
                                                                            } catch {
                                                                                toast.error("Failed to update status");
                                                                                // Revert
                                                                            }
                                                                        }}
                                                                        className="text-success focus:text-success focus:bg-success/10"
                                                                    >
                                                                        Mark as Paid
                                                                    </DropdownMenuItem>
                                                                )}

                                                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-border text-muted-foreground">
                                                            {opp.leadSource || 'Direct'}
                                                        </Badge>
                                                        {(isStagnant || isWarning) && (
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <div className={`p-0.5 rounded-full ${isStagnant ? 'text-destructive bg-destructive/10' : 'text-warning bg-warning/10'}`}>
                                                                        <AlertCircle className="h-3 w-3" />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>No activity for {daysInStage} days</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>

                                                    <div className="flex items-end justify-between pt-2 border-t border-border mt-1">
                                                        <div className="space-y-1">
                                                            {opp.amount > 0 && (
                                                                <div className="flex items-center gap-1.5 text-sm text-card-foreground font-bold">
                                                                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    {formatCurrency(opp.amount)}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                                <Calendar className="h-3 w-3" />
                                                                {opp.closeDate ? new Date(opp.closeDate).toLocaleDateString() : 'No date'}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                                {opp.probability}%
                                                            </div>
                                                            {opp.owner && (
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <Avatar className="h-6 w-6 border border-background shadow-sm">
                                                                            <AvatarImage src={opp.owner.profileImage} />
                                                                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                                                                {opp.owner.firstName?.[0]}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Owner: {opp.owner.firstName} {opp.owner.lastName}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </div>
                    );
                })}
            </TooltipProvider >
        </div >
    );
}
