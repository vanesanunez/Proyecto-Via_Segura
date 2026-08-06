<script setup>
import { rewardUserForSupport } from "../services/gamification";
import BottomNavigation from "../components/BottomNavigation.vue";
import { ref, computed, onMounted, watch } from "vue";
import {
  fetchReportsPageWithCount,
  joinReport,
  fetchUserSupportedReportIds,
} from "../services/reports";
import { subscribeToUserState } from "../services/auth";
import ReportCard from "../components/ReportCard.vue";

const reports = ref([]);
const page = ref(1);
const pageSize = 3;
const total = ref(0);
const loading = ref(false);
const errorMsg = ref("");
const infoMsg = ref("");

const filterMode = ref("recent");
const showFilterSheet = ref(false);

const user = ref({ id: null, email: null });
const supportedReportIds = ref([]);
const supportingId = ref(null);

subscribeToUserState((newUserData) => {
  user.value = newUserData;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize)),
);

const visiblePages = computed(() => {
  if (totalPages.value <= 3) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  }

  if (page.value <= 2) return [1, 2, 3];

  if (page.value >= totalPages.value - 1) {
    return [totalPages.value - 2, totalPages.value - 1, totalPages.value];
  }

  return [page.value - 1, page.value, page.value + 1];
});

async function loadPage() {
  loading.value = true;
  errorMsg.value = "";

  try {
    const { data, count } = await fetchReportsPageWithCount({
      page: page.value,
      pageSize,
      mode: filterMode.value,
    });

    reports.value = data ?? [];
    total.value = count ?? 0;

    if (user.value.id) {
      const ids = reports.value.map((r) => r.id);
      supportedReportIds.value = await fetchUserSupportedReportIds(
        user.value.id,
        ids,
      );
    } else {
      supportedReportIds.value = [];
    }
  } catch (e) {
    console.error(e);
    errorMsg.value = "No se pudieron cargar los reportes.";
  } finally {
    loading.value = false;
  }
}

async function handleSupport(report) {
  if (!user.value.id) {
    errorMsg.value = "Tenés que iniciar sesión para sumarte al reporte.";
    return;
  }

  supportingId.value = report.id;
  errorMsg.value = "";
  infoMsg.value = "";

  try {
    const result = await joinReport(report.id, user.value.id);

    reports.value = reports.value.map((r) =>
      r.id === report.id ? { ...r, apoyos: result.apoyos } : r,
    );

    if (!supportedReportIds.value.includes(report.id)) {
      supportedReportIds.value = [...supportedReportIds.value, report.id];
    }

    if (result.status === "already_supported") {
      infoMsg.value = "Ya te habías sumado a este reporte.";
      return;
    }

    try {
      await rewardUserForSupport(user.value.id);
    } catch (rewardError) {
      console.error("[handleSupport] El apoyo se registró, pero no se pudo actualizar la gamificación:", rewardError);
    }

    infoMsg.value = "Te sumaste al reporte.";
  } catch (e) {
    console.error(e);
    errorMsg.value = "No se pudo registrar tu apoyo.";
  } finally {
    supportingId.value = null;
  }
}

function goTo(p) {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
}

onMounted(loadPage);

watch(page, loadPage);

watch(filterMode, () => {
  if (page.value !== 1) {
    page.value = 1;
  } else {
    loadPage();
  }
});

watch(
  () => user.value.id,
  () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      loadPage();
    }
  },
);
</script>

