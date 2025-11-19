<script setup>
import { ref} from "vue";
import { useRouter } from "vue-router";
import { subscribeToUserState } from "../services/auth";
import AppH1 from "../components/AppH1.vue";
import MapSearchPicker from "../components/MapSearchPicker.vue";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/solid";

// --- Datos del formulario ---
const categoria = ref("");
const ubicacion = ref("");
const coords = ref(null);
const errorMessage = ref("");
const router = useRouter();



// --- Datos del usuario ---
const user = ref({ id: null, email: null });

subscribeToUserState((newUserData) => {
  user.value = newUserData;
});



</script>

<template>
  <div class="max-w-xl mx-auto mt-4 pb-24">
    <AppH1 class="text-2xl font-bold mb-6">Información útil</AppH1>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- MAPA -->
      <div>
        <label class="block mb-1 font-semibold">Ubicación</label>
        <MapSearchPicker
          v-model="coords"
          height="230px"
          @resolved-address="ubicacion = $event"
        />
       
      </div>

      <!-- CATEGORÍA -->
      <div>
        <label class="block mb-2 font-semibold">Categoría de búsqueda</label>
        <select
          v-model="categoria"
          class="w-full mt-1 border rounded px-2 py-2"
        >
          <option disabled value="">Elegí una categoría</option>
          <option>Comuna</option>
          <option>Barrio</option>
          <option>Comisaría</option>
          <option>Hospital</option>
          <option>Comisaría vecinal</option>
        </select>
      </div>

    </form>

  </div>


</template>

<style scoped>

</style>