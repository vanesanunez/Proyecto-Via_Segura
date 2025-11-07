<script setup>
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
</style>

