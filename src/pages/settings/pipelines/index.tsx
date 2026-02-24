import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPipelines, createPipeline, deletePipeline, type Pipeline } from "@/services/pipelineService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, GitBranch, ArrowRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";


export default function PipelinesPage() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        stagesStr: "New, Qualified, Proposal, Negotiation, Closed Won, Closed Lost"
    });

    const { data: pipelines = [], isLoading } = useQuery({
        queryKey: ['pipelines'],
        queryFn: getPipelines
    });

    const createMutation = useMutation({
        mutationFn: (data: { name: string, stagesStr: string }) => createPipeline({
            name: data.name,
            stages: data.stagesStr.split(',').map((s: string, i: number) => ({
                name: s.trim(),
                order: i,
                color: '#3b82f6' // Default blue
            })),
            isDefault: false
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pipelines'] });
            setIsDialogOpen(false);
            setFormData({
                name: "",
                stagesStr: "New, Qualified, Proposal, Negotiation, Closed Won, Closed Lost"
            });
            toast.success("Pipeline created");
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || "Failed to create pipeline");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deletePipeline,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pipelines'] });
            toast.success("Pipeline deleted");
        },
        onError: () => {
            toast.error("Failed to delete pipeline (It might be in use)");
        }
    });

    const handleSubmit = () => {
        if (!formData.name) return;
        createMutation.mutate(formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Pipelines</h1>
                    <p className="text-muted-foreground mt-1">Configure deal stages and multiple pipelines.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 rounded-xl">
                            <Plus className="h-4 w-4 mr-2" />
                            New Pipeline
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Pipeline</DialogTitle>
                            <DialogDescription>
                                Define a new sales process with comma-separated stages.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Pipeline Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Enterprise Sales"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="stages">Stages (Comma Separated)</Label>
                                <Input
                                    id="stages"
                                    placeholder="Stage 1, Stage 2, Stage 3..."
                                    value={formData.stagesStr}
                                    onChange={(e) => setFormData({ ...formData, stagesStr: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Order matters. Left to right.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating...' : 'Create Pipeline'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="text-center py-10 text-muted-foreground">Loading pipelines...</div>
                ) : pipelines.length > 0 ? (
                    pipelines.map((pipeline: Pipeline) => (
                        <Card key={pipeline.id}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                                        {pipeline.isDefault && (
                                            <Badge variant="secondary">Default</Badge>
                                        )}
                                    </div>
                                    <CardDescription>Created on {new Date(pipeline.createdAt).toLocaleDateString()}</CardDescription>
                                </div>
                                {!pipeline.isDefault && (
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteMutation.mutate(pipeline.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                    {pipeline.stages?.map((stage, index) => (
                                        <div key={stage.id || index} className="flex items-center shrink-0">
                                            <div className="px-3 py-1 bg-muted rounded-md text-sm font-medium border border-border text-foreground">
                                                {stage.name}
                                            </div>
                                            {index < pipeline.stages.length - 1 && (
                                                <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                        <GitBranch className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium text-foreground">No Pipelines Found</h3>
                        <p className="text-muted-foreground">Create your first sales pipeline to manage opportunities.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
