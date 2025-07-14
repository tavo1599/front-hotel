<template>
  <div class="login-page">
    <div class="login-card">
      <h2>Iniciar Sesión</h2>
      <p class="subtitle">Bienvenido al Sistema de Gestión</p>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <input type="text" v-model="username" required placeholder="Usuario">
        </div>
        <div class="input-group">
          <input type="password" v-model="password" required placeholder="Contraseña">
        </div>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        
        <button type="submit" class="login-button">Entrar</button>
      </form>
    </div>
    <footer class="login-footer">
      &copy; {{ currentYear }} Manis'dev. Todos los derechos reservados.
    </footer>

    <div class="version-tag">
      v1.0.0
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const error = ref(null);
const authStore = useAuthStore();
const router = useRouter();
const currentYear = computed(() => new Date().getFullYear());

const handleLogin = async () => {
  error.value = null;
  const success = await authStore.login(username.value, password.value);
  if (success) {
    router.push('/habitaciones'); // Redirige a habitaciones si el login es exitoso
  } else {
    error.value = 'Usuario o contraseña incorrectos.';
  }
};
</script>

<style scoped>
/* Importamos la nueva fuente */
@import url('@/assets/fonts.css');

.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-image: url('@/assets/login-bg.jpg');
  background-size: cover;
  background-position: center;
  font-family: 'Poppins', sans-serif;
}

.login-card {
  width: 400px;
  padding: 40px;
  text-align: center;
  color: white;
  
  /* --- El Efecto "Glassmorphism" --- */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* Para compatibilidad */
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

h2 {
  font-weight: 600;
  font-size: 2rem;
  margin-bottom: 10px;
}

.subtitle {
  font-weight: 300;
  margin-bottom: 30px;
  opacity: 0.8;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group input {
  width: 100%;
  padding: 15px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  color: white;
  font-size: 1rem;
}

.input-group input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.input-group input:focus {
  outline: none;
  border-color: rgba(0, 195, 255, 0.8);
}

.login-button {
  padding: 15px;
  border-radius: 10px;
  border: none;
  background-color: #00c3ff;
  color: #1a1a2e;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.login-button:hover {
  background-color: #00a8e0;
  transform: translateY(-2px);
}

.error-message {
  color: #ff8a80; /* Un rojo más suave para el modo oscuro */
  margin-top: 15px;
}

.login-footer {
  position: absolute; /* Posición relativa al contenedor .login-page */
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.7); /* Blanco semitransparente para que se vea bien */
  font-size: 0.9rem;
}

.version-tag {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 3px 8px;
  font-size: 0.75rem;
  border-radius: 5px;
  z-index: 1000;
}


</style>