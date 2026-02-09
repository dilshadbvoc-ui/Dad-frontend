import { api } from './api';

export const getDashboardStats = async () => {
    try {
        const response = await api.get('/analytics/dashboard');
        return response.data || {};
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {};
    }
};

export const getSalesChartData = async () => {
    try {
        const response = await api.get('/analytics/sales-chart');
        // Ensure it's always an array
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching sales chart data:', error);
        return [];
    }
};

export const getTopLeads = async () => {
    try {
        const response = await api.get('/analytics/top-leads');
        // Ensure it's always an array
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching top leads:', error);
        return [];
    }
};

export const getSalesForecast = async () => {
    try {
        const response = await api.get('/analytics/forecast');
        return response.data || {};
    } catch (error) {
        console.error('Error fetching sales forecast:', error);
        return {};
    }
};

export const getLeadSourceAnalytics = async () => {
    try {
        const response = await api.get('/analytics/lead-sources');
        // Ensure it's always an array
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching lead sources:', error);
        return [];
    }
};
