// import supabase from "./supabase";

// let user = null;
// let currentPath = null;
// let currentBroadcast = null;
// let globalSharingChannel = null;
// let pathChannels = {};

// // Suscripción al estado de autenticación
// const subscribeToAuth = async () => {
//   const { data } = await supabase.auth.getUser();
//   user = data.user;

//   supabase.auth.onAuthStateChange((_event, session) => {
//     user = session?.user || null;
//   });
// };

// // Inicializar canal global y suscribirse a invitaciones
// const initGlobalChannel = async () => {
//   if (globalSharingChannel) return globalSharingChannel; // evitar duplicados

//   console.log("Subscribiéndose al canal global de path-sharing...");
//   globalSharingChannel = supabase.channel("global-path-sharing");

//   // Escucha global de invitaciones
//   globalSharingChannel.on("broadcast", { event: "share-path" }, (payload) => {
//     if (payload.payload.receiver_id === user?.id) {
//       console.log("Invitación recibida para seguir un recorrido.");
//       // Emitimos un evento global que cualquier componente puede escuchar
//       window.dispatchEvent(new CustomEvent("path-invitation", { detail: payload.payload }));
//     } else {
//       console.log("Broadcast ignorado (no coincide receiver_id):", payload.payload.receiver_id, "≠", user?.id);
//     }
//   });

//   await globalSharingChannel.subscribe((status) => {
//     console.log("Estado de suscripción global:", status);
//   });

//   return globalSharingChannel;
// };

// // === Escuchar invitaciones (para receptores) ===
// export const startListeningShareInvitations = async () => {
//   await subscribeToAuth();
//   await initGlobalChannel();
//   console.log("Escuchando invitaciones de recorrido...");
// };

// // === Escuchar recorrido compartido (canal individual) ===
// const startListeningSharedPath = ({ sharer_id, path_id }) => {
//   const channelKey = `${sharer_id}:path:${path_id}`;
//   if (pathChannels[channelKey]) return; // ya suscripto

//   const channel = supabase.channel(channelKey);

//   channel.on("broadcast", { event: "coords-update" }, (payload) => {
//     window.dispatchEvent(new CustomEvent("coords-update", { detail: payload }));
//   });

//   channel.on("broadcast", { event: "path-ended" }, () => {
//     console.log("El usuario finalizó el recorrido.");
//     window.dispatchEvent(new CustomEvent("path-ended", { detail: { sharer_id, path_id } }));
//     channel.unsubscribe();
//     delete pathChannels[channelKey];
//   });

//   channel.subscribe((status) => {
//     console.log(` Canal de seguimiento (${channelKey}):`, status);
//   });

//   pathChannels[channelKey] = channel;
// };

// // === Aceptar invitación ===
// export const acceptSharedPath = async ({ sharer_id, path_id, invitation_id }) => {
//   try {
//     await supabase
//       .from("path_invitations")
//       .update({ status: "accepted" })
//       .eq("id", invitation_id);

//     startListeningSharedPath({ sharer_id, path_id });
//   } catch (err) {
//     console.error("Error al aceptar invitación:", err);
//   }
// };

// // === Rechazar invitación ===
// export const rejectSharedPath = async (invitationId) => {
//   try {
//     await supabase
//       .from("path_invitations")
//       .update({ status: "rejected" })
//       .eq("id", invitationId);
//   } catch (err) {
//     console.error("Error al rechazar invitación:", err);
//   }
// };

// // === Iniciar recorrido (para emisor) ===
// export const startPath = async () => {
//   await subscribeToAuth();
//   if (!user?.id) throw new Error("Usuario no autenticado");

//   currentPath = crypto.randomUUID();
//   currentBroadcast = supabase.channel(`${user.id}:path:${currentPath}`);

//   // Escucha del canal local (para debug o control)
//   currentBroadcast.on("broadcast", { event: "path-ended" }, () => {
//     console.log("Trayecto finalizado localmente.");
//   });

//   await currentBroadcast.subscribe();
//   await initGlobalChannel();

//   console.log("Trayecto iniciado:", currentPath);
//   return currentPath;
// };

// // === Compartir recorrido con un contacto ===
// export const sharePathWith = async (receiverId) => {
//   if (!currentPath) return console.error("No hay recorrido iniciado.");
//   if (!user?.id) return console.error("Usuario no autenticado.");

//   try {
//     const { data, error } = await supabase
//       .from("path_invitations")
//       .insert([
//         {
//           sharer_id: user.id,
//           receiver_id: receiverId,
//           path_id: currentPath,
//           status: "pending",
//         },
//       ])
//       .select();

//     if (error) throw error;

//     const invitation = data[0];
//     const globalChannel = await initGlobalChannel();

//     console.log("Enviando broadcast de invitación...");
//     globalChannel.send({
//       type: "broadcast",
//       event: "share-path",
//       payload: {
//         sharer_id: user.id,
//         receiver_id: receiverId,
//         path_id: currentPath,
//         invitation_id: invitation.id,
//       },
//     });

