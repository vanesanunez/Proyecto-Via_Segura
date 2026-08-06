<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import BottomNavigation from '../components/BottomNavigation.vue';

// ── Estado ─────────────────────────────────────────────────────────────────
const direccionInput = ref('');
const sugerencias = ref([]);
const ubicacionUsuario = ref(null); // { lat, lng }
const radioBusqueda = ref(1200);
const cargandoBusqueda = ref(false);
const cargandoGPS = ref(false);
const error = ref('');
const inputFocused = ref(false);
const itemSeleccionado = ref(null);
const resultados = ref([]);
const resultsOpen = ref(true);
let debounceTimer = null;
let debounceRefetch = null;
let overpassAbortController = null;
let searchToken = 0; // evita que una respuesta vieja pise a una más nueva

const selectedCategory = ref('police');

// ── Categorías: se eligen una sola vez, antes de buscar ─────────────────────
const categorias = [
  {
    value: 'police',
    label: 'Comisarías',
    labelSingular: 'comisaría',
    icon: 'M9 12.75 11.25 15 15 9.75M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z',
  },
  {
    value: 'hospital',
    label: 'Hospitales',
    labelSingular: 'hospital',
    icon: 'M12 6v12m6-6H6',
  },
  {
    value: 'pharmacy',
    label: 'Farmacias',
    labelSingular: 'farmacia',
    icon: 'M9 12h6m-6 4h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z',
  },
  {
    value: 'fire_station',
    label: 'Bomberos',
    labelSingular: 'cuartel de bomberos',
    icon: 'M12 2c1 3-2 4-2 7a4 4 0 108 0c0-1-.5-2-1-2 .5 2-1 3-2 2 1-2-1-4-3-7z',
  },
];

// Paleta única de marca: azul para todo lo activo/seleccionado, gris para lo inactivo.
const ACCENT_COLOR = '#3082e3';
const ACCENT_BG = '#eef4ff';

const categoriaActual = computed(
  () => categorias.find((c) => c.value === selectedCategory.value) || categorias[0]
);

// ── Mapa ───────────────────────────────────────────────────────────────────
const mapaRef = ref(null);
let mapa = null;
let L = null;
let markers = [];
let markerUsuario = null;
let circuloRadio = null;
let rutaControl = null;

// ── Utilidades ─────────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatearDistancia(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

function limpiarBusqueda() {
  direccionInput.value = '';
  sugerencias.value = [];
  error.value = '';
}

function nuevaBusqueda() {
  overpassAbortController?.abort();
  limpiarMapa();
  ubicacionUsuario.value = null;
  itemSeleccionado.value = null;
  resultados.value = [];
  resultsOpen.value = true;
  direccionInput.value = '';
  sugerencias.value = [];
  error.value = '';
}

// ── Autocomplete Nominatim ─────────────────────────────────────────────────
function onInputChange() {
  clearTimeout(debounceTimer);
  if (direccionInput.value.length < 4) { sugerencias.value = []; return; }
  debounceTimer = setTimeout(buscarSugerencias, 400);
}

async function buscarSugerencias() {
  try {
    // const url = `/nominatim/search?format=json&q=${encodeURIComponent(direccionInput.value)}&countrycodes=ar&limit=4`;
    const url = `/api/nominatim?format=json&q=${encodeURIComponent(direccionInput.value)}&countrycodes=ar&limit=4`;
    sugerencias.value = await (await fetch(url)).json();
  } catch { sugerencias.value = []; }
}

async function seleccionarSugerencia(s) {
  direccionInput.value = s.display_name;
  sugerencias.value = [];
  ubicacionUsuario.value = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
  await buscarCercanos();
}

async function buscarDireccion() {
  if (!direccionInput.value.trim()) return;
  cargandoBusqueda.value = true;
  error.value = '';
  sugerencias.value = [];
  try {
    const url = `/api/nominatim?format=json&q=${encodeURIComponent(direccionInput.value)}&countrycodes=ar&limit=1`;
    const data = await (await fetch(url)).json();
    if (!data.length) { error.value = 'No se encontró la dirección. Intentá con otra.'; cargandoBusqueda.value = false; return; }
    ubicacionUsuario.value = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    await buscarCercanos();
  } catch {
    error.value = 'Error de conexión. Revisá tu red e intentá de nuevo.';
    cargandoBusqueda.value = false;
  }
}

