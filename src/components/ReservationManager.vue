<template>
  <div>
    <div class="header">
      <h2>Gestión de Reservas</h2>
      <button @click="openCreationModal" class="add-button">
        <i class="ri-add-line"></i> Nueva Reserva
      </button>
    </div>

    <div class="controls">
      <input 
        v-model="searchValue" 
        type="text" 
        class="search-input" 
        placeholder="Buscar por huésped o habitación..."
      >
      <select v-model="statusFilter" class="filter-select">
        <option value="">Todos los Estados</option>
        <option value="Pendiente">Pendiente</option>
        <option value="Confirmada">Confirmada</option>
        <option value="Completada">Completada</option>
        <option value="Cancelada">Cancelada</option>
      </select>
      <date-picker 
        v-model:value="dateFilter" 
        type="date" 
        range 
        placeholder="Filtrar por fecha de Check-in"
        format="DD/MM/YYYY"
        class="date-picker"
        lang="es"
      ></date-picker>
    </div>

    <div class="table-container">
      <EasyDataTable
        :headers="headers"
        :items="items"
        :loading="loading"
        theme-color="#007bff"
        table-class-name="custom-table"
        buttons-pagination
        rows-per-page-message="Filas por página"
        :rows-per-page="10"
        alternating
      >
        <template #item-status="{ status }">
          <span :class="['status-badge', status.toLowerCase()]">{{ status }}</span>
        </template>
        <template #item-actions="item">
          <router-link :to="{ name: 'DetalleReserva', params: { id: item.id } }" class="action-button">
            Ver Detalles
          </router-link>
        </template>
      </EasyDataTable>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>Crear Nueva Reserva</h3>
        <form @submit.prevent="createReservation">
          <div class="form-group">
            <label class="form-label">Buscar Huésped Existente</label>
            <div v-if="selectedGuest.id" class="guest-pill">
              <span><i class="ri-user-follow-fill"></i> {{ selectedGuest.name }}</span>
              <button @click="clearSelectedGuest" type="button" title="Quitar selección">&times;</button>
            </div>
            <div v-else>
              <input 
                type="text" 
                class="form-input" 
                v-model="guestSearchQuery"
                @input="searchGuests"
                placeholder="Buscar por nombre o DNI..."
              />
              <ul v-if="guestSearchResults.length > 0" class="search-results">
                <li v-for="guest in guestSearchResults" :key="guest.id" @click="selectGuest(guest)">
                  {{ guest.first_name }} {{ guest.last_name }} ({{ guest.dni }})
                </li>
              </ul>
            </div>
          </div>
          
          <div v-if="!selectedGuest.id && !showNewGuestForm" class="new-guest-prompt">
            <span>¿No encuentras al huésped?</span>
            <button @click="showNewGuestForm = true" type="button" class="btn-link">+ Registrar Nuevo Huésped</button>
          </div>

          <div v-if="showNewGuestForm">
            <h4>Datos del Nuevo Huésped</h4>
            <div class="form-group">
              <label class="form-label">DNI</label>
              <div class="dni-input-group">
                <input v-model="newGuestDetails.dni" type="text" class="form-input" placeholder="Número de DNI" required />
                <button @click.prevent="fetchDniData" class="dni-search-btn" :disabled="isFetchingDni">
                  <i v-if="!isFetchingDni" class="ri-search-line"></i>
                  <i v-else class="ri-loader-4-line spin"></i>
                </button>
              </div>
              <small v-if="dniError" style="color: red;">{{ dniError }}</small>
            </div>
            <div class="form-group">
              <label class="form-label">Nombres:</label>
              <input type="text" class="form-input" v-model="newGuestDetails.first_name" placeholder="Se completará automáticamente" required />
            </div>
            <div class="form-group">
              <label class="form-label">Apellidos:</label>
              <input type="text" class="form-input" v-model="newGuestDetails.last_name" placeholder="Se completará automáticamente" required />
            </div>
             <div class="form-group">
              <label class="form-label">Teléfono (Opcional):</label>
              <input v-model="newGuestDetails.phone_number" type="text" class="form-input" />
            </div>
          </div>

          <div v-if="selectedGuest.id || showNewGuestForm">
            <hr>
            <h4>Detalles de la Reserva</h4>
            <div class="form-group">
              <label class="form-label">Habitación Disponible</label>
              <select v-model="newReservation.room_id" required class="form-input">
                <option disabled value="">Selecciona una habitación</option>
                <option v-for="room in availableRooms" :key="room.id" :value="room.id">
                  N° {{ room.room_number }} - {{ room.room_type }}
                </option>
              </select>
            </div>
            <div class="date-group">
              <div class="form-group">
                <label class="form-label">Fecha de Check-in</label>
                <input type="date" v-model="newReservation.check_in_date" required class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">Fecha de Check-out</label>
                <input type="date" v-model="newReservation.check_out_date" required class="form-input">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Precio Especial (Opcional)</label>
              <input type="number" step="0.01" v-model="newReservation.override_price" placeholder="Precio normal por defecto" class="form-input" />
            </div>
            <div class="form-group-inline">
              <input type="checkbox" v-model="newReservation.is_paid" id="is_paid_reservation" />
              <label for="is_paid_reservation">Pago completo realizado</label>
            </div>
          </div>
          
          <p v-if="formError" class="error-text">{{ formError }}</p>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn cancel-btn">Cancelar</button>
            <button type="submit" class="btn submit-btn">Crear Reserva</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import apiClient from '@/api';
import EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import 'vue-datepicker-next/locale/es';
import { useNotificationStore } from '@/stores/notification'; // <-- 1. Importa el store

const notificationStore = useNotificationStore();

const items = ref([]);
const loading = ref(true);
const headers = [ { text: "Huésped", value: "guest.full_name", sortable: true }, { text: "Habitación", value: "room.room_number", sortable: true }, { text: "Check-in", value: "check_in_date", sortable: true }, { text: "Check-out", value: "check_out_date", sortable: true }, { text: "Estado", value: "status" }, { text: "Acciones", value: "actions", width: 120 }, ];
const searchValue = ref('');
const statusFilter = ref('');
const dateFilter = ref([]);
const isModalOpen = ref(false);
const formError = ref(null);
const guestList = ref([]);
const roomList = ref([]);
const guestSearchQuery = ref('');
const guestSearchResults = ref([]);
const selectedGuest = ref({});
const showNewGuestForm = ref(false);
const newGuestDetails = ref({ first_name: '', last_name: '', dni: '', phone_number: '' });
const newReservation = ref({});
const isFetchingDni = ref(false);
const dniError = ref(null);

const availableRooms = computed(() => roomList.value.filter(r => r.status === 'Disponible'));
let searchTimeout = null;

const loadData = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (searchValue.value) params.append('search', searchValue.value);
    if (statusFilter.value) params.append('status', statusFilter.value);
    if (dateFilter.value && dateFilter.value[0] && dateFilter.value[1]) {
      const dateAfter = new Date(dateFilter.value[0]).toISOString().split('T')[0];
      const dateBefore = new Date(dateFilter.value[1]).toISOString().split('T')[0];
      params.append('check_in_date_after', dateAfter);
      params.append('check_in_date_before', dateBefore);
    }
    const [reservationsResponse, guestsResponse, roomsResponse] = await Promise.all([
      apiClient.get(`reservations/?${params.toString()}`),
      apiClient.get('guests/'),
      apiClient.get('rooms/')
    ]);
    items.value = reservationsResponse.data.map(item => ({...item, guest: { ...item.guest, full_name: `${item.guest.first_name} ${item.guest.last_name}` } }));
    guestList.value = guestsResponse.data.map(g => ({...g, full_name: `${g.first_name} ${g.last_name}`}));
    roomList.value = roomsResponse.data;
  } catch (error) { console.error("Error al cargar los datos:", error); } 
  finally { loading.value = false; }
};

const openCreationModal = () => {
  newReservation.value = { room_id: "", check_in_date: '', check_out_date: '', override_price: null, guest_id: null, is_paid: false };
  formError.value = null;
  isModalOpen.value = true;
  showNewGuestForm.value = false;
  newGuestDetails.value = { first_name: '', last_name: '', dni: '', phone_number: '' };
  clearSelectedGuest();
};

const closeModal = () => { isModalOpen.value = false; };

watch(guestSearchQuery, (newValue) => {
  if (!newValue || newValue.length < 2) { guestSearchResults.value = []; return; }
  guestSearchResults.value = guestList.value.filter(guest => 
    guest.full_name.toLowerCase().includes(newValue.toLowerCase()) || 
    guest.dni.includes(newValue)
  );
});

const selectGuest = (guest) => {
  selectedGuest.value = guest;
  newReservation.value.guest_id = guest.id;
  guestSearchQuery.value = '';
  guestSearchResults.value = [];
};

const clearSelectedGuest = () => {
  selectedGuest.value = {};
  newReservation.value.guest_id = null;
  guestSearchQuery.value = '';
};

const fetchDniData = async () => {
  if (!newGuestDetails.value.dni || newGuestDetails.value.dni.length !== 8) {
    dniError.value = "Por favor, ingrese un DNI válido de 8 dígitos.";
    return;
  }
  isFetchingDni.value = true;
  dniError.value = null;
  try {
    const response = await apiClient.get(`utils/dni-lookup/?dni=${newGuestDetails.value.dni}`);
    newGuestDetails.value.first_name = response.data.nombres;
    newGuestDetails.value.last_name = `${response.data.apellidoPaterno} ${response.data.apellidoMaterno}`;
  } catch (err) {
    dniError.value = "DNI no encontrado o la API falló.";
    console.error("Error en la API de DNI:", err);
  } finally {
    isFetchingDni.value = false;
  }
};

