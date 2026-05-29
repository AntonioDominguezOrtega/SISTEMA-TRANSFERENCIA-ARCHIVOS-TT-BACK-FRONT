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
  },
  // Buscar usuarios por cualquier identificador (email, username, teléfono)
  searchUsersByAny: async (query) => {
    const response = await api.get('/profile/search', { params: { query } });
    return response.data; // { results: [...] }
  },
  // Obtener URL para vista previa (solo lectura)
  getPreviewUrl: async (shareId) => {
    const response = await api.get(`/files/${shareId}/preview`);
    return response.data;
  },
  // fileShareService.js - Agrega este método

  // Obtener vista previa como BLOB (bytes) para PDFs
  getPreviewBlob: async (shareId) => {
    console.log('🔍 fileShareService.getPreviewBlob llamado con shareId:', shareId);
    try {
      const response = await api.get(`/files/${shareId}/preview`, {
        responseType: 'blob'
      });
      
      console.log('📥 Respuesta recibida, status:', response.status);
      console.log('📥 Content-Type:', response.headers['content-type']);
      
      // Extraer el nombre del archivo de los headers
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'archivo.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          fileName = match[1].replace(/['"]/g, '');
        }
      }
      
      const fileType = response.headers['content-type'] || 'application/pdf';
      
      return {
        blob: response.data,
        fileName: fileName,
        fileType: fileType
      };
    } catch (error) {
      console.error('❌ Error en getPreviewBlob:', error);
      throw error;
    }
  },
  // fileShareService.js - Agrega este método

  // Descargar archivo compartido como BLOB (bytes ya descifrados)
  downloadFileBlob: async (shareId) => {
    console.log('🔍 downloadFileBlob llamado con shareId:', shareId);
    try {
      const response = await api.get(`/files/${shareId}/download`, {
        responseType: 'blob'
      });
      
      console.log('📥 Respuesta recibida, status:', response.status);
      console.log('📥 Content-Type:', response.headers['content-type']);
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'archivo';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          fileName = match[1].replace(/['"]/g, '');
        }
      }
      
      const fileType = response.headers['content-type'] || 'application/octet-stream';
      
      return {
        blob: response.data,
        fileName: fileName,
        fileType: fileType
      };
    } catch (error) {
      console.error('❌ Error en downloadFileBlob:', error);
      throw error;
    }
  },
};

export default fileShareService;