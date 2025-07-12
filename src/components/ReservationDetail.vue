<template>
  <div>
    <div v-if="loading">Cargando datos de la reserva...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>
    <div v-else>
      <h2>Detalle de la Reserva</h2>
      <p><strong>Huésped:</strong> {{ reservation.guest.first_name }} {{ reservation.guest.last_name }}</p>
      <p><strong>Habitación:</strong> N° {{ reservation.room.room_number }} ({{ reservation.room.room_type }})</p>
      <p><strong>Estancia:</strong> Del {{ reservation.check_in_date }} al {{ reservation.check_out_date }}</p>
      <p><strong>Estado:</strong> {{ reservation.status }}</p>

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

    <div class="checkout-section" v-if="reservation.status === 'Confirmada'">
      <button @click="handleCancel" class="cancel-button">Cancelar Reserva</button>
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
  reservation_id: route.params.id // El ID de la reserva viene de la URL
});

const loadData = async () => {
  loading.value = true;
  error.value = null;
   try {
    const reservationId = route.params.id;
    const [resResponse, invResponse, salesResponse] = await Promise.all([
      apiClient.get(`reservations/${reservationId}/`),
      apiClient.get('inventory/'),
      // La URL debe ser así para que coincida con el backend
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
    await loadData(); // Recarga todo para ver la nueva venta y el stock actualizado
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


const handleCheckout = async () => {
  if (!reservation.value) return;

  // Pide confirmación al usuario
  if (confirm("¿Estás seguro de que quieres realizar el check-out para esta reserva?")) {
    try {
      // Llama a la acción 'checkout' de la API
      await apiClient.post(`reservations/${reservation.value.id}/checkout/`);
      // Recarga los datos para ver el estado actualizado
      await loadData();
    } catch (err) {
      console.error("Error al realizar el check-out:", err);
      alert("Hubo un error al realizar el check-out.");
    }
  }
};

onMounted(loadData);
</script>

<style scoped>
/* ... (estilos existentes) ... */
.bill-button {
  display: inline-block;
  margin-top: 1rem;
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 5px;
}
.checkout-section {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #f7f7f7;
    border-radius: 8px;
}
.checkout-button {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
}
.checkout-button:hover {
    background-color: #218838;
}

.actions-section {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
}
.confirm-button { background-color: #007bff; color: white; /*...*/ }
.confirm-button:hover { background-color: #0056b3; }
.cancel-button { background-color: #dc3545; color: white; /*...*/ }
.cancel-button:hover { background-color: #c82333; }
</style>