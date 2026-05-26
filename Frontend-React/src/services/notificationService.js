// src/services/notificationService.js
import api from './api';

const notificationService = {
  getNotifications: async (page = 0, size = 20) => {
    const response = await api.get('/notification', { params: { page, size } });
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.post(`/notification/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/notification/read-all');
    return response.data;
  }
};

export default notificationService;