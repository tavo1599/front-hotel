<template>
  <div>
    <h2>Lista de Habitaciones</h2>

    <div v-if="loading">Cargando...</div>

    <div v-else-if="error" style="color: red;">{{ error }}</div>

    <div v-else>
      <ul v-if="rooms.length > 0">
        <li v-for="room in rooms" :key="room.id" class="list-item">
      <span>
        Habitación {{ room.room_number }} - {{ room.room_type }} - <strong>{{ room.status }}</strong>
      </span>
      <router-link :to="{ name: 'EditarHabitacion', params: { id: room.id } }" class="edit-button">
        Editar
      </router-link>
    </li>
      </ul>
      <p v-else>No hay habitaciones registradas.</p>
    </div>
    <router-link to="/habitaciones/nueva" class="add-button">
  + Añadir Habitación
</router-link>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api'; // <-- Importa el cliente centralizado

const rooms = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const response = await apiClient.get('rooms/'); // Usa el cliente centralizado
    rooms.value = response.data;
  } catch (err) {
    error.value = 'Error al cargar las habitaciones.';
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
      .add-button {
        display: inline-block;
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background-color: #28a745;
        color: white;
        text-decoration: none;
        border-radius: 5px;
      }
      .add-button:hover {
        background-color: #218838;
      }

      .list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #eee;
}
.edit-button {
  text-decoration: none;
  background-color: #ffc107;
  color: black;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}
    </style>

