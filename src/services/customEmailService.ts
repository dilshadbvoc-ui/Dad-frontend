import { api } from './api';

export const getCustomEmailStatus = async (): Promise<{ connected: boolean; email?: string; provider?: string }> => {
    const response = await api.get('/email-account/status');
    return response.data;
};

export const connectCustomEmail = async (data: {
    provider: string;
    email: string;
    fromName?: string;
    username: string;
    password: string;
    host?: string;
    port?: number;
    secure?: boolean;
}) => {
    const response = await api.post('/email-account/connect', data);
    return response.data;
};

export const disconnectCustomEmail = async () => {
    const response = await api.post('/email-account/disconnect');
    return response.data;
};
