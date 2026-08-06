import axios from 'axios';
import { clearAuthSession } from '../auth/tokenStorage.js';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const axiosClient = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Response Interceptor: Tự động bóc tách dữ liệu & Xử lý lỗi 401 Unauthorized
axiosClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';

        if (status === 401) {
            console.warn('Phiên làm việc hết hạn hoặc không hợp lệ.');
            clearAuthSession();
            if (window.location.pathname !== '/login' && window.location.pathname !== '/auth/callback') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(new Error(message));
    }
);

export default axiosClient;
