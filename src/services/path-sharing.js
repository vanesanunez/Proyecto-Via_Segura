// import supabase from "./supabase";

// let user = null;
// let currentPath = null;
// let currentBroadcast = null;
// let globalChannel = null;
// const pathChannels = {};
// const invitationListeners = new Set();

// // historial y destino en memoria (temporal)
// let coordsHistory = [];
// let currentDestination = null;

// // Auth
// export async function subscribeToAuth() {
//   const { data } = await supabase.auth.getUser();
//   user = data.user ?? null;

//   supabase.auth.onAuthStateChange((_event, session) => {
//     user = session?.user ?? null;
//   });
// }

// // Global channel
// async function initGlobalChannelIfNeeded() {
//   if (globalChannel) return globalChannel;

//   globalChannel = supabase.channel("global-path-sharing");

//   globalChannel.on("broadcast", { event: "share-path" }, (payload) => {
//     const invite = payload.payload;
//     if (!invite) return;

//     if (invite.receiver_id === user?.id) {
//       invitationListeners.forEach((cb) => {
//         try {
//           cb(invite);
//         } catch (err) {
//           console.error("invite cb err", err);
//         }
//       });
//     }
//   });

//   await globalChannel.subscribe((status) => {
//     console.log("[path-sharing] global channel status:", status);
//   });

//   return globalChannel;
// }

// // Invitaciones
// export async function startListeningShareInvitations(callback) {
//   await subscribeToAuth();
//   await initGlobalChannelIfNeeded();
//   invitationListeners.add(callback);

//   return () => {
//     invitationListeners.delete(callback);
//   };
// }

// // Receptor: escuchar recorrido compartido
// export function startListeningSharedPath(
//   { sharer_id, path_id },
//   onCoords,
//   onEnded
// ) {
//   const channelKey = `${sharer_id}:path:${path_id}`;

//   if (pathChannels[channelKey]) {
//     pathChannels[channelKey].onCoords = onCoords;
//     pathChannels[channelKey].onEnded = onEnded;

//     return () => {
//       const ch = pathChannels[channelKey];
//       if (ch?.channel) {
//         ch.channel.unsubscribe();
//         delete pathChannels[channelKey];
//       }
//     };
//   }

//   const channel = supabase.channel(channelKey);

//   // cuando el emisor mande puntos nuevos
//   channel.on("broadcast", { event: "coords-update" }, (payload) => {
//     if (onCoords) onCoords({ type: "point", payload: payload.payload });
//   });

//   // cuando el emisor mande el historial completo
//   channel.on("broadcast", { event: "full-history" }, (payload) => {
//     if (onCoords) onCoords({ type: "full-history", payload: payload.payload });
//   });

  
//   channel.on("broadcast", { event: "path-ended" }, (payload) => {
//     if (onEnded) onEnded(payload.payload);
//     channel.unsubscribe();
//     delete pathChannels[channelKey];
//   });

//   channel.subscribe((status) => {
//     console.log(
//       `[path-sharing] subscribed to shared path ${channelKey}:`,
//       status
//     );

//     // Cuando nos suscribimos le pedimos al emisor que nos envie el historial
//     // (si el protocolo lo permite; es un evento simple que el emisor escucha)
//     if (status === "SUBSCRIBED") {
//       // enviamos una solicitud por el mismo canal para que el emisor responda con 'full-history'
//       const request = {
//         type: "broadcast",
//         event: "request-history",
//         payload: {
//           requested_at: new Date().toISOString(),
//         },
//       };

//       try {
//         channel.send(request);
//       } catch (_) {
//         // si falla por algún motivo, intentar vía httpSend
//         channel.httpSend(request).catch((e) => {
//           console.warn("[path-sharing] request-history httpSend failed", e);
//         });
//       }
//     }
//   });

//   pathChannels[channelKey] = { channel, onCoords, onEnded };

//   return () => {
//     if (pathChannels[channelKey]?.channel) {
//       pathChannels[channelKey].channel.unsubscribe();
//       delete pathChannels[channelKey];
//     }
//   };
// }

// // Aceptar o rechazar la invitación
// export async function acceptSharedPath({ sharer_id, path_id, invitation_id }) {
//   try {
//     await supabase
//       .from("path_invitations")
//       .update({ status: "accepted" })
//       .eq("id", invitation_id);

