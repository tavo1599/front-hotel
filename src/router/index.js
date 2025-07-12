// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Importa los componentes
import LoginPage from '../components/LoginPage.vue';
import RoomList from '../components/RoomList.vue';
import GuestManager from '../components/GuestManager.vue';
import RoomForm from '../components/RoomForm.vue';
import ReservationManager from '../components/ReservationManager.vue';
import DirectCheckIn from '../components/DirectCheckIn.vue';
import InventoryManager from '../components/InventoryManager.vue';
import ReservationDetail from '../components/ReservationDetail.vue';
import GuestEdit from '../components/GuestEdit.vue';
import RoomEdit from '../components/RoomEdit.vue';
import HousekeepingTasks from '../components/HousekeepingTasks.vue';
import GuestHistory from '../components/GuestHistory.vue';
import StaffManager from '../components/StaffManager.vue';
import BillView from '../components/BillView.vue';
import DashboardView from '../components/DashboardView.vue';

const routes = [
  { path: '/login', name: 'Login', component: LoginPage },
  { path: '/habitaciones', name: 'Habitaciones', component: RoomList, meta: { requiresAuth: true } },
  { path: '/habitaciones/nueva', name: 'NuevaHabitacion', component: RoomForm, meta: { requiresAuth: true } },
  { path: '/huespedes', name: 'Huespedes', component: GuestManager, meta: { requiresAuth: true } },
  { path: '/reservas', name: 'Reservas', component: ReservationManager, meta: { requiresAuth: true } },
  { path: '/check-in', name: 'CheckInDirecto', component: DirectCheckIn, meta: { requiresAuth: true } },
  { path: '/', redirect: '/habitaciones' },
  { path: '/inventario',  name: 'Inventario', component: InventoryManager, meta: { requiresAuth: true } },
  { path: '/reservas/:id',  name: 'DetalleReserva', component: ReservationDetail, meta: { requiresAuth: true } },
  { path: '/huespedes/:id/editar', name: 'EditarHuesped', component: GuestEdit, meta: { requiresAuth: true } },
  { path: '/habitaciones/:id/editar', name: 'EditarHabitacion', component: RoomEdit, meta: { requiresAuth: true } },
  { path: '/limpieza', name: 'Limpieza', component: HousekeepingTasks, meta: { requiresAuth: true } },
  { path: '/huespedes/:id/historial', name: 'HistorialHuesped', component: GuestHistory, meta: { requiresAuth: true } },
  { path: '/personal', name: 'Personal', component: StaffManager, meta: { requiresAuth: true } },
  { path: '/reservas/:id/cuenta', name: 'VerCuenta', component: BillView, meta: { requiresAuth: true } },
  { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/', redirect: '/dashboard' }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// Guardia de navegación
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login'); // Si la ruta requiere auth y no hay token, redirige a login
  } else {
    next(); // Si no, permite el acceso
  }
});

export default router;