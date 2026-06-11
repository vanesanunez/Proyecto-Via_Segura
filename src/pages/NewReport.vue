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
const onboardingStep = ref(1);

// modal popup con la tarjeta de aviso
const showSimilarHintModal = ref(false);

// --- Datos del usuario ---
const user = ref({ id: null, email: null });

subscribeToUserState((newUserData) => {
  user.value = newUserData;
});

onMounted(() => {
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
    finishOnboarding();
  }
}

function skipOnboarding() {
  finishOnboarding();
}

// --- Contenido del onboarding ---
const onboardingContent = computed(() => {
  if (onboardingStep.value === 1) {
    return {
      icon: MapPinIcon,
      eyebrow: "Paso 1",
      title: "Marcá bien el lugar",
      text: "Ubicá el problema con precisión para que otras personas puedan encontrarlo rápido.",
      button: "Siguiente",
    };
  }

  if (onboardingStep.value === 2) {
    return {
      icon: TagIcon,
      eyebrow: "Paso 2",
      title: "Elegí la categoría",
      text: "Seleccioná el tipo de problema y revisá si ya existe un reclamo similar en esa zona.",
      button: "Siguiente",
    };
  }

  if (onboardingStep.value === 3) {
    return {
      icon: PencilSquareIcon,
      eyebrow: "Paso 3",
      title: "Contá qué pasó",
      text: "Describilo en pocas palabras, de forma clara y directa.",
      button: "Siguiente",
    };
  }

  return {
    icon: PhotoIcon,
    eyebrow: "Paso 4",
    title: "Subí una foto",
    text: "La imagen es obligatoria porque ayuda a validar mejor el reporte.",
    button: "Empezar",
  };
});

// --- Progreso visual ---
const completedSteps = computed(() => {
  let total = 0;

  if (coords.value && ubicacion.value) total += 1;
  if (categoria.value) total += 1;
  if (descripcion.value.trim()) total += 1;
  if (imagen.value) total += 1;

  return total;
});

const progressPercent = computed(() => (completedSteps.value / 4) * 100);

const canSearchSimilar = computed(() => {
  return Boolean(categoria.value && ubicacion.value);
});

const hasSimilarReports = computed(() => similares.value.length > 0);

// Manejo de archivos
function onFileChange(e) {
  const file = e.target.files[0];
  imagen.value = file || null;
}

// Buscar reportes existentes
async function findSimilarReports() {
  errorMessage.value = "";
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

    similares.value = lista ?? [];

    if (similares.value.length > 0) {
      showSimilarHintModal.value = true;
    } else {
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
    await joinReport(reporte.id, user.value.id);

    showBottomSheet.value = false;
    showSuccessSheet.value = true;

    const item = similares.value.find((r) => r.id === reporte.id);
    if (item) item.apoyos = (item.apoyos || 0) + 1;
  } catch (e) {
    console.error("[joinExistingReport]", e);
    errorSimilares.value = "No se pudo sumar al reclamo.";
  }
}

