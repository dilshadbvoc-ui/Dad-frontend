import { api } from './api';

export interface CheckIn {
    id: string;
    user: { id: string; firstName: string; lastName: string; email: string };
    type: 'check_in' | 'check_out';
    location: { address?: string; latitude?: number; longitude?: number };
    relatedTo?: { id: string; firstName?: string; lastName?: string; name?: string };
    onModel?: string;
    notes?: string;
    createdAt: string;
}

export interface CheckInSearchParams {
    userId?: string;
    type?: string;
    date?: string;
}

export type CheckInInput = Omit<CheckIn, 'id' | 'user' | 'createdAt'>;

export const getCheckIns = async (params?: CheckInSearchParams) => {
    const response = await api.get('/checkins', { params });
    return response.data;
};

export const createCheckIn = async (data: CheckInInput) => {
    const response = await api.post('/checkins', data);
    return response.data;
};
