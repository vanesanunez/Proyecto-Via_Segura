<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useRouteSharing } from "../composables/useRouteSharing";
import { useSharedPathViewer } from "../composables/useSharedPathViewer";

const route = useRoute();
const router = useRouter();

// Lado "estoy compartiendo mi recorrido"
const { isActive, isSharing, destination: myDestination, startedAt: myStartedAt, activeAlert } = useRouteSharing();

// Lado "estoy siguiendo el recorrido de alguien"
const {
  isFollowing,
  sharerId,
  pathId,
  sharerName,
  startedAt: followStartedAt,
  endedMessage,
} = useSharedPathViewer();

const isAuthPage = computed(() => ["/ingresar", "/crear-cuenta"].includes(route.path));

const onOwnRoutePage = computed(() => route.path === "/compartir");
const onFollowPage = computed(
  () => route.path.startsWith("/ver-recorrido/") && route.query.sharer_id === sharerId.value
);

const showOwnRouteBar = computed(() => isActive.value && !onOwnRoutePage.value && !isAuthPage.value);
const showFollowBar = computed(() => isFollowing.value && !onFollowPage.value && !isAuthPage.value);
const showEndedToast = computed(() => !!endedMessage.value && !isAuthPage.value);

function elapsedLabel(ts) {
  if (!ts) return "";
  const mins = Math.floor((Date.now() - ts) / 60000);
  return mins < 1 ? "Recién iniciado" : `${mins} min en curso`;
}

const ownElapsed = computed(() => elapsedLabel(myStartedAt.value));
const followElapsed = computed(() => elapsedLabel(followStartedAt.value));

// Si las dos barras coinciden en pantalla, la de "siguiendo" se apila arriba de la propia
const followBarBottom = computed(() => (showOwnRouteBar.value ? 118 : 60));
const followAlertBottom = computed(() => followBarBottom.value + 62);
const ownAlertBottom = computed(() => 122);

function goToOwnRoute() {
  router.push("/compartir");
}

function goToFollowedRoute() {
  router.push({ path: `/ver-recorrido/${pathId.value}`, query: { sharer_id: sharerId.value } });
}
</script>

<template>
  <!-- Toast: alerta de proximidad en MI recorrido -->
  <transition name="fade-alert">
    <div
      v-if="showOwnRouteBar && activeAlert"
      class="fixed left-3 right-3 z-50 rounded-2xl bg-white px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.18)] border border-[#f8dfd9]"
      :style="{ bottom: ownAlertBottom + 'px' }"
    >
      <div class="flex items-start gap-3">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-[#f2826d]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.007M4.62 19.5h14.76c1.42 0 2.31-1.53 1.61-2.77L13.62 4.66c-.71-1.26-2.53-1.26-3.24 0L3.01 16.73c-.7 1.24.19 2.77 1.61 2.77z" />
          </svg>
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold text-[#2a2a2a]">
            {{ activeAlert.report.categoria }} a {{ activeAlert.distance }}m
          </p>
          <p class="text-xs text-slate-500 mt-0.5 truncate">
            {{ activeAlert.report.ubicacion }}
          </p>
        </div>
      </div>
    </div>
  </transition>

  <!-- Toast: el recorrido que seguía finalizó -->
  <transition name="fade-alert">
    <div
      v-if="showEndedToast"
      class="fixed left-3 right-3 z-50 rounded-2xl bg-white px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.18)] border border-[#d6e8fb]"
      style="bottom: 60px;"
    >
      <div class="flex items-center gap-3">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" />
          </svg>
        </span>
        <p class="text-sm font-medium text-slate-700">{{ endedMessage }}</p>
      </div>
    </div>
  </transition>

  <!-- Barra: sigo el recorrido de un contacto -->
  <transition name="slide-up-bar">
    <button
      v-if="showFollowBar"
      @click="goToFollowedRoute"
      class="fixed left-3 right-3 z-40 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-[#2a2a2a] shadow-[0_12px_28px_rgba(15,23,42,0.18)] border border-[#d6e8fb] active:scale-[0.98] transition"
      :style="{ bottom: followBarBottom + 'px' }"
    >
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </span>
      <span class="min-w-0 flex-1 text-left">
        <span class="block text-[13px] font-bold leading-tight truncate">
          Siguiendo a {{ sharerName }}
        </span>
        <span class="block text-[11px] text-slate-500 truncate">
          {{ followElapsed }}
        </span>
      </span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </transition>

  <!-- Barra: comparto mi propio recorrido -->
  <transition name="slide-up-bar">
    <button
      v-if="showOwnRouteBar"
      @click="goToOwnRoute"
      class="fixed left-3 right-3 z-40 flex items-center gap-3 rounded-2xl bg-[#3082e3] px-4 py-3 text-white shadow-[0_12px_28px_rgba(48,130,227,0.35)] active:scale-[0.98] transition"
      style="bottom: 60px;"
    >
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </span>
      <span class="min-w-0 flex-1 text-left">
        <span class="block text-[13px] font-bold leading-tight truncate">
          Recorrido en curso{{ isSharing ? " · Compartiendo" : "" }}
        </span>
        <span class="block text-[11px] text-white/80 truncate">
          {{ myDestination?.address || "Destino" }} · {{ ownElapsed }}
        </span>
      </span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </transition>
</template>

<style scoped>
.slide-up-bar-enter-active, .slide-up-bar-leave-active { transition: all 0.25s ease; }
.slide-up-bar-enter-from, .slide-up-bar-leave-to { opacity: 0; transform: translateY(20px); }
.fade-alert-enter-active, .fade-alert-leave-active { transition: all 0.25s ease; }
.fade-alert-enter-from, .fade-alert-leave-to { opacity: 0; transform: translateY(10px); }
</style>