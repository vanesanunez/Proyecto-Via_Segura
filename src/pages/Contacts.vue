<template>
  <div class="max-w-md mx-auto py-6 px-4">
    <h2 class="text-xl font-semibold text-center mb-6">¿Con quién querés compartir tu ubicación?</h2>

    <p class="text-gray-700 mb-4">Tus contactos de confianza:</p>

    <div v-for="contacto in contactos" :key="contacto.id" class="bg-gray-100 rounded-xl p-4 mb-4 shadow-md flex items-center justify-between">
      <div class="flex items-center">
        <img :src="contacto.foto" alt="Foto de contacto" class="w-12 h-12 rounded-full mr-4 object-cover">
        <div>
          <p class="font-semibold">{{ contacto.nombre }}</p>
          <p class="text-sm text-gray-600">📞 {{ contacto.telefono }}</p>
        </div>
      </div>
      <button class="text-red-500 hover:underline text-sm">Eliminar</button>
    </div>

    <button class="bg-coral text-white py-2 px-4 rounded w-full mt-6 mb-3 hover:bg-opacity-90">
      Compartir mi ubicación 👥
    </button>

    <button class="bg-gray-200 text-gray-700 py-2 px-4 rounded w-full hover:bg-gray-300">
      Continuar sin compartir
    </button>
  </div>
</template>

<script setup>
const contactos = [
  {
    id: 1,
    nombre: 'Caro López',
    telefono: '+5491123659874',
    foto: 'https://randomuser.me/api/portraits/women/1.jpg'
  },
  {
    id: 2,
    nombre: 'Juan Pérez',
    telefono: '+5491123659874',
    foto: 'https://randomuser.me/api/portraits/men/1.jpg'
  }
]
</script>

<style scoped>
.bg-coral {
  background-color: #FF7F50;
}
</style>