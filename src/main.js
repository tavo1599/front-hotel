// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia' // <-- Importar
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia()) // <-- Usar Pinia
app.use(router)

app.mount('#app')