<script setup>
import { ref, onMounted } from "vue";
import L from "leaflet";
import { subscribeToSharedRoute, unsubscribeChannel } from "../services/sharedRoutes";
import supabase from "../services/supabase";

// Fix iconos Leaflet
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon2x,
  iconUrl: icon,
  shadowUrl: shadow,
});

const mapEl = ref(null);
const marker = ref(null);
let map = null;
let channel = null;

// Obtener user actual
const user = ref(null);

onMounted(async () => {
  const res = await supabase.auth.getUser();
  user.value = res?.data?.user || null;
  if (!user.value) return;

  map = L.map(mapEl.value, { zoomControl: false }).setView([-34.6037, -58.3816], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);

  // Suscribirse al canal
  channel = subscribeToSharedRoute(user.value.id, ({ lat, lng }) => {
    if (!marker.value) {
      marker.value = L.marker([lat, lng]).addTo(map);
    } else {
      marker.value.setLatLng([lat, lng]);
    }
    map.setView([lat, lng], map.getZoom());
  });
});

onUnmounted(() => {
  unsubscribeChannel(channel);
});
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-xl font-semibold mb-4">Recorrido compartido</h1>
    <div ref="mapEl" class="rounded-xl border" style="height: 400px;"></div>
  </div>
</template>

<style scoped>
</style>

