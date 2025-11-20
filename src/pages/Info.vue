<script setup>
import { ref, computed } from "vue";
import MapSearchPicker from "../components/MapSearchPicker.vue";
import AppH1 from "../components/AppH1.vue"; 
import BottomNavigation from "../components/BottomNavigation.vue";

const coords = ref(null);
const direccion = ref("");
const loading = ref(false);
const errorMessage = ref("");
const results = ref([]);

const radiusMeters = ref(3000);
const selectedCategory = ref("hospital");

// Paginación
const currentPage = ref(1);
const pageSize = 5;

const totalPages = computed(() =>
  Math.ceil(results.value.length / pageSize)
);

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return results.value.slice(start, start + pageSize);
});

function resetPagination() {
  currentPage.value = 1;
}

//servicios - puntos de interés que se pueden buscar

const amenityLabel = {
  hospital: "Hospitales",
  police: "Comisarías",
  pharmacy: "Farmacias",
  fire_station: "Bomberos"
};

function buildOverpassQuery(lat, lon, radius, category) {
  return `
    [out:json][timeout:25];
    (
      node(around:${radius},${lat},${lon})[amenity=${category}];
      way(around:${radius},${lat},${lon})[amenity=${category}];
      relation(around:${radius},${lat},${lon})[amenity=${category}];
    );
    out center;
  `;
}

function formatAddressFromTags(tags) {
  if (!tags) return null;

  if (tags["addr:full"]) return tags["addr:full"];

  const street = tags["addr:street"] || tags["street"];
  const housenumber = tags["addr:housenumber"] || tags["housenumber"];
  const city = tags["addr:city"] || tags["city"];
  const barrio = tags["neighbourhood"] || tags["suburb"] || tags["addr:suburb"];

  const parts = [];
  if (street) parts.push(street + (housenumber ? ` ${housenumber}` : ""));
  if (barrio) parts.push(barrio);
  if (city) parts.push(city);

  return parts.join(", ") || null;
}

function parseOverpass(json, category) {
  if (!json || !json.elements) return [];

  return json.elements.map(el => {
    const tags = el.tags || {};
    const name = tags.name || tags["operator"] || "Sin nombre";

    let lat = null, lon = null;
    if (el.lat) { lat = el.lat; lon = el.lon; }
    else if (el.center) { lat = el.center.lat; lon = el.center.lon; }

    return {
      raw: el,
      type: category,
      name,
      address: formatAddressFromTags(tags),
      lat,
      lon
    };
  });
}

async function buscarCercanos() {
  errorMessage.value = "";
  results.value = [];
  resetPagination();

  if (!coords.value || !coords.value.lat) {
    errorMessage.value = "Primero seleccioná una dirección en el mapa.";
    return;
  }

  const lat = Number(coords.value.lat);
  const lon = Number(coords.value.lng);
  const radius = Number(radiusMeters.value) || 3000;
  const category = selectedCategory.value;

  const query = buildOverpassQuery(lat, lon, radius, category);
  const url = "https://overpass-api.de/api/interpreter";

  loading.value = true;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: "data=" + encodeURIComponent(query)
    });

    if (!res.ok) throw new Error(`Error Overpass: ${res.status} ${res.statusText}`);

    const json = await res.json();
    const parsed = parseOverpass(json, category);

    function toRad(d) { return d * Math.PI / 180; }
    function haversine(lat1, lon1, lat2, lon2) {
      const R = 6371000;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat/2)**2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    const ordered = parsed.map(i => ({
      ...i,
      distance: i.lat ? haversine(lat, lon, i.lat, i.lon) : Infinity
    }))
    .sort((a,b) => a.distance - b.distance);

    results.value = ordered;

    if (!ordered.length) {
      errorMessage.value = "No se encontraron resultados.";
    }

  } catch (err) {
    console.error(err);
    errorMessage.value = err.message || "Error consultando Overpass";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto mt-6 ">
    <AppH1>Información útil</AppH1>
    <p>Acá podés encontrar servicios cercanos como hospitales, comisarías, bomberos y farmacias.</p>

    <label class="block mt-8 mb-2 font-medium">*Ingresá una dirección</label>
    <MapSearchPicker
      v-model="coords"
      height="260px"
      @resolved-address="direccion = $event"
    />

    <p class="text-sm text-gray-600 mb-2">
      Dirección elegida:
      <strong v-if="direccion">{{ direccion }}</strong>
      <span v-else>aún no seleccionada</span>
    </p>

    <label class="block mb-2 font-medium mt-4">*¿Qué estás buscando?</label>
    <select v-model="selectedCategory"
      class="border p-2 rounded w-full max-w-sm bg-white shadow-sm">
      <option value="hospital">Hospitales</option>
      <option value="pharmacy">Farmacias</option>
      <option value="police">Comisarías</option>
      <option value="fire_station">Bomberos</option>
    </select>

    <!-- Radio de búsqueda -->
    <div class="flex gap-4 items-center mt-5 mb-4">

      <label class="text-sm font-medium flex flex-col">
        Radio de búsqueda (en metros):

        <div class="flex items-center mt-1">
          <!-- Botón "-" -->
          <button
            @click="radiusMeters = Math.max(100, radiusMeters - 100)"
            class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-l border"
          >−</button>

          <!-- Input número -->
          <input
            type="number"
            v-model="radiusMeters"
            step="100"
            min="100"
            class="w-24 text-center py-1 border-y border-gray-300"
          />

          <!-- Botón "+" -->
          <button
            @click="radiusMeters = Number(radiusMeters) + 100"
            class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-r border"
          >+</button>
        </div>
      </label>

      <button
        @click="buscarCercanos"
        class="px-4 py-2 rounded bg-blue-600 text-white shadow hover:bg-blue-600"
      >
        Buscar
      </button>

      <div v-if="loading" class="text-sm text-gray-500 ml-4">Cargando...</div>
    </div>

    <div v-if="errorMessage" class="text-red-600 mb-4">{{ errorMessage }}</div>

   

    <!-- Resultados -->
    <div v-if="paginatedResults.length" class="mt-6">
      <h2 class="text-xl font-semibold mb-3 text-blue-800">
       Resultados para: {{ amenityLabel[selectedCategory] }}
      </h2>

      <ul class="space-y-3">
        <li
          v-for="(it, i) in paginatedResults"
          :key="i"
          class="p-3 border border-blue-300 rounded shadow-sm shadow-blue-200 bg-white"
        >
          <div class="font-medium">{{ it.name }}</div>
          <div class="text-sm text-gray-700" v-if="it.address">{{ it.address }}</div>
          <div class="text-xs text-gray-500 mt-1" v-if="isFinite(it.distance)">
            {{ Math.round(it.distance) }} m
          </div>
        </li>
      </ul>

      <!-- Paginación -->
      <div class="flex justify-between items-center mt-6">
        <button
          class="px-3 py-1 bg-blue-200 rounded disabled:opacity-40"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          < Anterior
        </button>

        <span class="text-sm text-gray-700">
          Página {{ currentPage }} de {{ totalPages }}
        </span>

        <button
          class="px-3 py-1 bg-blue-200 rounded disabled:opacity-40"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          Siguiente >
        </button>
      </div>
    </div>
  </div>

  <div>

  <BottomNavigation />
  </div>
</template>


