import supabase from "./supabase";

let user = null;
let currentPath = null;
let currentBroadcast = null;
let globalChannel = null;
const pathChannels = {};

const invitationListeners = new Set();


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

  globalChannel.on(
    "broadcast",
    { event: "share-path" },
    (payload) => {
      const invite = payload.payload;
      if (!invite) return;

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

export function startListeningSharedPath({ sharer_id, path_id }, onCoords, onEnded) {
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

  channel.on("broadcast", { event: "coords-update" }, (payload) => {
    if (onCoords) onCoords(payload.payload);
  });

  channel.on("broadcast", { event: "path-ended" }, (payload) => {
    if (onEnded) onEnded(payload.payload);
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

  currentBroadcast.on("broadcast", { event: "path-ended" }, () => {
    console.log("[path-sharing] local path-ended received");
  });

  await currentBroadcast.subscribe();
  await initGlobalChannelIfNeeded();

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

  console.log("[path-sharing] started local path (no sharing):", currentPath);
  return currentPath;
}


// Compartir recorrido

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

    const message = {
      type: "broadcast",
      event: "share-path",
      payload: {
        sharer_id: user.id,
        receiver_id: receiverId,
        path_id: currentPath,
        invitation_id: invitation.id,
        sender_name: user.user_metadata?.name || user.email,
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


// Finalizar recorrido

export async function endPath() {
  try {
    if (currentBroadcast) {
      const message = {
        type: "broadcast",
        event: "path-ended",
        payload: {
          message: "Recorrido finalizado",
          sharer_id: user?.id,
          path_id: currentPath,
        },
      };

      try {
        currentBroadcast.send(message);
      } catch (_) {
        currentBroadcast.httpSend(message);
      }

      await currentBroadcast.unsubscribe();
      currentBroadcast = null;
    }

    currentPath = null;
    console.log("[path-sharing] path ended - canal cerrado");
  } catch (err) {
    console.error("[path-sharing] endPath error:", err);
  }
}


// Helpers

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
