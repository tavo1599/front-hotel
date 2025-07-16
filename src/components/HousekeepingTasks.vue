<template>
  <div>
    <div class="header">
      <h2>Operaciones de Limpieza</h2>
      <p class="subtitle">Tablero de estado para el personal de housekeeping.</p>
    </div>

    <div v-if="loading" class="loading-state">Cargando tareas...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else class="task-board">
      
      <div class="task-column">
        <div class="column-header">
          <h3>Pendiente de Limpieza</h3>
          <span class="task-count">{{ roomsToClean.length }}</span>
        </div>
        <transition-group name="task-list" tag="div" class="task-list">
          <div v-for="room in roomsToClean" :key="room.id" class="task-card status-limpieza">
            <div class="card-info">
              <i class="ri-hotel-bed-line card-icon"></i>
              <div>
                <div class="room-number">Habitación {{ room.room_number }}</div>
                <div class="room-type">{{ room.room_type }}</div>
              </div>
            </div>
            <button @click="markAsCleaned(room.id)" class="action-btn clean-btn">
              Limpieza Terminada
            </button>
          </div>
        </transition-group>
        <p v-if="roomsToClean.length === 0" class="empty-message">No hay habitaciones para limpiar.</p>
      </div>
      
      <div class="task-column">
        <div class="column-header">
          <h3>Pendiente de Inspección</h3>
          <span class="task-count">{{ roomsToInspect.length }}</span>
        </div>
        <transition-group name="task-list" tag="div" class="task-list">
          <div v-for="room in roomsToInspect" :key="room.id" class="task-card status-inspección">
            <div class="card-info">
              <i class="ri-search-eye-line card-icon"></i>
              <div>
                <div class="room-number">Habitación {{ room.room_number }}</div>
                <div class="room-type">{{ room.room_type }}</div>
              </div>
            </div>
            <button @click="markAsInspected(room.id)" class="action-btn inspect-btn">
              Aprobar Inspección
            </button>
          </div>
        </transition-group>
        <p v-if="roomsToInspect.length === 0" class="empty-message">No hay habitaciones para inspeccionar.</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/api';

const allRooms = ref([]);
const loading = ref(true);
const error = ref(null);

// Las propiedades computed separan las habitaciones en sus columnas correspondientes
const roomsToClean = computed(() => allRooms.value.filter(r => r.status === 'Limpieza'));
const roomsToInspect = computed(() => allRooms.value.filter(r => r.status === 'Inspección'));

const loadTasks = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await apiClient.get('rooms/?status=Limpieza&status=Inspección');
    allRooms.value = response.data;
  } catch (err) {
    error.value = "Error al cargar las tareas de limpieza.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const markAsCleaned = async (roomId) => {
  try {
    await apiClient.post(`rooms/${roomId}/finish_cleaning/`);
    // En lugar de recargar todo, movemos la habitación localmente para una UI más rápida
    const roomIndex = allRooms.value.findIndex(r => r.id === roomId);
    if (roomIndex !== -1) {
      allRooms.value[roomIndex].status = 'Inspección';
    }
  } catch (error) {
    alert("Error al actualizar el estado.");
  }
};

const markAsInspected = async (roomId) => {
  try {
    await apiClient.post(`rooms/${roomId}/pass_inspection/`);
    // La quitamos de la lista para una UI más rápida
    allRooms.value = allRooms.value.filter(r => r.id !== roomId);
  } catch (error) {
    alert("Error al actualizar el estado.");
  }
};

onMounted(loadTasks);
</script>

<style scoped>
.header { margin-bottom: 2rem; }
.header h2 { margin: 0; }
.subtitle { color: #6c757d; }

.task-board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.task-column {
  background-color: #f0f2f5;
  border-radius: var(--radio-borde);
  padding: 1rem;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.5rem 1rem 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1rem;
}
.column-header h3 {
  margin: 0;
  font-size: 1.1rem;
}
.task-count {
  background-color: #e2e8f0;
  color: #4a5568;
  font-weight: bold;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.9rem;
}

.task-card {
  background-color: var(--color-superficie);
  border-radius: 5px;
  box-shadow: var(--sombra-caja);
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 5px solid;
}
.task-card.status-limpieza { border-color: #ffc107; }
.task-card.status-inspección { border-color: #17a2b8; }

.card-info { display: flex; align-items: center; gap: 1rem; }
.card-icon { font-size: 1.5rem; color: #4a5568; }
.room-number { font-weight: 600; }
.room-type { font-size: 0.85rem; color: #6c757d; }

.action-btn {
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}
.clean-btn { background-color: #ffc107; color: #333; }
.clean-btn:hover { background-color: #e0a800; }
.inspect-btn { background-color: #17a2b8; color: white; }
.inspect-btn:hover { background-color: #117a8b; }

.empty-message {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
}

/* Animaciones para la lista */
.task-list-move,
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.5s ease;
}
.task-list-enter-from,
.task-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.task-list-leave-active {
  position: absolute;
}

/* Diseño Responsivo */
@media (max-width: 900px) {
  .task-board {
    grid-template-columns: 1fr; /* Una columna en pantallas más pequeñas */
  }
}
</style>