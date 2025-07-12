<template>
  <div>
    <h2>Gestión de Limpieza</h2>
    <div v-if="loading">Cargando...</div>
    <div v-else class="housekeeping-layout">
      <div class="column">
        <h3>Pendiente de Limpieza</h3>
        <div v-for="room in roomsToClean" :key="room.id" class="task-card clean">
          <span>Habitación {{ room.room_number }}</span>
          <button @click="markAsCleaned(room.id)">Limpieza Terminada</button>
        </div>
        <p v-if="roomsToClean.length === 0">No hay habitaciones para limpiar.</p>
      </div>
      <div class="column">
        <h3>Pendiente de Inspección</h3>
        <div v-for="room in roomsToInspect" :key="room.id" class="task-card inspect">
          <span>Habitación {{ room.room_number }}</span>
          <button @click="markAsInspected(room.id)">Aprobar Inspección</button>
        </div>
        <p v-if="roomsToInspect.length === 0">No hay habitaciones para inspeccionar.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/api';

const allRooms = ref([]);
const loading = ref(true);

const roomsToClean = computed(() =>
  allRooms.value.filter(r => r && r.status && r.status.toLowerCase() === 'limpieza')
);

const roomsToInspect = computed(() =>
  allRooms.value.filter(r => r && r.status && r.status.toLowerCase() === 'inspección')
);

const loadTasks = async () => {
  loading.value = true;
  try {
    // La URL debe pedir ambos estados para que la página siempre esté actualizada
    const response = await apiClient.get('rooms/?status=Limpieza&status=Inspección');
    allRooms.value = response.data;

     // --- AÑADE ESTAS LÍNEAS DE DEPURACIÓN ---
    console.log("Datos recibidos de la API:", allRooms.value);
    console.log("Habitaciones filtradas para limpieza:", roomsToClean.value);
    // ------------------------------------

  } catch (error) {
    console.error("Error cargando tareas:", error);
  } finally {
    loading.value = false;
  }
};

const markAsCleaned = async (roomId) => {
  try {
    await apiClient.post(`rooms/${roomId}/finish_cleaning/`);
    await loadTasks();
  } catch (error) {
    alert("Error al actualizar el estado.");
  }
};

const markAsInspected = async (roomId) => {
  try {
    await apiClient.post(`rooms/${roomId}/pass_inspection/`);
    await loadTasks();
  } catch (error) {
    alert("Error al actualizar el estado.");
  }
};

onMounted(loadTasks);
</script>

<style scoped>
.housekeeping-layout { display: flex; gap: 2rem; }
.column { flex: 1; padding: 1rem; background-color: #f9f9f9; border-radius: 8px; }
.task-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem; margin-bottom: 0.5rem; border-radius: 5px; }
.task-card.clean { border-left: 5px solid #ffc107; }
.task-card.inspect { border-left: 5px solid #17a2b8; }
</style>