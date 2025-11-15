<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
  uploadImage,
  saveReport,
  searchSimilarReports,
  joinReport,
} from "../services/reports";
import { subscribeToUserState } from "../services/auth";
import MapSearchPicker from "../components/MapSearchPicker.vue";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/vue/24/solid";

// --- Datos del formulario ---
const categoria = ref("");
const descripcion = ref("");
const ubicacion = ref("");
const coords = ref(null);
const imagen = ref(null);
const errorMessage = ref("");
const router = useRouter();

// nombre del archivo para mostrar
const selectedFileName = computed(() =>
  imagen.value ? imagen.value.name : ""
);

// --- Estados ---
const similares = ref([]);
const buscandoSimilares = ref(false);
const errorSimilares = ref("");
const showSuccessSheet = ref(false);
const showBottomSheet = ref(false);

// --- Datos del usuario ---
const user = ref({ id: null, email: null });

subscribeToUserState((newUserData) => {
  user.value = newUserData;
});

// Manejo de archivos
function onFileChange(e) {
  const file = e.target.files[0];
  imagen.value = file || null;
}

// Buscar reportes existentes
async function findSimilarReports() {
  errorSimilares.value = "";
  similares.value = [];
  showBottomSheet.value = false;
  buscandoSimilares.value = true;

  try {
    const lista = await searchSimilarReports({
      categoria: categoria.value,
      ubicacion: ubicacion.value,
    });

    similares.value = lista;

    if (lista.length > 0) {
      showBottomSheet.value = true;
    } else {
      errorSimilares.value =
        "No encontramos reportes similares. Podés crear uno nuevo";
    }
  } catch (e) {
    console.error("[findSimilarReports]", e);
    errorSimilares.value =
      "No se pudieron buscar reportes similares. Intentalo de nuevo.";
  } finally {
    buscandoSimilares.value = false;
  }
}

async function joinExistingReport(reporte) {
  try {
    await joinReport(reporte.id);

    showBottomSheet.value = false; // cierro lista
    showSuccessSheet.value = true; // abro modal centrado

    const item = similares.value.find((r) => r.id === reporte.id);
    if (item) item.apoyos = (item.apoyos || 0) + 1;
  } catch (e) {
    console.error("[joinExistingReport]", e);
    errorSimilares.value = "No se pudo sumar al reclamo.";
  }
}

async function handleSubmit() {
  try {
    if (similares.value.length > 0) {
      errorMessage.value =
        "Ya existen reportes similares. Podés sumarte a uno.";
      return;
    }

    if (
      !categoria.value ||
      !descripcion.value ||
      !ubicacion.value ||
      !imagen.value ||
      !coords.value
    ) {
      errorMessage.value =
        "Completá todos los campos y elegí un punto en el mapa.";
      return;
    }

    const imageUrl = await uploadImage(imagen.value);

    await saveReport({
      categoria: categoria.value,
      descripcion: descripcion.value,
      ubicacion: ubicacion.value,
      latitud: coords.value.lat,
      longitud: coords.value.lng,
      imagen: imageUrl,
      user_id: user.value.id,
      email: user.value.email,
    });

    router.push("/report/confirmado");
  } catch (error) {
    console.error("[handleSubmit]", error);
    errorMessage.value = "No se pudo enviar el reporte.";
  }
}

const hasSimilarReports = computed(() => similares.value.length > 0);

function startNewReport() {
  // cierro el modal
  showSuccessSheet.value = false;

  // limpio posibles similares y errores
  similares.value = [];
  errorSimilares.value = "";
  errorMessage.value = "";

  // limpio el formulario
  categoria.value = "";
  descripcion.value = "";
  ubicacion.value = "";
  coords.value = null;
  imagen.value = null;
}
</script>

