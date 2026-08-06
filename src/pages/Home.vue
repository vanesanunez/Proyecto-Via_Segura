<script>
import AppH1 from "../components/AppH1.vue";
import ActionCard from "../components/ActionCard.vue";
import BottomNavigation from "../components/BottomNavigation.vue";
import EmergencyButton from "../components/EmergencyButton.vue";
import AppOnboarding from "../components/AppOnboarding.vue";

import { subscribeToUserState } from "../services/auth";
import { fetchUserGamification } from "../services/gamification";
import { fetchReportsPageWithCount } from "../services/reports";

import {
  EyeIcon,
  UsersIcon,
  MapIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  MapPinIcon,
  FaceSmileIcon,
} from "@heroicons/vue/24/solid";

export default {
  name: "Home",
  components: {
    AppH1,
    AppOnboarding,
    ActionCard,
    BottomNavigation,
    EmergencyButton,
    EyeIcon,
    UsersIcon,
    MapIcon,
    InformationCircleIcon,
    ShieldCheckIcon,
    ChatBubbleLeftRightIcon,
    HeartIcon,
    MapPinIcon,
    FaceSmileIcon,
  },
  data() {
    return {
      user: {
        id: null,
        email: null,
        name: null,
      },
      gamification: {
        community_points: 0,
        community_actions: 0,
        reports_created: 0,
        supports_given: 0,
        first_badge_unlocked: false,
      },
      recentReports: [],
      reportsLoading: false,
      showOnboarding: false,
      userStateUnsubscribe: null,
    };
  },
  computed: {
    greetingName() {
      return this.user?.name || "Tatiana";
    },
    progressSteps() {
      return Math.min(this.gamification.community_actions ?? 0, 4);
    },
    progressPercent() {
      return `${(this.progressSteps / 4) * 100}%`;
    },
    badgeLabel() {
      const actions = this.gamification.community_actions ?? 0;

      if (actions >= 20) return "Referente barrial";
      if (actions >= 12) return "Cuidadora urbana";
      if (actions >= 8) return "Colaboradora";
      if (actions >= 4) return "Primera insignia desbloqueada";
      return "Primera insignia en progreso";
    },
  },
  methods: {
    onboardingStorageKey(userId) {
      return `via_segura_onboarding_seen_${userId}`;
    },

    checkOnboarding(userId) {
      if (!userId) return;

      const storageKey = this.onboardingStorageKey(userId);
      const wasSeen = localStorage.getItem(storageKey);

      this.showOnboarding = wasSeen !== "true";
    },

    finishOnboarding() {
      if (this.user?.id) {
        const storageKey = this.onboardingStorageKey(this.user.id);

        localStorage.setItem(storageKey, "true");
      }

      this.showOnboarding = false;
    },
    async loadGamification() {
      if (!this.user?.id) return;

      try {
        const data = await fetchUserGamification(this.user.id);
        this.gamification = data;
      } catch (error) {
        console.error("[Home] Error cargando gamificación:", error);
      }
    },

    async loadRecentReports() {
      this.reportsLoading = true;

      try {
        const { data } = await fetchReportsPageWithCount({
          page: 1,
          pageSize: 2,
          mode: "recent",
        });

        this.recentReports = data ?? [];
      } catch (error) {
        console.error("[Home] Error cargando reportes recientes:", error);
        this.recentReports = [];
      } finally {
        this.reportsLoading = false;
      }
    },

    categoryPillClasses(category) {
      switch (category) {
        case "Iluminación":
          return "bg-[#fff1ed] text-[#f2826d]";
        case "Infraestructura":
          return "bg-[#eef4ff] text-[#3082e3]";
        case "Seguridad":
          return "bg-[#eefcf5] text-[#16a34a]";
        default:
          return "bg-slate-100 text-slate-600";
      }
    },

    statusPillClasses(status) {
      switch (status) {
        case "Resuelto":
          return "bg-[#eafaf0] text-[#16a34a]";
        case "En revisión":
        case "Pendiente":
          return "bg-[#eef4ff] text-[#3082e3]";
        default:
          return "bg-slate-100 text-slate-600";
      }
    },

    safeImage(report) {
      return report?.imagen || "/map.png";
    },
  },
  mounted() {
    this.userStateUnsubscribe = subscribeToUserState(async (newUserState) => {
      const previousUserId = this.user?.id;

      this.user = newUserState || {
        id: null,
        email: null,
        name: null,
      };

      if (this.user?.id) {
        await this.loadGamification();

        // Solo revisamos el onboarding cuando cambia el usuario
        // o cuando entra por primera vez.
        if (previousUserId !== this.user.id) {
          this.checkOnboarding(this.user.id);
        }
      }
    });

    this.loadRecentReports();
  },

  beforeUnmount() {
    if (typeof this.userStateUnsubscribe === "function") {
      this.userStateUnsubscribe();
    }
  },
};
</script>

