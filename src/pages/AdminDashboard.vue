<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const adminSections = [
  {
    title: "Reportes",
    subtitle: "Estados, apoyos y resolución",
    description: "Gestioná reclamos y seguí el estado de cada reporte.",
    route: "/admin/reportes",
    accent: "from-[#3082e3] to-[#5ea2f0]",
    pill: "bg-blue-50 text-[#3082e3]",
  },
  {
    title: "Usuarios",
    subtitle: "Roles y administración",
    description: "Visualizá perfiles y administrá permisos de la comunidad.",
    route: "/admin/usuarios",
    accent: "from-[#f2826d] to-[#f6a08f]",
    pill: "bg-orange-50 text-[#d86d59]",
  },
  {
    title: "Chat",
    subtitle: "Moderación de comunidad",
    description: "Revisá mensajes e intervení cuando haga falta moderar.",
    route: "/admin/chat",
    accent: "from-slate-700 to-slate-500",
    pill: "bg-slate-100 text-slate-700",
  },
];
</script>

<template>
  <section class="min-h-screen bg-slate-50 p-6">
    <div class="mx-auto max-w-6xl">
      <header class="mb-6">
        <p
          class="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#3082e3]"
        >
          Acceso rápido admin
        </p>

        <h1 class="mt-3 text-3xl font-bold leading-tight text-slate-900">
          Panel de administración
        </h1>

        <p class="mt-2 max-w-md text-sm leading-6 text-slate-600">
          Elegí el módulo que querés gestionar dentro del panel admin.
        </p>
      </header>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="section in adminSections"
          :key="section.route"
          type="button"
          @click="router.push(section.route)"
          class="group overflow-hidden rounded-[24px] border border-slate-200 bg-white text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.98]"
        >
          <div class="h-1.5 w-full bg-gradient-to-r" :class="section.accent"></div>

          <div class="p-6">
            <div class="flex items-start justify-between gap-4">
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="section.pill"
              >
                {{ section.subtitle }}
              </span>

              <span
                class="text-2xl font-semibold text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#3082e3]"
              >
                →
              </span>
            </div>

            <h2 class="mt-5 text-[34px] font-bold leading-none text-slate-900">
              {{ section.title }}
            </h2>

            <p class="mt-4 text-sm leading-6 text-slate-600">
              {{ section.description }}
            </p>

            <div class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#3082e3]">
              Abrir módulo
              <span class="transition group-hover:translate-x-1">→</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>