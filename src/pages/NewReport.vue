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
import {
  rewardUserForReport,
  rewardUserForSupport,
} from "../services/gamification";
import MapSearchPicker from "../components/MapSearchPicker.vue";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  LightBulbIcon,
} from "@heroicons/vue/24/solid";
import BottomNavigation from "../components/BottomNavigation.vue";

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
  imagen.value ? imagen.value.name : "",
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
const user = ref({
  id: null,
  email: null,
});

const isSubmitting = ref(false);

function onboardingStorageKey(userId) {
  return `vs_newreport_onboarding_seen_${userId}`;
}

subscribeToUserState((newUserData) => {
  user.value = newUserData || {
    id: null,
    email: null,
  };

  if (!user.value.id) {
    showOnboarding.value = false;
    return;
  }

  const storageKey = onboardingStorageKey(user.value.id);

  const onboardingWasSeen =
    localStorage.getItem(storageKey) === "1";

  showOnboarding.value = !onboardingWasSeen;
  onboardingStep.value = 1;
});

function finishOnboarding() {
  showOnboarding.value = false;

  if (!user.value.id) return;

  const storageKey = onboardingStorageKey(user.value.id);

  localStorage.setItem(storageKey, "1");
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
// --- Contenido del onboarding ---
const onboardingContent = computed(() => {
  if (onboardingStep.value === 1) {
    return {
      image: "/onboarding-reporte/ubicacion.png",
      imageAlt: "Ubicación precisa para crear un reporte",
      eyebrow: "Paso 1",
      title: "Marcá bien el lugar",
      text: "Ubicá el problema con precisión.",
      helper: "Tu aporte ayuda a la comunidad",
      button: "Siguiente",
      tone: "blue",
    };
  }

  if (onboardingStep.value === 2) {
    return {
      image: "/onboarding-reporte/categoria.png",
      imageAlt: "Selección del tipo de problema",
      eyebrow: "Paso 2",
      title: "Elegí la categoría",
      text: "Indicá el tipo de problema.",
      helper: "Así evitás reclamos duplicados",
      button: "Siguiente",
      tone: "coral",
    };
  }

  if (onboardingStep.value === 3) {
    return {
      image: "/onboarding-reporte/descripcion.png",
      imageAlt: "Descripción clara del problema",
      eyebrow: "Paso 3",
      title: "Contá qué pasó",
      text: "Describilo claro y breve.",
      helper: "La información útil mejora la respuesta",
      button: "Siguiente",
      tone: "blue",
    };
  }

  return {
    image: "/onboarding-reporte/foto.png",
    imageAlt: "Subida de una fotografía para validar el reporte",
    eyebrow: "Paso 4",
    title: "Subí una foto",
    text: "Ayuda a validar el reporte.",
    helper: "La foto es obligatoria",
    button: "Empezar",
    tone: "coral",
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
  if (!user.value.id) {
    errorSimilares.value = "Tenés que iniciar sesión para sumarte al reclamo.";
    return;
  }

  try {
    errorSimilares.value = "";

    const result = await joinReport(reporte.id, user.value.id);

    const item = similares.value.find((r) => r.id === reporte.id);
    if (item && typeof result.apoyos === "number") {
      item.apoyos = result.apoyos;
    }

    showBottomSheet.value = false;

    if (result.status === "already_supported") {
      errorSimilares.value = "Ya te habías sumado a este reclamo.";
      return;
    }

    try {
      await rewardUserForSupport(user.value.id);
    } catch (rewardError) {
      console.error(
        "[joinExistingReport] El apoyo se registró, pero no se pudo actualizar la gamificación:",
        rewardError,
      );
    }

    showSuccessSheet.value = true;
  } catch (e) {
    console.error("[joinExistingReport]", e);

    if (e.code === "already_supported") {
      errorSimilares.value = "Ya te habías sumado a este reclamo.";
      return;
    }

    errorSimilares.value = "No se pudo sumar al reclamo.";
  }
}

async function handleSubmit() {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;
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

    try {
      await rewardUserForReport(user.value.id);
    } catch (rewardError) {
      console.error(
        "[handleSubmit] El reporte se guardó, pero no se pudo actualizar la gamificación:",
        rewardError,
      );
    }

    router.push("/report/confirmado");
  } catch (error) {
    console.error("[handleSubmit]", error);
    errorMessage.value = "No se pudo enviar el reporte. Intentalo de nuevo.";
  } finally {
    isSubmitting.value = false;
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
  <div class="min-h-screen bg-[#f7f9f6] pb-28">
    <div class="mx-auto max-w-xl px-4 pt-5">
      <!-- Header / progreso -->
      <header class="rounded-[28px] bg-[#3082e3] px-5 py-5 text-white shadow-[0_12px_28px_rgba(48,130,227,0.24)]">
        <div class="min-w-0">
          <span class="inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold">
            Reporte guiado
          </span>

          <h1 class="mt-3 text-[28px] font-bold leading-tight">
            Nuevo reporte
          </h1>

          <p class="mt-2 text-[15px] leading-[1.6] text-white/85">
            Creá un reporte claro y útil para ayudar a visibilizar lo que pasa
            en tu zona.
          </p>
        </div>

        <div class="mt-4">
          <div class="mb-2 flex items-center justify-between text-sm text-white/85">
            <span>Progreso</span>
            <span>{{ completedSteps }}/4 pasos</span>
          </div>

          <div class="h-2 overflow-hidden rounded-full bg-white/20">
            <div class="h-full rounded-full bg-white transition-all duration-300"
              :style="{ width: `${progressPercent}%` }"></div>
          </div>

          <p class="mt-3 text-sm text-white/85">
            Completá los pasos para enviar un reporte claro y validable.
          </p>
        </div>
      </header>

      <form @submit.prevent="handleSubmit" class="mt-5 space-y-4">
        <!-- PASO 1 -->
        <section :class="[
          'rounded-3xl border border-[#e4ebf4] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-all',
          showOnboarding && onboardingStep === 1
            ? 'ring-2 ring-[#3082e3]'
            : '',
        ]">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#3082e3]">
              Paso 1
            </span>
            <span class="text-sm font-medium text-slate-500">
              Ubicación precisa
            </span>
          </div>

          <h2 class="mt-3 block text-[18px] font-bold text-slate-900">
            Elegí el lugar del problema
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            Marcá el punto exacto para que otras personas puedan ubicarlo
            rápido.
          </p>

          <div class="mt-4">
            <MapSearchPicker v-model="coords" height="230px" @resolved-address="ubicacion = $event" />
          </div>

          <div v-if="coords" class="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600">
            Punto confirmado:
            {{ coords.lat?.toFixed(5) }}, {{ coords.lng?.toFixed(5) }}
          </div>
        </section>

        <!-- PASO 2 -->
        <section :class="[
          'rounded-3xl border border-[#e4ebf4] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-all',
          showOnboarding && onboardingStep === 2
            ? 'ring-2 ring-[#3082e3]'
            : '',
        ]">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#3082e3]">
              Paso 2
            </span>
            <span class="text-sm font-medium text-slate-500">
              Tipo de problema
            </span>
          </div>

          <h2 class="mt-3 block text-[18px] font-bold text-slate-900">
            Elegí una categoría
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            Esto ayuda a ordenar el reclamo y detectar si ya existe uno
            parecido.
          </p>

          <select v-model="categoria"
            class="mt-4 w-full rounded-2xl border border-[#d6e8fb] bg-[#f9fbfd] px-4 py-3 text-sm text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-[#3082e3]/25">
            <option disabled value="">Elegí una categoría</option>
            <option>Iluminación</option>
            <option>Infraestructura</option>
            <option>Seguridad</option>
          </select>

          <div class="mt-4 flex justify-end">
            <button type="button" @click="findSimilarReports" :disabled="!canSearchSimilar"
              class="text-sm font-medium underline underline-offset-2 transition" :class="canSearchSimilar
                  ? 'text-[#3082e3] hover:text-[#085baf]'
                  : 'cursor-not-allowed text-slate-400'
                ">
              Ver si ya hay reclamos en esta zona
            </button>
          </div>

          <p v-if="buscandoSimilares" class="mt-3 text-sm text-slate-500">
            Buscando reportes similares...
          </p>

          <p v-if="errorSimilares" class="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600">
            {{ errorSimilares }}
          </p>
        </section>

        <!-- PASO 3 -->
        <section :class="[
          'rounded-3xl border border-[#e4ebf4] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-all',
          showOnboarding && onboardingStep === 3
            ? 'ring-2 ring-[#3082e3]'
            : '',
        ]">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#3082e3]">
              Paso 3
            </span>
            <span class="text-sm font-medium text-slate-500">
              Qué está pasando
            </span>
          </div>

          <h2 class="mt-3 block text-[18px] font-bold text-slate-900">
            Describí el problema
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            Contalo claro y breve. No hace falta escribir mucho.
          </p>

          <textarea v-model="descripcion" :disabled="hasSimilarReports"
            class="mt-4 min-h-[110px] w-full rounded-2xl border border-[#d6e8fb] bg-[#f9fbfd] px-4 py-3 text-sm text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-[#3082e3]/25 disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="Ejemplo: la calle está muy oscura y no se ve bien al caminar de noche."></textarea>

          <p v-if="hasSimilarReports"
            class="mt-3 rounded-2xl bg-yellow-50 px-4 py-3 text-sm leading-normal text-yellow-700">
            Encontramos reportes similares en esta zona. Sumate a uno existente
            en lugar de crear uno nuevo.
          </p>
        </section>

        <!-- PASO 4 -->
        <section :class="[
          'rounded-3xl border border-[#e4ebf4] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-all',
          showOnboarding && onboardingStep === 4
            ? 'ring-2 ring-[#3082e3]'
            : '',
        ]">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="rounded-full bg-[#fff1ed] px-3 py-1 text-[11px] font-semibold text-[#f2826d]">
              Paso 4
            </span>
            <span class="text-sm font-medium text-slate-500">
              Evidencia visual
            </span>
          </div>

          <h2 class="mt-3 block text-[18px] font-bold text-slate-900">
            Subí una foto del lugar
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            La imagen es obligatoria porque ayuda a validar mejor el reporte.
          </p>

          <div class="mt-4 flex flex-col items-center">
            <label for="imageUpload"
              class="cursor-pointer rounded-2xl bg-[#3082e3] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#085baf] active:scale-95">
              Incluir imagen
            </label>

            <input id="imageUpload" type="file" accept="image/*" class="hidden" @change="onFileChange" />

            <p v-if="selectedFileName" class="mt-3 text-sm text-slate-600">
              {{ selectedFileName }}
            </p>
          </div>
        </section>

        <!-- ERROR -->
        <div v-if="errorMessage" class="rounded-2xl bg-[#fff1ed] px-4 py-3 text-sm font-medium text-[#e67661]">
          {{ errorMessage }}
        </div>

        <!-- CTA -->
        <div class="space-y-3 pt-1">
          <button type="submit" :disabled="hasSimilarReports || isSubmitting"
            class="w-full rounded-2xl bg-[#3082e3] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#085baf] disabled:cursor-not-allowed disabled:bg-gray-300">
            {{ isSubmitting ? "Enviando..." : "Enviar reporte" }}
          </button>
        </div>
      </form>

      <!-- ONBOARDING -->
      <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
        <div v-if="showOnboarding"
          class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]">
          <div
            class="relative w-full max-w-sm overflow-hidden rounded-[30px] bg-white px-5 pb-6 pt-5 shadow-[0_22px_48px_rgba(15,23,42,0.20)]">
            <div class="flex items-center justify-between gap-3">
              <div
                class="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-[14px] font-semibold text-[#3082e3]">
                <LightBulbIcon class="h-5 w-5" />
                <span>Consejos para crear tu reporte</span>
              </div>

              <button type="button" @click="skipOnboarding"
                class="text-[15px] font-medium text-slate-400 transition hover:text-slate-600">
                Saltar
              </button>
            </div>

            <!-- Ilustración del paso -->
            <div class="mx-auto mt-5 flex h-[220px] w-full max-w-[310px] items-center justify-center overflow-hidden">
              <img :src="onboardingContent.image" :alt="onboardingContent.imageAlt"
                class="h-full w-full scale-[2.2] object-contain object-center" />
            </div>

            <div class="mt-3 text-left">
              <h2 class="text-[22px] font-bold leading-tight text-slate-900">
                {{ onboardingContent.title }}
              </h2>

              <p class="mt-3 text-[16px] leading-[1.65] text-slate-600">
                {{ onboardingContent.text }}
              </p>

              <div
                class="mt-5 inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-3 text-[15px] font-medium text-[#3082e3]">
                <span class="text-[#f2826d] text-lg">❤</span>
                <span>{{ onboardingContent.helper }}</span>
              </div>
            </div>

            <div class="mt-6 flex items-center justify-between gap-4">
              <div class="flex items-center gap-2">
                <span v-for="i in 4" :key="i" class="rounded-full transition-all duration-300" :class="i === onboardingStep
                    ? 'h-3 w-3 bg-[#3082e3]'
                    : 'h-3 w-3 bg-slate-300'
                  "></span>
              </div>

              <button type="button" @click="nextOnboarding"
                class="inline-flex items-center gap-2 rounded-2xl bg-[#3082e3] px-6 py-3 text-[16px] font-semibold text-white shadow-[0_10px_22px_rgba(48,130,227,0.28)] transition hover:bg-[#236fcd] active:scale-[0.98]">
                {{ onboardingContent.button }}
                <ArrowRightIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- MODAL POPUP: similares -->
      <div v-if="showSimilarHintModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="relative w-11/12 max-w-sm rounded-2xl bg-white p-5 shadow-xl">
          <button @click="showSimilarHintModal = false"
            class="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
            <XMarkIcon class="h-5 w-5" />
          </button>

          <div class="mb-3 flex items-center gap-2">
            <ExclamationTriangleIcon class="h-6 w-6 text-[#3082e3]" />
            <p class="text-base font-semibold text-gray-800">
              Evitá duplicar reclamos
            </p>
          </div>

          <p class="mb-4 text-sm leading-snug text-gray-700">
            Encontramos reportes similares en esta zona. Podés sumarte a uno
            existente para darle más fuerza y prioridad.
          </p>

          <div class="space-y-2">
            <button type="button" @click="
              showSimilarHintModal = false;
            showBottomSheet = true;
            "
              class="w-full rounded-lg bg-[#3082e3] py-2.5 font-medium text-white transition hover:bg-[#085baf] active:scale-[.98]">
              Ver reportes similares
            </button>

            <button type="button" @click="showSimilarHintModal = false"
              class="w-full rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 hover:bg-gray-200 active:scale-[.98]">
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL ÉXITO SUMARSE -->
      <div v-if="showSuccessSheet" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="relative flex w-11/12 max-w-sm flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-xl">
          <button @click="showSuccessSheet = false" class="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
            <XMarkIcon class="h-5 w-5" />
          </button>

          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircleIcon class="h-8 w-8 text-green-600" />
          </div>

          <h2 class="text-center text-lg font-semibold text-gray-800">
            ¡Te sumaste al reclamo!
          </h2>

          <p class="mb-2 text-center text-sm leading-relaxed text-gray-700">
            Gracias por contribuir a la seguridad de tu zona. Tu apoyo se
            registró correctamente.
          </p>

          <div class="mt-1 w-full space-y-3">
            <button @click="router.push('/')"
              class="w-full rounded-lg bg-[#3082e3] py-2.5 font-medium text-white transition hover:bg-[#085baf] active:scale-[.98]">
              Ir al inicio
            </button>

            <button type="button" @click="startNewReport"
              class="w-full rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 hover:bg-gray-200 active:scale-[.98]">
              Hacer un nuevo reporte
            </button>
          </div>
        </div>
      </div>

      <!-- OVERLAY -->
      <div v-if="showBottomSheet" class="fixed inset-0 z-40 bg-black/40" @click="showBottomSheet = false"></div>

      <!-- BOTTOM SHEET -->
      <div v-if="showBottomSheet"
        class="fixed bottom-0 left-0 z-50 w-full rounded-t-2xl bg-white p-4 pb-8 shadow-xl animate-slide-up">
        <div class="mb-2 flex justify-center">
          <div class="h-1.5 w-12 rounded-full bg-gray-300"></div>
        </div>

        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-800">
            Reportes similares
          </h2>

          <button @click="showBottomSheet = false" class="text-gray-500">
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <p class="mb-3 text-sm leading-normal text-gray-700">
          Ya existen reportes parecidos en esta zona. Podés sumarte a uno de
          ellos para darle más fuerza al reclamo.
        </p>

        <ul class="max-h-64 space-y-3 overflow-y-auto">
          <li v-for="r in similares" :key="r.id" class="rounded-lg border bg-gray-50 p-3 shadow-sm">
            <p class="font-medium text-gray-800">{{ r.categoria }}</p>
            <p class="text-sm text-gray-700">{{ r.ubicacion }}</p>
            <p class="mt-1 text-xs text-gray-500">
              Apoyos:
              <span class="font-semibold">{{ r.apoyos ?? 0 }}</span>
              — {{ new Date(r.created_at).toLocaleDateString() }}
            </p>

            <button @click="joinExistingReport(r)"
              class="mt-2 w-full rounded-lg bg-[#3082e3] py-1.5 text-sm text-white hover:bg-[#085baf] active:scale-[.98]">
              Sumarme a este reporte
            </button>
          </li>
        </ul>

        <p class="mt-3 text-center text-sm text-gray-500">
          Si ninguno coincide exactamente, podés cerrar esta ventana y completar
          un reporte nuevo.
        </p>
      </div>
    </div>
  </div>

  <BottomNavigation />
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
