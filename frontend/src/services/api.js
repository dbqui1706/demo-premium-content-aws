import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (email, password, tier = 'free') =>
        api.post('/auth/register', { email, password, tier }),

    login: (email, password) =>
        api.post('/auth/login', { email, password }),

    getMe: () =>
        api.get('/auth/me')
};

// Content API
export const contentAPI = {
    getAll: (tier) =>
        api.get('/content', { params: { tier } }),

    getById: (id) =>
        api.get(`/content/${id}`),

    getAccessUrl: (id) =>
        api.post(`/content/${id}/access`),

    getStats: () =>
        api.get('/content/stats')
};

export default api;
