<script setup>
import { ref, onMounted } from "vue";
import supabase from "../services/supabase";
import {
  fetchAdminReports,
  updateReportStatus,
  deleteReport,
} from "../services/reports";
import { useRouter } from "vue-router";
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

const stats = ref({
  totalReports: 0,
  pendingReports: 0,
  resolvedReports: 0,
  totalUsers: 0,
});

let successTimeout = null;

function showSuccessMessage(message) {
  successMessage.value = message;

  if (successTimeout) {
    clearTimeout(successTimeout);
  }

  successTimeout = setTimeout(() => {
    successMessage.value = "";
  }, 3000);
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

      supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true }),
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
    console.error("[AdminDashboard] Error cargando métricas:", error);
    errorMessage.value = "No se pudieron cargar las métricas del panel.";
  }
}

async function loadAdminReports() {
  loadingReports.value = true;
  reportsError.value = "";

  try {
    adminReports.value = await fetchAdminReports({
      limit: 10,
      orderBy: reportOrder.value,
      status: reportStatusFilter.value,
    });
  } catch (error) {
    console.error("[AdminDashboard] Error cargando reportes:", error);
    reportsError.value = "No se pudieron cargar los reportes.";
  } finally {
    loadingReports.value = false;
  }
}

async function handleOrderChange(event) {
  reportOrder.value = event.target.value;
  await loadAdminReports();
}

async function handleStatusFilterChange(event) {
  reportStatusFilter.value = event.target.value;
  await loadAdminReports();
}

async function handleStatusChange(reportId, event) {
  const newStatus = event.target.value;
  updatingReportId.value = reportId;

  try {
    await updateReportStatus(reportId, newStatus);
    await Promise.all([loadDashboardStats(), loadAdminReports()]);
  } catch (error) {
    console.error("[AdminDashboard] Error actualizando estado:", error);
    reportsError.value = "No se pudo actualizar el estado del reporte.";
  } finally {
    updatingReportId.value = null;
  }
}

