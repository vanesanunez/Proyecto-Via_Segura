<script>
import AppH1 from "../components/AppH1.vue";
import SearchBar from "../components/SearchBar.vue";
import ActionCard from "../components/ActionCard.vue";
import ReportCarousel from "../components/ReportCarousel.vue";
import BottomNav from "../components/BottomNav.vue";
import InfoCard from "../components/InfoCard.vue";
import MainLoader from "../components/MainLoader.vue";
import BottomNavigation from "../components/BottomNavigation.vue";
import ReportCard from "../components/ReportCard.vue";
import {
  PlusCircleIcon,
  EyeIcon,
  UsersIcon,
  MapIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/solid";

export default {
  name: "Home",
  components: {
    AppH1,
    SearchBar,
    ActionCard,
    ReportCarousel,
    BottomNav,
    InfoCard,
    MainLoader,
    BottomNavigation,
    ReportCard,
    PlusCircleIcon,
    EyeIcon,
    UsersIcon,
    MapIcon,
    InformationCircleIcon,
  },
};
</script>

<template>
  <AppH1 class="hidden">¡Bienvenidos a Vía Segura!</AppH1>

  <div>
    <main class="max-w-md mx-auto px-4">
      <!-- ILUSTRACIÓN + TEXTO DE BIENVENIDA -->
      <div class="text-center mt-6 mb-6 px-4">
        <img
          src="/map.png"
          alt="Ilustración Vía Segura"
          class="mx-auto w-52 sm:w-60 drop-shadow-sm" />

        <h2 class="text-xl font-semibold text-gray-800 mt-4">
          Cuidémonos entre todos
        </h2>

        <p class="text-sm text-gray-600 mt-1">
          Descubrí reportes cercanos y compartí información útil.
        </p>
      </div>
      <section class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <ActionCard title="Hacer un reporte" to="/report/nuevo" accent="blue">
          <template #icon>
            <PlusCircleIcon class="h-9 w-9 text-[#3082e3]" />
          </template>
        </ActionCard>

        <ActionCard title="Ver reportes" to="/reportes" accent="blue">
          <template #icon>
            <EyeIcon class="h-9 w-9 text-[#3082e3]" />
          </template>
        </ActionCard>

        <ActionCard
          title="Contactos de confianza"
          to="/contactos"
          accent="blue"
        >
          <template #icon>
            <UsersIcon class="h-8 w-8 text-[#3082e3]" />
          </template>
        </ActionCard>

        <ActionCard title="Recorrido seguro" to="/compartir" accent="blue">
          <template #icon>
            <MapIcon class="h-8 w-8 text-[#3082e3]" />
          </template>
        </ActionCard>

        <ActionCard title="Info útil" to="/info" accent="blue">
          <template #icon>
            <PlusCircleIcon class="h-9 w-9 text-[#3082e3]" />
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

    <BottomNavigation />
  </div>
</template>