//     console.log("Invitación enviada al contacto:", receiverId);
//   } catch (err) {
//     console.error("[path-sharing.js] Error al crear invitación:", err);
//   }
// };

// // === Enviar coordenadas ===
// export const updateCoords = (coords) => {
//   if (!currentBroadcast) return console.warn("No hay canal activo.");
//   try {
//     currentBroadcast.send({
//       type: "broadcast",
//       event: "coords-update",
//       payload: coords,
//     });
//   } catch (err) {
//     console.error("Error enviando coordenadas:", err);
//   }
// };

// // === Finalizar recorrido ===
// export const endPath = async () => {
//   if (!currentBroadcast) return;
//   try {
//     currentBroadcast.send({
//       type: "broadcast",
//       event: "path-ended",
//       payload: { message: "Recorrido finalizado" },
//     });
//     await currentBroadcast.unsubscribe();
//     currentBroadcast = null;
//     currentPath = null;
//     console.log(" Recorrido finalizado y canal cerrado.");
//   } catch (err) {
//     console.error("Error al finalizar recorrido:", err);
//   }
// };

// services/path-sharing.js
// Lógica de path-sharing con Supabase (canales, invitaciones, coords).

// services/path-sharing.js
// Lógica de path-sharing con Supabase (canales, invitaciones, coords).
// Interfaz inspirada en los ejemplos de clase: funciones claras y suscripciones por callback.

import supabase from "./supabase";

let user = null;
let currentPath = null;
let currentBroadcast = null; // canal supabase activo (si se comparte)
let globalChannel = null;
const pathChannels = {}; // { "<sharerId>:path:<pathId>": { channel, onCoords, onEnded } }

// callbacks locales
const invitationListeners = new Set(); // callbacks (invitation) => { ... }

// ===== Auth =====
export async function subscribeToAuth() {
  const { data } = await supabase.auth.getUser();
  user = data.user ?? null;

  supabase.auth.onAuthStateChange((_event, session) => {
    user = session?.user ?? null;
  });
}

// ===== Global channel / invitaciones =====
async function initGlobalChannelIfNeeded() {
  if (globalChannel) return globalChannel;

  globalChannel = supabase.channel("global-path-sharing");

  // escuchamos invites y notificamos a todos los listeners registrados
  globalChannel.on(
    "broadcast",
    { event: "share-path" },
    (payload) => {
      // payload.payload expected to contain { sharer_id, receiver_id, path_id, invitation_id, ... }
      const invite = payload.payload;
      if (!invite) return;

      // solo notificar a los listeners si coincide receiver
      if (invite.receiver_id === user?.id) {
        invitationListeners.forEach((cb) => {
          try { cb(invite); } catch (err) { console.error("invite cb err", err); }
        });
      }
    }
  );

  await globalChannel.subscribe((status) => {
    console.log("[path-sharing] global channel status:", status);
  });

  return globalChannel;
}

/**
 * Registrar callback para recibir invitaciones entrantes.
 * callback(invitation) => void
 * Devuelve una función para desuscribir ese callback.
 */
export async function startListeningShareInvitations(callback) {
  await subscribeToAuth();
  await initGlobalChannelIfNeeded();
  invitationListeners.add(callback);

  // return unsubscribe function
  return () => {
    invitationListeners.delete(callback);
  };
}

// ===== Escuchar recorrido compartido (receptor) =====
/**
 * startListeningSharedPath({ sharer_id, path_id }, onCoords, onEnded)
 * - onCoords(payload) recibe { lat, lng } o la estructura enviada por el emisor
 * - onEnded(info) es llamado cuando el emisor finaliza el recorrido
 * Devuelve una función unsubscribe() para dejar de escuchar.
 */
export function startListeningSharedPath({ sharer_id, path_id }, onCoords, onEnded) {
  const channelKey = `${sharer_id}:path:${path_id}`;
  if (pathChannels[channelKey]) {
    // si ya existe, simplemente actualizamos callbacks
    pathChannels[channelKey].onCoords = onCoords;
    pathChannels[channelKey].onEnded = onEnded;
    return () => {
      // unsubscribe simple
      const ch = pathChannels[channelKey];
      if (ch?.channel) {
        ch.channel.unsubscribe();
        delete pathChannels[channelKey];
      }
    };
  }

  const channel = supabase.channel(channelKey);

  channel.on("broadcast", { event: "coords-update" }, (payload) => {
    // payload.payload expected to be coords object
    if (onCoords) onCoords(payload.payload);
  });

  channel.on("broadcast", { event: "path-ended" }, (payload) => {
    if (onEnded) onEnded(payload.payload);
    // cleanup
    channel.unsubscribe();
    delete pathChannels[channelKey];
  });

  channel.subscribe((status) => {
    console.log(`[path-sharing] subscribed to shared path ${channelKey}:`, status);
  });

  pathChannels[channelKey] = { channel, onCoords, onEnded };

  return () => {
    if (pathChannels[channelKey]?.channel) {
      pathChannels[channelKey].channel.unsubscribe();
      delete pathChannels[channelKey];
    }
  };
}

