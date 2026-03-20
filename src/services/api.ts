import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Attach Authorization token
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

// Response interceptor - Handle 401 errors and redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login
            localStorage.removeItem('token');
            toast.error('Session expired. Please log in again.');
            window.location.href = '/login';
        } else if (error.response?.status === 403) {
            localStorage.removeItem('token');
            toast.error('Invalid access. Please log in again.');
            window.location.href = '/login';
        } else if (error.response?.status >= 500) {
            toast.error('Server error. Please try again later.');
        }
        return Promise.reject(error);
    }
);

export default api;
