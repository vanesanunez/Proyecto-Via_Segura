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

const route = useRoute();
const router = useRouter();

// Los 4 destinos que participan del indicador (el FAB central queda
// afuera: es una acción — crear reporte —, no una sección de navegación).
const items = [
  { label: "Inicio", path: "/", icon: HomeIcon },
  { label: "Rutas", path: "/compartir", icon: MapPinIcon },
  { label: "Chat", path: "/chat", icon: ChatBubbleLeftEllipsisIcon },
  { label: "Perfil", path: "/mi-perfil", icon: UserIcon },
];

// Índice del item activo según la ruta actual. startsWith para que
// subrutas (ej. /mi-perfil/editar) también marquen "Perfil" como activo.
const activeIndex = computed(() => {
  if (route.path === "/") return 0;
  return items.findIndex((item, i) => i !== 0 && route.path.startsWith(item.path));
});

const isFabActive = computed(() => route.path.startsWith("/report/nuevo"));

// Posición del indicador: saltea la columna del medio (FAB) al calcular
// el desplazamiento horizontal entre las 5 columnas de la grilla.
const indicatorOffset = computed(() => {
  const i = activeIndex.value;
  if (i === -1) return 0;
  return i < 2 ? i : i + 1;
});

function goTo(path) {
  if (route.path !== path) router.push(path);
}
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
    <div class="relative mx-auto max-w-md">
      <!-- Barra flotante en azul de marca -->
      <div
        class="relative overflow-hidden rounded-[28px] bg-[#3082e3] px-2 shadow-[0_16px_34px_rgba(15,45,92,0.35)]"
      >
        <div class="relative grid h-[74px] grid-cols-5">
          <!-- Línea de brillo que marca la sección activa -->
          <div
            class="pointer-events-none absolute top-0 h-[3px] rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.65)] transition-all duration-300 ease-out"
            :class="activeIndex === -1 ? 'opacity-0' : 'opacity-100'"
            :style="{
              width: 'calc(20% - 20px)',
              left: `calc(${indicatorOffset * 20}% + 10px)`,
            }"
          ></div>

          <!-- Inicio -->
          <button
            type="button"
            @click="goTo(items[0].path)"
            class="relative z-10 flex flex-col items-center justify-center gap-1 pt-1 transition-transform active:scale-90"
          >
            <component
              :is="items[0].icon"
              class="h-5.5 w-5.5 transition-colors duration-200"
              :class="activeIndex === 0 ? 'text-white' : 'text-white/45'"
            />
            <span
              class="text-[11px] leading-none transition-colors duration-200"
              :class="activeIndex === 0 ? 'font-bold text-white' : 'font-medium text-white/45'"
            >
              {{ items[0].label }}
            </span>
          </button>

          <!-- Rutas -->
          <button
            type="button"
            @click="goTo(items[1].path)"
            class="relative z-10 flex flex-col items-center justify-center gap-1 pt-1 transition-transform active:scale-90"
          >
            <component
              :is="items[1].icon"
              class="h-5.5 w-5.5 transition-colors duration-200"
              :class="activeIndex === 1 ? 'text-white' : 'text-white/45'"
            />
            <span
              class="text-[11px] leading-none transition-colors duration-200"
              :class="activeIndex === 1 ? 'font-bold text-white' : 'font-medium text-white/45'"
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
            class="relative z-10 flex flex-col items-center justify-center gap-1 pt-1 transition-transform active:scale-90"
          >
            <component
              :is="items[2].icon"
              class="h-5.5 w-5.5 transition-colors duration-200"
              :class="activeIndex === 2 ? 'text-white' : 'text-white/45'"
            />
            <span
              class="text-[11px] leading-none transition-colors duration-200"
              :class="activeIndex === 2 ? 'font-bold text-white' : 'font-medium text-white/45'"
            >
              {{ items[2].label }}
            </span>
          </button>

          <!-- Perfil -->
          <button
            type="button"
            @click="goTo(items[3].path)"
            class="relative z-10 flex flex-col items-center justify-center gap-1 pt-1 transition-transform active:scale-90"
          >
            <component
              :is="items[3].icon"
              class="h-5.5 w-5.5 transition-colors duration-200"
              :class="activeIndex === 3 ? 'text-white' : 'text-white/45'"
            />
            <span
              class="text-[11px] leading-none transition-colors duration-200"
              :class="activeIndex === 3 ? 'font-bold text-white' : 'font-medium text-white/45'"
            >
              {{ items[3].label }}
            </span>
          </button>
        </div>
      </div>

      <!-- FAB central: crear reporte (acción, no navegación → coral distintivo) -->
      <button
        type="button"
        @click="goTo('/report/nuevo')"
        aria-label="Crear reporte"
        class="absolute left-1/2 -top-5 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full text-white shadow-[0_10px_22px_rgba(242,130,109,0.45)] ring-4 ring-[#f7f9f6] transition-transform active:scale-90"
        :class="isFabActive ? 'bg-[#3082e3]' : 'bg-[#3082e3]'"
      >
        <PlusIcon class="h-7 w-7" />
      </button>
    </div>
  </nav>
</template>
