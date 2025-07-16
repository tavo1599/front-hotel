<template>
  <div>
    <div v-if="loading">Cargando datos de la reserva...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>
    
    <div v-if="reservation">
      <div class="header">
        <div>
          <h2>Reserva de {{ reservation.guest.first_name }} {{ reservation.guest.last_name }}</h2>
          <p class="subtitle">Folio de la estancia actual.</p>
        </div>
        <span :class="['status-badge', reservation.status.toLowerCase()]">{{ reservation.status }}</span>
      </div>

      <div class="detail-grid">
        <div class="column">
          <div class="detail-card">
            <h3 class="card-title">Datos del Huésped</h3>
            <p><strong>Nombre:</strong> {{ reservation.guest.first_name }} {{ reservation.guest.last_name }}</p>
            <p><strong>DNI:</strong> {{ reservation.guest.dni }}</p>
            <p><strong>Teléfono:</strong> {{ reservation.guest.phone_number || 'No registrado' }}</p>
            <router-link :to="{ name: 'HistorialHuesped', params: { id: reservation.guest.id } }" class="btn-link">
              Ver Historial Completo
            </router-link>
          </div>
          <div class="detail-card">
            <h3 class="card-title">Detalles de la Habitación</h3>
            <img v-if="reservation.room.image" :src="reservation.room.image" class="room-image">
            <p><strong>Habitación:</strong> N° {{ reservation.room.room_number }} ({{ reservation.room.room_type }})</p>
            <p><strong>Estancia Planificada:</strong> {{ reservation.check_in_date }} al {{ reservation.check_out_date }}</p>
            <p v-if="reservation.actual_check_in"><strong>Ingreso Real:</strong> {{ formatDate(reservation.actual_check_in) }}</p>
            <p v-if="reservation.actual_check_out"><strong>Salida Real:</strong> {{ formatDate(reservation.actual_check_out) }}</p>
          </div>
        </div>

        <div class="column">
          <div class="detail-card">
            <h3 class="card-title">Acciones de la Reserva</h3>
            <div class="actions-container">
              <div v-if="reservation.status === 'Pendiente'">
                <button @click="handleConfirm" class="action-btn confirm-btn">Confirmar Reserva</button>
                <button @click="handleCancel" class="action-btn cancel-btn">Cancelar Reserva</button>
              </div>
              <div v-if="reservation.status === 'Confirmada' && !reservation.actual_check_in">
                <button @click="handleCheckin" class="action-btn checkin-btn">Realizar Check-in</button>
                <button @click="handleCancel" class="action-btn cancel-btn">Cancelar Reserva</button>
              </div>
              <div v-if="reservation.status === 'Confirmada' && reservation.actual_check_in && !reservation.actual_check_out">
                <button @click="openExtendModal" class="action-btn extend-btn">Extender Estancia</button>
                <button @click="handleCheckout" class="action-btn checkout-btn">Realizar Check-out</button>
              </div>
              <router-link :to="{ name: 'VerCuenta', params: { id: reservation.id } }" class="action-btn bill-btn">
                Ver Cuenta Detallada
              </router-link>
            </div>
          </div>
          <div class="detail-card">
            <h3 class="card-title">Añadir Consumo</h3>
            <form @submit.prevent="addSale">
              <select v-model="newSale.inventory_item_id" required class="form-input">
                <option disabled value="">Selecciona un producto</option>
                <option v-for="item in inventory" :key="item.id" :value="item.id">
                  {{ item.product.name }} (Stock: {{ item.stock_quantity }})
                </option>
              </select>
              <div class="sale-group">
                <input v-model="newSale.quantity_sold" type="number" min="1" required class="form-input" />
                <button type="submit" class="add-sale-btn">+</button>
              </div>
              <div class="form-group-inline">
                <input type="checkbox" v-model="newSale.is_paid" id="sale_is_paid" />
                <label for="sale_is_paid">Pago de este consumo realizado</label>
              </div>
            </form>
            <p v-if="formError" style="color: red; font-size: 0.9rem;">{{ formError }}</p>
            <hr>
            <h4>Consumos Registrados</h4>
            <ul class="consumption-list">
              <li v-for="sale in sales" :key="sale.id">
                <span>{{ sale.quantity_sold }} x {{ sale.inventory_item.product.name }}</span>
                <strong>${{ sale.sale_price }}</strong>
              </li>
              <li v-if="sales.length === 0">No hay consumos.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isExtendModalOpen" class="modal-overlay" @click.self="closeExtendModal">
      <div class="modal-content">
        <h3>Extender Estancia</h3>
        <form @submit.prevent="handleExtendStay">
          <div class="form-group">
            <label class="form-label">Noches adicionales:</label>
            <input v-model.number="extraNights" type="number" min="1" class="form-input" required>
          </div>
          <p v-if="formError" style="color: red;">{{ formError }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeExtendModal" class="btn cancel-btn">Cancelar</button>
            <button type="submit" class="btn submit-btn">Confirmar Extensión</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '@/api';
import { useNotificationStore } from '@/stores/notification'; // <-- 1. Importa el store

const notificationStore = useNotificationStore();

const route = useRoute();
const reservation = ref(null);
const inventory = ref([]);
const sales = ref([]);
const loading = ref(true);
const error = ref(null);
const formError = ref(null);
const newSale = ref({
  inventory_item_id: "",
  quantity_sold: 1,
  reservation_id: route.params.id,
  is_paid: false
});

const isExtendModalOpen = ref(false);
const extraNights = ref(1);

const loadData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const reservationId = route.params.id;
    const [resResponse, invResponse, salesResponse] = await Promise.all([
      apiClient.get(`reservations/${reservationId}/`),
      apiClient.get('inventory/'),
      apiClient.get(`sales/?reservation=${reservationId}`)
    ]);
    reservation.value = resResponse.data;
    inventory.value = invResponse.data;
    sales.value = salesResponse.data;
  } catch (err) {
    error.value = "Error al cargar los datos.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const addSale = async () => {
  formError.value = null;
  try {
    await apiClient.post('sales/', newSale.value);
    newSale.value.inventory_item_id = "";
    newSale.value.quantity_sold = 1;
    newSale.value.is_paid = false;
    notificationStore.addNotification({ message: 'Venta Registrado Correctamente', type: 'success' });
    await loadData();
  } catch (err) {
    notificationStore.addNotification({ message: 'Error al Registrar Venta', type: 'error' });
    formError.value = err.response?.data?.error || "Error al registrar la venta.";
    console.error(err);
  }
};

