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

  // Actualizar datos del perfil
  updateProfile: async (profileData) => {
    const response = await api.put('/profile/update', profileData);
    return response.data;
  },

  // Obtener información de almacenamiento
  getStorageInfo: async () => {
    const response = await api.get('/profile/storage');
    return response.data;
  },

  // ✅ BUSCAR USUARIOS GLOBALES (usa el endpoint correcto)
  searchGlobalUsers: async (query) => {
    const response = await api.get('/profile/search', { params: { query } });
    return response.data; // { results: [...] }
  },

  // ✅ SUGERENCIAS DE USUARIOS (autocompletado)
  suggestUsers: async (query) => {
    const response = await api.get('/profile/suggest', { params: { query } });
    return response.data;
  },

  // Agregar contacto
  addContact: async (userId) => {
    const response = await api.post(`/profile/contacts/${userId}`);
    return response.data;
  },

  // Eliminar contacto
  removeContact: async (contactId) => {
    const response = await api.delete(`/profile/contacts/${contactId}`);
    return response.data;
  },

  // Obtener mis contactos
  getMyContacts: async (page = 0, size = 20) => {
    const response = await api.get('/profile/contacts', { params: { page, size } });
    return response.data;
  },

  // Buscar dentro de mis contactos
  searchMyContacts: async (query) => {
    const response = await api.get('/profile/contacts/search', { params: { query } });
    return response.data;
  },
  searchUsersByAny: async (query) => {
    console.log('🔍 Buscando usuarios con query:', query);
    const response = await api.get('/profile/search', { params: { query } });
    console.log('📦 Respuesta del backend:', response.data);
    return response.data;
  },
};

export default profileService;