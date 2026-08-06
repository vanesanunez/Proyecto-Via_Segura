<template>
  <main class="min-h-[100dvh] bg-[#F7F9F6] pb-24">
    <section class="mx-auto w-full max-w-xl px-4 py-6">
      <!-- Encabezado -->
      <header
        class="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4"
      >
        <button
          type="button"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100 active:bg-gray-200"
          aria-label="Volver"
          @click="router.back()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#2A2A2A"
            stroke-width="2.2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div>
          <h1 class="text-base font-semibold text-[#2A2A2A]">
            Detalle del reporte
          </h1>

          <p class="mt-1 text-xs text-gray-500">
            Consultá toda la información del reclamo.
          </p>
        </div>
      </header>

      <!-- Cargando -->
      <div
        v-if="loading"
        class="rounded-2xl border border-[#D6E8FB] bg-white p-8 text-center text-sm text-gray-500"
      >
        Cargando reporte...
      </div>

      <!-- Error -->
      <div
        v-else-if="errorMessage"
        class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
      >
        {{ errorMessage }}

        <RouterLink
          to="/reportes"
          class="mt-4 block font-semibold text-[#3082E3]"
        >
          Volver a los reportes
        </RouterLink>
      </div>

      <!-- Reporte completo -->
      <article
        v-else-if="report"
        class="overflow-hidden rounded-[24px] border border-[#D6E8FB] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.07)]"
      >
        <!-- Imagen -->
        <div
          v-if="report.imagen"
          class="h-56 w-full overflow-hidden bg-gray-100"
        >
          <img
            :src="report.imagen"
            :alt="`Imagen del reporte de ${report.categoria}`"
            class="h-full w-full object-cover"
          />
        </div>

        <div
        
 v-else
          class="flex h-40 items-center justify-center bg-[#EEF4FF]"
        >
          <span class="text-sm text-gray-500">
            Este reporte no tiene una imagen disponible.
          </span>
        </div>

        <div class="p-5">
          <!-- Categoría y estado -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span
              class="rounded-full bg-[#EEF4FF] px-3 py-1.5 text-xs font-bold text-[#3082E3]"
            >
              {{ report.categoria }}
            </span>

            <span
              class="rounded-full px-3 py-1.5 text-xs font-bold"
              :class="
                isResolved
                  ? 'bg-green-100 text-green-700'
                  : 'bg-[#FFF1ED] text-[#E67661]'
              "
            >
              {{ report.estado || "Pendiente" }}
            </span>
          </div>

          <!-- Descripción -->
          <section class="mt-6">
            <h2 class="text-sm font-bold text-[#2A2A2A]">
              Descripción
            </h2>

            <p
              class="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600"
            >
              {{ report.descripcion || "Sin descripción." }}
            </p>
          </section>

          <!-- Ubicación -->
          <section
            class="mt-5 rounded-2xl border border-[#D6E8FB] bg-[#F8FBFF] p-4"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-[#3082E3]">
              Ubicación
            </p>

            <p class="mt-2 text-sm leading-6 text-gray-700">
              {{ report.ubicacion || "Ubicación no disponible." }}
            </p>
          </section>

          <!-- Datos del reporte -->
          <div
            class="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5"
          >
            <div class="rounded-2xl bg-gray-50 p-4">
              <p class="text-xs text-gray-500">
                Apoyos
              </p>

              <p class="mt-1 text-xl font-bold text-[#085BAF]">
                {{ report.apoyos ?? 0 }}
              </p>
            </div>

            <div class="rounded-2xl bg-gray-50 p-4">
              <p class="text-xs text-gray-500">
                Publicado
              </p>

              <p class="mt-1 text-sm font-bold text-[#2A2A2A]">
                {{ formattedDate }}
              </p>
            </div>
          </div>

          <RouterLink
            to="/reportes"
            class="mt-6 flex w-full items-center justify-center rounded-xl bg-[#3082E3] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#085BAF] active:scale-[0.98]"
          >
            Volver a todos los reportes
          </RouterLink>
        </div>
      </article>
    </section>

    <BottomNavigation />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { fetchReportById } from "../services/reports";
import BottomNavigation from "../components/BottomNavigation.vue";

const route = useRoute();
const router = useRouter();

const report = ref(null);
const loading = ref(true);
const errorMessage = ref("");

const isResolved = computed(() => {
  return report.value?.estado?.toLowerCase() === "resuelto";
});

const formattedDate = computed(() => {
  if (!report.value?.created_at) {
    return "Sin fecha";
  }

  return new Date(report.value.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
});

async function loadReport() {
  loading.value = true;
  errorMessage.value = "";

  try {
    report.value = await fetchReportById(route.params.id);
  } catch (error) {
    console.error(
      "[ReportDetail.vue] Error cargando el reporte:",
      error,
    );

    errorMessage.value =
      "No pudimos encontrar o cargar este reporte.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadReport);
</script>