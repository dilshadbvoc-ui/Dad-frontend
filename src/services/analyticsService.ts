import { api } from './api';

export interface LeadStageCount {
    id: string;
    label: string;
    color: string;
    count: number;
}

export interface LeadsByStageResult {
    stages: LeadStageCount[];
    total: number;
}

export const getLeadsByStage = async (filters?: { branchId?: string; campaignId?: string; startDate?: string; endDate?: string }): Promise<LeadsByStageResult> => {
    try {
        const response = await api.get('/analytics/leads-by-stage', { params: filters });
        return response.data || { stages: [], total: 0 };
    } catch (error) {
        console.error('Error fetching leads by stage:', error);
        return { stages: [], total: 0 };
    }
};

export const getLeadCampaigns = async (): Promise<string[]> => {
    try {
        const response = await api.get('/analytics/lead-campaigns');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching lead campaigns:', error);
        return [];
    }
};

export interface CallActivityPoint {
    date: string;
    total: number;
    connected: number;
}

export const getCallActivityTrend = async (filters?: { period?: string; startDate?: string; endDate?: string; branchId?: string }): Promise<CallActivityPoint[]> => {
    try {
        const response = await api.get('/analytics/call-activity-trend', { params: filters });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching call activity trend:', error);
        return [];
    }
};

export interface TaskFollowUpStatusCount {
    status: string;
    label: string;
    tasks: number;
    followUps: number;
    total: number;
}

export const getTaskFollowUpCompletion = async (filters?: { branchId?: string }): Promise<TaskFollowUpStatusCount[]> => {
    try {
        const response = await api.get('/analytics/task-followup-completion', { params: filters });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching task/follow-up completion:', error);
        return [];
    }
};

export interface OpportunityPipelineBucket {
    id: string;
    label: string;
    value: number;
    count: number;
}

export const getOpportunityPipelineValue = async (filters?: { branchId?: string }): Promise<OpportunityPipelineBucket[]> => {
    try {
        const response = await api.get('/analytics/opportunity-pipeline-value', { params: filters });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching opportunity pipeline value:', error);
        return [];
    }
};

export interface BranchPerformanceRow {
    id: string;
    name: string;
    totalLeads: number;
    convertedLeads: number;
}

export interface UserTrendTile {
    key: string;
    label: string;
    current: number;
    previous: number;
    changePct: number;
}

export const getUserTrendsSummary = async (filters?: { period?: string; startDate?: string; endDate?: string; branchId?: string }): Promise<UserTrendTile[]> => {
    try {
        const response = await api.get('/analytics/user-trends-summary', { params: filters });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching user trends summary:', error);
        return [];
    }
};

export const getBranchPerformance = async (): Promise<BranchPerformanceRow[]> => {
    try {
        const response = await api.get('/analytics/branch-performance');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching branch performance:', error);
        return [];
    }
};

export const getDashboardStats = async (branchId?: string, month?: string) => {
    try {
        const params: any = {};
        if (branchId) params.branchId = branchId;
        if (month) params.month = month;
        const response = await api.get('/analytics/dashboard', { params });
        return response.data || {};
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {};
    }
};

export const getSalesChartData = async (branchId?: string, userId?: string) => {
    try {
        const params: any = {};
        if (branchId) params.branchId = branchId;
        if (userId) params.userId = userId;
        
        const response = await api.get('/analytics/sales-chart', { params });
        // Ensure it's always an array
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching sales chart data:', error);
        return [];
    }
};

export const getTopLeads = async (branchId?: string) => {
    try {
        const params = branchId ? { branchId } : {};
        const response = await api.get('/analytics/top-leads', { params });
        // Ensure it's always an array
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching top leads:', error);
        return [];
    }
};

export const getSalesForecast = async (branchId?: string, month?: string) => {
    try {
        const params: any = {};
        if (branchId) params.branchId = branchId;
        if (month) params.month = month;
        const response = await api.get('/analytics/forecast', { params });
        return response.data || {};
    } catch (error) {
        console.error('Error fetching sales forecast:', error);
        return {};
    }
};

export const getLeadSourceAnalytics = async (branchId?: string) => {
    try {
        const params = branchId ? { branchId } : {};
        const response = await api.get('/analytics/lead-sources', { params });
        // Ensure it's always an array
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching lead sources:', error);
        return [];
    }
};

export const getTopPerformers = async (branchId?: string) => {
    try {
        const params = branchId ? { branchId } : {};
        const response = await api.get('/analytics/top-performers', { params });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching top performers:', error);
        return [];
    }
};

export const getSalesBook = async (filters?: { startDate?: string; endDate?: string; branchId?: string }) => {
    try {
        const response = await api.get('/analytics/sales-book', { params: filters });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching sales book:', error);
        return [];
    }
};

export const getUserWiseSales = async (filters?: { startDate?: string; endDate?: string; branchId?: string }) => {
    try {
        const response = await api.get('/analytics/user-sales', { params: filters });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching user sales:', error);
        return [];
    }
};
export const getUserPerformanceDetails = async (filters?: { startDate?: string; endDate?: string; branchId?: string }) => {
    try {
        const response = await api.get('/reports/user-performance-details', { params: filters });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching user performance details:', error);
        return [];
    }
};

export const getDailyReport = async (filters?: { branchId?: string; startDate?: string; endDate?: string }) => {
    try {
        const response = await api.get('/reports/daily-report', { params: filters });
        return response.data || { table: [], summary: null };
    } catch (error: any) {
        // On 401 (auth not yet ready on mobile cold start), throw a clean retriable error
        if (error?.response?.status === 401) {
            throw new Error('AUTH_NOT_READY');
        }
        console.error('Error fetching daily report:', error);
        throw error;
    }
};

export const getLeadDistributionReport = async (filters?: { startDate?: string; endDate?: string; branchId?: string; userId?: string }) => {
    try {
        const response = await api.get('/reports/lead-distribution', { params: filters });
        return response.data || { leads: [], summary: { total: 0, byUser: [], byDate: [] } };
    } catch (error) {
        console.error('Error fetching lead distribution report:', error);
        throw error;
    }
};
