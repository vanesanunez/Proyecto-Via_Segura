<script>
import { register } from "../services/auth";

import {
  EnvelopeIcon,
  UserIcon,
  IdentificationIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  UserPlusIcon,
  CheckCircleIcon,
} from "@heroicons/vue/24/outline";

export default {
  name: "Register",

  components: {
    EnvelopeIcon,
    UserIcon,
    IdentificationIcon,
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    UserPlusIcon,
    CheckCircleIcon,
  },

  data() {
    return {
      user: {
        email: "",
        name: "",
        lastname: "",
        dni: "",
        password: "",
      },

      loading: false,
      showPassword: false,
      successMessage: "",
      errorMessage: "",
    };
  },

  methods: {
    async handleSubmit() {
      if (this.loading) return;

      this.successMessage = "";
      this.errorMessage = "";

      try {
        this.loading = true;

        await register(
          this.user.email,
          this.user.name,
          this.user.lastname,
          this.user.dni,
          this.user.password,
        );

        this.successMessage = "¡Cuenta creada con éxito!";
      } catch (error) {
        console.error("[Register]", error);

        this.errorMessage =
          "No pudimos crear la cuenta. Revisá los datos e intentá nuevamente.";
      } finally {
        this.loading = false;
      }
    },

    goToLogin() {
      this.$router.push("/ingresar");
    },
  },
};
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-[#f7f9f6]">
    <!-- HERO -->
    <section
      class="relative min-h-[370px] overflow-hidden bg-[#3082e3] text-white"
    >
      <!-- Ilustración decorativa -->
      <img
        src="/hero-login.png"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 h-full w-full object-cover object-right"
      />

      <!-- Logo -->
      <div class="relative z-10 mx-auto w-full max-w-md px-5 pt-7">
        <img
          src="/icono2.png"
          alt="Vía Segura"
          class="h-auto w-[125px] object-contain"
        />
      </div>
    </section>

    <!-- TARJETA -->
    <section class="relative z-20 -mt-[48px] px-4 pb-10">
      <div
        class="mx-auto w-full max-w-md rounded-[30px] border border-[#edf1f6] bg-white px-5 pb-7 pt-6 shadow-[0_18px_45px_rgba(15,45,92,0.12)]"
      >
        <!-- Ícono -->
        <div
          class="mx-auto -mt-14 flex h-[72px] w-[72px] items-center justify-center rounded-[24px] border-[6px] border-white bg-[#eef4ff] text-[#3082e3] shadow-[0_10px_24px_rgba(48,130,227,0.16)]"
        >
          <UserPlusIcon class="h-8 w-8" />
        </div>

        <!-- Título -->
        <div class="mt-5 text-center">
          <h1 class="text-[27px] font-bold leading-tight text-[#2a2a2a]">
            Crear una cuenta
          </h1>

          <p
            class="mx-auto mt-2 max-w-[290px] text-sm leading-6 text-slate-500"
          >
            Sumate a Vía Segura y ayudá a construir una comunidad más conectada.
          </p>
        </div>

        <!-- ÉXITO -->
        <div v-if="successMessage" class="mt-7 text-center">
          <div
            class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3]"
          >
            <CheckCircleIcon class="h-10 w-10" />
          </div>

          <h2 class="mt-4 text-xl font-bold text-[#2a2a2a]">
            {{ successMessage }}
          </h2>

          <p
            class="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-slate-500"
          >
            Tu registro se completó correctamente. Iniciá sesión con tu email y  contraseña para comenzar.
          </p>

          <button
            type="button"
            class="mt-6 flex h-[54px] w-full items-center justify-center rounded-2xl bg-[#3082e3] px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(48,130,227,0.25)] transition hover:bg-[#085baf] active:scale-[0.98]"
            @click="goToLogin"
          >
            Iniciar sesión
          </button>
        </div>

        <!-- FORMULARIO -->
        <form
          v-else
          class="mt-7 space-y-5"
          action="#"
          @submit.prevent="handleSubmit"
        >
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

          <!-- Nombre -->
          <div>
            <label
              for="name"
              class="mb-2 block text-sm font-semibold text-[#2a2a2a]"
            >
              Nombre
            </label>

            <div class="relative">
              <UserIcon
                class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />

              <input
                id="name"
                v-model="user.name"
                type="text"
                autocomplete="given-name"
                required
                placeholder="Ingresá tu nombre"
                class="h-[54px] w-full rounded-2xl border border-[#dbe5f0] bg-[#fbfcfd] pl-12 pr-4 text-[15px] text-[#2a2a2a] outline-none transition placeholder:text-slate-400 focus:border-[#3082e3] focus:bg-white focus:ring-4 focus:ring-[#3082e3]/10"
              />
            </div>
          </div>

          <!-- Apellido -->
          <div>
            <label
              for="lastname"
              class="mb-2 block text-sm font-semibold text-[#2a2a2a]"
            >
              Apellido
            </label>

            <div class="relative">
              <UserIcon
                class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />

              <input
                id="lastname"
                v-model="user.lastname"
                type="text"
                autocomplete="family-name"
                required
                placeholder="Ingresá tu apellido"
                class="h-[54px] w-full rounded-2xl border border-[#dbe5f0] bg-[#fbfcfd] pl-12 pr-4 text-[15px] text-[#2a2a2a] outline-none transition placeholder:text-slate-400 focus:border-[#3082e3] focus:bg-white focus:ring-4 focus:ring-[#3082e3]/10"
              />
            </div>
          </div>

          <!-- DNI -->
          <div>
            <label
              for="dni"
              class="mb-2 block text-sm font-semibold text-[#2a2a2a]"
            >
              DNI
            </label>

            <div class="relative">
              <IdentificationIcon
                class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />

              <input
                id="dni"
                v-model="user.dni"
                type="text"
                inputmode="numeric"
                required
                placeholder="Ingresá tu DNI"
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
                autocomplete="new-password"
                required
                placeholder="Creá una contraseña"
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

          <!-- ERROR -->
          <div
            v-if="errorMessage"
            class="rounded-2xl border border-[#f8dfd9] bg-[#fff1ed] px-4 py-3 text-sm leading-5 text-[#d96651]"
          >
            {{ errorMessage }}
          </div>

          <!-- BOTÓN -->
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
              {{ loading ? "Creando cuenta..." : "Crear cuenta" }}
            </span>
          </button>
        </form>

        <!-- INGRESAR -->
        <div v-if="!successMessage">
          <div class="my-6 flex items-center gap-3">
            <div class="h-px flex-1 bg-slate-200"></div>

            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3]"
            >
              <LockClosedIcon class="h-4 w-4" />
            </div>

            <div class="h-px flex-1 bg-slate-200"></div>
          </div>

          <p class="text-center text-sm text-slate-600">
            ¿Ya tenés una cuenta?

            <RouterLink
              to="/ingresar"
              class="ml-1 font-semibold text-[#3082e3] transition hover:text-[#085baf]"
            >
              Ingresar
            </RouterLink>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
