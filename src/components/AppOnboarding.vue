<script>
import { XMarkIcon } from "@heroicons/vue/24/outline";

export default {
  name: "AppOnboarding",

  components: {
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
          title: "Bienvenido a",
          brandTitle: "Vía Segura",
          description:
            "Conocé las herramientas que te ayudan a moverte con más tranquilidad.",
        },
        {
          image: "/onboarding/reporte.png",
          alt: "Personas realizando reportes",
          title: "Realizá reportes",
          brandTitle: "",
          description:
            "Informá problemas de iluminación, infraestructura o seguridad en tu zona.",
        },
        {
          image: "/onboarding/recorrido.png",
          alt: "Persona utilizando un mapa para realizar un recorrido seguro",
          title: "Recorrido seguro",
          brandTitle: "",
          description:
            "Planificá y compartí tu trayecto para moverte con mayor tranquilidad.",
        },
        {
          image: "/onboarding/novedades.png",
          alt: "Persona recibiendo novedades en su teléfono",
          title: "Recibí novedades",
          brandTitle: "",
          description:
            "Mantenete al tanto de reportes, alertas y actualizaciones importantes.",
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
      class="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f2d5c]/55 px-3 py-3 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <section
        class="relative flex max-h-[calc(100dvh-24px)] min-h-[620px] w-full max-w-[410px] flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_24px_65px_rgba(15,45,92,0.24)]"
      >
        <!-- Botón saltar -->
        <div class="flex justify-end px-5 pt-5">
          <button
            type="button"
            class="relative z-20 flex h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold text-[#3082e3] transition hover:bg-[#eef4ff] hover:text-[#085baf]"
            aria-label="Saltar introducción"
            @click="finishOnboarding"
          >
            <span>Saltar</span>
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>

        <!-- Contenido deslizable -->
        <div class="min-h-0 flex-1 overflow-y-auto">
          <Transition
            mode="out-in"
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="translate-x-6 opacity-0"
            enter-to-class="translate-x-0 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="translate-x-0 opacity-100"
            leave-to-class="-translate-x-6 opacity-0"
          >
            <div :key="currentSlide" class="px-5 pb-4">
              <!-- Imagen integrada -->
              <div class="mt-2 flex h-[280px] items-center justify-center">
                <img
                  :src="activeSlide.image"
                  :alt="activeSlide.alt"
                  class="h-[245px] w-[245px] object-contain"
                />
              </div>

              <!-- Título y descripción -->
              <div class="pt-6">
                <h2
                  id="onboarding-title"
                  class="text-center text-[27px] font-bold leading-tight"
                >
                  <span
                    class="block"
                    :class="
                      activeSlide.brandTitle
                        ? 'text-[#2a2a2a]'
                        : 'text-[#3082e3]'
                    "
                  >
                    {{ activeSlide.title }}
                  </span>

                  <span
                    v-if="activeSlide.brandTitle"
                    class="mt-1 block text-[#3082e3]"
                  >
                    {{ activeSlide.brandTitle }}
                  </span>
                </h2>

                <!-- Texto alineado a la izquierda -->
                <p
                  class="mt-4 w-full text-left text-sm leading-6 text-slate-500"
                >
                  {{ activeSlide.description }}
                </p>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Navegación inferior -->
        <div class="bg-white px-5 pb-6 pt-3">
          <!-- Indicadores -->
          <div class="mb-5 flex items-center justify-center gap-3">
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

          <!-- Botón principal -->
          <button
            type="button"
            class="flex h-[54px] w-full items-center justify-center rounded-2xl bg-[#3082e3] px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(48,130,227,0.25)] transition hover:bg-[#085baf] active:scale-[0.98]"
            @click="nextSlide"
          >
            {{ isLastSlide ? "Empezar" : "Siguiente" }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
