<script>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import L from "leaflet";
import AppH1 from "../components/AppH1.vue";
import { startListeningSharedPath, stopListeningSharedPath } from "../services/path-sharing";

import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon2x,
  iconUrl: icon,
  shadowUrl: shadow,
});

export default {
  name: "ViewSharedPathPage",
  components: { AppH1 },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const mapEl = ref(null);
    const showToast = ref(false);
    const toastMessage = ref("");

    let map, trackedMarker, trackedPolyline;
    let unsubscribeShared = null;

    const path_id = route.params.pathId || route.query.path_id;
    const sharer_id = route.query.sharer_id || route.params.sharer_id;

    function triggerToast(message) {
      toastMessage.value = message;
      showToast.value = true;
      setTimeout(() => {
        showToast.value = false;
      }, 3000);
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
          (coords) => {
            if (!coords) return;
            const lat = coords.lat ?? coords.latitude;
            const lng = coords.lng ?? coords.longitude ?? coords.lon;
            if (lat == null || lng == null) return;

            if (!trackedMarker) {
              trackedMarker = L.marker([lat, lng]).addTo(map).bindPopup("Usuario seguido");
            } else {
              trackedMarker.setLatLng([lat, lng]);
            }

            if (!trackedPolyline) {
              trackedPolyline = L.polyline([[lat, lng]], {
                color: "#3082e3",
                weight: 5,
              }).addTo(map);
            } else {
              trackedPolyline.addLatLng([lat, lng]);
            }

            map.flyTo([lat, lng], 15);
          },
          () => {
            stopFollowing();
          }
        );
      } else {
        console.warn("[ViewSharedPathPage] faltan sharer_id o path_id");
      }
    });

    onUnmounted(() => {
      if (unsubscribeShared) unsubscribeShared();
      [trackedMarker, trackedPolyline].forEach((l) => {
        if (l && map) map.removeLayer(l);
      });
    });

    function stopFollowing() {
      if (unsubscribeShared) {
        unsubscribeShared();
        unsubscribeShared = null;
      } else {
        if (sharer_id && path_id) {
          stopListeningSharedPath({ sharer_id, path_id });
        }
      }

      triggerToast("Has dejado de seguir el recorrido.");

      setTimeout(() => {
        router.push("/");
      }, 500); // pequeña demora para que el toast aparezca
    }

    return {
      mapEl,
      stopFollowing,
      showToast,
      toastMessage,
    };
  },
};
</script>

<template>
  <div class="max-w-3xl mx-auto p-4 relative">
    <AppH1>Seguir recorrido</AppH1>

    <div ref="mapEl" class="mt-4 rounded-xl border" style="height: 500px;"></div>

    <div class="mt-4">
      <button
        @click="stopFollowing"
        class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
      >
        Dejar de seguir
      </button>
    </div>

    <!-- ⭐ Toast -->
    <div
      v-if="showToast"
      class="fixed top-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg animate-fade"
      style="z-index: 9999;"
    >
      {{ toastMessage }}
    </div>
  </div>
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
