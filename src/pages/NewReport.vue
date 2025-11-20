<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  uploadImage,
  saveReport,
  searchSimilarReports,
  joinReport,
} from "../services/reports";
import { subscribeToUserState } from "../services/auth";
import MapSearchPicker from "../components/MapSearchPicker.vue";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  TagIcon,
  PencilSquareIcon,
  PhotoIcon,
  ArrowRightIcon,
} from "@heroicons/vue/24/solid";

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

// --- Onboarding para crear reporte (solo primera vez) ---
const showOnboarding = ref(false);
const onboardingStep = ref(1); // 1: mapa, 2: categoría, 3: descripción, 4: imagen

// modal popup con la tarjeta de aviso
const showSimilarHintModal = ref(false);

// --- Datos del usuario ---
const user = ref({ id: null, email: null });

subscribeToUserState((newUserData) => {
  user.value = newUserData;
});

onMounted(() => {
  // Si nunca lo vio, mostramos el onboarding
  if (localStorage.getItem("vs_newreport_onboarding_seen") !== "1") {
    showOnboarding.value = true;
    onboardingStep.value = 1;
  }
});

function finishOnboarding() {
  showOnboarding.value = false;
  localStorage.setItem("vs_newreport_onboarding_seen", "1");
}

function nextOnboarding() {
  if (onboardingStep.value < 4) {
    onboardingStep.value++;
  } else {
    // Último paso → cerramos
    finishOnboarding();
  }
}

function skipOnboarding() {
  finishOnboarding();
}

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
  showSimilarHintModal.value = false;
  buscandoSimilares.value = true;

  try {
    const lista = await searchSimilarReports({
      categoria: categoria.value,
      ubicacion: ubicacion.value,
    });

    similares.value = lista;

    if (lista.length > 0) {
      // Hay coincidencias: mostramos el modal tipo popup
      showSimilarHintModal.value = true;
    } else {
      // No hay similares
      errorSimilares.value =
        "No encontramos reportes similares. Podés crear uno nuevo.";
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
    showSuccessSheet.value = true; // abro modal centrado de éxito

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
        "Ya existen reportes similares en esta zona. Podés sumarte a uno.";
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
        "Por favor completá todos los campos, elegí un punto en el mapa y subí una imagen.";
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
    errorMessage.value = "No se pudo enviar el reporte. Intentalo de nuevo.";
  }
}

const hasSimilarReports = computed(() => similares.value.length > 0);

