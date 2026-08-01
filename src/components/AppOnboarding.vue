<script>
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";

export default {
  name: "AppOnboarding",

  components: {
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
  },

  emits: ["finish"],

  data() {
    return {
      currentSlide: 0,
      previousBodyOverflow: "",

      slides: [
        {
          image: "/onboarding/bienvenida.png",
          alt: "Bienvenida a Vía Segura",
          title: "Bienvenida a Vía Segura",
          description:
            "Conocé las herramientas que te ayudan a moverte con más tranquilidad.",
        },
        {
          image: "/onboarding/reportes.png",
          alt: "Personas realizando reportes",
          title: "Realizá reportes",
          description:
            "Avisá sobre problemas de iluminación, infraestructura o seguridad.",
        },
        {
          image: "/onboarding/recorrido.png",
          alt: "Persona utilizando un mapa para realizar un recorrido seguro",
          title: "Compartí tu recorrido",
          description:
            "Elegí un contacto de confianza y compartí tu trayecto mientras llegás a destino.",
        },
        {
          image: "/onboarding/novedades.png",
          alt: "Persona recibiendo novedades en su teléfono",
          title: "Recibí novedades",
          description:
            "Enterate de reportes, invitaciones y cambios importantes desde la app.",
        },
      ],
    };
  },

  computed: {
    activeSlide() {
      return this.slides[this.currentSlide];
    },

    isFirstSlide() {
      return this.currentSlide === 0;
    },

    isLastSlide() {
      return this.currentSlide === this.slides.length - 1;
    },
  },

  methods: {
    nextSlide() {
      if (this.isLastSlide) {
        this.finishOnboarding();
        return;
      }

      this.currentSlide += 1;
    },

    previousSlide() {
      if (!this.isFirstSlide) {
        this.currentSlide -= 1;
      }
    },

    finishOnboarding() {
      this.$emit("finish");
    },

    handleKeydown(event) {
      if (event.key === "ArrowRight") {
        this.nextSlide();
      }

      if (event.key === "ArrowLeft") {
        this.previousSlide();
      }

      if (event.key === "Escape") {
        this.finishOnboarding();
      }
    },
  },

  mounted() {
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", this.handleKeydown);
  },

  beforeUnmount() {
    document.body.style.overflow = this.previousBodyOverflow;

    window.removeEventListener("keydown", this.handleKeydown);
  },
};
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f2d5c]/55 px-4 py-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <section
        class="relative w-full max-w-[410px] overflow-hidden rounded-[30px] border border-white/70 bg-[#f7f9f6] shadow-[0_24px_65px_rgba(15,45,92,0.24)]"
      >
        <!-- Saltar / cerrar -->
        <button
          type="button"
          class="absolute right-4 top-4 z-20 flex h-10 items-center gap-1 rounded-full bg-white/90 px-3 text-sm font-semibold text-slate-500 shadow-sm transition hover:text-[#3082e3]"
          aria-label="Saltar introducción"
          @click="finishOnboarding"
        >
          <span>Saltar</span>
          <XMarkIcon class="h-4 w-4" />
        </button>

        <!-- Contenido del paso -->
        <Transition
          mode="out-in"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="translate-x-6 opacity-0"
          enter-to-class="translate-x-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="translate-x-0 opacity-100"
          leave-to-class="-translate-x-6 opacity-0"
        >
          <div :key="currentSlide">
            <!-- Imagen -->
            <div
              class="flex min-h-[245px] items-center justify-center bg-white px-4 pb-2 pt-14"
            >
              <img
                :src="activeSlide.image"
                :alt="activeSlide.alt"
                class="max-h-[230px] w-full object-contain"
              />
            </div>

            <!-- Texto accesible y explicativo -->
            <div class="px-6 pb-4 pt-5 text-center">
              <h2
                id="onboarding-title"
                class="text-[24px] font-bold leading-tight text-[#2a2a2a]"
              >
                {{ activeSlide.title }}
              </h2>

              <p
                class="mx-auto mt-3 max-w-[310px] text-sm leading-6 text-slate-500"
              >
                {{ activeSlide.description }}
              </p>
            </div>
          </div>
        </Transition>

        <!-- Indicadores -->
        <div class="flex items-center justify-center gap-2 px-6 py-3">
          <button
            v-for="(slide, index) in slides"
            :key="slide.title"
            type="button"
            class="h-2.5 rounded-full transition-all duration-300"
            :class="
              index === currentSlide
                ? 'w-7 bg-[#3082e3]'
                : 'w-2.5 bg-[#d6e8fb]'
            "
            :aria-label="`Ir al paso ${index + 1}`"
            @click="currentSlide = index"
          ></button>
        </div>

        <!-- Botones -->
        <div class="flex items-center gap-3 px-6 pb-6 pt-2">
          <button
            type="button"
            class="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-[#d6e8fb] bg-white text-[#3082e3] transition hover:bg-[#eef4ff] disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="isFirstSlide"
            aria-label="Paso anterior"
            @click="previousSlide"
          >
            <ChevronLeftIcon class="h-5 w-5" />
          </button>

          <button
            type="button"
            class="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#3082e3] px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(48,130,227,0.25)] transition hover:bg-[#085baf] active:scale-[0.98]"
            @click="nextSlide"
          >
            <span>
              {{
                isLastSlide
                  ? "Empezar a usar Vía Segura"
                  : "Siguiente"
              }}
            </span>

            <ChevronRightIcon
              v-if="!isLastSlide"
              class="h-5 w-5"
            />
          </button>
        </div>

        <p class="pb-5 text-center text-xs font-medium text-slate-400">
          Paso {{ currentSlide + 1 }} de {{ slides.length }}
        </p>
      </section>
    </div>
  </Teleport>
</template>