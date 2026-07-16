import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, X } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useLeadStatuses } from "@/hooks/useLeadStatuses"
import { getOrganisation, updateOrganisation, triggerShuffleNow, getBranches } from "@/services/settingsService"
import { getUsers } from "@/services/userService"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getUserInfo, isAdmin, isSuperAdmin } from "@/lib/utils"
import { DatePicker, TimePicker } from "antd"
import dayjs from "dayjs"

export default function ShufflerSettingsPage() {
  const { statuses } = useLeadStatuses()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const user = getUserInfo()
  const hasAccess = user && (isAdmin(user) || isSuperAdmin(user))

  const [selectedStatus, setSelectedStatus] = useState("")
  const [shufflingLeads, setShufflingLeads] = useState("")
  const [shuffleBefore, setShuffleBefore] = useState("")
  const [shuffleTime, setShuffleTime] = useState("")
  const [isAutoShufflingOn, setIsAutoShufflingOn] = useState(false)

  const [branchDropdownVal, setBranchDropdownVal] = useState("")
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([])
  const [selectAllBranches, setSelectAllBranches] = useState(false)

  const [userDropdownVal, setUserDropdownVal] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectAllUsers, setSelectAllUsers] = useState(false)

  const [timeFrameType, setTimeFrameType] = useState("days_before")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [backwardsDate, setBackwardsDate] = useState("")

  const { data: org, isLoading } = useQuery({
    queryKey: ['organisation'],
    queryFn: getOrganisation
  })

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers()
  })

  const branchList = Array.isArray(branches) ? branches : (branches?.branches || []);
  const userList = Array.isArray(users) ? (users as any) : ((users as any)?.users || []);

  const excludedRoles = ['super_admin', 'admin'];
  const filteredUsers = userList.filter((u: any) => {
    // If branches are selected, only show users belonging to those branches
    if (selectedBranchIds.length > 0 && (!u.branch || !selectedBranchIds.includes(u.branch.id))) {
      return false;
    }
    const roleName = u.role?.name?.toLowerCase() || '';
    const roleKey = u.role?.roleKey?.toLowerCase() || '';
    const isExcluded = roleName.includes('admin') || roleKey.includes('admin') || excludedRoles.includes(roleKey);
    return !isExcluded;
  });

  useEffect(() => {
    if (org?.shufflerConfig) {
      setShufflingLeads(org.shufflerConfig.statuses?.join('\n') || "")
      setShuffleBefore(org.shufflerConfig.shuffleBeforeDays?.toString() || "")
      setShuffleTime(org.shufflerConfig.shuffleTime || "")
      setIsAutoShufflingOn(org.shufflerConfig.isAutoShufflingOn || false)
      
      let initBranchIds = org.shufflerConfig.branches || [];
      if (org.shufflerConfig.selectAllBranches && branchList.length > 0) {
         initBranchIds = branchList.map((b: any) => b.id);
      }
      setSelectedBranchIds(initBranchIds)
      setSelectAllBranches(false)
      
      let initUserIds = org.shufflerConfig.users || [];
      if (org.shufflerConfig.selectAllUsers && userList.length > 0) {
         const filtered = userList.filter((u: any) => {
            if (initBranchIds.length > 0 && (!u.branch || !initBranchIds.includes(u.branch.id))) return false;
            const roleName = u.role?.name?.toLowerCase() || '';
            const roleKey = u.role?.roleKey?.toLowerCase() || '';
            return !(roleName.includes('admin') || roleKey.includes('admin') || excludedRoles.includes(roleKey));
         });
         initUserIds = filtered.map((u: any) => u.id);
      }
      setSelectedUserIds(initUserIds)
      setSelectAllUsers(false)
      
      setTimeFrameType(org.shufflerConfig.timeFrameType || "days_before")
      setFromDate(org.shufflerConfig.fromDate || "")
      setToDate(org.shufflerConfig.toDate || "")
      setBackwardsDate(org.shufflerConfig.backwardsDate || "")
    }
  }, [org, branchList.length, userList.length])

  const mutation = useMutation({
    mutationFn: updateOrganisation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisation'] })
      toast.success("Shuffler settings saved successfully")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to save settings")
    }
  })

  const shuffleNowMutation = useMutation({
    mutationFn: triggerShuffleNow,
    onSuccess: (data) => {
      toast.success(data.message || "Shuffle completed successfully")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to execute shuffle")
    }
  })

  const handleSave = () => {
    mutation.mutate({
      shufflerConfig: {
        ...(org?.shufflerConfig || {}),
        statuses: shufflingLeads.split('\n').map(s => s.trim()).filter(Boolean),
        shuffleBeforeDays: parseInt(shuffleBefore) || 0,
        shuffleTime: shuffleTime,
        isAutoShufflingOn: isAutoShufflingOn,
        branches: selectedBranchIds,
        selectAllBranches,
        users: selectedUserIds,
        selectAllUsers,
        timeFrameType,
        fromDate,
        toDate,
        backwardsDate
      }
    })
  }

  const handleShuffleNow = () => {
    // Save first, then trigger shuffle on success
    mutation.mutate({
      shufflerConfig: {
        ...(org?.shufflerConfig || {}),
        statuses: shufflingLeads.split('\n').map(s => s.trim()).filter(Boolean),
        shuffleBeforeDays: parseInt(shuffleBefore) || 0,
        shuffleTime: shuffleTime,
        isAutoShufflingOn: isAutoShufflingOn,
        branches: selectedBranchIds,
        selectAllBranches,
        users: selectedUserIds,
        selectAllUsers,
        timeFrameType,
        fromDate,
        toDate,
        backwardsDate
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['organisation'] });
        shuffleNowMutation.mutate();
      }
    });
  }

  const filteredStatuses = statuses.filter(
    (status) => status.id !== "won" && status.id !== "lost" && status.id !== "closed_won" && status.id !== "closed_lost"
  )

  const handleStatusSelect = (val: string) => {
    if (!val) return;

    setShufflingLeads(prev => {
      const currentList = prev.split('\n').map(s => s.trim()).filter(Boolean);
      if (!currentList.includes(val)) {
        currentList.push(val);
      }
      return currentList.join('\n');
    });

    // Auto reset the dropdown list for next selection
    setTimeout(() => setSelectedStatus(""), 0);
  }

  const removeStatus = (statusToRemove: string) => {
    setShufflingLeads(prev => {
      const currentList = prev.split('\n').map(s => s.trim()).filter(Boolean);
      return currentList.filter(s => s !== statusToRemove).join('\n');
    });
  }

  const handleBranchSelect = (val: string) => {
    if (!val) return;
    if (val === "ALL") {
      setSelectAllBranches(false);
      setSelectedBranchIds(branchList.map((b: any) => b.id));
      setTimeout(() => setBranchDropdownVal(""), 0);
      return;
    }
    setSelectAllBranches(false);
    setSelectedBranchIds(prev => {
      if (!prev.includes(val)) return [...prev, val];
      return prev;
    });
    setTimeout(() => setBranchDropdownVal(""), 0);
  }

  const removeBranch = (branchId: string) => {
    setSelectedBranchIds(prev => prev.filter(id => id !== branchId));

    // Also remove any users from Users (Selected) who belong to this removed branch
    const currentUserList = Array.isArray(users) ? (users as any) : ((users as any)?.users || []);
    setSelectedUserIds(prev => prev.filter(userId => {
      const userObj = currentUserList.find((u: any) => u.id === userId);
      return userObj?.branch?.id !== branchId;
    }));
  }

  const handleUserSelect = (val: string) => {
    if (!val) return;
    if (val === "ALL") {
      setSelectAllUsers(false);
      setSelectedUserIds(filteredUsers.map((u: any) => u.id));
      setTimeout(() => setUserDropdownVal(""), 0);
      return;
    }
    setSelectAllUsers(false);
    setSelectedUserIds(prev => {
      if (!prev.includes(val)) return [...prev, val];
      return prev;
    });
    setTimeout(() => setUserDropdownVal(""), 0);
  }

  const removeUser = (userId: string) => {
    setSelectedUserIds(prev => prev.filter(id => id !== userId));
  }

  const selectedList = shufflingLeads.split('\n').map(s => s.trim()).filter(Boolean);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Set Shuffler</h2>
          <p className="text-muted-foreground">
            Configure lead shuffling settings for your organisation.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shuffler Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This is the Set Shuffler. You can shuffle the leads and assign them to team members in a fair and balanced way. You can set rules to control how the leads are shuffled and assigned.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 max-w-5xl">
            {/* Left Column */}
            <div className="space-y-6 flex flex-col">
              <div className="flex items-center justify-between border border-border p-4 rounded-lg">
                <div>
                  <Label className="text-base font-semibold">Auto Shuffling</Label>
                  <p className="text-sm text-muted-foreground">Turn the automatic lead shuffler on or off</p>
                </div>
                <Switch
                  checked={isAutoShufflingOn}
                  onCheckedChange={setIsAutoShufflingOn}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-status">Lead Status</Label>
                <Select value={selectedStatus} onValueChange={handleStatusSelect}>
                  <SelectTrigger id="lead-status">
                    <SelectValue placeholder="Select lead status" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch-select">Branches</Label>
                <Select value={branchDropdownVal} onValueChange={handleBranchSelect}>
                  <SelectTrigger id="branch-select">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="font-semibold text-primary">All Branches</SelectItem>
                    {branchList.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-select">Users</Label>
                <Select value={userDropdownVal} onValueChange={handleUserSelect}>
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="font-semibold text-primary">All Users</SelectItem>
                    {filteredUsers.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 mt-auto pt-2">
                <div className="space-y-2">
                  <Label>Lead Date Filter</Label>
                  <Select value={timeFrameType} onValueChange={setTimeFrameType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select how to filter leads by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days_before">Auto Schedule Interval</SelectItem>
                      <SelectItem value="date_range">Between Specific Dates</SelectItem>
                      <SelectItem value="backwards_from_date">Older than Specific Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {timeFrameType === "days_before" && (
                  <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="shuffle-before">Repeat Interval (Days)</Label>
                      <Input
                        id="shuffle-before"
                      type="number"
                      min="0"
                      value={shuffleBefore}
                      onChange={(e) => setShuffleBefore(e.target.value)}
                        placeholder="e.g. 0 for daily, 1 for every 1 day"
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label>Schedule Time</Label>
                      <TimePicker
                        value={shuffleTime ? dayjs(`2000-01-01T${shuffleTime}`) : null}
                        onChange={(time) => {
                          if (time) {
                            setShuffleTime(time.format('HH:mm'));
                          } else {
                            setShuffleTime("");
                          }
                        }}
                        format="hh:mm A"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Select time"
                      />
                    </div>
                  </div>
                )}

                {timeFrameType === "date_range" && (
                  <div className="flex gap-4">
                    <div className="space-y-2 flex-1 flex flex-col">
                      <Label htmlFor="from-date" className="mb-2">From Date</Label>
                      <DatePicker
                        value={fromDate ? dayjs(fromDate) : null}
                        onChange={(date) => setFromDate(date ? date.format('YYYY-MM-DD') : "")}
                        format="DD/MM/YYYY"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Select from date"
                      />
                    </div>
                    <div className="space-y-2 flex-1 flex flex-col">
                      <Label htmlFor="to-date" className="mb-2">To Date</Label>
                      <DatePicker
                        value={toDate ? dayjs(toDate) : null}
                        onChange={(date) => setToDate(date ? date.format('YYYY-MM-DD') : "")}
                        format="DD/MM/YYYY"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Select to date"
                      />
                    </div>
                  </div>
                )}

                {timeFrameType === "backwards_from_date" && (
                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="backwards-date" className="mb-2">Leads Before This Date</Label>
                    <DatePicker
                      value={backwardsDate ? dayjs(backwardsDate) : null}
                      onChange={(date) => setBackwardsDate(date ? date.format('YYYY-MM-DD') : "")}
                      format="DD/MM/YYYY"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Select backwards date"
                    />
                  </div>
                )}

                {isAutoShufflingOn && timeFrameType !== "days_before" && (
                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="shuffle-time" className="mb-2">Daily Shuffle Time (Auto)</Label>
                    <TimePicker
                      value={shuffleTime ? dayjs(`2000-01-01T${shuffleTime}`) : null}
                      onChange={(time) => {
                        if (time) {
                          setShuffleTime(time.format('HH:mm'));
                        } else {
                          setShuffleTime("");
                        }
                      }}
                      format="hh:mm A"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Select time"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleSave}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Saving..." : "Set Shuffler"}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  type="button"
                  onClick={handleShuffleNow}
                  disabled={shuffleNowMutation.isPending}
                >
                  {shuffleNowMutation.isPending ? "Shuffling..." : "Shuffle Now"}
                </Button>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="space-y-2 flex flex-col">
                <Label>Shuffling Leads (Selected)</Label>
                <div className="w-full rounded-md border border-input bg-transparent px-3 py-3 text-sm shadow-sm flex flex-wrap gap-2 content-start min-h-[100px]">
                  {selectedList.length > 0 ? (
                    selectedList.map((statusId, index) => {
                      const statusObj = statuses.find(s => s.id === statusId);
                      const label = statusObj ? statusObj.label : statusId;
                      return (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 text-sm py-1 h-fit">
                          {label}
                          <button
                            type="button"
                            onClick={() => removeStatus(statusId)}
                            className="text-muted-foreground hover:text-foreground focus:outline-none ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })
                  ) : (
                    <span className="text-muted-foreground w-full text-center mt-4">No lead statuses selected...</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>Branches (Selected)</Label>
                <div className="w-full rounded-md border border-input bg-transparent px-3 py-3 text-sm shadow-sm flex flex-wrap gap-2 content-start min-h-[100px]">
                  {selectAllBranches ? (
                    <Badge variant="secondary" className="flex items-center gap-1 text-sm py-1 h-fit">
                      All Branches
                      <button
                        type="button"
                        onClick={() => setSelectAllBranches(false)}
                        className="text-muted-foreground hover:text-foreground focus:outline-none ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : selectedBranchIds.length > 0 ? (
                    selectedBranchIds.map((branchId, index) => {
                      const branchObj = branchList.find((b: any) => b.id === branchId);
                      const label = branchObj ? branchObj.name : branchId;
                      return (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 text-sm py-1 h-fit">
                          {label}
                          <button
                            type="button"
                            onClick={() => removeBranch(branchId)}
                            className="text-muted-foreground hover:text-foreground focus:outline-none ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })
                  ) : (
                    <span className="text-muted-foreground w-full text-center mt-4">No branches selected...</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>Users (Selected)</Label>
                <div className="w-full rounded-md border border-input bg-transparent px-3 py-3 text-sm shadow-sm flex flex-wrap gap-2 content-start min-h-[100px]">
                  {selectAllUsers ? (
                    <Badge variant="secondary" className="flex items-center gap-1 text-sm py-1 h-fit">
                      All Users
                      <button
                        type="button"
                        onClick={() => setSelectAllUsers(false)}
                        className="text-muted-foreground hover:text-foreground focus:outline-none ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : selectedUserIds.length > 0 ? (
                    selectedUserIds.map((userId, index) => {
                      const userObj = userList.find((u: any) => u.id === userId);
                      const label = userObj ? `${userObj.firstName} ${userObj.lastName}` : userId;
                      return (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 text-sm py-1 h-fit">
                          {label}
                          <button
                            type="button"
                            onClick={() => removeUser(userId)}
                            className="text-muted-foreground hover:text-foreground focus:outline-none ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })
                  ) : (
                    <span className="text-muted-foreground w-full text-center mt-4">No users selected...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
