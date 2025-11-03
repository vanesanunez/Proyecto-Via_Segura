// services/path-sharing.js
import supabase from "./supabase";

let user = null;
let currentPath = null;
let currentBroadcast = null;
let globalSharingChannel = null;
let pathChannels = {};

// Suscribirse al usuario autenticado
const subscribeToAuth = async () => {
  const { data } = await supabase.auth.getUser();
  user = data.user;

  supabase.auth.onAuthStateChange((_event, session) => {
    user = session?.user || null;
  });
};

// Escuchar invitaciones globales (para receptores)
export const startListeningShareInvitations = async () => {
  await subscribeToAuth();
  if (!user?.id) return;

  globalSharingChannel = supabase.channel("global-path-sharing");

  globalSharingChannel.on("broadcast", { event: "share-path" }, async (payload) => {
    if (payload.receiver_id === user.id) {
      console.log("Recibiste una invitación para seguir un recorrido.");

      // Emitir evento al frontend
      window.dispatchEvent(
        new CustomEvent("path-invitation", { detail: payload })
      );
    }
  });

  globalSharingChannel.subscribe();
};

// Escuchar recorrido compartido
const startListeningSharedPath = ({ sharer_id, path_id }) => {
  const channelKey = `${sharer_id}:path:${path_id}`;
  if (pathChannels[channelKey]) return;

  const channel = supabase.channel(channelKey);

  channel.on("broadcast", { event: "coords-update" }, (payload) => {
    window.dispatchEvent(
      new CustomEvent("coords-update", { detail: payload })
    );
  });

  channel.on("broadcast", { event: "path-ended" }, () => {
    console.log("El usuario finalizó el recorrido.");
    channel.unsubscribe();
  });

  channel.subscribe();
  pathChannels[channelKey] = channel;
};

// Suscribirse a una invitación aceptada por el receptor
export const acceptSharedPath = ({ sharer_id, path_id, invitationId }) => {
  // Actualizar invitación en DB
  supabase
    .from("path_invitations")
    .update({ status: "accepted" })
    .eq("id", invitationId);

  // Suscribirse a las coordenadas
  startListeningSharedPath({ sharer_id, path_id });
};

// Rechazar invitación
export const rejectSharedPath = (invitationId) => {
  supabase
    .from("path_invitations")
    .update({ status: "rejected" })
    .eq("id", invitationId);
};

// Iniciar recorrido
export const startPath = async () => {
  await subscribeToAuth();
  if (!user?.id) throw new Error("Usuario no autenticado");

  currentPath = crypto.randomUUID();
  currentBroadcast = supabase.channel(`${user.id}:path:${currentPath}`);
  await currentBroadcast.subscribe();

  console.log("Trayecto iniciado", currentPath);
  return currentPath;
};

// Compartir recorrido con un contacto
export const sharePathWith = async (receiverId) => {
  if (!currentPath) return console.error("No hay recorrido iniciado");
  if (!user?.id) return console.error("Usuario no autenticado");

  try {
    // Insertar invitación en DB
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

    // Notificar al receptor
    globalSharingChannel.send({
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

// Enviar coordenadas en tiempo real
export const updateCoords = (coords) => {
  if (!currentBroadcast) return;
  currentBroadcast.send({
    type: "broadcast",
    event: "coords-update",
    payload: coords,
  });
};

// Finalizar recorrido
export const endPath = () => {
  if (!currentBroadcast) return;
  currentBroadcast.send({
    type: "broadcast",
    event: "path-ended",
    payload: { message: "Recorrido finalizado" },
  });
  currentBroadcast.unsubscribe();
  currentPath = null;
  console.log("🏁 Recorrido finalizado");
};
