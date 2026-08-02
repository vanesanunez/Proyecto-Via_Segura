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
  <section class="min-h-[100dvh] bg-[#F7F9F6] px-4 pb-10 pt-5">
    <div class="mx-auto w-full max-w-2xl">
      <!-- Volver -->
      <button
        type="button"
        @click="router.push('/admin/reportes')"
        class="group mb-5 inline-flex items-center gap-2 rounded-full border border-[#D6E8FB] bg-[#EEF4FF] px-3 py-2 text-sm font-semibold text-[#3082E3] transition hover:border-[#3082E3] hover:bg-white active:scale-[0.98]"
      >
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-sm transition group-hover:bg-[#3082E3] group-hover:text-white"
        >
          ←
        </span>

        <span>Volver a reportes</span>
      </button>

      <!-- Encabezado -->
      <header
        class="mb-5 rounded-[26px] border border-[#D6E8FB] bg-[#EEF4FF] p-5 shadow-[0_10px_26px_rgba(48,130,227,0.08)]"
      >
        <span
          class="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#3082E3]"
        >
          Administración
        </span>

        <h1
          class="mt-3 text-[28px] font-bold leading-tight text-slate-900 sm:text-[34px]"
        >
          Editar reporte
        </h1>

        <p class="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          Actualizá la información y el estado del reporte antes de guardar los
          cambios.
        </p>
      </header>

      <!-- Cargando -->
      <div
        v-if="loading"
        class="rounded-[24px] border border-[#D6E8FB] bg-white p-6 shadow-[0_10px_26px_rgba(48,130,227,0.07)]"
      >
        <div class="flex items-center gap-3">
          <div
            class="h-6 w-6 animate-spin rounded-full border-2 border-[#D6E8FB] border-t-[#3082E3]"
          ></div>

          <p class="text-sm font-medium text-slate-600">
            Cargando reporte...
          </p>
        </div>
      </div>

      <template v-else>
        <!-- Error -->
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

        <!-- Éxito -->
        <div
          v-if="successMessage"
          class="mb-5 flex items-start gap-3 rounded-[20px] border border-[#D6E8FB] bg-[#EEF4FF] px-4 py-3 text-[#3082E3]"
        >
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-bold"
          >
            ✓
          </span>

          <div>
            <p class="text-sm font-semibold">
              {{ successMessage }}
            </p>

            <p class="mt-0.5 text-xs text-slate-500">
              Volverás automáticamente al listado de reportes.
            </p>
          </div>
        </div>

        <!-- Formulario -->
        <form
          @submit.prevent="handleSubmit"
          class="rounded-[26px] border border-[#D6E8FB] bg-white p-5 shadow-[0_12px_30px_rgba(48,130,227,0.08)] sm:p-6"
        >
          <!-- Título del formulario -->
          <div class="mb-6">
            <h2 class="text-[18px] font-bold text-slate-900">
              Información del reporte
            </h2>

            <p class="mt-1 text-sm leading-6 text-slate-500">
              Revisá que los datos sean claros antes de guardar.
            </p>
          </div>

          <!-- Categoría y estado -->
          <div class="grid gap-5 sm:grid-cols-2">
            <!-- Categoría -->
            <div>
              <label
                for="edit-category"
                class="mb-2 block text-sm font-semibold text-slate-700"
              >
                Categoría
              </label>

              <select
                id="edit-category"
                v-model="form.categoria"
                class="w-full rounded-2xl border border-[#D6E8FB] bg-[#F9FBFD] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#3082E3] focus:ring-2 focus:ring-[#3082E3]/20"
              >
                <option disabled value="">Elegí una categoría</option>
                <option>Iluminación</option>
                <option>Infraestructura</option>
                <option>Seguridad</option>
              </select>
            </div>

            <!-- Estado -->
            <div>
              <label
                for="edit-status"
                class="mb-2 block text-sm font-semibold text-slate-700"
              >
                Estado
              </label>

              <select
                id="edit-status"
                v-model="form.estado"
                class="w-full rounded-2xl border border-[#D6E8FB] bg-[#F9FBFD] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#3082E3] focus:ring-2 focus:ring-[#3082E3]/20"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Resuelto">Resuelto</option>
              </select>

              <p
                class="mt-2 text-xs leading-5"
                :class="
                  form.estado === 'Resuelto'
                    ? 'text-green-700'
                    : 'text-[#E67661]'
                "
              >
                {{
                  form.estado === "Resuelto"
                    ? "El problema quedará marcado como solucionado."
                    : "El reporte continuará pendiente de resolución."
                }}
              </p>
            </div>
          </div>

          <!-- Ubicación -->
          <div class="mt-5">
            <label
              for="edit-location"
              class="mb-2 block text-sm font-semibold text-slate-700"
            >
              Ubicación
            </label>

            <input
              id="edit-location"
              v-model="form.ubicacion"
              type="text"
              class="w-full rounded-2xl border border-[#D6E8FB] bg-[#F9FBFD] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#3082E3] focus:ring-2 focus:ring-[#3082E3]/20"
              placeholder="Ingresá la dirección del problema"
            />

            <p class="mt-2 text-xs leading-5 text-slate-500">
              Verificá que la dirección permita identificar correctamente el
              lugar.
            </p>
          </div>

          <!-- Descripción -->
          <div class="mt-5">
            <label
              for="edit-description"
              class="mb-2 block text-sm font-semibold text-slate-700"
            >
              Descripción
            </label>

            <textarea
              id="edit-description"
              v-model="form.descripcion"
              rows="6"
              class="w-full resize-none rounded-2xl border border-[#D6E8FB] bg-[#F9FBFD] px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#3082E3] focus:ring-2 focus:ring-[#3082E3]/20"
              placeholder="Describí qué sucede en el lugar"
            ></textarea>

            <p class="mt-2 text-xs leading-5 text-slate-500">
              Mantené una descripción breve, clara y relacionada con el
              problema.
            </p>
          </div>

          <!-- Acciones -->
          <div
            class="mt-7 flex flex-col-reverse gap-3 border-t border-[#E6EDF7] pt-5 sm:flex-row sm:justify-end"
          >
            <button
              type="button"
              @click="router.push('/admin/reportes')"
              class="rounded-2xl border border-[#D6E8FB] bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#EEF4FF] hover:text-[#3082E3] active:scale-[0.98] sm:min-w-[150px]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              :disabled="saving"
              class="rounded-2xl bg-[#3082E3] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(48,130,227,0.24)] transition hover:bg-[#085BAF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[180px]"
            >
              {{ saving ? "Guardando cambios..." : "Guardar cambios" }}
            </button>
          </div>
        </form>
      </template>
    </div>
  </section>
</template>
