import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/apiServices.js';
import { clearAuthSession, saveAuthSession, getAuthToken } from './tokenStorage.js';
import { connectSocket, disconnectSocket } from '../utils/socket.js';

const AuthContext = createContext(null);
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const saveElderlyUserCache = (userData) => {
    if (!userData) return;
    const cacheData = {
        user: userData,
        timestamp: Date.now(),
    };
    localStorage.setItem('cached_elderly_user', JSON.stringify(cacheData));
};

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
                    saveElderlyUserCache(currentUser);
                }

                const token = getAuthToken();
                if (token) {
                    connectSocket(token);
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
                const parsed = JSON.parse(cachedUserStr);
                const cachedUser = parsed?.user || (parsed?._id ? parsed : null);
                const timestamp = parsed?.timestamp || 0;

                const isExpired = !timestamp || Date.now() - timestamp > SEVEN_DAYS_MS;

                if (!isExpired && cachedUser) {
                    setUser(cachedUser);
                    setProfileStatus({ isComplete: true });
                    const token = getAuthToken();
                    if (token) {
                        connectSocket(token);
                    }
                    return cachedUser;
                }
            } catch {
                // fallthrough
            }
        }
        setUser(null);
        setProfileStatus(null);
        clearAuthSession();
        disconnectSocket();
        return null;
    };

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const handleLoginSuccess = (userData) => {
        if (userData) {
            setUser(userData);
            setProfileStatus(userData.profileStatus || null);
            saveAuthSession(userData.role, userData.token);
            if (userData.role === 'elderly') {
                saveElderlyUserCache(userData);
            }
            const token = userData.token || getAuthToken();
            if (token) {
                connectSocket(token);
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
            disconnectSocket();
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
