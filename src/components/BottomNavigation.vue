<!-- <script>
import { useRouter, useRoute } from "vue-router";
import {
  HomeIcon,
  MapPinIcon,
  PlusCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  UserIcon,
} from "@heroicons/vue/24/solid";

export default {
  name: "BottomNavigation",
  components: {
    HomeIcon,
    MapPinIcon,
    PlusCircleIcon,
    ChatBubbleLeftEllipsisIcon,
    UserIcon,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();

    const goTo = (path) => {
      if (route.path !== path) {
        router.push(path);
      }
    };

    const buttonClass = (path) => {
      return [
        "flex flex-col items-center text-white hover:text-gray-200",
        route.path === path ? "text-gray-200" : "",
      ];
    };

    return { goTo, buttonClass };
  },
};
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-50 flex h-16 w-full items-center justify-around bg-[#3082e3] shadow-md">
    <button @click="goTo('/')" :class="buttonClass('/')">
      <HomeIcon class="h-6 w-6" />
      <span class="text-xs">Home</span>
    </button>

    <button @click="goTo('/compartir')" :class="buttonClass('/compartir')">
      <MapPinIcon class="h-6 w-6" />
      <span class="text-xs">Rutas</span>
    </button>

    <button
      @click="goTo('/report/nuevo')"
      class="flex items-center justify-center bg-white text-[#3082e3] p-3 rounded-full -mt-6 shadow-lg"
    >
      <PlusCircleIcon class="h-8 w-8" />
    </button>

    <button @click="goTo('/chat')" :class="buttonClass('/chat')">
      <ChatBubbleLeftEllipsisIcon class="h-6 w-6" />
      <span class="text-xs">Chat</span>
    </button>

    <button @click="goTo('/mi-perfil')" :class="buttonClass('/mi-perfil')">
      <UserIcon class="h-6 w-6" />
      <span class="text-xs">Perfil</span>
    </button>
  </nav>
</template>

<style scoped>
button:active {
  transform: scale(0.95);
  transition: transform 0.1s;
}
</style> -->

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  HomeIcon,
  MapPinIcon,
  PlusIcon,
  ChatBubbleLeftEllipsisIcon,
  UserIcon,
} from "@heroicons/vue/24/solid";
import {
  HomeIcon as HomeIconOutline,
  MapPinIcon as MapPinIconOutline,
  ChatBubbleLeftEllipsisIcon as ChatIconOutline,
  UserIcon as UserIconOutline,
} from "@heroicons/vue/24/outline";

const route = useRoute();
const router = useRouter();

// Los 4 destinos que participan del indicador deslizante (el FAB central
// del medio queda afuera: es una acción, no una sección de navegación).
const items = [
  { label: "Inicio", path: "/", icon: HomeIcon, iconOutline: HomeIconOutline },
  { label: "Rutas", path: "/compartir", icon: MapPinIcon, iconOutline: MapPinIconOutline },
  { label: "Chat", path: "/chat", icon: ChatBubbleLeftEllipsisIcon, iconOutline: ChatIconOutline },
  { label: "Perfil", path: "/mi-perfil", icon: UserIcon, iconOutline: UserIconOutline },
];

// Índice del item activo según la ruta actual. Usamos startsWith para que
// subrutas (ej. /mi-perfil/editar) también marquen "Perfil" como activo.
const activeIndex = computed(() => {
  const path = route.path;

  const exactHome = path === "/";
  if (exactHome) return 0;

  return items.findIndex((item, i) => i !== 0 && path.startsWith(item.path));
});

const isFabActive = computed(() => route.path.startsWith("/report/nuevo"));