// ===== Aceptar / rechazar invitación (BD) =====
export async function acceptSharedPath({ sharer_id, path_id, invitation_id }) {
  try {
    await supabase
      .from("path_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation_id);

    // NOTE: no iniciamos la escucha automática aquí.
    // Quien acepte puede navegar a la vista de seguimiento y llamar startListeningSharedPath.
    return true;
  } catch (err) {
    console.error("[path-sharing] acceptSharedPath error:", err);
    throw err;
  }
}

export async function rejectSharedPath(invitationId) {
  try {
    await supabase
      .from("path_invitations")
      .update({ status: "rejected" })
      .eq("id", invitationId);
    return true;
  } catch (err) {
    console.error("[path-sharing] rejectSharedPath error:", err);
    throw err;
  }
}

// ===== Emisor: iniciar recorrido =====
/**
 * startPath() -> crea un pathId y abre un canal para broadcast (compartido)
 * Devuelve el pathId (uuid).
 */
export async function startPath() {
  await subscribeToAuth();
  if (!user?.id) throw new Error("Usuario no autenticado");

  currentPath = crypto.randomUUID();
  currentBroadcast = supabase.channel(`${user.id}:path:${currentPath}`);

  // escuchas locales útiles (debug)
  currentBroadcast.on("broadcast", { event: "path-ended" }, () => {
    console.log("[path-sharing] local path-ended received");
  });

  await currentBroadcast.subscribe();
  await initGlobalChannelIfNeeded();

  console.log("[path-sharing] started shared path:", currentPath);
  return currentPath;
}

/**
 * startPathWithoutSharing() -> crea un pathId local (sin abrir canal supabase).
 * Útil para trazar en el mapa localmente sin compartir.
 */
export async function startPathWithoutSharing() {
  await subscribeToAuth();
  if (!user?.id) throw new Error("Usuario no autenticado");

  currentPath = crypto.randomUUID();
  // currentBroadcast intentionally null: no se comparte
  currentBroadcast = null;

  // asegurar globalChannel inicializado (para que podamos enviar invitaciones más adelante si quisiéramos)
  await initGlobalChannelIfNeeded();

  console.log("[path-sharing] started local path (no sharing):", currentPath);
  return currentPath;
}

// ===== Compartir: crear invitación y broadcast al receptor =====
export async function sharePathWith(receiverId) {
  if (!currentPath) return console.error("No hay recorrido iniciado.");
  if (!user?.id) return console.error("Usuario no autenticado.");

  try {
    const { data, error } = await supabase
      .from("path_invitations")
      .insert([
        {
          sharer_id: user.id,
          receiver_id: receiverId,
          path_id: currentPath,
          status: "pending",
        },
      ])
      .select();

    if (error) throw error;

    const invitation = data[0];
    await initGlobalChannelIfNeeded();

    globalChannel.send({
      type: "broadcast",
      event: "share-path",
      payload: {
        sharer_id: user.id,
        receiver_id: receiverId,
        path_id: currentPath,
        invitation_id: invitation.id,
        sender_name: user.user_metadata?.name || user.email,
      },
    });

    console.log("[path-sharing] invitation sent to:", receiverId);
    return invitation;
  } catch (err) {
    console.error("[path-sharing] sharePathWith error:", err);
    throw err;
  }
}

// ===== Enviar coordenadas (solo si se está compartiendo) =====
export function updateCoords(coords) {
  if (!currentBroadcast) return; // si es recorrido local, no hacemos nada
  try {
    currentBroadcast.send({
      type: "broadcast",
      event: "coords-update",
      payload: coords,
    });
  } catch (err) {
    console.error("[path-sharing] updateCoords error:", err);
  }
}

// ===== Finalizar recorrido (emisor) =====
export async function endPath() {
  try {
    if (currentBroadcast) {
      // avisamos a receptores
      currentBroadcast.send({
        type: "broadcast",
        event: "path-ended",
        payload: { message: "Recorrido finalizado", sharer_id: user?.id, path_id: currentPath },
      });
      await currentBroadcast.unsubscribe();
      currentBroadcast = null;
    }
    currentPath = null;
    console.log("[path-sharing] path ended");
  } catch (err) {
    console.error("[path-sharing] endPath error:", err);
  }
}

// ===== Helpers públicos =====
export function getCurrentPathId() {
  return currentPath;
}

/**
 * stopListeningSharedPath(channelKey) -> si necesitás cerrar manualmente
 */
export function stopListeningSharedPath({ sharer_id, path_id }) {
  const channelKey = `${sharer_id}:path:${path_id}`;
  if (pathChannels[channelKey]?.channel) {
    pathChannels[channelKey].channel.unsubscribe();
    delete pathChannels[channelKey];
  }
}
