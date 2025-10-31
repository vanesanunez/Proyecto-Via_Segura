<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import L from "leaflet";
import supabase from "../services/supabase";
import { subscribeToSharedRoute, broadcastPosition, stopSharing } from "../services/sharedRoutes";
import { getTrustedContacts } from "../services/contacts";
import { nominatimSearch, composeAddress } from "../services/nominatim";
import AppH1 from "../components/AppH1.vue";

// FIX iconos Leaflet para Vite
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon, shadowUrl: shadow });

const user = ref(null);
const trustedContacts = ref([]);
const selectedContact = ref(null);
const mapEl = ref(null);
const routeActive = ref(false);
const isWatcher = ref(false);

let map, myMarker, contactMarker, myPath, contactPath, watchId;

// Destino
const destinationQuery = ref("");
const destinationResults = ref([]);
let destinationMarker = null;
let routeLine = null;

onMounted(async () => {
  const res = await supabase.auth.getUser();
  user.value = res?.data?.user || null;
  if (!user.value) return;

  trustedContacts.value = await getTrustedContacts(user.value.id);

  // Inicializar mapa
  map = L.map(mapEl.value, { zoomControl: false }).setView([-34.6037, -58.3816], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);
});

// -------------------- Funciones --------------------

// Iniciar recorrido propio
async function startSharing() {
  if (!selectedContact.value) {
    alert("Seleccioná un contacto de confianza.");
    return;
  }

  routeActive.value = true;
  isWatcher.value = false;

  // Suscribirse al canal
  subscribeToSharedRoute(user.value.id, selectedContact.value.id, updateContactMarker);

  // Polyline recorrido propio
  myPath = L.polyline([], { color: "#3082e3", weight: 5 }).addTo(map);

  // Geolocalización
  if ("geolocation" in navigator) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateMyMarker(latitude, longitude);
        updateMyPath(latitude, longitude);
        broadcastPosition(user.value.id, selectedContact.value.id, { lat: latitude, lng: longitude });
      },
      (err) => console.error("Error en geolocalización:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
  } else {
    alert("La geolocalización no está disponible en tu dispositivo.");
  }
}

// Marcador y path propio
function updateMyMarker(lat, lng) {
  if (!myMarker) {
    myMarker = L.marker([lat, lng]).addTo(map).bindPopup("Tu ubicación actual");
  } else {
    myMarker.setLatLng([lat, lng]);
  }
  map.setView([lat, lng], 15);
}

function updateMyPath(lat, lng) {
  if (myPath) myPath.addLatLng([lat, lng]);
}

// Contacto
function updateContactMarker({ lat, lng, sender_id }) {
  if (sender_id === user.value.id) return;

  if (!contactMarker) {
    contactMarker = L.marker([lat, lng], { icon: L.icon({ iconUrl: icon }) })
      .addTo(map)
      .bindPopup("Ubicación de tu contacto");
  } else {
    contactMarker.setLatLng([lat, lng]);
  }

  // Polyline del contacto
  if (!contactPath) {
    contactPath = L.polyline([[lat, lng]], { color: "#f2826d", weight: 5, dashArray: "6,4" }).addTo(map);
  } else {
    contactPath.addLatLng([lat, lng]);
  }
}

// Ver recorrido de contacto
async function watchContactRoute(contactId) {
  isWatcher.value = true;
  subscribeToSharedRoute(user.value.id, contactId, updateContactMarker);
}

// Finalizar recorrido
async function finishSharing() {
  routeActive.value = false;
  stopSharing();

  if (watchId) navigator.geolocation.clearWatch(watchId);

  [myMarker, contactMarker, myPath, contactPath, destinationMarker, routeLine].forEach(layer => {
    if (layer) map.removeLayer(layer);
  });

  myMarker = contactMarker = myPath = contactPath = destinationMarker = routeLine = null;
}

// -------------------- Destino --------------------

// Buscar dirección destino
async function searchDestination() {
  if (!destinationQuery.value.trim()) return;

  try {
    const results = await nominatimSearch(destinationQuery.value, {
      countrycodes: "ar",
      limit: 5,
    });
    destinationResults.value = results;
  } catch (err) {
    console.error("Error al buscar dirección:", err);
  }
}

// Seleccionar resultado destino
function selectDestination(place) {
  const lat = parseFloat(place.lat);
  const lon = parseFloat(place.lon);

  if (destinationMarker) map.removeLayer(destinationMarker);
  if (routeLine) map.removeLayer(routeLine);

  destinationMarker = L.marker([lat, lon], {
    icon: L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", iconSize: [32, 32] }),
  })
    .addTo(map)
    .bindPopup(`<b>Destino:</b> ${composeAddress(place.address)}`)
    .openPopup();

  map.setView([lat, lon], 15);

  // Línea desde ubicación propia
  if (myMarker) {
    const myPos = myMarker.getLatLng();
    routeLine = L.polyline([myPos, [lat, lon]], { color: "#2a2a2a", dashArray: "6,6" }).addTo(map);
  }

  destinationResults.value = [];
  destinationQuery.value = composeAddress(place.address);
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <AppH1>Recorrido Seguro</AppH1>

    <div ref="mapEl" class="mt-4 rounded-xl border" style="height: 400px;"></div>

    <!-- Contactos -->
    <div class="mb-4 mt-4">
      <label class="block font-medium">Contactos de confianza:</label>
      <select v-model="selectedContact" class="w-full border rounded px-3 py-2">
        <option :value="null" disabled>Seleccioná un contacto...</option>
        <option v-for="c in trustedContacts" :key="c.id" :value="c">
          {{ c.name }} {{ c.lastname }}
        </option>
      </select>
    </div>

    <!-- Destino -->
    <div class="mb-4">
      <label class="block font-medium">Dirección de destino:</label>
      <div class="flex gap-2">
        <input
          v-model="destinationQuery"
          type="text"
          placeholder="Ej: Av. Corrientes 1234, CABA"
          class="flex-1 border rounded px-3 py-2"
          @keyup.enter="searchDestination"
        />
        <button
          @click="searchDestination"
          class="px-4 py-2 rounded bg-blue-500 text-white"
        >
          Buscar
        </button>
      </div>

      <ul v-if="destinationResults.length" class="bg-white border mt-2 rounded shadow max-h-40 overflow-auto">
        <li
          v-for="r in destinationResults"
          :key="r.place_id"
          class="p-2 hover:bg-blue-100 cursor-pointer"
          @click="selectDestination(r)"
        >
          {{ composeAddress(r.address) }}
        </li>
      </ul>
    </div>

    <!-- Botones -->
    <div class="flex gap-2 mb-2">
      <button
        v-if="!routeActive"
        @click="startSharing"
        class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-700"
      >
        Iniciar recorrido compartido
      </button>
      <button
        v-if="routeActive"
        @click="finishSharing"
        class="px-4 py-2 rounded bg-orange-300 text-gray hover:bg-orange-400"
      >
        Finalizar recorrido
      </button>
    </div>

    <div class="mt-3">
      <button
        @click="watchContactRoute(selectedContact?.id)"
        class="px-4 py-2 rounded bg-white text-gray border border-blue-300 hover:bg-blue-100"
      >
        Ver recorrido de mi contacto
      </button>
    </div>
  </div>
</template>

<style scoped>
.leaflet-container { border-radius: 0.75rem; }
</style>
