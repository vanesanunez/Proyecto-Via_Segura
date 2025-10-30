<script setup>
import { ref } from 'vue'
const reports = ref([
  { id:1, title:'Robo en la esquina', desc:'Intentaron robarme la mochila en la plaza.'},
  { id:2, title:'Corte de luz', desc:'Sin luz en toda la manzana desde anoche.'},
  { id:3, title:'Calle peligrosa', desc:'Poca iluminación en esta zona.'}
])
const current = ref(0)
const next = () => { if(current.value < reports.value.length-1) current.value++ }
const prev = () => { if(current.value > 0) current.value-- }
</script>

<template>
  <div class="max-w-md mx-auto mt-6 relative">
    <div class="overflow-hidden rounded-2xl h-40 bg-gray-100">
      <div class="w-full h-full flex transition-transform duration-500"
           :style="{ transform: `translateX(-${current * 100}%)` }">
        <div v-for="r in reports" :key="r.id" class="w-full flex-shrink-0 flex items-center justify-center p-4">
          <div class="text-center">
            <p class="font-semibold text-gray-800">{{ r.title }}</p>
            <p class="text-sm text-gray-600 mt-2 px-3">{{ r.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <button @click="prev" class="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow">‹</button>
    <button @click="next" class="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow">›</button>

    <div class="flex justify-center gap-2 mt-2">
      <span v-for="(r,i) in reports" :key="i" :class="i===current? 'w-2 h-2 rounded-full bg-brandBlue': 'w-2 h-2 rounded-full bg-gray-300'"></span>
    </div>
  </div>
</template>