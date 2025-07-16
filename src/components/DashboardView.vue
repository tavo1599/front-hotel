<template>
  <div>
    <div class="header">
      <h2>Dashboard Principal</h2>
      <p class="subtitle">Resumen del estado del hotel en tiempo real.</p>
    </div>

    <div v-if="loading" class="loading-state">Cargando estadísticas...</div>
    <div v-else-if="error" class="error-state" style="color: red;">{{ error }}</div>
    
    <div v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon-wrapper primary"><i class="ri-pie-chart-2-fill"></i></div>
          <div class="stat-info">
            <h3 class="stat-title">Ocupación Actual</h3>
            <p class="stat-value">{{ stats.occupancy_rate }}%</p>
            <small>{{ stats.occupied_rooms }} / {{ stats.total_rooms }} habitaciones</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper positive"><i class="ri-group-fill"></i></div>
          <div class="stat-info">
            <h3 class="stat-title">Huéspedes Alojados</h3>
            <p class="stat-value">{{ stats.current_guests_count }}</p>
            <small>Actualmente en el hotel</small>
          </div>
        </div>
        <div class="stat-card">
           <div class="stat-icon-wrapper available"><i class="ri-door-open-fill"></i></div>
          <div class="stat-info">
            <h3 class="stat-title">Disponibles</h3>
            <p class="stat-value">{{ stats.status_breakdown.Disponible || 0 }}</p>
            <small>Listas para check-in</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper cleaning"><i class="ri-brush-fill"></i></div>
          <div class="stat-info">
            <h3 class="stat-title">En Proceso</h3>
            <p class="stat-value">{{ (stats.status_breakdown.Limpieza || 0) + (stats.status_breakdown.Inspección || 0) }}</p>
            <small>Limpieza / Inspección</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper accent"><i class="ri-shopping-cart-2-fill"></i></div>
          <div class="stat-info">
            <h3 class="stat-title">Ingresos por Ventas (30d)</h3>
            <p class="stat-value">${{ (stats.sales_revenue_30_days || 0).toFixed(2) }}</p>
            <small>Venta de productos</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper total"><i class="ri-money-dollar-circle-fill"></i></div>
          <div class="stat-info">
            <h3 class="stat-title">Ingresos Totales (30d)</h3>
            <p class="stat-value">${{ (stats.total_revenue_30_days || 0).toFixed(2) }}</p>
            <small>Estancias + Ventas</small>
          </div>
        </div>
      </div>

      <div class="main-content-grid">
        <div class="activity-card">
          <h4 class="card-title">Pronóstico de Ocupación (7 días)</h4>
          <div class="forecast-chart">
            <div v-for="day in stats.occupancy_forecast" :key="day.date" class="bar-wrapper">
              <div class="bar" :style="{ height: `${calculateBarHeight(day.occupied_rooms)}%` }">
                <span class="bar-value">{{ day.occupied_rooms }}</span>
              </div>
              <div class="bar-label">{{ formatDate(day.date, { weekday: 'short' }) }}</div>
            </div>
          </div>
        </div>
        <div class="activity-card">
          <h4 class="card-title">Top 5 Productos Vendidos (30d)</h4>
          <ol class="top-list">
            <li v-for="(product, index) in stats.top_products" :key="index">
              <span>{{ product.inventory_item__product__name }}</span>
              <span class="list-value">{{ product.total_sold }} vendidos</span>
            </li>
            <li v-if="stats.top_products.length === 0" class="empty-message">No hay ventas registradas.</li>
          </ol>
        </div>
      </div>

      <div class="activity-grid">
        <div class="activity-card">
          <h4 class="card-title">Últimas Reservas</h4>
          <ul class="activity-list">
            <li v-for="res in stats.latest_reservations" :key="res.id">
              <span class="activity-text">{{ res.guest.first_name }} {{ res.guest.last_name }}</span>
              <span class="activity-detail">Hab. {{ res.room.room_number }}</span>
            </li>
             <li v-if="stats.latest_reservations.length === 0" class="empty-message">No hay reservas recientes.</li>
          </ul>
        </div>
        <div class="activity-card">
          <h4 class="card-title">Próximos Check-ins</h4>
          <ul class="activity-list">
            <li v-for="res in stats.upcoming_checkins" :key="res.id">
              <span class="activity-text">{{ res.guest.first_name }} {{ res.guest.last_name }}</span>
              <span class="activity-detail">{{ formatDate(res.check_in_date, { day: 'numeric', month: 'short' }) }}</span>
            </li>
            <li v-if="stats.upcoming_checkins.length === 0" class="empty-message">No hay check-ins programados.</li>
          </ul>
        </div>
        <div class="activity-card">
          <h4 class="card-title">Próximos Check-outs</h4>
          <ul class="activity-list">
            <li v-for="res in stats.upcoming_checkouts" :key="res.id">
              <span class="activity-text">{{ res.guest.first_name }} {{ res.guest.last_name }}</span>
              <span class="activity-detail">{{ formatDate(res.check_out_date, { day: 'numeric', month: 'short' }) }}</span>
            </li>
            <li v-if="stats.upcoming_checkouts.length === 0" class="empty-message">No hay check-outs programados.</li>
          </ul>
        </div>
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

