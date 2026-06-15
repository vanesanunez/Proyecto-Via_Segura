<script setup>
import { ref, onMounted, computed, watch } from "vue";
import supabase from "../services/supabase";
import {
  fetchAdminReports,
  updateReportStatus,
  deleteReport,
} from "../services/reports";
import { useRouter } from "vue-router";
import {
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
} from "@heroicons/vue/24/solid";

const router = useRouter();

const loading = ref(true);
const loadingReports = ref(true);
const errorMessage = ref("");
const reportsError = ref("");
const successMessage = ref("");

const adminReports = ref([]);
const updatingReportId = ref(null);
const reportOrder = ref("recent");
const reportStatusFilter = ref("all");

const page = ref(1);
const pageSize = 4;

const isDeleteModalOpen = ref(false);
const isSuccessModalOpen = ref(false);
const reportToDelete = ref(null);
const deletingReportId = ref(null);

const stats = ref({
  totalReports: 0,
  pendingReports: 0,
  resolvedReports: 0,
  totalUsers: 0,
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(adminReports.value.length / pageSize)),
);

const paginatedReports = computed(() => {
  const start = (page.value - 1) * pageSize;
  const end = start + pageSize;
  return adminReports.value.slice(start, end);
});

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

function goTo(p) {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
}

watch(
  () => adminReports.value.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value;
    }
  },
);

let successTimeout = null;

function showSuccessMessage(message) {
  successMessage.value = message;
  isSuccessModalOpen.value = true;

  if (successTimeout) clearTimeout(successTimeout);

  successTimeout = setTimeout(() => {
    closeSuccessModal();
  }, 2500);
}

function closeSuccessModal() {
  isSuccessModalOpen.value = false;
  successMessage.value = "";
}

function openDeleteModal(report) {
  reportToDelete.value = report;
  isDeleteModalOpen.value = true;
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false;
  reportToDelete.value = null;
}

function statusBadgeClass(status) {
  return status === "Resuelto"
    ? "bg-green-100 text-green-700"
    : "bg-[#fff1ed] text-[#e67661]";
}

async function loadDashboardStats() {
  errorMessage.value = "";

  try {
    const [
      totalReportsResponse,
      pendingReportsResponse,
      resolvedReportsResponse,
      totalUsersResponse,
    ] = await Promise.all([
      supabase.from("reports").select("*", { count: "exact", head: true }),
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("estado", "Pendiente"),
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("estado", "Resuelto"),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
    ]);

    if (totalReportsResponse.error) throw totalReportsResponse.error;
    if (pendingReportsResponse.error) throw pendingReportsResponse.error;
    if (resolvedReportsResponse.error) throw resolvedReportsResponse.error;
    if (totalUsersResponse.error) throw totalUsersResponse.error;

    stats.value = {
      totalReports: totalReportsResponse.count ?? 0,
      pendingReports: pendingReportsResponse.count ?? 0,
      resolvedReports: resolvedReportsResponse.count ?? 0,
      totalUsers: totalUsersResponse.count ?? 0,
    };
  } catch (error) {
    console.error("[AdminReports] Error cargando métricas:", error);
    errorMessage.value = "No se pudieron cargar las métricas del panel.";
  }
}

async function loadAdminReports() {
  loadingReports.value = true;
  reportsError.value = "";

  try {
    adminReports.value = await fetchAdminReports({
      limit: 100,
      orderBy: reportOrder.value,
      status: reportStatusFilter.value,
    });
  } catch (error) {
    console.error("[AdminReports] Error cargando reportes:", error);
    reportsError.value = "No se pudieron cargar los reportes.";
  } finally {
    loadingReports.value = false;
  }
}

async function handleOrderChange(event) {
  reportOrder.value = event.target.value;
  page.value = 1;
  await loadAdminReports();
}

async function handleStatusFilterChange(event) {
  reportStatusFilter.value = event.target.value;
  page.value = 1;
  await loadAdminReports();
}

async function handleStatusChange(reportId, event) {
  const newStatus = event.target.value;
  updatingReportId.value = reportId;

  try {
    await updateReportStatus(reportId, newStatus);
    await Promise.all([loadDashboardStats(), loadAdminReports()]);
  } catch (error) {
    console.error("[AdminReports] Error actualizando estado:", error);
    reportsError.value = "No se pudo actualizar el estado del reporte.";
  } finally {
    updatingReportId.value = null;
  }
}

