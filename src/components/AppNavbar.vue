<script>
import { RouterLink } from 'vue-router';
import { logout, subscribeToUserState } from '../services/auth';

export default {
  name: 'AppNavbar',
  data() {
    return {
      user: {
        id: null,
        email: null,
      },
      drawer: false,
    };
  },
  methods: {
    handleLogout() {
      logout();
      this.$router.push('/ingresar');
      this.drawer = false;
    },
    toggleDrawer() {
      this.drawer = !this.drawer;
    },
  },
  mounted() {
    subscribeToUserState(newUserState => (this.user = newUserState));
  },
};
</script>

<template>
  <nav
    class="fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-[#3082e3] text-white shadow-md z-50"
  >
    <!-- Sección izquierda: botón + logo -->
    <div class="flex items-center gap-3">
      <!-- Botón hamburguesa (solo mobile) -->
      <button @click="toggleDrawer" class="md:hidden focus:outline-none">
        <svg
          v-if="!drawer"
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Logo -->
      <RouterLink class="text-xl font-semibold" to="/">Vía Segura</RouterLink>
    </div>

    <!-- Menú desktop -->
    <ul class="hidden md:flex gap-4">
      <li><RouterLink to="/">Inicio</RouterLink></li>

      <template v-if="user.id !== null">
        <li><RouterLink to="/chat">Chat</RouterLink></li>
        <li><RouterLink to="/mi-perfil">Mi perfil</RouterLink></li>
       
        <li>
          <form action="#" @submit.prevent="handleLogout">
            <button type="submit">Cerrar sesión</button>
          </form>
        </li>
      </template>

      <template v-else>
        <li><RouterLink to="/ingresar">Ingresar</RouterLink></li>
        <li><RouterLink to="/crear-cuenta">Crear cuenta</RouterLink></li>
      </template>
    </ul>

    <!-- Overlay oscuro (cuando se abre el drawer) -->
    <div
      v-if="drawer"
      @click="drawer = false"
      class="fixed inset-0 bg-black/40 z-40 md:hidden"
    ></div>

    <!-- Drawer lateral (solo mobile) -->
    <transition name="slide">
      <aside
        v-if="drawer"
        class="fixed top-0 left-0 h-full w-3/4 max-w-xs bg-white text-gray-800 z-50 p-6 flex flex-col shadow-lg md:hidden"
      >
        <h2 class="text-lg font-semibold mb-4 text-[#3082e3]">Menú</h2>
        <ul class="flex flex-col gap-4">
          <li><RouterLink @click="drawer = false" to="/">Inicio</RouterLink></li>

          <template v-if="user.id !== null">
              <li><RouterLink @click="drawer = false" to="/reportes">Reportes</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/recorrido-seguro">Recorrido seguro</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/mi-perfil">Perfil</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/contactos">Contactos de confianza</RouterLink></li>
            <li><RouterLink @click="drawer = false" to="/chat">Chat general</RouterLink></li>
            <li><RouterLink @click="drawer = false" to="">Información útil</RouterLink></li>
            
            <li>
              <form action="#" @submit.prevent="handleLogout">
                <button type="submit">Cerrar sesión</button>
              </form>
            </li>
          </template>

          <template v-else>
            <li><RouterLink @click="drawer = false" to="/ingresar">Ingresar</RouterLink></li>
            <li><RouterLink @click="drawer = false" to="/crear-cuenta">Crear cuenta</RouterLink></li>
          </template>
        </ul>
      </aside>
    </transition>
  </nav>

  <!-- separador para compensar la altura del navbar fijo -->
  <div class="h-64px"></div>
</template>

<style scoped>
/* Transición del drawer */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from {
  transform: translateX(-100%);
}
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