// ── GPS ────────────────────────────────────────────────────────────────────
function usarUbicacionActual() {
  if (!navigator.geolocation) { error.value = 'Tu dispositivo no soporta geolocalización.'; return; }
  cargandoGPS.value = true;
  error.value = '';
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      ubicacionUsuario.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      direccionInput.value = 'Mi ubicación actual';
      cargandoGPS.value = false;
      await buscarCercanos();
    },
    () => {
      error.value = 'No se pudo obtener tu ubicación. Ingresá una dirección manualmente.';
      cargandoGPS.value = false;
    }
  );
}

// ── Leaflet init ───────────────────────────────────────────────────────────
async function initLeaflet() {
  if (L) return;
  L = (await import('leaflet')).default;
  await import('leaflet/dist/leaflet.css');
}

async function initMapa() {
  await initLeaflet();
  if (!mapaRef.value || mapa) return;
  mapa = L.map(mapaRef.value, { zoomControl: false, attributionControl: false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapa);
  L.control.zoom({ position: 'topright' }).addTo(mapa);
}

function limpiarMapa() {
  if (!mapa) return;
  markers.forEach((m) => m.remove()); markers = [];
  markerUsuario?.remove(); markerUsuario = null;
  circuloRadio?.remove(); circuloRadio = null;
  if (rutaControl) { try { rutaControl.remove(); } catch (_) { } rutaControl = null; }
}

// ── Render de markers (siempre en azul de marca) ────────────────────────────
function iconUsuario() {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${ACCENT_COLOR};border:3px solid white;box-shadow:0 0 0 4px rgba(48,130,227,0.2);"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7], className: '',
  });
}

function iconItem(activo) {
  return activo
    ? L.divIcon({
      html: `<div style="width:34px;height:34px;border-radius:50%;background:${ACCENT_COLOR};border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(48,130,227,0.35);">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                   <path d="${categoriaActual.value.icon}"/>
                 </svg></div>`,
      iconSize: [34, 34], iconAnchor: [17, 17], className: '',
    })
    : L.divIcon({
      html: `<div style="width:30px;height:30px;border-radius:50%;background:#fff;border:2.5px solid ${ACCENT_COLOR};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(48,130,227,0.2);">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${ACCENT_COLOR}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                   <path d="${categoriaActual.value.icon}"/>
                 </svg></div>`,
      iconSize: [30, 30], iconAnchor: [15, 15], className: '',
    });
}

// ── Actualizar mapa completo ───────────────────────────────────────────────
async function actualizarMapa() {
  await nextTick();
  await initMapa();
  if (!mapa || !ubicacionUsuario.value) return;

  limpiarMapa();
  const { lat, lng } = ubicacionUsuario.value;

  markerUsuario = L.marker([lat, lng], { icon: iconUsuario() }).addTo(mapa);

  circuloRadio = L.circle([lat, lng], {
    radius: radioBusqueda.value,
    color: ACCENT_COLOR,
    fillColor: ACCENT_COLOR,
    fillOpacity: 0.06, weight: 1.5, dashArray: '6,4',
  }).addTo(mapa);

  resultados.value.forEach((item) => {
    if (!item.lat || !item.lon) return;
    const activo = itemSeleccionado.value?.raw.id === item.raw.id;
    const m = L.marker([item.lat, item.lon], { icon: iconItem(activo) })
      .bindPopup(
        `<div style="font-family:Inter,sans-serif;min-width:150px;padding:2px 0;">
           <p style="font-size:13px;font-weight:600;color:#2a2a2a;margin:0 0 4px;">${item.name}</p>
           <p style="font-size:12px;color:${ACCENT_COLOR};margin:0;font-weight:600;">${isFinite(item.distance) ? formatearDistancia(item.distance) : ''}</p>
         </div>`,
        { closeButton: false, maxWidth: 200 }
      )
      .addTo(mapa);
    markers.push(m);
  });

  const bounds = L.latLngBounds([[lat, lng]]);
  resultados.value.forEach((item) => {
    if (item.lat && item.lon) bounds.extend([item.lat, item.lon]);
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!mapa) return;
      mapa.invalidateSize({ animate: false, pan: false });
      if (resultados.value.length) {
        mapa.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      } else {
        mapa.setView([lat, lng], 14);
      }
    });
  });

  if (itemSeleccionado.value) {
    await trazarRuta(itemSeleccionado.value);
  }
}

