<template>
  <div>
    <div class="header">
      <h2>Panel de Inventario</h2>
      <button @click="openCreateModal" class="add-button">
        <i class="ri-add-line"></i> Añadir Producto al Inventario
      </button>
    </div>

    <div class="table-container">
      <EasyDataTable
        :headers="headers"
        :items="inventory"
        :loading="loading"
        theme-color="#007bff"
        table-class-name="custom-table"
        buttons-pagination
        rows-per-page-message="Filas por página"
        :rows-per-page="10"
        alternating >
        <template #item-price="{ price }">
          ${{ parseFloat(price).toFixed(2) }}
        </template>
        <template #item-stock_quantity="{ stock_quantity }">
          <span :class="getStockBadgeClass(stock_quantity)">{{ stock_quantity }}</span>
        </template>
        <template #item-actions="item">
          <button @click="openEditModal(item)" class="action-icon-btn" title="Editar Stock/Precio">
            <i class="ri-pencil-line"></i>
          </button>
        </template>
      </EasyDataTable>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Editar Item del Inventario' : 'Añadir Producto al Inventario' }}</h3>
        <form @submit.prevent="handleSubmit">

          <div v-if="!isEditing" class="form-group">
            <label class="form-label">Producto del Catálogo:</label>
            <select v-model="currentItem.product_id" required class="form-input">
              <option disabled value="">Selecciona un producto</option>
              <option v-for="product in availableProducts" :key="product.id" :value="product.id">
                {{ product.name }}
              </option>
            </select>
          </div>
          <div v-else class="product-display">
            <strong>Producto:</strong> {{ currentItem.product.name }}
          </div>

          <div class="form-group">
            <label class="form-label">Precio de Venta:</label>
            <input v-model="currentItem.price" type="number" step="0.01" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">{{ isEditing ? 'Ajustar Stock (+/-)' : 'Stock Inicial' }}</label>
            <input v-model="currentItem.stock_adjustment" type="number" class="form-input" :placeholder="isEditing ? 'Ej: +24 o -1' : '0'" />
            <small v-if="isEditing">Stock actual: {{ getOriginalStock(currentItem) }}</small>
          </div>

          <p v-if="formError" style="color: red;">{{ formError }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn cancel-btn">Cancelar</button>
            <button type="submit" class="btn submit-btn">{{ isEditing ? 'Guardar Cambios' : 'Añadir' }}</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/api';
import EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';
import { useNotificationStore } from '@/stores/notification'; // <-- 1. Importa el store

const notificationStore = useNotificationStore();

const masterProducts = ref([]);
const inventory = ref([]);
const loading = ref(true);

const headers = [
  { text: "Producto", value: "product.name", sortable: true },
  { text: "Categoría", value: "product.category", sortable: true },
  { text: "Precio", value: "price", sortable: true },
  { text: "Stock", value: "stock_quantity", sortable: true },
  { text: "Acciones", value: "actions", width: 100 },
];

// Estado para el modal
const isModalOpen = ref(false);
const isEditing = ref(false);
const currentItem = ref({});
const formError = ref(null);

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

const openCreateModal = () => {
  isEditing.value = false;
  currentItem.value = { product_id: "", price: "", stock_quantity: 0 };
  formError.value = null;
  isModalOpen.value = true;
};

const openEditModal = (item) => {
  isEditing.value = true;
  currentItem.value = { ...item, stock_adjustment: 0 }; // Clonamos y añadimos el campo de ajuste
  formError.value = null;
  isModalOpen.value = true;
};

const closeModal = () => { isModalOpen.value = false; };

const handleSubmit = async () => {
  formError.value = null;
  try {
    if (isEditing.value) {
      const adjustment = parseInt(currentItem.value.stock_adjustment, 10) || 0;
      const originalStock = getOriginalStock(currentItem.value);
      const payload = {
        price: currentItem.value.price,
        stock_quantity: originalStock + adjustment,
      };
      await apiClient.patch(`inventory/${currentItem.value.id}/`, payload);
    } else {
      const payload = {
        product_id: currentItem.value.product_id,
        price: currentItem.value.price,
        stock_quantity: parseInt(currentItem.value.stock_adjustment, 10) || 0,
      };
      await apiClient.post('inventory/', payload);
    }
    closeModal();
    notificationStore.addNotification({ message: 'Inventario actualizado', type: 'success' });
    await loadData();
  } catch (err) {
    notificationStore.addNotification({ message: 'Error al actualizar inventario', type: 'error' });
    formError.value = 'Error al guardar.';
    console.error(err);
  }
};

const getOriginalStock = (item) => {
  const originalItem = inventory.value.find(i => i.id === item.id);
  return originalItem ? originalItem.stock_quantity : 0;
};

const getStockBadgeClass = (quantity) => {
  if (quantity <= 3) return 'stock-badge critical';
  if (quantity <= 10) return 'stock-badge low';
  return 'stock-badge high';
};

onMounted(loadData);
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.add-button {
  background-color: var(--color-primario);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.add-button:hover {
  background-color: #0056b3;
}
.table-container {
  background-color: var(--color-superficie);
  padding: 1rem;
  border-radius: var(--radio-borde);
  box-shadow: var(--sombra-caja);
  border: 1px solid var(--color-borde);
}

.custom-table {
  --easy-table-border: none;
  --easy-table-row-border: 1px solid #e5e7eb;
  --easy-table-header-font-size: 0.9rem;
  --easy-table-header-background-color: transparent;
  --easy-table-header-font-color: #6c757d;
  --easy-table-header-height: 50px;
  --easy-table-body-row-height: 50px;
  --easy-table-body-row-font-size: 0.95rem;
  --easy-table-body-row-font-weight: 500;
  --easy-table-body-even-row-background-color: #f8f9fa;
  --easy-table-body-row-hover-background-color: #e9ecef;
}
.action-icon-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.5rem;
}
.action-icon-btn:hover {
  color: var(--color-primario);
}

.stock-badge {
  padding: 5px 12px;
  border-radius: 16px;
  font-weight: bold;
  font-size: 0.9rem;
  color: white;
}
.stock-badge.high { background-color: #28a745; }
.stock-badge.low { background-color: #ffc107; color: #333; }
.stock-badge.critical { background-color: #dc3545; }

.product-display {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 5px;
  margin-bottom: 1rem;
  font-weight: 500;
}

/* --- ESTILOS AÑADIDOS PARA EL MODAL --- */
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
  max-width: 500px;
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
.form-input {
  display: block;
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 5px;
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
.cancel-btn {
  background-color: #6c757d;
  color: white;
}
.submit-btn {
  background-color: var(--color-primario);
  color: white;
}
</style>