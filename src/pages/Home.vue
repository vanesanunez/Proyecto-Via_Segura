<script>
import AppH1 from "../components/AppH1.vue";
import ActionCard from "../components/ActionCard.vue";
import BottomNavigation from "../components/BottomNavigation.vue";
import EmergencyButton from "../components/EmergencyButton.vue";

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
} from "@heroicons/vue/24/solid";

export default {
  name: "Home",
  components: {
    AppH1,
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
    subscribeToUserState(async (newUserState) => {
      this.user = newUserState || { id: null, email: null, name: null };

      if (this.user?.id) {
        await this.loadGamification();
      }
    });

    this.loadRecentReports();
  },
};
</script>

<template>
  <AppH1 class="hidden">Inicio - Vía Segura</AppH1>

  <section class="min-h-screen bg-[#f7f9f6] pt-12 pb-28">
    <main class="mx-auto w-full max-w-[390px] px-4">
      <!-- saludo -->
      <div class="mb-5">
        <h2 class="text-[18px] font-bold leading-tight text-[#2a2a2a]">
          Hola, {{ greetingName }} 👋
        </h2>
        <p class="mt-1 max-w-[18rem] text-sm leading-6 text-slate-500">
          Tu comunidad te ayuda a moverte con más tranquilidad.
        </p>
      </div>

      <!-- hero -->
      <section
  class="overflow-hidden rounded-[26px] border border-[#d6e8fb] bg-[#eef4ff] px-4 py-4 shadow-[0_10px_24px_rgba(148,163,184,0.10)]"
     >
  <div class="grid grid-cols-[1fr_1.15fr] items-center gap-3">
    <!-- texto -->
    <div class="pr-1">
      <h3 class="text-[20px] font-bold leading-tight text-[#1f2b5b]">
        ¿Ves un problema en tu zona?
      </h3>

      <p class="mt-3 text-[15px] leading-6 text-slate-600">
        Reportalo y ayudá a otras personas.
      </p>

      <router-link
        to="/report/nuevo"
        class="mt-4 inline-flex items-center justify-center rounded-full bg-[#3082e3] px-5 py-3 text-sm font-semibold text-white whitespace-nowrap transition hover:bg-[#085baf] active:scale-[0.98]"
      >
        Hacer un reporte
      </router-link>
    </div>

    <!-- ilustración -->
    <div class="relative h-[170px]">
      <div class="absolute inset-0 rounded-[22px] bg-white/25"></div>

      <!-- nubes -->
      <div class="absolute top-4 left-8 h-3 w-8 rounded-full bg-white/70"></div>
      <div class="absolute top-8 left-2 h-2.5 w-5 rounded-full bg-white/60"></div>
      <div class="absolute top-2 right-7 h-3 w-9 rounded-full bg-white/70"></div>

      <!-- edificios -->
      <div class="absolute bottom-8 left-5 flex items-end gap-1">
        <div class="h-10 w-4 rounded-t bg-[#dbe8ff]"></div>
        <div class="h-14 w-5 rounded-t bg-[#bfd5ff]"></div>
        <div class="h-11 w-4 rounded-t bg-[#dbe8ff]"></div>
        <div class="h-16 w-6 rounded-t bg-[#9fc2fb]"></div>
        <div class="h-12 w-4 rounded-t bg-[#cfe0ff]"></div>
        <div class="h-9 w-4 rounded-t bg-[#bfd5ff]"></div>
      </div>

      <!-- casita -->
      <div class="absolute bottom-8 right-8">
        <div class="relative">
          <div class="h-9 w-8 rounded-t bg-[#dbe8ff]"></div>
          <div
            class="absolute -top-2 left-0 h-0 w-0 border-l-[16px] border-r-[16px] border-b-[12px] border-l-transparent border-r-transparent border-b-[#bfd5ff]"
          ></div>
        </div>
      </div>

      <!-- árboles -->
      <div class="absolute bottom-8 left-[102px]">
        <div class="h-7 w-7 rounded-full bg-[#31b285]"></div>
        <div class="mx-auto h-3 w-1 bg-slate-500"></div>
      </div>

      <div class="absolute bottom-8 right-2">
        <div class="h-8 w-8 rounded-full bg-[#31b285]"></div>
        <div class="mx-auto h-3 w-1 bg-slate-500"></div>
      </div>

      <!-- piso / mapa -->
      <div
        class="absolute bottom-0 left-0 right-0 h-20 rounded-t-[26px] bg-[#f5f3ef]"
      ></div>

      <svg
        class="absolute bottom-0 left-0 right-0 h-20 w-full"
        viewBox="0 0 190 80"
        fill="none"
      >
        <path
          d="M0 72 C30 48, 55 78, 86 52 C112 30, 145 74, 190 40"
          stroke="#d9d9d9"
          stroke-width="6"
        />
        <path
          d="M88 60 C103 49, 118 38, 137 22"
          stroke="#3082e3"
          stroke-width="4"
          stroke-linecap="round"
          stroke-dasharray="8 8"
        />
      </svg>

      <!-- pin -->
      <div class="absolute bottom-[48px] left-[88px]">
        <div class="relative">
          <div class="h-12 w-12 rounded-full bg-[#f2826d]"></div>
          <div
            class="absolute left-1/2 top-[28px] h-5 w-5 -translate-x-1/2 rotate-45 bg-[#f2826d]"
          ></div>
          <div
            class="absolute left-1/2 top-[9px] h-4 w-4 -translate-x-1/2 rounded-full bg-white"
          ></div>
        </div>
      </div>
    </div>
  </div>
