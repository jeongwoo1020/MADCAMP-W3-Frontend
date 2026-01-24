import axios from 'axios';

// Default API URL (can be overridden by environment variable)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // If using session cookies or CORS with credentials
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        // You can add headers here, e.g., Authorization token
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle global errors, e.g., 401 Unauthorized
        if (error.response && error.response.status === 401) {
            // Redirect to login or handle session expiration
            console.warn('Unauthorized access - redirecting to login?');
        }
        return Promise.reject(error);
    }
);
