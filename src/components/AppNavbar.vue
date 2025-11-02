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
        name: null,
        photoURL: null,
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

    <!-- Overlay oscuro -->
    <div
      v-if="drawer"
      @click="drawer = false"
      class="fixed inset-0 bg-black/40 z-40 md:hidden"
    ></div>

    <!-- Drawer lateral (solo mobile) -->
    <transition name="slide">
      <aside
        v-if="drawer"
        class="fixed top-0 left-0 h-full w-3/4 max-w-xs bg-white text-gray-800 z-50 flex flex-col shadow-lg md:hidden"
      >
        <!-- CABECERA del Drawer -->
        <div class="flex items-center justify-between bg-[#f7f9fc] px-6 py-4 border-b">
          <div>
            <p class="text-gray-600 text-sm">¡Hola,</p>
            <p class="text-[#3082e3] font-semibold text-lg">
              {{ user.name || 'invitado' }}!
            </p>
          </div>
          <div class="w-12 h-12 rounded-full overflow-hidden bg-[#d6e8fb] flex items-center justify-center">
            <img
              v-if="user.photoURL"
              :src="user.photoURL"
              alt="Foto de perfil"
              class="object-cover w-full h-full"
            />
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-7 w-7 text-[#3082e3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.79.607 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>

        <!-- Menú -->
        <div class="p-6 overflow-y-auto">
          <ul class="flex flex-col gap-3">
            <li>
              <RouterLink
                @click="drawer = false"
                to="/"
                class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition"
              >Inicio</RouterLink>
            </li>

            <template v-if="user.id !== null">
              <li>
                <RouterLink
                  @click="drawer = false"
                  to="/reportes"
                  class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition"
                >Reportes</RouterLink>
              </li>
              <li>
                <RouterLink
                  @click="drawer = false"
                  to="/recorrido-seguro"
                  class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition"
                >Recorrido seguro</RouterLink>
              </li>
              <li>
                <RouterLink
                  @click="drawer = false"
                  to="/mi-perfil"
                  class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition"
                >Perfil</RouterLink>
              </li>
              <li>
                <RouterLink
                  @click="drawer = false"
                  to="/contactos"
                  class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition"
                >Contactos de confianza</RouterLink>
              </li>
              <li>
                <RouterLink
                  @click="drawer = false"
                  to="/chat"
                  class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition"
                >Chat general</RouterLink>
              </li>
              <li>
                <RouterLink
                  @click="drawer = false"
                  to=""
                  class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition"
                >Información útil</RouterLink>
              </li>

              <li>
                <form action="#" @submit.prevent="handleLogout">
                  <button
                    type="submit"
                    class="w-full text-left px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </li>
            </template>

            <template v-else>
              <li>
                <RouterLink
                  @click="drawer = false"
                  to="/ingresar"
                  class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition"
                >Ingresar</RouterLink>
              </li>
              <li>
                <RouterLink
                  @click="drawer = false"
                  to="/crear-cuenta"
                  class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition"
                >Crear cuenta</RouterLink>
              </li>
            </template>
          </ul>
        </div>
      </aside>
    </transition>
  </nav>

  <!-- Espaciador para compensar el navbar fijo -->
  <div class="h-64px"></div>
</template>

<style scoped>
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


