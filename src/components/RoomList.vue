<template>
  <div>
    <div class="header">
      <h2>Lista de Habitaciones</h2>
      <router-link to="/habitaciones/nueva" class="add-button">
        + Añadir Habitación
      </router-link>
    </div>

    <div v-if="loading">Cargando...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>
    <ul v-else-if="rooms.length > 0" class="room-list">
      <li v-for="room in rooms" :key="room.id" class="list-item">
        <div class="image-container">
          <img v-if="room.image" :src="room.image" alt="Foto de la habitación" class="room-image">
          <div v-else class="room-image-placeholder">Sin Foto</div>
        </div>
        
        <div class="info-container">
          <span>Habitación {{ room.room_number }}</span>
          <small>{{ room.room_type }}</small>
        </div>

        <div class="status-container">
          <span :class="['status-badge', room.status.toLowerCase()]">{{ room.status }}</span>
        </div>

        <div class="actions-container">
          <router-link :to="{ name: 'EditarHabitacion', params: { id: room.id } }" class="edit-button">
            Editar
          </router-link>
        </div>
      </li>
    </ul>
    <p v-else>No hay habitaciones registradas.</p>
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
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.add-button {
  background-color: #007bff;
  color: white;
  padding: 8px 15px;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
}

.room-list {
  list-style-type: none;
  padding: 0;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  background-color: white;
}

.image-container, .room-image, .room-image-placeholder {
  width: 100px;
  height: 75px;
  border-radius: 5px;
}
.room-image {
  object-fit: cover;
}
.room-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #aaa;
  font-size: 0.8rem;
}

.info-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.info-container span {
  font-weight: bold;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: white;
  text-align: center;
  min-width: 90px;
}
.status-badge.disponible { background-color: #28a745; }
.status-badge.ocupada { background-color: #dc3545; }
.status-badge.limpieza { background-color: #ffc107; color: black; }
.status-badge.inspección { background-color: #17a2b8; }
.status-badge.mantenimiento { background-color: #6c757d; }

.actions-container {
  margin-left: auto;
}

.edit-button {
  text-decoration: none;
  background-color: #6c757d;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}
</style>

