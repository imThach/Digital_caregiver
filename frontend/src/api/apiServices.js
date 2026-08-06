import axiosClient from './axiosClient';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// 1. Auth API
export const authApi = {
    getGoogleLoginUrl: () => `${apiBaseUrl}/api/v1/auth/google`,
    sendOtp: (email) => axiosClient.post('/api/v1/auth/send-otp', { email }),
    verifyOtp: (email, otp) => axiosClient.post('/api/v1/auth/verify-otp', { email, otp }),
    getMe: () => axiosClient.get('/api/v1/auth/me'),
    logout: () => axiosClient.post('/api/v1/auth/logout'),
};

// 2. Pairing API
export const pairingApi = {
    generateCode: () => axiosClient.post('/api/v1/pairing/generate'),
    connectDevice: (pairingCode, nickname) => axiosClient.post('/api/v1/pairing/connect', { pairingCode, nickname }),
    getMyElderly: () => axiosClient.get('/api/v1/pairing/my-elderly'),
    getFamilyProfile: () => axiosClient.get('/api/v1/pairing/family-profile'),
    updateFamilyProfile: (formData) => axiosClient.patch('/api/v1/pairing/family-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    updateElderlyProfile: (data) => axiosClient.patch('/api/v1/pairing/elderly-profile', data),
};

// 3. Prescription & Gemini AI API
export const prescriptionApi = {
    analyzeImage: (formData) => axiosClient.post('/api/v1/prescriptions/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    confirmPrescription: (data) => axiosClient.post('/api/v1/prescriptions/confirm', data),
    getElderlyPrescriptions: (elderlyId) => axiosClient.get(`/api/v1/prescriptions/elderly/${elderlyId}`),
    deletePrescription: (id) => axiosClient.delete(`/api/v1/prescriptions/${id}`),
};

// 4. Medication Reminders & Logs API
export const medicationApi = {
    getTodaySchedules: (elderlyId) => axiosClient.get(`/api/v1/medications/today/${elderlyId}`),
    logMedicationStatus: (scheduleId, elderlyId, status, snoozeMinutes = 10) =>
        axiosClient.post('/api/v1/medications/log', { scheduleId, elderlyId, status, snoozeMinutes }),
    getCaregiverDashboardStatus: () => axiosClient.get('/api/v1/medications/dashboard-status'),
};

// 5. AI Voice Assistant API
export const aiAssistantApi = {
    chatWithAssistant: (elderlyId, message) => axiosClient.post('/api/v1/ai-assistant/chat', { elderlyId, message }),
    speakTts: (text) => axiosClient.post('/api/v1/ai-assistant/tts', { text }),
};

// 6. Emergency SOS API
export const emergencyApi = {
    triggerSOS: (elderlyId, triggeredBy = 'button', latitude, longitude) =>
        axiosClient.post('/api/v1/emergency/sos', { elderlyId, triggeredBy, latitude, longitude }),
    getHistory: (params) => axiosClient.get('/api/v1/emergency/history', { params }),
    acknowledgeEmergency: (id, status) => axiosClient.patch(`/api/v1/emergency/${id}/acknowledge`, { status }),
};
