import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthCallback = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Lấy token từ URL query parameter
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');

        if (token) {
            // Lưu token vào localStorage (hoặc state manager như Zustand)
            localStorage.setItem('jwt_token', token);
            // Chuyển hướng người dùng đến trang dashboard hoặc trang chính
            navigate('/dashboard');
        }
    }, [location, navigate]);

    return <div>Đang xử lý đăng nhập...</div>;
};

export default AuthCallback;
