<script setup>
import { ref, onMounted } from "vue";
import {
  fetchAllGlobalChatMessages,
  deleteGlobalChatMessage,
} from "../services/global-chat";
import { useRouter } from "vue-router";
const router = useRouter();

const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");
const messages = ref([]);

let successTimeout = null;

function showSuccessMessage(message) {
  successMessage.value = message;

  if (successTimeout) {
    clearTimeout(successTimeout);
  }

  successTimeout = setTimeout(() => {
    successMessage.value = "";
  }, 3000);
}

async function loadMessages() {
  loading.value = true;
  errorMessage.value = "";

  try {
    messages.value = await fetchAllGlobalChatMessages();
  } catch (error) {
    console.error("[AdminChat] Error cargando mensajes:", error);
    errorMessage.value = "No se pudieron cargar los mensajes del chat.";
  } finally {
    loading.value = false;
  }
}

async function handleDeleteMessage(messageId) {
  const confirmed = window.confirm(
    "¿Seguro que querés eliminar este mensaje del chat?",
  );

  if (!confirmed) return;

  try {
    await deleteGlobalChatMessage(messageId);
    await loadMessages();
    showSuccessMessage("Mensaje eliminado con éxito.");
  } catch (error) {
    console.error("[AdminChat] Error eliminando mensaje:", error);
    errorMessage.value = "No se pudo eliminar el mensaje.";
  }
}

onMounted(() => {
  loadMessages();
});
</script>

<template>
  <section class="min-h-screen bg-slate-50 p-6">
    <div class="mx-auto max-w-6xl">
     <button
        type="button"
        @click="router.push('/admin/dashboard')"
        class="mb-6 inline-flex items-center gap-3 text-left transition group active:scale-95"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-[#3082e3] transition group-hover:bg-[#3082e3] group-hover:text-white group-active:bg-[#3082e3] group-active:text-white"
        >
          ←
        </span>

        <span>
          <span
            class="block text-sm font-semibold text-slate-900 transition group-hover:text-[#3082e3] group-active:text-[#3082e3]"
          >
            Volver al panel admin
          </span>
          <span class="block text-xs text-slate-500">
            Regresá a la vista principal del administrador
          </span>
        </span>
      </button>
      <header class="mb-8">
        <h1 class="text-2xl font-bold text-slate-800 sm:text-3xl">
          Moderación de chat
        </h1>
        <p class="mt-2 text-sm text-slate-600 sm:text-base">
          Desde acá vas a poder revisar y moderar los mensajes del chat global.
        </p>
      </header>

      <div
        v-if="successMessage"
        class="fixed top-20 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 shadow-lg"
      >
        <p class="text-sm font-medium">{{ successMessage }}</p>
      </div>

      <div v-if="loading" class="rounded-2xl bg-white p-6 shadow-sm">
        <p class="text-slate-600">Cargando mensajes...</p>
      </div>

      <template v-else>
        <div
          v-if="errorMessage"
          class="mb-6 rounded-2xl bg-white p-6 shadow-sm"
        >
          <p class="text-red-600">{{ errorMessage }}</p>
        </div>

        <section class="rounded-2xl bg-white p-6 shadow-sm">
          <div class="mb-4">
            <h2 class="text-xl font-semibold text-slate-800">
              Mensajes del chat global
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              Podés revisar el contenido y eliminar mensajes si hace falta.
            </p>
          </div>

          <div v-if="messages.length === 0" class="py-4">
            <p class="text-slate-600">Todavía no hay mensajes en el chat.</p>
          </div>

          <div v-else>
            <!-- Mobile -->
            <div class="space-y-4 md:hidden">
              <article
                v-for="message in messages"
                :key="message.id"
                class="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-semibold text-slate-800 break-all">
                      {{ message.email || "Sin email" }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      {{ new Date(message.created_at).toLocaleString() }}
                    </p>
                  </div>
                </div>

                <div class="mt-3">
                  <p class="text-sm text-slate-700 break-words">
                    {{ message.body }}
                  </p>
                </div>

                <div class="mt-4">
                  <button
                    type="button"
                    @click="handleDeleteMessage(message.id)"
                    class="w-full rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    Eliminar mensaje
                  </button>
                </div>
              </article>
            </div>

            <!-- Desktop -->
            <div class="hidden overflow-x-auto md:block">
              <table class="min-w-full border-collapse">
                <thead>
                  <tr class="border-b border-slate-200 text-left">
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Usuario
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Mensaje
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Fecha
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="message in messages"
                    :key="message.id"
                    class="border-b border-slate-100"
                  >
                    <td class="px-3 py-3 text-sm text-slate-700 break-all">
                      {{ message.email || "Sin email" }}
                    </td>

                    <td class="px-3 py-3 text-sm text-slate-700 break-words">
                      {{ message.body }}
                    </td>

                    <td class="px-3 py-3 text-sm text-slate-700">
                      {{ new Date(message.created_at).toLocaleString() }}
                    </td>

                    <td class="px-3 py-3">
                      <button
                        type="button"
                        @click="handleDeleteMessage(message.id)"
                        class="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>
