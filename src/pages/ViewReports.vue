<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { fetchReportsPageWithCount } from "../services/reports"; // 👈 ahora TODOS

const reports = ref([]);
const page = ref(1);
const pageSize = 3;
const total = ref(0);
const loading = ref(false);
const errorMsg = ref("");

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
watch(page, loadPage);
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-semibold mb-6">Reportes</h1>

    <div v-if="errorMsg" class="mb-4 text-red-600">{{ errorMsg }}</div>
    <div v-if="loading" class="mb-4 text-gray-500">Cargando…</div>
    <div v-if="!loading && reports.length === 0" class="text-gray-600">
      No tenés reportes todavía.
    </div>

    <!-- Lista de reportes (tarjetas más grandes) -->
    <ul class="space-y-4 mb-6">
      <li
        v-for="r in reports"
        :key="r.id"
        class="rounded-2xl border border-gray-100 bg-white p-5 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-start sm:items-center gap-4">
          <img
            :src="r.imagen"
            alt=""
            class="w-20 h-20 rounded-xl object-cover border border-gray-200"/>
          <div class="flex-1">
            <p class="text-xs text-gray-400">
              {{ new Date(r.created_at).toLocaleString() }}
            </p>
            <h3 class="text-lg font-semibold text-gray-800">
              {{ r.categoria }}
            </h3>
            <p class="text-gray-600 text-sm mt-1">{{ r.descripcion }}</p>
            <p class="text-gray-500 text-sm mt-1 italic">{{ r.ubicacion }}</p>
          </div>
        </div>
      </li>
    </ul>

    <!-- Paginación Tailwind -->
    <nav v-if="totalPages > 1" class="flex items-center justify-center gap-2">
      <button
        @click="goTo(page - 1)"
        :disabled="page === 1"
        class="px-3 py-1 rounded border"
        :class="
          page === 1
            ? 'text-gray-300 border-gray-200'
            : 'hover:bg-gray-100 border-gray-300'"
      >
        ‹
      </button>

      <!-- números (simple) -->
      <button
        v-for="p in totalPages"
        :key="p"
        @click="goTo(p)"
        class="px-3 py-1 rounded border"
        :class="
          p === page
            ? 'bg-blue-600 text-white border-blue-600'
            : 'border-gray-300 hover:bg-gray-100'
        "
      >
        {{ p }}
      </button>

      <button
        @click="goTo(page + 1)"
        :disabled="page === totalPages"
        class="px-3 py-1 rounded border"
        :class="
          page === totalPages
            ? 'text-gray-300 border-gray-200'
            : 'hover:bg-gray-100 border-gray-300'
        "
      >
        ›
      </button>
    </nav>
  </div>
  <router-link
    to="/"
    class="bg-blue-600 text-white py-2 px-4 rounded w-1/2 mx-auto text-center mb-3 hover:bg-blue-700 mt-8 block"
  >
    Volver a la página de inicio
  </router-link>
</template>
