<template>
  <div>
    <div class="header">
      <h2>Catálogo Maestro de Productos</h2>
      <button @click="openCreateModal" class="add-button">
        <i class="ri-add-line"></i> Nuevo Producto
      </button>
    </div>

    <div class="table-container">
      <EasyDataTable
        :headers="headers"
        :items="products"
        :loading="loading"
        table-class-name="custom-table"
        theme-color="#007bff"
        alternating
        buttons-pagination
      >
        <template #item-actions="item">
          <div class="actions-wrapper">
            <button @click="openEditModal(item)" class="action-icon-btn" title="Editar Producto">
              <i class="ri-pencil-line"></i>
            </button>
            <button @click="deleteProduct(item)" class="action-icon-btn delete" title="Eliminar Producto">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </template>
      </EasyDataTable>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Editar' : 'Añadir' }} Producto</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">Nombre del Producto</label>
            <input v-model="currentProduct.name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Categoría</label>
            <select v-model="currentProduct.category" class="form-input" required>
              <option value="bebidas">Bebidas</option>
              <option value="snacks">Snacks</option>
              <option value="limpieza">Productos de Limpieza</option>
              <option value="suministros">Suministros de Oficina</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Descripción (Opcional)</label>
            <textarea v-model="currentProduct.description" class="form-input"></textarea>
          </div>
          <p v-if="formError" class="error-text">{{ formError }}</p>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn cancel-btn">Cancelar</button>
            <button type="submit" class="btn submit-btn">{{ isEditing ? 'Guardar Cambios' : 'Crear Producto' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api';
import EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();
const products = ref([]);
const loading = ref(true);
const headers = [
  { text: "Nombre", value: "name", sortable: true },
  { text: "Categoría", value: "category", sortable: true },
  { text: "Descripción", value: "description" },
  { text: "Acciones", value: "actions", width: 120 },
];
const isModalOpen = ref(false);
const isEditing = ref(false);
const currentProduct = ref({});
const formError = ref(null);

const loadProducts = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get('products/');
    products.value = response.data;
  } catch (error) { console.error("Error al cargar los productos:", error); } 
  finally { loading.value = false; }
};

const openCreateModal = () => {
  isEditing.value = false;
  currentProduct.value = { name: '', category: 'snacks', description: '' };
  formError.value = null;
  isModalOpen.value = true;
};

const openEditModal = (product) => {
  isEditing.value = true;
  currentProduct.value = { ...product };
  formError.value = null;
  isModalOpen.value = true;
};

const closeModal = () => { isModalOpen.value = false; };

const handleSubmit = async () => {
  formError.value = null;
  try {
    if (isEditing.value) {
      await apiClient.patch(`products/${currentProduct.value.id}/`, currentProduct.value);
      notificationStore.addNotification({ message: 'Producto actualizado con éxito', type: 'success' });
    } else {
      await apiClient.post('products/', currentProduct.value);
      notificationStore.addNotification({ message: 'Producto creado con éxito', type: 'success' });
    }
    closeModal();
    await loadProducts();
  } catch (err) {
    formError.value = 'Error al guardar el producto.';
    notificationStore.addNotification({ message: 'Error al guardar el producto', type: 'error' });
    console.error(err);
  }
};

const deleteProduct = async (product) => {
  if (confirm(`¿Estás seguro de que quieres eliminar el producto "${product.name}"?`)) {
    try {
      await apiClient.delete(`products/${product.id}/`);
      notificationStore.addNotification({ message: 'Producto eliminado', type: 'success' });
      await loadProducts();
    } catch (err) {
      notificationStore.addNotification({ message: 'Error al eliminar el producto', type: 'error' });
      console.error(err);
    }
  }
};

onMounted(loadProducts);
</script>

<style scoped>
/* Estilos generales de la página */
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.add-button { background-color: var(--color-primario); color: white; border: none; padding: 8px 15px; border-radius: 5px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
.table-container { background-color: var(--color-superficie); padding: 1rem; border-radius: var(--radio-borde); box-shadow: var(--sombra-caja); border: 1px solid var(--color-borde); }
.custom-table { --easy-table-border: none; --easy-table-row-border: 1px solid #e5e7eb; --easy-table-header-background-color: transparent; --easy-table-body-even-row-background-color: #f8f9fa; }
.actions-wrapper { display: flex; gap: 0.5rem; justify-content: center; }
.action-icon-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #6c757d; padding: 0.5rem; border-radius: 50%; }
.action-icon-btn:hover { background-color: #f0f0f0; color: var(--color-primario); }
.action-icon-btn.delete:hover { color: #dc3545; }
textarea.form-input { height: 100px; resize: vertical; }

/* --- ESTILOS PARA EL MODAL --- */
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
  font-weight: 600;
}
.form-group {
  margin-bottom: 1.25rem;
}
.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
  color: #495057;
}
.form-input {
  display: block;
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 5px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus {
  outline: none;
  border-color: var(--color-primario);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
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
  transition: all 0.2s;
}
.cancel-btn {
  background-color: #e9ecef;
  color: #495057;
}
.cancel-btn:hover {
  background-color: #dee2e6;
}
.submit-btn {
  background-color: var(--color-primario);
  color: white;
}
.submit-btn:hover {
  opacity: 0.9;
}
.error-text {
  color: #dc3545;
  font-size: 0.9rem;
}
</style>