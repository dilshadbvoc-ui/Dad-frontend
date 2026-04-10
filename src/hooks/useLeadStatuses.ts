import { useQuery } from "@tanstack/react-query";
import { getOrganisation, LeadStatus } from "@/services/settingsService";

export const DEFAULT_LEAD_STATUSES: LeadStatus[] = [
    { id: 'new', label: 'New', color: '#3b82f6', isSystem: true, order: 0 },
    { id: 'contacted', label: 'Contacted', color: '#f59e0b', isSystem: true, order: 1 },
    { id: 'interested', label: 'Interested', color: '#10b981', isSystem: false, order: 2 },
    { id: 'qualified', label: 'Qualified', color: '#8b5cf6', isSystem: true, order: 3 },
    { id: 'nurturing', label: 'Nurturing', color: '#ec4899', isSystem: false, order: 4 },
    { id: 'converted', label: 'Converted', color: '#059669', isSystem: true, order: 5 },
    { id: 'lost', label: 'Lost', color: '#6b7280', isSystem: true, order: 6 },
    { id: 'not_interested', label: 'Not Interested', color: '#ef4444', isSystem: false, order: 7 },
    { id: 're_enquiry', label: 'Re-Enquiry', color: '#f97316', isSystem: true, order: 8 }
];

export function useLeadStatuses() {
    const { data: org, isLoading } = useQuery({
        queryKey: ['organisation'],
        queryFn: getOrganisation,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const statuses: LeadStatus[] = org?.organisation?.leadStatuses || DEFAULT_LEAD_STATUSES;

    const getStatusDetails = (id: string) => {
        const status = statuses.find(s => s.id === id);
        return status || { id, label: id, color: '#6b7280', isSystem: false, order: 99 };
    };

    return {
        statuses: statuses.sort((a, b) => a.order - b.order),
        getStatusDetails,
        isLoading,
        orgId: org?.organisation?.id
    };
}
