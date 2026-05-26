import api from './api';

const storageService = {
  // ========== PERFIL ==========
  getMyProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/profile/update', profileData);
    return response.data;
  },

  uploadProfilePhoto: async (photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    const response = await api.post('/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteProfilePhoto: async () => {
    const response = await api.delete('/profile/photo');
    return response.data;
  },

  getStorageInfo: async () => {
    const response = await api.get('/profile/storage');
    return response.data;
  },

  // ========== CONTACTOS ==========
  searchUsers: async (query, page = 0, size = 20) => {
    const response = await api.get('/profile/search', {
      params: { query, page, size }
    });
    return response.data;
  },

  suggestUsers: async (query) => {
    const response = await api.get('/profile/suggest', {
      params: { query }
    });
    return response.data;
  },

  addContact: async (userId) => {
    const response = await api.post(`/profile/contacts/${userId}`);
    return response.data;
  },

  removeContact: async (contactId) => {
    const response = await api.delete(`/profile/contacts/${contactId}`);
    return response.data;
  },

  getMyContacts: async (page = 0, size = 20) => {
    const response = await api.get('/profile/contacts', {
      params: { page, size }
    });
    return response.data;
  },

  searchMyContacts: async (query) => {
    const response = await api.get('/profile/contacts/search', {
      params: { query }
    });
    return response.data;
  },

  // ========== CARPETAS Y ARCHIVOS PERSONALES ==========
  createFolder: async (name, parentFolderId = null, color = null) => {
    const response = await api.post('/storage/folder', { name, parentFolderId, color });
    return response.data;
  },

  getFolderContents: async (folderId = null) => {
    if (!folderId || folderId === 'root') {
      const response = await api.get('/storage/root');
      return response.data;
    }
    const response = await api.get(`/storage/folder/${folderId}`);
    return response.data;
  },

  uploadPersonalFile: async (file, {
    parentFolderId = null,
    securityLevel = 'PUBLIC',
    password = '',
    confirmPassword = '',
    useAccountPhone = true,
    customPhoneNumber = ''
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (parentFolderId) formData.append('parentFolderId', parentFolderId);
    formData.append('securityLevel', securityLevel);
    if (password) formData.append('password', password);
    if (confirmPassword) formData.append('confirmPassword', confirmPassword);
    formData.append('useAccountPhone', useAccountPhone);
    if (customPhoneNumber) formData.append('customPhoneNumber', customPhoneNumber);

    const response = await api.post('/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  moveItem: async (fileId, targetFolderId = null) => {
    const response = await api.post('/storage/move', { fileId, targetFolderId });
    return response.data;
  },

  deleteItem: async (itemId) => {
    const response = await api.delete(`/storage/${itemId}`);
    return response.data;
  },

  restoreItem: async (itemId) => {
    const response = await api.post(`/storage/${itemId}/restore`);
    return response.data;
  },

  permanentDelete: async (itemId) => {
    const response = await api.delete(`/storage/${itemId}/permanent`);
    return response.data;
  },

  getItemInfo: async (itemId) => {
    const response = await api.get(`/storage/${itemId}`);
    return response.data;
  },

  requestPersonalFileToken: async (fileId) => {
    const response = await api.post(`/storage/${fileId}/request-token`);
    return response.data;
  },

  verifyPersonalFileToken: async (fileId, token) => {
    const response = await api.post(`/storage/${fileId}/verify-token`, { token });
    return response.data;
  },

  verifyPersonalFilePassword: async (fileId, password) => {
    const response = await api.post(`/storage/${fileId}/verify-password`, { password });
    return response.data;
  },

  openPersonalFile: async (fileId) => {
    const response = await api.get(`/storage/${fileId}/open`);
    return response.data;
  },

  downloadPersonalFile: async (fileId) => {
    const response = await api.get(`/storage/${fileId}/download`);
    return response.data;
  },

  // ========== COMPARTIR ARCHIVOS EXISTENTES ==========
  shareExistingFile: async (shareData) => {
    const response = await api.post('/storage/share', shareData);
    return response.data;
  },

  getShareableFiles: async () => {
    const response = await api.get('/storage/shareable');
    return response.data;
  },

  // ========== FAVORITOS ==========
  addFavorite: async (itemId, type) => {
    const response = await api.post(`/storage/favorite/${itemId}?type=${type}`);
    return response.data;
  },

  removeFavorite: async (favoriteId) => {
    const response = await api.delete(`/storage/favorite/${favoriteId}`);
    return response.data;
  },

  getFavorites: async () => {
    const response = await api.get('/storage/favorites');
    return response.data;
  },

  // ========== RECIENTES ==========
  getRecentPersonalFiles: async (days = 3) => {
    const response = await api.get('/storage/recent/personal', { params: { days } });
    return response.data;
  },

  getRecentSharedFiles: async (days = 3) => {
    const response = await api.get('/storage/recent/shared', { params: { days } });
    return response.data;
  },

  // ========== COMPARTIDOS (conmigo / por mí) ==========
  getSharedWithMe: async (page = 0, size = 20) => {
    const response = await api.get('/storage/shared-with-me', { params: { page, size } });
    return response.data;
  },

  getSharedByMe: async (page = 0, size = 20) => {
    const response = await api.get('/storage/shared-by-me', { params: { page, size } });
    return response.data;
  },

  // ========== PAPELERA ==========
  getTrash: async () => {
    const response = await api.get('/storage/trash');
    return response.data;
  },

  emptyTrash: async () => {
    const response = await api.delete('/storage/trash/empty');
    return response.data;
  },

  // ========== CADUCADOS ==========
  getExpiredShares: async () => {
    const response = await api.get('/storage/expired');
    return response.data;
  },
  getFolderTree: async (folderId = null) => {
    const response = await api.get('/storage/folder', { params: { folderId } });
    return response.data;
  },
  // Obtener URL para vista previa de archivo personal
  getPreviewUrl: async (fileId) => {
    console.log('🔍 storageService.getPreviewUrl llamado con fileId:', fileId);
    const response = await api.get(`/storage/${fileId}/preview`);
    console.log('📥 Respuesta de getPreviewUrl:', response.data);
    return response.data;
  },
  getPersonalFileInfo: async (fileId) => {
    const response = await api.get(`/storage/${fileId}`);
    return response.data;
  },
};

export default storageService;