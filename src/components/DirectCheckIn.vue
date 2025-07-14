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
        <h3>Registrar en Habitación {{ selectedRoom.room_number }}</h3>
        
        <div class="form-group">
          <label>Buscar Huésped Existente (por nombre o DNI):</label>
          <input v-model="searchQuery" @input="searchGuests" placeholder="Escribe para buscar..." />
          <ul v-if="searchResults.length > 0" class="search-results">
            <li v-for="guest in searchResults" :key="guest.id" @click="selectExistingGuest(guest)">
              {{ guest.first_name }} {{ guest.last_name }} - {{ guest.dni }}
            </li>
          </ul>
        </div>
        
        <form @submit.prevent="occupyRoom">
          <div v-if="!selectedGuest.id">
            <h4>O Registrar Nuevo Huésped</h4>
            <input v-model="guestDetails.first_name" placeholder="Nombres" required />
            <input v-model="guestDetails.last_name" placeholder="Apellidos" required />
            <input v-model="guestDetails.dni" placeholder="DNI" required />
            <input v-model="guestDetails.phone_number" placeholder="Teléfono (Opcional)" />
          </div>
          <div v-else class="selected-guest">
            <p>Huésped Seleccionado: <strong>{{ selectedGuest.name }}</strong></p>
          </div>

          <h4>Fechas de Estancia</h4>
          <input v-model="stayDetails.check_in_date" type="date" required />
          <input v-model="stayDetails.check_out_date" type="date" required />
          <input v-model="stayDetails.override_price" type="number" step="0.01" placeholder="Precio Especial (Opcional)" />

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
import apiClient from '@/api';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';

const availableRooms = ref([]);
const loading = ref(true);
const error = ref(null);
const formError = ref(null);

const selectedRoom = ref(null);
const guestDetails = ref({});
const stayDetails = ref({});

// Nuevas variables para la búsqueda
const searchQuery = ref('');
const searchResults = ref([]);
const selectedGuest = ref({});

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
  // Resetea todo al seleccionar una nueva habitación
  selectedRoom.value = room;
  stayDetails.value = { check_in_date: new Date().toISOString().split('T')[0], check_out_date: '', override_price: null };
  guestDetails.value = { first_name: '', last_name: '', dni: '', phone_number: '' };
  selectedGuest.value = {};
  searchQuery.value = '';
  searchResults.value = [];
};

const closeModal = () => {
  selectedRoom.value = null;
};

const searchGuests = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  try {
    const response = await apiClient.get(`guests/?search=${searchQuery.value}`);
    searchResults.value = response.data;
  } catch (err) {
    console.error("Error buscando huéspedes:", err);
  }
};

const selectExistingGuest = (guest) => {
  selectedGuest.value = { id: guest.id, name: `${guest.first_name} ${guest.last_name}` };
  // Limpia el formulario de nuevo huésped y la búsqueda
  guestDetails.value = { first_name: '', last_name: '', dni: '', phone_number: '' };
  searchQuery.value = '';
  searchResults.value = [];
};

const occupyRoom = async () => {
  if (!selectedRoom.value) return;
  formError.value = null;

  // El payload ahora puede contener un ID de huésped o los detalles de uno nuevo
  const payload = {
    ...stayDetails.value,
    ...(selectedGuest.value.id ? { guest_id: selectedGuest.value.id } : guestDetails.value)
  };

  const authStore = useAuthStore();
  const token = authStore.token;

  try {
    await axios.post(
      `http://127.0.0.1:8000/api/rooms/${selectedRoom.value.id}/occupy/`,
      payload,
      {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
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