const createReservation = async () => {
  formError.value = null;
  let guestIdToUse = newReservation.value.guest_id; // Obtiene el ID si se seleccionó un huésped

  try {
    // PASO 1: Si se está registrando un nuevo huésped, lo creamos primero.
    if (showNewGuestForm.value && newGuestDetails.value.dni) {
      const newGuestResponse = await apiClient.post('guests/', newGuestDetails.value);
      guestIdToUse = newGuestResponse.data.id;
      guestList.value.push(newGuestResponse.data);
    }

    // PASO 2: Verificamos que tengamos un ID de huésped.
    if (!guestIdToUse) {
      formError.value = "Debes seleccionar o registrar un huésped.";
      return;
    }
    
    // PASO 3: Preparamos los datos de la reserva.
    const reservationPayload = { ...newReservation.value, guest_id: guestIdToUse };
    
    // PASO 4: Creamos la reserva.
    await apiClient.post('reservations/', reservationPayload);
    
    // PASO 5: Si todo fue exitoso, mostramos la notificación de éxito.
    notificationStore.addNotification({ message: 'Reserva creada con éxito', type: 'success' });
    
    // Cerramos el modal y recargamos los datos.
    closeModal();
    await loadData();

  } catch (err) {
    // PASO 6: Si algo falla, mostramos la notificación de error.
    notificationStore.addNotification({ message: 'Error al crear la reserva', type: 'error' });
    formError.value = err.response?.data?.error || "Error al crear la reserva.";
    console.error(err);
  }
};

watch([statusFilter, dateFilter], loadData, { deep: true });
watch(searchValue, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadData, 300);
});

onMounted(loadData);
</script>

<style scoped>
.dni-input-group { display: flex; gap: 0.5rem; align-items: center; }
.dni-input-group .form-input { flex-grow: 1; }
.dni-search-btn { height: 46px; border: 1px solid var(--color-borde); background-color: #f8f9fa; padding: 0 1rem; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.dni-search-btn:disabled { cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
/* El resto de los estilos que ya tenías */
.form-group-inline { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; }
/* ... (todos los demás estilos que te proporcioné anteriormente) */

.form-group-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
/* Estilos para la tabla, controles y etiquetas de estado */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.add-button {
  background-color: var(--color-primario);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.controls .search-input {
  flex-grow: 1;
}
.controls input, .controls select, .date-picker {
  padding: 0.5rem;
  border: 1px solid var(--color-borde);
  border-radius: 5px;
  height: 38px;
}
.mx-datepicker {
  width: 250px !important;
}

.custom-table {
  --easy-table-header-font-size: 1rem;
  --easy-table-header-background-color: #f8f9fa;
  --easy-table-row-border: 1px solid var(--color-borde);
}
.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: white;
  font-weight: 500;
  text-transform: capitalize;
}
.status-badge.confirmada { background-color: #28a745; }
.status-badge.pendiente { background-color: #ffc107; color: black; }
.status-badge.completada { background-color: #6c757d; }
.status-badge.cancelada { background-color: #dc3545; }

.action-button {
  background-color: var(--color-primario);
  color: white;
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 0.8rem;
}

/* Estilos para el Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: var(--radio-borde);
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  max-height: 90vh;
  overflow-y: auto;
}
.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}
.form-group {
  margin-bottom: 1.25rem;
  position: relative;
}
.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
  color: #495057;
}
.form-input {
  display: block;
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 5px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus {
  outline: none;
  border-color: var(--color-primario);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}
.date-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
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
  background-color: #6c757d;
  color: white;
}
.cancel-btn:hover {
  background-color: #5a6268;
}
.submit-btn {
  background-color: var(--color-primario);
  color: white;
}
.submit-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.error-text {
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: -0.5rem;
}
.search-results {
  list-style-type: none;
  padding: 0;
  margin: 0;
  border: 1px solid #ddd;
  border-top: none;
  max-height: 150px;
  overflow-y: auto;
  position: absolute;
  background-color: white;
  width: 100%;
  z-index: 10;
  border-radius: 0 0 5px 5px;
  box-shadow: var(--sombra-caja);
}
.search-results li {
  padding: 8px 12px;
  cursor: pointer;
}
.search-results li:hover {
  background-color: #f0f0f0;
}
.guest-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #e0e7ff;
  color: #4338ca;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-weight: 500;
}
.guest-pill button {
  background: none;
  border: none;
  color: #4338ca;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
}
.guest-pill button:hover {
  opacity: 1;
}
.new-guest-prompt {
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 5px;
}
.btn-link {
  background: none;
  border: none;
  color: var(--color-primario);
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;
  font-weight: 600;
}

.table-container {
  background-color: var(--color-superficie);
  padding: 1rem;
  border-radius: var(--radio-borde);
  box-shadow: var(--sombra-caja);
  border: 1px solid var(--color-borde);
}

.custom-table {
  /* Variables de la librería para personalizar la tabla */
  --easy-table-border: none;
  --easy-table-row-border: 1px solid #e5e7eb;

  --easy-table-header-font-size: 0.9rem;
  --easy-table-header-background-color: transparent;
  --easy-table-header-font-color: #6c757d;
  --easy-table-header-height: 50px;

  --easy-table-body-row-height: 50px;
  --easy-table-body-row-font-size: 0.95rem;
  --easy-table-body-row-font-weight: 500;

  /* Color de las filas alternas (cebreado) */
  --easy-table-body-even-row-background-color: #f8f9fa;
  --easy-table-body-row-hover-background-color: #e9ecef;
}
</style>