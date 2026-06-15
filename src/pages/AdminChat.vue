<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import {
  fetchAllGlobalChatMessages,
  deleteGlobalChatMessage,
} from "../services/global-chat";
import { TrashIcon } from "@heroicons/vue/24/solid";

const router = useRouter();

const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");
const messages = ref([]);

const page = ref(1);
const pageSize = 4;

const isDeleteModalOpen = ref(false);
const isSuccessModalOpen = ref(false);
const messageToDelete = ref(null);
const deletingMessageId = ref(null);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(messages.value.length / pageSize)),
);

const paginatedMessages = computed(() => {
  const start = (page.value - 1) * pageSize;
  const end = start + pageSize;
  return messages.value.slice(start, end);
});

const visiblePages = computed(() => {
  if (totalPages.value <= 3) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  }

  if (page.value <= 2) return [1, 2, 3];

  if (page.value >= totalPages.value - 1) {
    return [totalPages.value - 2, totalPages.value - 1, totalPages.value];
  }

  return [page.value - 1, page.value, page.value + 1];
});

function goTo(p) {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
}

watch(
  () => messages.value.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value;
    }
  },
);

let successTimeout = null;

function showSuccessMessage(message) {
  successMessage.value = message;
  isSuccessModalOpen.value = true;

  if (successTimeout) {
    clearTimeout(successTimeout);
  }

  successTimeout = setTimeout(() => {
    closeSuccessModal();
  }, 2500);
}

function closeSuccessModal() {
  isSuccessModalOpen.value = false;
  successMessage.value = "";
}

