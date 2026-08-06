<script>
import { subscribeToUserState, updateAuthUserProfile } from '../services/auth';
import MainLoader from '../components/MainLoader.vue';
import BottomNavigation from '../components/BottomNavigation.vue';

let unsubAuth = () => { };

export default {
  name: 'MyProfileEdit',
  components: { MainLoader, BottomNavigation },
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
      profile: {
        email: null,
        name: null,
        lastname: null,
      },
      updating: false,
      fotoPreview: null,
      fotoArchivo: null,
      feedback: {
        type: 'success',
        message: null,
      },
    };
  },
  computed: {
    iniciales() {
      const n = this.user.name?.[0] || '';
      const l = this.user.lastname?.[0] || '';
      return (n + l).toUpperCase() || 'U';
    },
  },
  methods: {
    abrirSelectorFoto() {
      this.$refs.inputFoto.click();
    },
    onFotoSeleccionada(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      this.fotoArchivo = file;
      const reader = new FileReader();
      reader.onload = (ev) => { this.fotoPreview = ev.target.result; };
      reader.readAsDataURL(file);
    },
    quitarFoto() {
      this.fotoPreview = null;
      this.fotoArchivo = null;
      this.$refs.inputFoto.value = '';
    },
    async handleSubmit() {
      this.feedback.message = null;
      this.updating = true;
      try {
        await updateAuthUserProfile({
          ...this.profile,
          ...(this.fotoArchivo ? { photoFile: this.fotoArchivo } : {}),
        });
        this.feedback = {
          type: 'success',
          message: 'Tu perfil se actualizó con éxito.',
        };
        this.fotoArchivo = null;
        this.fotoPreview = null;
      } catch {
        this.feedback = {
          type: 'error',
          message: 'Ocurrió un error al actualizar el perfil.',
        };
      } finally {
        this.updating = false;
      }
    },
  },
  mounted() {
    unsubAuth = subscribeToUserState((newUserState) => {
      this.user = newUserState;
      this.profile = {
        email: this.user.email,
        name: this.user.name,
        lastname: this.user.lastname,
      };
    });
  },
  unmounted() {
    unsubAuth();
  },
};
</script>

<template>
  <div class="flex flex-col min-h-full bg-gray-50 font-['Inter'] pb-24 overflow-x-hidden" style="color:#2a2a2a;">

    <!-- ── HEADER ── -->
    <div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
      <button @click="$router.back()"
        class="flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#2a2a2a"
          stroke-width="2.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 class="text-base font-semibold leading-tight">Editar perfil</h1>
        <p class="text-xs" style="color:#6b7280;">Actualizá tus datos</p>
      </div>
    </div>

    <!-- ── FOTO DE PERFIL ── -->
    <div class="flex flex-col items-center pt-8 pb-6 px-4">

      <!-- Avatar con overlay de cambio -->
      <div class="relative mb-2">
        <div class="w-24 h-24 rounded-2xl overflow-hidden border-4 flex items-center justify-center"
          style="border-color:#eff6ff; background:#d6e8fb;">
          <img v-if="fotoPreview || user.photoURL" :src="fotoPreview || user.photoURL" alt="Foto de perfil"
            class="w-full h-full object-cover" />
          <span v-else class="text-3xl font-bold" style="color:#3082e3;">{{ iniciales }}</span>
        </div>

        <!-- Botón cámara -->
        <button type="button" @click="abrirSelectorFoto"
          class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-transform active:scale-90"
          style="background:#f2826d;" aria-label="Cambiar foto">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white"
            stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <input ref="inputFoto" type="file" accept="image/*" class="hidden" @change="onFotoSeleccionada" />
      </div>

      <!-- Texto acción -->
      <div class="flex items-center gap-3 mt-3">
        <button type="button" @click="abrirSelectorFoto" class="text-sm font-semibold" style="color:#3082e3;">
          {{ fotoPreview ? 'Cambiar foto' : 'Agregar foto' }}
        </button>
        <span v-if="fotoPreview" class="text-gray-300">|</span>
        <button v-if="fotoPreview" type="button" @click="quitarFoto" class="text-sm font-semibold"
          style="color:#f2826d;">
          Quitar
        </button>
      </div>

      <!-- Preview badge -->
      <div v-if="fotoPreview" class="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
        style="background:#fff7ed; color:#ea580c;">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Nueva foto lista para guardar
      </div>
    </div>

    <!-- ── FORMULARIO ── -->
    <form action="#" @submit.prevent="handleSubmit" class="px-4 flex flex-col gap-4">

      <!-- Feedback -->
      <transition name="fade">
        <div v-if="feedback.message" class="flex items-start gap-3 px-4 py-3 rounded-xl text-sm" :style="feedback.type === 'error'
          ? 'background:#fff1f0; color:#dc2626;'
          : 'background:#f0fdf4; color:#16a34a;'">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="2">
            <path v-if="feedback.type === 'error'" stroke-linecap="round" stroke-linejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            <path v-else stroke-linecap="round" stroke-linejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ feedback.message }}
        </div>
      </transition>

      <!-- Sección: cuenta -->
      <p class="text-xs font-semibold uppercase tracking-wider" style="color:#9ca3af;">Cuenta</p>

      <div class="rounded-2xl border border-gray-100 overflow-hidden bg-white">

        <!-- Email -->
        <div class="px-4 py-3.5 border-b border-gray-50">
          <label for="email" class="block text-xs font-semibold mb-1.5" style="color:#3082e3;">
            Correo electrónico
          </label>
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"
              stroke="#9ca3af" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input type="email" id="email" v-model="profile.email"
              class="flex-1 text-sm bg-transparent focus:outline-none" style="color:#2a2a2a;"
              placeholder="tu@email.com" />
          </div>
        </div>

      </div>

      <!-- Sección: datos personales -->
      <p class="text-xs font-semibold uppercase tracking-wider" style="color:#9ca3af;">Datos personales</p>

      <div class="rounded-2xl border border-gray-100 overflow-hidden bg-white">

        <!-- Nombre -->
        <div class="px-4 py-3.5 border-b border-gray-50">
          <label for="name" class="block text-xs font-semibold mb-1.5" style="color:#3082e3;">
            Nombre
          </label>
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"
              stroke="#9ca3af" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <input type="text" id="name" v-model="profile.name" class="flex-1 text-sm bg-transparent focus:outline-none"
              style="color:#2a2a2a;" placeholder="Tu nombre" />
          </div>
        </div>

        <!-- Apellido -->
        <div class="px-4 py-3.5">
          <label for="lastname" class="block text-xs font-semibold mb-1.5" style="color:#3082e3;">
            Apellido
          </label>
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"
              stroke="#9ca3af" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <input type="text" id="lastname" v-model="profile.lastname"
              class="flex-1 text-sm bg-transparent focus:outline-none" style="color:#2a2a2a;"
              placeholder="Tu apellido" />
          </div>
        </div>

      </div>

      <!-- Botón guardar -->
      <button type="submit" :disabled="updating"
        class="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
        style="background:#3082e3;">
        <template v-if="!updating">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Guardar cambios
        </template>
        <MainLoader v-else />
      </button>

      <!-- Cancelar -->
      <button type="button" @click="$router.back()"
        class="w-full py-3 rounded-xl text-sm font-semibold border transition-all active:scale-95"
        style="border-color:#e5e7eb; color:#6b7280; background:#fff;">
        Cancelar
      </button>

    </form>

  </div>

  <BottomNavigation />
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>