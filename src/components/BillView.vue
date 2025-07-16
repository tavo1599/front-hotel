<template>
  <div class="bill-page-container">
    <div v-if="loading">Cargando cuenta...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>
    
    <div v-if="bill">
      <div class="action-bar">
        <button v-if="bill.payment_status !== 'Pagada'" @click="openPaymentModal" class="action-btn payment-btn">
          <i class="ri-add-circle-line"></i> Registrar Pago
        </button>
        <button @click="printBill" class="action-btn print-btn">
          <i class="ri-printer-line"></i> Imprimir
        </button>
      </div>
      
      <div class="invoice-paper">
        <header class="invoice-header">
          <div class="hotel-info">
            <h1 class="hotel-name">{{ authStore.hotelName }}</h1>
          </div>
          <div class="invoice-info">
            <h2>Estado de Cuenta</h2>
            <p><strong>Reserva #:</strong> {{ reservationId }}</p>
            <p><strong>Fecha:</strong> {{ formatDate(new Date(), { dateStyle: 'long' }) }}</p>
            <span :class="['payment-status-badge', bill.payment_status.replace(/ /g, '-').toLowerCase()]">
              {{ bill.payment_status }}
            </span>
          </div>
        </header>

        <section class="guest-info">
          <h4>Facturado a:</h4>
          <p>{{ bill.guest_name }}</p>
        </section>

        <section class="charges-section">
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Estancia en Habitación {{ bill.room_number }}</strong>
                  <br>
                  <small>{{ bill.nights }} noches a ${{ bill.price_per_night }} / noche</small>
                </td>
                <td class="text-right">${{ bill.room_subtotal.toFixed(2) }}</td>
              </tr>
              <tr v-for="(sale, index) in bill.sales_details" :key="`sale-${index}`">
                <td>
                  {{ sale.quantity }} x {{ sale.product }}
                  <br>
                  <small>@ ${{ sale.unit_price }} c/u</small>
                </td>
                <td class="text-right">${{ sale.total.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="totals-section">
          <div class="totals-table">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${{ bill.grand_total.toFixed(2) }}</span>
            </div>
            <div class="total-row">
              <span>Pagos Realizados:</span>
              <span>-${{ bill.total_paid.toFixed(2) }}</span>
            </div>
            <div class="total-row grand-total">
              <span>Saldo Pendiente:</span>
              <span>${{ bill.balance_due.toFixed(2) }}</span>
            </div>
          </div>
        </section>

        <section v-if="payments.length > 0" class="payments-made-section">
          <h4>Pagos Registrados</h4>
          <ul>
            <li v-for="payment in payments" :key="payment.id">
              <span>{{ formatDate(payment.payment_date) }} - {{ payment.payment_method }}</span>
              <strong>${{ payment.amount }}</strong>
            </li>
          </ul>
        </section>

        <footer class="invoice-footer">
          <p>Gracias por su preferencia.</p>
        </footer>
      </div>
    </div>

    <div v-if="isPaymentModalOpen" class="modal-overlay" @click.self="closePaymentModal">
      <div class="modal-content">
        <h3>Registrar Nuevo Pago</h3>
        <form @submit.prevent="addPayment">
          <div class="form-group">
            <label class="form-label">Monto a Pagar:</label>
            <input v-model="newPayment.amount" type="number" step="0.01" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Método de Pago:</label>
            <select v-model="newPayment.payment_method" class="form-input" required>
              <option>Efectivo</option>
              <option>Tarjeta</option>
              <option>Transferencia</option>
              <option>Otro</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closePaymentModal" class="btn cancel-btn">Cancelar</button>
            <button type="submit" class="btn submit-btn">Registrar Pago</button>
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
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const bill = ref(null);
const payments = ref([]);
const loading = ref(true);
const error = ref(null);
const formError = ref(null);
const reservationId = route.params.id;

const isPaymentModalOpen = ref(false);
const newPayment = ref({
  amount: '',
  payment_method: 'Efectivo',
  reservation_id: reservationId,
});

const loadData = async () => {
  loading.value = true;
  error.value = null;
  try {
    // La API de bill ya nos da casi todo, solo necesitamos los pagos por separado para la lista
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
    closePaymentModal();
    await loadData();
  } catch (err) {
    formError.value = "Error al registrar el pago.";
    console.error(err);
  }
};

const openPaymentModal = () => {
  // El monto sugerido ahora viene del 'bill' que ya tenemos
  newPayment.value.amount = bill.value.balance_due > 0 ? bill.value.balance_due.toFixed(2) : '';
  newPayment.value.payment_method = 'Efectivo';
  isPaymentModalOpen.value = true;
};

const closePaymentModal = () => { isPaymentModalOpen.value = false; };

const printBill = async () => {
  try {
    const reservationId = route.params.id;
    // Pide el PDF a la API. 'blob' es para manejar archivos.
    const response = await apiClient.get(`reservations/${reservationId}/download_bill/`, {
      responseType: 'blob',
    });

    // Crea una URL temporal para el archivo PDF recibido
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `factura-reserva-${reservationId}.pdf`);

    // Simula un clic en el enlace para iniciar la descarga
    document.body.appendChild(link);
    link.click();

    // Limpia
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error al descargar el PDF:", error);
    alert("No se pudo generar el PDF.");
  }
};

const formatDate = (value, options = { dateStyle: 'long', timeStyle: 'short' }) => {
  if (!value) return '';
  return new Date(value).toLocaleString('es-ES', options);
};

onMounted(loadData);
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  .invoice-paper, .invoice-paper * {
    visibility: visible;
  }
  .invoice-paper {
    position: absolute;
    left: 0;
    top: 0;
    margin: 0;
    padding: 1rem;
    box-shadow: none;
    border: none;
  }
}

