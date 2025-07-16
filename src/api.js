// src/api.js
import axios from 'axios';
import { useAuthStore } from './stores/auth';

const apiClient = axios.create({
  baseURL: 'https://hotel-api-j309.onrender.com/api/' 
});

// Interceptor para añadir el token a cada petición
apiClient.interceptors.request.use(config => {
  const authStore = useAuthStore();
  const token = authStore.token;
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default apiClient;