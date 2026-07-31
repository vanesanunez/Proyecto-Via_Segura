<template>
    <div class="flex flex-col h-full bg-white font-['Inter'] overflow-x-hidden" style="color: #2a2a2a;">
  
      <!-- ── HEADER ── -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button @click="$router.back()"
          class="flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#2a2a2a"
            stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="min-w-0">
          <h1 class="text-base font-semibold leading-tight" style="color:#2a2a2a;">Puntos Seguros</h1>
          <p class="text-xs" style="color:#6b7280;">Botones antipánico en CABA</p>
        </div>
      </div>
  
      <!-- ══════════════════════════════════════════
           VISTA A — BÚSQUEDA (sin ubicación aún)
      ══════════════════════════════════════════ -->
      <div v-if="!ubicacionUsuario" class="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
  
        <!-- Ilustración + título -->
        <div class="flex flex-col items-center pt-10 pb-6 px-6 gap-3">
          <div class="w-20 h-20 rounded-full flex items-center justify-center" style="background:#eff6ff;">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#3082e3"
              stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 3C12 3 4 6.5 4 12v5.5l8 2.5 8-2.5V12C20 6.5 12 3 12 3z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div class="text-center">
            <p class="font-semibold text-base" style="color:#2a2a2a;">Encontrá el punto seguro más cercano</p>
            <p class="text-sm mt-1" style="color:#6b7280;">Ingresá tu dirección o usá tu ubicación actual</p>
          </div>
        </div>
  
        <!-- Formulario -->
        <div class="px-4 flex flex-col gap-3">
  
          <!-- Input con botón limpiar -->
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24"
              stroke="#9ca3af" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input v-model="direccionInput" @input="onInputChange" @keydown.enter="buscarDireccion"
              placeholder="Ej: Av. Corrientes 1200, CABA"
              class="w-full rounded-xl pl-9 pr-10 py-3 text-sm border focus:outline-none transition-all" :style="`border-color:${inputFocused ? '#3082e3' : '#e5e7eb'};
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
          <ul v-if="sugerencias.length" class="border border-gray-100 rounded-xl overflow-hidden shadow-md">
            <li v-for="s in sugerencias" :key="s.place_id" @click="seleccionarSugerencia(s)"
              class="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-blue-50 active:bg-blue-100 border-b border-gray-50 last:border-0 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24"
                stroke="#3082e3" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="text-xs leading-relaxed  min-w-0" style="color:#2a2a2a; word-break: break-word;">{{
                s.display_name }}</span>
            </li>
          </ul>
  
          <!-- Botón buscar (azul primario) -->
          <button @click="buscarDireccion" :disabled="cargandoBusqueda || !direccionInput.trim()"
            class="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 "
            style="background:#3082e3;">
            {{ cargandoBusqueda ? 'Buscando...' : 'Buscar puntos seguros' }}
          </button>
  
          <!-- Separador -->
          <div class="flex items-center gap-3">
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
          <div v-if="error" class="px-4 py-3 rounded-xl border text-sm"
            style="background:#fff1f0; border-color:#fca5a5; color:#dc2626;">
            {{ error }}
          </div>
        </div>
      </div>
  
      <!-- ══════════════════════════════════════════
           VISTA B — RESULTADOS (con ubicación)
      ══════════════════════════════════════════ -->
      <div v-if="ubicacionUsuario" class="flex-1 flex flex-col overflow-hidden">
  
        <!-- Barra de dirección activa: columna, sin overflow horizontal -->
        <div class="px-4 py-2.5 border-b border-gray-100 overflow-hidden" style="background:#f9fafb;">
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
          <button @click="nuevaBusqueda"
            class="mt-2 text-xs font-semibold px-3 py-1 rounded-full border transition-colors active:bg-blue-50"
            style="border-color:#3082e3; color:#3082e3;">
            Nueva búsqueda
          </button>
        </div>
  
        <!-- Mapa Leaflet-->
        <div ref="mapaRef" class="w-full shrink-0" style="height: 400px; z-index:0;"></div>
  
        <!-- Slider de radio -->
        <div class="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3 shrink-0">
          <span class="text-xs font-medium shrink-0" style="color:#6b7280;">Radio</span>
          <input type="range" v-model.number="radioBusqueda" min="200" max="3000" step="100" class="flex-1 min-w-0"
            style="accent-color:#3082e3;" />
          <span class="text-xs font-semibold shrink-0 w-14 text-right" style="color:#3082e3;">
            {{ radioBusqueda >= 1000 ? (radioBusqueda / 1000).toFixed(1) + ' km' : radioBusqueda + ' m' }}
          </span>
        </div>
  
        <!-- Encabezado de lista -->
        <div class="px-4 py-2 flex items-center justify-between border-b border-gray-100 shrink-0">
          <span class="text-xs" style="color:#6b7280;">
            <span class="font-semibold" style="color:#3082e3;">{{ puntosEnRadio.length }}</span>
            {{ puntosEnRadio.length === 1 ? ' punto seguro encontrado' : ' puntos seguros encontrados' }}
          </span>
          <span class="text-xs" style="color:#9ca3af;">Por distancia</span>
        </div>
  
        <!-- Lista scrolleable -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden">
  
          <!-- Sin resultados -->
          <div v-if="puntosEnRadio.length === 0"
            class="flex flex-col items-center justify-center py-12 px-8 text-center gap-3">
            <div class="w-14 h-14 rounded-full flex items-center justify-center" style="background:#f3f4f6;">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#9ca3af"
                stroke-width="1.5">
                <circle cx="11" cy="11" r="8" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p class="text-sm font-medium" style="color:#2a2a2a;">Sin puntos seguros en este radio</p>
            <p class="text-xs" style="color:#9ca3af;">Aumentá el slider para ampliar la búsqueda</p>
          </div>
  
          <!-- Items -->
          <div v-for="(punto, index) in puntosEnRadio" :key="punto.id" @click="seleccionarPunto(punto)"
            class="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 cursor-pointer transition-colors"
            :style="`background:${puntoSeleccionado?.id === punto.id ? '#eff6ff' : '#fff'};
                     border-left: ${puntoSeleccionado?.id === punto.id ? '3px solid #3082e3' : '3px solid transparent'};`">
            <!-- Número -->
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" :style="`background:${puntoSeleccionado?.id === punto.id ? '#3082e3' : '#eff6ff'};
                       color:${puntoSeleccionado?.id === punto.id ? '#fff' : '#3082e3'};`">
              {{ index + 1 }}
            </div>
  
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate" style="color:#2a2a2a;">{{ punto.direccion }}</p>
              <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span class="text-xs font-semibold px-1.5 py-0.5 rounded-md" style="background:#eff6ff; color:#3082e3;">
                  {{ formatearDistancia(punto.distancia) }}
                </span>
                <span v-if="puntoSeleccionado?.id === punto.id" class="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                  style="background:#fff3f2; color:#f2826d;">
                  Ruta activa
                </span>
              </div>
            </div>
  
            <!-- Chevron -->
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2"
              :style="`color:${puntoSeleccionado?.id === punto.id ? '#3082e3' : '#d1d5db'}`">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
  
          <!-- Botón volver al inicio -->
          <div class="px-4 py-5 flex justify-center">
            <button @click="$router.push('/')"
              class="flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold border transition-all active:scale-95"
              style="border-color:#e5e7eb; color:#3082e3; background:#f9fafb;">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Volver al inicio
            </button>
          </div>
  
        </div>
      </div>
  
      <!-- ── Spinner global ── -->
      <div v-if="cargandoBusqueda || cargandoGPS" class="absolute inset-0 flex items-center justify-center z-50"
        style="background:rgba(255,255,255,0.8);">
        <div class="flex flex-col items-center gap-3">
          <div class="w-10 h-10 rounded-full border-2 animate-spin"
            style="border-color:#3082e3; border-top-color:transparent;"></div>
          <p class="text-sm font-medium" style="color:#2a2a2a;">
            {{ cargandoGPS ? 'Obteniendo ubicación...' : 'Buscando dirección...' }}
          </p>
        </div>
      </div>
  
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
  import { puntosSegurosCoordenadas } from '../services/puntosSegurosCoordenadas.js';
  
  // ── Estado ─────────────────────────────────────────────────────────────────
  const direccionInput = ref('');
  const sugerencias = ref([]);
  const ubicacionUsuario = ref(null);
  const radioBusqueda = ref(800);
  const cargandoBusqueda = ref(false);
  const cargandoGPS = ref(false);
  const error = ref('');
  const inputFocused = ref(false);
  const puntoSeleccionado = ref(null);
  let debounceTimer = null;
  
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
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  
  function formatearDistancia(m) {
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
  }
  
  // ── Computed ───────────────────────────────────────────────────────────────
  const puntosEnRadio = computed(() => {
    if (!ubicacionUsuario.value) return [];
    const { lat, lng } = ubicacionUsuario.value;
    return puntosSegurosCoordenadas
      .map(p => ({ ...p, distancia: haversine(lat, lng, p.lat, p.lng) }))
      .filter(p => p.distancia <= radioBusqueda.value)
      .sort((a, b) => a.distancia - b.distancia);
  });
  
  // ── Acciones ───────────────────────────────────────────────────────────────
  function limpiarBusqueda() {
    direccionInput.value = '';
    sugerencias.value = [];
    error.value = '';
  }
  
  function nuevaBusqueda() {
    limpiarMapa();
    ubicacionUsuario.value = null;
    puntoSeleccionado.value = null;
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
      const url = `/nominatim/search?format=json&q=${encodeURIComponent(direccionInput.value)}&countrycodes=ar&limit=4`;
      sugerencias.value = await (await fetch(url)).json();
    } catch { sugerencias.value = []; }
  }
  
  async function seleccionarSugerencia(s) {
    direccionInput.value = s.display_name;
    sugerencias.value = [];
    ubicacionUsuario.value = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    await actualizarMapa();
  }
  
  async function buscarDireccion() {
    if (!direccionInput.value.trim()) return;
    cargandoBusqueda.value = true;
    error.value = '';
    sugerencias.value = [];
    try {
      const url = `/nominatim/search?format=json&q=${encodeURIComponent(direccionInput.value)}&countrycodes=ar&limit=1`;
      const data = await (await fetch(url)).json();
      if (!data.length) { error.value = 'No se encontró la dirección. Intentá con otra.'; return; }
      ubicacionUsuario.value = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      await actualizarMapa();
    } catch {
      error.value = 'Error de conexión. Revisá tu red e intentá de nuevo.';
    } finally {
      cargandoBusqueda.value = false;
    }
  }
  
  // ── GPS ────────────────────────────────────────────────────────────────────
  function usarUbicacionActual() {
    if (!navigator.geolocation) { error.value = 'Tu dispositivo no soporta geolocalización.'; return; }
    cargandoGPS.value = true;
    error.value = '';
    navigator.geolocation.getCurrentPosition(
      async pos => {
        ubicacionUsuario.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        direccionInput.value = 'Mi ubicación actual';
        cargandoGPS.value = false;
        await actualizarMapa();
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
    markers.forEach(m => m.remove()); markers = [];
    markerUsuario?.remove(); markerUsuario = null;
    circuloRadio?.remove(); circuloRadio = null;
    if (rutaControl) { try { rutaControl.remove(); } catch (_) { } rutaControl = null; }
  }
  
  // ── Render de markers ──────────────────────────────────────────────────────
  function iconUsuario() {
    return L.divIcon({
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#3082e3;border:3px solid white;box-shadow:0 0 0 4px rgba(48,130,227,0.2);"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7], className: ''
    });
  }
  
  function iconPunto(activo) {
    return activo
      ? L.divIcon({
        html: `<div style="width:34px;height:34px;border-radius:50%;background:#3082e3;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(48,130,227,0.35);">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                     <path d="M12 3C12 3 4 6.5 4 12v5.5l8 2.5 8-2.5V12C20 6.5 12 3 12 3z"/>
                     <path d="M9 12l2 2 4-4"/>
                   </svg></div>`,
        iconSize: [34, 34], iconAnchor: [17, 17], className: ''
      })
      : L.divIcon({
        html: `<div style="width:30px;height:30px;border-radius:50%;background:#fff;border:2.5px solid #3082e3;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(48,130,227,0.2);">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3082e3" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                     <path d="M12 3C12 3 4 6.5 4 12v5.5l8 2.5 8-2.5V12C20 6.5 12 3 12 3z"/>
                     <path d="M9 12l2 2 4-4"/>
                   </svg></div>`,
        iconSize: [30, 30], iconAnchor: [15, 15], className: ''
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
      color: '#3082e3', fillColor: '#3082e3',
      fillOpacity: 0.06, weight: 1.5, dashArray: '6,4'
    }).addTo(mapa);
  
    puntosEnRadio.value.forEach(p => {
      const activo = puntoSeleccionado.value?.id === p.id;
      const m = L.marker([p.lat, p.lng], { icon: iconPunto(activo) })
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;min-width:150px;padding:2px 0;">
             <p style="font-size:13px;font-weight:600;color:#2a2a2a;margin:0 0 4px;">${p.direccion}</p>
             <p style="font-size:12px;color:#3082e3;margin:0;font-weight:600;">${formatearDistancia(p.distancia)}</p>
           </div>`,
          { closeButton: false, maxWidth: 200 }
        )
        .addTo(mapa);
      markers.push(m);
    });
  
    const bounds = L.latLngBounds([[lat, lng]]);
    puntosEnRadio.value.forEach(p => bounds.extend([p.lat, p.lng]));
    if (puntosEnRadio.value.length) {
      mapa.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    } else {
      mapa.setView([lat, lng], 14);
    }
  
    if (puntoSeleccionado.value) {
      await trazarRuta(puntoSeleccionado.value);
    }
  }
  
  // ── Ruta con leaflet-routing-machine ──────────────────────────────────────
  async function trazarRuta(punto) {
    if (!mapa || !ubicacionUsuario.value) return;
    if (rutaControl) { try { rutaControl.remove(); } catch (_) { } rutaControl = null; }
  
    const lrmMod = await import('leaflet-routing-machine');
    const LRM = lrmMod.default ?? lrmMod;
    const Routing = L.Routing ?? LRM.Routing ?? LRM;
  
    const { lat, lng } = ubicacionUsuario.value;
  
    rutaControl = Routing.control({
      waypoints: [
        L.latLng(lat, lng),
        L.latLng(punto.lat, punto.lng),
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      showAlternatives: false,
      show: false,
      lineOptions: {
        styles: [
          { color: '#f2826d', weight: 5, opacity: 0.9 },
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
  
  // ── Seleccionar punto de la lista ─────────────────────────────────────────
  async function seleccionarPunto(punto) {
    if (puntoSeleccionado.value?.id === punto.id) {
      puntoSeleccionado.value = null;
      await actualizarMapa();
      return;
    }
    puntoSeleccionado.value = punto;
    await actualizarMapa();
  
    if (mapa) {
      const { lat, lng } = ubicacionUsuario.value;
      const bounds = L.latLngBounds([[lat, lng], [punto.lat, punto.lng]]);
      mapa.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      markers.forEach(m => {
        const ll = m.getLatLng();
        if (Math.abs(ll.lat - punto.lat) < 0.00002) m.openPopup();
      });
    }
  }
  
  // ── Watcher radio ──────────────────────────────────────────────────────────
  watch(radioBusqueda, async () => {
    if (!ubicacionUsuario.value) return;
    if (puntoSeleccionado.value) {
      const d = haversine(
        ubicacionUsuario.value.lat, ubicacionUsuario.value.lng,
        puntoSeleccionado.value.lat, puntoSeleccionado.value.lng
      );
      if (d > radioBusqueda.value) puntoSeleccionado.value = null;
    }
    await actualizarMapa();
  });
  
  // ── Cleanup ────────────────────────────────────────────────────────────────
  onUnmounted(() => { mapa?.remove(); mapa = null; });
  </script>