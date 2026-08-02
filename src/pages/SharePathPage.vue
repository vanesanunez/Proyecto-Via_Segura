
 <script setup>
 import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
 import { useRouter } from "vue-router";
 import L from "leaflet";
 import { getTrustedContacts } from "../services/contacts";
 import { subscribeToUserState } from "../services/auth";
 import { nominatimSearch, composeAddress } from "../services/nominatim";
 import { fetchActiveReportsWithCoords } from "../services/reports";
 import { fetchSafeRoute } from "../services/safe-route";
 import { useRouteSharing } from "../composables/useRouteSharing";
 import BottomNavigation from "../components/BottomNavigation.vue";
 import icon2x from "leaflet/dist/images/marker-icon-2x.png";
 import icon from "leaflet/dist/images/marker-icon.png";
 import shadow from "leaflet/dist/images/marker-shadow.png";
 
 delete L.Icon.Default.prototype._getIconUrl;
 L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon, shadowUrl: shadow });
 
 const router = useRouter();
 
 // ── Composable persistente ───────────────────────────────────────────────
 const {
   isActive,
   isSharing,
   destination: sharedDestination,
   selectedContact: sharedContact,
   currentPosition,
   coordsHistory,
   routeCoords,
   alerts,
   startedAt,
   activeAlert,
   startRoute,
   endRoute,
 } = useRouteSharing();
 
 // ── Estado de la pantalla ─────────────────────────────────────────────────
 // 'setup' | 'confirmShare' | 'pickContact' | 'preview' | 'active'
 const viewState = ref("setup");
 
 const currentUser = ref(null);
 const trustedContacts = ref([]);
 const loadingContacts = ref(false);
 
 const destinationQuery = ref("");
 const destinationSuggestions = ref([]);
 const selectedDestination = ref(null); // { lat, lng, address }
 let debounceTimer = null;
 
 const pendingContact = ref(null); // contacto elegido en el flujo, antes de iniciar
 const loadingRoute = ref(false);
 const routeError = ref("");
 const routeResult = ref(null); // { coords, distance, duration, risk, hazards }
 
 const showFinishConfirm = ref(false);
 
 // ── Mapa ────────────────────────────────────────────────────────────────
 const mapEl = ref(null);
 let map = null;
 let destinationMarker = null;
 let userMarker = null;
 let routeLine = null;
 let traveledLine = null;
 let hazardMarkers = [];
 let resizeObserver = null;
 
 const DEFAULT_CENTER = [-34.6037, -58.3816];
 
 const mapHeight = computed(() => {
   if (viewState.value === "active") return "300px";
   if (viewState.value === "preview") return "300px";
   return "260px";
 });
 
 function iconUser() {
   return L.divIcon({
     html: `<div style="width:16px;height:16px;border-radius:50%;background:#3082e3;border:3px solid white;box-shadow:0 0 0 5px rgba(48,130,227,0.22);"></div>`,
     iconSize: [16, 16],
     iconAnchor: [8, 8],
     className: "",
   });
 }
 
 function iconDestination() {
   return L.divIcon({
     html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#3082e3;border:3px solid white;box-shadow:0 4px 12px rgba(48,130,227,0.35);display:flex;align-items:center;justify-content:center;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" style="transform:rotate(45deg);"><circle cx="12" cy="12" r="3"/></svg>
            </div>`,
     iconSize: [34, 34],
     iconAnchor: [17, 34],
     className: "",
   });
 }
 
 const HAZARD_STYLE = {
   Seguridad: { bg: "#f2826d" },
   Iluminación: { bg: "#f2b84c" },
   Infraestructura: { bg: "#3082e3" },
 };
 
 function iconHazard(categoria) {
   const style = HAZARD_STYLE[categoria] || HAZARD_STYLE.Infraestructura;
   return L.divIcon({
     html: `<div style="width:26px;height:26px;border-radius:50%;background:${style.bg};border:2.5px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round">
                <path d="M12 8v4.5m0 3.5h.007"/>
              </svg>
            </div>`,
     iconSize: [26, 26],
     iconAnchor: [13, 13],
     className: "",
   });
 }
 
 function clearHazardMarkers() {
   hazardMarkers.forEach((m) => map.removeLayer(m));
   hazardMarkers = [];
 }
 
 function drawHazards(hazards) {
   clearHazardMarkers();
   hazards.forEach((h) => {
     const marker = L.marker([h.latitud, h.longitud], { icon: iconHazard(h.categoria) })
       .bindPopup(
         `<div style="font-family:Inter,sans-serif;min-width:150px;">
            <p style="font-size:12px;font-weight:700;color:#2a2a2a;margin:0 0 3px;">${h.categoria}</p>
            <p style="font-size:12px;color:#6b7280;margin:0;">${h.ubicacion ?? ""}</p>
          </div>`,
         { closeButton: false, maxWidth: 200 }
       )
       .addTo(map);
     hazardMarkers.push(marker);
   });
 }
 
 function drawDestination(lat, lng) {
   if (destinationMarker) map.removeLayer(destinationMarker);
   destinationMarker = L.marker([lat, lng], { icon: iconDestination() }).addTo(map);
 }
 
 function drawRouteLine(coords, color = "#3082e3") {
   if (routeLine) map.removeLayer(routeLine);
   const latlngs = coords.map((c) => [c.lat, c.lng]);
   routeLine = L.polyline(latlngs, { color, weight: 5, opacity: 0.9 }).addTo(map);
 }
 
 function updateUserMarker(lat, lng, fly = false) {
   if (!userMarker) {
     userMarker = L.marker([lat, lng], { icon: iconUser() }).addTo(map);
   } else {
     userMarker.setLatLng([lat, lng]);
   }
   if (fly) map.flyTo([lat, lng], 16);
 }
 
 function refitView() {
   if (!map) return;
 
   requestAnimationFrame(() => {
     requestAnimationFrame(() => {
       if (!map) return;
 
       map.invalidateSize({ animate: false, pan: false });
 
       const canFitRoute =
         routeLine &&
         (viewState.value === "preview" || viewState.value === "active") &&
         routeLine.getLatLngs().length > 1 &&
         routeLine.getBounds().isValid();
 
       if (canFitRoute) {
         map.fitBounds(routeLine.getBounds(), { padding: [28, 28], maxZoom: 17 });
       } else if (destinationMarker) {
         map.setView(destinationMarker.getLatLng(), 15);
       } else {
         map.setView(DEFAULT_CENTER, 13);
       }
     });
   });
 }
 
 // ── Búsqueda de destino ───────────────────────────────────────────────────
 function onDestinationInput() {
   clearTimeout(debounceTimer);
   if (destinationQuery.value.trim().length < 4) {
     destinationSuggestions.value = [];
     return;
   }
   debounceTimer = setTimeout(async () => {
     try {
       destinationSuggestions.value = await nominatimSearch(destinationQuery.value, {
         countrycodes: "ar",
         limit: 5,
       });
     } catch (e) {
       console.error("[SharePathPage] error buscando destino:", e);
       destinationSuggestions.value = [];
     }
   }, 400);
 }
 
 function pickDestination(place) {
   const lat = parseFloat(place.lat);
   const lng = parseFloat(place.lon);
   const address = composeAddress(place.address) || place.display_name;
 
   selectedDestination.value = { lat, lng, address };
   destinationQuery.value = address;
   destinationSuggestions.value = [];
 
   drawDestination(lat, lng);
   refitView();
 
   viewState.value = "confirmShare";
 }
 
 // ── Flujo de compartir ────────────────────────────────────────────────────
 async function openContactPicker() {
   viewState.value = "pickContact";
 
   if (trustedContacts.value.length || !currentUser.value?.id) return;
 
   loadingContacts.value = true;
   try {
     trustedContacts.value = await getTrustedContacts(currentUser.value.id);
   } catch (e) {
     console.error("[SharePathPage] error cargando contactos:", e);
   } finally {
     loadingContacts.value = false;
   }
 }
 
 function chooseContact(contact) {
   pendingContact.value = contact;
   computeRoute();
 }
 
 function continueWithoutSharing() {
   pendingContact.value = null;
   computeRoute();
 }
 
 // ── Cálculo de la ruta segura ──────────────────────────────────────────────
 function getCurrentPositionAsync() {
   return new Promise((resolve, reject) => {
     if (!("geolocation" in navigator)) {
       reject(new Error("Tu dispositivo no soporta geolocalización."));
       return;
     }
     navigator.geolocation.getCurrentPosition(
       (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
       () => reject(new Error("No se pudo obtener tu ubicación actual.")),
       { enableHighAccuracy: true }
     );
   });
 }
 
 async function computeRoute() {
   if (!selectedDestination.value) return;
 
   routeError.value = "";
   loadingRoute.value = true;
   viewState.value = "preview";
   await nextTick();
   refitView();
 
   try {
     const origin = await getCurrentPositionAsync();
     updateUserMarker(origin.lat, origin.lng, false);
 
     const activeReports = await fetchActiveReportsWithCoords();
     const result = await fetchSafeRoute(origin, selectedDestination.value, activeReports);
 
     routeResult.value = result;
     drawRouteLine(result.coords, "#3082e3");
     drawHazards(result.hazards);
     refitView();
   } catch (e) {
     console.error("[SharePathPage] error calculando ruta segura:", e);
     routeError.value = e.message || "No se pudo calcular la ruta.";
   } finally {
     loadingRoute.value = false;
   }
 }
 
 // ── Iniciar / finalizar recorrido ─────────────────────────────────────────
 function buildSenderName() {
   const full = `${currentUser.value?.name || ""} ${currentUser.value?.lastname || ""}`.trim();
   return full || currentUser.value?.email || "Tu contacto";
 }
 
 async function handleStartRoute() {
   if (!routeResult.value || !selectedDestination.value) return;
 
   await startRoute({
     destination: selectedDestination.value,
     contact: pendingContact.value,
     routeCoords: routeResult.value.coords,
     alerts: routeResult.value.hazards,
     senderName: buildSenderName(),
   });
 
   clearHazardMarkers();
   drawHazards(routeResult.value.hazards);
   drawRouteLine(routeResult.value.coords, "#a9c8f5");
   if (traveledLine) map.removeLayer(traveledLine);
   traveledLine = L.polyline([], { color: "#3082e3", weight: 3 }).addTo(map);
 
   viewState.value = "active";
   await nextTick();
   refitView();
 }
 
 function openFinishConfirm() {
   showFinishConfirm.value = true;
 }
 
 async function confirmFinish(arrived) {
   showFinishConfirm.value = false;
   await endRoute({ arrived });
 
   [destinationMarker, userMarker, routeLine, traveledLine].forEach((l) => {
     if (l && map) map.removeLayer(l);
   });
   clearHazardMarkers();
   destinationMarker = userMarker = routeLine = traveledLine = null;
 
   selectedDestination.value = null;
   destinationQuery.value = "";
   pendingContact.value = null;
   routeResult.value = null;
   routeError.value = "";
 
   viewState.value = "setup";
   await nextTick();
   refitView();
 }
 
 function goBackToSetup() {
   destinationQuery.value = "";
   destinationSuggestions.value = [];
   selectedDestination.value = null;
   pendingContact.value = null;
   routeResult.value = null;
   routeError.value = "";
   if (destinationMarker) { map.removeLayer(destinationMarker); destinationMarker = null; }
   if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
   clearHazardMarkers();
   viewState.value = "setup";
   nextTick(() => refitView());
 }
 
 function goHome() {
   router.push("/");
 }
 
 function handleBack() {
   if (viewState.value === "active") {
     goHome();
   } else {
     goBackToSetup();
   }
 }
 
 // ── Ciclo de vida ──────────────────────────────────────────────────────────
 onMounted(async () => {
   await nextTick();
 
   map = L.map(mapEl.value, {
     zoomControl: false,
     minZoom: 11,
     maxZoom: 19,
   }).setView(DEFAULT_CENTER, 13);
 
   L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
     maxZoom: 19,
     attribution: "© OpenStreetMap contributors",
   }).addTo(map);
   L.control.zoom({ position: "topright" }).addTo(map);
 
   // Corrige el mapa cada vez que su contenedor cambia de tamaño real,
   // sin depender de que cada transición de estado lo llame manualmente.
   resizeObserver = new ResizeObserver(() => {
     map?.invalidateSize({ animate: false, pan: false });
   });
   resizeObserver.observe(mapEl.value);
 
   subscribeToUserState((user) => {
     currentUser.value = user;
   });
 
   if (isActive.value) {
     selectedDestination.value = sharedDestination.value;
     destinationQuery.value = sharedDestination.value?.address || "";
     pendingContact.value = sharedContact.value;
 
     if (routeCoords.value.length) {
       drawRouteLine(routeCoords.value, "#a9c8f5");
     }
     drawHazards(alerts.value);
 
     if (coordsHistory.value.length) {
       traveledLine = L.polyline(
         coordsHistory.value.map((p) => [p.lat, p.lng]),
         { color: "#3082e3", weight: 5 }
       ).addTo(map);
     } else {
       traveledLine = L.polyline([], { color: "#3082e3", weight: 5 }).addTo(map);
     }
 
     if (currentPosition.value) {
       updateUserMarker(currentPosition.value.lat, currentPosition.value.lng);
     }
     if (sharedDestination.value) {
       drawDestination(sharedDestination.value.lat, sharedDestination.value.lng);
     }
 
     viewState.value = "active";
   }
 
   refitView();
 });
 
 onUnmounted(() => {
   resizeObserver?.disconnect();
   if (map) map.remove();
 });
 
 watch(currentPosition, (pos) => {
   if (!pos || !map || viewState.value !== "active") return;
   updateUserMarker(pos.lat, pos.lng, true);
   traveledLine?.addLatLng([pos.lat, pos.lng]);
 });
 
 const alertCount = computed(() => routeResult.value?.hazards?.length ?? 0);
 const distanceLabel = computed(() => {
   if (!routeResult.value) return "";
   const km = routeResult.value.distance / 1000;
   return km < 1 ? `${Math.round(routeResult.value.distance)} m` : `${km.toFixed(1)} km`;
 });
 const durationLabel = computed(() => {
   if (!routeResult.value) return "";
   return `${Math.round(routeResult.value.duration / 60)} min`;
 });
 const pointsCount = computed(() => coordsHistory.value.length);
 
 const activeContactLabel = computed(() => {
   const c = sharedContact.value;
   if (!c) return "";
   return `${c.name || ""} ${c.lastname || ""}`.trim();
 });
 </script>
 
 <template>
   <div class="min-h-screen bg-white pb-28 overflow-x-hidden" style="color:#2a2a2a;">
     <div class="mx-auto w-full max-w-md">
       <!-- HEADER -->
       <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
         <button
           v-if="viewState !== 'setup'"
           @click="handleBack"
           class="flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200 shrink-0"
         >
           <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#2a2a2a" stroke-width="2.2">
             <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
           </svg>
         </button>
         <div class="min-w-0 mt-4">
           <h1 class="text-base font-semibold leading-tight">Recorrido seguro</h1>
           <p class="text-xs" style="color:#6b7280;">
             {{ viewState === "active" ? "Recorrido en curso" : "Encontrá el camino con menos alertas" }}
           </p>
         </div>
       </div>
 
       <!-- MAPA (siempre montado) -->
       <div class="relative w-full overflow-hidden">
         <div ref="mapEl" class="w-full" :style="{ height: mapHeight, zIndex: 0 }"></div>
 
         <div v-if="viewState === 'setup'" class="absolute top-3 left-3 right-3 z-20">
           <div class="relative">
             <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
             </svg>
             <input
               v-model="destinationQuery"
               @input="onDestinationInput"
               placeholder="¿A dónde querés ir?"
               class="w-full rounded-xl pl-9 pr-4 py-3 text-sm bg-white shadow-[0_8px_20px_rgba(15,23,42,0.12)] border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3082e3]/25"
             />
           </div>
 
           <ul v-if="destinationSuggestions.length" class="mt-2 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-[0_10px_24px_rgba(15,23,42,0.14)]">
             <li
               v-for="s in destinationSuggestions"
               :key="s.place_id"
               @click="pickDestination(s)"
               class="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-blue-50 active:bg-blue-100 border-b border-gray-50 last:border-0 transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#3082e3" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                 <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
               <span class="text-xs leading-relaxed min-w-0" style="word-break: break-word;">{{ s.display_name }}</span>
             </li>
           </ul>
         </div>
       </div>
 
       <!-- SETUP -->
       <section v-if="viewState === 'setup'" class="px-4 pt-5">
         <div class="rounded-[22px] border border-[#d6e8fb] bg-[#eef4ff] p-5">
           <div class="flex items-start gap-3">
             <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#3082e3] shadow-[0_6px_16px_rgba(48,130,227,0.16)]">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
               </svg>
             </div>
             <div class="min-w-0">
               <h2 class="text-[16px] font-bold text-[#2a2a2a]">Elegí tu destino y te llevamos seguro</h2>
               <p class="mt-1.5 text-[13px] leading-6 text-slate-600">
                 Buscá una dirección arriba. Vamos a calcular la ruta con menos reportes activos en el camino,
                 y podés compartir tu trayecto en vivo con un contacto de confianza.
               </p>
             </div>
           </div>
         </div>
       </section>
 
       <!-- MODAL: ¿Compartir? -->
       <div v-if="viewState === 'confirmShare'" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
         <div class="w-full max-w-sm rounded-[26px] bg-white p-6 shadow-[0_22px_48px_rgba(15,23,42,0.22)]">
           <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3]">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M18 8a3 3 0 10-2.83-4H15a3 3 0 000 6h.17A3 3 0 1018 8zM6 8a3 3 0 100 6 3 3 0 000-6zm0 8c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4zm12 0c-.62 0-1.21.14-1.74.38A5.99 5.99 0 0118 20h4c0-2.21-1.79-4-4-4z" />
             </svg>
           </div>
           <h3 class="mt-4 text-center text-[18px] font-bold text-slate-900">
             ¿Querés compartir tu recorrido con tu contacto de confianza?
           </h3>
           <p class="mt-2 text-center text-sm leading-6 text-slate-500">
             Va a poder ver tu ubicación en tiempo real hasta que finalices el recorrido.
           </p>
 
           <div class="mt-6 space-y-3">
             <button
               type="button"
               @click="openContactPicker"
               class="w-full rounded-2xl bg-[#3082e3] py-3 text-sm font-semibold text-white transition hover:bg-[#085baf] active:scale-[0.98]"
             >
               Sí, compartir
             </button>
             <button
               type="button"
               @click="continueWithoutSharing"
               class="w-full rounded-2xl bg-[#eef4ff] py-3 text-sm font-semibold text-[#3082e3] transition active:scale-[0.98]"
             >
               No, continuar sin compartir
             </button>
           </div>
         </div>
       </div>
 
       <!-- SHEET: elegir contacto -->
       <div v-if="viewState === 'pickContact'" class="fixed inset-0 z-40 bg-black/35" @click="viewState = 'confirmShare'"></div>
       <div
         v-if="viewState === 'pickContact'"
         class="fixed bottom-0 left-0 z-50 w-full rounded-t-[28px] bg-white p-4 pb-8 shadow-[0_-8px_24px_rgba(15,23,42,0.14)]"
       >
         <div class="mb-3 flex justify-center">
           <div class="h-1.5 w-12 rounded-full bg-gray-300"></div>
         </div>
         <h3 class="text-lg font-bold text-slate-900">Elegí un contacto de confianza</h3>
 
         <div v-if="loadingContacts" class="py-6 text-center text-sm text-slate-500">Cargando contactos...</div>
 
         <div v-else-if="!trustedContacts.length" class="py-6 text-center text-sm text-slate-500">
           Todavía no tenés contactos de confianza agregados.
         </div>
 
         <div v-else class="mt-4 mb-6 max-h-72 space-y-2 overflow-y-auto">
           <button
             v-for="c in trustedContacts"
             :key="c.id"
             type="button"
             @click="chooseContact(c)"
             class="flex w-full items-center gap-3 rounded-2xl border border-[#e4ebf4] bg-white px-3 py-4 text-left transition hover:border-[#c7daf7] active:scale-[0.98]"
           >
             <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3] font-bold">
               {{ (c.name?.[0] || "") + (c.lastname?.[0] || "") }}
             </div>
             <div class="min-w-0 flex-1">
               <p class="text-sm font-semibold text-slate-900 truncate">{{ c.name }} {{ c.lastname }}</p>
             </div>
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
             </svg>
           </button>
         </div>
       </div>
 
       <!-- PREVIEW -->
       <section v-if="viewState === 'preview'" class="px-4 pt-4">
         <div v-if="loadingRoute" class="rounded-2xl bg-[#E0E5EC] px-4 py-5 text-center text-sm text-slate-600">
           Calculando el camino más seguro...
         </div>
 
         <div v-else-if="routeError" class="rounded-2xl bg-[#fff1ed] px-4 py-3 text-sm text-[#e67661]">
           {{ routeError }}
         </div>
 
         <div v-else-if="routeResult" class="rounded-[22px] border border-[#e4ebf4] bg-white p-4 shadow-[0_10px_24px_rgba(148,163,184,0.14)]">
           <div class="flex items-center gap-2 flex-wrap">
             <span class="rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#3082e3]">
               Ruta más segura
             </span>
             <span
               v-if="pendingContact"
               class="rounded-full bg-[#fff1ed] px-3 py-1 text-[11px] font-semibold text-[#f2826d]"
             >
               Se compartirá con {{ pendingContact.name }}
             </span>
           </div>
 
           <p class="mt-3 text-[15px] font-bold text-slate-900">{{ selectedDestination?.address }}</p>
 
           <div class="mt-3 grid grid-cols-3 gap-2">
             <div class="rounded-2xl bg-[#f7f9fc] px-3 py-2.5 text-center">
               <p class="text-[16px] font-bold text-slate-900">{{ distanceLabel }}</p>
               <p class="text-[11px] text-slate-500">Distancia</p>
             </div>
             <div class="rounded-2xl bg-[#f7f9fc] px-3 py-2.5 text-center">
               <p class="text-[16px] font-bold text-slate-900">{{ durationLabel }}</p>
               <p class="text-[11px] text-slate-500">Duración</p>
             </div>
             <div class="rounded-2xl bg-[#f7f9fc] px-3 py-2.5 text-center">
               <p class="text-[16px] font-bold" :class="alertCount ? 'text-[#f2826d]' : 'text-[#16a34a]'">
                 {{ alertCount }}
               </p>
               <p class="text-[11px] text-slate-500">Alertas</p>
             </div>
           </div>
 
           <p v-if="alertCount" class="mt-3 text-xs leading-5 text-slate-500">
             Marcamos {{ alertCount }} reporte{{ alertCount === 1 ? "" : "s" }} activo{{ alertCount === 1 ? "" : "s" }}
             cerca del camino. Elegimos la alternativa con menos riesgo entre las rutas disponibles.
           </p>
           <p v-else class="mt-3 text-xs leading-5 text-slate-500">
             No encontramos reportes activos cerca de esta ruta.
           </p>
 
           <button
             type="button"
             @click="handleStartRoute"
             class="mt-4 w-full rounded-2xl bg-[#3082e3] py-3.5 text-sm font-bold text-white transition hover:bg-[#085baf] active:scale-[0.98]"
           >
             Iniciar recorrido
           </button>
         </div>
       </section>
 
       <!-- ACTIVO -->
       <section v-if="viewState === 'active'" class="px-4 pt-4">
         <div class="rounded-3xl p-5 text-white shadow-[0_14px_30px_rgba(48,130,227,0.28)]" style="background: linear-gradient(135deg, #3082e3 0%, #085baf 100%);">
           <div class="flex items-center justify-between gap-3">
             <div class="min-w-0">
               <span class="inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold">
                 {{ isSharing ? "Compartiendo en vivo" : "Recorrido privado" }}
               </span>
               <p class="mt-4 text-[12px] font-bold leading-tight truncate">
                 {{ sharedDestination?.address || selectedDestination?.address }}
               </p>
               <p v-if="isSharing && activeContactLabel" class="mt-1 text-[12px] text-white/85 truncate">
                 Compartiendo con {{ activeContactLabel }}
               </p>
             </div>
             <!-- <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-center">
               <span class="text-[15px] font-bold">{{ pointsCount }}</span>
             </div> -->
           </div>
           <!-- <p class="mt-1 text-[11px] text-white/75">puntos GPS registrados</p> -->
         </div>
 
         <transition name="fade-alert">
           <div
             v-if="activeAlert"
             class="mt-3 rounded-2xl bg-[#fff1ed] border border-[#f8dfd9] px-4 py-3 flex items-start gap-3"
           >
             <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#f2826d]">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.007M4.62 19.5h14.76c1.42 0 2.31-1.53 1.61-2.77L13.62 4.66c-.71-1.26-2.53-1.26-3.24 0L3.01 16.73c-.7 1.24.19 2.77 1.61 2.77z" />
               </svg>
             </span>
             <div class="min-w-0">
               <p class="text-sm font-bold text-[#e2624a]">
                 {{ activeAlert.report.categoria }} reportado a {{ activeAlert.distance }}m
               </p>
               <p class="text-xs text-[#a15142] truncate">{{ activeAlert.report.ubicacion }}</p>
             </div>
           </div>
         </transition>
 
         <button
           type="button"
           @click="openFinishConfirm"
           class="mt-4 w-full rounded-2xl bg-[#f2826d] py-3.5 text-sm font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
         >
           Finalizar recorrido
         </button>
       </section>
 
       <!-- MODAL: ¿Llegaste bien? -->
       <div v-if="showFinishConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
         <div class="w-full max-w-sm rounded-[26px] bg-white p-6 shadow-[0_22px_48px_rgba(15,23,42,0.22)]">
           <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3]">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" />
             </svg>
           </div>
           <h3 class="mt-4 text-center text-[18px] font-bold text-slate-900">
             ¿Llegaste bien a tu destino?
           </h3>
           <p v-if="isSharing" class="mt-2 text-center text-sm leading-6 text-slate-500">
             Le avisamos a {{ activeContactLabel || "tu contacto" }} que finalizaste el recorrido.
           </p>
 
           <div class="mt-6 space-y-3">
             <button
               type="button"
               @click="confirmFinish(true)"
               class="w-full rounded-2xl bg-[#3082e3] py-3 text-sm font-semibold text-white transition hover:bg-[#085baf] active:scale-[0.98]"
             >
               Sí, llegué bien
             </button>
             <button
               type="button"
               @click="confirmFinish(false)"
               class="w-full rounded-2xl bg-[#eef4ff] py-3 text-sm font-semibold text-[#3082e3] transition active:scale-[0.98]"
             >
               Finalizar sin avisar
             </button>
             <button
               type="button"
               @click="showFinishConfirm = false"
               class="w-full py-2 text-sm font-medium text-slate-400 transition hover:text-slate-600"
             >
               Volver
             </button>
           </div>
         </div>
       </div>
     </div>
   </div>
 
   <BottomNavigation />
 </template>
 
 <style scoped>
 .fade-alert-enter-active, .fade-alert-leave-active { transition: all 0.25s ease; }
 .fade-alert-enter-from, .fade-alert-leave-to { opacity: 0; transform: translateY(-6px); }
 </style>