import { api } from './api';

export const getDashboardStats = async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
};

export const getSalesChartData = async () => {
    const response = await api.get('/analytics/sales-chart');
    return response.data;
};

export const getTopLeads = async () => {
    const response = await api.get('/analytics/top-leads');
    return response.data;
};

export const getSalesForecast = async () => {
    const response = await api.get('/analytics/forecast');
    return response.data;
};

export const getLeadSourceAnalytics = async () => {
    const response = await api.get('/analytics/lead-sources');
    return response.data;
};
