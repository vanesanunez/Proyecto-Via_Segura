// import { ref } from "vue";
// import {
//   startPath,
//   startPathWithoutSharing,
//   sharePathWith,
//   updateCoords,
//   endPath,
// } from "../services/path-sharing";
// import { haversineMeters } from "../services/safe-route";

// // ── Estado a nivel de módulo: sobrevive a la navegación entre páginas ──
// const isActive = ref(false);
// const isSharing = ref(false);
// const destination = ref(null); // { lat, lng, address }
// const selectedContact = ref(null); // { id, name, lastname } | null
// const currentPosition = ref(null); // { lat, lng }
// const coordsHistory = ref([]); // recorrido recorrido (trazo azul propio)
// const routeCoords = ref([]); // ruta segura sugerida (polyline OSRM)
// const alerts = ref([]); // reportes cercanos a la ruta
// const startedAt = ref(null);
// const activeAlert = ref(null); // toast de alerta próxima { report, distance }

// const ALERT_RADIUS_METERS = 200;
// let notifiedHazardIds = new Set();
// let watchId = null;
// let alertTimeout = null;

// function checkHazardProximity(lat, lng) {
//   for (const hazard of alerts.value) {
//     if (notifiedHazardIds.has(hazard.id)) continue;

//     const dist = haversineMeters(lat, lng, hazard.latitud, hazard.longitud);

//     if (dist <= ALERT_RADIUS_METERS) {
//       notifiedHazardIds.add(hazard.id);
//       activeAlert.value = { report: hazard, distance: Math.round(dist) };

//       clearTimeout(alertTimeout);
//       alertTimeout = setTimeout(() => {
//         activeAlert.value = null;
//       }, 6000);

//       break;
//     }
//   }
// }

// function watchPosition() {
//   if (!("geolocation" in navigator)) return;
//   if (watchId) navigator.geolocation.clearWatch(watchId);

//   watchId = navigator.geolocation.watchPosition(
//     (pos) => {
//       const { latitude, longitude } = pos.coords;

//       currentPosition.value = { lat: latitude, lng: longitude };
//       coordsHistory.value.push({ lat: latitude, lng: longitude, ts: Date.now() });

//       if (isSharing.value) {
//         updateCoords({ lat: latitude, lng: longitude });
//       }

//       checkHazardProximity(latitude, longitude);
//     },
//     (err) => console.error("[useRouteSharing] error de geolocalización:", err),
//     { enableHighAccuracy: true }
//   );
// }

// /**
//  * Inicia el recorrido. Si hay contacto, comparte por path-sharing.js.
//  * @param {{destination:Object, contact:Object|null, routeCoords:Array, alerts:Array, senderName?:string}} params
//  */
// async function startRoute({ destination: dest, contact, routeCoords: rc, alerts: al, senderName }) {
//   destination.value = dest;
//   selectedContact.value = contact || null;
//   routeCoords.value = rc || [];
//   alerts.value = al || [];
//   coordsHistory.value = [];
//   notifiedHazardIds = new Set();
//   activeAlert.value = null;
//   startedAt.value = Date.now();

//   if (contact) {
//     isSharing.value = true;
//     await startPath();
//     await sharePathWith(contact.id, senderName);
//   } else {
//     isSharing.value = false;
//     await startPathWithoutSharing();
//   }

//   isActive.value = true;
//   watchPosition();
// }

// async function endRoute() {
//   if (watchId) {
//     navigator.geolocation.clearWatch(watchId);
//     watchId = null;
//   }

//   if (isSharing.value) {
//     await endPath();
//   }

//   isActive.value = false;
//   isSharing.value = false;
//   destination.value = null;
//   selectedContact.value = null;
//   coordsHistory.value = [];
//   routeCoords.value = [];
//   alerts.value = [];
//   startedAt.value = null;
//   activeAlert.value = null;
//   notifiedHazardIds = new Set();
// }

