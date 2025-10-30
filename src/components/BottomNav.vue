<script setup></script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-brandBlue text-white py-3">
    <div class="max-w-md mx-auto grid grid-cols-5 items-center">
      <router-link to="/" class="flex justify-center"></router-link>
      <router-link to="/reportes" class="flex justify-center"></router-link>

      <router-link to="/report/nuevo" class="flex justify-center -mt-8">
        
      </router-link>

      <router-link to="/contactos" class="flex justify-center"></router-link>
      <router-link to="/recorrido-seguro" class="flex justify-center"></router-link>
    </div>
  </nav>
</template>