import axios from 'axios';

const API_URL = 'https://capara-ebf3cygrguhfaefv.mexicocentral-01.azurewebsites.net/api/';

const authHeader = () => {
  const user = JSON.parse(localStorage.getItem('user')); 
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  }
  return {};
};

// Llama al endpoint /api/search/suggest de tu Spring Boot
const suggestFiles = (query) => {
  return axios.get(`${API_URL}/suggest?q=${query}`, { headers: authHeader() });
};

// Llama al endpoint principal /api/search de tu Spring Boot
const searchFiles = (query, type = 'all', page = 0, size = 20) => {
  return axios.get(`${API_URL}search?q=${query}&type=${type}&page=${page}&size=${size}`, { headers: authHeader() });
};

export default {
  suggestFiles,
  searchFiles
};