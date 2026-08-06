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

      fieldErrors: {
        email: "",
        name: "",
        lastname: "",
        dni: "",
        password: "",
      },
    };
  },

  methods: {
    // Permite letras, tildes, espacios, guiones y apóstrofes.
    sanitizePersonName(field) {
      this.user[field] = this.user[field]
        .replace(/[^\p{L}\s'-]/gu, "")
        .replace(/\s{2,}/g, " ")
        .slice(0, 40);

      this.fieldErrors[field] = "";
    },

    // Elimina letras, símbolos y cualquier cosa que no sea un número.
    sanitizeDni() {
      this.user.dni = this.user.dni.replace(/\D/g, "").slice(0, 8);

      this.fieldErrors.dni = "";
    },

    validateForm() {
      this.fieldErrors = {
        email: "",
        name: "",
        lastname: "",
        dni: "",
        password: "",
      };

      const email = this.user.email.trim();
      const name = this.user.name.trim();
      const lastname = this.user.lastname.trim();
      const dni = this.user.dni.trim();
      const password = this.user.password;

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const namePattern = /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;

      // Email
      if (!email) {
        this.fieldErrors.email = "Ingresá tu email.";
      } else if (!emailPattern.test(email)) {
        this.fieldErrors.email = "Ingresá un email válido.";
      }

      // Nombre
      if (!name) {
        this.fieldErrors.name = "Ingresá tu nombre.";
      } else if (name.length < 2 || !namePattern.test(name)) {
        this.fieldErrors.name = "El nombre debe contener solamente letras.";
      }

      // Apellido
      if (!lastname) {
        this.fieldErrors.lastname = "Ingresá tu apellido.";
      } else if (lastname.length < 2 || !namePattern.test(lastname)) {
        this.fieldErrors.lastname =
          "El apellido debe contener solamente letras.";
      }

      // DNI
      if (!dni) {
        this.fieldErrors.dni = "Ingresá tu DNI.";
      } else if (!/^\d{7,8}$/.test(dni)) {
        this.fieldErrors.dni = "El DNI debe tener entre 7 y 8 números.";
      }

      // Contraseña: mínimo 6 caracteres y sin espacios.
      if (!password) {
        this.fieldErrors.password = "Ingresá una contraseña.";
      } else if (!/^\S{6,}$/.test(password)) {
        this.fieldErrors.password =
          "La contraseña debe tener al menos 6 caracteres, sin espacios.";
      }

      // Guardamos los valores sin espacios accidentales
      // al principio o al final.
      this.user.email = email;
      this.user.name = name;
      this.user.lastname = lastname;
      this.user.dni = dni;

      return !Object.values(this.fieldErrors).some((message) => message !== "");
    },

    async handleSubmit() {
      if (this.loading) return;

      this.successMessage = "";
      this.errorMessage = "";

      if (!this.validateForm()) return;

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
      class="relative min-h-92.5 overflow-hidden bg-[#3082e3] text-white"
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
    <section class="relative z-20 -mt-12 px-4 pb-10">
      <div
        class="mx-auto w-full max-w-md rounded-[30px] border border-[#edf1f6] bg-white px-5 pb-7 pt-6 shadow-[0_18px_45px_rgba(15,45,92,0.12)]"
      >
        <!-- Ícono superior -->
        <div
          class="mx-auto -mt-14 flex h-[72px] w-[72px] items-center justify-center rounded-3xl border-[6px] border-white bg-[#eef4ff] text-[#3082e3] shadow-[0_10px_24px_rgba(48,130,227,0.16)]"
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

        <!-- REGISTRO EXITOSO -->
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
            Tu registro se completó correctamente.
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
          novalidate
          @submit.prevent="handleSubmit"
        >
          <!-- EMAIL -->
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
                autocapitalize="none"
                spellcheck="false"
                required
                placeholder="nombre@email.com"
                class="h-[54px] w-full rounded-2xl border bg-[#fbfcfd] pl-12 pr-4 text-[15px] text-[#2a2a2a] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-[#3082e3]/10"
                :class="
                  fieldErrors.email
                    ? 'border-[#f2826d] focus:border-[#f2826d]'
                    : 'border-[#dbe5f0] focus:border-[#3082e3]'
                "
                @input="fieldErrors.email = ''"
              />
            </div>

            <p
              v-if="fieldErrors.email"
              class="mt-2 text-xs font-medium text-[#d96651]"
            >
              {{ fieldErrors.email }}
            </p>
          </div>

          <!-- NOMBRE -->
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
                autocapitalize="words"
                maxlength="40"
                required
                placeholder="Ingresá tu nombre"
                class="h-[54px] w-full rounded-2xl border bg-[#fbfcfd] pl-12 pr-4 text-[15px] text-[#2a2a2a] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-[#3082e3]/10"
                :class="
                  fieldErrors.name
                    ? 'border-[#f2826d] focus:border-[#f2826d]'
                    : 'border-[#dbe5f0] focus:border-[#3082e3]'
                "
                @input="sanitizePersonName('name')"
              />
            </div>

            <p
              v-if="fieldErrors.name"
              class="mt-2 text-xs font-medium text-[#d96651]"
            >
              {{ fieldErrors.name }}
            </p>
          </div>

          <!-- APELLIDO -->
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
                autocapitalize="words"
                maxlength="40"
                required
                placeholder="Ingresá tu apellido"
                class="h-[54px] w-full rounded-2xl border bg-[#fbfcfd] pl-12 pr-4 text-[15px] text-[#2a2a2a] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-[#3082e3]/10"
                :class="
                  fieldErrors.lastname
                    ? 'border-[#f2826d] focus:border-[#f2826d]'
                    : 'border-[#dbe5f0] focus:border-[#3082e3]'
                "
                @input="sanitizePersonName('lastname')"
              />
            </div>

            <p
              v-if="fieldErrors.lastname"
              class="mt-2 text-xs font-medium text-[#d96651]"
            >
              {{ fieldErrors.lastname }}
            </p>
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
                autocomplete="off"
                maxlength="8"
                required
                placeholder="Ingresá tu DNI"
                class="h-[54px] w-full rounded-2xl border bg-[#fbfcfd] pl-12 pr-4 text-[15px] text-[#2a2a2a] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-[#3082e3]/10"
                :class="
                  fieldErrors.dni
                    ? 'border-[#f2826d] focus:border-[#f2826d]'
                    : 'border-[#dbe5f0] focus:border-[#3082e3]'
                "
                @input="sanitizeDni"
              />
            </div>

            <p
              v-if="fieldErrors.dni"
              class="mt-2 text-xs font-medium text-[#d96651]"
            >
              {{ fieldErrors.dni }}
            </p>
          </div>

          <!-- CONTRASEÑA -->
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
                minlength="6"
                required
                placeholder="Ingresá al menos 6 caracteres"
                class="h-[54px] w-full rounded-2xl border bg-[#fbfcfd] pl-12 pr-12 text-[15px] text-[#2a2a2a] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-[#3082e3]/10"
                :class="
                  fieldErrors.password
                    ? 'border-[#f2826d] focus:border-[#f2826d]'
                    : 'border-[#dbe5f0] focus:border-[#3082e3]'
                "
                @input="fieldErrors.password = ''"
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

            <p
              v-if="fieldErrors.password"
              class="mt-2 text-xs font-medium text-[#d96651]"
            >
              {{ fieldErrors.password }}
            </p>

            <p v-else class="mt-2 text-xs leading-5 text-slate-400">
              Debe tener al menos 6 caracteres. Podés usar letras, números o
              símbolos.
            </p>
          </div>

          <!-- ERROR GENERAL -->
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

        <!-- ENLACE A LOGIN -->
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
