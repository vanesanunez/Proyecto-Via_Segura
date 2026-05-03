<script setup>
import { ref, onMounted } from "vue";
import supabase from "../services/supabase";
import { fetchAdminReports, updateReportStatus } from "../services/reports";

const loading = ref(true);
const loadingReports = ref(true);
const errorMessage = ref("");
const reportsError = ref("");

const stats = ref({
  totalReports: 0,
  pendingReports: 0,
  resolvedReports: 0,
  totalUsers: 0,
});

const adminReports = ref([]);
const updatingReportId = ref(null);

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
    console.error("[AdminDashboard] Error cargando métricas:", error);
    errorMessage.value = "No se pudieron cargar las métricas del panel.";
  }
}

async function loadAdminReports() {
  loadingReports.value = true;
  reportsError.value = "";

  try {
    adminReports.value = await fetchAdminReports(10);
  } catch (error) {
    console.error("[AdminDashboard] Error cargando reportes:", error);
    reportsError.value = "No se pudieron cargar los reportes.";
  } finally {
    loadingReports.value = false;
  }
}

async function handleStatusChange(reportId, event) {
  const newStatus = event.target.value;
  updatingReportId.value = reportId;

  try {
    await updateReportStatus(reportId, newStatus);

    adminReports.value = adminReports.value.map((report) =>
      report.id === reportId
        ? { ...report, estado: newStatus }
        : report
    );

    await loadDashboardStats();
  } catch (error) {
    console.error("[AdminDashboard] Error actualizando estado:", error);
    reportsError.value = "No se pudo actualizar el estado del reporte.";
  } finally {
    updatingReportId.value = null;
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
        <h1 class="text-3xl font-bold text-slate-800">
          Panel de administración
        </h1>
        <p class="mt-2 text-slate-600">
          Desde acá vas a poder revisar el estado general de la app y gestionar reportes.
        </p>
      </header>

      <div v-if="loading" class="rounded-2xl bg-white p-6 shadow-sm">
        <p class="text-slate-600">Cargando panel...</p>
      </div>

      <template v-else>
        <div v-if="errorMessage" class="mb-6 rounded-2xl bg-white p-6 shadow-sm">
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
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-slate-800">
                Últimos reportes
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                Podés revisar el estado y actualizarlo desde acá.
              </p>
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

          <div v-else class="overflow-x-auto">
            <table class="min-w-full border-collapse">
              <thead>
                <tr class="border-b border-slate-200 text-left">
                  <th class="px-3 py-3 text-sm font-semibold text-slate-700">Categoría</th>
                  <th class="px-3 py-3 text-sm font-semibold text-slate-700">Ubicación</th>
                  <th class="px-3 py-3 text-sm font-semibold text-slate-700">Usuario</th>
                  <th class="px-3 py-3 text-sm font-semibold text-slate-700">Fecha</th>
                  <th class="px-3 py-3 text-sm font-semibold text-slate-700">Estado</th>
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
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>