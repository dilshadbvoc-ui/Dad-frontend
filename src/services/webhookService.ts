import { api } from './api';

export interface WebhookConfig {
    id: string;
    url: string;
    events: string[];
    secret?: string;
    isActive: boolean;
    lastTriggeredAt?: string;
    successCount: number;
    failureCount: number;
    lastError?: string;
    createdAt: string;
}

export interface CreateWebhookData {
    url: string;
    events: string[];
    secret?: string;
}

export const getWebhooks = async () => {
    const response = await api.get<WebhookConfig[]>('/webhooks');
    return response.data;
};

export const createWebhook = async (data: CreateWebhookData) => {
    const response = await api.post<WebhookConfig>('/webhooks', data);
    return response.data;
};

export const updateWebhook = async (id: string, data: Partial<WebhookConfig>) => {
    const response = await api.put<WebhookConfig>(`/webhooks/${id}`, data);
    return response.data;
};

export const deleteWebhook = async (id: string) => {
    await api.delete(`/webhooks/${id}`);
};

export const toggleWebhook = async (id: string, isActive: boolean) => {
    const response = await api.put<WebhookConfig>(`/webhooks/${id}`, { isActive });
    return response.data;
};
