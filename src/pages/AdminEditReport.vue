<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchReportById, updateReport } from "../services/reports";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const form = ref({
  categoria: "",
  descripcion: "",
  ubicacion: "",
  estado: "Pendiente",
});

async function loadReport() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const reportId = route.params.id;
    const report = await fetchReportById(reportId);

    form.value = {
      categoria: report.categoria ?? "",
      descripcion: report.descripcion ?? "",
      ubicacion: report.ubicacion ?? "",
      estado: report.estado ?? "Pendiente",
    };
  } catch (error) {
    console.error("[AdminEditReport] Error cargando reporte:", error);
    errorMessage.value = "No se pudo cargar el reporte.";
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const reportId = route.params.id;

    await updateReport(reportId, {
      categoria: form.value.categoria,
      descripcion: form.value.descripcion,
      ubicacion: form.value.ubicacion,
      estado: form.value.estado,
    });

    successMessage.value = "El reporte se actualizó con éxito.";

    setTimeout(() => {
      router.push("/admin/reportes");
    }, 1800);
  } catch (error) {
    console.error("[AdminEditReport] Error actualizando reporte:", error);
    errorMessage.value = "No se pudo actualizar el reporte.";
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadReport();
});
</script>

<template>
  <section class="min-h-screen bg-[#E0E5EC] px-4 pt-4 pb-8">
    <div class="mx-auto max-w-3xl">
      <!-- volver -->
      <button
        type="button"
        @click="router.push('/admin/reportes')"
        class="mb-6 inline-flex items-center gap-3 text-left transition group active:scale-95"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0E5EC] text-xl font-bold text-[#3082e3]
                 shadow-[-6px_-6px_12px_rgba(255,255,255,0.85),6px_6px_12px_rgba(163,177,198,0.35)]
                 transition group-hover:text-[#085baf] group-active:text-[#085baf]"
        >
          ←
        </span>

        <span>
          <span
            class="block text-sm font-semibold text-slate-900 transition group-hover:text-[#3082e3] group-active:text-[#3082e3]"
          >
            Volver a reportes
          </span>
          <span class="block text-xs text-slate-500">
            Regresá a la gestión general de reportes
          </span>
        </span>
      </button>

      <!-- header -->
      <header class="mb-8">
        <h1 class="text-[30px] font-bold leading-tight text-slate-900 sm:text-[34px]">
          Editar reporte
        </h1>
        <p class="mt-2 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
          Actualizá la información del reporte manteniendo claridad y seguimiento.
        </p>
      </header>

      <!-- loading -->
      <div
        v-if="loading"
        class="rounded-[28px] bg-[#E0E5EC] p-6 shadow-[-8px_-8px_16px_rgba(255,255,255,0.85),8px_8px_16px_rgba(163,177,198,0.35)]"
      >
        <p class="text-slate-600">Cargando reporte...</p>
      </div>

      <template v-else>
        <!-- error -->
        <div
          v-if="errorMessage"
          class="mb-6 rounded-[24px] bg-[#fff1ed] p-5 text-[#e67661] shadow-sm"
        >
          <p class="text-sm font-medium">{{ errorMessage }}</p>
        </div>

        <!-- success -->
        <div
          v-if="successMessage"
          class="mb-6 rounded-[24px] bg-[#eef4ff] p-5 text-[#3082e3] shadow-sm"
        >
          <p class="text-sm font-medium">{{ successMessage }}</p>
        </div>

        <!-- form -->
        <form
          @submit.prevent="handleSubmit"
          class="rounded-[30px] bg-[#E0E5EC] p-5 sm:p-6
                 shadow-[-8px_-8px_16px_rgba(255,255,255,0.85),8px_8px_16px_rgba(163,177,198,0.35)]"
        >
          <div class="grid gap-5 md:grid-cols-2">
            <!-- categoria -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-500">
                Categoría
              </label>
              <select
                v-model="form.categoria"
                class="w-full rounded-2xl border-0 bg-[#E0E5EC] px-4 py-3 text-sm text-slate-700
                       shadow-[-6px_-6px_12px_rgba(255,255,255,0.85),6px_6px_12px_rgba(163,177,198,0.35)]
                       focus:outline-none focus:ring-2 focus:ring-[#3082e3]/30"
              >
                <option disabled value="">Elegí una categoría</option>
                <option>Iluminación</option>
                <option>Infraestructura</option>
                <option>Seguridad</option>
              </select>
            </div>

            <!-- estado -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-500">
                Estado
              </label>
              <select
                v-model="form.estado"
                class="w-full rounded-2xl border-0 bg-[#E0E5EC] px-4 py-3 text-sm text-slate-700
                       shadow-[-6px_-6px_12px_rgba(255,255,255,0.85),6px_6px_12px_rgba(163,177,198,0.35)]
                       focus:outline-none focus:ring-2 focus:ring-[#3082e3]/30"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Resuelto">Resuelto</option>
              </select>
            </div>
          </div>

          <!-- ubicacion -->
          <div class="mt-5">
            <label class="mb-2 block text-sm font-medium text-slate-500">
              Ubicación
            </label>
            <input
              v-model="form.ubicacion"
              type="text"
              class="w-full rounded-2xl border-0 bg-[#E0E5EC] px-4 py-3 text-sm text-slate-700
                     shadow-[-6px_-6px_12px_rgba(255,255,255,0.85),6px_6px_12px_rgba(163,177,198,0.35)]
                     focus:outline-none focus:ring-2 focus:ring-[#3082e3]/30"
            />
          </div>

          <!-- descripcion -->
          <div class="mt-5">
            <label class="mb-2 block text-sm font-medium text-slate-500">
              Descripción
            </label>
            <textarea
              v-model="form.descripcion"
              rows="6"
              class="w-full resize-none rounded-2xl border-0 bg-[#E0E5EC] px-4 py-3 text-sm leading-7 text-slate-700
                     shadow-[-6px_-6px_12px_rgba(255,255,255,0.85),6px_6px_12px_rgba(163,177,198,0.35)]
                     focus:outline-none focus:ring-2 focus:ring-[#3082e3]/30"
            ></textarea>
          </div>

          <!-- acciones -->
          <div class="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 rounded-2xl bg-[#3082e3] px-4 py-3 text-sm font-semibold text-white
                     shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
            >
              {{ saving ? "Guardando..." : "Guardar cambios" }}
            </button>

            <button
              type="button"
              @click="router.push('/admin/reportes')"
              class="flex-1 rounded-2xl bg-[#E0E5EC] px-4 py-3 text-sm font-semibold text-slate-700
                     shadow-[-6px_-6px_12px_rgba(255,255,255,0.85),6px_6px_12px_rgba(163,177,198,0.35)]
                     transition hover:text-[#3082e3] active:scale-[0.98]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </template>
    </div>
  </section>
</template>
