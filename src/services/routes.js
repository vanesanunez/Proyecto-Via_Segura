import supabase from "./supabase";

let channel = null;

/**
 * Crea (o recupera) un canal de broadcast entre user_id y trusted_user_id.
 * Ambos usuarios usan el mismo nombre de canal.
 */
function getChannelName(user_id, trusted_user_id) {
  const ids = [user_id, trusted_user_id].sort();
  return `shared-route-${ids[0]}-${ids[1]}`;
}

/**
 * Inicia el canal y se suscribe a las posiciones recibidas.
 * @param {string} user_id - id del usuario local
 * @param {string} trusted_user_id - id del contacto de confianza
 * @param {(position: {lat:number, lng:number, sender_id:string}) => void} callback
 */
export function subscribeToSharedRoute(user_id, trusted_user_id, callback) {
  const channelName = getChannelName(user_id, trusted_user_id);

  channel = supabase.channel(channelName, {
    config: { broadcast: { self: false } }, 
  });

  // Escuchar posiciones broadcast
  channel.on("broadcast", { event: "position" }, (payload) => {
    callback(payload.payload);
  });

  channel.subscribe((status) => {
    console.log("[sharedRoutes] Canal", channelName, "estado:", status);
  });
}

/**
 * Envía la posición actual al canal.
 * @param {string} user_id
 * @param {string} trusted_user_id
 * @param {{lat:number, lng:number}} coords
 */
export function broadcastPosition(user_id, trusted_user_id, coords) {
  if (!channel) {
    const channelName = getChannelName(user_id, trusted_user_id);
    channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });
    channel.subscribe();
  }

  channel.send({
    type: "broadcast",
    event: "position",
    payload: { ...coords, sender_id: user_id },
  });
}

/**
 * Cierra el canal actual.
 */
export function stopSharing() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}
