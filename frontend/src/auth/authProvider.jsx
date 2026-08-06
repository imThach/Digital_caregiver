import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/apiServices.js';
import { clearAuthSession, saveAuthSession } from './tokenStorage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profileStatus, setProfileStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const response = await authApi.getMe();
            if (response?.data?.user) {
                const currentUser = response.data.user;
                const currentProfileStatus = response.data.profileStatus || null;
                setUser(currentUser);
                setProfileStatus(currentProfileStatus);
                saveAuthSession(currentUser.role);

                if (currentUser.role === 'elderly') {
                    localStorage.setItem('cached_elderly_user', JSON.stringify(currentUser));
                }

                return { ...currentUser, profileStatus: currentProfileStatus };
            } else {
                return fallbackCachedElderlyUser();
            }
        } catch {
            return fallbackCachedElderlyUser();
        } finally {
            setLoading(false);
        }
    }, []);

    const fallbackCachedElderlyUser = () => {
        const cachedRole = localStorage.getItem('user_role');
        const cachedUserStr = localStorage.getItem('cached_elderly_user');
        if (cachedRole === 'elderly' && cachedUserStr) {
            try {
                const cachedUser = JSON.parse(cachedUserStr);
                setUser(cachedUser);
                setProfileStatus({ isComplete: true });
                return cachedUser;
            } catch {
                // fallthrough
            }
        }
        setUser(null);
        setProfileStatus(null);
        clearAuthSession();
        return null;
    };

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const handleLoginSuccess = (userData) => {
        if (userData) {
            setUser(userData);
            setProfileStatus(userData.profileStatus || null);
            saveAuthSession(userData.role);
            if (userData.role === 'elderly') {
                localStorage.setItem('cached_elderly_user', JSON.stringify(userData));
            }
        }
    };

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
            setProfileStatus(null);
            clearAuthSession();
        }
    };

    const value = {
        user,
        profileStatus,
        loading,
        isAuthenticated: Boolean(user),
        checkAuth,
        login: handleLoginSuccess,
        logout: handleLogout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
