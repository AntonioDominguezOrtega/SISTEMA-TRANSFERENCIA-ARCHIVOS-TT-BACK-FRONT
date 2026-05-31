import axios from 'axios';

const API_URL = 'https://capara-ebf3cygrguhfaefv.mexicocentral-01.azurewebsites.net/api/';

const authHeader = () => {
  const user = JSON.parse(localStorage.getItem('user')); 
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  } else {
    return {};
  }
};

const getMyProfile = () => {
  return axios.get(API_URL + 'me', { headers: authHeader() });
};



const uploadProfilePhoto = (file) => {
  const formData = new FormData();
  formData.append('photo', file); 

  const headers = {
    ...authHeader(),
    'Content-Type': 'multipart/form-data'
  };

  return axios.post(API_URL + 'photo', formData, { headers });
};

const updateProfile = (profileData) => {
  return axios.put(API_URL + 'update', profileData, { headers: authHeader() });
};

const solicitarCambioTelefono = (nuevoTelefono) => {
  console.log("Enviando SMS a:", nuevoTelefono);
  return Promise.resolve({ data: { message: "SMS Enviado" } }); 
};

const verificarYGuardarTelefono = (nuevoTelefono, codigo) => {
  // Aquí apuntarás a tu endpoint real que verifica el token (ej. /api/auth/verify-sms)
  console.log("Verificando código", codigo, "para el número", nuevoTelefono);
  return Promise.resolve({ data: { message: "Teléfono verificado y actualizado" } });
};

const searchGlobalUsers = (query) => {
  return axios.get(`${API_URL}search?query=${query}`, { headers: authHeader() });
};

// Obtener la lista de mis contactos agregados
const getMyContacts = () => {
  return axios.get(`${API_URL}contacts`, { headers: authHeader() });
};

// Agregar un nuevo contacto a mi red
const addContact = (userId) => {
  return axios.post(`${API_URL}contacts/${userId}`, {}, { headers: authHeader() });
};

// Eliminar un contacto de mi red
const removeContact = (contactId) => {
  return axios.delete(`${API_URL}contacts/${contactId}`, { headers: authHeader() });
};

export default {
  getMyProfile,
  uploadProfilePhoto,
  updateProfile,
  solicitarCambioTelefono,
  verificarYGuardarTelefono,
  searchGlobalUsers,
  getMyContacts,
  addContact,
  removeContact
};