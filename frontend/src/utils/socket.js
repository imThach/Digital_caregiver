import { io } from 'socket.io-client';

const defaultRenderUrl = 'https://digital-caregiver-0mv1.onrender.com';
const isProductionDomain = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    (isProductionDomain ? defaultRenderUrl : 'http://localhost:3001');

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling'],
});
