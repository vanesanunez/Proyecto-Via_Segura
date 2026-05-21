<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const cards = [
  {
    title: "Reportes",
    subtitle: "Estados, apoyos y resolución",
    description:
      "Gestioná reclamos, revisá prioridades y administrá su resolución.",
    route: "/admin/reportes",
    icon: "RP",
    iconText: "text-[#3082e3]",
  },
  {
    title: "Usuarios",
    subtitle: "Roles y administración",
    description: "Visualizá perfiles y administrá permisos de la comunidad.",
    route: "/admin/usuarios",
    icon: "US",
    iconText: "text-[#f2826d]",
  },
  {
    title: "Chat",
    subtitle: "Moderación de comunidad",
    description: "Revisá mensajes e intervení cuando haga falta moderar.",
    route: "/admin/chat",
    icon: "CH",
    iconText: "text-[#3082e3]",
  },
];
</script>

<template>
  <section class="min-h-screen bg-[#E0E5EC] px-4 pt-4 pb-6">
    <div class="mx-auto w-full max-w-[390px]">
      <header class="mb-6">
        <h1 class="text-[28px] font-bold leading-[1.1] text-[#0f172a]">
          Panel de administración
        </h1>

        <p class="mt-3 max-w-[290px] text-[15px] leading-[1.7] text-slate-500">
          Elegí el módulo que querés gestionar dentro del panel admin.
        </p>
      </header>

      <div class="space-y-5">
        <button
          v-for="card in cards"
          :key="card.route"
          type="button"
          @click="router.push(card.route)"
          class="group block w-full text-left"
        >
          <div
            class="min-h-[205px] rounded-[30px] bg-[#E0E5EC] px-5 py-6 transition duration-300 shadow-[-8px_-8px_16px_rgba(255,255,255,0.85),8px_8px_16px_rgba(163,177,198,0.45)] group-hover:bg-[#e6ebf2] group-active:bg-[#e6ebf2] group-hover:shadow-[-10px_-10px_18px_rgba(255,255,255,0.9),10px_10px_18px_rgba(163,177,198,0.5)] group-active:shadow-[-10px_-10px_18px_rgba(255,255,255,0.9),10px_10px_18px_rgba(163,177,198,0.5)] group-hover:-translate-y-[2px] group-active:-translate-y-[2px] group-active:scale-[0.985]"
          >
            <div class="flex items-center gap-4">
              <!-- Icono -->
              <div
                class="flex h-[80px] w-[80px] shrink-0 items-center justify-center rounded-[22px] bg-[#E0E5EC] text-[30px] font-bold shadow-[-6px_-6px_12px_rgba(255,255,255,0.85),6px_6px_12px_rgba(163,177,198,0.35)]"
                :class="card.iconText"
              >
                {{ card.icon }}
              </div>

              <!-- Texto -->
              <div class="min-w-0 flex-1 pr-5">
                <p class="text-[13px] leading-[1.35] text-slate-500">
                  {{ card.subtitle }}
                </p>

                <h2
                  class="mt-2 text-[30px] font-bold leading-none text-[#020617]"
                >
                  {{ card.title }}
                </h2>

                <p class="mt-3 text-[15px] leading-[1.75] text-slate-500">
                  {{ card.description }}
                </p>
              </div>

              <!-- Flecha -->
              <div class="shrink-0">
                <span
                  class="block text-[38px] font-light leading-none transition duration-300 group-hover:translate-x-2 group-active:translate-x-1"
                  :class="card.iconText"
                >
                  ›
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>
