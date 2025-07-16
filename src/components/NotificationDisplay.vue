<template>
  <div class="notification-container">
    <transition-group name="list">
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        class="notification-toast"
        :class="`is-${notification.type}`"
      >
        <i class="notification-icon" :class="getIcon(notification.type)"></i>
        <span>{{ notification.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();

const getIcon = (type) => {
  if (type === 'success') return 'ri-checkbox-circle-fill';
  if (type === 'error') return 'ri-close-circle-fill';
  return 'ri-information-fill';
};
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  width: 320px;
}
.notification-toast {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.notification-toast.is-success {
  background-color: #28a745;
}
.notification-toast.is-error {
  background-color: #dc3545;
}
.notification-icon {
  font-size: 1.5rem;
}

/* Animaciones */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>