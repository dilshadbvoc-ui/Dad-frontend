import axios from 'axios';
import { API_URL } from '@/config';

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const { token } = JSON.parse(userInfo);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Don't redirect if we're already on the login page or this IS a login request
            const isLoginPage = window.location.pathname === '/login';
            const isLoginRequest = error.config?.url?.includes('/auth/login');

            if (!isLoginPage && !isLoginRequest) {
                localStorage.removeItem('userInfo');
                window.location.href = '/login';
            }
        }
        
        // Handle 500 errors gracefully - return empty data instead of crashing
        if (error.response && error.response.status === 500) {
            console.error('Server error:', error.response.data);
            // Return a resolved promise with empty data structure
            return Promise.resolve({ 
                data: { 
                    data: [], 
                    message: 'Unable to fetch data',
                    error: true 
                } 
            });
        }
        
        return Promise.reject(error);
    }
);


