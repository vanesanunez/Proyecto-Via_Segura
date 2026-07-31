<!-- <script>
import AppNavbar from "./components/AppNavbar.vue";

export default {
  name: "App",

  components: {
    AppNavbar,
  },

  computed: {
    isAuthPage() {
      return ["/ingresar", "/crear-cuenta"].includes(this.$route.path);
    },
  },
};
</script>

<template>
  <AppNavbar v-if="!isAuthPage" />

  <main :class="isAuthPage ? 'w-full' : 'container mx-auto p-2'">
    <RouterView />
  </main>
</template> -->

<script>
import AppNavbar from "./components/AppNavbar.vue";
import FloatingRouteBar from "./components/FloatingRouteBar.vue";

export default {
  name: "App",

  components: {
    AppNavbar,
    FloatingRouteBar,
  },

  computed: {
    isAuthPage() {
      return ["/ingresar", "/crear-cuenta"].includes(this.$route.path);
    },
  },
};
</script>

<template>
  <AppNavbar v-if="!isAuthPage" />

  <main :class="isAuthPage ? 'w-full' : 'container mx-auto p-2'">
    <RouterView />
  </main>

  <FloatingRouteBar v-if="!isAuthPage" />
</template>