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
    pillClass: "bg-[#eef4ff] text-[#3082e3]",
  },
  {
    title: "Usuarios",
    subtitle: "Roles y administración",
    description: "Visualizá perfiles y administrá permisos de la comunidad.",
    route: "/admin/usuarios",
    icon: "US",
    iconText: "text-[#f2826d]",
    pillClass: "bg-[#fff1ed] text-[#f2826d]",
  },
  {
    title: "Chat",
    subtitle: "Moderación de comunidad",
    description: "Revisá mensajes e intervení cuando haga falta moderar.",
    route: "/admin/chat",
    icon: "CH",
    iconText: "text-[#3082e3]",
    pillClass: "bg-[#eef4ff] text-[#3082e3]",
  },
];
</script>

<template>
  <section class="min-h-screen bg-white px-4 pt-4 pb-8">
    <div class="mx-auto w-full max-w-[430px]">
      <header class="mb-6">
        <h1 class="text-[30px] font-bold leading-[1.08] text-[#0f172a]">
          Panel de administración
        </h1>

        <p class="mt-3 max-w-[310px] text-[15px] leading-[1.7] text-slate-500">
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
            class="rounded-[24px] bg-[#E0E5EC] px-4 py-4 transition-all duration-300 ease-out
                   shadow-[0_10px_24px_rgba(148,163,184,0.18)]
                   hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(148,163,184,0.22)]
                   active:scale-[0.985]"
          >
            <div class="flex items-start gap-4">
              <!-- Icono -->
              <div
                class="flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px] bg-[#E0E5EC]
                       text-[28px] font-bold
                       shadow-[-3px_-3px_8px_rgba(255,255,255,0.75),3px_3px_8px_rgba(163,177,198,0.18)]"
                :class="card.iconText"
              >
                {{ card.icon }}
              </div>

              <!-- Contenido -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="text-[11px] font-semibold px-3 py-1 rounded-full"
                    :class="card.pillClass"
                  >
                    {{ card.subtitle }}
                  </span>
                </div>

                <div class="mt-3">
                  <h2 class="text-[18px] font-bold leading-snug text-slate-900">
                    {{ card.title }}
                  </h2>

                  <p class="mt-2 text-[15px] leading-[1.7] text-slate-500">
                    {{ card.description }}
                  </p>
                </div>

                <div class="mt-4 flex items-center justify-end border-t border-white/60 pt-4">
                  <span
                    class="block text-[34px] font-light leading-none transition duration-300 group-hover:translate-x-2 group-active:translate-x-1"
                    :class="card.iconText"
                  >
                    ›
                  </span>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>
