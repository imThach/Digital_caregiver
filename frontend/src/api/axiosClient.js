import axios from 'axios';
import { clearAuthSession, getAuthToken } from '../auth/tokenStorage.js';
import { API_BASE_URL } from './config.js';

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request Interceptor: Tự động đính kèm Token JWT Bearer cho kết nối cross-domain (Vercel -> Render)
axiosClient.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Tự động bóc tách dữ liệu & Xử lý lỗi 401 Unauthorized
 *
 * Interceptor này trả về `response.data` (Axios layer), tức là body JSON từ server.
 * Server luôn trả về dạng: { status: string, data: any, message?: string, pagination?: object }
 *
 * => Tại call site, truy cập payload thật qua `res.data`:
 *    const res = await someApi.getSomething()  // res = { status, data, message? }
 *    const items = res.data                    // items = payload thực tế
 */
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
