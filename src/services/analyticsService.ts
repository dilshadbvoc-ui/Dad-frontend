import { api } from './api';

export const getDashboardStats = async (branchId?: string) => {
    try {
        const params = branchId ? { branchId } : {};
        const response = await api.get('/analytics/dashboard', { params });
        return response.data || {};
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {};
    }
};

export const getSalesChartData = async (branchId?: string) => {
    try {
        const params = branchId ? { branchId } : {};
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

export const getSalesForecast = async (branchId?: string) => {
    try {
        const params = branchId ? { branchId } : {};
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
