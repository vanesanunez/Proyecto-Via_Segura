<!-- <script setup>
import { ref, onMounted } from "vue";
import L from "leaflet";
import {
  startPath,
  sharePathWith,
  updateCoords,
  endPath,
} from "../services/path-sharing";
import { getTrustedContacts } from "../services/contacts";
import { subscribeToUserState } from "../services/auth";
import { nominatimSearch, composeAddress } from "../services/nominatim";
import AppH1 from "../components/AppH1.vue";

// Leaflet icons
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon, iconRetinaUrl: icon2x, shadowUrl: shadow });

// Refs
const mapEl = ref(null);
const trustedContacts = ref([]);
const selectedContact = ref(null);
const routeActive = ref(false);

let map, myMarker, myPath, watchId;
const destinationQuery = ref("");
const destinationResults = ref([]);
let destinationMarker = null;
let routeLine = null;
const currentUser = ref(null);

onMounted(async () => {
  map = L.map(mapEl.value, { zoomControl: false }).setView([-34.6037, -58.3816], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);

  subscribeToUserState(async (user) => {
    currentUser.value = user;
    if (user?.id) trustedContacts.value = await getTrustedContacts(user.id);
    else trustedContacts.value = [];
  });
});

async function startSharing() {
  if (!selectedContact.value) {
    alert("Seleccioná un contacto de confianza.");
    return;
  }

  routeActive.value = true;

  const pathId = await startPath();
  await sharePathWith(selectedContact.value.id);

  myPath = L.polyline([], { color: "#3082e3", weight: 5 }).addTo(map);

  if ("geolocation" in navigator) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateMyMarker(latitude, longitude);
        myPath.addLatLng([latitude, longitude]);
        updateCoords({ lat: latitude, lng: longitude });
      },
      (err) => console.error("Error en geolocalización:", err),
      { enableHighAccuracy: true }
    );
  }
}

function updateMyMarker(lat, lng) {
  if (!myMarker) {
    myMarker = L.marker([lat, lng]).addTo(map).bindPopup("Tu ubicación actual");
  } else {
    myMarker.setLatLng([lat, lng]);
  }
  map.setView([lat, lng], 15);
}

function finishSharing() {
  endPath();
  routeActive.value = false;
  if (watchId) navigator.geolocation.clearWatch(watchId);
  [myMarker, myPath, destinationMarker, routeLine].forEach((layer) => {
    if (layer) map.removeLayer(layer);
  });
  myMarker = myPath = destinationMarker = routeLine = null;
}

// Destino
async function searchDestination() {
  if (!destinationQuery.value.trim()) return;
  const results = await nominatimSearch(destinationQuery.value, { countrycodes: "ar", limit: 5 });
  destinationResults.value = results;
}

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
    <AppH1>Compartir Recorrido</AppH1>
    <div ref="mapEl" class="mt-4 rounded-xl border" style="height: 400px;"></div>

    <!-- Destino -->
    <!-- <div class="mb-4 mt-4">
      <label class="block font-medium">Dirección de destino:</label>
      <div class="flex gap-2">
        <input v-model="destinationQuery" type="text" class="flex-1 border rounded px-3 py-2" @keyup.enter="searchDestination" placeholder="Ej: Av. Corrientes 1234" />
        <button @click="searchDestination" class="px-4 py-2 rounded bg-blue-500 text-white">Buscar</button>
      </div>
      <ul v-if="destinationResults.length" class="bg-white border mt-2 rounded shadow max-h-40 overflow-auto">
        <li v-for="r in destinationResults" :key="r.place_id" class="p-2 hover:bg-blue-100 cursor-pointer" @click="selectDestination(r)">
          {{ composeAddress(r.address) }}
        </li>
      </ul>
    </div> -->

    <!-- Contactos -->
    <!-- <div class="mb-4 mt-4">
      <label class="block font-medium">Contactos de confianza:</label>
      <select v-model="selectedContact" class="w-full border rounded px-3 py-2">
        <option :value="null" disabled>Seleccioná un contacto...</option>
        <option v-for="c in trustedContacts" :key="c.id" :value="c">{{ c.name }} {{ c.lastname }}</option>
      </select>
    </div> -->

    <!-- Botones -->
    <!-- <div class="flex gap-2 mb-2">
      <button v-if="!routeActive" @click="startSharing" class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-700">
        Iniciar recorrido compartido
      </button>
      <button v-if="routeActive" @click="finishSharing" class="px-4 py-2 rounded bg-orange-400 text-white">
        Finalizar recorrido
      </button>
    </div>
  </div>
