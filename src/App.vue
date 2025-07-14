<template>
  <router-view />
</template>

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

/* --- ESTILOS DEL LAYOUT PRINCIPAL --- */
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-nav {
  background-color: var(--color-superficie);
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--color-borde);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  box-shadow: var(--sombra-caja);
}

.main-nav a {
  text-decoration: none;
  color: #555;
  font-weight: 600;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.3s;
}

.main-nav a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--color-primario);
  transition: width 0.3s;
}

.main-nav a:hover,
.main-nav a.router-link-exact-active {
  color: var(--color-primario);
}

.main-nav a.router-link-exact-active::after {
  width: 100%;
}

.logout-button {
  margin-left: auto; /* Empuja el botón a la derecha */
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: var(--radio-borde);
  cursor: pointer;
  font-weight: bold;
}

.logout-button:hover {
  background-color: #c82333;
}

.main-content {
  flex-grow: 1;
  padding: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
</style>