<template>
  <section class="min-h-screen overflow-x-hidden bg-white px-4 pt-6 pb-24">
    <div class="mx-auto w-full max-w-[390px]">
      <!-- Header -->
       <div class="flex items-center gap-3  px-4 py-3 border-b border-gray-100">
        <button @click="$router.back()"
          class="flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#2a2a2a"
            stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="min-w-0">
          <h1 class="text-base font-semibold leading-tight" style="color:#2a2a2a;">Reportes</h1>
          <p class="text-xs" style="color:#6b7280;"> Consultá reclamos de la comunidad y sumate a los que también te preocupan.</p>
        </div>
      </div>

          <button
          type="button"
          @click="showFilterSheet = true"
          class="inline-flex w-fit items-center gap-2 rounded-full bg-[#E0E5EC] px-4 py-2.5 text-sm font-medium text-slate-700
                 shadow-[0_6px_16px_rgba(148,163,184,0.18)]
                 transition hover:text-[#3082e3] active:scale-[0.97]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17V13.414L3.293 6.707A1 1 0 013 6V4z"
            />
          </svg>
          <span>Filtros</span>
        </button>


      <!-- Mensajes -->
      <div
        v-if="infoMsg"
        class="mb-4 rounded-2xl bg-[#eef4ff] px-4 py-3 text-sm text-[#3082e3] shadow-[0_6px_16px_rgba(148,163,184,0.18)]"
      >
        {{ infoMsg }}
      </div>

      <div
        v-if="errorMsg"
        class="mb-4 rounded-2xl bg-[#fff1ed] px-4 py-3 text-sm text-[#e67661] shadow-[0_6px_16px_rgba(148,163,184,0.18)]"
      >
        {{ errorMsg }}
      </div>

      <div
        v-if="loading"
        class="mb-4 rounded-2xl bg-[#E0E5EC] px-4 py-3 text-sm text-slate-500 shadow-[0_6px_16px_rgba(148,163,184,0.18)]"
      >
        Cargando reportes...
      </div>

      <div
        v-if="!loading && reports.length === 0"
        class="rounded-2xl bg-[#E0E5EC] px-4 py-4 text-sm text-slate-500 shadow-[0_6px_16px_rgba(148,163,184,0.18)]"
      >
        No hay reportes para mostrar con este filtro.
      </div>

      <!-- Lista -->
      <ul class="mb-8 space-y-4">
        <ReportCard
          v-for="r in reports"
          :key="r.id"
          :report="r"
          :to="`/report/${r.id}`"
          :supporting="supportingId === r.id"
          :already-supported="supportedReportIds.includes(r.id)"
          @support="handleSupport"
        />
      </ul>

      <!-- Paginación -->
      <nav
        v-if="totalPages > 1"
        class="flex items-center justify-center gap-2"
      >
        <button
          @click="goTo(page - 1)"
          :disabled="page === 1"
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0E5EC] text-lg shadow-[0_6px_16px_rgba(148,163,184,0.18)] transition"
          :class="
            page === 1
              ? 'cursor-not-allowed text-slate-300'
              : 'text-slate-700 hover:text-[#3082e3] active:scale-[0.97]'
          "
        >
          ‹
        </button>

        <button
          v-for="p in visiblePages"
          :key="p"
          @click="goTo(p)"
          class="flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition"
          :class="
            p === page
              ? 'bg-[#3082e3] text-white shadow-sm'
              : 'bg-[#E0E5EC] text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.18)] hover:text-[#3082e3] active:scale-[0.97]'
          "
        >
          {{ p }}
        </button>

        <button
          @click="goTo(page + 1)"
          :disabled="page === totalPages"
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0E5EC] text-lg shadow-[0_6px_16px_rgba(148,163,184,0.18)] transition"
          :class="
            page === totalPages
              ? 'cursor-not-allowed text-slate-300'
              : 'text-slate-700 hover:text-[#3082e3] active:scale-[0.97]'
          "
        >
          ›
        </button>
      </nav>

     
    </div>

    <!-- Fondo oscuro filtros -->
    <div
      v-if="showFilterSheet"
      class="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px]"
      @click="showFilterSheet = false"
    ></div>

    <!-- Bottom sheet filtros -->
    <div
      v-if="showFilterSheet"
      class="fixed bottom-0 left-0 z-60 w-full rounded-t-[28px] bg-[#E0E5EC] p-4 pb-8 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] animate-slide-up"
    >
      <div class="mb-3 flex justify-center">
        <div class="h-1.5 w-14 rounded-full bg-slate-300"></div>
      </div>

      <h2 class="text-xl font-bold text-slate-900">Filtros</h2>
      <p class="mt-1 text-sm text-slate-500">
        Elegí cómo querés visualizar los reportes.
      </p>

      <div class="mt-5">
        <p class="mb-3 text-sm font-semibold text-slate-700">Mostrar</p>

        <div class="space-y-2">
          <label class="flex items-center gap-3 rounded-2xl bg-[#E0E5EC] px-3 py-3 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.18)]">
            <input type="radio" value="recent" v-model="filterMode" />
            <span>Más recientes</span>
          </label>

          <label class="flex items-center gap-3 rounded-2xl bg-[#E0E5EC] px-3 py-3 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.18)]">
            <input type="radio" value="oldest" v-model="filterMode" />
            <span>Más antiguos</span>
          </label>

          <label class="flex items-center gap-3 rounded-2xl bg-[#E0E5EC] px-3 py-3 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.18)]">
            <input type="radio" value="pending" v-model="filterMode" />
            <span>Pendientes de resolución</span>
          </label>

          <label class="flex items-center gap-3 rounded-2xl bg-[#E0E5EC] px-3 py-3 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.18)]">
            <input type="radio" value="resolved" v-model="filterMode" />
            <span>Resueltos</span>
          </label>

          <label class="flex items-center gap-3 rounded-2xl bg-[#E0E5EC] px-3 py-3 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.18)]">
            <input type="radio" value="most_supported" v-model="filterMode" />
            <span>Más apoyados</span>
          </label>

          <label class="flex items-center gap-3 rounded-2xl bg-[#E0E5EC] px-3 py-3 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.18)]">
            <input type="radio" value="least_supported" v-model="filterMode" />
            <span>Menos apoyados</span>
          </label>
        </div>
      </div>

      <div class="mt-5 flex gap-3">
        <button
          type="button"
          class="flex-1 rounded-2xl bg-[#3082e3] py-3 text-sm font-semibold text-white transition hover:bg-[#085baf] active:scale-[0.98]"
          @click="showFilterSheet = false"
        >
          Aplicar filtros
        </button>

        <button
          type="button"
          class="flex-1 rounded-2xl bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
          @click="filterMode = 'recent'"
        >
          Limpiar
        </button>
      </div>
    </div>

    <BottomNavigation v-if="!showFilterSheet" />
  </section>
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