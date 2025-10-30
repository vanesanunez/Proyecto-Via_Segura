<template>
  <div class="max-w-md mx-auto text-center p-6 bg-blue-50 rounded-lg shadow-md mt-8">
    <div class="text-blue-600 text-5xl mb-4">✔️</div>
     <p class="text-gray-700 mb-6">
      Gracias por ayudarnos a mantener la seguridad de la comunidad.<br />
      Tu reporte ha sido enviado y será revisado en breve.
    </p>

    <router-link to="/" class="bg-blue-600 text-white py-2 px-4 rounded block w-full mb-3 hover:bg-blue-700">
      Volver a la página de inicio
    </router-link>

    <router-link to="/report/nuevo" class="bg-coral text-white py-2 px-4 rounded block w-full hover:bg-opacity-90">
      Enviar otro informe
    </router-link>
  </div>
</template>

<style scoped>
.bg-coral {
  background-color: #FF7F50;
}
</style>