import { api } from './api';

export interface EmailList {
    id: string;
    name: string;
    description?: string;
    contacts?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Campaign {
    id: string;
    name: string;
    subject: string;
    content: string;
    status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
    scheduledAt?: string;
    sentAt?: string;
    emailList: EmailList | string;
    stats: {
        sent: number;
        opened: number;
        clicked: number;
        bounced: number;
    };
    createdAt: string;
}

export interface CreateEmailListData {
    name: string;
    description?: string;
    contacts?: string[];
}

export interface CreateCampaignData {
    name: string;
    subject: string;
    content: string;
    status?: 'draft' | 'scheduled' | 'sent' | 'cancelled';
    scheduledAt?: string;
    emailList: string;
}

export const getEmailLists = async () => {
    const response = await api.get('/marketing/lists');
    return response.data;
};

export const createEmailList = async (data: CreateEmailListData) => {
    const response = await api.post('/marketing/lists', data);
    return response.data;
};

export const getCampaigns = async () => {
    const response = await api.get('/campaigns');
    return response.data;
};

export const createCampaign = async (data: CreateCampaignData) => {
    const response = await api.post('/campaigns', data);
    return response.data;
};

export const sendCampaign = async (id: string) => {
    const response = await api.post(`/campaigns/${id}/send`);
    return response.data;
};

export const getCampaignById = async (id: string) => {
    const response = await api.get<Campaign>(`/campaigns/${id}`);
    return response.data;
};

export const updateCampaign = async (id: string, data: Partial<CreateCampaignData>) => {
    const response = await api.put<Campaign>(`/campaigns/${id}`, data);
    return response.data;
};

export const deleteCampaign = async (id: string) => {
    await api.delete(`/campaigns/${id}`);
};