<template>
  <section class="min-h-dvh bg-[#f7f9f6] pb-28 pt-12">
    <AppOnboarding v-if="showOnboarding" @finish="finishOnboarding" />
    <main class="mx-auto w-full max-w-107.5 px-3">
      <!-- saludo -->
      <div class="mb-5">
        <h1 class="text-[28px] font-bold leading-tight text-[#2a2a2a]">
          Hola, <span class="text-[#3082e3]">{{ greetingName }}</span>
        </h1>

        <p class="mt-2 max-w-[18rem] text-sm leading-6 text-slate-500">
          Tu comunidad te ayuda a moverte con más tranquilidad.
        </p>
      </div>

      <!-- hero -->
      <section
        class="relative overflow-hidden rounded-[26px] border border-[#d6e8fb] bg-[#eef4ff] px-4 py-5 shadow-[0_10px_24px_rgba(148,163,184,0.10)] min-h-52.5">
        <!-- texto -->
        <div class="relative z-10 max-w-38.75">
          <h2 class="text-[20px] font-bold leading-tight text-[#1f2b5b]">
            ¿Ves un problema en tu zona?
          </h2>

          <p class="mt-3 text-[15px] leading-6 text-slate-600">
            Reportalo y ayudá a otras personas.
          </p>

          <router-link to="/report/nuevo"
            class="mt-4 inline-flex items-center justify-center rounded-full bg-[#3082e3] px-5 py-3 text-sm font-semibold text-white whitespace-nowrap transition hover:bg-[#085baf] active:scale-[0.98]">
            Hacer un reporte
          </router-link>
        </div>

        <!-- ilustración integrada -->
        <img src="/hero-home.png" alt="Ilustración principal de Vía Segura"
          class="pointer-events-none absolute bottom-0 right-0 z-0 w-[68%] max-w-65 object-contain" />
      </section>

      <!-- acciones rápidas -->
      <section class="mt-6">
        <h2 class="text-[16px] font-bold text-[#2a2a2a]">Acciones rápidas</h2>

        <div class="mt-3 grid grid-cols-2 gap-3">
          <ActionCard title="Ver reportes" to="/reportes" accent="blue">
            <template #icon>
              <EyeIcon class="h-6 w-6 text-[#3082e3]" />
            </template>
          </ActionCard>

          <ActionCard title="Contactos de confianza" to="/contactos" accent="blue-soft">
            <template #icon>
              <UsersIcon class="h-5 w-5 text-[#3082e3]" />
            </template>

            <template #title>
              <span class="block">Contactos</span>

            </template>
          </ActionCard>

          <ActionCard title="Recorrido seguro" to="/compartir" accent="green">
            <template #icon>
              <MapIcon class="h-5 w-5 text-[#3082e3]" />
            </template>
          </ActionCard>

          <ActionCard title="Chat" to="/chat" accent="blue-soft">
            <template #icon>
              <ChatBubbleLeftRightIcon class="h-6 w-6 text-[#3082e3]" />
            </template>
          </ActionCard>

          <ActionCard title="Info útil" to="/info" accent="blue-soft">
            <template #icon>
              <InformationCircleIcon class="h-5 w-5 text-[#3082e3]" />
            </template>
          </ActionCard>

          <ActionCard title="Puntos seguros" to="/puntos-seguros" accent="blue-soft">
            <template #icon>
              <ShieldCheckIcon class="h-6 w-6 text-[#3082e3]" />
            </template>
          </ActionCard>
        </div>
      </section>

      <!-- tu impacto -->
      <section
        class="mt-5 rounded-3xl border border-[#d6e8fb] bg-[#eef4ff] px-4 py-4 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
        <!-- Puntos e ilustración -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <!-- Ícono de corazón -->
            <div
              class="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#3082e3]">
              <div class="absolute inset-1 rounded-full border border-dashed border-[#c7daf7]"></div>

              <HeartIcon class="relative h-7 w-7" />
            </div>

            <!-- Puntaje -->
            <div>
              <p class="text-sm font-bold text-[#2a2a2a]">Tu impacto</p>

              <div class="flex items-end gap-2">
                <span class="text-[34px] font-extrabold leading-none text-[#3082e3]">
                  {{ gamification.community_points ?? 0 }}
                </span>

                <span class="pb-1 text-sm font-semibold text-[#2a2a2a]">
                  puntos
                </span>
              </div>
            </div>
          </div>

          <div class="relative h-20 w-26.25 shrink-0 overflow-visible">
            <img src="/impacto-comunidad.png" alt="Ilustración del impacto en la comunidad"
              class="absolute inset-0 h-full w-full scale-[1.55] object-contain object-center" />
          </div>
        </div>

        <!-- Progreso -->
        <div class="mt-4">
          <div class="mb-1 flex items-center justify-between">
            <span class="text-sm font-semibold text-[#2a2a2a]">
              {{ progressSteps }}/4 acciones
            </span>
          </div>

          <div class="h-2.5 overflow-hidden rounded-full bg-white/80">
            <div class="h-full rounded-full bg-[#3082e3] transition-all duration-500"
              :style="{ width: progressPercent }">
            </div>
          </div>

          <p class="mt-2 text-xs text-slate-600">
            {{ badgeLabel }}
          </p>
        </div>
      </section>

      <!-- emergencia -->
      <div class="mt-5">
        <EmergencyButton />
      </div>

      <!-- reportes recientes -->
      <section class="mt-6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-[16px] font-bold text-[#2a2a2a]">
            Reportes recientes
          </h2>
          <router-link to="/reportes" class="text-sm font-semibold text-[#3082e3] hover:text-[#085baf]">
            Ver todos
          </router-link>
        </div>

        <div v-if="reportsLoading" class="grid grid-cols-2 gap-3">
          <div v-for="n in 2" :key="n" class="h-37.5 animate-pulse rounded-[20px] bg-white border border-slate-100">
          </div>
        </div>

        <div v-else class="grid grid-cols-2 gap-3">
          <article v-for="report in recentReports" :key="report.id"
            class="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-[0_8px_20px_rgba(148,163,184,0.08)]">
            <img :src="safeImage(report)" alt="Imagen del reporte" class="h-24 w-full object-cover" />

            <div class="p-3">
              <h3 class="line-clamp-2 text-[14px] font-bold leading-5 text-[#2a2a2a]">
                {{ report.descripcion }}
              </h3>

              <div class="mt-2 flex flex-wrap gap-1.5">
                <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  :class="categoryPillClasses(report.categoria)">
                  {{ report.categoria }}
                </span>

                <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  :class="statusPillClasses(report.estado)">
                  {{ report.estado || "Pendiente" }}
                </span>
              </div>

              <div class="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500">
                <MapPinIcon class="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p class="line-clamp-2">{{ report.ubicacion }}</p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>

    <BottomNavigation />
  </section>
</template>