async function confirmDeleteReport() {
  if (!reportToDelete.value) return;

  deletingReportId.value = reportToDelete.value.id;
  reportsError.value = "";

  try {
    await deleteReport(reportToDelete.value.id);
    await Promise.all([loadDashboardStats(), loadAdminReports()]);
    closeDeleteModal();
    showSuccessMessage("El reporte se eliminó con éxito.");
  } catch (error) {
    console.error("[AdminReports] Error eliminando reporte:", error);
    reportsError.value = "No se pudo eliminar el reporte.";
  } finally {
    deletingReportId.value = null;
  }
}

async function loadDashboardData() {
  loading.value = true;

  try {
    await Promise.all([loadDashboardStats(), loadAdminReports()]);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <section class="min-h-screen overflow-x-hidden bg-white px-4 pt-4 pb-24">
    <div class="mx-auto w-full max-w-[390px]">
      <button
        type="button"
        @click="router.push('/admin/dashboard')"
        class="mb-6 inline-flex items-center gap-3 text-left transition group active:scale-95"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0E5EC] text-xl font-bold text-[#3082e3] shadow-[0_6px_16px_rgba(148,163,184,0.18)]"
        >
          ←
        </span>

        <span>
          <span class="block text-sm font-semibold text-slate-900">
            Volver al panel admin
          </span>
          <span class="block text-xs text-slate-500">
            Regresá a la vista principal del administrador
          </span>
        </span>
      </button>

      <header class="mb-6">
        <h1 class="text-[30px] font-bold leading-[1.08] text-[#0f172a]">
          Gestión de reportes
        </h1>

        <p class="mt-3 max-w-[320px] text-[15px] leading-[1.7] text-slate-500">
          Supervisá métricas, priorizá apoyos y administrá los reportes de la comunidad.
        </p>
      </header>

      <div
        v-if="successMessage && !isSuccessModalOpen"
        class="mb-5 rounded-[20px] bg-[#eef4ff] px-4 py-3 text-sm font-medium text-[#3082e3] shadow-[0_8px_18px_rgba(148,163,184,0.15)]"
      >
        {{ successMessage }}
      </div>

      <div
        v-if="errorMessage"
        class="mb-5 rounded-[20px] bg-[#fff1ed] px-4 py-3 text-sm font-medium text-[#e67661] shadow-[0_8px_18px_rgba(148,163,184,0.15)]"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="loading"
        class="rounded-[24px] bg-[#E0E5EC] px-4 py-5 text-slate-600 shadow-[0_10px_24px_rgba(148,163,184,0.18)]"
      >
        Cargando panel...
      </div>

      <template v-else>
        <div class="grid gap-3">
          <article class="w-full rounded-[24px] bg-[#E0E5EC] p-4 shadow-[0_10px_24px_rgba(148,163,184,0.18)]">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-500">Total de reportes</p>
                <p class="mt-2 text-sm text-slate-400">Panel general</p>
              </div>
              <div class="ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-xl font-bold text-[#3082e3] shadow-[0_6px_16px_rgba(148,163,184,0.18)]">
                {{ stats.totalReports }}
              </div>
            </div>
          </article>

          <article class="w-full rounded-[24px] bg-[#E0E5EC] p-4 shadow-[0_10px_24px_rgba(148,163,184,0.18)]">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-500">Pendientes</p>
                <p class="mt-2 text-sm text-slate-400">Requieren atención</p>
              </div>
              <div class="ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-xl font-bold text-[#f2826d] shadow-[0_6px_16px_rgba(148,163,184,0.18)]">
                {{ stats.pendingReports }}
              </div>
            </div>
          </article>

          <article class="w-full rounded-[24px] bg-[#E0E5EC] p-4 shadow-[0_10px_24px_rgba(148,163,184,0.18)]">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-500">Resueltos</p>
                <p class="mt-2 text-sm text-slate-400">Ya gestionados</p>
              </div>
              <div class="ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-600 shadow-[0_6px_16px_rgba(148,163,184,0.18)]">
                {{ stats.resolvedReports }}
              </div>
            </div>
          </article>

          <article class="w-full rounded-[24px] bg-[#E0E5EC] p-4 shadow-[0_10px_24px_rgba(148,163,184,0.18)]">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-500">Usuarios registrados</p>
                <p class="mt-2 text-sm text-slate-400">Comunidad activa</p>
              </div>
              <div class="ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-xl font-bold text-[#3082e3] shadow-[0_6px_16px_rgba(148,163,184,0.18)]">
                {{ stats.totalUsers }}
              </div>
            </div>
          </article>
        </div>

        <section class="mt-6 rounded-[24px] bg-white p-4 shadow-[0_10px_24px_rgba(148,163,184,0.12)]">
          <div class="mb-5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#eef4ff] text-[#3082e3]">
                Gestión de reportes
              </span>
            </div>

            <h2 class="mt-3 text-[20px] font-bold text-slate-900">
              Reportes cargados
            </h2>

            <p class="mt-2 text-[15px] leading-[1.7] text-slate-500">
              Revisá el estado, actualizalo y priorizá por apoyos.
            </p>
          </div>

          <div class="grid gap-4">
            <div class="w-full">
              <label class="mb-2 block text-sm font-medium text-slate-500">
                Ordenar por
              </label>

              <div class="relative">
                <select
                  :value="reportOrder"
                  @change="handleOrderChange"
                  class="w-full appearance-none rounded-2xl border-0 bg-white px-4 py-3 pr-12 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.16)] focus:outline-none focus:ring-2 focus:ring-[#3082e3]/25"
                >
                  <option value="recent">Más recientes</option>
                  <option value="most_supported">Más apoyados</option>
                </select>

                <ChevronDownIcon
                  class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div class="w-full">
              <label class="mb-2 block text-sm font-medium text-slate-500">
                Estado
              </label>

              <div class="relative">
                <select
                  :value="reportStatusFilter"
                  @change="handleStatusFilterChange"
                  class="w-full appearance-none rounded-2xl border-0 bg-white px-4 py-3 pr-12 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.16)] focus:outline-none focus:ring-2 focus:ring-[#3082e3]/25"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendientes</option>
                  <option value="resolved">Resueltos</option>
                </select>

                <ChevronDownIcon
                  class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>

          <div v-if="loadingReports" class="py-4">
            <p class="text-slate-600">Cargando reportes...</p>
          </div>

          <div v-else-if="reportsError" class="py-4">
            <p class="text-[#e67661]">{{ reportsError }}</p>
          </div>

          <div v-else-if="adminReports.length === 0" class="py-4">
            <p class="text-slate-600">Todavía no hay reportes cargados.</p>
          </div>

          <div v-else>
            <div class="mt-5 space-y-4">
              <article
                v-for="report in paginatedReports"
                :key="report.id"
                class="w-full overflow-hidden rounded-[24px] bg-[#E0E5EC] px-4 py-4 shadow-[0_10px_24px_rgba(148,163,184,0.18)]"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#eef4ff] text-[#3082e3]">
                        {{ report.categoria }}
                      </span>

                      <span
                        class="text-[11px] font-semibold px-3 py-1 rounded-full"
                        :class="statusBadgeClass(report.estado)"
                      >
                        {{ report.estado }}
                      </span>
                    </div>

                    <h3 class="mt-3 break-words text-[18px] font-bold leading-snug text-slate-900">
                      {{ report.ubicacion }}
                    </h3>

                    <p class="mt-1 break-words text-sm text-slate-500">
                      {{ report.email }}
                    </p>

                    <div class="mt-3">
                      <p class="text-sm font-medium text-slate-500">Descripción</p>
                      <p class="mt-1 break-words text-[15px] leading-[1.7] text-slate-700">
                        {{ report.descripcion || "Sin descripción" }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="mt-4 space-y-2 text-sm text-slate-600">
                  <p>
                    <span class="font-medium text-slate-500">Apoyos:</span>
                    {{ report.apoyos ?? 0 }}
                  </p>
                  <p>
                    <span class="font-medium text-slate-500">Fecha:</span>
                    {{ new Date(report.created_at).toLocaleDateString() }}
                  </p>
                </div>

                <div class="mt-4 space-y-3 border-t border-white/60 pt-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-slate-600">
                      Cambiar estado
                    </label>

                    <div class="relative">
                      <select
                        :value="report.estado"
                        @change="handleStatusChange(report.id, $event)"
                        :disabled="updatingReportId === report.id"
                        class="w-full appearance-none rounded-2xl border-0 bg-white px-4 py-3 pr-12 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.16)] focus:outline-none focus:ring-2 focus:ring-[#3082e3]/25 disabled:opacity-60"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Resuelto">Resuelto</option>
                      </select>

                      <ChevronDownIcon
                        class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  <div class="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      @click="router.push(`/admin/reportes/${report.id}/editar`)"
                      class="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3] shadow-[0_6px_16px_rgba(148,163,184,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-50 active:scale-95"
                    >
                      <PencilSquareIcon class="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      @click="openDeleteModal(report)"
                      class="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1ed] text-[#e67661] shadow-[0_6px_16px_rgba(148,163,184,0.18)] transition hover:-translate-y-0.5 hover:bg-red-50 active:scale-95"
                    >
                      <TrashIcon class="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <nav v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-2">
              <button
                @click="goTo(page - 1)"
                :disabled="page === 1"
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0E5EC] text-lg shadow-[0_6px_16px_rgba(148,163,184,0.18)] transition"
                :class="page === 1 ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:text-[#3082e3] active:scale-[0.97]'"
              >
                ‹
              </button>

              <button
                v-for="p in visiblePages"
                :key="p"
                @click="goTo(p)"
                class="flex h-10 min-w-[40px] items-center justify-center rounded-xl px-3 text-sm font-semibold transition"
                :class="p === page
                  ? 'bg-[#3082e3] text-white shadow-sm'
                  : 'bg-[#E0E5EC] text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.18)] hover:text-[#3082e3] active:scale-[0.97]'"
              >
                {{ p }}
              </button>

              <button
                @click="goTo(page + 1)"
                :disabled="page === totalPages"
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0E5EC] text-lg shadow-[0_6px_16px_rgba(148,163,184,0.18)] transition"
                :class="page === totalPages ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:text-[#3082e3] active:scale-[0.97]'"
              >
                ›
              </button>
            </nav>
          </div>
        </section>
      </template>
    </div>

    <div
      v-if="isDeleteModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
    >
      <div
        class="w-full max-w-sm rounded-[28px] bg-[#E0E5EC] p-6 shadow-[-10px_-10px_20px_rgba(255,255,255,0.9),10px_10px_20px_rgba(163,177,198,0.38)]"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-[#e67661] shadow-[0_6px_16px_rgba(148,163,184,0.18)]"
          >
            <TrashIcon class="h-6 w-6" />
          </div>

          <div class="min-w-0 flex-1">
            <h3 class="text-xl font-bold text-slate-900">Eliminar reporte</h3>

            <p class="mt-2 text-sm leading-6 text-slate-500">
              ¿Seguro que querés eliminar este reporte? Esta acción no se puede deshacer.
            </p>

            <div
              v-if="reportToDelete"
              class="mt-4 rounded-2xl bg-white/60 px-4 py-3 text-sm text-slate-600"
            >
              <p class="break-words">
                <span class="font-semibold text-slate-800">Categoría:</span>
                {{ reportToDelete.categoria }}
              </p>
              <p class="mt-2 break-words">
                <span class="font-semibold text-slate-800">Ubicación:</span>
                {{ reportToDelete.ubicacion }}
              </p>
            </div>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            type="button"
            @click="closeDeleteModal"
            class="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="confirmDeleteReport"
            :disabled="deletingReportId === reportToDelete?.id"
            class="flex-1 rounded-xl bg-[#f2826d] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
          >
            {{ deletingReportId === reportToDelete?.id ? "Eliminando..." : "Sí, eliminar" }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="isSuccessModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-4 backdrop-blur-[2px]"
    >
      <div
        class="w-full max-w-sm rounded-[28px] bg-[#E0E5EC] p-6 text-center shadow-[-10px_-10px_20px_rgba(255,255,255,0.9),10px_10px_20px_rgba(163,177,198,0.38)]"
      >
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3] shadow-[0_6px_16px_rgba(148,163,184,0.18)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="h-8 w-8"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h3 class="mt-4 text-xl font-bold text-slate-900">Acción realizada</h3>

        <p class="mt-2 text-sm leading-6 text-slate-500">
          {{ successMessage }}
        </p>

        <button
          type="button"
          @click="closeSuccessModal"
          class="mt-5 w-full rounded-xl bg-[#3082e3] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 active:scale-[0.98]"
        >
          Entendido
        </button>
      </div>
    </div>
  </section>
</template>