//     return true;
//   } catch (err) {
//     console.error("[path-sharing] acceptSharedPath error:", err);
//     throw err;
//   }
// }

// export async function rejectSharedPath(invitationId) {
//   try {
//     await supabase
//       .from("path_invitations")
//       .update({ status: "rejected" })
//       .eq("id", invitationId);
//     return true;
//   } catch (err) {
//     console.error("[path-sharing] rejectSharedPath error:", err);
//     throw err;
//   }
// }

// // Emisor: iniciar recorrido
// export async function startPath() {
//   await subscribeToAuth();
//   if (!user?.id) throw new Error("Usuario no autenticado");

//   currentPath = crypto.randomUUID();
//   currentBroadcast = supabase.channel(`${user.id}:path:${currentPath}`);

//   // responder a solicitudes de historial
//   currentBroadcast.on("broadcast", { event: "request-history" }, (_payload) => {
//     // cuando alguien pida historial le respondemos con full-history
//     sendFullHistory();
//   });

//   currentBroadcast.on("broadcast", { event: "path-ended" }, () => {
//     console.log("[path-sharing] local path-ended received");
//   });

//   await currentBroadcast.subscribe();
//   await initGlobalChannelIfNeeded();

//   // resetear historial y destino cuando inicia un nuevo recorrido
//   coordsHistory = [];
//   currentDestination = null;

//   console.log("[path-sharing] started shared path:", currentPath);
//   return currentPath;
// }

// // Recorrido sin compartir
// export async function startPathWithoutSharing() {
//   await subscribeToAuth();
//   if (!user?.id) throw new Error("Usuario no autenticado");

//   currentPath = crypto.randomUUID();
//   currentBroadcast = null;

//   await initGlobalChannelIfNeeded();

//   // reset historial y destino
//   coordsHistory = [];
//   currentDestination = null;

//   console.log("[path-sharing] started local path (no sharing):", currentPath);
//   return currentPath;
// }

// // Compartir recorrido
// export async function sharePathWith(receiverId) {
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
//     await initGlobalChannelIfNeeded();

//     const message = {
//       type: "broadcast",
//       event: "share-path",
//       payload: {
//         sharer_id: user.id,
//         receiver_id: receiverId,
//         path_id: currentPath,
//         invitation_id: invitation.id,
//         sender_name: user.user_metadata?.name || user.email,
//       },
//     };

//     try {
//       await globalChannel.send(message);
//     } catch (_) {
//       await globalChannel.httpSend(message);
//     }

//     console.log("[path-sharing] invitation sent to:", receiverId);
//     return invitation;
//   } catch (err) {
//     console.error("[path-sharing] sharePathWith error:", err);
//     throw err;
//   }
// }

// // Emisor: enviar coordenadas
// export function updateCoords(coords) {
//   if (!currentBroadcast) return;

//   // Guardamos en el historial temporal
//   coordsHistory.push({
//     ...coords,
//     ts: new Date().toISOString(),
//   });

//   const message = {
//     type: "broadcast",
//     event: "coords-update",
//     payload: coords,
//   };

//   try {
//     currentBroadcast.send(message);
//   } catch (_) {
//     currentBroadcast.httpSend(message);
//   }
// }

// //permitir que el emisor comparta un destino
// export function setCurrentDestination(destination) {
//   // destination = { lat: number, lng: number, address?: string }
//   currentDestination = destination;
// }

// // Emisor: enviar historial completo (responde a request-history)
// export function sendFullHistory() {
//   if (!currentBroadcast) return;

//   const message = {
//     type: "broadcast",
//     event: "full-history",
//     payload: {
//       history: coordsHistory,
//       destination: currentDestination,
//     },
//   };

//   try {
//     currentBroadcast.send(message);
//   } catch (_) {
//     currentBroadcast.httpSend(message);
//   }
// }

// // Finalizar recorrido
// export async function endPath() {
//   try {
//     if (currentBroadcast) {
//       const message = {
//         type: "broadcast",
//         event: "path-ended",
//         payload: {
//           message: "Recorrido finalizado",
//           sharer_id: user?.id,
//           path_id: currentPath,
//         },
//       };

//       try {
//         currentBroadcast.send(message);
//       } catch (_) {
//         currentBroadcast.httpSend(message);
//       }

//       await currentBroadcast.unsubscribe();
//       currentBroadcast = null;
//     }

//     currentPath = null;
//     coordsHistory = [];
//     currentDestination = null;

