import api from './api';

const authService = {
  // REGISTRO
  register: async (userData) => {
    const backendData = {
      nombre: userData.nombre,
      apellido: userData.apellidos,
      username: userData.username,
      email: userData.email,
      phone: userData.tel,
      password: userData.password,
      confirmPassword: userData.confirmPassword
    };
    
    const response = await api.post('/auth/register', backendData);
    return response.data;
  },

  // VERIFICAR CÓDIGO
  verify: async (email, code) => {
    const response = await api.post('/auth/verify', { email, code });
    return response.data;
  },

  // REENVIAR CÓDIGO
  resendCode: async (email) => {
    const response = await api.post('/auth/resend-code', { email });
    return response.data;
  },

  // LOGIN
  login: async (usernameOrEmail, password) => {
    const response = await api.post('/auth/login', { usernameOrEmail, password });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response.data;
  },

  // LOGOUT
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // OBTENER USUARIO ACTUAL
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  // OBTENER PERFIL (para después del login)
  getProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },

  // SOLICITAR RESETEO DE CONTRASEÑA (con método EMAIL o SMS)
  requestPasswordReset: async (email, method = 'SMS') => {
    const response = await api.post('/auth/password/reset/request', { email, method });
    return response.data;
  },

  // RESETEAR CON TOKEN (LINK) - No lo usas pero está por si acaso
  resetPasswordWithToken: async (token, newPassword, confirmPassword) => {
    const response = await api.post('/auth/password/reset/confirm', { 
      token, 
      newPassword, 
      confirmPassword 
    });
    return response.data;
  },

  // RESETEAR CON CÓDIGO MANUAL (SMS) - Este sí lo usas
  resetPasswordWithCode: async (email, code, newPassword, confirmPassword) => {
    const response = await api.post('/auth/password/reset/with-code', { 
      email, 
      code, 
      newPassword, 
      confirmPassword 
    });
    return response.data;
  },

  // REENVIAR CÓDIGO DE RECUPERACIÓN
  resendPasswordResetCode: async (email, method = 'SMS') => {
    const response = await api.post('/auth/password/reset/resend', { email, method });
    return response.data;
  }
};

export default authService;