async function handleDeleteReport(reportId) {
  const confirmed = window.confirm("¿Seguro que querés eliminar este reporte?");

  if (!confirmed) return;

  try {
    reportsError.value = "";
    await deleteReport(reportId);
    await Promise.all([loadDashboardStats(), loadAdminReports()]);
    showSuccessMessage("Se eliminó el reporte con éxito.");
  } catch (error) {
    console.error("[AdminDashboard] Error eliminando reporte:", error);
    reportsError.value = "No se pudo eliminar el reporte.";
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
  <section class="min-h-screen bg-slate-50 p-6">
    <div class="mx-auto max-w-6xl">
      <button
        type="button"
        @click="router.push('/admin/dashboard')"
        class="mb-6 inline-flex items-center gap-3 text-left transition group active:scale-95"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-[#3082e3] transition group-hover:bg-[#3082e3] group-hover:text-white group-active:bg-[#3082e3] group-active:text-white"
        >
          ←
        </span>

        <span>
          <span
            class="block text-sm font-semibold text-slate-900 transition group-hover:text-[#3082e3] group-active:text-[#3082e3]"
          >
            Volver al panel admin
          </span>
          <span class="block text-xs text-slate-500">
            Regresá a la vista principal del administrador
          </span>
        </span>
      </button>

      <header class="mb-8">
        <h1
          class="text-[30px] font-bold leading-tight text-slate-900 sm:text-[34px]"
        >
          Gestión de reportes
        </h1>
        <p class="mt-2 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
          Supervisá métricas, priorizá apoyos y administrá los reportes de la
          comunidad.
        </p>
      </header>
      <div
        v-if="successMessage"
        class="fixed top-20 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 shadow-lg"
      >
        <p class="text-sm font-medium">{{ successMessage }}</p>
      </div>
      <div v-if="loading" class="rounded-2xl bg-white p-6 shadow-sm">
        <p class="text-slate-600">Cargando panel...</p>
      </div>

      <template v-else>
        <div
          v-if="errorMessage"
          class="mb-6 rounded-2xl bg-white p-6 shadow-sm"
        >
          <p class="text-red-600">{{ errorMessage }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article
            class="rounded-[26px] bg-[#E0E5EC] p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.85),8px_8px_16px_rgba(163,177,198,0.35)]"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-slate-500">
                  Total de reportes
                </p>
                <p class="mt-3 text-sm text-slate-400">Panel general</p>
              </div>

              <div
                class="flex h-14 min-w-[56px] items-center justify-center rounded-full bg-[#eef4ff] px-3 text-2xl font-bold text-[#3082e3] shadow-[-4px_-4px_10px_rgba(255,255,255,0.85),4px_4px_10px_rgba(163,177,198,0.28)]"
              >
                {{ stats.totalReports }}
              </div>
            </div>
          </article>

          <article
            class="rounded-[26px] bg-[#E0E5EC] p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.85),8px_8px_16px_rgba(163,177,198,0.35)]"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-slate-500">Pendientes</p>
                <p class="mt-3 text-sm text-slate-400">Requieren atención</p>
              </div>

              <div
                class="flex h-14 min-w-[56px] items-center justify-center rounded-full bg-[#fff1ed] px-3 text-2xl font-bold text-[#f2826d] shadow-[-4px_-4px_10px_rgba(255,255,255,0.85),4px_4px_10px_rgba(163,177,198,0.28)]"
              >
                {{ stats.pendingReports }}
              </div>
            </div>
          </article>

          <article
            class="rounded-[26px] bg-[#E0E5EC] p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.85),8px_8px_16px_rgba(163,177,198,0.35)]"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-slate-500">Resueltos</p>
                <p class="mt-3 text-sm text-slate-400">Ya gestionados</p>
              </div>

              <div
                class="flex h-14 min-w-[56px] items-center justify-center rounded-full bg-green-100 px-3 text-2xl font-bold text-green-600 shadow-[-4px_-4px_10px_rgba(255,255,255,0.85),4px_4px_10px_rgba(163,177,198,0.28)]"
              >
                {{ stats.resolvedReports }}
              </div>
            </div>
          </article>

          <article
            class="rounded-[26px] bg-[#E0E5EC] p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.85),8px_8px_16px_rgba(163,177,198,0.35)]"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-slate-500">
                  Usuarios registrados
                </p>
                <p class="mt-3 text-sm text-slate-400">Comunidad activa</p>
              </div>

              <div
                class="flex h-14 min-w-[56px] items-center justify-center rounded-full bg-[#eef4ff] px-3 text-2xl font-bold text-[#3082e3] shadow-[-4px_-4px_10px_rgba(255,255,255,0.85),4px_4px_10px_rgba(163,177,198,0.28)]"
              >
                {{ stats.totalUsers }}
              </div>
            </div>
          </article>
        </div>

        <section class="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div
            class="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <h2 class="text-xl font-semibold text-slate-800">
                Gestión de reportes
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                Podés revisar el estado, actualizarlo y priorizar por apoyos.
              </p>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div class="w-full">
                <label class="mb-1 block text-sm font-medium text-slate-600">
                  Ordenar por
                </label>
                <select
                  :value="reportOrder"
                  @change="handleOrderChange"
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 md:w-56"
                >
                  <option value="recent">Más recientes</option>
                  <option value="most_supported">Más apoyados</option>
                </select>
              </div>

              <div class="w-full">
                <label class="mb-1 block text-sm font-medium text-slate-600">
                  Estado
                </label>
                <select
                  :value="reportStatusFilter"
                  @change="handleStatusFilterChange"
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 md:w-56"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendientes</option>
                  <option value="resolved">Resueltos</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="loadingReports" class="py-4">
            <p class="text-slate-600">Cargando reportes...</p>
          </div>

          <div v-else-if="reportsError" class="py-4">
            <p class="text-red-600">{{ reportsError }}</p>
          </div>

          <div v-else-if="adminReports.length === 0" class="py-4">
            <p class="text-slate-600">Todavía no hay reportes cargados.</p>
          </div>

          <div v-else>
            <div class="space-y-4 md:hidden">
              <article
                v-for="report in adminReports"
                :key="report.id"
                class="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm text-slate-500">Categoría</p>
                    <p class="font-semibold text-slate-800">
                      {{ report.categoria }}
                    </p>
                  </div>

                  <span
                    class="rounded-full px-3 py-1 text-xs font-medium"
                    :class="
                      report.estado === 'Resuelto'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    "
                  >
                    {{ report.estado }}
                  </span>
                </div>

                <div class="mt-3 space-y-2 text-sm text-slate-700">
                  <p>
                    <span class="font-medium text-slate-500">Ubicación:</span>
                    {{ report.ubicacion }}
                  </p>

                  <p>
                    <span class="font-medium text-slate-500">Apoyos:</span>
                    {{ report.apoyos ?? 0 }}
                  </p>

                  <p class="break-all">
                    <span class="font-medium text-slate-500">Usuario:</span>
                    {{ report.email }}
                  </p>

                  <p>
                    <span class="font-medium text-slate-500">Fecha:</span>
                    {{ new Date(report.created_at).toLocaleDateString() }}
                  </p>
                </div>

                <div class="mt-4 space-y-3">
                  <div>
                    <label
                      class="mb-1 block text-sm font-medium text-slate-600"
                    >
                      Cambiar estado
                    </label>

                    <select
                      :value="report.estado"
                      @change="handleStatusChange(report.id, $event)"
                      :disabled="updatingReportId === report.id"
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Resuelto">Resuelto</option>
                    </select>
                  </div>

                  <div class="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      @click="
                        $router.push(`/admin/reportes/${report.id}/editar`)
                      "
                      title="Editar reporte"
                      aria-label="Editar reporte"
                      class="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3] shadow-[-4px_-4px_10px_rgba(255,255,255,0.85),4px_4px_10px_rgba(163,177,198,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-50 active:scale-95"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.8"
                        stroke="currentColor"
                        class="h-5 w-5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M19.5 7.125L16.875 4.5"
                        />
                      </svg>
                    </button>

                    <button
                      type="button"
                      @click="handleDeleteReport(report.id)"
                      title="Eliminar reporte"
                      aria-label="Eliminar reporte"
                      class="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1ed] text-[#e67661] shadow-[-4px_-4px_10px_rgba(255,255,255,0.85),4px_4px_10px_rgba(163,177,198,0.28)] transition hover:-translate-y-0.5 hover:bg-red-50 active:scale-95"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.8"
                        stroke="currentColor"
                        class="h-5 w-5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M6 7.5h12m-9.75 0V6a1.5 1.5 0 011.5-1.5h4.5A1.5 1.5 0 0115.75 6v1.5m-7.5 0v10.125A2.625 2.625 0 0010.875 20.25h2.25A2.625 2.625 0 0015.75 17.625V7.5m-4.5 3v6m3-6v6"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <div class="hidden overflow-x-auto md:block">
              <table class="min-w-full border-collapse">
                <thead>
                  <tr class="border-b border-slate-200 text-left">
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Categoría
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Ubicación
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Apoyos
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Usuario
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Fecha
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Estado
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="report in adminReports"
                    :key="report.id"
                    class="border-b border-slate-100"
                  >
                    <td class="px-3 py-3 text-sm text-slate-700">
                      {{ report.categoria }}
                    </td>

                    <td class="px-3 py-3 text-sm text-slate-700">
                      {{ report.ubicacion }}
                    </td>

                    <td class="px-3 py-3 text-sm text-slate-700">
                      {{ report.apoyos ?? 0 }}
                    </td>

                    <td class="px-3 py-3 text-sm text-slate-700 break-all">
                      {{ report.email }}
                    </td>

                    <td class="px-3 py-3 text-sm text-slate-700">
                      {{ new Date(report.created_at).toLocaleDateString() }}
                    </td>

                    <td class="px-3 py-3">
                      <select
                        :value="report.estado"
                        @change="handleStatusChange(report.id, $event)"
                        :disabled="updatingReportId === report.id"
                        class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Resuelto">Resuelto</option>
                      </select>
                    </td>
                    <td class="px-3 py-3">
                      <div class="flex flex-wrap gap-2">
                        <button
                          type="button"
                          @click="
                            $router.push(`/admin/reportes/${report.id}/editar`)
                          "
                          class="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          @click="handleDeleteReport(report.id)"
                          class="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>
