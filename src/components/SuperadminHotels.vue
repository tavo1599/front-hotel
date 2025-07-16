<template>
  <div>
    <div class="header">
      <h2>Gestión de Hoteles (Superadmin)</h2>
      <button @click="openCreateModal" class="add-button">
        <i class="ri-add-line"></i> Nuevo Hotel
      </button>
    </div>

    <div class="table-container">
      <EasyDataTable
        :headers="headers"
        :items="hotels"
        :loading="loading"
        table-class-name="custom-table"
        theme-color="#007bff"
        alternating
        buttons-pagination
      >
        <template #item-actions="item">
          <button @click="manageHotelAdmins(item)" class="action-button">
            Gestionar Admins
          </button>
        </template>
      </EasyDataTable>
    </div>

    <div v-if="isCreateModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>Crear Nuevo Hotel</h3>
        <form @submit.prevent="createHotel">
          <div class="form-group">
            <label class="form-label">Nombre del Hotel:</label>
            <input v-model="newHotel.name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Dirección:</label>
            <input v-model="newHotel.address" type="text" class="form-input" required />
          </div>
          <p v-if="formError" style="color: red;">{{ formError }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn cancel-btn">Cancelar</button>
            <button type="submit" class="btn submit-btn">Crear Hotel</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="isAdminModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>Administrador para {{ managingHotel.name }}</h3>
        <form @submit.prevent="createHotelAdmin">
          <p>Crea la cuenta para el administrador principal de este hotel.</p>
          <div class="form-group">
            <label class="form-label">Nombre de Usuario:</label>
            <input v-model="newAdmin.username" type="text" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña:</label>
            <input v-model="newAdmin.password" type="password" class="form-input" required>
          </div>
           <div class="form-group">
            <label class="form-label">Nombres (Opcional):</label>
            <input v-model="newAdmin.first_name" type="text" class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Apellidos (Opcional):</label>
            <input v-model="newAdmin.last_name" type="text" class="form-input">
          </div>
          <p v-if="formError" style="color: red;">{{ formError }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn cancel-btn">Cancelar</button>
            <button type="submit" class="btn submit-btn">Crear Administrador</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api';
import EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();
const hotels = ref([]);
const loading = ref(true);
const headers = [
  { text: "Nombre del Hotel", value: "name", sortable: true },
  { text: "Dirección", value: "address" },
  { text: "Acciones", value: "actions", width: 200 },
];
const isCreateModalOpen = ref(false);
const isAdminModalOpen = ref(false);
const newHotel = ref({ name: '', address: '' });
const newAdmin = ref({ username: '', password: '', first_name: '', last_name: '' });
const managingHotel = ref(null);
const formError = ref(null);

const loadHotels = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get('hotels/');
    hotels.value = response.data;
  } catch (error) { console.error("Error al cargar los hoteles:", error); } 
  finally { loading.value = false; }
};

const openCreateModal = () => {
  newHotel.value = { name: '', address: '' };
  formError.value = null;
  isCreateModalOpen.value = true;
};

const createHotel = async () => {
  formError.value = null;
  try {
    await apiClient.post('hotels/', newHotel.value);
    notificationStore.addNotification({ message: 'Hotel creado con éxito', type: 'success' });
    closeModal();
    await loadHotels();
  } catch (err) {
    formError.value = 'Error al crear el hotel.';
    notificationStore.addNotification({ message: 'Error al crear el hotel', type: 'error' });
    console.error(err);
  }
};

const manageHotelAdmins = (hotel) => {
  managingHotel.value = hotel;
  newAdmin.value = { username: '', password: '', first_name: '', last_name: '' };
  formError.value = null;
  isAdminModalOpen.value = true;
};

const createHotelAdmin = async () => {
  formError.value = null;
  try {
    const payload = {
      ...newAdmin.value,
      role: 'admin',
      hotel_id: managingHotel.value.id
    };
    await apiClient.post('staff/', payload);
    notificationStore.addNotification({ message: `Administrador creado para ${managingHotel.value.name}`, type: 'success' });
    closeModal();
  } catch (err) {
    formError.value = 'Error al crear el administrador.';
    notificationStore.addNotification({ message: 'Error al crear el administrador', type: 'error' });
    console.error(err);
  }
};

const closeModal = () => {
  isCreateModalOpen.value = false;
  isAdminModalOpen.value = false;
};

onMounted(loadHotels);
</script>

<style scoped>
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
.table-container {
  background-color: var(--color-superficie);
  padding: 1rem;
  border-radius: var(--radio-borde);
  box-shadow: var(--sombra-caja);
  border: 1px solid var(--color-borde);
}
.custom-table {
  --easy-table-border: none;
  --easy-table-row-border: 1px solid #e5e7eb;
  --easy-table-header-background-color: transparent;
  --easy-table-body-even-row-background-color: #f8f9fa;
}
.action-button {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
}
.action-button:hover {
  background-color: #5a6268;
}

/* --- ESTILOS PARA EL MODAL --- */
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
}
.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}
.form-group {
  margin-bottom: 1rem;
}
.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.form-input {
  display: block;
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 5px;
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
}
.cancel-btn {
  background-color: #6c757d;
  color: white;
}
.submit-btn {
  background-color: var(--color-primario);
  color: white;
}
</style>