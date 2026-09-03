import { api } from './api';

export type HelperLogLevel = 'info' | 'warn' | 'error';

export interface HelperActivityLog {
    id: string;
    organisationId: string;
    userId: string;
    event: string;
    detail: string | null;
    level: HelperLogLevel;
    clientTimestamp: string;
    createdAt: string;
    user: { id: string; firstName: string; lastName: string; email: string };
    organisation: { id: string; name: string };
}

export interface HelperActivityLogUser {
    userId: string;
    organisationId: string;
    user: { firstName: string; lastName: string; email: string };
    organisation: { name: string };
}

export interface HelperActivityLogQuery {
    userId?: string;
    organisationId?: string;
    level?: HelperLogLevel;
    event?: string;
    page?: number;
    limit?: number;
}

export interface HelperActivityLogResponse {
    logs: HelperActivityLog[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

// GET /api/super-admin/helper-logs — Helper (PypeCRM Helper / Dad-call-recorder)
// call-fetching/sync activity, uploaded from the device's local EngineDebugLog
// ring buffer. Super-admin only.
export const getHelperActivityLogs = async (query: HelperActivityLogQuery): Promise<HelperActivityLogResponse> => {
    const { data } = await api.get('/super-admin/helper-logs', { params: query });
    return data;
};

export const getHelperActivityLogUsers = async (): Promise<HelperActivityLogUser[]> => {
    const { data } = await api.get('/super-admin/helper-logs/users');
    return data.users;
};
