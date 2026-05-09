<script setup>
import { ref, onMounted } from "vue";
import supabase from "../services/supabase";
import {
  fetchAdminReports,
  updateReportStatus,
  deleteReport,
} from "../services/reports";

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
      <header class="mb-8">
        <h1 class="text-2xl font-bold text-slate-800 sm:text-3xl">
          Panel de administración
        </h1>
        <p class="mt-2 text-sm text-slate-600 sm:text-base">
          Desde acá vas a poder revisar el estado general de la app y gestionar
          reportes.
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
          <article class="rounded-2xl bg-white p-5 shadow-sm">
            <p class="text-sm text-slate-500">Total de reportes</p>
            <p class="mt-2 text-3xl font-bold text-slate-800">
              {{ stats.totalReports }}
            </p>
          </article>

          <article class="rounded-2xl bg-white p-5 shadow-sm">
            <p class="text-sm text-slate-500">Pendientes</p>
            <p class="mt-2 text-3xl font-bold text-amber-600">
              {{ stats.pendingReports }}
            </p>
          </article>

          <article class="rounded-2xl bg-white p-5 shadow-sm">
            <p class="text-sm text-slate-500">Resueltos</p>
            <p class="mt-2 text-3xl font-bold text-green-600">
              {{ stats.resolvedReports }}
            </p>
          </article>

          <article class="rounded-2xl bg-white p-5 shadow-sm">
            <p class="text-sm text-slate-500">Usuarios registrados</p>
            <p class="mt-2 text-3xl font-bold text-slate-800">
              {{ stats.totalUsers }}
            </p>
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

                  <button
                    type="button"
                    @click="handleDeleteReport(report.id)"
                    class="w-full rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    Eliminar reporte
                  </button>
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
                      <button
                        type="button"
                        @click="handleDeleteReport(report.id)"
                        class="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                      >
                        Eliminar
                      </button>
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
