const defaultRenderUrl = 'https://digital-caregiver-0mv1.onrender.com';
const isProductionDomain =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    (isProductionDomain ? defaultRenderUrl : 'http://localhost:3001');
