<script>
import { login } from "../services/auth";

import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  UserGroupIcon,
} from "@heroicons/vue/24/outline";

export default {
  name: "Login",

  components: {
    EnvelopeIcon,
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    UserGroupIcon,
  },

  data() {
    return {
      user: {
        email: "",
        password: "",
      },

      loading: false,
      showPassword: false,
      errorMessage: "",
    };
  },

  methods: {
    async handleSubmit() {
      if (this.loading) return;

      this.errorMessage = "";

      try {
        this.loading = true;

        await login(this.user.email, this.user.password);

        this.$router.push("/");
      } catch (error) {
        console.error("[Login]", error);

        this.errorMessage =
          "No pudimos iniciar sesión. Revisá el email y la contraseña.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<template>
  <div class="min-h-screen overflow-hidden bg-[#f7f9f6]">
   

    <!-- HERO DE BIENVENIDA -->
    <section
      class="relative min-h-[370px] overflow-hidden bg-[#3082e3] text-white"
    >
      <!-- Imagen como fondo del hero -->
      <img
        src="/hero-login.png"
        alt="imagen de edificios, mapa y ubicación"
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 h-full w-full object-cover object-right "
      />

      
      <div class="relative z-10 mx-auto w-full max-w-md px-5 pt-7">
        <img
          src="/icono2.png"
          alt="Vía Segura"
          class="h-auto w-[125px] object-contain"
        />

        
      </div>
    </section>

    <!-- TARJETA DEL FORMULARIO -->
    <section class="relative z-20 -mt-[48px] px-4 pb-10">
      <div
        class="mx-auto w-full max-w-md rounded-[30px] border border-[#edf1f6] bg-white px-5 pb-7 pt-6 shadow-[0_18px_45px_rgba(15,45,92,0.12)]"
      >
        <!-- Ícono superior -->
        <div
          class="mx-auto -mt-14 flex h-[72px] w-[72px] items-center justify-center rounded-[24px] border-[6px] border-white bg-[#eef4ff] text-[#3082e3] shadow-[0_10px_24px_rgba(48,130,227,0.16)]"
        >
          <UserGroupIcon class="h-8 w-8" />
        </div>

        <!-- Título -->
        <div class="mt-5 text-center">
          <h1 class="text-[27px] font-bold leading-tight text-[#2a2a2a]">
            Ingresar a mi cuenta
          </h1>

          <p
            class="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-slate-500"
          >
            Continuá para seguir cuidando tu comunidad.
          </p>
        </div>

        <!-- Formulario -->
        <form class="mt-7 space-y-5" action="#" @submit.prevent="handleSubmit">
          <!-- Email -->
          <div>
            <label
              for="email"
              class="mb-2 block text-sm font-semibold text-[#2a2a2a]"
            >
              Email
            </label>

            <div class="relative">
              <EnvelopeIcon
                class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />

              <input
                id="email"
                v-model="user.email"
                type="email"
                autocomplete="email"
                required
                placeholder="nombre@email.com"
                class="h-[54px] w-full rounded-2xl border border-[#dbe5f0] bg-[#fbfcfd] pl-12 pr-4 text-[15px] text-[#2a2a2a] outline-none transition placeholder:text-slate-400 focus:border-[#3082e3] focus:bg-white focus:ring-4 focus:ring-[#3082e3]/10"
              />
            </div>
          </div>

          <!-- Contraseña -->
          <div>
            <label
              for="password"
              class="mb-2 block text-sm font-semibold text-[#2a2a2a]"
            >
              Contraseña
            </label>

            <div class="relative">
              <LockClosedIcon
                class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />

              <input
                id="password"
                v-model="user.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                placeholder="Ingresá tu contraseña"
                class="h-[54px] w-full rounded-2xl border border-[#dbe5f0] bg-[#fbfcfd] pl-12 pr-12 text-[15px] text-[#2a2a2a] outline-none transition placeholder:text-slate-400 focus:border-[#3082e3] focus:bg-white focus:ring-4 focus:ring-[#3082e3]/10"
              />

              <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#3082e3]"
                :aria-label="
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                "
                @click="showPassword = !showPassword"
              >
                <EyeSlashIcon v-if="showPassword" class="h-5 w-5" />

                <EyeIcon v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Mensaje de error -->
          <div
            v-if="errorMessage"
            class="rounded-2xl border border-[#f8dfd9] bg-[#fff1ed] px-4 py-3 text-sm leading-5 text-[#d96651]"
          >
            {{ errorMessage }}
          </div>

          <!-- Botón ingresar -->
          <button
            type="submit"
            :disabled="loading"
            class="flex h-[54px] w-full items-center justify-center gap-3 rounded-2xl bg-[#3082e3] px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(48,130,227,0.25)] transition hover:bg-[#085baf] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span
              v-if="loading"
              class="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
            ></span>

            <span>
              {{ loading ? "Ingresando..." : "Ingresar" }}
            </span>
          </button>
        </form>

        <!-- Separador -->
        <div class="my-6 flex items-center gap-3">
          <div class="h-px flex-1 bg-slate-200"></div>

          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3]"
          >
            <LockClosedIcon class="h-4 w-4" />
          </div>

          <div class="h-px flex-1 bg-slate-200"></div>
        </div>

        <!-- Crear cuenta -->
        <p class="text-center text-sm text-slate-600">
          ¿Todavía no tenés una cuenta?

          <RouterLink
            to="/crear-cuenta"
            class="ml-1 font-semibold text-[#3082e3] transition hover:text-[#085baf]"
          >
            Crear cuenta
          </RouterLink>
        </p>
      </div>
    </section>
  </div>
</template>
