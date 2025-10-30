<script>
import AppH1 from "../components/AppH1.vue";
import SearchBar from "../components/SearchBar.vue";
import ActionCard from "../components/ActionCard.vue";
import ReportCarousel from "../components/ReportCarousel.vue";
import BottomNav from "../components/BottomNav.vue";
import InfoCard from '../components/InfoCard.vue';
import MainLoader from '../components/MainLoader.vue';
import AppHeader from '../components/AppHeader.vue';


const onSearch = (q) => {
  if (!q) return;

  // router.push({ name: 'Reports', query: { q } })
  console.log("buscar:", q);
};

export default {
  name: "Home",
  components: { AppH1, SearchBar, ActionCard, ReportCarousel, BottomNav, InfoCard, MainLoader, AppHeader },
};
</script>

<template>
  <AppH1 class="hidden">¡Bienvenidos a Vía Segura!</AppH1>
  <!-- 
  <div v-if="loading" class="flex justify-center items-center h-full">
    <MainLoader />
    </div> -->

  <div class="min-h-screen pb-28">
    <!-- pb para que no tape bottom nav -->
    <AppHeader />

    <main class="max-w-md mx-auto px-4">
      <!-- <SearchBar @search="onSearch" /> -->


      <section class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <ActionCard title="Hacer un reporte" to="/report/nuevo" accent="blue">
          <template #icon>
            <img src="/mano.png" alt="ícono mano" />
          </template>
        </ActionCard>

        <ActionCard title="Ver reportes" to="/reportes" accent="blue">
          <template #icon>
            <img src="/ojo.png" alt="ícono ojo" />
          </template>
        </ActionCard>

        <ActionCard title="Contactos de confianza" to="/contactos" accent="blue">
          <template #icon>
            <img src="/comunidad.png" alt="ícono comunidad" />
          </template>
        </ActionCard>

        <ActionCard title="Recorrido seguro" to="/recorrido-seguro" accent="blue">
          <template #icon>
            <img src="/ruta.png" alt="ícono ruta" />
          </template>
        </ActionCard>
      </section>


      <div class="mt-6">
        <InfoCard />

      </div>

      <p class="text-center text-sm text-brandCoral mt-6">
        Últimos reportes y novedades cerca tuyo
      </p>

      <ReportCarousel />
      <div class="h-6"></div>
    </main>

    <BottomNav />
  </div>
</template>
