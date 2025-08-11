// src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
});

// ✅ Automatically attach the token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Or sessionStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
