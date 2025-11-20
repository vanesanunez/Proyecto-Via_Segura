<script setup>
import { ref } from "vue"

// Solo las imágenes del carrusel de bienvenida
const slides = [
  new URL("/carrousel-01.png", import.meta.url).href,
  new URL("/carrousel-02.png", import.meta.url).href,
  new URL("/carrousel-03.png", import.meta.url).href,
  new URL("/carrousel-04.png", import.meta.url).href,
]

const current = ref(0)

// Controles
function next() {
  current.value = (current.value + 1) % slides.length
}

function prev() {
  current.value = (current.value - 1 + slides.length) % slides.length
}
</script>

<template>
  <div class="max-w-md mx-auto mt-6 relative">
    <!-- Caja -->
    <div class="overflow-hidden rounded-2xl bg-white shadow p-2 h-64 flex items-center justify-center">
      <img
        :src="slides[current]"
        alt="slide"
        class="object-contain w-full h-full rounded-xl "
      />
    </div>

    <!-- Flechas -->
    <button
      @click="prev"
      class="absolute left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow"
    >
      ‹
    </button>

    <button
      @click="next"
      class="absolute right-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow"
    >
      ›
    </button>

    <!-- Dots -->
    <div class="flex justify-center gap-2 mt-3">
      <span
        v-for="(s, i) in slides"
        :key="i"
        :class="i === current ? 'w-2 h-2 rounded-full bg-brandBlue' : 'w-2 h-2 rounded-full bg-gray-300'"
      />
    </div>
  </div>
</template>