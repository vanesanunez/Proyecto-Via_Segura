<script>
import { RouterLink } from "vue-router";
import AppH1 from "../components/AppH1.vue";
import { subscribeToUserState } from "../services/auth";
import MainLoader from "../components/MainLoader.vue";
import { fetchUserReportsPageWithCount } from "../services/reports";
import ReportCard from "../components/ReportCard.vue";
import MainButton from "../components/MainButton.vue";

//Variable para guardar la función de cancelar la suscripción a la autenticación.
let unsubAuth = () => { };

export default {
  name: "MyProfile",
  components: { AppH1, MainLoader, ReportCard, MainButton },
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
      if (!this.user?.id) return;
      this.myLoading = true;
      this.myError = "";
      try {
        const { data, count } = await fetchUserReportsPageWithCount({
          userId: this.user.id,
          page: this.myPage,
          pageSize: this.myPageSize,
        });
        this.myReports = data;
        this.myTotal = count;
      } catch (e) {
        console.error(e);
        this.myError = "No se pudieron cargar tus reportes.";
      } finally {
        this.myLoading = false;
      }
    },

    goToMy(p) {
      const totalPages = Math.max(1, Math.ceil(this.myTotal / this.myPageSize));
      if (p < 1 || p > totalPages) return;
      this.myPage = p;
      this.loadMyReports();
    },
  },

  mounted() {
    unsubAuth = subscribeToUserState((newUserState) => {
      this.user = newUserState;
      if (this.user?.id) {
        this.myPage = 1;
        this.loadMyReports();
      }
    });
  },
};
</script>

<template>
  <div class="p-4">

    <div v-if="!loading">
      <div class="flex gap-4 items-center mt-4">
        <AppH1>Mi perfil</AppH1>

        <div class="w-12 h-12 rounded-full overflow-hidden bg-[#d6e8fb] flex items-center justify-center">
          <img v-if="user.photoURL" :src="user.photoURL" alt="Foto de perfil" class="object-cover w-full h-full" />
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-[#3082e3]" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.79.607 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>

      <div>
        <MainButton>
          <RouterLink to="/mi-perfil/editar" class="text-white">Editar perfil</RouterLink>
        </MainButton>
      </div>

      <dl class="m-2">
        <dt class="font-bold mb-2">Email:</dt>
        <dd class="mb-4">{{ user.email }}</dd>
        <dt class="font-bold mb-2">Nombre:</dt>
        <dd class="mb-4">{{ user.name }}</dd>
        <dt class="font-bold mb-2">Apellido:</dt>
        <dd class="mb-4">{{ user.lastname }}</dd>
        <dt class="font-bold mb-2">DNI</dt>
        <dd class="mb-4">{{ user.dni }}</dd>
      </dl>
    </div>

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
      <ReportCard v-for="r in myReports" :key="r.id" :report="r" :to="`/report/${r.id}`" />
    </ul>

    <!-- Paginación de mis reportes -->
    <nav v-if="myTotal > myPageSize" class="flex items-center justify-center gap-2">
      <button @click="goToMy(myPage - 1)" :disabled="myPage === 1" class="px-3 py-1 rounded border" :class="myPage === 1
          ? 'text-gray-300 border-gray-200'
          : 'hover:bg-gray-100 border-gray-300'
        ">
        ‹
      </button>

      <button v-for="p in Math.max(1, Math.ceil(myTotal / myPageSize))" :key="p" @click="goToMy(p)"
        class="px-3 py-1 rounded border" :class="p === myPage
            ? 'bg-blue-600 text-white border-blue-600'
            : 'border-gray-300 hover:bg-gray-100'
          ">
        {{ p }}
      </button>

      <button @click="goToMy(myPage + 1)" :disabled="myPage === Math.max(1, Math.ceil(myTotal / myPageSize))"
        class="px-3 py-1 rounded border" :class="myPage === Math.max(1, Math.ceil(myTotal / myPageSize))
            ? 'text-gray-300 border-gray-200'
            : 'hover:bg-gray-100 border-gray-300'
          ">
        ›
      </button>
    </nav>
  </div>
</template>