function startNewReport() {
  showSuccessSheet.value = false;

  similares.value = [];
  errorSimilares.value = "";
  errorMessage.value = "";

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
      <div
        :class="[
          'rounded-xl p-2 -m-2 transition-all',
          showOnboarding && onboardingStep === 1
            ? 'ring-2 ring-[#3082e3] bg-blue-50/60'
            : '',
        ]"
      >
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
      <div
        :class="[
          'rounded-xl p-2 -m-2 mt-3 transition-all',
          showOnboarding && onboardingStep === 2
            ? 'ring-2 ring-[#3082e3] bg-blue-50/60'
            : '',
        ]"
      >
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

      <!-- Link chiquito para disparar la búsqueda -->
      <div class="flex justify-end items-center gap-2">
        <button
          type="button"
          @click="findSimilarReports"
          class="text-s text-[#3082e3] font-medium underline underline-offset-2 hover:text-[#085baf]"
        >
          Ver si ya hay reclamos en esta zona
        </button>
      </div>

      <!-- Mensajito de error / feedback de búsqueda -->
      <div v-if="buscandoSimilares" class="text-s text-gray-500">
        Buscando reportes similares...
      </div>
      <div v-if="errorSimilares" class="text-s text-gray-600">
        {{ errorSimilares }}
      </div>

      <!-- DESCRIPCIÓN -->
      <div
        :class="[
          'rounded-xl p-2 -m-2 mt-3 transition-all',
          showOnboarding && onboardingStep === 3
            ? 'ring-2 ring-[#3082e3] bg-blue-50/60'
            : '',
        ]"
      >
        <label class="block mb-1 font-semibold">Descripción</label>
        <textarea
          v-model="descripcion"
          :disabled="hasSimilarReports"
          class="w-full p-2 border border-gray-300 rounded min-h-[90px] disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="Contá qué pasó, por qué este lugar no es seguro, etc."
        ></textarea>
        <p
          v-if="hasSimilarReports"
          class="text-sm text-yellow-700 mt-2 bg-yellow-50 px-3 py-2 rounded-md leading-normal"
        >
          Encontramos reportes similares en esta zona. Sumate a uno existente
          desde la lista en lugar de crear uno nuevo.
        </p>
      </div>

      <!-- IMAGEN -->
      <div
        class="flex flex-col items-center"
        :class="[
          'rounded-xl p-2 -m-2 mt-3 transition-all',
          showOnboarding && onboardingStep === 4
            ? 'ring-2 ring-[#3082e3] bg-blue-50/60'
            : '',
        ]"
      >
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
          {{ selectedFileName }}
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

    <!-- ONBOARDING: tour paso a paso (solo primera vez) -->
    <div
      v-if="showOnboarding"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" >
      <div
        class="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-5" >
        <!-- Header: título + botón cerrar -->
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-gray-800">
            Consejos para crear tu reporte 
          </h2>
          <button
            type="button"
            @click="skipOnboarding"
            class="text-xs text-gray-500 hover:text-gray-700" >
            Saltar
          </button>
        </div>

        <!-- Ícono según el paso -->
        <div class="flex items-center gap-3 mb-2">
          <component
            :is="
              onboardingStep === 1
                ? MapPinIcon
                : onboardingStep === 2
                ? TagIcon
                : onboardingStep === 3
                ? PencilSquareIcon
                : PhotoIcon
            "
            class="w-7 h-7 text-[#3082e3]" />
          <p class="font-medium text-gray-800">
            <span v-if="onboardingStep === 1">Elegí el lugar del problema</span>
            <span v-else-if="onboardingStep === 2"
              >Seleccioná la categoría</span>
            <span v-else-if="onboardingStep === 3">Describí qué pasó</span>
            <span v-else>Subí una foto del lugar</span>
          </p>
        </div>

        <!-- Texto según el paso -->
        <p class="text-sm text-gray-700 leading-relaxed mb-4">
          <span v-if="onboardingStep === 1">
            Usá el mapa para escribir lo más preciso posible dónde ocurrió el
            problema.
          </span>
          <span v-else-if="onboardingStep === 2">
            Elegí si se trata de iluminación, infraestructura o seguridad. Esto
            ayuda a ordenar los reportes.
          </span>
          <span v-else-if="onboardingStep === 3">
            Contá en pocas palabras qué pasó y cómo afecta la zona. No hace
            falta un texto largo, solo claro.
          </span>
          <span v-else>
            Una imagen dice mucho: sacá una foto del problema para que otras
            personas puedan identificarlo rápido.
          </span>
        </p>

        <!-- Footer: progreso + botón siguiente -->
        <div class="flex items-center justify-between">
          <!-- Dots del onboarding -->
          <div class="flex gap-1">
            <span
              v-for="i in 4"
              :key="i"
              class="w-2 h-2 rounded-full"
              :class="i === onboardingStep ? 'bg-[#3082e3]' : 'bg-gray-300'"
            />
          </div>

          <button
            type="button"
            @click="nextOnboarding"
            class="inline-flex items-center gap-1 bg-[#3082e3] text-white text-sm px-3 py-1.5 rounded-lg hover:bg-[#085baf] active:scale-95 transition">
            <span v-if="onboardingStep < 4">Siguiente</span>
            <span v-else>Empezar</span>
            <ArrowRightIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL POPUP: “Evitá duplicar reclamos” -->
    <div
      v-if="showSimilarHintModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-2xl w-11/12 max-w-sm p-5 shadow-xl relative">
        <!-- Botón cerrar -->
        <button
          @click="showSimilarHintModal = false"
          class="absolute top-3 right-3 text-gray-400 hover:text-gray-600" >
          <XMarkIcon class="h-5 w-5" />
        </button>

        <!-- Contenido de la “tarjetita” -->
        <div class="flex items-center gap-2 mb-3">
          <ExclamationTriangleIcon class="w-6 h-6 text-[#3082e3]" />
          <p class="font-semibold text-gray-800 text-base">
            Evitá duplicar reclamos
          </p>
        </div>

        <p class="text-sm text-gray-700 mb-4 leading-snug">
          Encontramos reportes similares en esta zona. Podés sumarte a un
          reclamo existente para darle más fuerza y prioridad.
        </p>

        <div class="space-y-2">
          <button
            type="button"
            @click="
              showSimilarHintModal = false;
              showBottomSheet = true;
            "
            class="w-full bg-[#3082e3] text-white py-2.5 rounded-lg font-medium hover:bg-[#085baf] active:scale-[.98] transition"
          >
            Ver reportes similares
          </button>

          <button
            type="button"
            @click="showSimilarHintModal = false"
            class="w-full bg-gray-100 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-200 active:scale-[.98]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL ÉXITO SUMARSE AL RECLAMO -->
    <div
      v-if="showSuccessSheet"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div
        class="bg-white rounded-2xl w-11/12 max-w-sm p-6 shadow-xl relative flex flex-col items-center gap-3"
      >
        <button
          @click="showSuccessSheet = false"
          class="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>

        <div
          class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"
        >
          <CheckCircleIcon class="h-8 w-8 text-green-600" />
        </div>

        <h2 class="text-lg font-semibold text-gray-800 text-center">
          ¡Te sumaste al reclamo!
        </h2>

        <p class="text-sm text-gray-700 leading-relaxed text-center mb-2">
          Gracias por contribuir a la seguridad de tu zona. Tu apoyo se registró
          correctamente.
        </p>

        <div class="w-full space-y-3 mt-1">
          <button
            @click="router.push('/')"
            class="w-full bg-[#3082e3] text-white py-2.5 rounded-lg font-medium hover:bg-[#085baf] active:scale-[.98] transition"
          >
            Ir al inicio
          </button>

          <button
            type="button"
            @click="startNewReport"
            class="w-full bg-gray-100 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-200 active:scale-[.98]"
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
        Ya existen reportes parecidos en esta zona. Podés sumarte a uno de ellos
        para darle más fuerza al reclamo.
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
            Apoyos:
            <span class="font-semibold">{{ r.apoyos ?? 0 }}</span>
            — {{ new Date(r.created_at).toLocaleDateString() }}
          </p>

          <button
            @click="joinExistingReport(r)"
            class="mt-2 w-full bg-[#3082e3] text-white py-1.5 rounded-lg text-sm hover:bg-[#085baf] active:scale-[.98]"
          >
            Sumarme a este reporte
          </button>
        </li>
      </ul>

      <p class="text-sm text-gray-500 mt-3 text-center">
        Si ninguno coincide exactamente con lo que querés reportar, podés cerrar
        esta ventana y completar un reporte nuevo.
      </p>
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
