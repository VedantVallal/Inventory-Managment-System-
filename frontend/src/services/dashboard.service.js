import api from './api';

const dashboardService = {
    // Get dashboard metrics
    getMetrics: async () => {
        return await api.get('/dashboard/metrics');
    },

    // Get recent activities
    getRecentActivities: async () => {
        return await api.get('/dashboard/recent-activities');
    },

    // Get sales chart data
    getSalesChart: async (days = 7) => {
        return await api.get(`/dashboard/sales-chart?days=${days}`);
    },
};

export default dashboardService;
