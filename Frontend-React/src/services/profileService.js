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
  },

  // ============================================================
  // MÉTODOS DE CONTACTOS
  // ============================================================

  // Obtener mis contactos
  getMyContacts: async () => {
    try {
      const response = await api.get('/contacts/my-contacts');
      return response.data;
    } catch (error) {
      console.error('Error al obtener contactos:', error);
      throw error;
    }
  },

  // Buscar usuarios en el directorio global
  searchGlobalUsers: async (query) => {
    try {
      const response = await api.get('/contacts/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error en búsqueda global:', error);
      throw error;
    }
  },

  // Agregar un contacto
  addContact: async (userId) => {
    try {
      const response = await api.post('/contacts/add', { userId });
      return response.data;
    } catch (error) {
      console.error('Error al agregar contacto:', error);
      throw error;
    }
  },

  // Eliminar un contacto
  removeContact: async (contactId) => {
    try {
      const response = await api.delete(`/contacts/${contactId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar contacto:', error);
      throw error;
    }
  }
};

export default profileService;