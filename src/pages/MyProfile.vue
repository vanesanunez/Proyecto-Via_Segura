<script>
import { RouterLink } from "vue-router";
import AppH1 from "../components/AppH1.vue";
import { subscribeToUserState } from "../services/auth";
import MainLoader from "../components/MainLoader.vue";
import { fetchUserReportsPageWithCount } from "../services/reports";

//Variable para guardar la función de cancelar la suscripción a la autenticación.
let unsubAuth = () => {};

export default {
  name: "MyProfile",
  components: { AppH1, MainLoader },
  data() {
    return {
      user: {
        id: null,
        email: null,
        name: null,
        lastname: null,
        dni: null,
      },
      loading: false,

      myReports: [],
      myPage: 1,
      myPageSize: 2,
      myTotal: 0,
      myLoading: false,
      myError: "",
    };
  },

    methods: {
    async loadMyReports() {
      if (!this.user?.id) return
      this.myLoading = true
      this.myError = ''
      try {
        const { data, count } = await fetchUserReportsPageWithCount({
          userId: this.user.id,
          page: this.myPage,
          pageSize: this.myPageSize
        })
        this.myReports = data
        this.myTotal = count
      } catch (e) {
        console.error(e)
        this.myError = 'No se pudieron cargar tus reportes.'
      } finally {
        this.myLoading = false
      }
    },

    goToMy(p) {
      const totalPages = Math.max(1, Math.ceil(this.myTotal / this.myPageSize))
      if (p < 1 || p > totalPages) return
      this.myPage = p
      this.loadMyReports()
    }
  },

  mounted() {
    unsubAuth = subscribeToUserState(
      (newUserState) => (this.user = newUserState)
    );
  },
  unmounted() {
    unsubAuth();
  },
};
</script>

<template>
  <template v-if="!loading">
    <div class="flex gap-4 items-end">
      <AppH1 class="text-center">Mi perfil</AppH1>
      <RouterLink to="/mi-perfil/editar" class="mb-4 text-blue-700"
        >Editar</RouterLink
      >
    </div>

    <dl>
      <dt class="font-bold mb-2">Email</dt>
      <dd class="mb-4">{{ user.email }}</dd>
      <dt class="font-bold mb-2">Nombre</dt>
      <dd class="mb-4">{{ user.name }}</dd>
      <dt class="font-bold mb-2">Apellido</dt>
      <dd class="mb-4">{{ user.lastname }}</dd>
      <dt class="font-bold mb-2">DNI</dt>
      <dd class="mb-4">{{ user.dni }}</dd>
    </dl>
  </template>

  <div v-else class="flex justify-center items-center h-full">
    <MainLoader />
  </div>

   <!-- Mis reportes -->
  <h2 class="text-xl font-semibold mb-4">Mis reportes</h2>

  <div v-if="myError" class="mb-4 text-red-600">{{ myError }}</div>
  <div v-if="myLoading" class="mb-4 text-gray-500">Cargando…</div>
  <div v-if="!myLoading && myReports.length === 0" class="text-gray-600">
    Todavía no creaste reportes.
  </div>

  <ul class="space-y-4 mb-6">
    <li v-for="r in myReports" :key="r.id"
        class="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-4">
        <img :src="r.imagen" alt="" class="w-14 h-14 rounded-full object-cover" />
        <div>
          <p class="text-sm text-gray-500">{{ new Date(r.created_at).toLocaleString() }}</p>
          <p class="font-semibold">{{ r.categoria }}</p>
          <p class="text-gray-700 text-sm line-clamp-1">{{ r.descripcion }}</p>
          <p class="text-gray-500 text-xs">{{ r.ubicacion }}</p>
        </div>
      </div>
      <RouterLink :to="`/report/${r.id}`" class="text-blue-600 hover:underline text-sm shrink-0">
        Ver detalle
      </RouterLink>
    </li>
  </ul>

  <!-- Paginación de mis reportes -->
  <nav v-if="myTotal > myPageSize" class="flex items-center justify-center gap-2">
    <button @click="goToMy(myPage - 1)"
            :disabled="myPage === 1"
            class="px-3 py-1 rounded border"
            :class="myPage === 1 ? 'text-gray-300 border-gray-200' : 'hover:bg-gray-100 border-gray-300'">
      ‹
    </button>

    <button v-for="p in Math.max(1, Math.ceil(myTotal / myPageSize))" :key="p"
            @click="goToMy(p)"
            class="px-3 py-1 rounded border"
            :class="p === myPage ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-100'">
      {{ p }}
    </button>

    <button @click="goToMy(myPage + 1)"
            :disabled="myPage === Math.max(1, Math.ceil(myTotal / myPageSize))"
            class="px-3 py-1 rounded border"
            :class="myPage === Math.max(1, Math.ceil(myTotal / myPageSize)) ? 'text-gray-300 border-gray-200' : 'hover:bg-gray-100 border-gray-300'">
      ›
    </button>
  </nav>
</template>
