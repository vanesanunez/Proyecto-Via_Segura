import supabase from "./supabase";

let user = null;
let currentPath = null;
let currentBroadcast = null;
let globalSharingChannel = null;
let pathChannels = {};

// Suscripción al estado de autenticación
const subscribeToAuth = async () => {
  const { data } = await supabase.auth.getUser();
  user = data.user;

  supabase.auth.onAuthStateChange((_event, session) => {
    user = session?.user || null;
  });
};

// Inicializar canal global y suscribirse a invitaciones
const initGlobalChannel = async () => {
  if (globalSharingChannel) return globalSharingChannel; // evitar duplicados

  console.log("Subscribiéndose al canal global de path-sharing...");
  globalSharingChannel = supabase.channel("global-path-sharing");

  // Escucha global de invitaciones
  globalSharingChannel.on("broadcast", { event: "share-path" }, (payload) => {
    if (payload.payload.receiver_id === user?.id) {
      console.log("Invitación recibida para seguir un recorrido.");
      // Emitimos un evento global que cualquier componente puede escuchar
      window.dispatchEvent(new CustomEvent("path-invitation", { detail: payload.payload }));
    } else {
      console.log("Broadcast ignorado (no coincide receiver_id):", payload.payload.receiver_id, "≠", user?.id);
    }
  });

  await globalSharingChannel.subscribe((status) => {
    console.log("Estado de suscripción global:", status);
  });

  return globalSharingChannel;
};

// === Escuchar invitaciones (para receptores) ===
export const startListeningShareInvitations = async () => {
  await subscribeToAuth();
  await initGlobalChannel();
  console.log("Escuchando invitaciones de recorrido...");
};

// === Escuchar recorrido compartido (canal individual) ===
const startListeningSharedPath = ({ sharer_id, path_id }) => {
  const channelKey = `${sharer_id}:path:${path_id}`;
  if (pathChannels[channelKey]) return; // ya suscripto

  const channel = supabase.channel(channelKey);

  channel.on("broadcast", { event: "coords-update" }, (payload) => {
    window.dispatchEvent(new CustomEvent("coords-update", { detail: payload }));
  });

  channel.on("broadcast", { event: "path-ended" }, () => {
    console.log("El usuario finalizó el recorrido.");
    window.dispatchEvent(new CustomEvent("path-ended", { detail: { sharer_id, path_id } }));
    channel.unsubscribe();
    delete pathChannels[channelKey];
  });

  channel.subscribe((status) => {
    console.log(` Canal de seguimiento (${channelKey}):`, status);
  });

  pathChannels[channelKey] = channel;
};

// === Aceptar invitación ===
export const acceptSharedPath = async ({ sharer_id, path_id, invitation_id }) => {
  try {
    await supabase
      .from("path_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation_id);

    startListeningSharedPath({ sharer_id, path_id });
  } catch (err) {
    console.error("Error al aceptar invitación:", err);
  }
};

// === Rechazar invitación ===
export const rejectSharedPath = async (invitationId) => {
  try {
    await supabase
      .from("path_invitations")
      .update({ status: "rejected" })
      .eq("id", invitationId);
  } catch (err) {
    console.error("Error al rechazar invitación:", err);
  }
};

// === Iniciar recorrido (para emisor) ===
export const startPath = async () => {
  await subscribeToAuth();
  if (!user?.id) throw new Error("Usuario no autenticado");

  currentPath = crypto.randomUUID();
  currentBroadcast = supabase.channel(`${user.id}:path:${currentPath}`);

  // Escucha del canal local (para debug o control)
  currentBroadcast.on("broadcast", { event: "path-ended" }, () => {
    console.log("Trayecto finalizado localmente.");
  });

  await currentBroadcast.subscribe();
  await initGlobalChannel();

  console.log("Trayecto iniciado:", currentPath);
  return currentPath;
};

// === Compartir recorrido con un contacto ===
export const sharePathWith = async (receiverId) => {
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
    const globalChannel = await initGlobalChannel();

    console.log("Enviando broadcast de invitación...");
    globalChannel.send({
      type: "broadcast",
      event: "share-path",
      payload: {
        sharer_id: user.id,
        receiver_id: receiverId,
        path_id: currentPath,
        invitation_id: invitation.id,
      },
    });

    console.log("Invitación enviada al contacto:", receiverId);
  } catch (err) {
    console.error("[path-sharing.js] Error al crear invitación:", err);
  }
};

// === Enviar coordenadas ===
export const updateCoords = (coords) => {
  if (!currentBroadcast) return console.warn("No hay canal activo.");
  try {
    currentBroadcast.send({
      type: "broadcast",
      event: "coords-update",
      payload: coords,
    });
  } catch (err) {
    console.error("Error enviando coordenadas:", err);
  }
};

// === Finalizar recorrido ===
export const endPath = async () => {
  if (!currentBroadcast) return;
  try {
    currentBroadcast.send({
      type: "broadcast",
      event: "path-ended",
      payload: { message: "Recorrido finalizado" },
    });
    await currentBroadcast.unsubscribe();
    currentBroadcast = null;
    currentPath = null;
    console.log(" Recorrido finalizado y canal cerrado.");
  } catch (err) {
    console.error("Error al finalizar recorrido:", err);
  }
};

