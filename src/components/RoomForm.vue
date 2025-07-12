<template>
  <div>
    <h2>Añadir Nueva Habitación</h2>
    <form @submit.prevent="createRoom">
      <div class="form-group">
        <label>Número de Habitación:</label>
        <input type="text" v-model="newRoom.room_number" required>
      </div>
      <div class="form-group">
        <label>Tipo:</label>
        <select v-model="newRoom.room_type" required>
          <option value="Sencilla">Sencilla</option>
          <option value="Doble">Doble</option>
          <option value="Suite">Suite</option>
        </select>
      </div>
      <div class="form-group">
        <label>Precio por Noche:</label>
        <input type="number" step="0.01" v-model="newRoom.price_per_night" required>
      </div>
      <div class="form-group">
        <label>Foto de la Habitación:</label>
        <input type="file" @change="handleFileUpload">
      </div>
      <button type="submit">Crear Habitación</button>
    </form>
    <p v-if="error" style="color: red;">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/api'; // <-- Usa el cliente central

const router = useRouter();
const error = ref(null);
const roomImage = ref(null);
const newRoom = ref({
  room_number: '',
  room_type: 'Sencilla',
  price_per_night: 0,
});

const handleFileUpload = (event) => {
  roomImage.value = event.target.files[0];
};

const createRoom = async () => {
  const formData = new FormData();
  formData.append('room_number', newRoom.value.room_number);
  formData.append('room_type', newRoom.value.room_type);
  formData.append('price_per_night', newRoom.value.price_per_night);
  if (roomImage.value) {
    formData.append('image', roomImage.value);
  }

  try {
    // Aquí no usamos apiClient porque axios maneja 'multipart/form-data'
    // de forma especial, pero sí usaremos la misma lógica de interceptor
    // que configuramos en api.js, por lo que el token se añadirá.
    await apiClient.post('rooms/', formData, {
       headers: { 'Content-Type': 'multipart/form-data' }
    });
    router.push('/habitaciones');
  } catch (err) {
    error.value = 'Error al crear la habitación.';
    console.error(err);
  }
};
</script>