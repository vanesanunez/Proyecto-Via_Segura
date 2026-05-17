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

    successMessage.value = "Reporte actualizado con éxito.";

    setTimeout(() => {
      router.push("/admin/dashboard");
    }, 1200);
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
  <section class="min-h-screen bg-slate-50 p-6">
    <div class="mx-auto max-w-3xl">
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
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-slate-800 sm:text-3xl">
          Editar reporte
        </h1>
        <p class="mt-2 text-sm text-slate-600 sm:text-base">
          Desde acá podés corregir o actualizar la información del reporte.
        </p>
      </header>

      <div v-if="loading" class="rounded-2xl bg-white p-6 shadow-sm">
        <p class="text-slate-600">Cargando reporte...</p>
      </div>

      <div v-else class="rounded-2xl bg-white p-6 shadow-sm">
        <div
          v-if="errorMessage"
          class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
        >
          {{ errorMessage }}
        </div>

        <div
          v-if="successMessage"
          class="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700"
        >
          {{ successMessage }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">
              Categoría
            </label>
            <select
              v-model="form.categoria"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option disabled value="">Elegí una categoría</option>
              <option>Iluminación</option>
              <option>Infraestructura</option>
              <option>Seguridad</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">
              Ubicación
            </label>
            <input
              v-model="form.ubicacion"
              type="text"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">
              Descripción
            </label>
            <textarea
              v-model="form.descripcion"
              rows="5"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            ></textarea>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">
              Estado
            </label>
            <select
              v-model="form.estado"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Resuelto">Resuelto</option>
            </select>
          </div>

          <div class="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              :disabled="saving"
              class="rounded-lg bg-[#3082e3] px-4 py-2 text-white hover:bg-[#085baf] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {{ saving ? "Guardando..." : "Guardar cambios" }}
            </button>

            <button
              type="button"
              @click="router.push('/admin/dashboard')"
              class="rounded-lg bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
