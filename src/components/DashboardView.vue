<template>
  <div>
    <h2>Dashboard Principal</h2>
    <div v-if="loading">Cargando estadísticas...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>
    <div v-else class="stats-grid">
      <div class="stat-card">
        <h3>Tasa de Ocupación</h3>
        <p class="stat-value">{{ stats.occupancy_rate }}%</p>
        <small>{{ stats.occupied_rooms }} / {{ stats.total_rooms }} habitaciones</small>
      </div>
      <div class="stat-card">
        <h3>Check-ins Hoy</h3>
        <p class="stat-value">{{ stats.checkins_today }}</p>
      </div>
      <div class="stat-card">
        <h3>Check-outs Hoy</h3>
        <p class="stat-value">{{ stats.checkouts_today }}</p>
      </div>
      <div class="stat-card">
        <h3>Ingresos por Ventas (Hoy)</h3>
        <p class="stat-value">${{ stats.revenue_today.toFixed(2) }}</p>
      </div>

    <div class="stat-card">
      <h3>Habitaciones Disponibles</h3>
      <p class="stat-value">{{ stats.available_rooms }}</p>
      <small>Listas para check-in</small>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api';

const stats = ref(null);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const response = await apiClient.get('dashboard/');
    stats.value = response.data;
  } catch (err) {
    error.value = "Error al cargar las estadísticas.";
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}
.stat-card {
  background-color: #f9f9f9;
  border: 1px solid #eee;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}
.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0.5rem 0;
  color: #007bff;
}
</style>