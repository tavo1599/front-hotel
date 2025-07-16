<template>
  <div>
    <div class="header">
      <h2>Gestión de Huéspedes</h2>
      <button @click="openCreateModal" class="add-button">
        <i class="ri-user-add-line"></i> Añadir Huésped
      </button>
    </div>

    <div class="controls">
      <input 
        v-model="searchValue" 
        type="text" 
        class="search-input" 
        placeholder="Buscar por nombre, apellido o DNI..."
      >
    </div>

    <div class="table-container">
      <EasyDataTable
        :headers="headers"
        :items="guests"
        :loading="loading"
        table-class-name="custom-table"
        buttons-pagination
        alternating
      >
        <template #item-actions="item">
          <div class="actions-wrapper">
            <button @click="openEditModal(item)" class="action-icon-btn" title="Editar Huésped">
              <i class="ri-pencil-line"></i>
            </button>
            <router-link :to="{ name: 'HistorialHuesped', params: { id: item.id } }" class="action-icon-btn" title="Ver Historial">
              <i class="ri-history-line"></i>
            </router-link>
          </div>
        </template>
      </EasyDataTable>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Editar' : 'Añadir' }} Huésped</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">DNI</label>
            <div class="dni-input-group">
              <input v-model="currentGuest.dni" type="text" class="form-input" placeholder="Número de DNI" required />
              <button @click.prevent="fetchDniData" class="dni-search-btn" :disabled="isFetchingDni">
                <i v-if="!isFetchingDni" class="ri-search-line"></i>
                <i v-else class="ri-loader-4-line spin"></i>
              </button>
            </div>
            <small v-if="dniError" style="color: red;">{{ dniError }}</small>
          </div>

          <div class="form-group">
            <label class="form-label">Nombres:</label>
            <input v-model="currentGuest.first_name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Apellidos:</label>
            <input v-model="currentGuest.last_name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono (Opcional):</label>
            <input v-model="currentGuest.phone_number" type="text" class="form-input" />
          </div>
          <p v-if="formError" style="color: red;">{{ formError }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn cancel-btn">Cancelar</button>
            <button type="submit" class="btn submit-btn">{{ isEditing ? 'Guardar Cambios' : 'Añadir Huésped' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiClient from '@/api';
import EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();
const guests = ref([]);
const loading = ref(true);
const headers = [ { text: "Nombres", value: "first_name", sortable: true }, { text: "Apellidos", value: "last_name", sortable: true }, { text: "DNI", value: "dni", sortable: true }, { text: "Teléfono", value: "phone_number" }, { text: "Acciones", value: "actions", width: 120 }, ];
const searchValue = ref('');
const isModalOpen = ref(false);
const isEditing = ref(false);
const currentGuest = ref({});
const formError = ref(null);

// --- Estado para la Consulta DNI ---
const isFetchingDni = ref(false);
const dniError = ref(null);

let searchTimeout = null;


const loadGuests = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (searchValue.value) {
      params.append('search', searchValue.value);
    }
    const response = await apiClient.get(`guests/?${params.toString()}`);
    guests.value = response.data;
  } catch (error) {
    console.error("Error al cargar los huéspedes:", error);
  } finally {
    loading.value = false;
  }
};

watch(searchValue, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadGuests();
  }, 300);
});

const openCreateModal = () => {
  isEditing.value = false;
  currentGuest.value = { first_name: '', last_name: '', dni: '', phone_number: '' };
  formError.value = null;
  dniError.value = null;
  isModalOpen.value = true;
};

const openEditModal = (guest) => {
  isEditing.value = true;
  currentGuest.value = { ...guest };
  formError.value = null;
  dniError.value = null;
  isModalOpen.value = true;
};

const closeModal = () => { isModalOpen.value = false; };

const handleSubmit = async () => {
  formError.value = null;
  try {
    if (isEditing.value) {
      await apiClient.put(`guests/${currentGuest.value.id}/`, currentGuest.value);
      // Muestra notificación de éxito
      notificationStore.addNotification({ message: 'Huésped actualizado con éxito', type: 'success' });
    } else {
      await apiClient.post('guests/', currentGuest.value);
      // Muestra notificación de éxito
      notificationStore.addNotification({ message: 'Huésped creado con éxito', type: 'success' });
    }
    closeModal();
    await loadGuests();
  } catch (err) {
    formError.value = 'Error al guardar. Revisa los datos.';
    // Muestra notificación de error
    notificationStore.addNotification({ message: 'Error al guardar el huésped', type: 'error' });
    console.error(err);
  }
};

// --- Función para Consultar DNI ---
const fetchDniData = async () => {
  if (!currentGuest.value.dni || currentGuest.value.dni.length !== 8) {
    dniError.value = "Por favor, ingrese un DNI válido de 8 dígitos.";
    return;
  }
  isFetchingDni.value = true;
  dniError.value = null;
  try {
    const response = await apiClient.get(`utils/dni-lookup/?dni=${currentGuest.value.dni}`);
    currentGuest.value.first_name = response.data.nombres;
    currentGuest.value.last_name = `${response.data.apellidoPaterno} ${response.data.apellidoMaterno}`;
  } catch (err) {
    dniError.value = "DNI no encontrado o la API falló.";
    console.error("Error en la API de DNI:", err);
  } finally {
    isFetchingDni.value = false;
  }
};

onMounted(loadGuests);
</script>

<style scoped>

/* Estilos para el buscador de DNI */
.dni-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.dni-input-group .form-input {
  flex-grow: 1;
}
.dni-search-btn {
  height: 46px;
  border: 1px solid var(--color-borde);
  background-color: #f8f9fa;
  padding: 0 1rem;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
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
/* Reutilizamos los estilos que ya conoces */
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.add-button { background-color: var(--color-primario); color: white; border: none; padding: 8px 15px; border-radius: 5px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
.controls { display: flex; margin-bottom: 1.5rem; }
.search-input { width: 100%; max-width: 400px; padding: 0.5rem; border: 1px solid var(--color-borde); border-radius: 5px; }
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
  --easy-table-header-font-size: 0.9rem;
  --easy-table-header-background-color: transparent;
  --easy-table-header-font-color: #6c757d;
  --easy-table-header-height: 50px;
  --easy-table-body-row-height: 50px;
  --easy-table-body-row-font-size: 0.95rem;
  --easy-table-body-row-font-weight: 500;
  --easy-table-body-even-row-background-color: #f8f9fa;
  --easy-table-body-row-hover-background-color: #e9ecef;
}

.actions-wrapper { display: flex; gap: 0.5rem; }
.action-icon-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #6c757d; padding: 0.5rem; }
.action-icon-btn:hover { color: var(--color-primario); }

/* Estilos del Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 2rem; border-radius: var(--radio-borde); width: 90%; max-width: 500px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
.form-group { margin-bottom: 1rem; }
.form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
.form-input { display: block; width: 100%; padding: 0.75rem; font-size: 1rem; border: 1px solid var(--color-borde); border-radius: 5px; }
.btn { border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 1rem; }
.cancel-btn { background-color: #6c757d; color: white; }
.submit-btn { background-color: var(--color-primario); color: white; }
</style>