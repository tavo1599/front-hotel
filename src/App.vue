<template>
  <div id="app">
    <nav v-if="authStore.isAuthenticated">
      <router-link to="/dashboard">Dashboard</router-link> |
      <router-link to="/check-in">Check-in Directo</router-link> |
      <router-link to="/habitaciones">Habitaciones</router-link> |
      <router-link to="/huespedes">Huéspedes</router-link> |
      <router-link to="/reservas">Reservas</router-link> |
      <router-link to="/inventario">Inventario</router-link> |
      <router-link to="/limpieza">Limpieza</router-link> |
      <router-link to="/personal">Personal</router-link>
      
      <button @click="handleLogout" class="logout-button">Cerrar Sesión</button>
    </nav>
    <main>
      <h1 v-if="route.name !== 'Login'">Sistema de Gestión Hotelera</h1>
      <router-view/>
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute(); // Para saber en qué ruta estamos

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style>
body {
  font-family: sans-serif;
  background-color: #f4f4f4;
}
#app {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}
nav {
  background-color: #333;
  padding: 1rem;
  text-align: center;
  border-radius: 8px;
  margin-bottom: 1rem;
}
nav a {
  color: white;
  text-decoration: none;
  font-weight: bold;
  padding: 0.5rem 1rem;
}
nav a.router-link-exact-active {
  background-color: #555;
  border-radius: 5px;
}
main {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
/* Estilo para el nuevo botón */
.logout-button {
  margin-left: auto; /* Empuja el botón a la derecha */
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}
.logout-button:hover {
  background-color: #c82333;
}
</style>