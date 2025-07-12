<template>
  <div>
    <h2>Check-in Directo (Walk-in)</h2>
    <p>Selecciona una habitación disponible para registrar a un nuevo huésped.</p>

    <div v-if="loading">Cargando habitaciones...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>

    <div v-else class="room-grid">
      <div
        v-for="room in availableRooms"
        :key="room.id"
        class="room-card"
        @click="selectRoom(room)"
      >
        <h3>Habitación {{ room.room_number }}</h3>
        <p>{{ room.room_type }}</p>
        <p><strong>${{ room.price_per_night }} / noche</strong></p>
      </div>
    </div>
    <p v-if="!loading && availableRooms.length === 0">No hay habitaciones disponibles en este momento.</p>

    <div v-if="selectedRoom" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>Registrar Huésped en Habitación {{ selectedRoom.room_number }}</h3>
        <form @submit.prevent="occupyRoom">
          <h4>Datos del Huésped</h4>
          <input v-model="guestDetails.first_name" placeholder="Nombres" required />
          <input v-model="guestDetails.last_name" placeholder="Apellidos" required />
          <input v-model="guestDetails.dni" placeholder="DNI" required />
          <input v-model="guestDetails.phone_number" placeholder="Teléfono (Opcional)" />
          <h4>Fechas de Estancia</h4>
          <input v-model="stayDetails.check_in_date" type="date" required />
          <input v-model="stayDetails.check_out_date" type="date" required />

          <div class="modal-actions">
            <button type="button" @click="closeModal">Cancelar</button>
            <button type="submit">Realizar Check-in</button>
          </div>
          <p v-if="formError" style="color: red; margin-top: 1rem;">{{ formError }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api'; // Lo usamos solo para el GET inicial
import axios from 'axios'; // Importamos axios directamente para el POST
import { useAuthStore } from '@/stores/auth'; // Importamos el store para el token

const availableRooms = ref([]);
const loading = ref(true);
const error = ref(null);
const formError = ref(null);

const selectedRoom = ref(null);
const guestDetails = ref({});
const stayDetails = ref({});

const fetchAvailableRooms = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get('rooms/?status=Disponible');
    availableRooms.value = response.data;
  } catch (err) {
    error.value = "Error al cargar las habitaciones disponibles.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const selectRoom = (room) => {
  selectedRoom.value = room;
  stayDetails.value.check_in_date = new Date().toISOString().split('T')[0];
  guestDetails.value = { first_name: '', last_name: '', dni: '', phone_number: '' };
};

const closeModal = () => {
  selectedRoom.value = null;
};

const occupyRoom = async () => {
  if (!selectedRoom.value) return;
  formError.value = null;

  const payload = { ...guestDetails.value, ...stayDetails.value };
  const authStore = useAuthStore();
  const token = authStore.token;

  try {
    // Correctly call axios.post with the data and then the config object
    await axios.post(
      `http://127.0.0.1:8000/api/rooms/${selectedRoom.value.id}/occupy/`,
      payload, // The data comes second
      { // The config object with headers comes third
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json' // Explicitly set the content type
        }
      }
    );
    closeModal();
    await fetchAvailableRooms();
  } catch (err) {
    formError.value = err.response?.data?.error || "Error al realizar el check-in.";
    console.error(err);
  }
};

onMounted(fetchAvailableRooms);
</script>

<style scoped>
.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}
.room-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.room-card:hover {
  border-color: #007bff;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}
.modal-content input {
  display: block;
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  box-sizing: border-box;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}
</style>