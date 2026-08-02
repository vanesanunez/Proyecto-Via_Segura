<!-- <script setup>
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

    <div ref="mapEl" class="mt-4 rounded-xl border" style="height: 300px;"></div>

    <div class="mt-4">
      <button
        @click="stopFollowingAndExit"
        class="px-4 py-2 w-full rounded bg-[#f2826d] text-white font-semibold hover:brightness-105 transition"
      >
        Dejar de seguir
      </button>
    </div>

    <p v-if="!isFollowing" class="mt-3 text-sm text-slate-500">
      Este recorrido ya finalizó o dejaste de seguirlo.
    </p>
  </div>

  <BottomNavigation />
</template> -->

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import L from "leaflet";
import confetti from "canvas-confetti";
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
  endedMessage,
  endedArrivedSafely,
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

// ── Pantalla de cierre ──────────────────────────────────────────────────
// Capturamos esto en una variable local porque el composable resetea
// endedMessage/sharerName a los pocos segundos (para el toast de la barra
// flotante), y no queremos que la pantalla de "finalizado" desaparezca sola.
const finished = ref(null); // null | { name: string, arrived: boolean }

function launchConfetti() {
  confetti({
    particleCount: 55,
    spread: 65,
    startVelocity: 24,
    scalar: 0.9,
    origin: { y: 0.6 },
  });
}

watch(
  endedMessage,
  (msg) => {
    if (!msg || finished.value) return;

    finished.value = {
      name: sharerName.value || "Tu contacto",
      arrived: endedArrivedSafely.value,
    };

    if (finished.value.arrived) {
      nextTick(launchConfetti);
    }
  },
  { immediate: true }
);

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

function goHomeAfterFinish() {
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
  <!-- ══════════ Recorrido en curso: mapa en vivo ══════════ -->
  <div v-if="!finished" class="max-w-3xl mx-auto p-4 relative">
    <div class="flex items-center gap-3 pb-2">
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div class="min-w-0">
        <h1 class="text-[18px] font-bold leading-tight text-[#2a2a2a]">
          Siguiendo a {{ sharerName || "tu contacto" }}
        </h1>
        <p class="text-xs text-slate-500">Ubicación en tiempo real</p>
      </div>
    </div>

    <div ref="mapEl" class="mt-3 rounded-xl border" style="height: 300px;"></div>

    <div class="mt-4">
      <button
        @click="stopFollowingAndExit"
        class="px-4 py-2 w-full rounded-2xl bg-[#f2826d] text-white font-semibold hover:brightness-105 transition active:scale-[0.98]"
      >
        Dejar de seguir
      </button>
    </div>
  </div>

  <!-- ══════════ El recorrido finalizó ══════════ -->
  <section v-else class="min-h-screen bg-white px-4 pt-8 pb-24">
    <div class="mx-auto w-full max-w-[390px]">
      <div
        class="rounded-[30px] p-6 text-center shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
        :class="finished.arrived ? 'bg-[#eef4ff]' : 'bg-[#f7f9fc]'"
      >
        <div
          class="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-[0_14px_28px_rgba(48,130,227,0.18)]"
          :class="finished.arrived ? 'text-[#3082e3]' : 'text-[#6b7280]'"
        >
          <svg
            v-if="finished.arrived"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="h-10 w-10"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="h-10 w-10"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <span
          class="mt-5 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold"
          :class="finished.arrived ? 'text-[#3082e3]' : 'text-slate-500'"
        >
          {{ finished.arrived ? "Recorrido finalizado" : "Seguimiento finalizado" }}
        </span>

        <h1 class="mt-4 text-[26px] font-bold leading-tight text-slate-900">
          {{ finished.arrived ? `¡${finished.name} llegó bien!` : `${finished.name} finalizó el recorrido` }}
        </h1>

        <p class="mt-3 text-[15px] leading-[1.7] text-slate-600">
          {{
            finished.arrived
              ? "Confirmó que llegó a destino sin inconvenientes. Ya podés dejar de seguir su ubicación."
              : "Dejaste de recibir su ubicación en tiempo real porque el recorrido terminó."
          }}
        </p>

        <div class="mt-6">
          <button
            type="button"
            @click="goHomeAfterFinish"
            class="flex w-full items-center justify-center rounded-2xl bg-[#3082e3] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#085baf] active:scale-[0.98]"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  </section>

  <BottomNavigation />
</template>