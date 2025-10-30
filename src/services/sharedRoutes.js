// import supabase from './supabase';

// // Suscribirse al canal de broadcast de un usuario específico
// export function subscribeToSharedRoute(userId, callback) {
//   const channelName = `shared_routes:user_${userId}`;
//   const channel = supabase.channel(channelName);

//   channel.on('broadcast', { event: 'new_position' }, payload => {
//     callback(payload); // { lat, lng }
//   });

//   channel.subscribe();

//   return channel;
// }

// // Enviar posición al canal
// export function broadcastPosition(channel, lat, lng) {
//   if (!channel) return;
//   channel.send({
//     type: 'broadcast',
//     event: 'new_position',
//     payload: { lat, lng },
//   });
// }

// // Finalizar recorrido y desuscribirse
// export function unsubscribeChannel(channel) {
//   if (!channel) return;
//   channel.unsubscribe();
// }

import supabase from './supabase';

let currentChannel = null;

// Suscribirse al canal de broadcast de un usuario específico
export function subscribeToSharedRoute(userId, callback) {
  const channelName = `shared_routes:user_${userId}`;
  const channel = supabase.channel(channelName);

  channel.on('broadcast', { event: 'new_position' }, payload => {
    callback(payload); // { lat, lng }
  });

  channel.subscribe();

  currentChannel = channel;
  return channel;
}

// Enviar posición al canal
export function broadcastPosition(channel, lat, lng) {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: 'new_position',
    payload: { lat, lng },
  });
}

// Iniciar recorrido compartido
export async function shareRoute(userId, trustedUserId, start, dest) {
  if (!userId || !trustedUserId) return;

  // Creamos un canal broadcast
  const channelName = `shared_routes:user_${trustedUserId}`;
  const channel = supabase.channel(channelName);

  // Enviar posición inicial
  channel.send({
    type: 'broadcast',
    event: 'new_position',
    payload: { lat: start.lat, lng: start.lng },
  });

  await channel.subscribe();
  currentChannel = channel;
}

// Finalizar recorrido y desuscribirse
export async function stopSharing() {
  if (!currentChannel) return;
  await currentChannel.unsubscribe();
  currentChannel = null;
}
