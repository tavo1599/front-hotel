<template>
  <div>
    <h2>Añadir Nuevo Huésped</h2>
    <form @submit.prevent="addGuest">
      <div class="form-group">
        <label>Nombres:</label>
        <input v-model="newGuest.first_name" type="text" required />
      </div>
      <div class="form-group">
        <label>Apellidos:</label>
        <input v-model="newGuest.last_name" type="text" required />
      </div>
      <div class="form-group">
        <label>DNI:</label>
        <input v-model="newGuest.dni" type="text" required />
      </div>
      <div class="form-group">
            <label>Teléfono (Opcional):</label>
            <input v-model="newGuest.phone_number" type="text" />
    </div>
      <button type="submit">Añadir Huésped</button>
    </form>
    <p v-if="formError" style="color: red;">{{ formError }}</p>

    <hr />

    <h2>Lista de Huéspedes</h2>
    <div v-if="loading">Cargando...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>
    <div v-else>
      <ul v-if="guests.length > 0">
         <li v-for="guest in guests" :key="guest.id" class="guest-item">
    <span>
        {{ guest.first_name }} {{ guest.last_name }} (DNI: {{ guest.dni }})
    </span>
    <div class="actions">
    <router-link :to="{ name: 'HistorialHuesped', params: { id: guest.id } }" class="history-button">
      Historial
    </router-link>
    <router-link :to="{ name: 'EditarHuesped', params: { id: guest.id } }" class="edit-button">
      Editar
    </router-link>
  </div>
  </li>
      </ul>
      <p v-else>No hay huéspedes registrados.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api'; // <-- Usa el cliente central

const guests = ref([]);
const loading = ref(true);
const error = ref(null);
const formError = ref(null);

const newGuest = ref({
  first_name: '',
  last_name: '',
  dni: '',
  phone_number: ''
});

const fetchGuests = async () => {
  try {
    loading.value = true;
    const response = await apiClient.get('guests/'); // <-- Llama a la API
    guests.value = response.data;
    error.value = null;
  } catch (err) {
    error.value = 'Error al cargar los huéspedes.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const addGuest = async () => {
  try {
    formError.value = null;
    await apiClient.post('guests/', newGuest.value); // <-- Llama a la API
    newGuest.value = { first_name: '', last_name: '', dni: '', phone_number: '' };
    await fetchGuests();
  } catch (err) {
    formError.value = 'Error al añadir el huésped. Revisa los datos.';
    console.error(err);
  }
};

onMounted(fetchGuests);
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.25rem;
}
input {
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
}
hr {
  margin: 2rem 0;
}

.guest-item {
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

.actions {
  display: flex;
  gap: 0.5rem;
}
.history-button {
  text-decoration: none;
  background-color: #17a2b8;
  color: white;
  /* ... otros estilos ... */
}
</style>