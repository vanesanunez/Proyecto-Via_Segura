<script setup>
import { ref } from 'vue'

const data = ref([])
const loading = ref(false)
const error = ref(null)
const open = ref(false)

const fetchInfo = async () => {
  // si ya está abierto, cerramos
  if (open.value) {
    open.value = false
    return
  }

  loading.value = true
  error.value = null
  try {
    const response = await fetch("https://datosabiertos-apis.buenosaires.gob.ar/BA_Root/Documentacion?schema_name=datos_utiles")
    const result = await response.json()
    console.log(result);
    data.value = result
    open.value = true
  } catch (err) {
    error.value = "No se pudo cargar la información"
  } finally {
    loading.value = false
  }
}
</script>

<template>
   <div
  class="w-full h-40 border-2 border-blue-400 rounded-lg flex flex-col items-center justify-center text-center shadow-md hover:shadow-lg transition"
>
  <h2 class="text-base font-semibold text-blue-700 mb-2">ℹ️ Info Útil</h2>
  
  <!-- Botón -->
  <button 
    @click="fetchInfo"
    class="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition text-sm"
  >
    {{ open ? "Cerrar" : "Ver info CABA" }}
  </button>

  <!-- Contenido desplegable -->
  <transition name="fade">
    <div v-if="open" class="mt-3 max-h-32 overflow-y-auto text-xs px-2">
      <p v-if="loading" class="text-gray-500">Cargando...</p>
      <p v-if="error" class="text-red-500">{{ error }}</p>

      <ul v-if="data.length" class="space-y-1">
        <li 
          v-for="(item, index) in data.slice(0,3)" 
          :key="index"
          class="border-b border-gray-200 pb-1"
        >
          📍 <strong>{{ item.nombre }}</strong><br>
          <span class="text-gray-600">{{ item.direccion }}</span>
        </li>
      </ul>
    </div>
  </transition>
</div>
   
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>