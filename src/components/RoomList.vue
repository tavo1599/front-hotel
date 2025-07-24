<template>
  <div>
    <div class="header">
      <h2>Panel de Habitaciones</h2>
      <button @click="openCreateModal" class="add-button">
        <i class="ri-add-line"></i> Añadir Habitación
      </button>
    </div>

    <div v-if="loading">Cargando habitaciones...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>

    <div v-else class="room-grid">
      <div v-for="room in rooms" :key="room.id" class="room-card">
        <div class="card-header" :class="`status-${room.status.toLowerCase()}`">
          {{ room.status }}
        </div>
        <!-- <img v-if="room.image" :src="room.image" class="card-image" alt="Habitación">
        <div v-else class="card-image-placeholder"><i class="ri-image-off-line"></i></div>-->
        <div class="card-image-placeholder">
          <i :class="getRoomIcon(room.room_type)" style="font-size: 3rem;"></i>
        </div>
        <div class="card-body">
          <h3 class="card-number">Habitación {{ room.room_number }}</h3>
          <p class="card-type">{{ room.room_type }}</p>
          <p class="card-price">${{ room.price_per_night }} / noche</p>
        </div>
           <div class="card-actions">
          <button @click="openEditModal(room)" class="action-icon-btn" title="Editar Habitación">
            <i class="ri-pencil-line"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Editar' : 'Añadir' }} Habitación</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Número:</label>
            <input v-model="currentRoom.room_number" type="text" class="form-input" required>
          </div>
          <div class="form-group">
            <label>Tipo:</label>
            <select v-model="currentRoom.room_type" class="form-input" required>
              <option>Sencilla</option>
              <option>Doble</option>
              <option>Suite</option>
            </select>
          </div>
          <div class="form-group">
            <label>Precio por Noche:</label>
            <input v-model="currentRoom.price_per_night" type="number" step="0.01" class="form-input" required>
          </div>
          <div class="form-group">
            <label>Estado:</label>
            <select v-model="currentRoom.status" class="form-input" required>
              <option>Disponible</option>
              <option>Ocupada</option>
              <option>Mantenimiento</option>
              <option>Limpieza</option>
              <option>Inspección</option>
            </select>
          </div>
          <div class="form-group">
            <label>Foto:</label>
            <input type="file" @change="handleFileUpload" class="form-input">
          </div>
          <p v-if="formError" style="color: red;">{{ formError }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn cancel-btn">Cancelar</button>
            <button type="submit" class="btn submit-btn">{{ isEditing ? 'Guardar Cambios' : 'Crear Habitación' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();
const rooms = ref([]);
const loading = ref(true);
const error = ref(null);

// Estado para el modal
const isModalOpen = ref(false);
const isEditing = ref(false);
const currentRoom = ref({});
const newImageFile = ref(null);
const formError = ref(null);

const loadRooms = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get('rooms/');
    rooms.value = response.data;
  } catch (err) {
    error.value = 'Error al cargar las habitaciones.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const getRoomIcon = (type) => {
  switch (type) {
    case 'Sencilla':
      return 'ri-hotel-bed-line';
    case 'Doble':
      return 'ri-hotel-line';
    case 'Suite':
      return 'ri-star-smile-line';
    default:
      return 'ri-question-line';
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  currentRoom.value = { room_type: 'Sencilla', status: 'Disponible' };
  newImageFile.value = null;
  formError.value = null;
  isModalOpen.value = true;
};

const openEditModal = (room) => {
  isEditing.value = true;
  // Clonamos el objeto para no modificar la lista directamente
  currentRoom.value = { ...room };
  newImageFile.value = null;
  formError.value = null;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const handleFileUpload = (event) => {
  newImageFile.value = event.target.files[0];
};

const handleSubmit = async () => {
  formError.value = null;
  const formData = new FormData();
  Object.keys(currentRoom.value).forEach(key => {
    if (key !== 'image' && currentRoom.value[key] !== null && currentRoom.value[key] !== undefined) {
      formData.append(key, currentRoom.value[key]);
    }
  });
  if (newImageFile.value) {
    formData.append('image', newImageFile.value);
  }

  try {
    if (isEditing.value) {
      await apiClient.patch(`rooms/${currentRoom.value.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Notificación de éxito
      notificationStore.addNotification({ message: 'Habitación actualizada con éxito', type: 'success' });
    } else {
      await apiClient.post('rooms/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Notificación de éxito
      notificationStore.addNotification({ message: 'Habitación creada con éxito', type: 'success' });
    }
    closeModal();
    await loadRooms();
  } catch (err) {
    formError.value = 'Error al guardar. Revisa los datos.';
    // Notificación de error
    notificationStore.addNotification({ message: 'Error al guardar la habitación', type: 'error' });
    console.error(err);
  }
};

onMounted(loadRooms);
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.add-button { background-color: var(--color-primario); color: white; border: none; padding: 8px 15px; border-radius: 5px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }

.room-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
  gap: 1.5rem; 
}
.room-card {
  background-color: var(--color-superficie);
  border-radius: var(--radio-borde);
  box-shadow: var(--sombra-caja);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}
.room-card:hover { 
  transform: translateY(-5px); 
  box-shadow: 0 10px 20px rgba(0,0,0,0.1); 
}
.card-header { 
  padding: 0.5rem 1rem; 
  color: white; 
  font-weight: bold; 
  text-align: center;
  text-transform: capitalize;
}
.card-header.status-disponible { background-color: #28a745; }
.card-header.status-ocupada { background-color: #dc3545; }
.card-header.status-limpieza { background-color: #ffc107; color: #333; }
.card-header.status-inspección { background-color: #17a2b8; }
.card-header.status-mantenimiento { background-color: #6c757d; }
.card-image { width: 100%; height: 150px; object-fit: cover; }
.card-image-placeholder { 
  width: 100%; 
  height: 150px; 
  background-color: #f0f0f0; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  font-size: 3rem; 
  color: #ccc; 
}
.card-body { padding: 1rem; flex-grow: 1; }
.card-number { margin: 0; font-size: 1.5rem; font-weight: 600; }
.card-type { color: #6c757d; }
.card-price { font-size: 1.2rem; font-weight: bold; margin-top: 0.5rem; }
.card-actions { 
  padding: 0.5rem 1rem; 
  text-align: right; 
  background-color: #f8f9fa; 
  border-top: 1px solid var(--color-borde); 
}
.action-icon-btn { 
  background: none; 
  border: none; 
  font-size: 1.2rem; 
  cursor: pointer; 
  color: #6c757d;
  padding: 0.5rem;
}
.action-icon-btn:hover { color: var(--color-primario); }

/* Estilos para el Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 2rem; border-radius: var(--radio-borde); width: 90%; max-width: 500px; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
.form-input { display: block; width: 100%; padding: 0.75rem; font-size: 1rem; border: 1px solid var(--color-borde); border-radius: 5px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
.btn { border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 1rem; }
.cancel-btn { background-color: #6c757d; color: white; }
.submit-btn { background-color: var(--color-primario); color: white; }
</style>