import { api } from './api';

export interface CRMNotification {
    id: string;
    recipient: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    relatedResource?: string;
    relatedId?: string;
    isRead: boolean;
    createdAt: string;
}

export const getNotifications = async (page = 1) => {
    const response = await api.get(`/notifications?page=${page}`);
    return response.data;
};

export const markAsRead = async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
};

export const markAllAsRead = async () => {
    const response = await api.put(`/notifications/read-all`);
    return response.data;
};
