<template>
  <div>
    <div v-if="loading">Cargando datos de la reserva...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>
    
    <div v-if="reservation">
      <h2>Detalle de la Reserva</h2>
      <p><strong>Huésped:</strong> {{ reservation.guest.first_name }} {{ reservation.guest.last_name }}</p>
      <p><strong>Habitación:</strong> N° {{ reservation.room.room_number }} ({{ reservation.room.room_type }})</p>
      <p><strong>Estancia Planificada:</strong> Del {{ reservation.check_in_date }} al {{ reservation.check_out_date }}</p>
      <p><strong>Estado:</strong> {{ reservation.status }}</p>
      
      <p v-if="reservation.actual_check_in"><strong>Ingreso Real:</strong> {{ formatDate(reservation.actual_check_in) }}</p>
      <p v-if="reservation.actual_check_out"><strong>Salida Real:</strong> {{ formatDate(reservation.actual_check_out) }}</p>

      <router-link
        :to="{ name: 'VerCuenta', params: { id: reservation.id } }"
        class="bill-button"
      >
        Ver Cuenta
      </router-link>

      <div class="actions-section" v-if="reservation.status === 'Pendiente'">
        <button @click="handleConfirm" class="confirm-button">Confirmar Reserva</button>
        <button @click="handleCancel" class="cancel-button">Cancelar Reserva</button>
      </div>
      
      <div class="actions-section" v-if="reservation.status === 'Confirmada' && !reservation.actual_check_in">
        <button @click="handleCheckin" class="checkin-button">Realizar Check-in</button>
        <button @click="handleCancel" class="cancel-button">Cancelar Reserva</button>
      </div>

      <div class="actions-section" v-if="reservation.status === 'Confirmada' && reservation.actual_check_in">
        <button @click="handleCheckout" class="checkout-button">Realizar Check-out</button>
      </div>

      <hr>

      <h3>Añadir Consumo/Venta</h3>
      <form @submit.prevent="addSale">
        <div class="form-group">
          <label>Producto:</label>
          <select v-model="newSale.inventory_item_id" required>
            <option disabled value="">Selecciona un producto</option>
            <option v-for="item in inventory" :key="item.id" :value="item.id">
              {{ item.product.name }} (Stock: {{ item.stock_quantity }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Cantidad:</label>
          <input v-model="newSale.quantity_sold" type="number" min="1" required />
        </div>
        <button type="submit">Añadir Venta</button>
      </form>
      <p v-if="formError" style="color: red;">{{ formError }}</p>

      <hr>

      <h3>Consumos Registrados</h3>
      <ul>
        <li v-for="sale in sales" :key="sale.id">
          {{ sale.quantity_sold }} x {{ sale.inventory_item.product.name }} - ${{ sale.sale_price }} (c/u)
        </li>
        <li v-if="sales.length === 0">No hay consumos registrados para esta reserva.</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '@/api';

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
  reservation_id: route.params.id
});

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
    await loadData();
  } catch (err) {
    formError.value = err.response?.data?.error || "Error al registrar la venta.";
    console.error(err);
  }
};

const handleConfirm = async () => {
  if (!reservation.value) return;
  if (confirm("¿Confirmar esta reserva?")) {
    try {
      await apiClient.post(`reservations/${reservation.value.id}/confirm/`);
      await loadData();
    } catch (err) {
      alert("Hubo un error al confirmar la reserva.");
    }
  }
};

const handleCancel = async () => {
  if (!reservation.value) return;
  if (confirm("¿Estás seguro de que quieres CANCELAR esta reserva?")) {
    try {
      await apiClient.post(`reservations/${reservation.value.id}/cancel/`);
      await loadData();
    } catch (err) {
      alert("Hubo un error al cancelar la reserva.");
    }
  }
};

// NUEVA FUNCIÓN PARA EL CHECK-IN
const handleCheckin = async () => {
  if (!reservation.value) return;
  if (confirm("¿Realizar el check-in para esta reserva ahora?")) {
    try {
      await apiClient.post(`reservations/${reservation.value.id}/checkin/`);
      await loadData();
    } catch (err) {
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
      await loadData();
    } catch (err) {
      console.error("Error al realizar el check-out:", err.response.data);
      alert("Hubo un error al realizar el check-out.");
    }
  }
};

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
};

onMounted(loadData);
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}
hr {
  margin: 2rem 0;
}
/* Estilos para el contenedor de botones */
.actions-section, .checkout-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* Estilo base para todos los botones de acción */
.bill-button, .checkin-button, .confirm-button, .cancel-button, .checkout-button {
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  text-decoration: none;
  color: white;
  display: inline-block;
  transition: background-color 0.2s;
}

/* Colores específicos para cada botón */
.bill-button { background-color: #6c757d; }
.bill-button:hover { background-color: #5a6268; }

.confirm-button { background-color: #007bff; }
.confirm-button:hover { background-color: #0056b3; }

.cancel-button { background-color: #dc3545; }
.cancel-button:hover { background-color: #c82333; }

.checkin-button { background-color: #17a2b8; }
.checkin-button:hover { background-color: #117a8b; }

.checkout-button { background-color: #28a745; }
.checkout-button:hover { background-color: #218838; }
</style>