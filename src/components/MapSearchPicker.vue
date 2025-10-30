<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import L from "leaflet";
import {
  nominatimSearch,
  nominatimReverse,
  composeAddress,
} from "../services/nominatim";

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

const props = defineProps({
  modelValue: { type: Object, default: null }, // { lat, lng }
  height: { type: String, default: "230px" },
  start: { type: Array, default: () => [-34.6037, -58.3816] },
  zoom: { type: Number, default: 13 },
});
const emit = defineEmits(["update:modelValue", "resolved-address"]);

const mapEl = ref(null);
const search = ref("");
const results = ref([]);
let map,
  marker,
  debounceTimer = null;

function setMarker(lat, lng, notify = true) {
  if (!marker) {
    marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on("dragend", async () => {
      const { lat, lng } = marker.getLatLng();
      emit("update:modelValue", { lat, lng });
      try {
        const rev = await nominatimReverse(lat, lng);
        emit(
          "resolved-address",
          composeAddress(rev.address) || rev.display_name
        );
      } catch (e) {
        console.error(e);
      }
    });
  } else {
    marker.setLatLng([lat, lng]);
  }
  if (notify) emit("update:modelValue", { lat, lng });
}

function onMapClick(e) {
  const { lat, lng } = e.latlng;
  setMarker(lat, lng);
  updateAddressFrom(lat, lng);
}

async function updateAddressFrom(lat, lng) {
  try {
    const rev = await nominatimReverse(lat, lng);
    emit("resolved-address", composeAddress(rev.address) || rev.display_name);
  } catch (e) {
    console.error(e);
  }
}

function onInput() {
  clearTimeout(debounceTimer);
  if (!search.value || search.value.length < 3) {
    results.value = [];
    return;
  }
  debounceTimer = setTimeout(async () => {
    try {
      // Pedimos en toda AR y después filtramos AMBA (CABA + PBA)
      const data = await nominatimSearch(search.value, {
        countrycodes: "ar",
        limit: 10,
        lang: "es",
        layer: "address",
        dedupe: 0,
      });

      // Filtrar sólo CABA o Provincia de Buenos Aires
      const amba = data.filter((r) => {
        const s = r.display_name?.toLowerCase() || "";
        return (
          s.includes("buenos aires") ||
          s.includes("ciudad autónoma de buenos aires") ||
          s.includes("caba")
        );
      });

      // Ordenar por cercanía al centro del mapa (para que Wilde/Avellaneda salgan arriba si estás por ahí)
      const c = map.getCenter();
      amba.sort((a, b) => {
        const da = dist(c.lat, c.lng, parseFloat(a.lat), parseFloat(a.lon));
        const db = dist(c.lat, c.lng, parseFloat(b.lat), parseFloat(b.lon));
        return da - db;
      });

      results.value = amba;
    } catch (e) {
      console.error(e);
      results.value = [];
    }
  }, 400);
}

// helper distancia (haversine aprox)
function dist(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function pickSuggestion(item) {
  results.value = [];
  search.value = item.display_name;
  const lat = parseFloat(item.lat);
  const lng = parseFloat(item.lon);
  map.setView([lat, lng], 17);
  setMarker(lat, lng);
  const texto = composeAddress(item.address) || item.display_name;
  emit("resolved-address", texto);
}

async function searchNow() {
  if (!search.value || search.value.length < 3) return;
  try {
    const data = await nominatimSearch(search.value, {
      countrycodes: "ar",
      limit: 10,
      lang: "es",
      layer: "address",
      dedupe: 0,
    });

    const amba = data.filter((r) => {
      const s = r.display_name?.toLowerCase() || "";
      return (
        s.includes("buenos aires") ||
        s.includes("ciudad autónoma de buenos aires") ||
        s.includes("caba")
      );
    });

    const c = map.getCenter();
    amba.sort((a, b) => {
      const da = dist(c.lat, c.lng, parseFloat(a.lat), parseFloat(a.lon));
      const db = dist(c.lat, c.lng, parseFloat(b.lat), parseFloat(b.lon));
      return da - db;
    });

    results.value = amba;

    //Si querés que Enter MUEVA el pin igual, descomentá:
    // if (amba.length) pickSuggestion(amba[0])
  } catch (e) {
    console.error(e);
  }
}

onMounted(() => {
  map = L.map(mapEl.value, { zoomControl: false }).setView(
    props.start,
    props.zoom
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);
  map.on("click", onMapClick);

  if (props.modelValue?.lat && props.modelValue?.lng) {
    setMarker(props.modelValue.lat, props.modelValue.lng, false);
    map.setView([props.modelValue.lat, props.modelValue.lng], 16);
  }
});

onBeforeUnmount(() => {
  clearTimeout(debounceTimer);
  map?.off();
  map?.remove();
});
</script>

<template>
  <!-- contenedor raíz: relativo para que el dropdown se posicione bien -->
  <div class="relative rounded-2xl border border-gray-200 bg-white">

    <!-- BUSCADOR (siempre por encima del mapa) -->
    <div class="p-2 relative z-20">
      <div class="relative">
        <input
          v-model="search"
          @input="onInput"
          @keydown.enter.prevent.stop="searchNow"
          class="w-full rounded-full border px-4 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40"
          placeholder="¿Dónde viste el problema?"
        />

        <!-- DROPDOWN DE SUGERENCIAS: por encima del mapa -->
        <ul
          v-if="results.length"
          class="absolute top-full left-0 right-0 z-[1000] mt-2 max-h-64 overflow-auto rounded-xl border bg-white shadow-xl ring-1 ring-black/10"
        >
          <li
            v-for="r in results"
            :key="r.place_id"
            @click="pickSuggestion(r)"
            class="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
          >
            <div class="font-medium">
              {{ r.address.road || r.name || r.display_name.split(',')[0] }}
              <span v-if="r.address.house_number"> {{ r.address.house_number }}</span>
            </div>
            <div class="text-gray-500 text-xs">
              {{ r.address.neighbourhood || r.address.suburb || r.address.city_district || '' }}
              <span v-if="(r.address.neighbourhood || r.address.suburb || r.address.city_district)">, </span>
              {{ r.address.city || r.address.town || r.address.village || r.address.municipality || r.address.state }}
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- MAPA: con altura fija y z-0 para NO tapar al dropdown -->
    <div ref="mapEl" :style="{ height }" class="relative z-0"></div>
  </div>
</template>

<style scoped>
input::placeholder {
  color: #9aa3a8;
}
</style>
