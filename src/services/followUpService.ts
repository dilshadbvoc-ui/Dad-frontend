import { api } from './api';

export interface FollowUpTask {
    id: string;
    subject: string;
    description?: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'deferred';
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
    assignedTo?: {
        firstName: string;
        lastName: string;
        email: string;
    };
    createdBy?: {
        firstName: string;
        lastName: string;
        email: string;
    };
    relatedTo?: any;
    leadId?: string;
    onModel?: 'Lead' | 'Contact' | 'Account' | 'Opportunity';
    createdAt: string;
    updatedAt: string;
}

export interface FollowUpSearchParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}

export const getFollowUps = async (params?: FollowUpSearchParams) => {
    const response = await api.get('/follow-ups', { params });
    return response.data;
};