const handleConfirm = async () => {
  if (!reservation.value) return;
  if (confirm("¿Confirmar esta reserva?")) {
    try {
      await apiClient.post(`reservations/${reservation.value.id}/confirm/`);
      notificationStore.addNotification({ message: 'Reserva Confirmado Correctamente', type: 'success' });
      await loadData();
    } catch (err) {
      notificationStore.addNotification({ message: 'Error al Confirmar Reserva', type: 'error' });
      alert("Hubo un error al confirmar la reserva.");
    }
  }
};

const handleCancel = async () => {
  if (!reservation.value) return;
  if (confirm("¿Estás seguro de que quieres CANCELAR esta reserva?")) {
    try {
      await apiClient.post(`reservations/${reservation.value.id}/cancel/`);
      notificationStore.addNotification({ message: 'Reserva Cancelado', type: 'success' });
      await loadData();
    } catch (err) {
      notificationStore.addNotification({ message: 'Error al Cancelar la Reserva', type: 'error' });
      alert("Hubo un error al cancelar la reserva.");
    }
  }
};

const handleCheckin = async () => {
  if (!reservation.value) return;
  if (confirm("¿Realizar el check-in para esta reserva ahora?")) {
    try {
      await apiClient.post(`reservations/${reservation.value.id}/checkin/`);
      notificationStore.addNotification({ message: 'Check-int realizado', type: 'success' });
      await loadData();
    } catch (err) {
      notificationStore.addNotification({ message: 'Error al realizar el check-int', type: 'error' });
      console.error("Error al realizar el check-in:", err.response.data);
      alert("Hubo un error al realizar el check-in.");
    }
  }
};

