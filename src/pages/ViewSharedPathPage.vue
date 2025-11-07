<!-- <script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useAuth } from "@/composables/useAuth";
import { supabase } from "@/supabaseClient";

// Refs reactivas
const { user } = useAuth();
const incomingInvite = ref(null);
let globalChannel = null;

onMounted(() => {
  console.log("Subscribiéndose al canal global de path-sharing...");

  // Escuchamos en el canal global, que recibe todas las invitaciones emitidas
  globalChannel = supabase
    .channel("path-sharing-global")
    .on("broadcast", { event: "invite" }, (payload) => {
      console.log("Mensaje broadcast recibido:", payload);
      const invite = payload.payload; // El contenido que envió el emisor

      // Si el mensaje está dirigido a este usuario, mostrar la notificación
      if (invite.contact_id === user.value?.id) {
        console.log("Invitación dirigida a este usuario:", invite);
        incomingInvite.value = invite;
      } else {
        console.log("Invitación para otro usuario:", invite.contact_id);
      }
    })
    .subscribe((status) => {
      console.log("Estado de suscripción global:", status);
    });
});

onUnmounted(() => {
  if (globalChannel) {
    supabase.removeChannel(globalChannel);
  }
});

// Aceptar o rechazar invitación
const acceptInvite = () => {
  console.log("Seguimiento aceptado:", incomingInvite.value);
  incomingInvite.value = null;
};

const rejectInvite = () => {
  console.log("Seguimiento rechazado");
  incomingInvite.value = null;
};
</script>

<template>
  <div class="shared-path-view">
    <h2>Esperando invitaciones de recorrido...</h2>

    <div v-if="incomingInvite" class="invite-toast">
      <p>
        {{ incomingInvite.sender_name || "Alguien" }}
        quiere compartir su recorrido contigo.
      </p>
      <div class="buttons">
        <button @click="acceptInvite" class="accept">Aceptar</button>
        <button @click="rejectInvite" class="reject">Rechazar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shared-path-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 4rem;
  font-family: Inter, sans-serif;
  color: #2a2a2a;
}

.invite-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 1rem 1.5rem;
  max-width: 300px;
  text-align: center;
  animation: fadeIn 0.3s ease-out;
  z-index: 1000;
}

.invite-toast p {
  margin: 0 0 0.5rem;
}

.buttons {
  display: flex;
  justify-content: space-between;
}

button {
  cursor: pointer;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-weight: 600;
  transition: background 0.2s ease;
}

button.accept {
  background-color: #3082e3;
  color: white;
}

button.reject {
  background-color: #f2826d;
  color: white;
}

button:hover {
  opacity: 0.9;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> -->

<!-- views/ViewSharedPathPage.vue -->



<template>
  <div class="max-w-3xl mx-auto p-4">
    <AppH1>Seguir recorrido</AppH1>
    <div ref="mapEl" class="mt-4 rounded-xl border" style="height: 500px;"></div>
    <div class="mt-4">
      <button @click="stopFollowing" class="px-4 py-2 rounded bg-gray-200">Dejar de seguir</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import L from "leaflet";
import AppH1 from "../components/AppH1.vue";
import { startListeningSharedPath, stopListeningSharedPath } from "../services/path-sharing";

import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon2x,
  iconUrl: icon,
  shadowUrl: shadow,
});

export default {
  name: "ViewSharedPathPage",
  components: { AppH1 },
  setup(_, { root }) {
    const mapEl = ref(null);
    let map, trackedMarker, trackedPolyline;
    let unsubscribeShared = null;

    // Leemos params: path_id como param o query; sharer_id por query o param
    const route = root.$route;
    const path_id = route.params.path_id || route.query.path_id;
    const sharer_id = route.query.sharer_id || route.params.sharer_id;

    onMounted(() => {
      map = L.map(mapEl.value, { zoomControl: false }).setView([-34.6037, -58.3816], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Suscribir al canal compartido y actualizar mapa en tiempo real
      if (sharer_id && path_id) {
        unsubscribeShared = startListeningSharedPath(
          { sharer_id, path_id },
          (coords) => {
            // coords: { lat, lng } esperado
            if (!coords) return;
            const lat = coords.lat ?? coords.latitude;
            const lng = coords.lng ?? coords.longitude ?? coords.lon;

            if (lat == null || lng == null) return;

            // marcador y polyline
            if (!trackedMarker) {
              trackedMarker = L.marker([lat, lng]).addTo(map).bindPopup("Usuario seguido");
            } else {
              trackedMarker.setLatLng([lat, lng]);
            }

            if (!trackedPolyline) {
              trackedPolyline = L.polyline([[lat, lng]], { color: "#3082e3", weight: 5 }).addTo(map);
            } else {
              trackedPolyline.addLatLng([lat, lng]);
            }

            map.flyTo([lat, lng], 15);
          },
          (endedPayload) => {
            // cuando el emisor finaliza, cerramos la suscripción y avisamos
            stopFollowing();
           
            console.log("Recorrido finalizado por el emisor", endedPayload);
          }
        );
      } else {
        console.warn("[ViewSharedPathPage] faltan sharer_id o path_id en la ruta");
      }
    });

    onUnmounted(() => {
      if (unsubscribeShared) unsubscribeShared();
      // limpiar capas
      [trackedMarker, trackedPolyline].forEach((l) => {
        if (l && map) map.removeLayer(l);
      });
    });

    function stopFollowing() {
      if (unsubscribeShared) {
        unsubscribeShared();
        unsubscribeShared = null;
      } else {
        
        if (sharer_id && path_id) stopListeningSharedPath({ sharer_id, path_id });
      }
      
    }

    return {
      mapEl,
      stopFollowing,
    };
  },
};
</script>
