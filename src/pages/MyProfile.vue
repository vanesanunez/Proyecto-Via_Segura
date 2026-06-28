```vue
<script>
import { RouterLink } from 'vue-router';
import { subscribeToUserState } from '../services/auth';
import MainLoader from '../components/MainLoader.vue';
import { fetchUserReportsPageWithCount } from '../services/reports';
import { fetchUserGamification } from '../services/gamification';
import ReportCard from '../components/ReportCard.vue';
import BottomNavigation from '../components/BottomNavigation.vue';
import { TrophyIcon } from '@heroicons/vue/24/solid';

let unsubAuth = () => {};

export default {
  name: 'MyProfile',
  components: { MainLoader, ReportCard, BottomNavigation, TrophyIcon },
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
      myError: '',

      gamification: {
        community_points: 0,
        community_actions: 0,
        reports_created: 0,
        supports_given: 0,
        first_badge_unlocked: false,
      },
      gamificationLoading: false,
      gamificationError: '',
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
      const n = [this.user.name, this.user.lastname].filter(Boolean).join(' ');
      return n || this.user.email?.split('@')[0] || 'Usuario';
    },
    iniciales() {
      const n = this.user.name?.[0] || '';
      const l = this.user.lastname?.[0] || '';
      return (n + l).toUpperCase() || 'U';
    },
    progressSteps() {
      return Math.min(this.gamification.community_actions ?? 0, 4);
    },
    progressPercent() {
      return `${(this.progressSteps / 4) * 100}%`;
    },
    progressLabel() {
      if (this.gamification.first_badge_unlocked) {
        return 'Primera insignia desbloqueada';
      }
      return `${this.progressSteps}/4 acciones`;
    },
    progressText() {
      if (this.gamification.first_badge_unlocked) {
        return 'Ya desbloqueaste tu primera insignia comunitaria.';
      }

      if (this.progressSteps === 1) {
        return 'Primer aporte completado.';
      }

      if (this.progressSteps === 0) {
        return 'Todavía no registrás aportes.';
      }

      return 'Seguís avanzando con cada aporte útil.';
    },
    badgeText() {
      return this.gamification.first_badge_unlocked
        ? 'Desbloqueada'
        : 'En progreso';
    },
  },
  methods: {
    async loadMyReports() {
      if (!this.user?.id) return;
      this.myLoading = true;
      this.myError = '';
      try {
        const { data, count } = await fetchUserReportsPageWithCount({
          userId: this.user.id,
          page: this.myPage,
          pageSize: this.myPageSize,
        });
        this.myReports = data;
        this.myTotal = count;
      } catch (e) {
        this.myError = 'No se pudieron cargar tus reportes.';
      } finally {
        this.myLoading = false;
      }
    },

    async loadGamification() {
      if (!this.user?.id) return;

      this.gamificationLoading = true;
      this.gamificationError = '';

      try {
        const data = await fetchUserGamification(this.user.id);
        this.gamification = data;
      } catch (e) {
        console.error('[MyProfile] Error cargando gamificación:', e);
        this.gamificationError = 'No se pudo cargar tu progreso.';
      } finally {
        this.gamificationLoading = false;
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
      }
    });
  },
  unmounted() {
    unsubAuth();
  },
};
</script>

<template>
  <div class="flex flex-col min-h-full bg-gray-50 font-['Inter'] pb-24" style="color:#2a2a2a;">

    <div v-if="!loading">

      <!-- ── HERO CARD ── -->
      <div class="px-4 pt-5 pb-4">
        <div class="rounded-2xl overflow-hidden" style="background: linear-gradient(135deg, #3082e3 0%, #1a5fbf 100%);">

          <!-- Foto + nombre -->
          <div class="px-5 pt-6 pb-5 flex items-center gap-4">
            <div class="w-20 h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center shrink-0"
              style="border-color:rgba(255,255,255,0.3); background:rgba(255,255,255,0.15);">
              <img v-if="user.photoURL" :src="user.photoURL" alt="Foto de perfil" class="w-full h-full object-cover" />
              <span v-else class="text-2xl font-bold text-white">{{ iniciales }}</span>
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-lg font-bold text-white leading-tight truncate">{{ nombreCompleto }}</p>
              <p class="text-xs mt-0.5 truncate" style="color:rgba(255,255,255,0.7);">{{ user.email }}</p>
              <RouterLink
                to="/mi-perfil/editar"
                class="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                style="background:rgba(255,255,255,0.2); color:#fff;"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Editar perfil
              </RouterLink>
            </div>
          </div>

          <!-- Stats strip -->
          <div class="grid grid-cols-3 border-t" style="border-color:rgba(255,255,255,0.15);">
            <div class="py-3.5 flex flex-col items-center gap-0.5 border-r" style="border-color:rgba(255,255,255,0.15);">
              <span class="text-xl font-bold text-white">{{ myTotal }}</span>
              <span class="text-xs" style="color:rgba(255,255,255,0.7);">Mis reportes</span>
            </div>
            <div class="py-3.5 flex flex-col items-center gap-0.5 border-r" style="border-color:rgba(255,255,255,0.15);">
              <span class="text-xl font-bold" style="color:#86efac;">
                {{ myReports.filter(r => ['resuelto','Resuelto'].includes(r.estado)).length }}
              </span>
              <span class="text-xs" style="color:rgba(255,255,255,0.7);">Resueltos</span>
            </div>
            <div class="py-3.5 flex flex-col items-center gap-0.5">
              <span class="text-xl font-bold" style="color:#fca5a5;">
                {{ myReports.filter(r => !['resuelto','Resuelto'].includes(r.estado)).length }}
              </span>
              <span class="text-xs" style="color:rgba(255,255,255,0.7);">Pendientes</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── DATOS PERSONALES ── -->
      <div class="px-4 pb-4">
        <p class="text-xs font-semibold uppercase tracking-wider mb-3" style="color:#9ca3af;">Datos personales</p>

        <div class="rounded-2xl border border-gray-100 overflow-hidden bg-white">

          <!-- Email -->
          <div class="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style="background:#eff6ff;">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#3082e3" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs mb-0.5" style="color:#9ca3af;">Correo electrónico</p>
              <p class="text-sm font-medium truncate">{{ user.email || '—' }}</p>
            </div>
          </div>

          <!-- Nombre -->
          <div class="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style="background:#eff6ff;">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#3082e3" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs mb-0.5" style="color:#9ca3af;">Nombre</p>
              <p class="text-sm font-medium">{{ user.name || '—' }}</p>
            </div>
          </div>

          <!-- Apellido -->
          <div class="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style="background:#eff6ff;">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#3082e3" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs mb-0.5" style="color:#9ca3af;">Apellido</p>
              <p class="text-sm font-medium">{{ user.lastname || '—' }}</p>
            </div>
          </div>

          <!-- DNI -->
          <div class="flex items-center gap-3 px-4 py-3.5">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style="background:#eff6ff;">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#3082e3" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c0 1.306.835 2.417 2 2.83"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs mb-0.5" style="color:#9ca3af;">DNI</p>
              <p class="text-sm font-medium">{{ user.dni || '—' }}</p>
            </div>
          </div>

        </div>
      </div>

      <!-- ── IMPACTO EN LA COMUNIDAD ── -->
      <div class="px-4 pb-4">
        <p class="text-xs font-semibold uppercase tracking-wider mb-3" style="color:#9ca3af;">
          Impacto en la comunidad
        </p>

        <div class="rounded-2xl border border-gray-100 bg-white p-4">
          <div
            v-if="gamificationError"
            class="rounded-xl px-4 py-3 text-sm"
            style="background:#fff1ed; color:#e67661;"
          >
            {{ gamificationError }}
          </div>

          <div v-else>
            <!-- puntos -->
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style="background:#fff1ed; color:#f2826d;"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.002 6.002 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-lg font-bold text-slate-900">
                  {{ gamificationLoading ? '...' : `${gamification.community_points ?? 0} puntos` }}
                </p>
                <p class="mt-0.5 text-sm text-slate-500">
                  Tu participación suma valor a la comunidad.
                </p>
              </div>
            </div>

            <!-- barra -->
            <div class="mt-5">
              <div class="mb-2 flex items-center justify-between text-sm">
                <span class="font-medium text-slate-700">Progreso</span>
                <span class="text-slate-500">
                  {{ gamificationLoading ? '...' : progressLabel }}
                </span>
              </div>

              <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full rounded-full bg-[#3082e3] transition-all duration-500"
                  :style="{ width: gamificationLoading ? '0%' : progressPercent }"
                ></div>
              </div>

              <p class="mt-2 text-sm text-slate-500">
                {{ gamificationLoading ? 'Cargando progreso...' : progressText }}
              </p>
            </div>

            <!-- stats -->
            <div class="grid grid-cols-2 gap-3 mt-5">
              <div class="rounded-2xl px-4 py-3" style="background:#eef4ff;">
                <p class="text-xs" style="color:#6b7280;">Reportes creados</p>
                <p class="mt-1 text-lg font-bold text-slate-900">
                  {{ gamificationLoading ? '...' : gamification.reports_created ?? 0 }}
                </p>
              </div>

              <div class="rounded-2xl px-4 py-3" style="background:#fff7ed;">
                <p class="text-xs" style="color:#6b7280;">Apoyos dados</p>
                <p class="mt-1 text-lg font-bold text-slate-900">
                  {{ gamificationLoading ? '...' : gamification.supports_given ?? 0 }}
                </p>
              </div>
            </div>

            <!-- insignia -->
            <div
              class="mt-4 rounded-2xl px-4 py-3 flex items-center justify-between"
              :style="
                gamification.first_badge_unlocked
                  ? 'background:#ecfdf5;'
                  : 'background:#f8fafc;'
              "
            >
              <div>
                <p class="text-sm font-semibold text-slate-900">
                  Primera insignia
                </p>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ badgeText }}
                </p>
              </div>

              <div
                class="w-10 h-10 rounded-full flex items-center justify-center"
                :style="
                  gamification.first_badge_unlocked
                    ? 'background:#dcfce7; color:#16a34a;'
                    : 'background:#e5e7eb; color:#6b7280;'
                "
              >
                <TrophyIcon class="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── MIS REPORTES ── -->
      <div class="px-4 pb-6">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-semibold uppercase tracking-wider" style="color:#9ca3af;">Mis reportes</p>
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full" style="background:#eff6ff; color:#3082e3;">
            {{ myTotal }}
          </span>
        </div>

        <!-- Error -->
        <div v-if="myError" class="rounded-xl px-4 py-3 text-sm mb-3" style="background:#fff1f0; color:#dc2626;">
          {{ myError }}
        </div>

        <!-- Cargando -->
        <div v-if="myLoading" class="flex justify-center py-10">
          <div class="w-8 h-8 rounded-full border-2 animate-spin" style="border-color:#3082e3; border-top-color:transparent;"></div>
        </div>

        <!-- Sin reportes -->
        <div v-else-if="!myLoading && myReports.length === 0"
          class="rounded-2xl border border-gray-100 bg-white flex flex-col items-center py-10 px-6 text-center gap-3">
          <div class="w-12 h-12 rounded-full flex items-center justify-center" style="background:#f3f4f6;">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p class="text-sm font-medium">Todavía no creaste reportes</p>
          <p class="text-xs" style="color:#9ca3af;">Cuando lo hagas aparecerán aquí</p>
        </div>

        <!-- Lista -->
        <ul v-else class="space-y-3 mb-5">
          <ReportCard v-for="r in myReports" :key="r.id" :report="r" :to="`/report/${r.id}`" />
        </ul>

        <!-- Paginación -->
        <nav v-if="myTotal > myPageSize" class="flex items-center justify-center gap-2 mt-4">
          <button
            @click="goToMy(myPage - 1)"
            :disabled="myPage === 1"
            class="w-9 h-9 rounded-xl border flex items-center justify-center text-sm transition-colors"
            :style="myPage === 1
              ? 'border-color:#e5e7eb; color:#d1d5db;'
              : 'border-color:#3082e3; color:#3082e3;'"
          >
            ‹
          </button>

          <button
            v-for="p in visibleMyPages"
            :key="p"
            @click="goToMy(p)"
            class="w-9 h-9 rounded-xl border text-sm font-semibold transition-colors"
            :style="p === myPage
              ? 'background:#3082e3; color:#fff; border-color:#3082e3;'
              : 'border-color:#e5e7eb; color:#6b7280;'"
          >
            {{ p }}
          </button>

          <button
            @click="goToMy(myPage + 1)"
            :disabled="myPage === totalPages"
            class="w-9 h-9 rounded-xl border flex items-center justify-center text-sm transition-colors"
            :style="myPage === totalPages
              ? 'border-color:#e5e7eb; color:#d1d5db;'
              : 'border-color:#3082e3; color:#3082e3;'"
          >
            ›
          </button>
        </nav>
      </div>

    </div>

    <!-- Cargando perfil -->
    <div v-else class="flex-1 flex justify-center items-center">
      <MainLoader />
    </div>

  </div>

  <BottomNavigation />
</template>

