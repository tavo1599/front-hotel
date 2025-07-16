<template>
  <div>
    <div class="header">
      <h2>Gestión de Personal</h2>
      <button @click="openCreateModal" class="add-button">
        <i class="ri-user-add-line"></i> Añadir Empleado
      </button>
    </div>

    <div class="table-container">
      <EasyDataTable
        :headers="headers"
        :items="staffList"
        :loading="loading"
        table-class-name="custom-table"
        buttons-pagination
        rows-per-page-message="Filas por página"
        :rows-per-page="10"
        alternating
      >
        <template #item-avatar="item">
          <div class="user-avatar">
            {{ (item.first_name || item.username).charAt(0).toUpperCase() }}
          </div>
        </template>
        <template #item-full_name="{ first_name, last_name }">
          {{ first_name }} {{ last_name }}
        </template>
        <template #item-role="{ role }">
          <span :class="['role-badge', role]">{{ role }}</span>
        </template>
        <template #item-actions="item">
          <div class="actions-wrapper">
            <button @click="openEditModal(item)" class="action-icon-btn" title="Editar / Resetear Contraseña">
              <i class="ri-key-2-line"></i>
            </button>
            <button @click="deleteStaffMember(item)" class="action-icon-btn delete" title="Eliminar Empleado">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </template>
      </EasyDataTable>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Editar Empleado' : 'Añadir Empleado' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">Nombre de Usuario:</label>
            <input v-model="currentStaff.username" type="text" class="form-input" :disabled="isEditing" required>
          </div>
          <div class="form-group">
            <label class="form-label">Nombres:</label>
            <input v-model="currentStaff.first_name" type="text" class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Apellidos:</label>
            <input v-model="currentStaff.last_name" type="text" class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">{{ isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña' }}</label>
            <input v-model="currentStaff.password" type="password" class="form-input" :placeholder="isEditing ? 'Dejar en blanco para no cambiar' : ''" :required="!isEditing">
          </div>
          <div class="form-group">
            <label class="form-label">Rol:</label>
            <select v-model="currentStaff.role" class="form-input" required :disabled="isEditing">
              <option value="asistente">Asistente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <p v-if="formError" style="color: red;">{{ formError }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn cancel-btn">Cancelar</button>
            <button type="submit" class="btn submit-btn">{{ isEditing ? 'Guardar Cambios' : 'Crear Empleado' }}</button>
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

const staffList = ref([]);
const loading = ref(true);
const headers = [
  { text: "", value: "avatar", width: 60 },
  { text: "Usuario", value: "username", sortable: true },
  { text: "Nombre Completo", value: "full_name" },
  { text: "Rol", value: "role", sortable: true },
  { text: "Acciones", value: "actions", width: 120 },
];

const isModalOpen = ref(false);
const isEditing = ref(false);
const currentStaff = ref({});
const formError = ref(null);

const loadStaff = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get('staff/');
    // Creamos el campo 'full_name' para la tabla
    staffList.value = response.data.map(s => ({...s, full_name: `${s.first_name || ''} ${s.last_name || ''}`}));
  } catch (error) { console.error("Error al cargar el personal:", error); } 
  finally { loading.value = false; }
};

const resetForm = () => {
  currentStaff.value = { username: '', password: '', role: 'asistente', first_name: '', last_name: '' };
  formError.value = null;
};

const openCreateModal = () => {
  isEditing.value = false;
  resetForm();
  isModalOpen.value = true;
};

const openEditModal = (staff) => {
  isEditing.value = true;
  currentStaff.value = { ...staff, password: '' }; // Clonamos y limpiamos el campo de contraseña
  formError.value = null;
  isModalOpen.value = true;
};

const closeModal = () => { isModalOpen.value = false; };

const handleSubmit = async () => {
  formError.value = null;
  try {
    if (isEditing.value) {
      // Si se está editando, solo actualizamos la contraseña si se proveyó una nueva
      if (currentStaff.value.password) {
        await apiClient.post(`staff/${currentStaff.value.id}/set_password/`, { password: currentStaff.value.password });
      }
      // Actualizamos otros datos como el nombre/apellido
      await apiClient.patch(`staff/${currentStaff.value.id}/`, {
        first_name: currentStaff.value.first_name,
        last_name: currentStaff.value.last_name
      });
    } else {
      // Creando un nuevo usuario
      await apiClient.post('staff/', currentStaff.value);
    }
    closeModal();
    await loadStaff();
  } catch (err) {
    formError.value = 'Error al guardar. Revisa que el nombre de usuario no se repita.';
    console.error(err);
  }
};

const deleteStaffMember = async (staff) => {
  if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${staff.username}? Esta acción no se puede deshacer.`)) {
    try {
      await apiClient.delete(`staff/${staff.id}/`);
      await loadStaff();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar al usuario.');
      console.error(err);
    }
  }
};

onMounted(loadStaff);
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
.add-button:hover {
  background-color: #0056b3;
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
.actions-wrapper {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}
.action-icon-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.5rem;
  border-radius: 50%;
}
.action-icon-btn:hover {
  background-color: #f0f0f0;
  color: var(--color-primario);
}
.action-icon-btn.delete:hover {
  color: #dc3545;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e9ecef;
  color: #495057;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}
.role-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}
.role-badge.admin {
  background-color: #007bff;
  color: white;
}
.role-badge.asistente {
  background-color: #6c757d;
  color: white;
}

/* --- ESTILOS AÑADIDOS PARA EL MODAL --- */
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