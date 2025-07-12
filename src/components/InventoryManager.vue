<template>
  <div>
    <h2>Gestionar Inventario del Hotel</h2>

    <div class="form-container">
      <h3>Añadir Producto al Inventario</h3>
      <form @submit.prevent="addToInventory">
        <div class="form-group">
          <label>Producto:</label>
          <select v-model="newItem.product_id" required>
            <option disabled value="">Selecciona un producto</option>
            <option v-for="product in availableProducts" :key="product.id" :value="product.id">
              {{ product.name }} ({{ product.category }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Precio de Venta:</label>
          <input v-model="newItem.price" type="number" step="0.01" placeholder="0.00" required />
        </div>
        <div class="form-group">
          <label>Stock Inicial:</label>
          <input v-model="newItem.stock_quantity" type="number" placeholder="0" required />
        </div>
        <button type="submit">Añadir al Inventario</button>
      </form>
      <p v-if="formError" style="color: red;">{{ formError }}</p>
    </div>

    <hr />

    <h3>Inventario Actual</h3>
    <div v-if="loading">Cargando inventario...</div>
    <table v-else>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Stock</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in inventory" :key="item.id">
          <td>{{ item.product.name }}</td>
          <td>{{ item.product.category }}</td>
          <td>${{ item.price }}</td>
          <td>{{ item.stock_quantity }}</td>
        </tr>
        <tr v-if="inventory.length === 0">
          <td colspan="4">No hay productos en el inventario.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/api';

const masterProducts = ref([]);
const inventory = ref([]);
const loading = ref(true);
const formError = ref(null);

const newItem = ref({
  product_id: "",
  price: "",
  stock_quantity: ""
});

// Filtra el catálogo para mostrar solo productos que no están ya en el inventario
const availableProducts = computed(() => {
  const inventoryProductIds = new Set(inventory.value.map(item => item.product.id));
  return masterProducts.value.filter(p => !inventoryProductIds.has(p.id));
});

const loadData = async () => {
  loading.value = true;
  try {
    const [productsResponse, inventoryResponse] = await Promise.all([
      apiClient.get('products/'),
      apiClient.get('inventory/')
    ]);
    masterProducts.value = productsResponse.data;
    inventory.value = inventoryResponse.data;
  } catch (error) {
    console.error("Error cargando datos:", error);
  } finally {
    loading.value = false;
  }
};

const addToInventory = async () => {
  formError.value = null;
  try {
    await apiClient.post('inventory/', newItem.value);
    newItem.value = { product_id: "", price: "", stock_quantity: "" };
    await loadData(); // Recarga todo para ver el nuevo item
  } catch (error) {
    formError.value = "Error al añadir el producto.";
    console.error(error);
  }
};

onMounted(loadData);
</script>

<style scoped>
  .form-container { padding: 1rem; border: 1px solid #eee; border-radius: 8px; margin-bottom: 2rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background-color: #f2f2f2; }
</style>