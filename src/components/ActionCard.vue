<script setup>
import { computed } from 'vue'
const props = defineProps({
  title: { type: String, required: true },
  to: { type: String, required: true },
  accent: { type: String, default: 'blue' } // blue | coral | yellow | blue2
})

const accentMap = {
  blue: 'border-4 border-blue-300',
  coral: 'border-4 border-red-300',
  yellow: 'border-4 border-yellow-300',
  blue2: 'border-4 border-sky-300'
}
const classes = computed(() =>  `w-full min-h-[120px] bg-white rounded-2xl shadow-md p-4 sm:p-6 flex flex-col items-center justify-center gap-2 ${accentMap[props.accent] || accentMap.blue}`
)
</script>

<template>
  <router-link :to="to" :class="classes">
    <div class="text-3xl">
      <slot name="icon" />
    </div>
    <div class="text-sm font-semibold text-center">{{ title }}</div>
  </router-link>
</template>