</template> --> 



<script setup>
import { ref, onMounted } from "vue";
import L from "leaflet";
import {
  startPath,
  sharePathWith,
  updateCoords,
  endPath,
} from "../services/path-sharing";
import { getTrustedContacts } from "../services/contacts";
import { subscribeToUserState } from "../services/auth";
import { nominatimSearch, composeAddress } from "../services/nominatim";
import AppH1 from "../components/AppH1.vue";

import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon,
  iconRetinaUrl: icon2x,
  shadowUrl: shadow,
});

const mapEl = ref(null);
const trustedContacts = ref([]);
const selectedContact = ref(null);
const routeActive = ref(false);

let map, myMarker, myPath, watchId;
const destinationQuery = ref("");
const destinationResults = ref([]);
let destinationMarker = null;
let routeLine = null;
const currentUser = ref(null);

onMounted(async () => {
  map = L.map(mapEl.value, { zoomControl: false }).setView([-34.6037, -58.3816], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);

  subscribeToUserState(async (user) => {
    currentUser.value = user;
    if (user?.id) trustedContacts.value = await getTrustedContacts(user.id);
    else trustedContacts.value = [];
  });
});

async function startSharing() {
  if (!selectedContact.value) {
    alert("Seleccioná un contacto de confianza.");
    return;
  }

  routeActive.value = true;

  const pathId = await startPath();
  await sharePathWith(selectedContact.value.id);

  myPath = L.polyline([], { color: "#3082e3", weight: 5 }).addTo(map);

  if ("geolocation" in navigator) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateMyMarker(latitude, longitude);
        myPath.addLatLng([latitude, longitude]);
        updateCoords({ lat: latitude, lng: longitude });
      },
      (err) => console.error("Error en geolocalización:", err),
      { enableHighAccuracy: true }
    );
  }
}

function updateMyMarker(lat, lng) {
  if (!myMarker) {
    myMarker = L.marker([lat, lng]).addTo(map).bindPopup("Tu ubicación actual");
  } else {
    myMarker.setLatLng([lat, lng]);
  }
  map.flyTo([lat, lng], 15);
}

function finishSharing() {
  endPath();
  routeActive.value = false;
  if (watchId) navigator.geolocation.clearWatch(watchId);
  [myMarker, myPath, destinationMarker, routeLine].forEach((layer) => {
    if (layer) map.removeLayer(layer);
  });
  myMarker = myPath = destinationMarker = routeLine = null;
}

// Destino
async function searchDestination() {
  if (!destinationQuery.value.trim()) return;
  const results = await nominatimSearch(destinationQuery.value, { countrycodes: "ar", limit: 5 });
  destinationResults.value = results;
}

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
    <AppH1>Compartir Recorrido</AppH1>
    <div ref="mapEl" class="mt-4 rounded-xl border" style="height: 400px;"></div>

    <div class="mb-4 mt-4">
      <label class="block font-medium">Dirección de destino:</label>
      <div class="flex gap-2">
        <input v-model="destinationQuery" type="text" class="flex-1 border rounded px-3 py-2" @keyup.enter="searchDestination" placeholder="Ej: Av. Corrientes 1234" />
        <button @click="searchDestination" class="px-4 py-2 rounded bg-blue-500 text-white">Buscar</button>
      </div>
      <ul v-if="destinationResults.length" class="bg-white border mt-2 rounded shadow max-h-40 overflow-auto">
        <li v-for="r in destinationResults" :key="r.place_id" class="p-2 hover:bg-blue-100 cursor-pointer" @click="selectDestination(r)">
          {{ composeAddress(r.address) }}
        </li>
      </ul>
    </div>

    <div class="mb-4 mt-4">
      <label class="block font-medium">Contactos de confianza:</label>
      <select v-model="selectedContact" class="w-full border rounded px-3 py-2">
        <option :value="null" disabled>Seleccioná un contacto...</option>
        <option v-for="c in trustedContacts" :key="c.id" :value="c">{{ c.name }} {{ c.lastname }}</option>
      </select>
    </div>

    <div class="flex gap-2 mb-2">
      <button v-if="!routeActive" @click="startSharing" class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-700">
        Iniciar recorrido compartido
      </button>
      <button v-if="routeActive" @click="finishSharing" class="px-4 py-2 rounded bg-orange-400 text-white">
        Finalizar recorrido
      </button>
    </div>
  </div>
</template>