<template>
  <div class="max-w-xl mx-auto mt-4 pb-24">
    <h1 class="text-2xl font-bold mb-6">Nuevo Reporte</h1>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- MAPA -->
      <div>
        <label class="block mb-1 font-semibold">Ubicación</label>
        <MapSearchPicker
          v-model="coords"
          height="230px"
          @resolved-address="ubicacion = $event"
        />
        <div class="text-sm text-gray-600 mt-2" v-if="coords">
          Punto: {{ coords.lat?.toFixed(5) }}, {{ coords.lng?.toFixed(5) }}
        </div>
      </div>

      <!-- CATEGORÍA -->
      <div>
        <label class="block mb-2 font-semibold">Categoría del problema</label>
        <select
          v-model="categoria"
          class="w-full mt-1 border rounded px-2 py-2"
        >
          <option disabled value="">Elegí una categoría</option>
          <option>Iluminación</option>
          <option>Infraestructura</option>
          <option>Seguridad</option>
        </select>
      </div>

      <!-- BUSCAR SIMILARES -->
      <div class="border rounded-lg p-3 bg-gray-50">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm text-gray-700">
            Antes de crear un reporte nuevo, verificá si ya existe:
          </p>
          <button
            type="button"
            @click="findSimilarReports"
            class="text-xs px-3 py-1.5 rounded-full border border-[#3082e3] text-[#3082e3] hover:bg-blue-50"
          >
            Buscar similares
          </button>
        </div>

        <div v-if="buscandoSimilares" class="text-xs text-gray-500">
          Buscando...
        </div>
        <div v-if="errorSimilares" class="text-xs text-gray-600">
          {{ errorSimilares }}
        </div>
      </div>

      <!-- DESCRIPCIÓN -->
      <div>
        <label class="block mb-1 font-semibold">Descripción</label>
        <textarea
          v-model="descripcion"
          :disabled="hasSimilarReports"
          class="w-full p-2 border border-gray-300 rounded min-h-[90px] disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="Contá qué pasó..."
        ></textarea>
      </div>

      <!-- IMAGEN -->
      <div class="flex flex-col items-center">
        <label
          for="imageUpload"
          class="cursor-pointer flex items-center gap-2 bg-[#3082e3] text-white px-5 py-2 rounded-lg shadow-md hover:bg-[#085baf] active:scale-95 transition-all"
        >
          <span>Subir imagen</span>
        </label>

        <input
          id="imageUpload"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileChange"
        />

        <p v-if="selectedFileName" class="mt-2 text-sm text-gray-600">
          📎 {{ selectedFileName }}
        </p>
      </div>

      <!-- ERROR GENERAL -->
      <div v-if="errorMessage" class="text-red-600 text-sm">
        {{ errorMessage }}
      </div>

      <!-- BOTÓN ENVIAR -->
      <button
        type="submit"
        :disabled="hasSimilarReports"
        class="w-full bg-[#3082e3] text-white py-2 px-4 rounded hover:bg-[#085baf] disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Enviar Reporte
      </button>
    </form>

    <!-- MODAL ÉXITO -->
    <div
      v-if="showSuccessSheet"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-white rounded-2xl w-11/12 max-w-sm p-6 shadow-xl relative">
        <button
          @click="showSuccessSheet = false"
          class="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>

        <h2 class="text-xl font-semibold text-gray-800 mb-3">
          ¡Te sumaste al reclamo!
        </h2>

        <p class="text-base text-gray-700 leading-relaxed mb-5">
          Gracias por contribuir a la seguridad de tu zona.
        </p>

        <div class="space-y-3">
          <button
            @click="router.push('/')"
            class="w-full bg-[#3082e3] text-white py-2.5 rounded-lg font-medium hover:bg-[#085baf]"
          >
            Ir al inicio
          </button>

          <button
            type="button"
            @click="startNewReport"
            class="w-full bg-gray-100 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-200"
          >
            Hacer un nuevo reporte
          </button>
        </div>
      </div>
    </div>

    <!-- BOTTOM SHEET SIMILARES -->
    <div
      v-if="showBottomSheet"
      class="fixed inset-0 bg-black/40 z-40"
      @click="showBottomSheet = false"
    ></div>

    <div
      v-if="showBottomSheet"
      class="fixed bottom-0 left-0 w-full bg-white rounded-t-2xl shadow-xl z-50 p-4 pb-8 animate-slide-up"
    >
      <div class="flex justify-center mb-2">
        <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      <div class="flex justify-between items-center mb-3">
        <h2 class="text-lg font-semibold text-gray-800">Reportes similares</h2>

        <button @click="showBottomSheet = false" class="text-gray-500">
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <p class="text-sm text-gray-700 mb-3 leading-normal">
        Ya existen reportes parecidos. Podés sumarte a uno.
      </p>

      <ul class="space-y-3 max-h-64 overflow-y-auto">
        <li
          v-for="r in similares"
          :key="r.id"
          class="p-3 border rounded-lg shadow-sm bg-gray-50"
        >
          <p class="font-medium text-gray-800">{{ r.categoria }}</p>
          <p class="text-gray-700 text-sm">{{ r.ubicacion }}</p>
          <p class="text-xs text-gray-500 mt-1">
            Apoyos: <span class="font-semibold">{{ r.apoyos ?? 0 }}</span> —
            {{ new Date(r.created_at).toLocaleDateString() }}
          </p>

          <button
            @click="joinExistingReport(r)"
            class="mt-2 w-full bg-[#3082e3] text-white py-1.5 rounded-lg text-sm hover:bg-[#085baf]"
          >
            Sumarme a este reporte
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0%);
  }
}

.animate-slide-up {
  animation: slide-up 0.25s ease-out;
}
</style>
