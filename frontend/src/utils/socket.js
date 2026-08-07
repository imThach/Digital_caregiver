import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/config.js';

export const socket = io(API_BASE_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
});

export const connectSocket = (token) => {
    if (!token) return;
    socket.auth = { token };
    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
