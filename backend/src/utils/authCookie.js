export const getAuthCookieOptions = () => {
    const days = Number(process.env.JWT_COOKIE_EXPIRES_IN || 30);

    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: days * 24 * 60 * 60 * 1000,
    };
};

export const setAuthCookie = (res, token) => {
    res.cookie('jwt_token', token, getAuthCookieOptions());
};

export const clearAuthCookie = (res) => {
    res.clearCookie('jwt_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
};