const loadData = async () => {
  try {
    const response = await apiClient.get('dashboard/');
    stats.value = response.data;
  } catch (err) {
    error.value = "Error al cargar las estadísticas.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString, options = {}) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1); // Ajuste por zona horaria
  return date.toLocaleDateString('es-ES', { timeZone: 'UTC', ...options });
};

const calculateBarHeight = (occupied) => {
  if (!stats.value || !stats.value.total_rooms) return 0;
  const percentage = (occupied / stats.value.total_rooms) * 100;
  return percentage > 100 ? 100 : percentage;
};

onMounted(loadData);
</script>

<style scoped>
.header { margin-bottom: 2rem; }
.header h2 { margin: 0; }
.subtitle { color: #6c757d; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}
.stat-card {
  background-color: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-borde);
  box-shadow: var(--sombra-caja);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.stat-icon-wrapper { font-size: 1.8rem; padding: 1rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.stat-icon-wrapper.primary { background-color: #e6f2ff; color: #007bff; }
.stat-icon-wrapper.positive { background-color: #eaf6ec; color: #28a745; }
.stat-icon-wrapper.available { background-color: #eaf6ec; color: #28a745; }
.stat-icon-wrapper.cleaning { background-color: #fff4e0; color: #ffc107; }
.stat-icon-wrapper.accent { background-color: #fff4e0; color: #ffc107; }
.stat-icon-wrapper.total { background-color: #e2e3e5; color: #6c757d; }
.stat-info .stat-title { margin: 0; font-size: 0.9rem; color: #6c757d; font-weight: 500; }
.stat-info .stat-value { margin: 0; font-size: 2rem; font-weight: 600; color: var(--color-texto); }
.stat-info small { color: #6c757d; }

.main-content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-top: 2.5rem;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2.5rem;
}
.activity-card {
  background-color: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-borde);
  padding: 1.5rem;
}
.card-title { margin-top: 0; margin-bottom: 1rem; font-size: 1.2rem; }
.activity-list, .top-list { list-style: none; padding: 0; margin: 0; }
.activity-list li, .top-list li { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f0f0f0; }
.activity-list li:last-child, .top-list li:last-child { border-bottom: none; }
.activity-text, .top-list span { font-weight: 500; }
.activity-detail, .list-value { color: #6c757d; font-weight: 500; }
.top-list { padding-left: 0; list-style-position: inside; }

.forecast-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  padding-top: 1rem;
}
.bar-wrapper { flex: 1; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
.bar {
  width: 60%;
  background-color: #e0e7ff;
  border-radius: 5px 5px 0 0;
  transition: height 0.5s ease-out;
  position: relative;
  min-height: 5px;
}
.bar:hover { background-color: #c7d2fe; }
.bar-value {
  position: absolute;
  top: -20px;
  width: 100%;
  text-align: center;
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--color-primario);
}
.bar-label { margin-top: 0.5rem; font-size: 0.8rem; color: #6c757d; font-weight: 600; text-transform: capitalize; }

.empty-message { text-align: center; color: #6c757d; padding: 1rem; }

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 992px) {
  .main-content-grid { grid-template-columns: 1fr; }
}
</style>