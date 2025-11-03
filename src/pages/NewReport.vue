<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { uploadImage, saveReport } from "../services/reports";
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

function onFileChange(e) {
  const file = e.target.files[0];
  if (file) {
    imagen.value = file;
  } else {
    imagen.value = null;
  }
}

// Datos del usuario
const user = ref({
  id: null,
  email: null,
});

subscribeToUserState((newUserData) => {
  user.value = newUserData;
});

// Manejador de envío
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
  <div class="max-w-xl mx-auto mt-10">
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
        <label class="block mb-1">Descripción</label>
        <textarea
          v-model="descripcion"
          class="w-full p-2 border border-gray-300 rounded"
        ></textarea>
      </div>

      <div class="flex flex-col items-center mb-6 sm:mb-8">
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
        class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-500"
      >
        Enviar Reporte
      </button>
    </form>
  </div>
</template>
