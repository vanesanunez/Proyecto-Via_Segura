<!-- <script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import L from "leaflet";
import AppH1 from "../components/AppH1.vue";
import { startListeningSharedPath, stopListeningSharedPath } from "../services/path-sharing";
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
import BottomNavigation from "../components/BottomNavigation.vue";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon2x,
  iconUrl: icon,
  shadowUrl: shadow,
});

const route = useRoute();
const router = useRouter();
const mapEl = ref(null);
const showToast = ref(false);
const toastMessage = ref("");

let map = null;
let trackedMarker = null;
let historicPolyline = null;
let livePolyline = null;

// polyline para la ruta sugerida
let suggestedRouteLine = null;

let unsubscribeShared = null;

// guardaremos el destino cuando lo envie el emisor
let sharedDestination = null;

// URL para OSRM
async function getRouteOSRM(from, to) {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (!data.routes || !data.routes.length) return null;

    return data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
  } catch (e) {
    console.error("OSRM error:", e);
    return null;
  }
}

const path_id = route.params.pathId || route.query.path_id;
const sharer_id = route.query.sharer_id || route.params.sharer_id;

// Toast
function triggerToast(message) {
  toastMessage.value = message;
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 3000);
}

onMounted(() => {
  map = L.map(mapEl.value, { zoomControl: false }).setView([-34.6037, -58.3816], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  if (sharer_id && path_id) {
    unsubscribeShared = startListeningSharedPath(
      { sharer_id, path_id },
      async (msg) => {
        if (!msg) return;

        //
        // destino recibido
        //
        if (msg.type === "destination") {
          sharedDestination = msg.payload;

          // si ya tenemos ubicación actual dibujamos ruta sugerida
          if (trackedMarker) {
            const pos = trackedMarker.getLatLng();
            const origin = { lat: pos.lat, lng: pos.lng };

            const suggestedCoords = await getRouteOSRM(origin, sharedDestination);
            if (suggestedCoords) {
              if (suggestedRouteLine) map.removeLayer(suggestedRouteLine);

              suggestedRouteLine = L.polyline(suggestedCoords, {
                color: "#3082e3",
                weight: 4,
                opacity: 0.6,
                dashArray: "5,5",
              }).addTo(map);
            }
          }
          return;
        }

        //
        // historial completo
        //
        if (msg.type === "full-history") {
          const { history } = msg.payload || {};

          if (history?.length) {
            const coords = history.map((p) => [
              p.lat ?? p.latitude,
              p.lng ?? p.longitude ?? p.lon,
            ]);

            if (historicPolyline) map.removeLayer(historicPolyline);
            if (livePolyline) map.removeLayer(livePolyline);

            historicPolyline = L.polyline(coords, {
              color: "#9aa0a6",
              weight: 3,
              opacity: 0.7,
            }).addTo(map);

            livePolyline = L.polyline([], {
              color: "#3082e3",
              weight: 5,
            }).addTo(map);

            map.fitBounds(historicPolyline.getBounds(), { padding: [30, 30] });

            const last = coords[coords.length - 1];
            if (!trackedMarker) {
              trackedMarker = L.marker(last).addTo(map).bindPopup("Usuario seguido");
            } else {
              trackedMarker.setLatLng(last);
            }

            //
            // Dibujar ruta sugerida si ya se recibió destino
            //
            if (sharedDestination) {
              const origin = {
                lat: coords[coords.length - 1][0],
                lng: coords[coords.length - 1][1],
              };

              const suggestedCoords = await getRouteOSRM(origin, sharedDestination);
              if (suggestedCoords) {
                if (suggestedRouteLine) map.removeLayer(suggestedRouteLine);
                suggestedRouteLine = L.polyline(suggestedCoords, {
                  color: "#3082e3",
                  weight: 4,
                  opacity: 0.6,
                  dashArray: "5,5",
                }).addTo(map);
              }
            }
          }
        }

        //
        // punto en tiempo real 
        //
        if (msg.type === "point") {
          const coords = msg.payload;
          const lat = coords.lat ?? coords.latitude;
          const lng = coords.lng ?? coords.longitude ?? coords.lon;

          if (lat == null || lng == null) return;

          if (!livePolyline) {
            livePolyline = L.polyline([], { color: "#3082e3", weight: 3 }).addTo(map);
          }

          livePolyline.addLatLng([lat, lng]);

          if (!trackedMarker) {
            trackedMarker = L.marker([lat, lng]).addTo(map).bindPopup("Usuario seguido");
          } else {
            trackedMarker.setLatLng([lat, lng]);
          }

          map.flyTo([lat, lng], 15);

          //
          // Ruta sugerida: actualizar cuando el usuario se mueve
          //
          if (sharedDestination) {
            const origin = { lat, lng };
            const suggestedCoords = await getRouteOSRM(origin, sharedDestination);

            if (suggestedCoords) {
              if (suggestedRouteLine) map.removeLayer(suggestedRouteLine);

              suggestedRouteLine = L.polyline(suggestedCoords, {
                color: "#3082e3",
                weight: 3,
                opacity: 0.6,
                dashArray: "5,5",
              }).addTo(map);
            }
          }
        }
      },
      () => {
        stopFollowing();
      }
    );
  }
});

onUnmounted(() => {
  if (unsubscribeShared) unsubscribeShared();

  [trackedMarker, historicPolyline, livePolyline, suggestedRouteLine].forEach((l) => {
    if (l && map) map.removeLayer(l);
  });
});

function stopFollowing() {
  if (unsubscribeShared) unsubscribeShared();
  else stopListeningSharedPath({ sharer_id, path_id });

  triggerToast("Dejaste de seguir el recorrido.");

  setTimeout(() => router.push("/"), 3000);
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-4 relative">
    <AppH1>Seguir recorrido</AppH1>

    <div ref="mapEl" class="mt-4 rounded-xl border" style="height: 500px;"></div>

    <div class="mt-4">
      <button @click="stopFollowing" class="px-4 py-2 rounded bg-blue-200 hover:bg-blue-300 transition">
        Dejar de seguir
      </button>
    </div>

    <div
      v-if="showToast"
      class="fixed top-4 right-4 bg-blue-200 text-gray-600 px-4 py-2 rounded-lg shadow-lg animate-fade"
      style="z-index: 9999;"
    >
      {{ toastMessage }}
    </div>
  </div>

  <BottomNavigation />
</template>

<style>
@keyframes fade {
  0% { opacity: 0; transform: translateY(-10px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-10px); }
}
.animate-fade {
  animation: fade 6s ease-in-out forwards;
}
</style>
 -->

 <script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import L from "leaflet";
import AppH1 from "../components/AppH1.vue";
import { useSharedPathViewer } from "../composables/useSharedPathViewer";
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
import BottomNavigation from "../components/BottomNavigation.vue";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon, shadowUrl: shadow });

