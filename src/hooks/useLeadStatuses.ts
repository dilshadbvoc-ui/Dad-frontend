import { useQuery } from "@tanstack/react-query";
import { getOrganisation } from "@/services/settingsService";
import type { LeadStatus } from "@/services/settingsService";

export const DEFAULT_LEAD_STATUSES: LeadStatus[] = [
    { id: 'new', label: 'New', color: '#3b82f6', isSystem: true, order: 0 },
    { id: 'contacted', label: 'Contacted', color: '#f59e0b', isSystem: true, order: 1 },
    { id: 'interested', label: 'Interested', color: '#10b981', isSystem: false, order: 2 },
    { id: 'pre_qualified', label: 'Pre-qualified Lead', color: '#6366f1', isSystem: false, order: 3 },
    { id: 'qualified', label: 'Qualified Lead', color: '#8b5cf6', isSystem: true, order: 4 },
    { id: 'nurturing', label: 'Nurturing', color: '#ec4899', isSystem: false, order: 5 },
    { id: 'converted', label: 'Converted', color: '#059669', isSystem: true, order: 6 },
    { id: 'lost', label: 'Lost', color: '#6b7280', isSystem: true, order: 7 },
    { id: 'not_interested', label: 'Not Interested', color: '#ef4444', isSystem: false, order: 8 },
    { id: 're_enquiry', label: 'Re-Enquiry', color: '#f97316', isSystem: true, order: 9 }
];

export function useLeadStatuses() {
    const { data: org, isLoading } = useQuery({
        queryKey: ['organisation'],
        queryFn: getOrganisation,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const statuses: LeadStatus[] = org?.leadStatuses || DEFAULT_LEAD_STATUSES;

    const getStatusDetails = (id: string) => {
        const status = statuses.find(s => s.id === id);
        return status || { id, label: id, color: '#6b7280', isSystem: false, order: 99 };
    };

    return {
        statuses: statuses.sort((a, b) => a.order - b.order),
        getStatusDetails,
        isLoading,
        orgId: org?.id
    };
}