// ── Ruta con leaflet-routing-machine (polyline azul) ───────────────────────
async function trazarRuta(item) {
  if (!mapa || !ubicacionUsuario.value) return;
  if (rutaControl) { try { rutaControl.remove(); } catch (_) { } rutaControl = null; }

  const lrmMod = await import('leaflet-routing-machine');
  const LRM = lrmMod.default ?? lrmMod;
  const Routing = L.Routing ?? LRM.Routing ?? LRM;

  const { lat, lng } = ubicacionUsuario.value;

  rutaControl = Routing.control({
    waypoints: [
      L.latLng(lat, lng),
      L.latLng(item.lat, item.lon),
    ],
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: false,
    showAlternatives: false,
    show: false,
    lineOptions: {
      styles: [
        { color: ACCENT_COLOR, weight: 5, opacity: 0.9 },
        { color: '#ffffff', weight: 2, opacity: 0.4 },
      ],
      extendToWaypoints: true,
      missingRouteTolerance: 0,
    },
    createMarker: () => null,
    router: Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1',
    }),
  }).addTo(mapa);

  rutaControl.on('routesfound routingerror', () => {
    const c = rutaControl?.getContainer?.();
    if (c) c.style.display = 'none';
  });
}

// ── Overpass: servicios cercanos ────────────────────────────────────────────
// Dos endpoints: si el principal tarda o falla, probamos el espejo.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

// Solo "node" (cubre la gran mayoría de estos servicios) y límite de 60
// resultados directo en la query: esto es lo que más acelera la búsqueda,
// porque evita que Overpass procese way/relation (mucho más pesado) y
// evita traer cientos de puntos en zonas densas como CABA.
function buildOverpassQuery(lat, lon, radius, category) {
  return `
    [out:json][timeout:8];
    node(around:${radius},${lat},${lon})[amenity=${category}];
    out  60;
  `;
}

function formatAddressFromTags(tags) {
  if (!tags) return null;
  if (tags['addr:full']) return tags['addr:full'];

  const street = tags['addr:street'] || tags['street'];
  const housenumber = tags['addr:housenumber'] || tags['housenumber'];
  const city = tags['addr:city'] || tags['city'];
  const barrio = tags['neighbourhood'] || tags['suburb'] || tags['addr:suburb'];

  const parts = [];
  if (street) parts.push(street + (housenumber ? ` ${housenumber}` : ''));
  if (barrio) parts.push(barrio);
  if (city) parts.push(city);

  return parts.join(', ') || null;
}

function parseOverpass(json, category) {
  if (!json || !json.elements) return [];

  return json.elements.map((el) => {
    const tags = el.tags || {};
    const name = tags.name || tags['operator'] || categoriaActual.value.labelSingular;

    let lat = null, lon = null;
    if (el.lat) { lat = el.lat; lon = el.lon; }
    else if (el.center) { lat = el.center.lat; lon = el.center.lon; }

    return { raw: el, type: category, name, address: formatAddressFromTags(tags), lat, lon };
  });
}

// async function consultarOverpass(query, signal) {
//   let lastError = null;

//   for (const endpoint of OVERPASS_ENDPOINTS) {
//     try {
//       const res = await fetch(endpoint, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
//         body: 'data=' + encodeURIComponent(query),
//         signal,
//       });

