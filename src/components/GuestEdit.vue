<template>
  <div>
    <h2>Editar Huésped</h2>
    <form v-if="guest" @submit.prevent="updateGuest">
      <div class="form-group">
        <label>Nombres:</label>
        <input v-model="guest.first_name" type="text" required />
      </div>
      <div class="form-group">
        <label>Apellidos:</label>
        <input v-model="guest.last_name" type="text" required />
      </div>
      <div class="form-group">
        <label>DNI:</label>
        <input v-model="guest.dni" type="text" required />
      </div>
      <div class="form-group">
        <label>Teléfono (Opcional):</label>
        <input v-model="guest.phone_number" type="text" />
      </div>
      <button type="submit">Guardar Cambios</button>
    </form>
    <p v-if="error" style="color: red;">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/api';

const route = useRoute();
const router = useRouter();
const guest = ref(null);
const error = ref(null);

const guestId = route.params.id;

onMounted(async () => {
  try {
    const response = await apiClient.get(`guests/${guestId}/`);
    guest.value = response.data;
  } catch (err) {
    error.value = 'Error al cargar los datos del huésped.';
    console.error(err);
  }
});

const updateGuest = async () => {
  error.value = null;
  try {
    await apiClient.put(`guests/${guestId}/`, guest.value);
    // Redirige de vuelta a la lista de huéspedes después de guardar
    router.push('/huespedes');
  } catch (err) {
    error.value = 'Error al actualizar el huésped.';
    console.error(err);
  }
};
</script>