<script setup>
import { ref } from 'vue'
const emit = defineEmits(['search'])
const q = ref('')
const submit = () => {
  emit('search', q.value.trim())
}
</script>

<template>
  <div class="px-4 mt-4 max-w-md mx-auto">
    <form @submit.prevent="submit" class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      <input v-model="q" placeholder="Buscar por tipo de problema o ubicación" 
             class="w-full border rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brandBlue" />
    </form>
    <p class="text-center text-sm text-brandCoral mt-1">Buscar por tipo de problema o ubicación</p>
  </div>
</template>