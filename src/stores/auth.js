// src/stores/auth.js
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(username, password) {
      try {
        const response = await axios.post('http://127.0.0.1:8000/api-token-auth/', {
          username: username,
          password: password
        });
        const token = response.data.token;
        this.token = token;
        localStorage.setItem('token', token);
        return true;
      } catch (error) {
        this.token = '';
        localStorage.removeItem('token');
        console.error("Error en el login:", error);
        return false;
      }
    },
    logout() {
      this.token = '';
      localStorage.removeItem('token');
    },
  },
})