</section>
       

      <!-- acciones rápidas -->
      <section class="mt-6">
        <h3 class="text-[16px] font-bold text-[#2a2a2a]">Acciones rápidas</h3>

        <div class="mt-3 grid grid-cols-2 gap-3">
          <ActionCard
            title="Ver reportes"
            description="Explorá lo que pasa en tu comunidad."
            to="/reportes"
            accent="blue"
          >
            <template #icon>
              <EyeIcon class="h-6 w-6 text-[#3082e3]" />
            </template>
          </ActionCard>

          <ActionCard
            title="Contactos de confianza"
            description="Personas en quienes podés confiar."
            to="/contactos"
            accent="coral"
          >
            <template #icon>
              <UsersIcon class="h-6 w-6 text-[#f2826d]" />
            </template>
          </ActionCard>

          <ActionCard
            title="Recorrido seguro"
            description="Planificá tu ruta y viajá más tranquila."
            to="/compartir"
            accent="green"
          >
            <template #icon>
              <MapIcon class="h-6 w-6 text-[#20b486]" />
            </template>
          </ActionCard>

          <ActionCard
            title="Chat comunitario"
            description="Conversá y ayudá a tu comunidad."
            to="/chat"
            accent="blue-soft"
          >
            <template #icon>
              <ChatBubbleLeftRightIcon class="h-6 w-6 text-[#3082e3]" />
            </template>
          </ActionCard>

          <ActionCard
            title="Info útil"
            description="Consejos y recursos para moverte mejor."
            to="/info"
            accent="yellow"
          >
            <template #icon>
              <InformationCircleIcon class="h-6 w-6 text-[#f2b321]" />
            </template>
          </ActionCard>

          <ActionCard
            title="Puntos seguros"
            description="Lugares de ayuda cerca tuyo."
            to="/puntos-seguros"
            accent="blue-soft"
          >
            <template #icon>
              <ShieldCheckIcon class="h-6 w-6 text-[#3082e3]" />
            </template>
          </ActionCard>
        </div>
      </section>

      <!-- tu impacto -->
      <section
        class="mt-5 rounded-[24px] border border-[#d6e8fb] bg-[#eef4ff] px-4 py-4 shadow-[0_10px_24px_rgba(148,163,184,0.08)]"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-[#3082e3]"
            >
              <div
                class="absolute inset-1 rounded-full border border-dashed border-[#c7daf7]"
              ></div>
              <HeartIcon class="h-7 w-7" />
            </div>

            <div>
              <p class="text-sm font-bold text-[#2a2a2a]">Tu impacto</p>
              <div class="flex items-end gap-2">
                <span class="text-[34px] font-extrabold leading-none text-[#3082e3]">
                  {{ gamification.community_points ?? 0 }}
                </span>
                <span class="pb-1 text-sm font-semibold text-[#2a2a2a]">puntos</span>
              </div>
            </div>
          </div>

          <!-- mini edificio -->
          <div class="relative h-[55px] w-[68px] shrink-0">
            <HeartIcon class="absolute -top-1 right-1 h-6 w-6 text-[#f2826d]" />
            <div class="absolute bottom-0 left-1 h-6 w-3 rounded-t bg-[#cfe0ff]"></div>
            <div class="absolute bottom-0 left-5 h-9 w-4 rounded-t bg-[#9fc2fb]"></div>
            <div class="absolute bottom-0 left-10 h-7 w-3 rounded-t bg-[#bfd5ff]"></div>
            <div class="absolute bottom-0 right-1 h-5 w-2 rounded-t bg-[#dbe8ff]"></div>
            <div class="absolute bottom-0 right-0">
              <div class="h-5 w-5 rounded-full bg-[#3eb489]"></div>
              <div class="mx-auto h-2 w-0.5 bg-slate-500"></div>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3">
          <div class="flex-1">
            <div class="mb-1 flex items-center justify-between">
              <span class="text-sm font-semibold text-[#2a2a2a]">
                {{ progressSteps }}/4 acciones
              </span>
            </div>

            <div class="h-2.5 overflow-hidden rounded-full bg-white/80">
              <div
                class="h-full rounded-full bg-[#3082e3] transition-all duration-500"
                :style="{ width: progressPercent }"
              ></div>
            </div>

            <p class="mt-2 text-xs text-slate-600">
              {{ badgeLabel }}
            </p>
          </div>
        </div>
      </section>

      <!-- emergencia -->
      <div class="mt-5">
        <EmergencyButton />
      </div>

      <!-- reportes recientes -->
      <section class="mt-6">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-[16px] font-bold text-[#2a2a2a]">Reportes recientes</h3>
          <router-link
            to="/reportes"
            class="text-sm font-semibold text-[#3082e3] hover:text-[#085baf]"
          >
            Ver todos
          </router-link>
        </div>

        <div v-if="reportsLoading" class="grid grid-cols-2 gap-3">
          <div
            v-for="n in 2"
            :key="n"
            class="h-[150px] animate-pulse rounded-[20px] bg-white border border-slate-100"
          ></div>
        </div>

        <div v-else class="grid grid-cols-2 gap-3">
          <article
            v-for="report in recentReports"
            :key="report.id"
            class="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-[0_8px_20px_rgba(148,163,184,0.08)]"
          >
            <img
              :src="safeImage(report)"
              alt="Imagen del reporte"
              class="h-[96px] w-full object-cover"
            />

            <div class="p-3">
              <h4 class="line-clamp-2 text-[14px] font-bold leading-5 text-[#2a2a2a]">
                {{ report.descripcion }}
              </h4>

              <div class="mt-2 flex flex-wrap gap-1.5">
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  :class="categoryPillClasses(report.categoria)"
                >
                  {{ report.categoria }}
                </span>

                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  :class="statusPillClasses(report.estado)"
                >
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