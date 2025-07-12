<template>
  <div>
    <h2>Gestionar Personal del Hotel</h2>

    <div class="form-container">
      <h3>Añadir Nuevo Empleado</h3>
      <form @submit.prevent="addStaffMember">
        <div class="form-group">
          <label>Nombre de Usuario:</label>
          <input v-model="newStaff.username" type="text" required />
        </div>
        <div class="form-group">
          <label>Contraseña:</label>
          <input v-model="newStaff.password" type="password" required />
        </div>
         <div class="form-group">
          <label>Rol:</label>
          <select v-model="newStaff.role" required>
            <option value="asistente">Asistente</option>
            </select>
        </div>
        <button type="submit">Añadir Empleado</button>
      </form>
      <p v-if="formError" style="color: red;">{{ formError }}</p>
    </div>

    <hr />

    <h3>Personal Actual</h3>
    <div v-if="loading">Cargando...</div>
    <table>
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Rol</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="staff in staffList" :key="staff.id">
          <td>{{ staff.username }}</td>
          <td>{{ staff.role }}</td>
        </tr>
         <tr v-if="staffList.length === 0">
          <td colspan="2">No hay personal registrado.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api';

const staffList = ref([]);
const loading = ref(true);
const formError = ref(null);

const newStaff = ref({
  username: '',
  password: '',
  role: 'asistente'
});

const loadStaff = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get('staff/');
    staffList.value = response.data;
  } catch (error) {
    console.error("Error cargando el personal:", error);
  } finally {
    loading.value = false;
  }
};

const addStaffMember = async () => {
  formError.value = null;
  try {
    await apiClient.post('staff/', newStaff.value);
    newStaff.value = { username: '', password: '', role: 'asistente' };
    await loadStaff(); // Recarga la lista
  } catch (error) {
    formError.value = "Error al añadir el empleado.";
    console.error(error);
  }
};

onMounted(loadStaff);
</script>