.bill-page-container {
  max-width: 800px;
  margin: 0 auto;
}
.action-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  justify-content: flex-end;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 10px 15px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  color: white;
}
.payment-btn { background-color: #28a745; }
.print-btn { background-color: #17a2b8; }

.invoice-paper {
  background-color: white;
  padding: 2rem 3rem;
  border-radius: 5px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border: 1px solid #dee2e6;
}
.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #333;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}
.hotel-name { font-size: 1.5rem; font-weight: bold; margin: 0; }
.invoice-info { text-align: right; }
.invoice-info h2 { margin: 0; font-size: 1.8rem; }
.invoice-info p { margin: 0; color: #555; }

.guest-info { margin-bottom: 2rem; }
.guest-info h4 { margin: 0 0 0.5rem 0; color: #555; font-size: 0.9rem; text-transform: uppercase; }

.charges-section table {
  width: 100%;
  border-collapse: collapse;
}
.charges-section th, .charges-section td {
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}
.charges-section th {
  text-align: left;
  color: #555;
  font-size: 0.9rem;
  text-transform: uppercase;
}
.text-right { text-align: right; }

.totals-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
.totals-table {
  width: 50%;
  max-width: 300px;
}
.total-row {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
}
.total-row.grand-total {
  font-weight: bold;
  font-size: 1.25rem;
  border-top: 2px solid #333;
  margin-top: 0.5rem;
  padding-top: 1rem;
}

.payments-made-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}
.payments-made-section h4 { margin-bottom: 0.5rem; }
.payments-made-section ul { list-style-type: none; padding: 0; }
.payments-made-section li { display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem; }

.invoice-footer {
  text-align: center;
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  color: #888;
  font-style: italic;
}

/* Estilos del Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 400px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
.btn { border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 1rem; }
.cancel-btn { background-color: #6c757d; color: white; }
.submit-btn { background-color: var(--color-primario); color: white; }
.form-group { margin-bottom: 1rem; }
.form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
.form-input { display: block; width: 100%; padding: 0.75rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 5px; }
</style>