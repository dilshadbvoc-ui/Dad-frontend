import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { getCommissions, createCommission, updateCommission, deleteCommission, type Commission } from "@/services/commissionService";
import { getUsers } from "@/services/settingsService";
import { getUserInfo, isAdmin } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Calendar, DollarSign, Wallet, Search, Filter, Users, X, Download } from "lucide-react";
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
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";
import { FILTER_CARD_CLASS, FILTER_ICON_CLASS, FILTER_LABEL_CLASS, FILTER_TRIGGER_CLASS } from "@/pages/leads/filterStyles";

const EMPTY_FORM = {
  userId: "",
  amount: "",
  type: "commission",
  description: "",
  status: "pending",
};

type StatusFilter = "all" | "pending" | "approved" | "paid" | "rejected";
type TypeFilter = "all" | "commission" | "bonus" | "adjustment";

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?";
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  paid: "bg-green-600 hover:bg-green-600 text-white",
};
const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  approved: "secondary",
  rejected: "destructive",
  pending: "outline",
};

export default function CommissionsPage() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();
  const currentUser = getUserInfo();
  const canManage = isAdmin(currentUser);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [deletingItem, setDeletingItem] = useState<Commission | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [memberFilter, setMemberFilter] = useState("all");

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

  const hasActiveFilters = !!searchTerm || statusFilter !== "all" || typeFilter !== "all" || memberFilter !== "all";
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setMemberFilter("all");
  };

  const filteredCommissions = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return commissions.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (memberFilter !== "all" && c.userId !== memberFilter) return false;
      if (searchTerm) {
        const memberName = c.user ? `${c.user.firstName} ${c.user.lastName}` : '';
        return (
          c.description?.toLowerCase().includes(searchLower) ||
          memberName.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [commissions, searchTerm, statusFilter, typeFilter, memberFilter]);

  const summary = useMemo(() => {
    return filteredCommissions.reduce(
      (acc, c) => {
        acc.total += c.amount;
        if (c.status === 'pending') acc.pending += c.amount;
        if (c.status === 'approved') acc.approved += c.amount;
        if (c.status === 'paid') acc.paid += c.amount;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, paid: 0 }
    );
  }, [filteredCommissions]);

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
      setDeletingItem(null);
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

  const handleExport = () => {
    if (filteredCommissions.length === 0) return;

    const excelData = filteredCommissions.map((c) => ({
      'Date': c.date ? formatIST(c.date, 'yyyy-MM-dd') : '',
      ...(canManage ? { 'Team Member': c.user ? `${c.user.firstName} ${c.user.lastName}` : '' } : {}),
      'Description': c.description || '',
      'Type': c.type,
      'Amount': c.amount,
      'Status': c.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commissions');
    XLSX.writeFile(workbook, `commissions_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isFormValid = !!formData.amount && !!formData.type && !!formData.userId;

  const stats = [
    { label: "Total", value: formatCurrency(summary.total), icon: Wallet, accent: "bg-[hsl(var(--chart-5))]" },
    { label: "Pending", value: formatCurrency(summary.pending), icon: Calendar, accent: "bg-amber-500" },
    { label: "Approved", value: formatCurrency(summary.approved), icon: Filter, accent: "bg-[hsl(var(--chart-2))]" },
    { label: "Paid Out", value: formatCurrency(summary.paid), icon: DollarSign, accent: "bg-emerald-600" },
  ];

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight flex items-center gap-2.5">
              {canManage ? "Sales Commissions" : "My Commissions"}
              <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-sm font-bold">
                {commissions.length.toLocaleString()}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {canManage
                ? "Award and track commissions or bonuses for your sales team"
                : "Track your commissions, bonuses, and incentive payouts"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            disabled={filteredCommissions.length === 0}
            variant="outline"
            className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          {canManage && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-semibold bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/90">
                  <Plus className="h-3.5 w-3.5" />
                  Add Commission
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      {/* Stats row */}
      <div className="rounded-[10px] bg-card border border-border overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-border">
          {stats.map((tile) => (
            <div key={tile.label} className="relative flex flex-col items-center justify-center gap-1 px-4 py-4">
              <span className={`absolute top-0 left-0 right-0 h-0.5 ${tile.accent} opacity-70`} />
              <span className="text-xs font-poppins text-muted-foreground">{tile.label}</span>
              <span className="text-lg sm:text-xl font-medium font-poppins text-black truncate max-w-full">{tile.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <div className={FILTER_CARD_CLASS}>
          <Search className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Search</label>
            <input
              placeholder="Description, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-0 p-0 text-sm font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <Filter className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Status</label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="all" className="rounded-lg">All Statuses</SelectItem>
                <SelectItem value="pending" className="rounded-lg">Pending</SelectItem>
                <SelectItem value="approved" className="rounded-lg">Approved</SelectItem>
                <SelectItem value="paid" className="rounded-lg">Paid</SelectItem>
                <SelectItem value="rejected" className="rounded-lg">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <DollarSign className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Type</label>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="all" className="rounded-lg">All Types</SelectItem>
                <SelectItem value="commission" className="rounded-lg">Commission</SelectItem>
                <SelectItem value="bonus" className="rounded-lg">Bonus</SelectItem>
                <SelectItem value="adjustment" className="rounded-lg">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {canManage && (
          <div className={FILTER_CARD_CLASS}>
            <Users className={FILTER_ICON_CLASS} />
            <div className="min-w-0 flex-1">
              <label className={FILTER_LABEL_CLASS}>Team Member</label>
              <Select value={memberFilter} onValueChange={setMemberFilter}>
                <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl shadow-2xl border-border/50">
                  <SelectItem value="all" className="rounded-lg">Everyone</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id} className="rounded-lg">{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-3 -mt-1">
          <Button variant="ghost" onClick={clearFilters} className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10 rounded-[10px] font-bold gap-1.5">
            <X className="h-3.5 w-3.5" />
            Reset Filters
          </Button>
          <span className="text-xs text-muted-foreground">
            Showing {filteredCommissions.length} of {commissions.length}
          </span>
        </div>
      )}

      {/* Commission History */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--chart-5))]" />
        </div>
      ) : filteredCommissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[14px] border border-border bg-card">
          <div className="h-12 w-12 rounded-[10px] bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Wallet className="h-6 w-6" />
          </div>
          <p className="font-semibold text-lg text-foreground">
            {hasActiveFilters ? "No matching commissions" : "No commissions recorded yet"}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            {hasActiveFilters
              ? "Try adjusting your search or filters."
              : canManage ? "Add a commission to get started." : "Nothing recorded for you yet."}
          </p>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="mt-4 h-8 px-3 text-xs rounded-[10px] font-bold text-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/10">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-2.5 lg:hidden">
            {filteredCommissions.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {canManage && item.user && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                              {initials(item.user.firstName, item.user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate">{item.user.firstName} {item.user.lastName}</span>
                        </div>
                      )}
                      <p className="text-sm text-foreground truncate">{item.description || <span className="text-muted-foreground">No description</span>}</p>
                    </div>
                    <Badge
                      variant={STATUS_BADGE_VARIANT[item.status] || 'outline'}
                      className={`capitalize shrink-0 ${STATUS_BADGE_CLASS[item.status] || ''}`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 capitalize">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatIST(item.date, 'MMM d, yyyy')} · {item.type}
                    </span>
                    <span className="text-base font-bold text-foreground">{formatCurrency(item.amount)}</span>
                  </div>
                  {canManage && (
                    <div className="flex items-center justify-end gap-1 pt-1 border-t border-border">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => handleEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => setDeletingItem(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block rounded-[10px] border border-border bg-card overflow-hidden">
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
                {filteredCommissions.map((item: Commission) => (
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
                        variant={STATUS_BADGE_VARIANT[item.status] || 'outline'}
                        className={`capitalize ${STATUS_BADGE_CLASS[item.status] || ''}`}
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
                            onClick={() => setDeletingItem(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <DeleteConfirmationDialog
        open={!!deletingItem}
        onOpenChange={(open) => { if (!open) setDeletingItem(null) }}
        onConfirm={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
        title="Delete Commission"
        description={`Are you sure you want to delete this ${deletingItem?.type || 'commission'} record${deletingItem?.user ? ` for ${deletingItem.user.firstName} ${deletingItem.user.lastName}` : ''}? This action cannot be undone.`}
        confirmText="Delete Commission"
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