//     console.log("[path-sharing] path ended - canal cerrado");
//   } catch (err) {
//     console.error("[path-sharing] endPath error:", err);
//   }
// }

// export function getCurrentPathId() {
//   return currentPath;
// }

// export function stopListeningSharedPath({ sharer_id, path_id }) {
//   const channelKey = `${sharer_id}:path:${path_id}`;
//   if (pathChannels[channelKey]?.channel) {
//     pathChannels[channelKey].channel.unsubscribe();
//     delete pathChannels[channelKey];
//   }
// }

// import supabase from "./supabase";

// let user = null;
// let currentPath = null;
// let currentBroadcast = null;
// let globalChannel = null;
// const pathChannels = {};
// const invitationListeners = new Set();

// // historial y destino en memoria (temporal)
// let coordsHistory = [];
// let currentDestination = null;

// // Auth
// export async function subscribeToAuth() {
//   const { data } = await supabase.auth.getUser();
//   user = data.user ?? null;

//   supabase.auth.onAuthStateChange((_event, session) => {
//     user = session?.user ?? null;
//   });
// }

// // Global channel
// async function initGlobalChannelIfNeeded() {
//   if (globalChannel) return globalChannel;

//   globalChannel = supabase.channel("global-path-sharing");

//   globalChannel.on("broadcast", { event: "share-path" }, (payload) => {
//     const invite = payload.payload;
//     if (!invite) return;

//     if (invite.receiver_id === user?.id) {
//       invitationListeners.forEach((cb) => {
//         try {
//           cb(invite);
//         } catch (err) {
//           console.error("invite cb err", err);
//         }
//       });
//     }
//   });

//   await globalChannel.subscribe((status) => {
//     console.log("[path-sharing] global channel status:", status);
//   });

//   return globalChannel;
// }

// // Invitaciones
// export async function startListeningShareInvitations(callback) {
//   await subscribeToAuth();
//   await initGlobalChannelIfNeeded();
//   invitationListeners.add(callback);

//   return () => {
//     invitationListeners.delete(callback);
//   };
// }

// // Receptor: escuchar recorrido compartido
// export function startListeningSharedPath(
//   { sharer_id, path_id },
//   onCoords,
//   onEnded
// ) {
//   const channelKey = `${sharer_id}:path:${path_id}`;

//   if (pathChannels[channelKey]) {
//     pathChannels[channelKey].onCoords = onCoords;
//     pathChannels[channelKey].onEnded = onEnded;

//     return () => {
//       const ch = pathChannels[channelKey];
//       if (ch?.channel) {
//         ch.channel.unsubscribe();
//         delete pathChannels[channelKey];
//       }
//     };
//   }

//   const channel = supabase.channel(channelKey);

//   // cuando el emisor mande puntos nuevos
//   channel.on("broadcast", { event: "coords-update" }, (payload) => {
//     if (onCoords) onCoords({ type: "point", payload: payload.payload });
//   });

//   // cuando el emisor mande el historial completo
//   channel.on("broadcast", { event: "full-history" }, (payload) => {
//     if (onCoords) onCoords({ type: "full-history", payload: payload.payload });
//   });

//   channel.on("broadcast", { event: "path-ended" }, (payload) => {
//     if (onEnded) onEnded(payload.payload);
//     channel.unsubscribe();
//     delete pathChannels[channelKey];
//   });

//   channel.subscribe((status) => {
//     console.log(
//       `[path-sharing] subscribed to shared path ${channelKey}:`,
//       status
//     );

//     if (status === "SUBSCRIBED") {
//       const request = {
//         type: "broadcast",
//         event: "request-history",
//         payload: {
//           requested_at: new Date().toISOString(),
//         },
//       };

//       try {
//         channel.send(request);
//       } catch (_) {
//         channel.httpSend(request).catch((e) => {
//           console.warn("[path-sharing] request-history httpSend failed", e);
//         });
//       }
//     }
//   });

//   pathChannels[channelKey] = { channel, onCoords, onEnded };

//   return () => {
//     if (pathChannels[channelKey]?.channel) {
//       pathChannels[channelKey].channel.unsubscribe();
//       delete pathChannels[channelKey];
//     }
//   };
// }

// // Aceptar o rechazar la invitación
// export async function acceptSharedPath({ sharer_id, path_id, invitation_id }) {
//   try {
//     await supabase
//       .from("path_invitations")
//       .update({ status: "accepted" })
//       .eq("id", invitation_id);

