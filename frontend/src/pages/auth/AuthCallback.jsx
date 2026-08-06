import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authProvider.jsx';

const AuthCallback = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { checkAuth } = useAuth();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const isNewUser = searchParams.get('isNewUser') === 'true';

        async function verifySession() {
            const user = await checkAuth();
            if (user) {
                if (user.role === 'elderly') {
                    navigate('/elderly-home', { replace: true });
                } else if (isNewUser || user.profileStatus?.isComplete === false) {
                    navigate('/profile', { replace: true });
                } else {
                    navigate('/dashboard', { replace: true });
                }
            } else {
                navigate('/login', { replace: true });
            }
        }

        verifySession();
    }, [location.search, navigate, checkAuth]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f7f9f5] font-bold text-[#176c3a]">
            Đang xác minh phiên làm việc và đăng nhập...
        </div>
    );
};

export default AuthCallback;