const handleCheckout = async () => {
  if (!reservation.value) return;
  if (confirm("¿Estás seguro de que quieres realizar el check-out para esta reserva?")) {
    try {
      await apiClient.post(`reservations/${reservation.value.id}/checkout/`);
      notificationStore.addNotification({ message: 'Check-out realizado', type: 'success' });
      await loadData();
    } catch (err) {
      notificationStore.addNotification({ message: 'Error al realizar el check-out', type: 'error' });
      console.error("Error al realizar el check-out:", err.response.data);
      alert("Hubo un error al realizar el check-out.");
    }
  }
};

const openExtendModal = () => {
  extraNights.value = 1;
  formError.value = null;
  isExtendModalOpen.value = true;
};

const closeExtendModal = () => {
  isExtendModalOpen.value = false;
};

const handleExtendStay = async () => {
  formError.value = null;
  try {
    await apiClient.post(`reservations/${reservation.value.id}/extend/`, {
      nights: extraNights.value
    });
    closeExtendModal();
    notificationStore.addNotification({ message: 'Estadia Extendida Correctamente', type: 'success' });
    await loadData();
  } catch (err) {
    notificationStore.addNotification({ message: 'Error al Extender Estadia', type: 'error' });
    formError.value = err.response?.data?.error || "No se pudo extender la estancia.";
    console.error(err);
  }
};

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
};

onMounted(loadData);
</script>

<style scoped>
/* Estilos para el nuevo diseño de "Ficha de Estancia" */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}
.header h2 { margin: 0; }
.subtitle { color: #6c757d; }

.status-badge { padding: 6px 12px; border-radius: 16px; font-size: 0.9rem; color: white; font-weight: 600; text-transform: capitalize; }
.status-badge.confirmada { background-color: #28a745; }
.status-badge.pendiente { background-color: #ffc107; color: black; }
.status-badge.completada { background-color: #6c757d; }
.status-badge.cancelada { background-color: #dc3545; }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}
.detail-card {
  background-color: var(--color-superficie);
  padding: 1.5rem;
  border-radius: var(--radio-borde);
  box-shadow: var(--sombra-caja);
  border: 1px solid var(--color-borde);
  margin-bottom: 2rem;
}
.card-title {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.75rem;
}
.room-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 5px;
  margin-bottom: 1rem;
}
.btn-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--color-primario);
  text-decoration: none;
  font-weight: 600;
}
.actions-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.action-btn {
  width: 100%;
  text-align: center;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  text-decoration: none;
  color: white;
  transition: opacity 0.2s;
}
.action-btn:hover { opacity: 0.9; }

/* Colores para cada botón de acción */
.confirm-btn { background-color: #007bff; }
.cancel-btn { background-color: #dc3545; }
.checkin-btn { background-color: #17a2b8; }
.checkout-btn { background-color: #28a745; }
.extend-btn { background-color: #ffc107; color: #212529; } /* Estilo para el botón de extender */
.bill-btn { background-color: #6c757d; }

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-borde);
  border-radius: 5px;
}
.sale-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.add-sale-btn {
  background-color: var(--color-primario);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.5rem;
  padding: 0 1rem;
  cursor: pointer;
}
.form-group-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}
.consumption-list {
  list-style-type: none;
  padding: 0;
}
.consumption-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #eee;
}

/* Estilos para el Modal (reutilizados) */
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
  max-width: 400px;
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
</style>