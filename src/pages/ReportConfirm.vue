<script setup>
import { onMounted, ref, computed, watch } from "vue";
import confetti from "canvas-confetti";
import { subscribeToUserState } from "../services/auth";
import { fetchUserGamification } from "../services/gamification";

const user = ref({ id: null, email: null });

const gamification = ref({
  community_points: 0,
  community_actions: 0,
  reports_created: 0,
  supports_given: 0,
  first_badge_unlocked: false,
});

const loadingGamification = ref(true);

subscribeToUserState((newUserData) => {
  user.value = newUserData;
});

async function loadGamification() {
  if (!user.value?.id) {
    loadingGamification.value = false;
    return;
  }

  loadingGamification.value = true;

  try {
    const data = await fetchUserGamification(user.value.id);
    gamification.value = data;
  } catch (error) {
    console.error("[ReportConfirmado] Error cargando gamificación:", error);
  } finally {
    loadingGamification.value = false;
  }
}

const progressSteps = computed(() =>
  Math.min(gamification.value.community_actions ?? 0, 4),
);

const progressPercent = computed(() => `${(progressSteps.value / 4) * 100}%`);

const progressLabel = computed(() => {
  if (gamification.value.first_badge_unlocked) {
    return "Primera insignia desbloqueada";
  }

  return `${progressSteps.value}/4 acciones`;
});

const progressText = computed(() => {
  if (gamification.value.first_badge_unlocked) {
    return "Ya desbloqueaste tu primera insignia comunitaria.";
  }

  if (progressSteps.value === 1) {
    return "Primer aporte completado.";
  }

  return "Seguís avanzando con cada aporte útil.";
});

onMounted(() => {
  confetti({
    particleCount: 55,
    spread: 65,
    startVelocity: 24,
    scalar: 0.9,
    origin: { y: 0.7 },
  });

  loadGamification();
});

watch(
  () => user.value?.id,
  (id) => {
    if (id) loadGamification();
  },
);
</script>

<template>
  <section class="min-h-screen bg-white px-4 pt-8 pb-24">
    <div class="mx-auto w-full max-w-[390px]">
      <div
        class="rounded-[30px] bg-[#eef4ff] p-6 text-center shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
      >
        <div
          class="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-white text-[#3082e3] shadow-[0_14px_28px_rgba(48,130,227,0.18)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="h-10 w-10"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        <span
          class="mt-5 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#3082e3]"
        >
          Reporte enviado
        </span>

        <h1 class="mt-4 text-[28px] font-bold leading-tight text-slate-900">
          ¡Gracias por tu aporte!
        </h1>

        <p class="mt-3 text-[15px] leading-[1.7] text-slate-600">
          Tu reporte ya quedó registrado.
        </p>

        <div
          class="mt-5 rounded-[22px] bg-white px-4 py-4 text-left shadow-[0_10px_24px_rgba(148,163,184,0.10)]"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-[#f2826d]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                class="h-5 w-5"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.002 6.002 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-[18px] font-bold text-slate-900">+12 puntos</p>
              <p class="mt-1 text-sm leading-6 text-slate-500">
                Total acumulado:
                <span class="font-semibold text-slate-700">
                  {{
                    loadingGamification
                      ? "..."
                      : gamification.community_points ?? 0
                  }}
                  puntos
                </span>
              </p>
            </div>
          </div>
        </div>

        <div class="mt-5 text-left">
          <div class="mb-2 flex items-center justify-between text-sm">
            <span class="font-medium text-slate-700">Primer paso</span>
            <span class="text-slate-500">
              {{ loadingGamification ? "..." : progressLabel }}
            </span>
          </div>

          <div class="h-2 overflow-hidden rounded-full bg-white/80">
            <div
              class="h-full rounded-full bg-[#3082e3] transition-all duration-500"
              :style="{ width: loadingGamification ? '0%' : progressPercent }"
            ></div>
          </div>

          <p class="mt-2 text-sm text-slate-500">
            {{ loadingGamification ? "Cargando progreso..." : progressText }}
          </p>
        </div>

        <div class="mt-6 space-y-3">
          <router-link
            to="/reportes"
            class="flex w-full items-center justify-center rounded-2xl bg-[#3082e3] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#085baf] active:scale-[0.98]"
          >
            Ver reportes de la comunidad
          </router-link>

          <router-link
            to="/report/nuevo"
            class="flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.14)] transition hover:text-[#3082e3] active:scale-[0.98]"
          >
            Hacer otro reporte
          </router-link>

          <router-link
            to="/"
            class="flex w-full items-center justify-center text-sm font-medium text-slate-500 transition hover:text-[#3082e3]"
          >
            Volver al inicio
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>