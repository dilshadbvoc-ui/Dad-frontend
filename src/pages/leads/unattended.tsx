import { UserX } from "lucide-react"
import { LeadListPage } from "./LeadListPage"
import { getUnattendedLeads } from "@/services/leadService"

export default function UnattendedLeadsPage() {
  return (
    <LeadListPage
      title="Unattended Leads"
      description={'Assigned to a rep but never contacted — still sitting in "New".'}
      icon={<UserX className="h-6 w-6" />}
      queryKey="unattended-leads"
      queryFn={({ branchId, startDate, endDate }) => getUnattendedLeads({ pageSize: 2000, branchId, startDate, endDate })}
      emptyMessage="Every assigned lead has been contacted. Nothing is sitting untouched right now."
    />
  )
}
