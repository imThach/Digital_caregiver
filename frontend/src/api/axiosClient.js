import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const axiosClient = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request Interceptor: Tự động đính kèm JWT Token vào Header Authorization
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Tự động bóc tách dữ liệu & Xử lý lỗi 401 Unauthorized
axiosClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';

        if (status === 401) {
            console.warn('JWT Token hết hạn hoặc không hợp lệ. Đang đăng xuất...');
            localStorage.removeItem('jwt_token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(new Error(message));
    }
);

export default axiosClient;
