<script setup>
import { useRouter } from "vue-router";
import BottomNavigation from "../components/BottomNavigation.vue";

import {
  ClipboardDocumentListIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();

const cards = [
  {
    title: "Reportes",
    subtitle: "Gestión y seguimiento",
    description:
      "Revisá reclamos, actualizá estados, administrá apoyos y resoluciones.",
    route: "/admin/reportes",
    icon: ClipboardDocumentListIcon,
    iconClass:
      "border-[#D6E8FB] bg-[#EEF4FF] text-[#3082E3]",
    pillClass:
      "border-[#D6E8FB] bg-[#EEF4FF] text-[#3082E3]",
    decorationClass: "bg-[#EEF4FF]",
  },
  {
    title: "Usuarios",
    subtitle: "Roles y permisos",
    description:
      "Visualizá perfiles y administrá los permisos de la comunidad.",
    route: "/admin/usuarios",
    icon: UsersIcon,
    iconClass:
      "border-[#F7CBC2] bg-[#FFF1ED] text-[#F2826D]",
    pillClass:
      "border-[#F7CBC2] bg-[#FFF1ED] text-[#E67661]",
    decorationClass: "bg-[#FFF1ED]",
  },
  {
    title: "Chat",
    subtitle: "Moderación",
    description:
      "Revisá mensajes de la comunidad e intervení cuando sea necesario.",
    route: "/admin/chat",
    icon: ChatBubbleLeftRightIcon,
    iconClass:
      "border-[#D6E8FB] bg-[#EEF4FF] text-[#3082E3]",
    pillClass:
      "border-[#D6E8FB] bg-[#EEF4FF] text-[#3082E3]",
    decorationClass: "bg-[#EEF4FF]",
  },
];

function openModule(route) {
  router.push(route);
}
</script>

<template>
  <section
    class="min-h-[100dvh] bg-[#F7F9F6] px-4 pb-28 pt-5"
  >
    <div class="mx-auto w-full max-w-5xl">
      <!-- Encabezado -->
      <header
        class="relative overflow-hidden rounded-[28px] border border-[#D6E8FB] bg-[#EEF4FF] p-5 shadow-[0_12px_28px_rgba(48,130,227,0.08)] sm:p-6"
      >
      

        <div class="relative z-10">
          <div
            class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#3082E3]"
          >
            <ShieldCheckIcon class="h-4 w-4" />
            <span>Administración</span>
          </div>

          <h1
            class="mt-4 max-w-xl text-[28px] font-bold leading-tight text-slate-900 sm:text-[34px]"
          >
            Panel de administración
          </h1>

          <p
            class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base"
          >
            Gestioná los reportes, usuarios y conversaciones de la comunidad
            desde un solo lugar.
          </p>

          <div
            class="mt-5 inline-flex items-center rounded-full border border-white bg-white/80 px-3 py-2 text-xs font-semibold text-[#3082E3]"
          >
            {{ cards.length }} módulos disponibles
          </div>
        </div>
      </header>

      <!-- Título de módulos -->
      <div
        class="mb-4 mt-7 flex items-end justify-between gap-4"
      >
        <div>
          <h2 class="text-[20px] font-bold text-slate-900">
            Módulos de gestión
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            Seleccioná la sección que necesitás administrar.
          </p>
        </div>
      </div>

      <!-- Tarjetas -->
      <div class="grid gap-4 md:grid-cols-3">
        <button
          v-for="card in cards"
          :key="card.route"
          type="button"
          :aria-label="`Abrir módulo ${card.title}`"
          @click="openModule(card.route)"
          class="group relative flex min-h-[260px] w-full overflow-hidden rounded-[26px] border border-[#D6E8FB] bg-white p-5 text-left shadow-[0_10px_26px_rgba(48,130,227,0.07)] transition duration-300 hover:-translate-y-1 hover:border-[#3082E3]/50 hover:shadow-[0_16px_34px_rgba(48,130,227,0.12)] focus:outline-none focus:ring-2 focus:ring-[#3082E3]/25 active:scale-[0.985]"
        >
          <!-- Decoración suave -->
         

          <div class="relative z-10 flex w-full flex-col">
            <!-- Ícono -->
            <div
              class="flex h-14 w-14 items-center justify-center rounded-[18px] border transition duration-300 group-hover:scale-105"
              :class="card.iconClass"
            >
              <component
                :is="card.icon"
                class="h-7 w-7"
              />
            </div>

            <!-- Texto -->
            <div class="mt-5 flex-1">
              <span
                class="inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold"
                :class="card.pillClass"
              >
                {{ card.subtitle }}
              </span>

              <h3
                class="mt-4 text-[21px] font-bold leading-tight text-slate-900"
              >
                {{ card.title }}
              </h3>

              <p
                class="mt-2 text-sm leading-6 text-slate-500"
              >
                {{ card.description }}
              </p>
            </div>

            <!-- Acción -->
            <div
              class="mt-5 flex items-center justify-between border-t border-[#E6EDF7] pt-4"
            >
              <span
                class="text-sm font-semibold text-[#3082E3]"
              >
                Abrir módulo
              </span>

              <span
                class="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF4FF] text-[#3082E3] transition duration-300 group-hover:translate-x-1 group-hover:bg-[#3082E3] group-hover:text-white"
              >
                <ArrowRightIcon class="h-5 w-5" />
              </span>
            </div>
          </div>
        </button>
      </div>

     
    </div>
  </section>

  <BottomNavigation />
</template>