const route = useRoute();
const router = useRouter();

const {
  isFollowing,
  sharerName,
  historicCoords,
  liveCoords,
  trackedPosition,
  destination,
  stopFollowing,
} = useSharedPathViewer();

const mapEl = ref(null);
let map = null;
let trackedMarker = null;
let historicPolyline = null;
let livePolyline = null;
let suggestedRouteLine = null;

const sharer_id = route.query.sharer_id || route.params.sharer_id;
const path_id = route.params.pathId || route.query.path_id;
const sharer_name_query = route.query.sharer_name;

async function getRouteOSRM(from, to) {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (!data.routes || !data.routes.length) return null;
    return data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
  } catch (e) {
    console.error("[ViewSharedPathPage] OSRM error:", e);
    return null;
  }
}

function drawHistoric(coords) {
  if (!coords.length) return;

  if (historicPolyline) map.removeLayer(historicPolyline);
  historicPolyline = L.polyline(coords, { color: "#9aa0a6", weight: 3, opacity: 0.7 }).addTo(map);
  map.fitBounds(historicPolyline.getBounds(), { padding: [30, 30] });
}

function drawLive(coords) {
  if (!livePolyline) {
    livePolyline = L.polyline([], { color: "#3082e3", weight: 5 }).addTo(map);
  }
  livePolyline.setLatLngs(coords);
}

function updateTrackedMarker(lat, lng, fly = true) {
  if (!trackedMarker) {
    trackedMarker = L.marker([lat, lng]).addTo(map).bindPopup(`${sharerName.value || "Usuario"} seguido`);
  } else {
    trackedMarker.setLatLng([lat, lng]);
  }
  if (fly) map.flyTo([lat, lng], 15);
}

async function refreshSuggestedRoute() {
  if (!map || !trackedPosition.value || !destination.value) return;

  const coords = await getRouteOSRM(trackedPosition.value, destination.value);
  if (!coords) return;

  if (suggestedRouteLine) map.removeLayer(suggestedRouteLine);
  suggestedRouteLine = L.polyline(coords, {
    color: "#3082e3",
    weight: 4,
    opacity: 0.6,
    dashArray: "5,5",
  }).addTo(map);
}

function stopFollowingAndExit() {
  stopFollowing();
  router.push("/");
}

onMounted(async () => {
  await nextTick();

  map = L.map(mapEl.value, { zoomControl: false }).setView([-34.6037, -58.3816], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Inicia (o reutiliza, si ya veníamos siguiendo este mismo recorrido) la suscripción persistente
  if (sharer_id && path_id) {
    useSharedPathViewer().startFollowing({
      sharer_id,
      path_id,
      sharer_name: sharer_name_query,
    });
  }

  // Reconstruimos el mapa con lo que ya tengamos en el composable
  if (historicCoords.value.length) drawHistoric(historicCoords.value);
  if (liveCoords.value.length) drawLive(liveCoords.value);
  if (trackedPosition.value) updateTrackedMarker(trackedPosition.value.lat, trackedPosition.value.lng, false);
  if (destination.value) refreshSuggestedRoute();
});

onUnmounted(() => {
  // No cortamos la suscripción acá: sigue viva en el composable (barra flotante)
  map?.remove();
});

watch(historicCoords, (coords) => {
  if (map && coords.length) drawHistoric(coords);
});

watch(liveCoords, (coords) => {
  if (!map || !coords.length) return;
  drawLive(coords);
  const [lat, lng] = coords[coords.length - 1];
  updateTrackedMarker(lat, lng, true);
  refreshSuggestedRoute();
});

watch(destination, () => {
  refreshSuggestedRoute();
});
</script>

<template>
  <div class="max-w-3xl mx-auto p-4 relative">
    <AppH1>Siguiendo a {{ sharerName || "tu contacto" }}</AppH1>

    <div ref="mapEl" class="mt-4 rounded-xl border" style="height: 500px;"></div>

    <div class="mt-4">
      <button
        @click="stopFollowingAndExit"
        class="px-4 py-2 rounded bg-[#f2826d] text-white font-semibold hover:brightness-105 transition"
      >
        Dejar de seguir
      </button>
    </div>

    <p v-if="!isFollowing" class="mt-3 text-sm text-slate-500">
      Este recorrido ya finalizó o dejaste de seguirlo.
    </p>
  </div>

  <BottomNavigation />
</template>