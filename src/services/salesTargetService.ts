import { api } from './api';

export interface SalesTarget {
    id: string;
    targetValue: number;
    achievedValue: number;
    period: 'monthly' | 'quarterly' | 'yearly';
    startDate: string;
    endDate: string;
    assignedTo: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
        position?: string;
    };
    assignedBy: {
        id: string;
        firstName: string;
        lastName: string;
    };
    parentTarget?: string;
    status: 'active' | 'completed' | 'missed';
    autoDistributed: boolean;
    createdAt: string;
}

export interface DailyAchievement {
    hasTarget: boolean;
    showNotification?: boolean;
    target?: {
        id: string;
        targetValue: number;
        achievedValue: number;
        achievementPercent: number;
        period: string;
        daysRemaining: number;
        amountRemaining: number;
    };
}

export interface Subordinate {
    id: string;
    firstName: string;
    lastName: string;
}

export interface AssignTargetInput {
    assignToUserId: string;
    targetValue: number;
    period: 'monthly' | 'quarterly' | 'yearly';
}

export const getMyTargets = async (): Promise<{ targets: SalesTarget[] }> => {
    const response = await api.get('/sales-targets');
    return response.data;
};

export const getTeamTargets = async (): Promise<{ targets: SalesTarget[] }> => {
    const response = await api.get('/sales-targets/team');
    return response.data;
};

export const getDailyAchievement = async (): Promise<DailyAchievement> => {
    const response = await api.get('/sales-targets/daily');
    return response.data;
};

export const acknowledgeDailyNotification = async (): Promise<{ success: boolean }> => {
    const response = await api.post('/sales-targets/daily/acknowledge');
    return response.data;
};

export const getSubordinates = async (): Promise<{ subordinates: Subordinate[] }> => {
    const response = await api.get('/sales-targets/subordinates');
    return response.data;
};

export const assignTarget = async (data: AssignTargetInput): Promise<{ message: string; target: SalesTarget }> => {
    const response = await api.post('/sales-targets', data);
    return response.data;
};

export const recalculateProgress = async (): Promise<{ message: string }> => {
    const response = await api.post('/sales-targets/recalculate');
    return response.data;
};

export const deleteTarget = async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/sales-targets/${id}`);
    return response.data;
};
