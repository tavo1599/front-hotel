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
      <table v-if="bill.sales_details.length > 0">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(sale, index) in bill.sales_details" :key="index">
            <td>{{ sale.product }}</td>
            <td>{{ sale.quantity }}</td>
            <td>${{ sale.unit_price }}</td>
            <td>${{ sale.total.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>No hay consumos registrados.</p>
      <p><strong>Subtotal Consumos: ${{ bill.sales_subtotal.toFixed(2) }}</strong></p>

      <hr>
      <div class="grand-total">
        <h3>TOTAL A PAGAR: ${{ bill.grand_total.toFixed(2) }}</h3>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '@/api';

const route = useRoute();
const bill = ref(null);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  const reservationId = route.params.id;
  try {
    const response = await apiClient.get(`reservations/${reservationId}/bill/`);
    bill.value = response.data;
  } catch (err) {
    error.value = "Error al generar la cuenta.";
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.bill-container { padding: 2rem; border: 1px solid #ccc; border-radius: 8px; background: white; }
hr { margin: 1.5rem 0; }
table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
.grand-total { text-align: right; margin-top: 2rem; font-size: 1.5rem; }
</style>