<template>
  <main class="min-h-screen bg-[#f7f9f6] pb-24">
    <section class="mx-auto w-full max-w-xl px-4 py-6">
      <!-- Header -->
      <div class="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
        <button
          type="button"
          aria-label="Volver"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100 active:bg-gray-200"
          @click="router.back()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#2a2a2a"
            stroke-width="2.2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div class="min-w-0">
          <h1 class="text-base font-semibold text-[#2a2a2a]">
            Detalle del reporte
          </h1>

          <p class="mt-1 text-xs text-gray-500">
            Información completa del reclamo.
          </p>
        </div>
      </div>

      <!-- Cargando -->
      <div
        v-if="loading"
        class="rounded-2xl border border-[#d6e8fb] bg-white p-8 text-center text-sm text-gray-500"
      >
        Cargando reporte...
      </div>

      <!-- Error -->
      <div
        v-else-if="errorMessage"
        class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
      >
        <p>{{ errorMessage }}</p>

        <button
          type="button"
          class="mt-4 font-semibold text-[#3082e3] hover:underline"
          @click="router.push('/reportes')"
        >
          Volver a los reportes
        </button>
      </div>

      <!-- Detalle -->
      <article
        v-else-if="report"
        class="overflow-hidden rounded-3xl border border-[#c7d9f2] bg-white shadow-[0_10px_24px_rgba(48,130,227,0.12)]"
      >
        <!-- Imagen -->
        <div
          v-if="report.imagen"
          class="h-60 w-full overflow-hidden bg-slate-100"
        >
          <img
            :src="report.imagen"
            :alt="`Imagen del reporte de ${report.categoria}`"
            class="h-full w-full object-cover"
          />
        </div>

        <div
          v-else
          class="flex h-44 items-center justify-center bg-[#eef4ff]"
        >
          <p class="text-sm text-slate-500">
            Este reporte no tiene imagen.
          </p>
        </div>

        <div class="p-5">
          <!-- Categoría y estado -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span
              class="rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-semibold text-[#3082e3]"
            >
              {{ report.categoria }}
            </span>

            <span
              class="rounded-full px-3 py-1.5 text-xs font-semibold"
              :class="statusClasses"
            >
              {{ report.estado || "Pendiente" }}
            </span>
          </div>

          <!-- Fecha -->
          <p class="mt-4 text-xs text-slate-500">
            Publicado el {{ formattedDate }}
          </p>

          <!-- Descripción -->
          <section class="mt-5">
            <h2 class="text-sm font-bold text-[#2a2a2a]">
              Descripción
            </h2>

            <p
              class="mt-2 whitespace-pre-line wrap-break-word text-sm leading-6 text-slate-600"
            >
              {{ report.descripcion || "Sin descripción disponible." }}
            </p>
          </section>

          <!-- Ubicación -->
          <section
            class="mt-5 rounded-2xl border border-[#d6e8fb] bg-[#eef4ff] p-4"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-[#3082e3]">
              Ubicación
            </p>

            <p class="mt-2 wrap-break-word text-sm leading-6 text-slate-700">
              {{ report.ubicacion || "Ubicación no disponible." }}
            </p>
          </section>

          <!-- Apoyos -->
          <div class="mt-5 rounded-2xl bg-slate-50 p-4">
            <p class="text-xs text-slate-500">
              Personas que apoyaron este reporte
            </p>

            <p class="mt-1 text-2xl font-bold text-[#3082e3]">
              {{ report.apoyos ?? 0 }}
            </p>
          </div>

          <button
            type="button"
            class="mt-6 flex w-full items-center justify-center rounded-2xl bg-[#3082e3] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#085baf] active:scale-[0.98]"
            @click="router.push('/reportes')"
          >
            Volver a todos los reportes
          </button>
        </div>
      </article>
    </section>

    <BottomNavigation />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchReportById } from "../services/reports";
import BottomNavigation from "../components/BottomNavigation.vue";

const route = useRoute();
const router = useRouter();

const report = ref(null);
const loading = ref(true);
const errorMessage = ref("");

const formattedDate = computed(() => {
  if (!report.value?.created_at) {
    return "sin fecha";
  }

  return new Date(report.value.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
});

const statusClasses = computed(() => {
  switch (report.value?.estado) {
    case "Resuelto":
      return "bg-green-100 text-green-700";

    case "En curso":
      return "bg-blue-100 text-blue-700";

    case "Pendiente":
    default:
      return "bg-[#fff1ed] text-[#e67661]";
  }
});

async function loadReport() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const reportId = route.params.id;

    if (!reportId) {
      throw new Error("El reporte no tiene un identificador válido.");
    }

    report.value = await fetchReportById(reportId);
  } catch (error) {
    console.error("[ReportDetail] Error cargando el reporte:", error);

    errorMessage.value =
      "No pudimos cargar el detalle de este reporte.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadReport);
</script>