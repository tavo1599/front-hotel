<template>
  <div>
    <h2>Crear Nueva Reserva</h2>
    <form @submit.prevent="createReservation">
      <div class="form-group">
        <label>Huésped:</label>
        <select v-model="newReservation.guest_id" required>
          <option v-for="guest in guests" :key="guest.id" :value="guest.id">
            {{ guest.first_name }} {{ guest.last_name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Habitación:</label>
        <select v-model="newReservation.room_id" required>
          <option v-for="room in availableRooms" :key="room.id" :value="room.id">
            N° {{ room.room_number }} - {{ room.room_type }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Fecha de Check-in:</label>
        <input type="date" v-model="newReservation.check_in_date" required>
      </div>
      <div class="form-group">
        <label>Fecha de Check-out:</label>
        <input type="date" v-model="newReservation.check_out_date" required>
      </div>
      <div class="form-group">
          <label>Precio Especial (Opcional):</label>
          <input type="number" step="0.01" v-model="newReservation.override_price" placeholder="Dejar en blanco para precio normal" />
        </div>
      <button type="submit">Crear Reserva</button>
    </form>
    <p v-if="formError" style="color: red;">{{ formError }}</p>

    <hr />

    <h2>Reservas Existentes</h2>
    <div v-if="loading">Cargando reservas...</div>
    <ul v-else-if="reservations.length > 0">
  <li v-for="res in reservations" :key="res.id">
    <router-link :to="{ name: 'DetalleReserva', params: { id: res.id } }">
      <strong>{{ res.guest.first_name }} {{ res.guest.last_name }}</strong> en Hab. {{ res.room.room_number }}
      <br>
      <small>Del {{ res.check_in_date }} al {{ res.check_out_date }} (Estado: {{ res.status }})</small>
    </router-link>
  </li>
  </ul>
    <p v-else>No hay reservas registradas.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/api'; // <-- Usa el cliente central

const reservations = ref([]);
const guests = ref([]);
const rooms = ref([]);
const loading = ref(true);
const formError = ref(null);

const newReservation = ref({
  guest_id: null,
  room_id: null,
  check_in_date: '',
  check_out_date: '',
  override_price: null // <-- Añadir
});

const availableRooms = computed(() => {
  return rooms.value.filter(room => room.status === 'Disponible');
});

const createReservation = async () => {
  formError.value = null;
  try {
    await apiClient.post('reservations/', newReservation.value); // <-- Llama a la API
    newReservation.value = { guest_id: null, room_id: null, check_in_date: '', check_out_date: '' };
    await loadInitialData();
  } catch (err) {
    formError.value = err.response?.data?.error || 'Error al crear la reserva.';
    console.error(err);
  }
};

const loadInitialData = async () => {
  loading.value = true;
  try {
    const [resResponse, guestsResponse, roomsResponse] = await Promise.all([
      apiClient.get('reservations/'), // <-- Llama a la API
      apiClient.get('guests/'),      // <-- Llama a la API
      apiClient.get('rooms/')        // <-- Llama a la API
    ]);
    reservations.value = resResponse.data;
    guests.value = guestsResponse.data;
    rooms.value = roomsResponse.data;
  } catch (error) {
    console.error("Error cargando datos iniciales:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadInitialData);
</script>