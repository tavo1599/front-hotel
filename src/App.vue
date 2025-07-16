<template>
  <router-view />
</template>

<script setup>
// No se necesita lógica aquí
</script>

<style>
/* --- ESTILOS GLOBALES Y VARIABLES --- */
:root {
  --color-primario: #007bff;
  --color-fondo: #f4f7f9;
  --color-superficie: #ffffff;
  --color-texto: #333333;
  --color-borde: #dee2e6;
  --sombra-caja: 0 4px 6px rgba(0, 0, 0, 0.05);
  --radio-borde: 8px;
}

/* Reset simple y configuración de fuente */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: var(--color-fondo);
  color: var(--color-texto);
  line-height: 1.6;
}
</style>