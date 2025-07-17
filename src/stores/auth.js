// src/stores/auth.js
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Obtenemos los datos guardados del navegador
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isSuperuser: (state) => state.user?.is_superuser === true,
    // Getters para acceder fácilmente a los datos
    hotelName: (state) => state.user?.hotel_name,
    userFullName: (state) => state.user?.full_name,
    username: (state) => state.user?.username,
  },
  actions: {
    async login(username, password) {
      try {
        const apiUrl = `${process.env.VUE_APP_API_BASE_URL}/api-token-auth/`;
        const response = await axios.post(apiUrl, {
          username: username,
          password: password
        });
        
        // Guardamos la respuesta completa en el state
        this.token = response.data.token;
        this.user = response.data.user;
        
        // Guardamos en el localStorage del navegador para que la sesión persista
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        return true;

      } catch (error) {
        this.logout(); // Limpia todo si el login falla
        console.error("Error en el login:", error);
        return false;
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
})