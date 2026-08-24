import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCommissions, createCommission, updateCommission, deleteCommission, type Commission } from "@/services/commissionService";
import { getUsers } from "@/services/settingsService";
import { getUserInfo, isAdmin } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Calendar, DollarSign, Award, Clock3, CheckCircle2, Wallet } from "lucide-react";
import { formatIST } from "@/lib/dateUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY_FORM = {
  userId: "",
  amount: "",
  type: "commission",
  description: "",
  status: "pending",
};

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?";
}

export default function CommissionsPage() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();
  const currentUser = getUserInfo();
  const canManage = isAdmin(currentUser);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions'],
    queryFn: getCommissions
  });

  // Only admins need the recipient picker — reps only ever see (and create
  // nothing for) their own commissions, so skip fetching the user list for them.
  const { data: userData } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => getUsers(),
    enabled: canManage,
  });
  const users = userData?.users || [];

  const summary = useMemo(() => {
    return commissions.reduce(
      (acc, c) => {
        acc.total += c.amount;
        if (c.status === 'pending') acc.pending += c.amount;
        if (c.status === 'approved') acc.approved += c.amount;
        if (c.status === 'paid') acc.paid += c.amount;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, paid: 0 }
    );
  }, [commissions]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      createCommission({ ...data, amount: typeof data.amount === 'string' ? parseFloat(data.amount) : (data.amount as number) } as unknown as Commission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success("Commission added successfully");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Failed to add commission");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Record<string, unknown> }) =>
      updateCommission(id, { ...data, amount: typeof data.amount === 'string' ? parseFloat(data.amount) : (data.amount as number) } as unknown as Commission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success("Commission updated successfully");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Failed to update commission");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success("Commission deleted");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Failed to delete commission");
    }
  });

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.type || !formData.userId) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item: Commission) => {
    setFormData({
      userId: item.userId,
      amount: item.amount.toString(),
      type: item.type,
      description: item.description || "",
      status: item.status
    });
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isFormValid = !!formData.amount && !!formData.type && !!formData.userId;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            {canManage ? "Sales Commissions" : "My Commissions & Incentives"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {canManage
              ? "Award and track commissions or bonuses for your sales team."
              : "Track your commissions, bonuses, and incentive payouts."}
          </p>
        </div>

        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25 rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Commission
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Commission' : 'Add Commission'}</DialogTitle>
                <DialogDescription>
                  Record a commission, bonus, or incentive for a team member.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="userId">Team Member</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(val) => setFormData({ ...formData, userId: val })}
                    disabled={!!editingId}
                  >
                    <SelectTrigger id="userId">
                      <SelectValue placeholder="Select who this is for" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                          {u.role?.name ? ` — ${u.role.name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editingId && (
                    <p className="text-xs text-muted-foreground">Recipient can't be changed after creation.</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-9"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(val) => setFormData({ ...formData, type: val })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commission">Commission</SelectItem>
                        <SelectItem value="bonus">Bonus</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="e.g. Q4 Performance Bonus"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSaving || !isFormValid}>
                  {isSaving ? 'Saving...' : 'Save Commission'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Total Recorded</div>
              <div className="text-lg font-bold truncate">{formatCurrency(summary.total)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Clock3 className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Pending</div>
              <div className="text-lg font-bold truncate">{formatCurrency(summary.pending)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Approved</div>
              <div className="text-lg font-bold truncate">{formatCurrency(summary.approved)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Paid Out</div>
              <div className="text-lg font-bold truncate">{formatCurrency(summary.paid)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
          <CardDescription>
            {canManage ? "All recorded commissions and payouts across your team." : "Your recorded commissions and payouts."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading commissions...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {canManage && <TableHead>Team Member</TableHead>}
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length > 0 ? (
                  commissions.map((item: Commission) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatIST(item.date, 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {initials(item.user?.firstName, item.user?.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown user'}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{item.description || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="capitalize">{item.type}</TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'paid' ? 'default' :
                              item.status === 'approved' ? 'secondary' :
                                item.status === 'rejected' ? 'destructive' : 'outline'
                          }
                          className={item.status === 'paid' ? 'bg-green-600 hover:bg-green-600' : ''}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(item.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canManage ? 7 : 5} className="h-24 text-center text-muted-foreground">
                      {canManage ? "No commissions recorded yet." : "You don't have any commissions recorded yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