//       if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
//       return await res.json();
//     } catch (err) {
//       if (err.name === 'AbortError') throw err;
//       lastError = err;
//       // probamos el siguiente endpoint disponible
//     }
//   }

//   throw lastError || new Error('No se pudo conectar con el servicio de búsqueda.');
// }
async function consultarOverpass(query, signal) {
  const res = await fetch('/api/overpass', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: 'data=' + encodeURIComponent(query),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'No fue posible consultar Overpass.');
  }

  return await res.json();
}

async function buscarCercanos() {
  error.value = '';

  if (!ubicacionUsuario.value?.lat) {
    error.value = 'Primero seleccioná una dirección.';
    return;
  }

  // cancelamos cualquier búsqueda anterior todavía en vuelo
  overpassAbortController?.abort();
  overpassAbortController = new AbortController();
  const myToken = ++searchToken;

  const { lat, lng: lon } = ubicacionUsuario.value;
  const radius = Number(radioBusqueda.value) || 1200;
  const category = selectedCategory.value;

  const query = buildOverpassQuery(lat, lon, radius, category);

  cargandoBusqueda.value = true;

  try {
    const json = await consultarOverpass(query, overpassAbortController.signal);

    // si mientras esperábamos se disparó una búsqueda más nueva, descartamos esta respuesta
    if (myToken !== searchToken) return;

    const parsed = parseOverpass(json, category);

    const ordered = parsed
      .map((i) => ({ ...i, distance: i.lat ? haversine(lat, lon, i.lat, i.lon) : Infinity }))
      .sort((a, b) => a.distance - b.distance);

    resultados.value = ordered;
    itemSeleccionado.value = null;
    resultsOpen.value = true;

    await actualizarMapa();
  } catch (err) {
    if (err.name === 'AbortError') return; // búsqueda cancelada a propósito, no es un error real
    console.error(err);
    error.value = err.message || 'Error consultando el servicio de búsqueda.';
  } finally {
    if (myToken === searchToken) cargandoBusqueda.value = false;
  }
}

// Seleccionar item de la lista (traza ruta) 
async function seleccionarItem(item) {
  if (itemSeleccionado.value?.raw.id === item.raw.id) {
    itemSeleccionado.value = null;
    await actualizarMapa();
    return;
  }
  itemSeleccionado.value = item;
  await actualizarMapa();

  if (mapa) {
    const { lat, lng } = ubicacionUsuario.value;
    const bounds = L.latLngBounds([[lat, lng], [item.lat, item.lon]]);
    mapa.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    markers.forEach((m) => {
      const ll = m.getLatLng();
      if (Math.abs(ll.lat - item.lat) < 0.00002) m.openPopup();
    });
  }
}

// ── Watcher: re-buscar al cambiar el radio (con debounce) 
watch(radioBusqueda, () => {
  if (!ubicacionUsuario.value) return;
  clearTimeout(debounceRefetch);
  debounceRefetch = setTimeout(() => {
    buscarCercanos();
  }, 450);
});

// Cleanup 
onUnmounted(() => {
  overpassAbortController?.abort();
  mapa?.remove();
  mapa = null;
});
</script>