//     return true;
//   } catch (err) {
//     console.error("[path-sharing] acceptSharedPath error:", err);
//     throw err;
//   }
// }

// export async function rejectSharedPath(invitationId) {
//   try {
//     await supabase
//       .from("path_invitations")
//       .update({ status: "rejected" })
//       .eq("id", invitationId);
//     return true;
//   } catch (err) {
//     console.error("[path-sharing] rejectSharedPath error:", err);
//     throw err;
//   }
// }

// // Emisor: iniciar recorrido
// export async function startPath() {
//   await subscribeToAuth();
//   if (!user?.id) throw new Error("Usuario no autenticado");

//   currentPath = crypto.randomUUID();
//   currentBroadcast = supabase.channel(`${user.id}:path:${currentPath}`);

//   currentBroadcast.on("broadcast", { event: "request-history" }, (_payload) => {
//     sendFullHistory();
//   });

//   currentBroadcast.on("broadcast", { event: "path-ended" }, () => {
//     console.log("[path-sharing] local path-ended received");
//   });

//   await currentBroadcast.subscribe();
//   await initGlobalChannelIfNeeded();

//   coordsHistory = [];
//   currentDestination = null;

//   console.log("[path-sharing] started shared path:", currentPath);
//   return currentPath;
// }

// // Recorrido sin compartir
// export async function startPathWithoutSharing() {
//   await subscribeToAuth();
//   if (!user?.id) throw new Error("Usuario no autenticado");

//   currentPath = crypto.randomUUID();
//   currentBroadcast = null;

//   await initGlobalChannelIfNeeded();

//   coordsHistory = [];
//   currentDestination = null;

//   console.log("[path-sharing] started local path (no sharing):", currentPath);
//   return currentPath;
// }

// /**
//  * Compartir recorrido.
//  * @param {string} receiverId
//  * @param {string} [senderName] Nombre visible del emisor (nombre + apellido del perfil).
//  *   Si no se pasa, se intenta con user_metadata y, como último recurso, el email.
//  */
// export async function sharePathWith(receiverId, senderName) {
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
//     await initGlobalChannelIfNeeded();

//     const message = {
//       type: "broadcast",
//       event: "share-path",
//       payload: {
//         sharer_id: user.id,
//         receiver_id: receiverId,
//         path_id: currentPath,
//         invitation_id: invitation.id,
//         sender_name: senderName || user.user_metadata?.name || user.email,
//       },
//     };

//     try {
//       await globalChannel.send(message);
//     } catch (_) {
//       await globalChannel.httpSend(message);
//     }

//     console.log("[path-sharing] invitation sent to:", receiverId);
//     return invitation;
//   } catch (err) {
//     console.error("[path-sharing] sharePathWith error:", err);
//     throw err;
//   }
// }

// // Emisor: enviar coordenadas
// export function updateCoords(coords) {
//   if (!currentBroadcast) return;

//   coordsHistory.push({
//     ...coords,
//     ts: new Date().toISOString(),
//   });

//   const message = {
//     type: "broadcast",
//     event: "coords-update",
//     payload: coords,
//   };

//   try {
//     currentBroadcast.send(message);
//   } catch (_) {
//     currentBroadcast.httpSend(message);
//   }
// }

// export function setCurrentDestination(destination) {
//   currentDestination = destination;
// }

// export function sendFullHistory() {
//   if (!currentBroadcast) return;

//   const message = {
//     type: "broadcast",
//     event: "full-history",
//     payload: {
//       history: coordsHistory,
//       destination: currentDestination,
//     },
//   };

//   try {
//     currentBroadcast.send(message);
//   } catch (_) {
//     currentBroadcast.httpSend(message);
//   }
// }

// // Finalizar recorrido
// export async function endPath() {
//   try {
//     if (currentBroadcast) {
//       const message = {
//         type: "broadcast",
//         event: "path-ended",
//         payload: {
//           message: "Recorrido finalizado",
//           sharer_id: user?.id,
//           path_id: currentPath,
//         },
//       };

//       try {
//         currentBroadcast.send(message);
//       } catch (_) {
//         currentBroadcast.httpSend(message);
//       }

//       await currentBroadcast.unsubscribe();
//       currentBroadcast = null;
//     }

//     currentPath = null;
//     coordsHistory = [];
//     currentDestination = null;

