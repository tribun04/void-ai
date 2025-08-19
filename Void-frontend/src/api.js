import axios from 'axios';

const API_URL = '/api/settings/'; // Or your relevant API endpoint

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user')); // Or however you store your user/token
    if (user && user.token) {
        return { 'Authorization': 'Bearer ' + user.token };
    } else {
        return {};
    }
};

const updateProfile = async (profileData) => {
    const config = {
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
        },
    };
    const response = await axios.put(API_URL + 'profile', profileData, config);
    return response.data;
};

const apiService = {
    updateProfile,
    // other api functions
};

export default apiService;