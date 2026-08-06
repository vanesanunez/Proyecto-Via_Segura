<script>
import { RouterLink } from "vue-router";
import { subscribeToUserState } from "../services/auth";
import MainLoader from "../components/MainLoader.vue";
import { fetchUserReportsPageWithCount } from "../services/reports";
import { fetchUserGamification } from "../services/gamification";
import { getTrustedContacts } from "../services/contacts";
import ReportCard from "../components/ReportCard.vue";
import BottomNavigation from "../components/BottomNavigation.vue";
import {
  UserGroupIcon,
  StarIcon,
  DocumentTextIcon,
  TrophyIcon,
  HeartIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  GiftIcon,
} from "@heroicons/vue/24/solid";

let unsubAuth = () => { };

export default {
  name: "MyProfile",
  components: {
    MainLoader,
    ReportCard,
    BottomNavigation,
    UserGroupIcon,
    StarIcon,
    DocumentTextIcon,
    TrophyIcon,
    SparklesIcon,
    ShieldCheckIcon,
    CheckBadgeIcon,
    GiftIcon,
  },
  data() {
    return {
      user: {
        id: null,
        email: null,
        name: null,
        lastname: null,
        dni: null,
        photoURL: null,
      },
      loading: false,

      myReports: [],
      myPage: 1,
      myPageSize: 3,
      myTotal: 0,
      myLoading: false,
      myError: "",

      gamification: {
        community_points: 0,
        available_points: 0,
        community_actions: 0,
        reports_created: 0,
        supports_given: 0,
        first_badge_unlocked: false,
      },
      gamificationLoading: false,
      gamificationError: "",

      trustedContacts: [],
      trustedContactsLoading: false,
      trustedContactsError: "",

      showBadgeCelebration: false,
      badgeAnimationTimer: null,
    };
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.myTotal / this.myPageSize));
    },
    visibleMyPages() {
      if (this.totalPages <= 3) {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
      }

      if (this.myPage <= 2) return [1, 2, 3];

      if (this.myPage >= this.totalPages - 1) {
        return [this.totalPages - 2, this.totalPages - 1, this.totalPages];
      }

      return [this.myPage - 1, this.myPage, this.myPage + 1];
    },
    nombreCompleto() {
      const n = [this.user.name, this.user.lastname].filter(Boolean).join(" ");
      return n || this.user.email?.split("@")[0] || "Usuario";
    },
    iniciales() {
      const n = this.user.name?.[0] || "";
      const l = this.user.lastname?.[0] || "";
      return (n + l).toUpperCase() || "U";
    },

    totalActions() {
      return this.gamification.community_actions ?? 0;
    },
    totalPoints() {
      return this.gamification.community_points ?? 0;
    },
    totalReportsCreated() {
      return this.gamification.reports_created ?? 0;
    },
    totalSupportsGiven() {
      return this.gamification.supports_given ?? 0;
    },

    currentBadge() {
      return this.getBadgeMeta(this.totalActions);
    },

    progressCurrent() {
      if (this.currentBadge.nextTarget === null) return this.currentBadge.range;
      return this.totalActions - this.currentBadge.base;
    },
    progressRange() {
      return this.currentBadge.range;
    },
    progressPercent() {
      if (this.currentBadge.nextTarget === null) return "100%";
      return `${Math.min(100, (this.progressCurrent / this.progressRange) * 100)}%`;
    },
    progressLabel() {
      if (this.currentBadge.nextTarget === null) {
        return "Nivel máximo";
      }
      return `${this.totalActions}/${this.currentBadge.nextTarget} acciones`;
    },
    progressText() {
      if (this.currentBadge.nextTarget === null) {
        return "Ya alcanzaste el nivel más alto de participación.";
      }

      const faltan = this.currentBadge.nextTarget - this.totalActions;
      return `Te faltan ${faltan} acci${faltan === 1 ? "ón" : "ones"} para ${this.currentBadge.nextTitle}.`;
    },
  },
  methods: {
    getBadgeMeta(actions) {
      if (actions >= 20) {
        return {
          level: 4,
          title: "Referente barrial",
          subtitle: "Tu participación ya inspira a la comunidad.",
          icon: CheckBadgeIcon,
          iconWrap: "bg-emerald-100 text-emerald-600",
          base: 20,
          nextTarget: null,
          nextTitle: null,
          range: 1,
        };
      }

      if (actions >= 12) {
        return {
          level: 3,
          title: "Cuidadora urbana",
          subtitle: "Ya tenés un impacto fuerte en tu zona.",
          icon: ShieldCheckIcon,
          iconWrap: "bg-cyan-100 text-cyan-600",
          base: 12,
          nextTarget: 20,
          nextTitle: "Referente barrial",
          range: 8,
        };
      }

      if (actions >= 8) {
        return {
          level: 2,
          title: "Colaboradora",
          subtitle: "Seguís sumando aportes valiosos.",
          icon: SparklesIcon,
          iconWrap: "bg-violet-100 text-violet-600",
          base: 8,
          nextTarget: 12,
          nextTitle: "Cuidadora urbana",
          range: 4,
        };
      }

      if (actions >= 4) {
        return {
          level: 1,
          title: "Primera insignia desbloqueada",
          subtitle: "¡Vas por muy buen camino!",
          icon: TrophyIcon,
          iconWrap: "bg-amber-100 text-amber-600",
          base: 4,
          nextTarget: 8,
          nextTitle: "Colaboradora",
          range: 4,
        };
      }

      return {
        level: 0,
        title: "Primera insignia en progreso",
        subtitle: "Te falta poco para desbloquearla.",
        icon: StarIcon,
        iconWrap: "bg-blue-100 text-[#3082e3]",
        base: 0,
        nextTarget: 4,
        nextTitle: "tu primera insignia",
        range: 4,
      };
    },

    triggerBadgeAnimation(level) {
      if (!this.user?.id) return;

      const storageKey = `vs_badge_level_${this.user.id}`;
      const savedLevel = Number(localStorage.getItem(storageKey) ?? 0);

      if (level > savedLevel && level > 0) {
        this.showBadgeCelebration = true;

        if (this.badgeAnimationTimer) {
          clearTimeout(this.badgeAnimationTimer);
        }

        this.badgeAnimationTimer = setTimeout(() => {
          this.showBadgeCelebration = false;
        }, 2600);
      }

      localStorage.setItem(storageKey, String(level));
    },

    initialsFor(contact) {
      const n = contact.name?.[0] || "";
      const l = contact.lastname?.[0] || "";
      return (n + l).toUpperCase() || "U";
    },

    async loadMyReports() {
      if (!this.user?.id) return;
      this.myLoading = true;
      this.myError = "";
      try {
        const { data, count } = await fetchUserReportsPageWithCount({
          userId: this.user.id,
          page: this.myPage,
          pageSize: this.myPageSize,
        });
        this.myReports = data;
        this.myTotal = count;
      } catch (e) {
        this.myError = "No se pudieron cargar tus reportes.";
      } finally {
        this.myLoading = false;
      }
    },

    async loadGamification() {
      if (!this.user?.id) return;

      this.gamificationLoading = true;
      this.gamificationError = "";

      try {
        const data = await fetchUserGamification(this.user.id);
        this.gamification = data;
        this.triggerBadgeAnimation(this.currentBadge.level);
      } catch (e) {
        console.error("[MyProfile] Error cargando gamificación:", e);
        this.gamificationError = "No se pudo cargar tu progreso.";
      } finally {
        this.gamificationLoading = false;
      }
    },

    async loadTrustedContacts() {
      if (!this.user?.id) return;

      this.trustedContactsLoading = true;
      this.trustedContactsError = "";

      try {
        this.trustedContacts = await getTrustedContacts(this.user.id);
      } catch (e) {
        console.error("[MyProfile] Error cargando contactos de confianza:", e);
        this.trustedContactsError = "No se pudieron cargar tus contactos.";
      } finally {
        this.trustedContactsLoading = false;
      }
    },

    goToMy(p) {
      if (p < 1 || p > this.totalPages) return;
      this.myPage = p;
      this.loadMyReports();
    },
  },
  mounted() {
    unsubAuth = subscribeToUserState((newUserState) => {
      this.user = newUserState;
      if (this.user?.id) {
        this.myPage = 1;
        this.loadMyReports();
        this.loadGamification();
        this.loadTrustedContacts();
      }
    });
  },
  unmounted() {
    unsubAuth();
    if (this.badgeAnimationTimer) {
      clearTimeout(this.badgeAnimationTimer);
    }
  },
};
</script>

