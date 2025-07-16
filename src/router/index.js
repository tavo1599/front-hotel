// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Importa todos tus componentes y el nuevo layout
import MainLayout from '@/layouts/MainLayout.vue';
import LoginPage from '../components/LoginPage.vue'; // O la ruta correcta a tu componente
import DashboardView from '../components/DashboardView.vue';
import RoomList from '../components/RoomList.vue';
import GuestManager from '../components/GuestManager.vue';
import GuestEdit from '../components/GuestEdit.vue';
import GuestHistory from '../components/GuestHistory.vue';
import ReservationManager from '../components/ReservationManager.vue';
import ReservationDetail from '../components/ReservationDetail.vue';
import BillView from '../components/BillView.vue';
import DirectCheckIn from '../components/DirectCheckIn.vue';
import InventoryManager from '../components/InventoryManager.vue';
import HousekeepingTasks from '../components/HousekeepingTasks.vue';
import StaffManager from '../components/StaffManager.vue';
import ReservationCalendar from '../components/ReservationCalendar.vue';
import SuperadminHotels from '../components/SuperadminHotels.vue';

const routes = [
  // 1. Ruta para el Login, está fuera del layout principal
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },

  // 2. Ruta principal que usa MainLayout como contenedor
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    // Todas las siguientes rutas son "hijas" y se mostrarán DENTRO de MainLayout
    children: [
      { path: '', redirect: '/dashboard' }, // Redirige la raíz al dashboard
      { path: 'dashboard', name: 'Dashboard', component: DashboardView },
      { path: 'habitaciones', name: 'Habitaciones', component: RoomList },
      { path: 'huespedes', name: 'Huespedes', component: GuestManager },
      { path: 'huespedes/:id/editar', name: 'EditarHuesped', component: GuestEdit },
      { path: 'huespedes/:id/historial', name: 'HistorialHuesped', component: GuestHistory },
      { path: 'reservas', name: 'Reservas', component: ReservationManager },
      { path: 'reservas/:id', name: 'DetalleReserva', component: ReservationDetail },
      { path: 'reservas/:id/cuenta', name: 'VerCuenta', component: BillView },
      { path: 'check-in', name: 'CheckInDirecto', component: DirectCheckIn },
      { path: 'inventario', name: 'Inventario', component: InventoryManager },
      { path: 'limpieza', name: 'Limpieza', component: HousekeepingTasks },
      { path: 'personal', name: 'Personal', component: StaffManager },
      { path: '/calendario', name: 'Calendario', component: ReservationCalendar, meta: { requiresAuth: true } },
      { path: 'superadmin/hoteles', name: 'SuperadminHoteles', component: SuperadminHotels, meta: { requiresAuth: true, requiresSuperuser: true } },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// El guardia de navegación no cambia
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated && to.name !== 'Login') {
    next('/login');
  } else {
    next();
  }
});

export default router;