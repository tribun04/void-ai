// File: src/services/apiService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/'; // Use your backend's actual port

const apiService = axios.create({
    baseURL: API_URL,
});

apiService.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        config.headers['Authorization'] = 'Bearer ' + user.token;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiService;