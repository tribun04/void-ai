import axios from 'axios';

// Create an instance of axios
const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api', // Your backend API base URL
});

// Add a request interceptor to include the token in every request
apiClient.interceptors.request.use(
    (config) => {
        // Get the token from localStorage (or wherever you store it)
        const userToken = localStorage.getItem('token'); // IMPORTANT: Use the key you used to save the token

        if (userToken) {
            // If the token exists, add it to the Authorization header
            config.headers.Authorization = `Bearer ${userToken}`;
        }
        return config;
    },
    (error) => {
        // Do something with request error
        return Promise.reject(error);
    }
);

export default apiClient;