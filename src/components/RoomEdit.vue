<template>
  <div>
    <h2>Editar Habitación</h2>
    <form v-if="room" @submit.prevent="updateRoom">
      <div class="form-group">
        <label>Número de Habitación:</label>
        <input type="text" v-model="room.room_number" required>
      </div>
      <div class="form-group">
        <label>Tipo:</label>
        <select v-model="room.room_type" required>
          <option value="Sencilla">Sencilla</option>
          <option value="Doble">Doble</option>
          <option value="Suite">Suite</option>
        </select>
      </div>
      <div class="form-group">
        <label>Precio por Noche:</label>
        <input type="number" step="0.01" v-model="room.price_per_night" required>
      </div>
       <div class="form-group">
        <label>Estado:</label>
        <select v-model="room.status" required>
          <option value="Disponible">Disponible</option>
          <option value="Ocupada">Ocupada</option>
          <option value="Mantenimiento">Mantenimiento</option>
          <option value="Limpieza">Limpieza</option>
        </select>
      </div>
      <div class="form-group">
        <label>Foto Actual:</label>
        <img v-if="room.image" :src="room.image" alt="Foto de la habitación" width="150">
        <p v-else>No hay foto.</p>
        <label>Cambiar Foto:</label>
        <input type="file" @change="handleFileUpload">
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
const room = ref(null);
const error = ref(null);
const newImage = ref(null);

const roomId = route.params.id;

onMounted(async () => {
  try {
    const response = await apiClient.get(`rooms/${roomId}/`);
    room.value = response.data;
  } catch (err) {
    error.value = 'Error al cargar los datos de la habitación.';
  }
});

const handleFileUpload = (event) => {
  newImage.value = event.target.files[0];
};

const updateRoom = async () => {
  error.value = null;
  const formData = new FormData();
  formData.append('room_number', room.value.room_number);
  formData.append('room_type', room.value.room_type);
  formData.append('price_per_night', room.value.price_per_night);
  formData.append('status', room.value.status);
  if (newImage.value) {
    formData.append('image', newImage.value);
  }

  try {
    // Usamos PATCH para actualizar, es más eficiente que PUT
    await apiClient.patch(`rooms/${roomId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    router.push('/habitaciones');
  } catch (err) {
    error.value = 'Error al actualizar la habitación.';
  }
};
</script>