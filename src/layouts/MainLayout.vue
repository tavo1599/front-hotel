<template>
  <div class="main-layout" :class="{ 'sidebar-collapsed': !isSidebarOpen }">
    <aside class="sidebar">
      <div class="sidebar-header">
    <h3 v-show="isSidebarOpen">{{ authStore.hotelName }}</h3>
    <button @click="toggleSidebar" class="toggle-btn desktop-only">
      <i class="ri-menu-line"></i>
    </button>
  </div>
      <nav class="sidebar-nav">
        <router-link to="/dashboard"><i class="ri-dashboard-line icon"></i><span v-show="isSidebarOpen">Dashboard</span></router-link>
        <router-link to="/check-in"><i class="ri-login-box-line icon"></i><span v-show="isSidebarOpen">Check-in Directo</span></router-link>
        <router-link to="/reservas"><i class="ri-calendar-check-line icon"></i><span v-show="isSidebarOpen">Reservas</span></router-link>
        <router-link to="/habitaciones"><i class="ri-hotel-bed-line icon"></i><span v-show="isSidebarOpen">Habitaciones</span></router-link>
        <router-link to="/huespedes"><i class="ri-group-line icon"></i><span v-show="isSidebarOpen">Huéspedes</span></router-link>
        <router-link to="/inventario"><i class="ri-archive-drawer-line icon"></i><span v-show="isSidebarOpen">Inventario</span></router-link>
        <router-link to="/limpieza"><i class="ri-brush-line icon"></i><span v-show="isSidebarOpen">Limpieza</span></router-link>
        <router-link to="/personal"><i class="ri-admin-line icon"></i><span v-show="isSidebarOpen">Personal</span></router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-info" v-show="isSidebarOpen">
          <span class="user-name">{{ authStore.userFullName }}</span>
          
        </div>
          <button @click="handleLogout" class="logout-button" title="Cerrar Sesión" v-show="isSidebarOpen">
            <i class="ri-logout-box-r-line icon"></i>
          </button>
        </div>
      </div>
    </aside>

    <div class="content-wrapper">
      <header class="top-bar mobile-only">
        <button @click="toggleSidebar" class="toggle-btn">
          <i class="ri-menu-line"></i>
        </button>
        <h3>HotelSys</h3>
      </header>
      <main class="main-content">
        <router-view />
      </main>
      <footer class="main-footer">
        &copy; {{ currentYear }} Manis'dev. Todos los derechos reservados.
        <span class="version-tag">v1.0.0</span>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';


const isSidebarOpen = ref(true);
const authStore = useAuthStore();
const router = useRouter();
const currentYear = computed(() => new Date().getFullYear());


const userInitial = computed(() => (authStore.userFullName ? authStore.userFullName.charAt(0).toUpperCase() : (authStore.username ? authStore.username.charAt(0).toUpperCase() : '?')));

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
/* Estilos del Layout Principal */
.main-layout {
  display: flex;
}

/* --- Sidebar --- */
.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
  color: #e2e8f0;
  position: fixed; /* Cambiado a fixed para que siempre esté visible */
  top: 0;
  left: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, transform 0.3s ease; /* Añadido transform */
  z-index: 100;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  height: 64px;
  flex-shrink: 0; /* Evita que se encoja */
}
.sidebar-header h3 { margin: 0; white-space: nowrap; }
.toggle-btn { background: none; border: none; color: #a0aec0; font-size: 1.5rem; cursor: pointer; }

.sidebar-nav {
  padding-top: 1rem;
  flex-grow: 1;
  overflow-y: auto; /* Permite scroll si el menú es muy largo */
}
.sidebar-nav a {
  text-decoration: none;
  color: #a0aec0;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  white-space: nowrap;
}
.sidebar-nav a:hover { background-color: #4a5568; color: white; }
.sidebar-nav a.router-link-exact-active {
  background-color: rgba(0, 123, 255, 0.1);
  color: white;
  font-weight: bold;
  border-left: 4px solid var(--color-primario);
  padding-left: calc(1.5rem - 4px);
}
.sidebar-nav .icon { font-size: 1.2rem; }

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #4a5568;
  flex-shrink: 0; /* Evita que se encoja */
}
.user-profile { display: flex; align-items: center; gap: 0.75rem; }
.user-avatar { width: 40px; height: 40px; border-radius: 50%; background-color: var(--color-primario); color: white; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.2rem; }
.user-info { flex-grow: 1; }
.user-name { white-space: nowrap; }
.logout-button { background: none; border: none; color: #a0aec0; cursor: pointer; padding: 0.5rem; border-radius: 50%; transition: background-color 0.2s; }
.logout-button:hover { background-color: #4a5568; color: white; }

/* --- Contenedor del Contenido Principal --- */
.content-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-fondo);
  margin-left: 260px; /* Ancho inicial del sidebar */
  width: calc(100% - 260px);
  transition: margin-left 0.3s ease, width 0.3s ease;
}

.main-content {
  flex-grow: 1; /* Empuja el footer hacia abajo */
  padding: 2rem;
}

.main-footer {
  text-align: center;
  padding: 1rem;
  background-color: var(--color-superficie);
  border-top: 1px solid var(--color-borde);
  font-size: 0.9rem;
  color: #888;
  position: relative; /* Para posicionar la versión dentro */
}

.version-tag {
  position: absolute;
  bottom: 10px;
  right: 20px;
  font-size: 0.75rem;
  color: #aaa;
}

/* --- Lógica de Colapso --- */
.main-layout.sidebar-collapsed .sidebar {
  width: 80px;
}
.main-layout.sidebar-collapsed .content-wrapper {
  margin-left: 80px;
  width: calc(100% - 80px);
}
.main-layout.sidebar-collapsed .sidebar-header h3,
.main-layout.sidebar-collapsed .sidebar-nav span,
.main-layout.sidebar-collapsed .user-info,
.main-layout.sidebar-collapsed .logout-button {
  display: none;
}

/* --- Diseño Responsivo --- */
.desktop-only { display: block; }
.mobile-only { display: none; }

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .main-layout.sidebar-collapsed .sidebar {
    transform: translateX(0);
  }
  .content-wrapper {
    margin-left: 0;
    width: 100%;
  }
  .desktop-only { display: none; }
  .mobile-only { display: block; }
  .top-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0 1rem;
    height: 64px;
    background-color: var(--color-superficie);
    border-bottom: 1px solid var(--color-borde);
  }
}
</style>