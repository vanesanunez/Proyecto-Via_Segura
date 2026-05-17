<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const adminSections = [
  {
    title: "Reportes",
    subtitle: "Estados, apoyos y resolución",
    description:
      "Gestioná reclamos, revisá prioridades y administrá el estado de cada reporte.",
    route: "/admin/reportes",
    action: "Ir a reportes",
    initials: "RP",
    accent: "from-[#3082e3] to-[#5ea2f0]",
    softBg: "bg-blue-50",
    button: "bg-[#3082e3] hover:bg-[#085baf]",
  },
  {
    title: "Usuarios",
    subtitle: "Roles y administración",
    description:
      "Visualizá perfiles registrados y administrá permisos entre usuarios comunes y admins.",
    route: "/admin/usuarios",
    action: "Ir a usuarios",
    initials: "US",
    accent: "from-[#f2826d] to-[#f6a08f]",
    softBg: "bg-orange-50",
    button: "bg-[#3082e3] hover:bg-[#085baf]",
  },
  {
    title: "Chat",
    subtitle: "Moderación de comunidad",
    description:
      "Revisá mensajes del chat global e intervení cuando haga falta moderar contenido.",
    route: "/admin/chat",
    action: "Ir a moderación",
    initials: "CH",
    accent: "from-slate-700 to-slate-500",
    softBg: "bg-slate-100",
    button: "bg-[#3082e3] hover:bg-[#085baf]",
  },
];
</script>

<template>
  <section class="min-h-screen bg-slate-50 p-6">
    <div class="mx-auto max-w-7xl">
      <!-- Hero -->
      <section
        class="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8 sm:py-8"
      >
        <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-100/70 blur-2xl"></div>
        <div class="absolute -bottom-10 left-0 h-28 w-28 rounded-full bg-orange-100/70 blur-2xl"></div>

        <div class="relative z-10">
          <span
            class="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#3082e3]"
          >
            Panel administrador
          </span>

          <div class="mt-4 grid gap-6 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
            <div>
              <h1 class="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                Centro de control
                <span class="text-[#3082e3]">Vía Segura</span>
              </h1>

              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Elegí el módulo que querés gestionar dentro del panel admin y
                supervisá el funcionamiento general de la app.
              </p>

              <div class="mt-5 flex flex-wrap gap-2">
                <span
                  class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  Reportes
                </span>
                <span
                  class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  Usuarios
                </span>
                <span
                  class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  Chat global
                </span>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Enfoque
                </p>
                <p class="mt-2 text-sm font-semibold text-slate-800">
                  Seguridad colaborativa
                </p>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Estilo
                </p>
                <p class="mt-2 text-sm font-semibold text-slate-800">
                  Claro y confiable
                </p>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Navegación
                </p>
                <p class="mt-2 text-sm font-semibold text-slate-800">
                  Modular y simple
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Modules -->
      <section class="mt-8">
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-slate-900 sm:text-2xl">
            Módulos del administrador
          </h2>
          <p class="mt-1 text-sm text-slate-600">
            Entrá directo al área que querés gestionar.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="section in adminSections"
            :key="section.route"
            class="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <div class="h-1.5 w-full bg-gradient-to-r" :class="section.accent"></div>

            <div class="p-6">
              <div class="flex items-start justify-between gap-4">
                <div
                  class="flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-bold text-slate-800"
                  :class="section.softBg"
                >
                  {{ section.initials }}
                </div>

                <span
                  class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500"
                >
                  Admin
                </span>
              </div>

              <div class="mt-5">
                <p class="text-sm font-semibold text-[#3082e3]">
                  {{ section.subtitle }}
                </p>

                <h3 class="mt-1 text-2xl font-semibold text-slate-900">
                  {{ section.title }}
                </h3>

                <p class="mt-3 text-sm leading-6 text-slate-600">
                  {{ section.description }}
                </p>
              </div>

              <div class="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  @click="router.push(section.route)"
                  class="rounded-xl px-4 py-2.5 text-sm font-medium text-white transition"
                  :class="section.button"
                >
                  {{ section.action }}
                </button>

                <button
                  type="button"
                  @click="router.push(section.route)"
                  class="text-sm font-medium text-slate-500 transition group-hover:text-slate-800"
                >
                  Ver módulo →
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>