async function handleSubmit() {
  try {
    errorMessage.value = "";

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
        "Completá ubicación, categoría, descripción y foto para enviar el reporte.";
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
  <div class="mx-auto mt-4 max-w-xl px-4 pb-28">
    <!-- Header / progreso -->
    <header
      class="rounded-[28px] bg-[#3082e3] px-5 py-5 text-white shadow-[0_12px_28px_rgba(48,130,227,0.24)]"
    >
      <div class="min-w-0">
        <span
          class="inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold"
        >
          Reporte guiado
        </span>

        <h1 class="mt-3 text-[28px] font-bold leading-tight">Nuevo reporte</h1>

        <p class="mt-2 text-[15px] leading-[1.6] text-white/85">
          Creá un reporte claro y útil para ayudar a visibilizar lo que pasa en tu zona.
        </p>
      </div>

      <div class="mt-4">
        <div
          class="mb-2 flex items-center justify-between text-sm text-white/85"
        >
          <span>Progreso</span>
          <span>{{ completedSteps }}/4 pasos</span>
        </div>

        <div class="h-2 overflow-hidden rounded-full bg-white/20">
          <div
            class="h-full rounded-full bg-white transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>

        <p class="mt-3 text-sm text-white/85">
          Completá los pasos para enviar un reporte claro y validable.
        </p>
      </div>
    </header>

    <form @submit.prevent="handleSubmit" class="mt-5 space-y-4">
      <!-- PASO 1 -->
      <section
        :class="[
          'rounded-[24px] bg-[#E0E5EC] p-4 shadow-[0_10px_24px_rgba(148,163,184,0.18)] transition-all',
          showOnboarding && onboardingStep === 1 ? 'ring-2 ring-[#3082e3]' : '',
        ]"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#3082e3]"
          >
            Paso 1
          </span>
          <span class="text-sm font-medium text-slate-500">
            Ubicación precisa
          </span>
        </div>

        <label class="mt-3 block text-[18px] font-bold text-slate-900">
          Elegí el lugar del problema
        </label>

        <p class="mt-1 text-sm leading-6 text-slate-500">
          Marcá el punto exacto para que otras personas puedan ubicarlo rápido.
        </p>

        <div class="mt-4">
          <MapSearchPicker
            v-model="coords"
            height="230px"
            @resolved-address="ubicacion = $event"
          />
        </div>

        <div
          v-if="coords"
          class="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600"
        >
          Punto confirmado:
          {{ coords.lat?.toFixed(5) }}, {{ coords.lng?.toFixed(5) }}
        </div>
      </section>

      <!-- PASO 2 -->
      <section
        :class="[
          'rounded-[24px] bg-[#E0E5EC] p-4 shadow-[0_10px_24px_rgba(148,163,184,0.18)] transition-all',
          showOnboarding && onboardingStep === 2 ? 'ring-2 ring-[#3082e3]' : '',
        ]"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#3082e3]"
          >
            Paso 2
          </span>
          <span class="text-sm font-medium text-slate-500">
            Tipo de problema
          </span>
        </div>

        <label class="mt-3 block text-[18px] font-bold text-slate-900">
          Elegí una categoría
        </label>

        <p class="mt-1 text-sm leading-6 text-slate-500">
          Esto ayuda a ordenar el reclamo y detectar si ya existe uno parecido.
        </p>

        <select
          v-model="categoria"
          class="mt-4 w-full rounded-2xl border-0 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.16)] focus:outline-none focus:ring-2 focus:ring-[#3082e3]/25"
        >
          <option disabled value="">Elegí una categoría</option>
          <option>Iluminación</option>
          <option>Infraestructura</option>
          <option>Seguridad</option>
        </select>

        <div class="mt-4 flex justify-end">
          <button
            type="button"
            @click="findSimilarReports"
            :disabled="!canSearchSimilar"
            class="text-sm font-medium underline underline-offset-2 transition"
            :class="
              canSearchSimilar
                ? 'text-[#3082e3] hover:text-[#085baf]'
                : 'cursor-not-allowed text-slate-400'
            "
          >
            Ver si ya hay reclamos en esta zona
          </button>
        </div>

        <p v-if="buscandoSimilares" class="mt-3 text-sm text-slate-500">
          Buscando reportes similares...
        </p>

        <p
          v-if="errorSimilares"
          class="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600"
        >
          {{ errorSimilares }}
        </p>
      </section>

      <!-- PASO 3 -->
      <section
        :class="[
          'rounded-[24px] bg-[#E0E5EC] p-4 shadow-[0_10px_24px_rgba(148,163,184,0.18)] transition-all',
          showOnboarding && onboardingStep === 3 ? 'ring-2 ring-[#3082e3]' : '',
        ]"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#3082e3]"
          >
            Paso 3
          </span>
          <span class="text-sm font-medium text-slate-500">
            Qué está pasando
          </span>
        </div>

        <label class="mt-3 block text-[18px] font-bold text-slate-900">
          Describí el problema
        </label>

        <p class="mt-1 text-sm leading-6 text-slate-500">
          Contalo claro y breve. No hace falta escribir mucho.
        </p>

        <textarea
          v-model="descripcion"
          :disabled="hasSimilarReports"
          class="mt-4 min-h-[110px] w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.16)] focus:outline-none focus:ring-2 focus:ring-[#3082e3]/25 disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="Ejemplo: la calle está muy oscura y no se ve bien al caminar de noche."
        ></textarea>

        <p
          v-if="hasSimilarReports"
          class="mt-3 rounded-2xl bg-yellow-50 px-4 py-3 text-sm leading-normal text-yellow-700"
        >
          Encontramos reportes similares en esta zona. Sumate a uno existente en lugar de crear uno nuevo.
        </p>
      </section>

      <!-- PASO 4 -->
      <section
        :class="[
          'rounded-[24px] bg-[#E0E5EC] p-4 shadow-[0_10px_24px_rgba(148,163,184,0.18)] transition-all',
          showOnboarding && onboardingStep === 4 ? 'ring-2 ring-[#3082e3]' : '',
        ]"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="rounded-full bg-[#fff1ed] px-3 py-1 text-[11px] font-semibold text-[#f2826d]"
          >
            Paso 4
          </span>
          <span class="text-sm font-medium text-slate-500">
            Evidencia visual
          </span>
        </div>

        <label class="mt-3 block text-[18px] font-bold text-slate-900">
          Subí una foto del lugar
        </label>

        <p class="mt-1 text-sm leading-6 text-slate-500">
          La imagen es obligatoria porque ayuda a validar mejor el reporte.
        </p>

        <div class="mt-4 flex flex-col items-center">
          <label
            for="imageUpload"
            class="cursor-pointer rounded-2xl bg-[#3082e3] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#085baf] active:scale-95"
          >
            Incluir imagen
          </label>

          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
          />

          <p v-if="selectedFileName" class="mt-3 text-sm text-slate-600">
            {{ selectedFileName }}
          </p>
        </div>
      </section>

      <!-- ERROR -->
      <div
        v-if="errorMessage"
        class="rounded-2xl bg-[#fff1ed] px-4 py-3 text-sm font-medium text-[#e67661]"
      >
        {{ errorMessage }}
      </div>

      <!-- CTA -->
      <div class="space-y-3 pt-1">
        <button
          type="submit"
          :disabled="hasSimilarReports"
          class="w-full rounded-2xl bg-[#3082e3] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#085baf] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Enviar reporte
        </button>

        <p class="text-center text-sm text-slate-500">
          Cuando completes el reporte, vas a estar aportando una señal clara y útil para la comunidad.
        </p>
      </div>
    </form>

    <!-- ONBOARDING -->
    <div
      v-if="showOnboarding"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-[2px]"
    >
      <div
        class="relative w-full max-w-sm overflow-hidden rounded-[30px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]"
      >
        <div class="h-24 bg-gradient-to-br from-[#3082e3] to-[#5aa0f0]"></div>

        <button
          type="button"
          @click="skipOnboarding"
          class="absolute right-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-white"
        >
          Saltar
        </button>

        <div class="-mt-10 px-5 pb-5">
          <div
            class="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-white text-[#3082e3] shadow-[0_12px_24px_rgba(48,130,227,0.18)]"
          >
            <component :is="onboardingContent.icon" class="h-10 w-10" />
          </div>

          <div class="mt-4 text-left">
            <span
              class="inline-flex rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#3082e3]"
            >
              {{ onboardingContent.eyebrow }}
            </span>

            <h2 class="mt-3 text-[22px] font-bold leading-tight text-slate-900">
              {{ onboardingContent.title }}
            </h2>

            <p class="mt-2 text-[15px] leading-[1.6] text-slate-500">
              {{ onboardingContent.text }}
            </p>
          </div>

          <div class="mt-5 flex justify-center gap-1.5">
            <span
              v-for="i in 4"
              :key="i"
              class="h-2.5 rounded-full transition-all duration-300"
              :class="
                i === onboardingStep
                  ? 'w-6 bg-[#3082e3]'
                  : 'w-2.5 bg-slate-300'
              "
            />
          </div>

          <button
            type="button"
            @click="nextOnboarding"
            class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3082e3] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#085baf] active:scale-[0.98]"
          >
            {{ onboardingContent.button }}
            <ArrowRightIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL POPUP: similares -->
    <div
      v-if="showSimilarHintModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="relative w-11/12 max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <button
          @click="showSimilarHintModal = false"
          class="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>

        <div class="mb-3 flex items-center gap-2">
          <ExclamationTriangleIcon class="h-6 w-6 text-[#3082e3]" />
          <p class="text-base font-semibold text-gray-800">
            Evitá duplicar reclamos
          </p>
        </div>

        <p class="mb-4 text-sm leading-snug text-gray-700">
          Encontramos reportes similares en esta zona. Podés sumarte a uno existente para darle más fuerza y prioridad.
        </p>

        <div class="space-y-2">
          <button
            type="button"
            @click="
              showSimilarHintModal = false;
              showBottomSheet = true;
            "
            class="w-full rounded-lg bg-[#3082e3] py-2.5 font-medium text-white transition hover:bg-[#085baf] active:scale-[.98]"
          >
            Ver reportes similares
          </button>

          <button
            type="button"
            @click="showSimilarHintModal = false"
            class="w-full rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 hover:bg-gray-200 active:scale-[.98]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL ÉXITO SUMARSE -->
    <div
      v-if="showSuccessSheet"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div
        class="relative flex w-11/12 max-w-sm flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-xl"
      >
        <button
          @click="showSuccessSheet = false"
          class="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>

        <div
          class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
        >
          <CheckCircleIcon class="h-8 w-8 text-green-600" />
        </div>

        <h2 class="text-center text-lg font-semibold text-gray-800">
          ¡Te sumaste al reclamo!
        </h2>

        <p class="mb-2 text-center text-sm leading-relaxed text-gray-700">
          Gracias por contribuir a la seguridad de tu zona. Tu apoyo se registró correctamente.
        </p>

        <div class="mt-1 w-full space-y-3">
          <button
            @click="router.push('/')"
            class="w-full rounded-lg bg-[#3082e3] py-2.5 font-medium text-white transition hover:bg-[#085baf] active:scale-[.98]"
          >
            Ir al inicio
          </button>

          <button
            type="button"
            @click="startNewReport"
            class="w-full rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 hover:bg-gray-200 active:scale-[.98]"
          >
            Hacer un nuevo reporte
          </button>
        </div>
      </div>
    </div>

    <!-- OVERLAY -->
    <div
      v-if="showBottomSheet"
      class="fixed inset-0 z-40 bg-black/40"
      @click="showBottomSheet = false"
    ></div>

    <!-- BOTTOM SHEET -->
    <div
      v-if="showBottomSheet"
      class="fixed bottom-0 left-0 z-50 w-full rounded-t-2xl bg-white p-4 pb-8 shadow-xl animate-slide-up"
    >
      <div class="mb-2 flex justify-center">
        <div class="h-1.5 w-12 rounded-full bg-gray-300"></div>
      </div>

      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800">Reportes similares</h2>

        <button @click="showBottomSheet = false" class="text-gray-500">
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <p class="mb-3 text-sm leading-normal text-gray-700">
        Ya existen reportes parecidos en esta zona. Podés sumarte a uno de ellos para darle más fuerza al reclamo.
      </p>

      <ul class="max-h-64 space-y-3 overflow-y-auto">
        <li
          v-for="r in similares"
          :key="r.id"
          class="rounded-lg border bg-gray-50 p-3 shadow-sm"
        >
          <p class="font-medium text-gray-800">{{ r.categoria }}</p>
          <p class="text-sm text-gray-700">{{ r.ubicacion }}</p>
          <p class="mt-1 text-xs text-gray-500">
            Apoyos:
            <span class="font-semibold">{{ r.apoyos ?? 0 }}</span>
            — {{ new Date(r.created_at).toLocaleDateString() }}
          </p>

          <button
            @click="joinExistingReport(r)"
            class="mt-2 w-full rounded-lg bg-[#3082e3] py-1.5 text-sm text-white hover:bg-[#085baf] active:scale-[.98]"
          >
            Sumarme a este reporte
          </button>
        </li>
      </ul>

      <p class="mt-3 text-center text-sm text-gray-500">
        Si ninguno coincide exactamente, podés cerrar esta ventana y completar un reporte nuevo.
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