<template>
  <div class="flex flex-col min-h-full bg-gray-50 font-['Inter'] pb-24" style="color: #2a2a2a">
    <!-- HEADER -->
    <div class="mt-4 flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      <button @click="$router.push('/')"
        class="flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#2a2a2a"
          stroke-width="2.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="min-w-0">
        <h1 class="text-base font-semibold leading-tight">Mi perfil</h1>
        <p class="text-xs mt-1" style="color: #6b7280">
          Administrá tus datos personales e información de la cuenta
        </p>
      </div>
    </div>

    <div v-if="!loading">
      <!-- HERO CARD -->
      <div class="px-4 pt-5 pb-4">
        <div class="rounded-2xl overflow-hidden" style="background: linear-gradient(135deg, #3082e3 0%, #1a5fbf 100%)">
          <div class="px-5 pt-6 pb-5 flex items-center gap-4">
            <div class="w-20 h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center shrink-0" style="
                border-color: rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.15);
              ">
              <img v-if="user.photoURL" :src="user.photoURL" alt="Foto de perfil" class="w-full h-full object-cover" />
              <span v-else class="text-2xl font-bold text-white">{{
                iniciales
                }}</span>
            </div>

            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-bold text-white leading-tight truncate">
                {{ nombreCompleto }}
              </h2>
              <p class="text-xs mt-0.5 truncate" style="color: rgba(255, 255, 255, 0.7)">
                {{ user.email }}
              </p>
              <RouterLink to="/mi-perfil/editar"
                class="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                style="background: rgba(255, 255, 255, 0.2); color: #fff">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar perfil
              </RouterLink>
            </div>
          </div>

          <div class="grid grid-cols-3 border-t" style="border-color: rgba(255, 255, 255, 0.15)">
            <div class="py-3.5 flex flex-col items-center gap-0.5 border-r"
              style="border-color: rgba(255, 255, 255, 0.15)">
              <span class="text-xl font-bold text-white">{{ myTotal }}</span>
              <span class="text-xs" style="color: rgba(255, 255, 255, 0.7)">Mis reportes</span>
            </div>
            <div class="py-3.5 flex flex-col items-center gap-0.5 border-r"
              style="border-color: rgba(255, 255, 255, 0.15)">
              <span class="text-xl font-bold" style="color: #86efac">
                {{
                  myReports.filter((r) =>
                    ["resuelto", "Resuelto"].includes(r.estado),
                  ).length
                }}
              </span>
              <span class="text-xs" style="color: rgba(255, 255, 255, 0.7)">Resueltos</span>
            </div>
            <div class="py-3.5 flex flex-col items-center gap-0.5">
              <span class="text-xl font-bold" style="color: #fca5a5">
                {{
                  myReports.filter(
                    (r) => !["resuelto", "Resuelto"].includes(r.estado),
                  ).length
                }}
              </span>
              <span class="text-xs" style="color: rgba(255, 255, 255, 0.7)">Pendientes</span>
            </div>
          </div>
        </div>
      </div>

      <!-- DATOS PERSONALES -->
      <div class="px-4 pb-4">
        <h2 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: #9ca3af">
          Datos personales
        </h2>

        <div class="rounded-2xl border border-gray-100 overflow-hidden bg-white">
          <div class="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style="background: #eff6ff">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#3082e3"
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs mb-0.5" style="color: #9ca3af">
                Correo electrónico
              </p>
              <p class="text-sm font-medium truncate">
                {{ user.email || "—" }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style="background: #eff6ff">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#3082e3"
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs mb-0.5" style="color: #9ca3af">Nombre</p>
              <p class="text-sm font-medium">{{ user.name || "—" }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style="background: #eff6ff">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#3082e3"
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs mb-0.5" style="color: #9ca3af">Apellido</p>
              <p class="text-sm font-medium">{{ user.lastname || "—" }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 px-4 py-3.5">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style="background: #eff6ff">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#3082e3"
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c0 1.306.835 2.417 2 2.83" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs mb-0.5" style="color: #9ca3af">DNI</p>
              <p class="text-sm font-medium">{{ user.dni || "—" }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- CONTACTOS DE CONFIANZA -->
      <div class="px-4 pb-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider" style="color: #9ca3af">
            Contactos de confianza
          </h2>
          <RouterLink to="/contactos" class="text-xs font-semibold" style="color: #3082e3">
            {{ trustedContacts.length ? "Ver todos" : "Agregar" }}
          </RouterLink>
        </div>

        <div v-if="trustedContactsError" class="rounded-xl px-4 py-3 text-sm mb-3"
          style="background: #fff1f0; color: #dc2626">
          {{ trustedContactsError }}
        </div>

        <div v-if="trustedContactsLoading" class="flex justify-center py-6">
          <div class="w-7 h-7 rounded-full border-2 animate-spin"
            style="border-color: #3082e3; border-top-color: transparent"></div>
        </div>

        <div v-else-if="!trustedContactsLoading && trustedContacts.length === 0"
          class="rounded-2xl border border-gray-100 bg-white flex flex-col items-center py-8 px-6 text-center gap-3">
          <div class="w-11 h-11 rounded-full flex items-center justify-center" style="background: #eff6ff">
            <UserGroupIcon class="w-5 h-5" style="color: #3082e3" />
          </div>
          <p class="text-sm font-medium">Todavía no agregaste contactos</p>
          <RouterLink to="/contactos"
            class="text-xs font-semibold px-4 py-2 rounded-full transition-all active:scale-95"
            style="background: #eff6ff; color: #3082e3">
            Agregar contacto
          </RouterLink>
        </div>

        <div v-else class="rounded-2xl border border-gray-100 overflow-hidden bg-white">
          <div v-for="(c, index) in trustedContacts" :key="c.id" class="flex items-center gap-3 px-4 py-3.5" :class="{
            'border-b border-gray-50': index < trustedContacts.length - 1,
          }">
            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
              style="background: #eff6ff; color: #3082e3">
              {{ initialsFor(c) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">
                {{ c.name }} {{ c.lastname }}
              </p>
              <p class="text-xs mt-0.5" style="color: #9ca3af">
                Puede seguir tus recorridos
              </p>
            </div>
            <ShieldCheckIcon class="w-4 h-4 shrink-0" style="color: #86efac" />
          </div>
        </div>
      </div>

      <!-- IMPACTO EN LA COMUNIDAD -->
      <div class="px-4 pb-4">
        <h2 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: #9ca3af">
          Impacto en la comunidad
        </h2>

        <div
          class="rounded-[22px] border border-[#edf1f7] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(148,163,184,0.08)]">
          <div v-if="gamificationError" class="rounded-xl px-4 py-3 text-sm"
            style="background: #fff1ed; color: #e67661">
            {{ gamificationError }}
          </div>

          <div v-else>
            <!-- Título -->
           

            <!-- Aviso nueva insignia -->
            <transition name="fade-pop">
              <div v-if="showBadgeCelebration"
                class="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-semibold text-[#3082e3]">
                <SparklesIcon class="w-4 h-4" />
                Nueva insignia desbloqueada
              </div>
            </transition>

            <!-- Puntos + dibujo -->
            <div class="flex items-start justify-between gap-3 pb-4 border-b border-[#e8edf5]">
              <div class="flex items-start gap-3 min-w-0">
                <div class="w-14 h-14 rounded-full bg-[#eaf1ff] flex items-center justify-center shrink-0">
                  <StarIcon class="w-7 h-7 text-[#3b82f6]" />
                </div>

                <div class="min-w-0">
                  <p class="text-[36px] leading-none font-extrabold text-[#0f172a]">
                    {{ gamificationLoading ? "..." : totalPoints }}
                  </p>
                  <p class="text-[16px] leading-none font-bold text-[#3082e3] mt-1">
                    puntos
                  </p>
                  <p class="text-[12px] leading-5 text-slate-500 mt-2 max-w-36.25">
                    Tu participación suma valor a la comunidad.
                  </p>
                </div>
              </div>

              <!-- Ilustración del impacto -->
              <div class="h-22.5 w-26.25 shrink-0 overflow-hidden">
                <img src="/impacto-edificios.png" alt="Edificios y corazón representando el impacto en la comunidad"
                  class="h-full w-full scale-[1.65] object-contain object-center" />
              </div>
            </div>

            <!-- Progreso -->
            <div class="pt-4">
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="font-semibold text-slate-800">Progreso</span>
                <span class="font-semibold text-[#3082e3]">
                  {{ gamificationLoading ? "..." : progressLabel }}
                </span>
              </div>

              <div class="h-2.5 rounded-full bg-[#e8edf5] overflow-hidden">
                <div class="h-full rounded-full bg-[#1f7bf2] transition-all duration-500" :style="{
                  width: gamificationLoading ? '0%' : progressPercent,
                }"></div>
              </div>

              <p class="text-xs text-slate-500 mt-2">
                {{
                  gamificationLoading ? "Cargando progreso..." : progressText
                }}
              </p>
            </div>

            <!-- Mini cards -->
            <div class="grid grid-cols-2 gap-3 mt-4">
              <div class="rounded-2xl bg-[#f6f8fc] px-3 py-3 flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-[#dfeaff] flex items-center justify-center shrink-0">
                  <div class="w-8 h-8 rounded-full bg-[#1f7bf2] flex items-center justify-center">
                    <DocumentTextIcon class="w-4 h-4 text-white" />
                  </div>
                </div>

                <div>
                  <p class="text-[24px] leading-none font-bold text-[#0f172a]">
                    {{ gamificationLoading ? "..." : totalReportsCreated }}
                  </p>
                  <p class="text-[11px] leading-4 text-slate-700 mt-1">
                    Reportes<br />creados
                  </p>
                </div>
              </div>

              <div class="rounded-2xl bg-[#f6f8fc] px-3 py-3 flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-[#ffe3dd] flex items-center justify-center shrink-0">
                  <div class="w-8 h-8 rounded-full bg-[#ff7f66] flex items-center justify-center">
                    <UserGroupIcon class="w-4 h-4 text-white" />
                  </div>
                </div>

                <div>
                  <p class="text-[24px] leading-none font-bold text-[#0f172a]">
                    {{ gamificationLoading ? "..." : totalSupportsGiven }}
                  </p>
                  <p class="text-[11px] leading-4 text-slate-700 mt-1">
                    Apoyos<br />dados
                  </p>
                </div>
              </div>
            </div>

            <!-- Insignia -->
            <div class="mt-4 rounded-2xl bg-[#eef4ff] border border-[#dbe7fb] px-3 py-3 flex items-center gap-3">
              <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-500"
                :class="[
                  currentBadge.iconWrap,
                  showBadgeCelebration ? 'badge-glow badge-pop' : '',
                ]">
                <component :is="currentBadge.icon" class="w-6 h-6" />
              </div>

              <div class="min-w-0">
                <p class="text-[16px] font-bold text-[#0f172a] leading-tight">
                  {{ currentBadge.title }}
                </p>
                <p class="text-[12px] text-slate-600 mt-1">
                  {{ currentBadge.subtitle }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Beneficios canjeables -->
      <div
        class="mt-4 overflow-hidden rounded-[22px] border border-[#cfe0fb] bg-linear-to-br from-[#eef4ff] via-white to-[#f7faff] p-4 shadow-[0_8px_24px_rgba(48,130,227,0.10)]">
        <!-- Encabezado -->
        <div class="flex items-start gap-3">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#3082e3] shadow-[0_6px_14px_rgba(48,130,227,0.25)]">
            <GiftIcon class="h-6 w-6 text-white" />
          </div>

          <div class="min-w-0 flex-1">
            <h2 class="text-[16px] font-bold leading-tight text-[#0f172a]">
              Beneficios Vía Segura
            </h2>

            <p class="mt-1 text-[12px] leading-5 text-slate-500">
              Canjeá tus puntos por descuentos y actividades en espacios
              adheridos.
            </p>
          </div>
        </div>

        <!-- Saldo -->
        <div class="mt-4 flex items-center justify-between rounded-2xl border border-white bg-white/80 px-4 py-3">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Saldo disponible
            </p>

            <div class="mt-1 flex items-end gap-1.5">
              <span class="text-[30px] font-extrabold leading-none text-[#085baf]">
                {{
                  gamificationLoading
                    ? "..."
                    : (gamification.available_points ?? 0)
                }}
              </span>

              <span class="pb-0.5 text-sm font-semibold text-[#3082e3]">
                puntos
              </span>
            </div>
          </div>

          <div class="rounded-full bg-[#fff1ed] px-3 py-1.5 text-[11px] font-bold text-[#e67661]">
            Canjeables
          </div>
        </div>

        <!-- Botón -->
        <RouterLink to="/beneficios"
          class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3082E3] px-5 py-3 text-sm font-bold text-white shadow-[0_6px_14px_rgba(48,130,227,0.22)] transition hover:bg-[#085BAF] active:scale-[0.98]">
          Explorar beneficios

          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </RouterLink>
      </div>

      <!-- MIS REPORTES -->
      <div class="px-4 pb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider" style="color: #9ca3af">
            Mis reportes
          </h2>
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full" style="background: #eff6ff; color: #3082e3">
            {{ myTotal }}
          </span>
        </div>

        <div v-if="myError" class="rounded-xl px-4 py-3 text-sm mb-3" style="background: #fff1f0; color: #dc2626">
          {{ myError }}
        </div>

        <div v-if="myLoading" class="flex justify-center py-10">
          <div class="w-8 h-8 rounded-full border-2 animate-spin"
            style="border-color: #3082e3; border-top-color: transparent"></div>
        </div>

        <div v-else-if="!myLoading && myReports.length === 0"
          class="rounded-2xl border border-gray-100 bg-white flex flex-col items-center py-10 px-6 text-center gap-3">
          <div class="w-12 h-12 rounded-full flex items-center justify-center" style="background: #f3f4f6">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#9ca3af"
              stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p class="text-sm font-medium">Todavía no creaste reportes</p>
          <p class="text-xs" style="color: #9ca3af">
            Cuando lo hagas aparecerán aquí
          </p>
        </div>

        <ul v-else class="space-y-3 mb-5">
          <ReportCard v-for="r in myReports" :key="r.id" :report="r" :to="`/report/${r.id}`"
            :show-support-button="false" />
        </ul>

        <nav v-if="myTotal > myPageSize" class="flex items-center justify-center gap-2 mt-4">
          <button @click="goToMy(myPage - 1)" :disabled="myPage === 1"
            class="w-9 h-9 rounded-xl border flex items-center justify-center text-sm transition-colors" :style="myPage === 1
                ? 'border-color:#e5e7eb; color:#d1d5db;'
                : 'border-color:#3082e3; color:#3082e3;'
              ">
            ‹
          </button>

          <button v-for="p in visibleMyPages" :key="p" @click="goToMy(p)"
            class="w-9 h-9 rounded-xl border text-sm font-semibold transition-colors" :style="p === myPage
                ? 'background:#3082e3; color:#fff; border-color:#3082e3;'
                : 'border-color:#e5e7eb; color:#6b7280;'
              ">
            {{ p }}
          </button>

          <button @click="goToMy(myPage + 1)" :disabled="myPage === totalPages"
            class="w-9 h-9 rounded-xl border flex items-center justify-center text-sm transition-colors" :style="myPage === totalPages
                ? 'border-color:#e5e7eb; color:#d1d5db;'
                : 'border-color:#3082e3; color:#3082e3;'
              ">
            ›
          </button>
        </nav>
      </div>
    </div>

    <div v-else class="flex-1 flex justify-center items-center">
      <MainLoader />
    </div>
  </div>

  <BottomNavigation />
</template>

<style scoped>
@keyframes badgePop {
  0% {
    transform: scale(0.85);
  }

  50% {
    transform: scale(1.12);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes badgeGlow {
  0% {
    box-shadow: 0 0 0 rgba(59, 130, 246, 0);
  }

  50% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0.12);
  }

  100% {
    box-shadow: 0 0 0 rgba(59, 130, 246, 0);
  }
}

.badge-pop {
  animation: badgePop 0.45s ease-out;
}

.badge-glow {
  animation: badgeGlow 1.2s ease-out 2;
}

.fade-pop-enter-active,
.fade-pop-leave-active {
  transition: all 0.25s ease;
}

.fade-pop-enter-from,
.fade-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}
</style>
