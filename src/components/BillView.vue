<template>
  <div class="bill-container">
    <h2>Cuenta de la Estancia</h2>
    <div v-if="loading">Cargando cuenta...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>
    <div v-else class="bill-details">
      <p><strong>Huésped:</strong> {{ bill.guest_name }}</p>
      <p><strong>Habitación:</strong> {{ bill.room_number }}</p>
      <hr>
      <h4>Detalle de Estancia</h4>
      <p>{{ bill.nights }} noches x ${{ bill.price_per_night }} = <strong>${{ bill.room_subtotal.toFixed(2) }}</strong></p>
      
      <h4>Consumos</h4>
      <table>
        </table>
      <p><strong>Subtotal Consumos: ${{ bill.sales_subtotal.toFixed(2) }}</strong></p>

      <hr>
      <div class="grand-total">
        <h3>TOTAL CUENTA: ${{ bill.grand_total.toFixed(2) }}</h3>
      </div>

      <div class="payments-section">
        <h3>Pagos Realizados</h3>
        <ul>
          <li v-for="payment in payments" :key="payment.id">
            <span>{{ formatDate(payment.payment_date) }} - {{ payment.payment_method }}</span>
            <strong>${{ payment.amount }}</strong>
          </li>
          <li v-if="payments.length === 0">No se han registrado pagos.</li>
        </ul>
        <p class="balance"><strong>Total Pagado:</strong> ${{ totalPaid.toFixed(2) }}</p>
        <p class="balance due"><strong>Saldo Pendiente:</strong> ${{ balanceDue.toFixed(2) }}</p>

        <form @submit.prevent="addPayment" class="payment-form">
          <h4>Registrar Nuevo Pago</h4>
          <input v-model="newPayment.amount" type="number" step="0.01" placeholder="Monto" required />
          <select v-model="newPayment.payment_method" required>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Otro">Otro</option>
          </select>
          <button type="submit">Registrar Pago</button>
        </form>
        <p v-if="formError" style="color: red;">{{ formError }}</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '@/api';

const route = useRoute();
const bill = ref(null);
const payments = ref([]);
const loading = ref(true);
const error = ref(null);
const formError = ref(null);

const newPayment = ref({
  amount: '',
  payment_method: 'Efectivo',
  reservation_id: route.params.id,
});

const reservationId = route.params.id;

const totalPaid = computed(() => {
  return payments.value.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
});

const balanceDue = computed(() => {
  if (!bill.value) return 0;
  return bill.value.grand_total - totalPaid.value;
});

const loadData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [billResponse, paymentsResponse] = await Promise.all([
      apiClient.get(`reservations/${reservationId}/bill/`),
      apiClient.get(`payments/?reservation_id=${reservationId}`)
    ]);
    bill.value = billResponse.data;
    payments.value = paymentsResponse.data;
  } catch (err) {
    error.value = "Error al cargar los datos de la cuenta.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const addPayment = async () => {
  formError.value = null;
  try {
    await apiClient.post('payments/', newPayment.value);
    newPayment.value.amount = '';
    newPayment.value.payment_method = 'Efectivo';
    await loadData(); // Recarga los datos para ver el nuevo pago
  } catch (err) {
    formError.value = "Error al registrar el pago.";
    console.error(err);
  }
};

// Filtro simple para formatear fecha (puedes moverlo a un archivo de utilidades)
const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString();
};


onMounted(loadData);
</script>

<style scoped>
/* ... tus otros estilos ... */
.payments-section { margin-top: 2rem; border-top: 2px solid #ccc; padding-top: 1.5rem; }
.balance { text-align: right; font-size: 1.1rem; margin: 0.5rem 0; }
.balance.due { font-weight: bold; color: #dc3545; }
.payment-form { display: flex; gap: 1rem; align-items: center; margin-top: 1rem; }
</style>