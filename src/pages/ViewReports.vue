<template>
  <div class="max-w-md mx-auto p-4">
    <h1 class="text-2xl font-semibold text-center mb-4">Reportes</h1>

    <!-- Botón de filtro -->
  <!--  <div class="flex justify-center mb-4">
      <button
        @click="toggleFiltro"
        class="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Filtrar por
      </button>
    </div>

    <!-- Panel de filtros -->
    <div v-if="mostrarFiltro" class="bg-gray-100 p-4 rounded mb-4">
      <div class="space-y-2">
        <label>
          <input type="checkbox" v-model="filtros.masRecientes" />
          Más recientes
        </label>
        <br />
        <label>
          <input type="checkbox" v-model="filtros.pendientes" />
          Pendientes de resolución
        </label>
        <br />
        <label>
          <input type="checkbox" v-model="filtros.resueltos" />
          Resueltos
        </label>
        <br />
      </div>
      <div class="mt-4 flex justify-between">
        <button
          @click="aplicarFiltros"
          class="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Aplicar filtros
        </button>
        <button @click="limpiarFiltros" class="text-blue-600 underline">
          Limpiar filtros
        </button>
      </div>
    </div>
   

    <!-- Lista de reportes -->
    <div
      v-for="(reporte, index) in reportesFiltrados"
      :key="index"
      class="bg-white border border-gray-300 rounded p-4 mb-4 shadow"
    >
      <h2 class="text-md font-semibold mb-1">{{ reporte.categoria }}</h2>
      <p class="text-sm text-gray-600 mb-1">
        Descripción: {{ reporte.descripcion }}
      </p>
      <p class="text-sm text-gray-600 mb-1">
        Ubicación: {{ reporte.ubicacion }}
      </p>
      <p class="text-sm text-gray-600 mb-1">
        Enviado por: {{ reporte.email }}
      </p>
      <p class="text-sm text-gray-600 mb-1">
        Fecha: {{ new Date(reporte.created_at).toLocaleString() }}
      </p>

      <div v-if="reporte.imagen" class="mt-2">
        <img
          :src="reporte.imagen"
          alt="Imagen del reporte"
          class="w-full rounded border"
        />
      </div>
    </div>
  </div>

  <router-link
    to="/"
    class="bg-blue-600 text-white py-2 px-4 rounded block w-1/2 mx-auto block text-center mb-3 hover:bg-blue-700"
  >
    Volver a la página de inicio
  </router-link>
</template>

<script setup>
import { fetchAllReports, subscribeToNewReports } from "../services/reports";
import { onMounted, ref, computed } from "vue";

// Estado del panel de filtros
const mostrarFiltro = ref(false);
const toggleFiltro = () => {
  mostrarFiltro.value = !mostrarFiltro.value;
};

// Reportes cargados
const reportes = ref([]);

// Carga inicial de reportes
onMounted(async () => {
  try {
    reportes.value = await fetchAllReports();
    console.log("Datos recibidos:", reportes.value);
    console.log('Cantidad de reportes:', reportes.value.length);
console.log('Primer reporte:', reportes.value[0]);

    subscribeToNewReports((nuevoReporte) => {
      reportes.value.push(nuevoReporte);
    });
  } catch (err) {
    console.error("Error al traer los reportes", err);
  }
});

// Filtros (aunque no se usan por ahora)
const filtros = ref({
  masRecientes: true,
  pendientes: true,
  resueltos: true,
});

// Botones (sin lógica aún)
const aplicarFiltros = () => {};
const limpiarFiltros = () => {
  filtros.value = {
    masRecientes: false,
    pendientes: false,
    resueltos: false,
  };
};

const reportesFiltrados = computed(() => {
  return reportes.value;
});
</script>