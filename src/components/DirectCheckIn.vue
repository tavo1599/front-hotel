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
        :class="{ 'selected': selectedRoom && selectedRoom.id === room.id }"
        @click="selectRoom(room)"
      >
        <i class="card-icon" :class="getRoomIcon(room.room_type)"></i>
        <div class="card-number">{{ room.room_number }}</div>
        <div class="card-type">{{ room.room_type }}</div>
        <div class="card-price">${{ room.price_per_night }} / noche</div>
      </div>
    </div>
    <p v-if="!loading && availableRooms.length === 0" class="no-rooms-message">No hay habitaciones disponibles en este momento.</p>

    <div v-if="selectedRoom" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>Registrar en Habitación {{ selectedRoom.room_number }}</h3>
        
        <div class="form-group">
          <label class="form-label">Buscar Huésped Existente (por nombre o DNI):</label>
          <input v-model="searchQuery" @input="searchGuests" class="form-input" placeholder="Escribe para buscar..." />
          <ul v-if="searchResults.length > 0" class="search-results">
            <li v-for="guest in searchResults" :key="guest.id" @click="selectExistingGuest(guest)">
              {{ guest.first_name }} {{ guest.last_name }} - {{ guest.dni }}
            </li>
          </ul>
        </div>
        
        <form @submit.prevent="occupyRoom">
          <div v-if="!selectedGuest.id">
            <h4>O Registrar Nuevo Huésped</h4>

            <div class="form-group">
              <label class="form-label">DNI</label>
              <div class="dni-input-group">
                <input v-model="guestDetails.dni" type="text" class="form-input" placeholder="Número de DNI" required />
                <button @click.prevent="fetchDniData" class="dni-search-btn" :disabled="isFetchingDni">
                  <i v-if="!isFetchingDni" class="ri-search-line"></i>
                  <i v-else class="ri-loader-4-line spin"></i>
                </button>
              </div>
              <small v-if="dniError" style="color: red;">{{ dniError }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Nombres:</label>
              <input v-model="guestDetails.first_name" type="text" class="form-input" placeholder="Se completará automáticamente" required />
            </div>
            <div class="form-group">
              <label class="form-label">Apellidos:</label>
              <input v-model="guestDetails.last_name" type="text" class="form-input" placeholder="Se completará automáticamente" required />
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono (Opcional):</label>
              <input v-model="guestDetails.phone_number" type="text" class="form-input" />
            </div>
          </div>
          <div v-else class="selected-guest">
            <p>Huésped Seleccionado: <strong>{{ selectedGuest.name }}</strong></p>
          </div>

          <h4>Fechas de Estancia</h4>
          <input v-model="stayDetails.check_in_date" type="date" class="form-input" required />
          <input v-model="stayDetails.check_out_date" type="date" class="form-input" required />
          <input v-model="stayDetails.override_price" type="number" step="0.01" class="form-input" placeholder="Precio Especial (Opcional)" />

          <div class="form-group-inline">
  <input type="checkbox" v-model="stayDetails.is_paid" id="is_paid_direct" />
  <label for="is_paid_direct">Pago completo realizado</label>
</div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn cancel-btn">Cancelar</button>
            <button type="submit" class="btn submit-btn">Realizar Check-in</button>
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
import { useNotificationStore } from '@/stores/notification';
const notificationStore = useNotificationStore();

const availableRooms = ref([]);
const loading = ref(true);
const error = ref(null);
const formError = ref(null);

const selectedRoom = ref(null);
const guestDetails = ref({});
const stayDetails = ref({});

const searchQuery = ref('');
const searchResults = ref([]);
const selectedGuest = ref({});

// --- NUEVO ESTADO PARA LA CONSULTA DNI ---
const isFetchingDni = ref(false);
const dniError = ref(null);

// ... (fetchAvailableRooms, selectRoom, closeModal, etc. no cambian) ...

// --- NUEVA FUNCIÓN PARA CONSULTAR DNI ---
const fetchDniData = async () => {
  if (!guestDetails.value.dni || guestDetails.value.dni.length !== 8) {
    dniError.value = "Por favor, ingrese un DNI válido de 8 dígitos.";
    return;
  }

  isFetchingDni.value = true;
  dniError.value = null;

  try {
    // Ahora llamamos a nuestra propia API, que es segura
    const response = await apiClient.get(`utils/dni-lookup/?dni=${guestDetails.value.dni}`);

    // La respuesta de nuestra API es la misma que la de la API externa
    guestDetails.value.first_name = response.data.nombres;
    guestDetails.value.last_name = `${response.data.apellidoPaterno} ${response.data.apellidoMaterno}`;

  } catch (err) {
    dniError.value = "DNI no encontrado o error en la API.";
    console.error("Error en la API de DNI:", err);
  } finally {
    isFetchingDni.value = false;
  }
};

// Funciones
const fetchAvailableRooms = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get('rooms/?status=Disponible');
    availableRooms.value = response.data;
  } catch (err) {
    error.value = "Error al cargar las habitaciones disponibles.";
  } finally {
    loading.value = false;
  }
};

