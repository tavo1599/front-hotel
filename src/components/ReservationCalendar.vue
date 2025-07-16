<template>
  <div>
    <div class="header">
      <h2>Agenda de Actividad Diaria</h2>
      <p class="subtitle">Selecciona una fecha para ver las llegadas, salidas y estancias.</p>
    </div>

    <div class="date-selector">
      <date-picker 
        v-model:value="selectedDate" 
        type="date" 
        placeholder="Selecciona una fecha"
        format="DD/MM/YYYY"
        class="date-picker"
        lang="es"
      ></date-picker>
    </div>

    <div v-if="loading" class="loading-state">Cargando actividad...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else class="activity-grid">
      <div class="activity-column">
        <h3 class="column-title"><i class="ri-login-box-line"></i> Llegadas ({{ activity.check_ins.length }})</h3>
        <div class="activity-list">
          <div v-for="res in activity.check_ins" :key="res.id" class="activity-card check-in">
            <div class="card-main-info">
              <div class="guest-name">{{ res.guest.first_name }} {{ res.guest.last_name }}</div>
              <div class="room-number">Hab. {{ res.room.room_number }}</div>
            </div>
            <router-link :to="{ name: 'DetalleReserva', params: { id: res.id } }" class="details-link">
              <i class="ri-arrow-right-s-line"></i>
            </router-link>
          </div>
          <p v-if="activity.check_ins.length === 0" class="empty-message">No hay llegadas programadas.</p>
        </div>
      </div>

      <div class="activity-column">
        <h3 class="column-title"><i class="ri-logout-box-line"></i> Salidas ({{ activity.check_outs.length }})</h3>
        <div class="activity-list">
           <div v-for="res in activity.check_outs" :key="res.id" class="activity-card check-out">
            <div class="card-main-info">
              <div class="guest-name">{{ res.guest.first_name }} {{ res.guest.last_name }}</div>
              <div class="room-number">Hab. {{ res.room.room_number }}</div>
            </div>
            <router-link :to="{ name: 'DetalleReserva', params: { id: res.id } }" class="details-link">
              <i class="ri-arrow-right-s-line"></i>
            </router-link>
          </div>
          <p v-if="activity.check_outs.length === 0" class="empty-message">No hay salidas programadas.</p>
        </div>
      </div>

      <div class="activity-column">
        <h3 class="column-title"><i class="ri-moon-line"></i> Alojados ({{ activity.stay_overs.length }})</h3>
        <div class="activity-list">
           <div v-for="res in activity.stay_overs" :key="res.id" class="activity-card stay-over">
            <div class="card-main-info">
              <div class="guest-name">{{ res.guest.first_name }} {{ res.guest.last_name }}</div>
              <div class="room-number">Hab. {{ res.room.room_number }}</div>
            </div>
            <router-link :to="{ name: 'DetalleReserva', params: { id: res.id } }" class="details-link">
              <i class="ri-arrow-right-s-line"></i>
            </router-link>
          </div>
          <p v-if="activity.stay_overs.length === 0" class="empty-message">No hay huéspedes de paso.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiClient from '@/api';
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import 'vue-datepicker-next/locale/es';

const activity = ref({
  check_ins: [],
  check_outs: [],
  stay_overs: []
});
const selectedDate = ref(new Date());
const loading = ref(true);
const error = ref(null);

const loadActivity = async () => {
  if (!selectedDate.value) return;
  loading.value = true;
  error.value = null;
  try {
    // Formatea la fecha a YYYY-MM-DD para la API
    const date = new Date(selectedDate.value.getTime() - (selectedDate.value.getTimezoneOffset() * 60000 ))
                    .toISOString()
                    .split("T")[0];
                    
    const response = await apiClient.get(`daily-activity/?date=${date}`);
    activity.value = response.data;
  } catch (err) {
    error.value = "Error al cargar la actividad del día.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Observa si la fecha cambia para volver a cargar los datos
watch(selectedDate, loadActivity);

onMounted(loadActivity);
</script>

<style scoped>
.header { margin-bottom: 2rem; }
.header h2 { margin: 0; }
.subtitle { color: #6c757d; }

.date-selector {
  margin-bottom: 2rem;
  max-width: 250px;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}
.activity-column .column-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-borde);
  margin: 0 0 1rem 0;
}
.activity-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--color-superficie);
  padding: 1rem;
  border-radius: var(--radio-borde);
  margin-bottom: 0.75rem;
  border-left: 5px solid;
  box-shadow: var(--sombra-caja);
}
.activity-card.check-in { border-color: #28a745; }
.activity-card.check-out { border-color: #dc3545; }
.activity-card.stay-over { border-color: #6c757d; }
.guest-name { font-weight: 600; }
.room-number { font-size: 0.9rem; color: #6c757d; }
.details-link {
  color: #6c757d;
  font-size: 1.5rem;
  text-decoration: none;
}
.details-link:hover {
  color: var(--color-primario);
}
.empty-message {
  text-align: center;
  padding: 1rem;
  color: #6c757d;
}
</style>