<template>
  <div class="w-full min-h-screen bg-white font-['Inter'] overflow-x-hidden" style="color: #2a2a2a;">
    <div class="mx-auto w-full max-w-md flex flex-col min-h-screen overflow-x-hidden">

      <!-- ── HEADER ── -->
      <div class="flex items-center gap-3 mt-4 px-4 py-3 border-b border-gray-100 w-full">
        <button @click="$router.back()"
          class="flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#2a2a2a"
            stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="min-w-0">
          <h1 class="text-base font-semibold leading-tight" style="color:#2a2a2a;">Información útil</h1>
          <p class="text-xs mt-1" style="color:#6b7280;">Hospitales, comisarías, bomberos y farmacias cerca tuyo</p>
        </div>
      </div>

      <!-- VISTA A — BÚSQUEDA (sin ubicación aún) -->
      <div v-if="!ubicacionUsuario" class="flex-1 flex flex-col overflow-y-auto overflow-x-hidden w-full">

        <!-- Ilustración + título -->
        <div class="flex flex-col items-center pt-8 pb-5 px-6 gap-3 w-full">
          <div class="w-20 h-20 rounded-full flex items-center justify-center shrink-0" style="background:#eff6ff;">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#3082e3"
              stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25h.008v.008H12V8.25z" />
            </svg>
          </div>
          <div class="text-center px-2">
            <h2 class="font-semibold text-base" style="color:#2a2a2a;">Encontrá ayuda cerca tuyo</h2>
            <p class="text-sm mt-1 max-w-xs mx-auto" style="color:#6b7280;">
              Elegí qué buscás e ingresá tu dirección o usá tu ubicación actual
            </p>
          </div>
        </div>

        <!-- Formulario -->
        <div class="px-4 flex flex-col gap-4 w-full">

          <!-- Categorías: se eligen acá, una sola vez -->
          <div class="w-full">
            <p class="text-xs font-semibold mb-2" style="color:#6b7280;">¿Qué estás buscando?</p>
            <div class="grid grid-cols-2 gap-2 w-full">
              <button v-for="cat in categorias" :key="cat.value" @click="selectedCategory = cat.value"
                class="flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-all active:scale-95 min-w-0"
                :style="selectedCategory === cat.value
                  ? `border-color:${ACCENT_COLOR}; background:${ACCENT_BG};`
                  : 'border-color:#e5e7eb; background:#fff;'">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  :style="`background:${selectedCategory === cat.value ? ACCENT_COLOR : '#f3f4f6'};`">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                    :stroke="selectedCategory === cat.value ? '#fff' : '#9ca3af'" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="cat.icon" />
                  </svg>
                </div>
                <span class="text-sm font-semibold truncate"
                  :style="`color:${selectedCategory === cat.value ? ACCENT_COLOR : '#2a2a2a'};`">
                  {{ cat.label }}
                </span>
              </button>
            </div>
          </div>

          <!-- Input con botón limpiar -->
          <div class="relative w-full">
            <svg xmlns="http://www.w3.org/2000/svg"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none"
              viewBox="0 0 24 24" stroke="#9ca3af" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input v-model="direccionInput" @input="onInputChange" @keydown.enter="buscarDireccion"
              placeholder="Ej: Av. Corrientes 1200, CABA"
              class="w-full rounded-xl pl-9 pr-10 py-3 text-sm border focus:outline-none transition-all box-border"
              :style="`border-color:${inputFocused ? '#3082e3' : '#e5e7eb'};
                       box-shadow:${inputFocused ? '0 0 0 3px rgba(48,130,227,0.15)' : 'none'};`"
              @focus="inputFocused = true" @blur="inputFocused = false" />
            <button v-if="direccionInput" @click="limpiarBusqueda"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
              style="background:#e5e7eb;">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#6b7280"
                stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Sugerencias autocomplete -->
          <ul v-if="sugerencias.length" class="border border-gray-100 rounded-xl overflow-hidden shadow-md w-full">
            <li v-for="s in sugerencias" :key="s.place_id" @click="seleccionarSugerencia(s)"
              class="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-blue-50 active:bg-blue-100 border-b border-gray-50 last:border-0 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none"
                viewBox="0 0 24 24" stroke="#3082e3" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="text-xs leading-relaxed min-w-0" style="color:#2a2a2a; word-break: break-word;">{{
                s.display_name }}</span>
            </li>
          </ul>

          <!-- Radio de búsqueda -->
          <div class="flex items-center gap-3 w-full min-w-0">
            <span class="text-xs font-medium shrink-0" style="color:#6b7280;">Radio</span>
            <input type="range" v-model.number="radioBusqueda" min="500" max="3000" step="250" class="flex-1 min-w-0"
              style="accent-color:#3082e3;" />
            <span class="text-xs font-semibold shrink-0 w-14 text-right" style="color:#3082e3;">
              {{ radioBusqueda >= 1000 ? (radioBusqueda / 1000).toFixed(1) + ' km' : radioBusqueda + ' m' }}
            </span>
          </div>

          <!-- Botón buscar (azul primario) -->
          <button @click="buscarDireccion" :disabled="cargandoBusqueda || !direccionInput.trim()"
            class="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
            style="background:#3082e3;">
            {{ cargandoBusqueda ? 'Buscando...' : `Buscar ${categoriaActual.label.toLowerCase()} cerca de esta
            dirección` }}
          </button>

          <!-- Separador -->
          <div class="flex items-center gap-3 w-full">
            <div class="flex-1 h-px bg-gray-100"></div>
            <span class="text-xs" style="color:#9ca3af;">o</span>
            <div class="flex-1 h-px bg-gray-100"></div>
          </div>

          <!-- Botón GPS (outline azul) -->
          <button @click="usarUbicacionActual" :disabled="cargandoGPS"
            class="w-full py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            style="border-color:#3082e3; color:#3082e3; background:#fff;">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path stroke-linecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2" />
            </svg>
            {{ cargandoGPS ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual' }}
          </button>

          <!-- Error -->
          <div v-if="error" class="px-4 py-3 rounded-xl border text-sm mb-4 w-full"
            style="background:#fff1f0; border-color:#fca5a5; color:#dc2626;">
            {{ error }}
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           VISTA B — RESULTADOS (con ubicación)
      ══════════════════════════════════════════ -->
      <div v-if="ubicacionUsuario" class="flex-1 flex flex-col overflow-hidden w-full">

        <!-- Barra de dirección + categoría activa -->
        <div class="px-4 py-2.5 border-b border-gray-100 overflow-hidden w-full" style="background:#f9fafb;">
          <div class="flex items-start gap-2 w-full overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24"
              stroke="#3082e3" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="text-xs min-w-0 flex-1"
              style="color:#2a2a2a; word-break: break-word; overflow-wrap: anywhere;">{{ direccionInput }}</span>
          </div>
          <span class="mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            :style="`background:${ACCENT_BG}; color:${ACCENT_COLOR};`">
            {{ categoriaActual.label }}
          </span>
        </div>

        <!-- Mapa Leaflet -->
        <div ref="mapaRef" class="w-full shrink-0" style="height: 300px; z-index:0;"></div>

        <!-- Slider de radio -->
        <div class="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3 shrink-0 w-full min-w-0">
          <span class="text-xs font-medium shrink-0" style="color:#6b7280;">Radio</span>
          <input type="range" v-model.number="radioBusqueda" min="500" max="3000" step="250" class="flex-1 min-w-0"
            style="accent-color:#3082e3;" />
          <span class="text-xs font-semibold shrink-0 w-14 text-right" style="color:#3082e3;">
            {{ radioBusqueda >= 1000 ? (radioBusqueda / 1000).toFixed(1) + ' km' : radioBusqueda + ' m' }}
          </span>
        </div>

        <!-- ══════ Resultados: desplegable ══════ -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <div class="px-4 py-3 w-full">
            <button type="button" @click="resultsOpen = !resultsOpen"
              class="flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-all active:scale-[0.99]"
              :style="`border-color:${ACCENT_COLOR}; background:${ACCENT_BG};`">
              <div class="flex items-center gap-2.5 min-w-0 text-left">
                <div v-if="cargandoBusqueda" class="w-4 h-4 rounded-full border-2 animate-spin shrink-0"
                  :style="`border-color:${ACCENT_COLOR}; border-top-color:transparent;`"></div>
                <span class="text-sm font-semibold min-w-0" :style="`color:${ACCENT_COLOR};`">
                  <template v-if="cargandoBusqueda">Buscando...</template>
                  <template v-else>
                    <span class="block">
                      Resultados de tu búsqueda de {{ categoriaActual.label.toLowerCase() }} más cerca de tu zona
                    </span>
                    <span class="block text-xs font-normal mt-0.5" :style="`color:${ACCENT_COLOR}; opacity:0.8;`">
                      {{ resultados.length }} {{ resultados.length === 1 ? 'resultado' : 'resultados' }}
                    </span>
                  </template>
                </span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 transition-transform duration-300 ml-2"
                :class="resultsOpen ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" :stroke="ACCENT_COLOR"
                stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <transition name="accordion">
              <div v-if="resultsOpen" class="overflow-hidden w-full resultados-container">
                <div
                  class="mt-2 max-h-72 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-100 w-full max-w-full">

                  <!-- Sin resultados -->
                  <div v-if="!cargandoBusqueda && resultados.length === 0"
                    class="flex flex-col items-center justify-center py-10 px-8 text-center gap-3">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                      style="background:#f3f4f6;">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24"
                        stroke="#9ca3af" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35" />
                      </svg>
                    </div>
                    <p class="text-sm font-medium" style="color:#2a2a2a;">Sin resultados en este radio</p>
                    <p class="text-xs" style="color:#9ca3af;">Aumentá el slider o probá una nueva búsqueda</p>
                  </div>

                  <!-- Items -->
                  <template v-else>
                    <div v-for="(item, index) in resultados" :key="item.raw.id" @click="seleccionarItem(item)"
                      class="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 cursor-pointer transition-colors w-full min-w-0 overflow-hidden"
                      :style="`background:${itemSeleccionado?.raw.id === item.raw.id ? ACCENT_BG : '#fff'};
                               border-left: ${itemSeleccionado?.raw.id === item.raw.id ? `3px solid ${ACCENT_COLOR}` : '3px solid transparent'};`">
                      <!-- Número -->
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        :style="`background:${itemSeleccionado?.raw.id === item.raw.id ? ACCENT_COLOR : ACCENT_BG};
                                 color:${itemSeleccionado?.raw.id === item.raw.id ? '#fff' : ACCENT_COLOR};`">
                        {{ index + 1 }}
                      </div>

                      <!-- Info -->
                      <div class="flex-1 min-w-0 overflow-hidden">
                        <p class="text-sm font-medium leading-5" style="overflow-wrap:anywhere;word-break:break-word;">
                          {{ item.name }}</p>
                        <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span class="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                            :style="`background:${ACCENT_BG}; color:${ACCENT_COLOR};`">
                            {{ isFinite(item.distance) ? formatearDistancia(item.distance) : "—" }}
                          </span>
                          <span v-if="itemSeleccionado?.raw.id === item.raw.id"
                            class="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                            style="background:#fff3f2; color:#3082e3;">
                            Ruta activa
                          </span>
                          <span v-else-if="item.address" class="text-xs block"
                            style="overflow-wrap:anywhere;word-break:break-word;">{{ item.address }}</span>
                        </div>
                      </div>

                      <!-- Chevron -->
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2"
                        :style="`color:${itemSeleccionado?.raw.id === item.raw.id ? ACCENT_COLOR : '#d1d5db'}`">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </template>
                </div>
              </div>
            </transition>
          </div>

          <div class="px-4 pb-6 w-full">
            <button @click="nuevaBusqueda"
              class="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style="background:#3082e3;">
              Nueva búsqueda
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- ── Spinner global (dirección/GPS) ── -->
  <div v-if="cargandoGPS || (cargandoBusqueda && !ubicacionUsuario)"
    class="fixed inset-0 flex items-center justify-center z-50" style="background:rgba(255,255,255,0.85);">
    <div class="flex flex-col items-center gap-3">
      <div class="w-10 h-10 rounded-full border-2 animate-spin"
        style="border-color:#3082e3; border-top-color:transparent;"></div>
      <p class="text-sm font-medium" style="color:#2a2a2a;">
        {{ cargandoGPS ? 'Obteniendo ubicación...' : 'Buscando dirección...' }}
      </p>
    </div>
  </div>

  <BottomNavigation />
</template>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-6px);
}

.accordion-enter-to,
.accordion-leave-from {
  opacity: 1;
  max-height: 420px;
}

.resultados-container {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  overflow-x: hidden;
}

.w-full {
  max-width: 100%;
}

p,
span,
div {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.leaflet-container {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}
</style>
