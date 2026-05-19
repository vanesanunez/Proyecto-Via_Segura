<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const secondarySections = [
  {
    title: "Usuarios",
    subtitle: "Roles y administración",
    description: "Visualizá perfiles y administrá permisos.",
    route: "/admin/usuarios",
    icon: "US",
    softBg: "bg-[#fdf1ee]",
    softText: "text-[#d86d59]",
  },
  {
    title: "Chat",
    subtitle: "Moderación de comunidad",
    description: "Revisá mensajes e intervení cuando haga falta.",
    route: "/admin/chat",
    icon: "CH",
    softBg: "bg-slate-100",
    softText: "text-slate-700",
  },
];
</script>

<template>
  <section class="min-h-screen bg-slate-50 px-5 pb-6 pt-8 sm:p-6">
    <div class="mx-auto max-w-6xl">
      <header class="mb-5">
        <p
          class="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#3082e3]"
        >
          Admin
        </p>

        <h1 class="mt-3 text-[28px] font-bold leading-tight text-slate-900 sm:text-3xl">
          Panel de administración
        </h1>

        <p class="mt-2 max-w-[20rem] text-sm leading-6 text-slate-600">
          Elegí el módulo que querés gestionar dentro del panel admin.
        </p>
      </header>

      <!-- Card principal -->
      <button
        type="button"
        @click="router.push('/admin/reportes')"
        class="group relative w-full overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.98]"
      >
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/70 blur-2xl"></div>
          <div class="absolute bottom-0 right-4 h-16 w-16 rounded-full bg-orange-100/60 blur-xl"></div>
        </div>

        <div class="relative z-10">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-base font-bold text-[#3082e3]"
                >
                  RP
                </div>

                <div class="min-w-0">
                  <p class="text-xs font-semibold text-[#3082e3] sm:text-sm">
                    Estados, apoyos y resolución
                  </p>
                  <h2 class="mt-1 text-[30px] font-bold leading-none text-slate-900 sm:text-[36px]">
                    Reportes
                  </h2>
                </div>
              </div>
            </div>

            <span
              class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xl font-semibold text-[#3082e3] transition group-hover:translate-x-1 group-hover:bg-[#3082e3] group-hover:text-white group-active:bg-[#3082e3] group-active:text-white"
            >
              →
            </span>
          </div>

          <p class="mt-4 max-w-[18rem] text-sm leading-6 text-slate-600 sm:max-w-xl sm:text-base">
            Gestioná reclamos, revisá prioridades y administrá su resolución.
          </p>
        </div>
      </button>

      <!-- Cards secundarias -->
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <button
          v-for="section in secondarySections"
          :key="section.route"
          type="button"
          @click="router.push(section.route)"
          class="group w-full rounded-[22px] border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.98]"
        >
          <div class="flex items-start justify-between gap-4">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
              :class="[section.softBg, section.softText]"
            >
              {{ section.icon }}
            </div>

            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-semibold transition group-hover:translate-x-1"
              :class="[section.softBg, section.softText]"
            >
              →
            </span>
          </div>

          <p class="mt-5 text-xs font-semibold sm:text-sm" :class="section.softText">
            {{ section.subtitle }}
          </p>

          <h2 class="mt-1 text-[28px] font-bold leading-none text-slate-900">
            {{ section.title }}
          </h2>

          <p class="mt-4 max-w-[16rem] text-sm leading-6 text-slate-600">
            {{ section.description }}
          </p>
        </button>
      </div>
    </div>
  </section>
</template>