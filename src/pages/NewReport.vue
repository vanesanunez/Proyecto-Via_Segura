<script setup>
import { ref,computed} from "vue";
import { useRouter } from "vue-router";
import { uploadImage, saveReport,  searchSimilarReports, joinReport} from "../services/reports";
import { subscribeToUserState } from "../services/auth";
import MapSearchPicker from "../components/MapSearchPicker.vue";

// Datos del formulario
const categoria = ref("");
const descripcion = ref("");
const ubicacion = ref("");
const coords = ref(null);
const imagen = ref(null);
const errorMessage = ref("");
const router = useRouter();

// nombre del archivo para mostrar en el texto 
const selectedFileName = computed(() =>
  imagen.value ? imagen.value.name : ""
);

// NUEVO: estado para "reportes similares" 
const similares = ref([]);
const viendoSimilares = ref(false);
const buscandoSimilares = ref(false);
const errorSimilares = ref("");


// Datos del usuario
const user = ref({
  id: null,
  email: null,
});

subscribeToUserState((newUserData) => {
  user.value = newUserData;
});

function onFileChange(e) {
  const file = e.target.files[0];
  if (file) {
    imagen.value = file;
  } else {
    imagen.value = null;
  }
}

// Buscar reportes parecidos por categoría + ubicación
async function  findSimilarReports() {
  viendoSimilares.value = false;
  errorSimilares.value = "";
  similares.value = [];
  buscandoSimilares.value = true;

  try {
    const lista = await searchSimilarReports({
      categoria: categoria.value,
      ubicacion: ubicacion.value,
    });

    similares.value = lista;
    // solo muestro el bloque si encontré algo
    viendoSimilares.value = lista.length > 0;
  } catch (e) {
    console.error(e);
    errorSimilares.value = "No se pudieron buscar reportes similares.";
  } finally {
    buscandoSimilares.value = false;
  }
}

// "Sumarme" a un reporte existente (sumar 1 a apoyos)
async function  joinExistingReport(reporte) {
  try {
    await joinReport(reporte.id);
    alert("Te sumaste al reclamo de ese reporte.");
    // opcional: actualizar la lista en pantalla sumando 1
    const item = similares.value.find((r) => r.id === reporte.id);
    if (item) {
      item.apoyos = (item.apoyos || 0) + 1;
    }
  } catch (e) {
    console.error(e);
    alert("No se pudo sumar al reclamo. Intentalo de nuevo.");
  }
}

// Manejador de envío (crear reporte nuevo)
async function handleSubmit() {
  try {
    if (
      !categoria.value ||
      !descripcion.value ||
      !ubicacion.value ||
      !imagen.value
    ) {
      errorMessage.value =
        "Por favor completá todos los campos y subí una imagen.";
      return;
    }

    const imageUrl = await uploadImage(imagen.value);

    await saveReport({
      categoria: categoria.value,
      descripcion: descripcion.value,
      ubicacion: ubicacion.value,
      latitud: coords.value.lat,
      longitud: coords.value.lng,
      imagen: imageUrl,
      user_id: user.value.id,
      email: user.value.email,
    });

    // Redirigir al confirmar
    router.push("/report/confirmado");
  } catch (error) {
    errorMessage.value = "No se pudo enviar el reporte. Intentalo de nuevo.";
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto mt-4">
    <h1 class="text-2xl font-bold mb-6">Nuevo Reporte</h1>

    <form @submit.prevent="handleSubmit">
      <!-- MAPA + Buscador -->
      <div class="mb-4">
        <label class="block mb-1 font-semibold">Ubicación</label>
        <MapSearchPicker
          v-model="coords"
          height="230px"
          @resolved-address="ubicacion = $event"
        />
        <div class="text-sm text-gray-600 mt-2" v-if="coords">
          Punto: {{ coords.lat?.toFixed(5) }}, {{ coords.lng?.toFixed(5) }}
        </div>
      </div>

      <div class="mb-4">
        <label class="block mb-2">
          Categoría del problema
          <select
            v-model="categoria"
            class="w-full mt-1 border rounded px-2 py-1"
          >
            <option disabled value="">Elegí una categoría</option>
            <option>Iluminación</option>
            <option>Infraestructura</option>
            <option>Seguridad</option>
          </select>
        </label>
      </div>

      <div class="mb-4">
        <button
          type="button"
          @click="findSimilarReports"
          class="text-sm px-3 py-2 rounded border border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          Buscar reportes similares
        </button>

        <div v-if="buscandoSimilares" class="text-sm text-gray-500 mt-2">
          Buscando reportes similares...
        </div>

        <div v-if="errorSimilares" class="text-sm text-red-600 mt-2">
          {{ errorSimilares }}
        </div>

        <div
          v-if="viendoSimilares"
          class="mt-3 p-3 border rounded bg-gray-50 text-sm"
        >
          <p class="font-medium mb-2">Encontramos reportes similares:</p>

          <ul class="space-y-2">
            <li
              v-for="r in similares"
              :key="r.id"
              class="flex justify-between items-center gap-3"
            >
              <div>
                <p class="font-semibold">{{ r.categoria }}</p>
                <p class="text-gray-700">{{ r.ubicacion }}</p>
                <p class="text-xs text-gray-500">
                  Apoyos: {{ r.apoyos ?? 0 }} · Fecha:
                  {{ new Date(r.created_at).toLocaleDateString() }}
                </p>
              </div>

              <button
                type="button"
                @click=" joinExistingReport(r)"
                class="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
              >
                Sumarme
              </button>
            </li>
          </ul>

          <p class="text-xs text-gray-500 mt-2">
            Si ninguno coincide con lo que querés reportar, podés continuar con
            el formulario y crear un reporte nuevo.
          </p>
        </div>
      </div>

      <div class="mb-4">
        <label class="block mb-1">Descripción</label>
        <textarea
          v-model="descripcion"
          class="w-full p-2 border border-gray-300 rounded"
        ></textarea>
      </div>

      <div class="flex flex-col items-center mb-4 sm:mb-4">
        <label
          for="imageUpload"
          class="cursor-pointer flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-blue-700 active:scale-95 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4-4m0 0l-4 4m4-4v12"
            />
          </svg>
          <span>Subir imagen</span>
        </label>
        <input
          id="imageUpload"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileChange"
        />

        <p v-if="selectedFileName" class="mt-2 text-sm text-gray-600">
          📎 {{ selectedFileName }}
        </p>
      </div>

      <div v-if="errorMessage" class="text-red-600 mb-4">
        {{ errorMessage }}
      </div>

      <button
        type="submit"
        class="bg-[#3082e3] text-white py-2 px-4 rounded hover:bg-[#085baf]"
      >
        Enviar Reporte
      </button>
    </form>
  </div>
</template>