//     console.log("[path-sharing] path ended - canal cerrado");
//   } catch (err) {
//     console.error("[path-sharing] endPath error:", err);
//   }
// }

// export function getCurrentPathId() {
//   return currentPath;
// }

// export function stopListeningSharedPath({ sharer_id, path_id }) {
//   const channelKey = `${sharer_id}:path:${path_id}`;
//   if (pathChannels[channelKey]?.channel) {
//     pathChannels[channelKey].channel.unsubscribe();
//     delete pathChannels[channelKey];
//   }
// }
import supabase from "./supabase";

let user = null;
let currentPath = null;
let currentBroadcast = null;
let globalChannel = null;
const pathChannels = {};
const invitationListeners = new Set();

// historial y destino en memoria (temporal)
let coordsHistory = [];
let currentDestination = null;

// Auth
export async function subscribeToAuth() {
  const { data } = await supabase.auth.getUser();
  user = data.user ?? null;

  supabase.auth.onAuthStateChange((_event, session) => {
    user = session?.user ?? null;
  });
}

// Global channel
async function initGlobalChannelIfNeeded() {
  if (globalChannel) return globalChannel;

  globalChannel = supabase.channel("global-path-sharing");

  globalChannel.on("broadcast", { event: "share-path" }, (payload) => {
    const invite = payload.payload;
    if (!invite) return;

    if (invite.receiver_id === user?.id) {
      invitationListeners.forEach((cb) => {
        try {
          cb(invite);
        } catch (err) {
          console.error("invite cb err", err);
        }
      });
    }
  });

  await globalChannel.subscribe((status) => {
    console.log("[path-sharing] global channel status:", status);
  });

  return globalChannel;
}

// Invitaciones
export async function startListeningShareInvitations(callback) {
  await subscribeToAuth();
  await initGlobalChannelIfNeeded();
  invitationListeners.add(callback);

  return () => {
    invitationListeners.delete(callback);
  };
}

// Receptor: escuchar recorrido compartido
export function startListeningSharedPath(
  { sharer_id, path_id },
  onCoords,
  onEnded
) {
  const channelKey = `${sharer_id}:path:${path_id}`;

  if (pathChannels[channelKey]) {
    pathChannels[channelKey].onCoords = onCoords;
    pathChannels[channelKey].onEnded = onEnded;

    return () => {
      const ch = pathChannels[channelKey];
      if (ch?.channel) {
        ch.channel.unsubscribe();
        delete pathChannels[channelKey];
      }
    };
  }

  const channel = supabase.channel(channelKey);

  // cuando el emisor mande puntos nuevos
  channel.on("broadcast", { event: "coords-update" }, (payload) => {
    if (onCoords) onCoords({ type: "point", payload: payload.payload });
  });

  // cuando el emisor mande el historial completo
  channel.on("broadcast", { event: "full-history" }, (payload) => {
    if (onCoords) onCoords({ type: "full-history", payload: payload.payload });
  });

  // cuando el emisor finaliza el recorrido (llegó bien o cortó sin avisar)
  channel.on("broadcast", { event: "path-ended" }, (payload) => {
    if (onEnded) onEnded(payload.payload);
    channel.unsubscribe();
    delete pathChannels[channelKey];
  });

  channel.subscribe((status) => {
    console.log(
      `[path-sharing] subscribed to shared path ${channelKey}:`,
      status
    );

    if (status === "SUBSCRIBED") {
      const request = {
        type: "broadcast",
        event: "request-history",
        payload: {
          requested_at: new Date().toISOString(),
        },
      };

      try {
        channel.send(request);
      } catch (_) {
        channel.httpSend(request).catch((e) => {
          console.warn("[path-sharing] request-history httpSend failed", e);
        });
      }
    }
  });

  pathChannels[channelKey] = { channel, onCoords, onEnded };

  return () => {
    if (pathChannels[channelKey]?.channel) {
      pathChannels[channelKey].channel.unsubscribe();
      delete pathChannels[channelKey];
    }
  };
}