function openDeleteModal(message) {
  messageToDelete.value = message;
  isDeleteModalOpen.value = true;
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false;
  messageToDelete.value = null;
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

async function confirmDeleteMessage() {
  if (!messageToDelete.value) return;

  deletingMessageId.value = messageToDelete.value.id;
  errorMessage.value = "";

  try {
    await deleteGlobalChatMessage(messageToDelete.value.id);
    await loadMessages();

    closeDeleteModal();
    showSuccessMessage("El mensaje se eliminó con éxito.");
  } catch (error) {
    console.error("[AdminChat] Error eliminando mensaje:", error);
    errorMessage.value = "No se pudo eliminar el mensaje.";
  } finally {
    deletingMessageId.value = null;
  }
}

onMounted(() => {
  loadMessages();
});
</script>

<template>
  <section class="min-h-screen overflow-x-hidden bg-white px-4 pt-4 pb-24">
    <div class="mx-auto w-full max-w-[390px]">
      <!-- volver -->
      <button
        type="button"
        @click="router.push('/admin/dashboard')"
        class="mb-6 inline-flex items-center gap-3 text-left transition group active:scale-95"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0E5EC] text-xl font-bold text-[#3082e3] shadow-[0_6px_16px_rgba(148,163,184,0.18)]"
        >
          ←
        </span>

        <span>
          <span class="block text-sm font-semibold text-slate-900">
            Volver al panel admin
          </span>
          <span class="block text-xs text-slate-500">
            Regresá a la vista principal del administrador
          </span>
        </span>
      </button>

      <!-- header -->
      <header class="mb-6">
        <section
          class="rounded-[26px] bg-[#3082e3] px-5 py-5 text-white shadow-[0_12px_28px_rgba(48,130,227,0.28)]"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white"
                >
                  Moderación de chat
                </span>
              </div>

              <h1 class="mt-3 text-[22px] font-bold leading-tight">
                Chat global
              </h1>

              <p class="mt-2 text-[15px] leading-[1.6] text-white/85">
                Revisá mensajes y moderá contenido.
              </p>
            </div>

            <div
              class="ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-[#3082e3] shadow-[0_8px_20px_rgba(15,23,42,0.12)]"
            >
              {{ messages.length }}
            </div>
          </div>
        </section>
      </header>

      <!-- success -->
      <div
        v-if="successMessage && !isSuccessModalOpen"
        class="mb-5 rounded-[20px] bg-[#eef4ff] px-4 py-3 text-sm font-medium text-[#3082e3] shadow-[0_8px_18px_rgba(148,163,184,0.15)]"
      >
        {{ successMessage }}
      </div>

      <!-- error -->
      <div
        v-if="errorMessage"
        class="mb-5 rounded-[20px] bg-[#fff1ed] px-4 py-3 text-sm font-medium text-[#e67661] shadow-[0_8px_18px_rgba(148,163,184,0.15)]"
      >
        {{ errorMessage }}
      </div>

      <!-- loading -->
      <div
        v-if="loading"
        class="rounded-[24px] bg-[#E0E5EC] px-4 py-5 text-slate-600 shadow-[0_10px_24px_rgba(148,163,184,0.18)]"
      >
        Cargando mensajes...
      </div>

      <template v-else>
        <!-- empty -->
        <div
          v-if="messages.length === 0"
          class="rounded-[24px] bg-[#E0E5EC] px-4 py-5 text-slate-600 shadow-[0_10px_24px_rgba(148,163,184,0.18)]"
        >
          Todavía no hay mensajes en el chat.
        </div>

        <template v-else>
          <!-- lista -->
          <div class="space-y-4">
            <article
              v-for="message in paginatedMessages"
              :key="message.id"
              class="w-full overflow-hidden rounded-[24px] bg-[#E0E5EC] px-4 py-4 shadow-[0_10px_24px_rgba(148,163,184,0.18)]"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      class="rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#3082e3]"
                    >
                      Chat global
                    </span>
                  </div>

                  <h3
                    class="mt-3 break-words text-[16px] font-bold leading-snug text-slate-900"
                  >
                    {{ message.email || "Sin email" }}
                  </h3>

                  <p class="mt-1 text-xs text-slate-500">
                    {{ new Date(message.created_at).toLocaleString() }}
                  </p>
                </div>

                <button
                  type="button"
                  @click="openDeleteModal(message)"
                  title="Eliminar mensaje"
                  aria-label="Eliminar mensaje"
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-[#e67661] shadow-[0_6px_16px_rgba(148,163,184,0.18)] transition hover:-translate-y-0.5 hover:bg-red-50 active:scale-95"
                >
                  <TrashIcon class="h-5 w-5" />
                </button>
              </div>

              <div class="mt-4 border-t border-white/60 pt-4">
                <p class="break-words text-sm leading-7 text-slate-700">
                  {{ message.body }}
                </p>
              </div>
            </article>
          </div>

          <!-- paginado -->
          <nav
            v-if="totalPages > 1"
            class="mt-6 flex items-center justify-center gap-2"
          >
            <button
              @click="goTo(page - 1)"
              :disabled="page === 1"
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0E5EC] text-lg shadow-[0_6px_16px_rgba(148,163,184,0.18)] transition"
              :class="
                page === 1
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-700 hover:text-[#3082e3] active:scale-[0.97]'
              "
            >
              ‹
            </button>

            <button
              v-for="p in visiblePages"
              :key="p"
              @click="goTo(p)"
              class="flex h-10 min-w-[40px] items-center justify-center rounded-xl px-3 text-sm font-semibold transition"
              :class="
                p === page
                  ? 'bg-[#3082e3] text-white shadow-sm'
                  : 'bg-[#E0E5EC] text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.18)] hover:text-[#3082e3] active:scale-[0.97]'
              "
            >
              {{ p }}
            </button>

            <button
              @click="goTo(page + 1)"
              :disabled="page === totalPages"
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0E5EC] text-lg shadow-[0_6px_16px_rgba(148,163,184,0.18)] transition"
              :class="
                page === totalPages
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-700 hover:text-[#3082e3] active:scale-[0.97]'
              "
            >
              ›
            </button>
          </nav>
        </template>
      </template>
    </div>

    <!-- modal eliminar -->
    <div
      v-if="isDeleteModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
    >
      <div
        class="w-full max-w-sm rounded-[28px] bg-[#E0E5EC] p-6 shadow-[-10px_-10px_20px_rgba(255,255,255,0.9),10px_10px_20px_rgba(163,177,198,0.38)]"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-[#e67661] shadow-[0_6px_16px_rgba(148,163,184,0.18)]"
          >
            <TrashIcon class="h-6 w-6" />
          </div>

          <div class="min-w-0 flex-1">
            <h3 class="text-xl font-bold text-slate-900">Eliminar mensaje</h3>

            <p class="mt-2 text-sm leading-6 text-slate-500">
              ¿Seguro que querés eliminar este mensaje del chat? Esta acción no se puede deshacer.
            </p>

            <div
              v-if="messageToDelete"
              class="mt-4 rounded-2xl bg-white/60 px-4 py-3 text-sm text-slate-600"
            >
              <p class="break-words">
                <span class="font-semibold text-slate-800">Usuario:</span>
                {{ messageToDelete.email || "Sin email" }}
              </p>
              <p class="mt-2 break-words">
                <span class="font-semibold text-slate-800">Mensaje:</span>
                {{ messageToDelete.body }}
              </p>
            </div>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            type="button"
            @click="closeDeleteModal"
            class="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="confirmDeleteMessage"
            :disabled="deletingMessageId === messageToDelete?.id"
            class="flex-1 rounded-xl bg-[#f2826d] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
          >
            {{
              deletingMessageId === messageToDelete?.id
                ? "Eliminando..."
                : "Sí, eliminar"
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- modal éxito -->
    <div
      v-if="isSuccessModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-4 backdrop-blur-[2px]"
    >
      <div
        class="w-full max-w-sm rounded-[28px] bg-[#E0E5EC] p-6 text-center shadow-[-10px_-10px_20px_rgba(255,255,255,0.9),10px_10px_20px_rgba(163,177,198,0.38)]"
      >
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3] shadow-[0_6px_16px_rgba(148,163,184,0.18)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="h-8 w-8"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h3 class="mt-4 text-xl font-bold text-slate-900">Acción realizada</h3>

        <p class="mt-2 text-sm leading-6 text-slate-500">
          {{ successMessage }}
        </p>

        <button
          type="button"
          @click="closeSuccessModal"
          class="mt-5 w-full rounded-xl bg-[#3082e3] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 active:scale-[0.98]"
        >
          Entendido
        </button>
      </div>
    </div>
  </section>
</template>