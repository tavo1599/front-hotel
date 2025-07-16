<template>
  <div>
    <div class="header" v-if="guest">
      <h2>Historial de {{ guest.first_name }} {{ guest.last_name }}</h2>
      <p class="subtitle">Todas las estancias pasadas y presentes registradas.</p>
    </div>

    <div v-if="loading">Cargando historial...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>
    
    <div v-else class="timeline-container">
      <div v-if="reservations.length > 0" class="timeline">
        <div v-for="res in reservations" :key="res.id" class="timeline-item">
          <div class="timeline-icon">
            <i :class="getStatusIcon(res.status)"></i>
          </div>
          <div class="timeline-content">
            <div class="content-header">
              <span class="room-info">Habitación {{ res.room.room_number }} ({{ res.room.room_type }})</span>
              <span :class="['status-badge', res.status.toLowerCase()]">{{ res.status }}</span>
            </div>
            <p class="date-range">
              Del {{ formatDate(res.check_in_date) }} al {{ formatDate(res.check_out_date) }}
            </p>
            <router-link :to="{ name: 'DetalleReserva', params: { id: res.id } }" class="details-button">
              Ver Detalles de la Estancia
            </router-link>
          </div>
        </div>
      </div>
      <p v-else>Este huésped no tiene reservas registradas.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '@/api';

const route = useRoute();
const guest = ref(null);
const reservations = ref([]);
const loading = ref(true);
const error = ref(null);

const guestId = route.params.id;

onMounted(async () => {
  try {
    const [guestResponse, historyResponse] = await Promise.all([
      apiClient.get(`guests/${guestId}/`),
      apiClient.get(`guests/${guestId}/history/`)
    ]);
    guest.value = guestResponse.data;
    reservations.value = historyResponse.data;
  } catch (err) {
    error.value = "Error al cargar el historial.";
    console.error(err);
  } finally {
    loading.value = false;
  }
});

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Completada': return 'ri-checkbox-circle-fill';
    case 'Confirmada': return 'ri-calendar-check-fill';
    case 'Cancelada': return 'ri-close-circle-fill';
    case 'Pendiente': return 'ri-time-fill';
    default: return 'ri-question-mark';
  }
};
</script>

<style scoped>
.header {
  margin-bottom: 2rem;
}
.header h2 { margin: 0; }
.subtitle { color: #6c757d; }

.timeline-container {
  position: relative;
  padding-left: 3rem; /* Espacio para la línea e iconos */
}

/* La línea vertical de la línea de tiempo */
.timeline::before {
  content: '';
  position: absolute;
  left: 30px; /* Centrado con el ícono */
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--color-borde);
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;
}

.timeline-icon {
  position: absolute;
  left: -15px; /* Mitad del ícono sobre la línea */
  top: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--color-superficie);
  border: 3px solid var(--color-borde);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  color: #6c757d;
}

/* Colores de íconos según el estado */
.timeline-icon .ri-checkbox-circle-fill { color: #28a745; }
.timeline-icon .ri-calendar-check-fill { color: #007bff; }
.timeline-icon .ri-close-circle-fill { color: #dc3545; }
.timeline-icon .ri-time-fill { color: #ffc107; }

.timeline-content {
  background-color: var(--color-superficie);
  padding: 1.5rem;
  border-radius: var(--radio-borde);
  box-shadow: var(--sombra-caja);
  border: 1px solid var(--color-borde);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.room-info {
  font-weight: 600;
  font-size: 1.1rem;
}
.date-range {
  color: #6c757d;
  margin-bottom: 1rem;
}

.details-button {
  display: inline-block;
  background: none;
  border: 1px solid var(--color-primario);
  color: var(--color-primario);
  padding: 0.5rem 1rem;
  border-radius: 5px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}
.details-button:hover {
  background-color: var(--color-primario);
  color: white;
}

/* Reutilizamos los estilos de status-badge */
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
</style>