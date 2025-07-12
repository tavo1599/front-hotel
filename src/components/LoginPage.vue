<template>
  <div class="login-container">
    <h2>Iniciar Sesión</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Usuario:</label>
        <input type="text" v-model="username" required>
      </div>
      <div class="form-group">
        <label>Contraseña:</label>
        <input type="password" v-model="password" required>
      </div>
      <button type="submit">Entrar</button>
    </form>
    <p v-if="error" style="color: red;">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const error = ref(null);
const authStore = useAuthStore();
const router = useRouter();

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
.login-container {
  max-width: 400px;
  margin: 5rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
</style>