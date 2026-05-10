<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const adminSections = [
  {
    title: "Reportes",
    description: "Gestioná reportes, estados, apoyos y acciones del panel.",
    action: "Ir a reportes",
    route: "/admin/reportes",
  },
  {
    title: "Usuarios",
    description: "Administrá usuarios, roles y futuras acciones del ABM.",
    action: "Ir a usuarios",
    route: "/admin/usuarios",
  },
  {
    title: "Chat",
    description: "Revisá mensajes y moderá el chat general de la app.",
    action: "Ir a moderación",
    route: "/admin/chat",
  },
];
</script>

<template>
  <section class="min-h-screen bg-slate-50 p-6">
    <div class="mx-auto max-w-6xl">
      <header class="mb-8">
        <h1 class="text-2xl font-bold text-slate-800 sm:text-3xl">
          Panel de administración
        </h1>
        <p class="mt-2 text-sm text-slate-600 sm:text-base">
          Elegí el módulo que querés gestionar dentro del panel admin.
        </p>
      </header>

      <div class="grid gap-4 md:grid-cols-3">
        <article
          v-for="section in adminSections"
          :key="section.route"
          class="rounded-2xl bg-white p-6 shadow-sm border border-slate-200"
        >
          <h2 class="text-xl font-semibold text-slate-800">
            {{ section.title }}
          </h2>

          <p class="mt-2 text-sm leading-relaxed text-slate-600">
            {{ section.description }}
          </p>

          <button
            type="button"
            @click="router.push(section.route)"
            class="mt-5 rounded-lg bg-[#3082e3] px-4 py-2 text-sm font-medium text-white hover:bg-[#085baf]"
          >
            {{ section.action }}
          </button>
        </article>
      </div>
    </div>
  </section>
</template>
