import { MoonStar } from "lucide-react"
import { LeadListPage } from "./LeadListPage"
import { getNoActivityLeads } from "@/services/leadService"

export default function NoActivityLeadsPage() {
  return (
    <LeadListPage
      title="No Activity Leads"
      description="Still open, but no update in 30+ days — gone cold."
      icon={<MoonStar className="h-6 w-6" />}
      queryKey="no-activity-leads"
      queryFn={() => getNoActivityLeads({ pageSize: 500 })}
      emptyMessage="Every open lead has had activity in the last 30 days. Nothing has gone cold."
    />
  )
}
