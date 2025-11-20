<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { fetchReportsPageWithCount } from "../services/reports";
import ReportCard from "../components/ReportCard.vue";

const reports = ref([]);
const page = ref(1);
const pageSize = 3;
const total = ref(0);
const loading = ref(false);
const errorMsg = ref("");

// Un solo filtro combinado
const filterMode = ref("recent"); // "recent" | "oldest" | "pending" | "resolved" | "most_supported" | "least_supported"
const showFilterSheet = ref(false);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize))
);

async function loadPage() {
  loading.value = true;
  errorMsg.value = "";
  try {
    const { data, count } = await fetchReportsPageWithCount({
      page: page.value,
      pageSize,
      mode: filterMode.value,
    });
    reports.value = data;
    total.value = count;
  } catch (e) {
    console.error(e);
    errorMsg.value = "No se pudieron cargar los reportes.";
  } finally {
    loading.value = false;
  }
}

function goTo(p) {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
}

onMounted(loadPage);

// si cambio de página, recargo
watch(page, loadPage);

// si cambia el modo de filtro, vuelvo a la página 1 y recargo
watch(filterMode, () => {
  page.value = 1;
  loadPage();
});
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8 relative">
    <!-- Barra superior con título + botón Filtros -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">Reportes</h1>

      <button type="button" @click="showFilterSheet = true"
        class="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 active:scale-[.97] transition">
        <!-- Icono de filtro -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 
         01-1.447.894l-4-2A1 1 0 018 17V13.414L3.293 6.707A1 1 0 013 6V4z" />
        </svg>

        <span>Filtros</span>
      </button>
    </div>

    <div v-if="errorMsg" class="mb-4 text-red-600">{{ errorMsg }}</div>
    <div v-if="loading" class="mb-4 text-gray-500">Cargando…</div>
    <div v-if="!loading && reports.length === 0" class="text-gray-600">
      No tenés reportes todavía.
    </div>

    <ul class="space-y-4 mb-6">
      <ReportCard v-for="r in reports" :key="r.id" :report="r" :to="`/report/${r.id}`" />
    </ul>

    <!-- Paginación -->
    <nav v-if="totalPages > 1" class="flex items-center justify-center gap-2">
      <button @click="goTo(page - 1)" :disabled="page === 1" class="px-3 py-1 rounded border" :class="page === 1
          ? 'text-gray-300 border-gray-200'
          : 'hover:bg-gray-100 border-gray-300'
        ">
        ‹
      </button>

      <button v-for="p in totalPages" :key="p" @click="goTo(p)" class="px-3 py-1 rounded border" :class="p === page
          ? 'bg-blue-600 text-white border-blue-600'
          : 'border-gray-300 hover:bg-gray-100'
        ">
        {{ p }}
      </button>

      <button @click="goTo(page + 1)" :disabled="page === totalPages" class="px-3 py-1 rounded border" :class="page === totalPages
          ? 'text-gray-300 border-gray-200'
          : 'hover:bg-gray-100 border-gray-300'
        ">
        ›
      </button>
    </nav>

    <!-- Botón volver a inicio -->
    <router-link to="/"
      class="bg-[#3082e3] text-white py-2 px-4 rounded w-1/2 mx-auto text-center mb-3 hover:bg-[#085baf] mt-8 block">
      Volver a la página de inicio
    </router-link>

    <!-- FONDO OSCURO FILTROS -->
    <div v-if="showFilterSheet" class="fixed inset-0 bg-black/40 z-40" @click="showFilterSheet = false"></div>

    <!-- BOTTOM SHEET DE FILTROS (TODO JUNTO) -->
    <div v-if="showFilterSheet"
      class="fixed bottom-0 left-0 w-full bg-white rounded-t-2xl shadow-xl z-50 p-4 pb-6 animate-slide-up">
      <div class="flex justify-center mb-2">
        <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      <h2 class="text-lg font-semibold text-gray-800 mb-3">Filtros</h2>

      <div class="mb-4">
        <p class="text-m font-medium text-gray-700 mb-2">Mostrar</p>
        <div class="space-y-1 text-sm">
          <label class="flex items-center gap-2">
            <input type="radio" value="recent" v-model="filterMode" />
            <span class="text-lg">Más recientes</span>
          </label>

          <label class="flex items-center gap-2">
            <input type="radio" value="oldest" v-model="filterMode" />
            <span class="text-lg">Más antiguos</span>
          </label>

          <label class="flex items-center gap-2">
            <input type="radio" value="pending" v-model="filterMode" />
            <span class="text-lg">Pendientes de resolución</span>
          </label>

          <label class="flex items-center gap-2">
            <input type="radio" value="resolved" v-model="filterMode" />
            <span class="text-lg">Resueltos</span>
          </label>

          <label class="flex items-center gap-2">
            <input type="radio" value="most_supported" v-model="filterMode" />
            <span class="text-lg">Más apoyados</span>
          </label>

          <label class="flex items-center gap-2">
            <input type="radio" value="least_supported" v-model="filterMode" />
            <span class="text-lg">Menos apoyados</span>
          </label>
        </div>
      </div>

      <div class="flex gap-2 mt-2">
        <button type="button"
          class="flex-1 bg-[#3082e3] text-white py-2 rounded-lg text-m font-medium hover:bg-[#085baf] active:scale-[.98] transition"
          @click="showFilterSheet = false">
          Aplicar filtros
        </button>

        <button type="button"
          class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-m font-medium hover:bg-gray-200 active:scale-[.98]"
          @click="filterMode = 'recent'">
          Limpiar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0%);
  }
}

.animate-slide-up {
  animation: slide-up 0.25s ease-out;
}
</style>
