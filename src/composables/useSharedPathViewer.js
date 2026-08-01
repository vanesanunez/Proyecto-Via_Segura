// import { ref } from "vue";
// import { startListeningSharedPath, stopListeningSharedPath } from "../services/path-sharing";

// // ── Estado a nivel de módulo: sobrevive a la navegación ──
// const isFollowing = ref(false);
// const sharerId = ref(null);
// const pathId = ref(null);
// const sharerName = ref("");
// const historicCoords = ref([]); // [[lat,lng], ...] recibido al conectarse
// const liveCoords = ref([]); // puntos en tiempo real acumulados
// const trackedPosition = ref(null); // { lat, lng }
// const destination = ref(null); // destino sugerido por quien comparte
// const startedAt = ref(null);
// const endedMessage = ref(""); // aviso cuando el emisor finaliza

// let unsubscribe = null;
// let endedTimeout = null;

// function reset() {
//   isFollowing.value = false;
//   sharerId.value = null;
//   pathId.value = null;
//   sharerName.value = "";
//   historicCoords.value = [];
//   liveCoords.value = [];
//   trackedPosition.value = null;
//   destination.value = null;
//   startedAt.value = null;
// }

// function startFollowing({ sharer_id, path_id, sharer_name }) {
//   // ya estamos siguiendo este mismo recorrido: no re-suscribir
//   if (isFollowing.value && sharerId.value === sharer_id && pathId.value === path_id) {
//     return;
//   }

//   if (unsubscribe) {
//     unsubscribe();
//     unsubscribe = null;
//   }

//   reset();
//   endedMessage.value = "";
//   sharerId.value = sharer_id;
//   pathId.value = path_id;
//   sharerName.value = sharer_name || "Tu contacto";
//   isFollowing.value = true;
//   startedAt.value = Date.now();

//   unsubscribe = startListeningSharedPath(
//     { sharer_id, path_id },
//     (msg) => {
//       if (!msg) return;

//       if (msg.type === "destination") {
//         destination.value = msg.payload;
//         return;
//       }

//       if (msg.type === "full-history") {
//         const { history } = msg.payload || {};

//         if (history?.length) {
//           historicCoords.value = history.map((p) => [
//             p.lat ?? p.latitude,
//             p.lng ?? p.longitude ?? p.lon,
//           ]);

//           const last = historicCoords.value[historicCoords.value.length - 1];
//           trackedPosition.value = { lat: last[0], lng: last[1] };
//         }

//         if (msg.payload?.destination) destination.value = msg.payload.destination;
//         return;
//       }

//       if (msg.type === "point") {
//         const c = msg.payload;
//         const lat = c.lat ?? c.latitude;
//         const lng = c.lng ?? c.longitude ?? c.lon;
//         if (lat == null || lng == null) return;

//         liveCoords.value = [...liveCoords.value, [lat, lng]];
//         trackedPosition.value = { lat, lng };
//       }
//     },
//     () => {
//       // el emisor finalizó el recorrido
//       endedMessage.value = `${sharerName.value} finalizó el recorrido.`;
//       isFollowing.value = false;
//       unsubscribe = null;

//       clearTimeout(endedTimeout);
//       endedTimeout = setTimeout(() => {
//         endedMessage.value = "";
//         reset();
//       }, 5000);
//     }
//   );
// }

// function stopFollowing() {
//   if (unsubscribe) {
//     unsubscribe();
//     unsubscribe = null;
//   } else if (sharerId.value && pathId.value) {
//     stopListeningSharedPath({ sharer_id: sharerId.value, path_id: pathId.value });
//   }

//   clearTimeout(endedTimeout);
//   endedMessage.value = "";
//   reset();
// }

// export function useSharedPathViewer() {
//   return {
//     isFollowing,
//     sharerId,
//     pathId,
//     sharerName,
//     historicCoords,
//     liveCoords,
//     trackedPosition,
//     destination,
//     startedAt,
//     endedMessage,
//     startFollowing,
//     stopFollowing,
//   };
// }
import { ref } from "vue";
import { startListeningSharedPath, stopListeningSharedPath } from "../services/path-sharing";

// ── Estado a nivel de módulo: sobrevive a la navegación ──
const isFollowing = ref(false);
const sharerId = ref(null);
const pathId = ref(null);
const sharerName = ref("");
const historicCoords = ref([]); // [[lat,lng], ...] recibido al conectarse
const liveCoords = ref([]); // puntos en tiempo real acumulados
const trackedPosition = ref(null); // { lat, lng }
const destination = ref(null); // destino sugerido por quien comparte
const startedAt = ref(null);
const endedMessage = ref(""); // aviso cuando el emisor finaliza
const endedArrivedSafely = ref(false);

let unsubscribe = null;
let endedTimeout = null;

function reset() {
  isFollowing.value = false;
  sharerId.value = null;
  pathId.value = null;
  sharerName.value = "";
  historicCoords.value = [];
  liveCoords.value = [];
  trackedPosition.value = null;
  destination.value = null;
  startedAt.value = null;
}

function startFollowing({ sharer_id, path_id, sharer_name }) {
  // ya estamos siguiendo este mismo recorrido: no re-suscribir
  if (isFollowing.value && sharerId.value === sharer_id && pathId.value === path_id) {
    return;
  }

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  reset();
  endedMessage.value = "";
  sharerId.value = sharer_id;
  pathId.value = path_id;
  sharerName.value = sharer_name || "Tu contacto";
  isFollowing.value = true;
  startedAt.value = Date.now();

  unsubscribe = startListeningSharedPath(
    { sharer_id, path_id },
    (msg) => {
      if (!msg) return;

      if (msg.type === "destination") {
        destination.value = msg.payload;
        return;
      }

      if (msg.type === "full-history") {
        const { history } = msg.payload || {};

        if (history?.length) {
          historicCoords.value = history.map((p) => [
            p.lat ?? p.latitude,
            p.lng ?? p.longitude ?? p.lon,
          ]);

          const last = historicCoords.value[historicCoords.value.length - 1];
          trackedPosition.value = { lat: last[0], lng: last[1] };
        }

        if (msg.payload?.destination) destination.value = msg.payload.destination;
        return;
      }

      if (msg.type === "point") {
        const c = msg.payload;
        const lat = c.lat ?? c.latitude;
        const lng = c.lng ?? c.longitude ?? c.lon;
        if (lat == null || lng == null) return;

        liveCoords.value = [...liveCoords.value, [lat, lng]];
        trackedPosition.value = { lat, lng };
      }
    },
    (payload) => {
      // el emisor finalizó el recorrido — puede haber llegado bien o cortado sin avisar
      const arrived = !!payload?.arrived;
      endedArrivedSafely.value = arrived;
      endedMessage.value = arrived
        ? `${sharerName.value} llegó bien a destino.`
        : `${sharerName.value} finalizó el recorrido.`;

      isFollowing.value = false;
      unsubscribe = null;

      clearTimeout(endedTimeout);
      endedTimeout = setTimeout(() => {
        endedMessage.value = "";
        reset();
      }, 6000);
    }
  );
}

function stopFollowing() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  } else if (sharerId.value && pathId.value) {
    stopListeningSharedPath({ sharer_id: sharerId.value, path_id: pathId.value });
  }

  clearTimeout(endedTimeout);
  endedMessage.value = "";
  reset();
}

export function useSharedPathViewer() {
  return {
    isFollowing,
    sharerId,
    pathId,
    sharerName,
    historicCoords,
    liveCoords,
    trackedPosition,
    destination,
    startedAt,
    endedMessage,
    endedArrivedSafely,
    startFollowing,
    stopFollowing,
  };
}