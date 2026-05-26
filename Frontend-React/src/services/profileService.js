// src/services/profileService.js
import api from './api';

const profileService = {
  // Obtener mi perfil
  getMyProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },

  // Subir foto de perfil
  uploadProfilePhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await api.post('/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Eliminar foto de perfil
  deleteProfilePhoto: async () => {
    const response = await api.delete('/profile/photo');
    return response.data;
  }
};

export default profileService;