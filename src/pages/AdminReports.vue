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
  <section
    class="min-h-dvh overflow-x-hidden bg-[#F7F9F6] px-4 pb-12 pt-5"
  >
    <div class="mx-auto w-full max-w-5xl">
      <!-- Volver -->
      <button
        type="button"
        @click="router.push('/admin/dashboard')"
        class="group mb-5 inline-flex items-center gap-2 rounded-full border border-[#D6E8FB] bg-[#EEF4FF] px-3 py-2 text-sm font-semibold text-[#3082E3] transition hover:border-[#3082E3] hover:bg-white active:scale-[0.98]"
      >
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-sm transition group-hover:bg-[#3082E3] group-hover:text-white"
        >
          ←
        </span>

        <span>Volver al panel admin</span>
      </button>

      <!-- Encabezado -->
      <header
        class="mb-6 rounded-[28px] border border-[#D6E8FB] bg-[#EEF4FF] p-5 shadow-[0_12px_28px_rgba(48,130,227,0.08)] sm:p-6"
      >
        <span
          class="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#3082E3]"
        >
          Administración
        </span>

        <h1
          class="mt-3 text-[28px] font-bold leading-tight text-slate-900 sm:text-[34px]"
        >
          Gestión de reportes
        </h1>

        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Supervisá los reportes de la comunidad, actualizá su estado y
          priorizá aquellos que recibieron más apoyos.
        </p>
      </header>

      <!-- Mensaje general -->
      <div
        v-if="errorMessage"
        class="mb-5 flex items-start gap-3 rounded-[20px] border border-[#F7CBC2] bg-[#FFF1ED] px-4 py-3 text-[#D96854]"
      >
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-bold"
        >
          !
        </span>

        <p class="pt-1 text-sm font-medium">
          {{ errorMessage }}
        </p>
      </div>

      <!-- Cargando panel -->
      <div
        v-if="loading"
        class="rounded-3xl border border-[#D6E8FB] bg-white p-6 shadow-[0_10px_26px_rgba(48,130,227,0.07)]"
      >
        <div class="flex items-center gap-3">
          <div
            class="h-6 w-6 animate-spin rounded-full border-2 border-[#D6E8FB] border-t-[#3082E3]"
          ></div>

          <p class="text-sm font-medium text-slate-600">
            Cargando panel de reportes...
          </p>
        </div>
      </div>

      <template v-else>
        <!-- Métricas -->
        <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <!-- Total -->
          <article
            class="rounded-[22px] border border-[#D6E8FB] bg-white p-4 shadow-[0_8px_22px_rgba(48,130,227,0.07)]"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF4FF] text-sm font-bold text-[#3082E3]"
            >
              {{ stats.totalReports }}
            </div>

            <p class="mt-4 text-sm font-bold text-slate-900">
              Total de reportes
            </p>

            <p class="mt-1 text-xs leading-5 text-slate-500">
              Todos los reclamos registrados.
            </p>
          </article>

          <!-- Pendientes -->
          <article
            class="rounded-[22px] border border-[#F8D8D1] bg-white p-4 shadow-[0_8px_22px_rgba(242,130,109,0.07)]"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF1ED] text-sm font-bold text-[#F2826D]"
            >
              {{ stats.pendingReports }}
            </div>

            <p class="mt-4 text-sm font-bold text-slate-900">
              Pendientes
            </p>

            <p class="mt-1 text-xs leading-5 text-slate-500">
              Reportes que requieren atención.
            </p>
          </article>

          <!-- Resueltos -->
          <article
            class="rounded-[22px] border border-green-100 bg-white p-4 shadow-[0_8px_22px_rgba(34,197,94,0.06)]"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700"
            >
              {{ stats.resolvedReports }}
            </div>

            <p class="mt-4 text-sm font-bold text-slate-900">
              Resueltos
            </p>

            <p class="mt-1 text-xs leading-5 text-slate-500">
              Reclamos marcados como solucionados.
            </p>
          </article>

          <!-- Usuarios -->
          <article
            class="rounded-[22px] border border-[#D6E8FB] bg-white p-4 shadow-[0_8px_22px_rgba(48,130,227,0.07)]"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF4FF] text-sm font-bold text-[#3082E3]"
            >
              {{ stats.totalUsers }}
            </div>

            <p class="mt-4 text-sm font-bold text-slate-900">
              Usuarios
            </p>

            <p class="mt-1 text-xs leading-5 text-slate-500">
              Personas registradas en la comunidad.
            </p>
          </article>
        </section>

        <!-- Gestión -->
        <section
          class="mt-6 rounded-[28px] border border-[#D6E8FB] bg-white p-4 shadow-[0_12px_30px_rgba(48,130,227,0.07)] sm:p-6"
        >
          <!-- Encabezado sección -->
          <div
            class="flex flex-col gap-4 border-b border-[#E6EDF7] pb-5 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <span
                class="inline-flex rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#3082E3]"
              >
                Reportes cargados
              </span>

              <h2 class="mt-3 text-[22px] font-bold text-slate-900">
                Administrar reportes
              </h2>

              <p class="mt-1 text-sm leading-6 text-slate-500">
                Filtrá, modificá el estado, editá o eliminá reportes.
              </p>
            </div>

            <div
              class="inline-flex w-fit items-center rounded-full bg-[#EEF4FF] px-3 py-2 text-xs font-semibold text-[#3082E3]"
            >
              {{ adminReports.length }}
              {{
                adminReports.length === 1
                  ? "reporte encontrado"
                  : "reportes encontrados"
              }}
            </div>
          </div>

          <!-- Filtros -->
          <div
            class="mt-5 rounded-[22px] border border-[#E6EDF7] bg-[#F9FBFD] p-4"
          >
            <p class="text-sm font-bold text-slate-800">
              Organizar resultados
            </p>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <!-- Orden -->
              <div>
                <label
                  for="report-order"
                  class="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Ordenar por
                </label>

                <div class="relative">
                  <select
                    id="report-order"
                    :value="reportOrder"
                    @change="handleOrderChange"
                    class="w-full appearance-none rounded-2xl border border-[#D6E8FB] bg-white px-4 py-3 pr-12 text-sm text-slate-700 outline-none transition focus:border-[#3082E3] focus:ring-2 focus:ring-[#3082E3]/20"
                  >
                    <option value="recent">Más recientes</option>
                    <option value="most_supported">Más apoyados</option>
                  </select>

                  <ChevronDownIcon
                    class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <!-- Estado -->
              <div>
                <label
                  for="report-status-filter"
                  class="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Estado
                </label>

                <div class="relative">
                  <select
                    id="report-status-filter"
                    :value="reportStatusFilter"
                    @change="handleStatusFilterChange"
                    class="w-full appearance-none rounded-2xl border border-[#D6E8FB] bg-white px-4 py-3 pr-12 text-sm text-slate-700 outline-none transition focus:border-[#3082E3] focus:ring-2 focus:ring-[#3082E3]/20"
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
          </div>

          <!-- Mensajes de listado -->
          <div
            v-if="loadingReports"
            class="mt-5 rounded-[20px] border border-[#D6E8FB] bg-[#EEF4FF] px-4 py-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="h-5 w-5 animate-spin rounded-full border-2 border-[#D6E8FB] border-t-[#3082E3]"
              ></div>

              <p class="text-sm font-medium text-slate-600">
                Cargando reportes...
              </p>
            </div>
          </div>

          <div
            v-else-if="reportsError"
            class="mt-5 rounded-[20px] border border-[#F7CBC2] bg-[#FFF1ED] px-4 py-4 text-sm font-medium text-[#D96854]"
          >
            {{ reportsError }}
          </div>

          <div
            v-else-if="adminReports.length === 0"
            class="mt-5 rounded-[20px] border border-[#D6E8FB] bg-[#F9FBFD] px-5 py-8 text-center"
          >
            <p class="font-semibold text-slate-800">
              No hay reportes para mostrar
            </p>

            <p class="mt-1 text-sm text-slate-500">
              Probá cambiando los filtros seleccionados.
            </p>
          </div>

          <!-- Listado -->
          <div v-else class="mt-5 grid gap-4 lg:grid-cols-2">
            <article
              v-for="report in paginatedReports"
              :key="report.id"
              class="flex h-full flex-col rounded-3xl border border-[#D6E8FB] bg-[#EEF4FF] p-4 shadow-[0_8px_22px_rgba(48,130,227,0.07)]"
            >
              <!-- Etiquetas -->
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full border border-[#D6E8FB] bg-white px-3 py-1 text-[11px] font-semibold text-[#3082E3]"
                >
                  {{ report.categoria }}
                </span>

                <span
                  class="rounded-full px-3 py-1 text-[11px] font-semibold"
                  :class="statusBadgeClass(report.estado)"
                >
                  {{ report.estado || "Pendiente" }}
                </span>
              </div>

              <!-- Información principal -->
              <div class="mt-4 flex-1">
                <p
                  class="text-[11px] font-bold uppercase tracking-wide text-slate-400"
                >
                  Ubicación
                </p>

                <h3
                  class="mt-1 wrap-break-word text-[18px] font-bold leading-snug text-slate-900"
                >
                  {{ report.ubicacion }}
                </h3>

                <p class="mt-2 wrap-break-word text-xs text-slate-500">
                  Creado por {{ report.email || "Usuario sin correo" }}
                </p>

                <div class="mt-4 rounded-[18px] bg-white/80 p-4">
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Descripción
                  </p>

                  <p
                    class="mt-2 wrap-break-word text-sm leading-6 text-slate-700"
                  >
                    {{ report.descripcion || "Sin descripción" }}
                  </p>
                </div>
              </div>

              <!-- Datos -->
              <div class="mt-4 grid grid-cols-2 gap-3">
                <div
                  class="rounded-2xl border border-white bg-white/70 px-3 py-3"
                >
                  <p class="text-[11px] font-semibold text-slate-400">
                    Apoyos
                  </p>

                  <p class="mt-1 text-lg font-bold text-[#3082E3]">
                    {{ report.apoyos ?? 0 }}
                  </p>
                </div>

                <div
                  class="rounded-2xl border border-white bg-white/70 px-3 py-3"
                >
                  <p class="text-[11px] font-semibold text-slate-400">
                    Fecha
                  </p>

                  <p class="mt-1 text-sm font-bold text-slate-700">
                    {{ new Date(report.created_at).toLocaleDateString() }}
                  </p>
                </div>
              </div>

              <!-- Cambiar estado -->
              <div class="mt-4 border-t border-[#D6E8FB] pt-4">
                <label
                  :for="`status-${report.id}`"
                  class="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Cambiar estado
                </label>

                <div class="relative">
                  <select
                    :id="`status-${report.id}`"
                    :value="report.estado"
                    @change="handleStatusChange(report.id, $event)"
                    :disabled="updatingReportId === report.id"
                    class="w-full appearance-none rounded-2xl border border-[#D6E8FB] bg-white px-4 py-3 pr-12 text-sm text-slate-700 outline-none transition focus:border-[#3082E3] focus:ring-2 focus:ring-[#3082E3]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Resuelto">Resuelto</option>
                  </select>

                  <ChevronDownIcon
                    class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  />
                </div>

                <p
                  v-if="updatingReportId === report.id"
                  class="mt-2 text-xs font-medium text-[#3082E3]"
                >
                  Actualizando estado...
                </p>
              </div>

              <!-- Acciones -->
              <!-- <div class="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  @click="
                    router.push(`/admin/reportes/${report.id}/editar`)
                  "
                  class="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D6E8FB] bg-white px-4 py-3 text-sm font-semibold text-[#3082E3] transition hover:border-[#3082E3] hover:bg-[#F9FBFD] active:scale-[0.98]"
                >
                  <PencilSquareIcon class="h-5 w-5" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  @click="openDeleteModal(report)"
                  class="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#F7CBC2] bg-[#FFF1ED] px-4 py-3 text-sm font-semibold text-[#D96854] transition hover:border-[#F2826D] hover:bg-white active:scale-[0.98]"
                >
                  <TrashIcon class="h-5 w-5" />
                  <span>Eliminar</span>
                </button>
              </div> -->
            </article>
          </div>

          <!-- Paginación -->
          <nav
            v-if="totalPages > 1"
            class="mt-7 flex items-center justify-center gap-2"
            aria-label="Paginación de reportes"
          >
            <button
              type="button"
              @click="goTo(page - 1)"
              :disabled="page === 1"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6E8FB] bg-white text-lg transition"
              :class="
                page === 1
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-700 hover:border-[#3082E3] hover:text-[#3082E3] active:scale-[0.97]'
              "
            >
              ‹
            </button>

            <button
              v-for="p in visiblePages"
              :key="p"
              type="button"
              @click="goTo(p)"
              class="flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition"
              :class="
                p === page
                  ? 'bg-[#3082E3] text-white shadow-[0_6px_14px_rgba(48,130,227,0.22)]'
                  : 'border border-[#D6E8FB] bg-white text-slate-700 hover:border-[#3082E3] hover:text-[#3082E3] active:scale-[0.97]'
              "
            >
              {{ p }}
            </button>

            <button
              type="button"
              @click="goTo(page + 1)"
              :disabled="page === totalPages"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6E8FB] bg-white text-lg transition"
              :class="
                page === totalPages
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-700 hover:border-[#3082E3] hover:text-[#3082E3] active:scale-[0.97]'
              "
            >
              ›
            </button>
          </nav>
        </section>
      </template>
    </div>

    <!-- Modal eliminar -->
    <div
      v-if="isDeleteModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]"
      @click.self="closeDeleteModal"
    >
      <div
        class="w-full max-w-sm rounded-[28px] border border-[#F7CBC2] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.20)]"
      >
        <div
          class="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF1ED] text-[#D96854]"
        >
          <TrashIcon class="h-6 w-6" />
        </div>

        <h3 class="mt-5 text-xl font-bold text-slate-900">
          Eliminar reporte
        </h3>

        <p class="mt-2 text-sm leading-6 text-slate-500">
          Esta acción eliminará el reporte definitivamente y no se puede
          deshacer.
        </p>

        <div
          v-if="reportToDelete"
          class="mt-4 rounded-[18px] border border-[#E6EDF7] bg-[#F9FBFD] p-4"
        >
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Reporte seleccionado
          </p>

          <p class="mt-2 wrap-break-word text-sm font-bold text-slate-800">
            {{ reportToDelete.categoria }}
          </p>

          <p class="mt-1 wrap-break-word text-sm leading-6 text-slate-600">
            {{ reportToDelete.ubicacion }}
          </p>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="closeDeleteModal"
            class="rounded-2xl border border-[#D6E8FB] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#EEF4FF] active:scale-[0.98]"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="confirmDeleteReport"
            :disabled="deletingReportId === reportToDelete?.id"
            class="rounded-2xl bg-[#F2826D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#E67661] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{
              deletingReportId === reportToDelete?.id
                ? "Eliminando..."
                : "Sí, eliminar"
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal éxito -->
    <div
      v-if="isSuccessModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
      @click.self="closeSuccessModal"
    >
      <div
        class="w-full max-w-sm rounded-[28px] border border-[#D6E8FB] bg-white p-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
      >
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF4FF] text-[#3082E3]"
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

        <h3 class="mt-4 text-xl font-bold text-slate-900">
          Acción realizada
        </h3>

        <p class="mt-2 text-sm leading-6 text-slate-500">
          {{ successMessage }}
        </p>

        <button
          type="button"
          @click="closeSuccessModal"
          class="mt-5 w-full rounded-2xl bg-[#3082E3] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#085BAF] active:scale-[0.98]"
        >
          Entendido
        </button>
      </div>
    </div>
  </section>
</template>