import supabase from './supabase';

let currentChannel = null;

// Suscribirse al canal de broadcast de un usuario específico (el que recibe el recorrido)
export function subscribeToSharedRoute(userId, callback) {
  if (!userId) return null;

  const channelName = `shared_routes:user_${userId}`;
  const channel = supabase.channel(channelName);

  // Escuchar eventos broadcast de nuevas posiciones
  channel.on('broadcast', { event: 'new_position' }, payload => {
    callback(payload); // { lat, lng }
  });

  channel.subscribe();
  currentChannel = channel;
  return channel;
}

// Enviar posición al canal (para el que comparte)
export function broadcastPosition(lat, lng) {
  if (!currentChannel) return;
  currentChannel.send({
    type: 'broadcast',
    event: 'new_position',
    payload: { lat, lng },
  });
}

// Iniciar recorrido compartido
export async function shareRoute(userId, trustedUserId, start, dest) {
  if (!userId || !trustedUserId || !start || !dest) return;

  // Creamos un canal broadcast hacia el contacto de confianza
  const channelName = `shared_routes:user_${trustedUserId}`;
  const channel = supabase.channel(channelName);

  // Enviar posición inicial
  channel.send({
    type: 'broadcast',
    event: 'new_position',
    payload: { lat: start.lat, lng: start.lng },
  });

  channel.subscribe();
  currentChannel = channel;

  // Opcional: si querés enviar la posición de destino también
  broadcastPosition(dest.lat, dest.lng);
}

// Finalizar recorrido y desuscribirse
export async function stopSharing() {
  if (!currentChannel) return;
  await currentChannel.unsubscribe();
  currentChannel = null;
}
