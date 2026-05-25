import api from './api';

const dashboardService = {
  // ========== ARCHIVOS RECIBIDOS (solo compartidos conmigo) ==========
  getReceivedFiles: async (page = 0, size = 50) => {
    const response = await api.get('/storage/shared-with-me', { params: { page, size } });
    return response.data; // { files: [] }
  },

  // ========== ARCHIVOS ENVIADOS (solo compartidos por mí) ==========
  getSentFiles: async (page = 0, size = 50) => {
    const response = await api.get('/storage/shared-by-me', { params: { page, size } });
    return response.data;
  },

  // ========== MI UNIDAD (solo archivos personales, NO compartidos) ==========
  getMyStorage: async (folderId = null) => {
    if (!folderId || folderId === 'root') {
      const response = await api.get('/storage/root');
      // El backend debe devolver SOLO archivos donde isPersonal = true
      return response.data;
    }
    const response = await api.get(`/storage/folder/${folderId}`);
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

  restoreItem: async (itemId) => {
    const response = await api.post(`/storage/${itemId}/restore`);
    return response.data;
  },

  permanentDelete: async (itemId) => {
    const response = await api.delete(`/storage/${itemId}/permanent`);
    return response.data;
  },

  deleteItem: async (itemId) => {
    const response = await api.delete(`/storage/${itemId}`);
    return response.data;
  },

  createFolder: async (name, parentFolderId = null, color = null) => {
    const { default: storageService } = await import('./storageService');
    return storageService.createFolder(name, parentFolderId, color);
  },

  downloadPersonalFile: async (fileId) => {
    const response = await api.get(`/storage/${fileId}/download`);
    return response.data;
  },

  openPersonalFile: async (fileId) => {
    const response = await api.get(`/storage/${fileId}/open`);
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
  }
};

export default dashboardService;