// Aceptar o rechazar la invitación
export async function acceptSharedPath({ sharer_id, path_id, invitation_id }) {
  try {
    await supabase
      .from("path_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation_id);

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

// Emisor: iniciar recorrido
export async function startPath() {
  await subscribeToAuth();
  if (!user?.id) throw new Error("Usuario no autenticado");

  currentPath = crypto.randomUUID();
  currentBroadcast = supabase.channel(`${user.id}:path:${currentPath}`);

  currentBroadcast.on("broadcast", { event: "request-history" }, (_payload) => {
    sendFullHistory();
  });

  currentBroadcast.on("broadcast", { event: "path-ended" }, () => {
    console.log("[path-sharing] local path-ended received");
  });

  await currentBroadcast.subscribe();
  await initGlobalChannelIfNeeded();

  coordsHistory = [];
  currentDestination = null;

  console.log("[path-sharing] started shared path:", currentPath);
  return currentPath;
}

// Recorrido sin compartir
export async function startPathWithoutSharing() {
  await subscribeToAuth();
  if (!user?.id) throw new Error("Usuario no autenticado");

  currentPath = crypto.randomUUID();
  currentBroadcast = null;

  await initGlobalChannelIfNeeded();

  coordsHistory = [];
  currentDestination = null;

  console.log("[path-sharing] started local path (no sharing):", currentPath);
  return currentPath;
}

/**
 * Compartir recorrido.
 * @param {string} receiverId
 * @param {string} [senderName] Nombre visible del emisor (nombre + apellido del perfil).
 */
export async function sharePathWith(receiverId, senderName) {
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

    const message = {
      type: "broadcast",
      event: "share-path",
      payload: {
        sharer_id: user.id,
        receiver_id: receiverId,
        path_id: currentPath,
        invitation_id: invitation.id,
        sender_name: senderName || user.user_metadata?.name || user.email,
      },
    };

    try {
      await globalChannel.send(message);
    } catch (_) {
      await globalChannel.httpSend(message);
    }

    console.log("[path-sharing] invitation sent to:", receiverId);
    return invitation;
  } catch (err) {
    console.error("[path-sharing] sharePathWith error:", err);
    throw err;
  }
}

// Emisor: enviar coordenadas
export function updateCoords(coords) {
  if (!currentBroadcast) return;

  coordsHistory.push({
    ...coords,
    ts: new Date().toISOString(),
  });

  const message = {
    type: "broadcast",
    event: "coords-update",
    payload: coords,
  };

  try {
    currentBroadcast.send(message);
  } catch (_) {
    currentBroadcast.httpSend(message);
  }
}

export function setCurrentDestination(destination) {
  currentDestination = destination;
}

export function sendFullHistory() {
  if (!currentBroadcast) return;

  const message = {
    type: "broadcast",
    event: "full-history",
    payload: {
      history: coordsHistory,
      destination: currentDestination,
    },
  };

  try {
    currentBroadcast.send(message);
  } catch (_) {
    currentBroadcast.httpSend(message);
  }
}

/**
 * Finaliza el recorrido y avisa al contacto que lo sigue.
 * @param {{arrived?: boolean, message?: string}} options
 *   arrived: true si el usuario confirmó "Llegué bien".
 */
export async function endPath({ arrived = false, message } = {}) {
  try {
    if (currentBroadcast) {
      const payload = {
        message: message || (arrived ? "Llegó bien a destino" : "Recorrido finalizado"),
        arrived,
        sharer_id: user?.id,
        path_id: currentPath,
      };

      const broadcastMessage = {
        type: "broadcast",
        event: "path-ended",
        payload,
      };

      // IMPORTANTE: esperamos a que el mensaje realmente salga antes de
      // cerrar el canal, si no el contacto nunca se entera del final.
      try {
        await currentBroadcast.send(broadcastMessage);
      } catch (_) {
        await currentBroadcast.httpSend(broadcastMessage);
      }

      // pequeño margen extra para que Supabase Realtime propague el evento
      await new Promise((resolve) => setTimeout(resolve, 400));

      await currentBroadcast.unsubscribe();
      currentBroadcast = null;
    }

    currentPath = null;
    coordsHistory = [];
    currentDestination = null;

    console.log("[path-sharing] path ended - canal cerrado");
  } catch (err) {
    console.error("[path-sharing] endPath error:", err);
  }
}

export function getCurrentPathId() {
  return currentPath;
}

export function stopListeningSharedPath({ sharer_id, path_id }) {
  const channelKey = `${sharer_id}:path:${path_id}`;
  if (pathChannels[channelKey]?.channel) {
    pathChannels[channelKey].channel.unsubscribe();
    delete pathChannels[channelKey];
  }
}