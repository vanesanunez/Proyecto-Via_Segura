<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import L from "leaflet";
import { nominatimSearch, nominatimReverse, composeAddress } from "../services/nominatim";
import supabase from "../services/supabase";
import { subscribeToSharedRoute, shareRoute, stopSharing } from "../services/sharedRoutes";
import { getTrustedContacts } from "../services/contacts";

// FIX iconos con Vite
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon2x,
  iconUrl: icon,
  shadowUrl: shadow,
});

const user = ref(null);
const trustedContacts = ref([]);
const selectedContact = ref(null);
const mapEl = ref(null);
const startSearch = ref("");
const destSearch = ref("");
const resultsStart = ref([]);
const resultsDest = ref([]);
const routeActive = ref(false);
let map, markerStart, markerDest, routeLine;
let debounceTimerStart = null;
let debounceTimerDest = null;
let currentAbortStart = null;
let currentAbortDest = null;

const placeholderAvatar = 'https://placehold.co/40x40?text=👤';

onMounted(async () => {
  const res = await supabase.auth.getUser();
  user.value = res?.data?.user || null;
  if (!user.value) return;

  // Traer contactos de confianza
  trustedContacts.value = await getTrustedContacts(user.value.id);

  // Inicializar mapa
  map = L.map(mapEl.value, { zoomControl: false }).setView([-34.6037, -58.3816], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);
});

// 🧭 Función para marcar inicio o destino
function setMarker(lat, lng, type) {
  if (type === "start") {
    if (!markerStart) {
      markerStart = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerStart.on("dragend", () => updateCoords(markerStart, "start"));
    } else {
      markerStart.setLatLng([lat, lng]);
    }
  } else {
    if (!markerDest) {
      markerDest = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerDest.on("dragend", () => updateCoords(markerDest, "dest"));
    } else {
      markerDest.setLatLng([lat, lng]);
    }
  }
}

// Actualizar coords y redraw de ruta
function updateCoords(marker, type) {
  const { lat, lng } = marker.getLatLng();
  if (markerStart && markerDest) drawRoute();
}

// Dibujar línea entre inicio y destino
function drawRoute() {
  if (routeLine) map.removeLayer(routeLine);
  const latlngs = [markerStart.getLatLng(), markerDest.getLatLng()];
  routeLine = L.polyline(latlngs, { color: "blue" }).addTo(map);
}

// Búsqueda con nominatim para start/dest
function onInputStart() {
  clearTimeout(debounceTimerStart);
  if (!startSearch.value || startSearch.value.length < 3) { resultsStart.value = []; return; }
  debounceTimerStart = setTimeout(() => doSearch(startSearch.value, resultsStart, "start"), 400);
}

function onInputDest() {
  clearTimeout(debounceTimerDest);
  if (!destSearch.value || destSearch.value.length < 3) { resultsDest.value = []; return; }
  debounceTimerDest = setTimeout(() => doSearch(destSearch.value, resultsDest, "dest"), 400);
}

async function doSearch(query, resultsArrayRef, type) {
  try {
    const abortSignal = new AbortController();
    if (type === "start") { currentAbortStart?.abort(); currentAbortStart = abortSignal; }
    else { currentAbortDest?.abort(); currentAbortDest = abortSignal; }

    const data = await nominatimSearch(query, { countrycodes: "ar", limit: 10, lang: "es", layer:"address", dedupe:0, signal: abortSignal.signal });
    // Asegurarse que siempre sea array
    const safeData = Array.isArray(data) ? data : [];
    resultsArrayRef.value.splice(0, resultsArrayRef.value.length, ...safeData);
  } catch (e) {
    if (e.name !== "AbortError") console.error(e);
  }
}

// Seleccionar sugerencia
function pickSuggestion(item, type) {
  const lat = parseFloat(item.lat);
  const lng = parseFloat(item.lon);
  setMarker(lat, lng, type);
  map.setView([lat, lng], 16);
  if (markerStart && markerDest) drawRoute();
  if (type === "start") { startSearch.value = item.display_name; resultsStart.value = []; }
  else { destSearch.value = item.display_name; resultsDest.value = []; }
}

// Iniciar recorrido compartido
async function startSharing() {
  if (!selectedContact.value || !markerStart || !markerDest) {
    alert("Seleccioná un contacto y marcá inicio y destino.");
    return;
  }
  routeActive.value = true;

  // Suscribirse al canal broadcast
  await shareRoute(user.value.id, selectedContact.value.id, markerStart.getLatLng(), markerDest.getLatLng());
}

// Finalizar recorrido
async function finishSharing() {
  routeActive.value = false;
  await stopSharing();
  if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
  if (markerStart) { map.removeLayer(markerStart); markerStart = null; }
  if (markerDest) { map.removeLayer(markerDest); markerDest = null; }
}

onBeforeUnmount(() => {
  clearTimeout(debounceTimerStart);
  clearTimeout(debounceTimerDest);
  currentAbortStart?.abort();
  currentAbortDest?.abort();
  map?.off();
  map?.remove();
});
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-xl font-semibold mb-4">Compartir recorrido</h1>

    <div class="mb-4">
      <label class="block mb-1 font-medium">Contactos de confianza:</label>
      <select v-model="selectedContact" class="w-full border rounded px-3 py-2">
        <option :value="null" disabled>Seleccioná un contacto...</option>
        <option v-for="c in trustedContacts" :key="c.id" :value="c">{{ c.name }} {{ c.lastname }}</option>
      </select>
    </div>

    <div class="mb-4">
      <label class="block mb-1 font-medium">Inicio:</label>
      <input v-model="startSearch" @input="onInputStart" placeholder="Buscar dirección de inicio" class="w-full border rounded px-3 py-2"/>
      <ul v-if="resultsStart.value?.length" class="border rounded mt-1 max-h-40 overflow-auto bg-white">
        <li v-for="r in resultsStart.value" :key="r.place_id" @click="pickSuggestion(r,'start')" class="px-2 py-1 cursor-pointer hover:bg-blue-50">{{ r.display_name }}</li>
      </ul>
    </div>

    <div class="mb-4">
      <label class="block mb-1 font-medium">Destino:</label>
      <input v-model="destSearch" @input="onInputDest" placeholder="Buscar dirección de destino" class="w-full border rounded px-3 py-2"/>
      <ul v-if="resultsDest.value?.length" class="border rounded mt-1 max-h-40 overflow-auto bg-white">
        <li v-for="r in resultsDest.value" :key="r.place_id" @click="pickSuggestion(r,'dest')" class="px-2 py-1 cursor-pointer hover:bg-blue-50">{{ r.display_name }}</li>
      </ul>
    </div>

    <div class="flex gap-2">
      <button @click="startSharing" class="px-4 py-2 rounded bg-blue-500 text-white" :disabled="routeActive">Iniciar recorrido compartido</button>
      <button v-if="routeActive" @click="finishSharing" class="px-4 py-2 rounded bg-red-500 text-white">Finalizar recorrido</button>
    </div>

    <div ref="mapEl" class="mt-4 rounded-xl border" style="height: 300px;"></div>
  </div>
</template>

<style scoped>
input::placeholder { color: #9aa3a8; }
</style>
