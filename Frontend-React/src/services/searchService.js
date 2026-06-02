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
  return axios.get(`${API_URL}search?q=${encodeURIComponent(query)}&type=${type}&page=${page}&size=${size}`, { headers: authHeader() });
};

// Buscar con resultados completos que incluyan toda la metadata
const searchFilesComplete = (query, page = 0, size = 20) => {
  return axios.get(`${API_URL}search?q=${encodeURIComponent(query)}&type=all&page=${page}&size=${size}`, { headers: authHeader() });
};

// Búsqueda autocompletado (sugerencias) basadas en tu controlador Spring Boot
const suggestFiles = (query) => {
  return axios.get(`${API_URL}search/suggest?q=${encodeURIComponent(query)}`, { headers: authHeader() });
};

export default {
  searchFiles,
  searchFilesComplete,
  suggestFiles
};