// export function useRouteSharing() {
//   return {
//     isActive,
//     isSharing,
//     destination,
//     selectedContact,
//     currentPosition,
//     coordsHistory,
//     routeCoords,
//     alerts,
//     startedAt,
//     activeAlert,
//     startRoute,
//     endRoute,
//   };
// }
import { ref } from "vue";
import {
  startPath,
  startPathWithoutSharing,
  sharePathWith,
  updateCoords,
  endPath,
} from "../services/path-sharing";
import { haversineMeters } from "../services/safe-route";

// ── Estado a nivel de módulo: sobrevive a la navegación entre páginas ──
const isActive = ref(false);
const isSharing = ref(false);
const destination = ref(null); // { lat, lng, address }
const selectedContact = ref(null); // { id, name, lastname } | null
const currentPosition = ref(null); // { lat, lng }
const coordsHistory = ref([]); // recorrido recorrido (trazo azul propio)
const routeCoords = ref([]); // ruta segura sugerida (polyline OSRM)
const alerts = ref([]); // reportes cercanos a la ruta
const startedAt = ref(null);
const activeAlert = ref(null); // toast de alerta próxima { report, distance }

const ALERT_RADIUS_METERS = 200;
let notifiedHazardIds = new Set();
let watchId = null;
let alertTimeout = null;

function checkHazardProximity(lat, lng) {
  for (const hazard of alerts.value) {
    if (notifiedHazardIds.has(hazard.id)) continue;

    const dist = haversineMeters(lat, lng, hazard.latitud, hazard.longitud);

    if (dist <= ALERT_RADIUS_METERS) {
      notifiedHazardIds.add(hazard.id);
      activeAlert.value = { report: hazard, distance: Math.round(dist) };

      clearTimeout(alertTimeout);
      alertTimeout = setTimeout(() => {
        activeAlert.value = null;
      }, 6000);

      break;
    }
  }
}

function watchPosition() {
  if (!("geolocation" in navigator)) return;
  if (watchId) navigator.geolocation.clearWatch(watchId);

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;

      currentPosition.value = { lat: latitude, lng: longitude };
      coordsHistory.value.push({ lat: latitude, lng: longitude, ts: Date.now() });

      if (isSharing.value) {
        updateCoords({ lat: latitude, lng: longitude });
      }

      checkHazardProximity(latitude, longitude);
    },
    (err) => console.error("[useRouteSharing] error de geolocalización:", err),
    { enableHighAccuracy: true }
  );
}

/**
 * Inicia el recorrido. Si hay contacto, comparte por path-sharing.js.
 */
async function startRoute({ destination: dest, contact, routeCoords: rc, alerts: al, senderName }) {
  destination.value = dest;
  selectedContact.value = contact || null;
  routeCoords.value = rc || [];
  alerts.value = al || [];
  coordsHistory.value = [];
  notifiedHazardIds = new Set();
  activeAlert.value = null;
  startedAt.value = Date.now();

  if (contact) {
    isSharing.value = true;
    await startPath();
    await sharePathWith(contact.id, senderName);
  } else {
    isSharing.value = false;
    await startPathWithoutSharing();
  }

  isActive.value = true;
  watchPosition();
}

/**
 * Finaliza el recorrido.
 * @param {{arrived?: boolean}} options arrived=true si el usuario confirmó "Llegué bien".
 */
async function endRoute({ arrived = false } = {}) {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (isSharing.value) {
    await endPath({ arrived });
  }

  isActive.value = false;
  isSharing.value = false;
  destination.value = null;
  selectedContact.value = null;
  coordsHistory.value = [];
  routeCoords.value = [];
  alerts.value = [];
  startedAt.value = null;
  activeAlert.value = null;
  notifiedHazardIds = new Set();
}

export function useRouteSharing() {
  return {
    isActive,
    isSharing,
    destination,
    selectedContact,
    currentPosition,
    coordsHistory,
    routeCoords,
    alerts,
    startedAt,
    activeAlert,
    startRoute,
    endRoute,
  };
}