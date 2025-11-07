<!-- <script>
import { RouterLink } from 'vue-router';
import { logout, subscribeToUserState } from '../services/auth';
import { startListeningShareInvitations, acceptSharedPath, rejectSharedPath } from '../services/path-sharing';

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
      hasNotification: false,
      incomingInvite: null,
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
    openNotifications() {
      // Muestra/oculta el toast de invitación
      if (this.incomingInvite) this.hasNotification = !this.hasNotification;
    },
    acceptInvite() {
      if (!this.incomingInvite) return;
      acceptSharedPath(this.incomingInvite);
      this.incomingInvite = null;
      this.hasNotification = false;
    },
    rejectInvite() {
      if (!this.incomingInvite) return;
      rejectSharedPath(this.incomingInvite.invitation_id);
      this.incomingInvite = null;
      this.hasNotification = false;
    },
  },
  mounted() {
    subscribeToUserState(newUserState => {
      this.user = newUserState;
    });

    // Escuchar invitaciones de recorrido
    startListeningShareInvitations().then(() => {
      window.addEventListener('path-invitation', e => {
        this.incomingInvite = e.detail;
        this.hasNotification = true; // punto rojo en campana
      });
    });
  },
};
</script>

<template>
  <nav
    class="fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-[#3082e3] text-white shadow-md z-50"
  >
    <!-- Izquierda: hamburguesa + logo -->
    <!-- <div class="flex items-center gap-3">
      <button @click="toggleDrawer" class="md:hidden focus:outline-none">
        <svg v-if="!drawer" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <RouterLink class="text-xl font-semibold" to="/">Vía Segura</RouterLink>
    </div> -->

    <!-- Derecha: campana de notificaciones -->
    <!-- <div class="flex items-center gap-4 relative">
      <button v-if="user.id" @click="openNotifications" class="relative focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 002-2H8a2 2 0 002 2z" />
        </svg>
        <span v-if="incomingInvite" class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
      </button>
    </div> -->

    <!-- Menú desktop -->
    <!-- <ul class="hidden md:flex gap-4">
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
    </ul> -->

    <!-- Overlay y drawer -->
    <!-- <div v-if="drawer" @click="drawer = false" class="fixed inset-0 bg-black/40 z-40 md:hidden"></div>

    <transition name="slide">
      <aside v-if="drawer" class="fixed top-0 left-0 h-full w-3/4 max-w-xs bg-white text-gray-800 z-50 flex flex-col shadow-lg md:hidden">
        <!-- CABECERA del Drawer -->
        <!-- <div class="flex items-center justify-between bg-[#f7f9fc] px-6 py-4 border-b">
          <div>
            <p class="text-gray-600 text-sm">¡Hola,</p>
            <p class="text-[#3082e3] font-semibold text-lg">{{ user.name || 'invitado' }}!</p>
          </div>
          <div class="w-12 h-12 rounded-full overflow-hidden bg-[#d6e8fb] flex items-center justify-center">
            <img v-if="user.photoURL" :src="user.photoURL" alt="Foto de perfil" class="object-cover w-full h-full" />
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-[#3082e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.79.607 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div> -->

        <!-- Menú drawer -->
        <!-- <div class="p-6 overflow-y-auto">
          <ul class="flex flex-col gap-3">
            <li><RouterLink @click="drawer = false" to="/" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Inicio</RouterLink></li>
            <template v-if="user.id !== null">
              <li><RouterLink @click="drawer = false" to="/reportes" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Reportes</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/recorrido-seguro" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Recorrido seguro</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/mi-perfil" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Perfil</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/contactos" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Contactos de confianza</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/chat" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Chat general</RouterLink></li>
              <li>
                <form action="#" @submit.prevent="handleLogout">
                  <button type="submit" class="w-full text-left px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Cerrar sesión</button>
                </form>
              </li>
            </template>
            <template v-else>
              <li><RouterLink @click="drawer = false" to="/ingresar" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Ingresar</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/crear-cuenta" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Crear cuenta</RouterLink></li>
            </template>
          </ul>
        </div>
      </aside>
    </transition>
  </nav> --> -->

  <!-- Espacio para no tapar contenido -->
  <!-- <div class="h-16px"></div> -->

  <!-- Toast de invitación arriba -->
  <!-- <div v-if="incomingInvite && hasNotification" class="fixed top-16 right-4 bg-white rounded-lg shadow-lg p-4 z-50 w-80">
    <p class="mb-2"> {{ incomingInvite.sender_name || 'Vanesa Nuñez' }} quiere compartir su recorrido con vos.</p>
    <div class="flex justify-end gap-2">
      <button @click="acceptInvite" class="bg-[#3082e3] text-white px-3 py-1 rounded">Aceptar</button>
      <button @click="rejectInvite" class="bg-[#e8dfdd] text-gray px-3 py-1 rounded rounded-blue">Rechazar</button>
    </div>
  </div>
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
</style> --> 

<!-- components/AppNavbar.vue -->
<script>
import { RouterLink } from "vue-router";
import { logout, subscribeToUserState } from "../services/auth";
import {
  startListeningShareInvitations,
  acceptSharedPath,
  rejectSharedPath,
} from "../services/path-sharing";

export default {
  name: "AppNavbar",
  data() {
    return {
      user: {
        id: null,
        email: null,
        name: null,
        photoURL: null,
      },
      drawer: false,
      hasNotification: false,
      incomingInvite: null,
      _unsubInvitations: null,
    };
  },
  methods: {
    handleLogout() {
      logout();
      this.$router.push("/ingresar");
      this.drawer = false;
    },
    toggleDrawer() {
      this.drawer = !this.drawer;
    },
    openNotifications() {
      if (this.incomingInvite) this.hasNotification = !this.hasNotification;
    },
    async acceptInvite() {
      if (!this.incomingInvite) return;
      try {
        // actualizar estado en DB
        await acceptSharedPath({
          sharer_id: this.incomingInvite.sharer_id,
          path_id: this.incomingInvite.path_id,
          invitation_id: this.incomingInvite.invitation_id,
        });

        // navegar a la vista de seguimiento (pasamos sharer y path)
        const pathId = this.incomingInvite.path_id;
        const sharerId = this.incomingInvite.sharer_id;

        // limpiar UI
        this.incomingInvite = null;
        this.hasNotification = false;

        // navegar
        this.$router.push({ name: "ViewSharedPath", params: { path_id: pathId }, query: { sharer_id: sharerId } });
      } catch (err) {
        console.error("Error aceptando invitación:", err);
      }
    },
    async rejectInvite() {
      if (!this.incomingInvite) return;
      try {
        await rejectSharedPath(this.incomingInvite.invitation_id);
        this.incomingInvite = null;
        this.hasNotification = false;
      } catch (err) {
        console.error("Error rechazando invitación:", err);
      }
    },
  },
  mounted() {
    // escuchar estado de usuario
    subscribeToUserState((newUserState) => {
      this.user = newUserState || { id: null, email: null, name: null };
    });

    // suscribirse a invitaciones (callback)
    startListeningShareInvitations((invite) => {
      this.incomingInvite = invite;
      this.hasNotification = true; // punto rojo en campana
    }).then((unsubscribe) => {
      // guardar unsubscribe para usar al destruir el componente
      this._unsubInvitations = unsubscribe;
    });
  },
  beforeUnmount() {
    if (typeof this._unsubInvitations === "function") this._unsubInvitations();
  },
};
</script>

<template>
  <nav class="fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-[#3082e3] text-white shadow-md z-50">
    <div class="flex items-center gap-3">
      <button @click="toggleDrawer" class="md:hidden focus:outline-none">
        <svg v-if="!drawer" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <RouterLink class="text-xl font-semibold" to="/">Vía Segura</RouterLink>
    </div>

    <div class="flex items-center gap-4 relative">
      <button v-if="user.id" @click="openNotifications" class="relative focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 002-2H8a2 2 0 002 2z" />
        </svg>
        <span v-if="incomingInvite" class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
      </button>
    </div>

    <ul class="hidden md:flex gap-4">
      <li><RouterLink to="/">Inicio</RouterLink></li>

      <template v-if="user.id !== null">
        <li><RouterLink to="/chat">Chat</RouterLink></li>
        <li><RouterLink to="/mi-perfil">Mi perfil</RouterLink></li>
        <li>
          <form action="#" @submit.prevent="handleLogout"><button type="submit">Cerrar sesión</button></form>
        </li>
      </template>

      <template v-else>
        <li><RouterLink to="/ingresar">Ingresar</RouterLink></li>
        <li><RouterLink to="/crear-cuenta">Crear cuenta</RouterLink></li>
      </template>
    </ul>

    <!-- Drawer (igual que tenías) -->
    <div v-if="drawer" @click="drawer = false" class="fixed inset-0 bg-black/40 z-40 md:hidden"></div>

    <transition name="slide">
      <aside v-if="drawer" class="fixed top-0 left-0 h-full w-3/4 max-w-xs bg-white text-gray-800 z-50 flex flex-col shadow-lg md:hidden">
        <div class="flex items-center justify-between bg-[#f7f9fc] px-6 py-4 border-b">
          <div>
            <p class="text-gray-600 text-sm">¡Hola,</p>
            <p class="text-[#3082e3] font-semibold text-lg">{{ user.name || 'invitado' }}!</p>
          </div>
          <div class="w-12 h-12 rounded-full overflow-hidden bg-[#d6e8fb] flex items-center justify-center">
            <img v-if="user.photoURL" :src="user.photoURL" alt="Foto de perfil" class="object-cover w-full h-full" />
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-[#3082e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.79.607 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <div class="p-6 overflow-y-auto">
          <ul class="flex flex-col gap-3">
            <li><RouterLink @click="drawer = false" to="/" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Inicio</RouterLink></li>
            <template v-if="user.id !== null">
              <li><RouterLink @click="drawer = false" to="/reportes" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Reportes</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/recorrido-seguro" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Recorrido seguro</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/mi-perfil" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Perfil</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/contactos" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Contactos de confianza</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/chat" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Chat general</RouterLink></li>
              <li>
                <form action="#" @submit.prevent="handleLogout">
                  <button type="submit" class="w-full text-left px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Cerrar sesión</button>
                </form>
              </li>
            </template>
            <template v-else>
              <li><RouterLink @click="drawer = false" to="/ingresar" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Ingresar</RouterLink></li>
              <li><RouterLink @click="drawer = false" to="/crear-cuenta" class="block px-3 py-2 rounded-lg hover:bg-[#d6e8fb] transition">Crear cuenta</RouterLink></li>
            </template>
          </ul>
        </div>
      </aside>
    </transition>

    <!-- Toast de invitación -->
    <div v-if="incomingInvite && hasNotification" class="fixed top-16 right-4 bg-white rounded-lg shadow-lg p-4 z-50 w-80">
      <p class="mb-2"> {{ incomingInvite.sender_name || 'Alguien' }} quiere compartir su recorrido con vos.</p>
      <div class="flex justify-end gap-2">
        <button @click="acceptInvite" class="bg-[#3082e3] text-white px-3 py-1 rounded">Aceptar</button>
        <button @click="rejectInvite" class="bg-[#e8dfdd] text-gray px-3 py-1 rounded">Rechazar</button>
      </div>
    </div>
  </nav>
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


