import axios from 'axios';

const API_URL = 'https://capara-ebf3cygrguhfaefv.mexicocentral-01.azurewebsites.net/api/';

const authHeader = () => {
  const user = JSON.parse(localStorage.getItem('user')); 
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  }
  return {};
};

// Buscar en todos los archivos del usuario
const searchFiles = (query, type = 'all', page = 0, size = 20) => {
  return axios.get(`${API_URL}search?q=${query}&type=${type}&page=${page}&size=${size}`, { headers: authHeader() });
};

// Buscar con resultados completos que incluyan toda la metadata
const searchFilesComplete = (query, page = 0, size = 20) => {
  return axios.get(`${API_URL}search?q=${query}&page=${page}&size=${size}`, { headers: authHeader() });
};

export default {
  searchFiles,
  searchFilesComplete
};