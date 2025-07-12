<template>
  <div>
    <div v-if="loading">Cargando historial...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>
    <div v-else>
      <h2>Historial de {{ guest.first_name }} {{ guest.last_name }}</h2>
      <div v-if="reservations.length > 0">
        <div v-for="res in reservations" :key="res.id" class="reservation-card">
          <p>
            <strong>Habitación:</strong> {{ res.room.room_number }}
            (del {{ res.check_in_date }} al {{ res.check_out_date }})
          </p>
          <p><strong>Estado:</strong> {{ res.status }}</p>
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
    // Hacemos dos llamadas: una para los datos del huésped y otra para su historial
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
</script>

<style scoped>
.reservation-card {
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-left: 5px solid #007bff;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 5px;
}
</style>