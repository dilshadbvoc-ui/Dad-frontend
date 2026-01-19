import { api } from './api';

export interface Opportunity {
    id: string;
    name: string;
    amount: number;
    stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    probability: number;
    closeDate?: string;
    account: {
        _id: string;
        name: string;
    };
    contact?: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    owner?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
}

export interface OpportunityQueryParams {
    stage?: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    account?: string;
    owner?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface CreateOpportunityData {
    name: string;
    amount: number;
    stage?: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    probability?: number;
    closeDate?: string;
    account: string;
    contact?: string;
    owner?: string;
}

export type UpdateOpportunityData = Partial<CreateOpportunityData>;

export const getOpportunities = async (params?: OpportunityQueryParams) => {
    const response = await api.get('/opportunities', { params });
    return response.data;
};

export const getOpportunityById = async (id: string) => {
    const response = await api.get(`/opportunities/${id}`);
    return response.data;
};

export const createOpportunity = async (data: CreateOpportunityData) => {
    const response = await api.post('/opportunities', data);
    return response.data;
};

export const updateOpportunity = async (id: string, data: UpdateOpportunityData) => {
    const response = await api.put(`/opportunities/${id}`, data);
    return response.data;
};

export const deleteOpportunity = async (id: string) => {
    const response = await api.delete(`/opportunities/${id}`);
    return response.data;
};