const selectRoom = (room) => {
  selectedRoom.value = room;
  stayDetails.value = { 
    check_in_date: new Date().toISOString().split('T')[0], 
    check_out_date: '', 
    override_price: null,
    is_paid: false 
  };
  guestDetails.value = { first_name: '', last_name: '', dni: '', phone_number: '' };
  selectedGuest.value = {};
  searchQuery.value = '';
  searchResults.value = [];
};

const closeModal = () => {
  selectedRoom.value = null;
};

const getRoomIcon = (roomType) => {
  switch (roomType) {
    case 'Sencilla': return 'ri-user-line';
    case 'Doble': return 'ri-group-line';
    case 'Suite': return 'ri-vip-crown-line';
    default: return 'ri-hotel-bed-line';
  }
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
  guestDetails.value = { first_name: '', last_name: '', dni: '', phone_number: '' };
  searchQuery.value = '';
  searchResults.value = [];
};

const occupyRoom = async () => {
  if (!selectedRoom.value) return;
  formError.value = null;

  const payload = {
    ...stayDetails.value,
    ...(selectedGuest.value.id ? { guest_id: selectedGuest.value.id } : guestDetails.value)
  };

  try {
    await apiClient.post(`rooms/${selectedRoom.value.id}/occupy/`, payload);
    
    // 1. Cierra el modal
    closeModal();
    // 2. Actualiza la lista de habitaciones disponibles
    await fetchAvailableRooms();
    // 3. Muestra la notificación de éxito
    notificationStore.addNotification({ message: 'Check-in realizado con éxito', type: 'success' });

  } catch (err) {
    formError.value = err.response?.data?.error || "Error al realizar el check-in.";
    notificationStore.addNotification({ message: formError.value || 'Error al realizar el check-in', type: 'error' });
    console.error(err);
  }
};


onMounted(fetchAvailableRooms);
</script>

<style scoped>
.form-group-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
/* Estilos para la nueva cuadrícula de habitaciones */
.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}
.room-card {
  background-color: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-borde);
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: var(--sombra-caja);
}
.room-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}
.room-card.selected {
  border-color: var(--color-primario);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.3);
  transform: translateY(-5px);
}
.card-icon {
  font-size: 2.5rem;
  color: var(--color-primario);
  margin-bottom: 0.5rem;
}
.card-number {
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-texto);
}
.card-type {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}
.card-price {
  font-size: 1.1rem;
  color: var(--color-texto);
  font-weight: 500;
}
.no-rooms-message {
  margin-top: 2rem;
  text-align: center;
  color: #6c757d;
}
.btn {
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.2s;
}

.cancel-btn {
  background-color: #6c757d; /* Gris */
  color: white;
}
.cancel-btn:hover {
  background-color: #5a6268;
}

.submit-btn {
  background-color: var(--color-primario); /* Azul */
  color: white;
}
.submit-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.dni-input-group {
  display: flex;
  gap: 0.5rem;
}
.dni-input-group .form-input {
  flex-grow: 1;
}
.dni-search-btn {
  border: 1px solid var(--color-borde);
  background-color: #f8f9fa;
  padding: 0 1rem;
  border-radius: 5px;
  cursor: pointer;
}
.dni-search-btn:disabled {
  cursor: not-allowed;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
} 
/* El resto de los estilos del Modal no cambian por ahora */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; }
.modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 500px; }
.modal-content input, .modal-content select { display: block; width: 100%; padding: 0.5rem; margin-bottom: 1rem; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
.search-results { list-style-type: none; padding: 0; margin: 0; border: 1px solid #ddd; border-top: none; max-height: 150px; overflow-y: auto; }
.search-results li { padding: 8px 12px; cursor: pointer; }
.search-results li:hover { background-color: #f0f0f0; }
.selected-guest { padding: 1rem; background-color: #e9f7ef; border-left: 5px solid #28a745; margin: 1rem 0; }
</style>