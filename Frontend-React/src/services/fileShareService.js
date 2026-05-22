import api from './api';

const fileShareService = {
  // Solicitar token SMS para archivo compartido
  requestSmsToken: async (shareId) => {
    const response = await api.post(`/files/${shareId}/request-token`);
    return response.data;
  },

  // Verificar token SMS para archivo compartido
  verifySmsToken: async (shareId, token) => {
    const response = await api.post(`/files/${shareId}/verify-token`, { token });
    return response.data;
  },

  // Verificar contraseña para archivo compartido
  verifyPassword: async (shareId, password) => {
    const response = await api.post(`/files/${shareId}/verify-password`, { password });
    return response.data;
  },

  // Ver archivo compartido
  viewFile: async (shareId) => {
    const response = await api.get(`/files/${shareId}/view`);
    return response.data;
  },

  // Descargar archivo compartido
  downloadFile: async (shareId) => {
    const response = await api.get(`/files/${shareId}/download`);
    return response.data;
  },

  // Obtener detalle de archivo compartido
  getFileDetails: async (shareId) => {
    const response = await api.get(`/files/${shareId}`);
    return response.data;
  },

  // Subir y compartir archivos nuevos (multipart)
  uploadAndShare: async (formData) => {
    const response = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Obtener archivos recibidos (bandeja de entrada)
  getReceivedFiles: async (page = 0, size = 20) => {
    const response = await api.get('/files/received', { params: { page, size } });
    return response.data;
  },

  // Obtener archivos enviados (bandeja de salida)
  getSentFiles: async (page = 0, size = 20) => {
    const response = await api.get('/files/sent', { params: { page, size } });
    return response.data;
  }
};

export default fileShareService;