function goTo(path) {
  if (route.path !== path) router.push(path);
}
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-50 pb-[calc(env(safe-area-inset-bottom)+12px)] px-4">
    <div class="relative mx-auto max-w-md">
      <!-- Barra flotante -->
      <div
        class="relative rounded-[28px] border border-[#e4ebf4] bg-white/95 px-2 shadow-[0_12px_32px_rgba(15,23,42,0.14)] backdrop-blur-sm"
      >
        <div class="relative grid h-16 grid-cols-5 items-center">
          <!-- Indicador deslizante -->
          <div
            class="pointer-events-none absolute top-1.5 bottom-1.5 rounded-[18px] bg-[#eef4ff] transition-all duration-300 ease-out"
            :class="activeIndex === -1 ? 'opacity-0' : 'opacity-100'"
            :style="{
              width: 'calc(20% - 6px)',
              left: `calc(${(activeIndex < 2 ? activeIndex : activeIndex + 1) * 20}% + 3px)`,
            }"
          ></div>

          <!-- Inicio -->
          <button
            type="button"
            @click="goTo(items[0].path)"
            class="relative z-10 flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-90"
          >
            <component
              :is="activeIndex === 0 ? items[0].icon : items[0].iconOutline"
              class="h-5.5 w-5.5 transition-colors"
              :class="activeIndex === 0 ? 'text-[#3082e3]' : 'text-slate-400'"
            />
            <span
              class="text-[10px] leading-none transition-colors"
              :class="activeIndex === 0 ? 'font-bold text-[#3082e3]' : 'font-medium text-slate-400'"
            >
              {{ items[0].label }}
            </span>
          </button>

          <!-- Rutas -->
          <button
            type="button"
            @click="goTo(items[1].path)"
            class="relative z-10 flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-90"
          >
            <component
              :is="activeIndex === 1 ? items[1].icon : items[1].iconOutline"
              class="h-5.5 w-5.5 transition-colors"
              :class="activeIndex === 1 ? 'text-[#3082e3]' : 'text-slate-400'"
            />
            <span
              class="text-[10px] leading-none transition-colors"
              :class="activeIndex === 1 ? 'font-bold text-[#3082e3]' : 'font-medium text-slate-400'"
            >
              {{ items[1].label }}
            </span>
          </button>

          <!-- Hueco central para el FAB -->
          <div></div>

          <!-- Chat -->
          <button
            type="button"
            @click="goTo(items[2].path)"
            class="relative z-10 flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-90"
          >
            <component
              :is="activeIndex === 2 ? items[2].icon : items[2].iconOutline"
              class="h-5.5 w-5.5 transition-colors"
              :class="activeIndex === 2 ? 'text-[#3082e3]' : 'text-slate-400'"
            />
            <span
              class="text-[10px] leading-none transition-colors"
              :class="activeIndex === 2 ? 'font-bold text-[#3082e3]' : 'font-medium text-slate-400'"
            >
              {{ items[2].label }}
            </span>
          </button>

          <!-- Perfil -->
          <button
            type="button"
            @click="goTo(items[3].path)"
            class="relative z-10 flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-90"
          >
            <component
              :is="activeIndex === 3 ? items[3].icon : items[3].iconOutline"
              class="h-5.5 w-5.5 transition-colors"
              :class="activeIndex === 3 ? 'text-[#3082e3]' : 'text-slate-400'"
            />
            <span
              class="text-[10px] leading-none transition-colors"
              :class="activeIndex === 3 ? 'font-bold text-[#3082e3]' : 'font-medium text-slate-400'"
            >
              {{ items[3].label }}
            </span>
          </button>
        </div>
      </div>

      <!-- FAB central: crear reporte (acción, no navegación → color coral distintivo) -->
      <button
        type="button"
        @click="goTo('/report/nuevo')"
        aria-label="Crear reporte"
        class="absolute left-1/2 -top-5 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full text-white shadow-[0_10px_22px_rgba(242,130,109,0.45)] transition-transform active:scale-90"
        :class="isFabActive ? 'bg-[#3082e3] ring-4 ring-[#f2826d]/25' : 'bg-[#3082e3]'"
      >
        <PlusIcon class="h-7 w-7" />
      </button>
    </div>
  </nav>
</template>