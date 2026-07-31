<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useRouteSharing } from "../composables/useRouteSharing";

const route = useRoute();
const router = useRouter();

const { isActive, isSharing, destination, startedAt, activeAlert } = useRouteSharing();

const visible = computed(
  () => isActive.value && route.path !== "/compartir" && !["/ingresar", "/crear-cuenta"].includes(route.path)
);

const elapsedLabel = computed(() => {
  if (!startedAt.value) return "";
  const mins = Math.floor((Date.now() - startedAt.value) / 60000);
  return mins < 1 ? "Recién iniciado" : `${mins} min en curso`;
});

function goToRoute() {
  router.push("/compartir");
}
</script>

<template>
  <!-- Toast de alerta próxima -->
  <transition name="fade-alert">
    <div
      v-if="visible && activeAlert"
      class="fixed left-3 right-3 z-50 rounded-2xl bg-white px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.18)] border border-[#f8dfd9]"
      style="bottom: 122px;"
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

  <!-- Barra persistente tipo Uber -->
  <transition name="slide-up-bar">
    <button
      v-if="visible"
      @click="goToRoute"
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
          {{ destination?.address || "Destino" }} · {{ elapsedLabel }}
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