<script setup>
import { ref, onMounted } from "vue";
import L from "leaflet";
import {
  startListeningShareInvitations,
  acceptSharedPath,
  rejectSharedPath,
} from "../services/path-sharing";
import { subscribeToUserState } from "../services/auth";
import AppH1 from "../components/AppH1.vue";

import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon,
  iconRetinaUrl: icon2x,
  shadowUrl: shadow,
});

const mapEl = ref(null);
let map, sharedMarker, sharedPath;

const showInvitationModal = ref(false);
const incomingInvitation = ref(null);
const currentUser = ref(null);

onMounted(async () => {
  map = L.map(mapEl.value, { zoomControl: false }).setView([-34.6037, -58.3816], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  subscribeToUserState(async (user) => {
    currentUser.value = user;
    if (user?.id) {
      await startListeningShareInvitations();

      window.addEventListener("path-invitation", (e) => {
        incomingInvitation.value = e.detail;
        showInvitationModal.value = true;
      });

      window.addEventListener("coords-update", (e) => {
        const coords = e.detail;
        if (!coords?.lat || !coords?.lng) return;

        if (!sharedMarker) {
          sharedMarker = L.marker([coords.lat, coords.lng])
            .addTo(map)
            .bindPopup("Contacto");
        } else {
          sharedMarker.setLatLng([coords.lat, coords.lng]);
        }

        if (!sharedPath) {
          sharedPath = L.polyline([[coords.lat, coords.lng]], {
            color: "#f2826d",
            weight: 5,
          }).addTo(map);
        } else {
          sharedPath.addLatLng([coords.lat, coords.lng]);
        }

        map.setView([coords.lat, coords.lng], 15);
      });
    }
  });
});

function acceptInvitation() {
  if (!incomingInvitation.value) return;
  acceptSharedPath({
    sharer_id: incomingInvitation.value.sharer_id,
    path_id: incomingInvitation.value.path_id,
    invitationId: incomingInvitation.value.invitation_id,
  });
  showInvitationModal.value = false;
  incomingInvitation.value = null;
}

function rejectInvitation() {
  if (!incomingInvitation.value) return;
  rejectSharedPath(incomingInvitation.value.invitation_id);
  showInvitationModal.value = false;
  incomingInvitation.value = null;
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <AppH1>Recorridos Compartidos</AppH1>
    <div ref="mapEl" class="mt-4 rounded-xl border" style="height: 400px;"></div>

    <div
      v-if="showInvitationModal"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div class="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
        <h2 class="text-lg font-bold mb-4">Invitación de recorrido</h2>
        <p class="mb-4">
          Tu contacto está compartiendo un recorrido. ¿Deseas unirte?
        </p>
        <div class="flex justify-end gap-2">
          <button
            @click="rejectInvitation"
            class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Rechazar
          </button>
          <button
            @click="acceptInvitation"
            class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-700"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

