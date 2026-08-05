<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";

import {
  fetchAllGlobalChatMessages,
  deleteGlobalChatMessage,
} from "../services/global-chat";

import {
  ChatBubbleLeftRightIcon,
  TrashIcon,
  UsersIcon,
  ShieldCheckIcon,
} from "@heroicons/vue/24/solid";

const router = useRouter();

// Datos principales
const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");
const messages = ref([]);

// Paginación: tres mensajes por página
const page = ref(1);
const pageSize = 3;

// Modales
const isDeleteModalOpen = ref(false);
const isSuccessModalOpen = ref(false);
const messageToDelete = ref(null);
const deletingMessageId = ref(null);

// Cantidad de participantes distintos
const participantCount = computed(() => {
  const emails = messages.value.map((message) => message.email).filter(Boolean);

  return new Set(emails).size;
});

// Cantidad total de páginas
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(messages.value.length / pageSize));
});

// Mensajes que corresponden a la página actual
const paginatedMessages = computed(() => {
  const start = (page.value - 1) * pageSize;
  const end = start + pageSize;

  return messages.value.slice(start, end);
});

// Páginas visibles en el paginado
const visiblePages = computed(() => {
  if (totalPages.value <= 3) {
    return Array.from({ length: totalPages.value }, (_, index) => index + 1);
  }

  if (page.value <= 2) {
    return [1, 2, 3];
  }

  if (page.value >= totalPages.value - 1) {
    return [totalPages.value - 2, totalPages.value - 1, totalPages.value];
  }

  return [page.value - 1, page.value, page.value + 1];
});

function goTo(newPage) {
  if (newPage < 1 || newPage > totalPages.value) return;

  page.value = newPage;
}

// Evita quedar en una página que ya no existe después de borrar
watch(
  () => messages.value.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value;
    }
  },
);

function messageInitial(email) {
  return email?.trim()?.charAt(0)?.toUpperCase() || "U";
}

function formatMessageDate(date) {
  if (!date) return "Fecha no disponible";

  return new Date(date).toLocaleString();
}

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

// Obtener los mensajes
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

// Eliminar un mensaje
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
  <section
    class="min-h-dvh overflow-x-hidden bg-[#F7F9F6] px-4 pb-12 pt-5"
  >
    <div class="mx-auto w-full max-w-3xl">
      <!-- Volver -->
      <button
        type="button"
        @click="router.push('/admin/dashboard')"
        class="group mb-5 inline-flex items-center gap-2 rounded-full border border-[#D6E8FB] bg-[#EEF4FF] px-3 py-2 text-sm font-semibold text-[#3082E3] transition hover:border-[#3082E3] hover:bg-white active:scale-[0.98]"
      >
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-sm transition group-hover:bg-[#3082E3] group-hover:text-white"
        >
          ←
        </span>

        <span>Volver al panel admin</span>
      </button>

      <!-- Encabezado -->
      <header
        class="rounded-[28px] border border-[#D6E8FB] bg-[#EEF4FF] p-5 shadow-[0_12px_28px_rgba(48,130,227,0.08)] sm:p-6"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div
              class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#3082E3]"
            >
              <ShieldCheckIcon class="h-4 w-4" />
              <span>Moderación de chat</span>
            </div>

            <h1
              class="mt-4 text-[28px] font-bold leading-tight text-slate-900 sm:text-[34px]"
            >
              Chat global
            </h1>
          </div>

          <div
            class="flex h-14 min-w-14 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-[#3082E3] shadow-[0_8px_20px_rgba(48,130,227,0.10)]"
          >
            {{ messages.length }}
          </div>
        </div>

        <p class="mt-3 w-full text-sm leading-6 text-slate-600 sm:text-base">
          Revisá los mensajes de la comunidad y eliminá contenido cuando sea
          necesario.
        </p>
      </header>

      <!-- Resumen -->
      <section class="mt-5 grid grid-cols-2 gap-3">
        <article
          class="rounded-[20px] border border-[#D6E8FB] bg-white p-4 shadow-[0_8px_20px_rgba(48,130,227,0.06)]"
        >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF4FF] text-[#3082E3]"
          >
            <ChatBubbleLeftRightIcon class="h-5 w-5" />
          </div>

          <p class="mt-3 text-xs font-semibold text-slate-500">Mensajes</p>

          <p class="mt-1 text-2xl font-bold text-[#3082E3]">
            {{ messages.length }}
          </p>
        </article>

        <article
          class="rounded-[20px] border border-[#F7CBC2] bg-white p-4 shadow-[0_8px_20px_rgba(242,130,109,0.06)]"
        >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF1ED] text-[#F2826D]"
          >
            <UsersIcon class="h-5 w-5" />
          </div>

          <p class="mt-3 text-xs font-semibold text-slate-500">Participantes</p>

          <p class="mt-1 text-2xl font-bold text-[#F2826D]">
            {{ participantCount }}
          </p>
        </article>
      </section>

      <!-- Error -->
      <div
        v-if="errorMessage"
        class="mt-5 flex items-start gap-3 rounded-[20px] border border-[#F7CBC2] bg-[#FFF1ED] px-4 py-3 text-[#D96854]"
      >
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-bold"
        >
          !
        </span>

        <p class="pt-1 text-sm font-medium">
          {{ errorMessage }}
        </p>
      </div>

      <!-- ESTADO 1: cargando -->
      <div
        v-if="loading"
        class="mt-5 rounded-3xl border border-[#D6E8FB] bg-white p-6 shadow-[0_10px_26px_rgba(48,130,227,0.07)]"
      >
        <div class="flex items-center gap-3">
          <div
            class="h-6 w-6 animate-spin rounded-full border-2 border-[#D6E8FB] border-t-[#3082E3]"
          ></div>

          <p class="text-sm font-medium text-slate-600">Cargando mensajes...</p>
        </div>
      </div>

      <!-- ESTADO 2: no hay mensajes -->
      <div
        v-else-if="messages.length === 0"
        class="mt-5 rounded-3xl border border-[#D6E8FB] bg-white px-5 py-10 text-center shadow-[0_10px_26px_rgba(48,130,227,0.07)]"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF4FF] text-[#3082E3]"
        >
          <ChatBubbleLeftRightIcon class="h-7 w-7" />
        </div>

        <p class="mt-4 font-bold text-slate-900">Todavía no hay mensajes</p>

        <p class="mt-1 text-sm leading-6 text-slate-500">
          Las nuevas conversaciones del chat global aparecerán acá.
        </p>
      </div>

      <!-- ESTADO 3: hay mensajes -->
      <div v-else>
        <div class="mb-4 mt-7">
          <h2 class="text-[20px] font-bold text-slate-900">
            Mensajes de la comunidad
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            Se muestran tres mensajes por página.
          </p>
        </div>

        <!-- Listado -->
        <div class="grid gap-4 md:grid-cols-2">
          <article
            v-for="message in paginatedMessages"
            :key="message.id"
            class="flex h-full flex-col rounded-3xl border border-[#D6E8FB] bg-white p-4 shadow-[0_10px_24px_rgba(48,130,227,0.07)]"
          >
            <!-- Usuario -->
            <div class="flex items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-sm font-bold text-[#3082E3]"
              >
                {{ messageInitial(message.email) }}
              </div>

              <div class="min-w-0 flex-1">
                <span
                  class="inline-flex rounded-full border border-[#D6E8FB] bg-[#EEF4FF] px-3 py-1 text-[10px] font-semibold text-[#3082E3]"
                >
                  Chat global
                </span>

                <h3
                  class="mt-2 break-all text-[16px] font-bold leading-snug text-slate-900"
                >
                  {{ message.email || "Usuario sin email" }}
                </h3>

                <p class="mt-1 text-xs leading-5 text-slate-500">
                  {{ formatMessageDate(message.created_at) }}
                </p>
              </div>
            </div>

            <!-- Mensaje -->
            <div
              class="mt-4 flex-1 rounded-[18px] border border-[#E6EDF7] bg-[#F9FBFD] p-4"
            >
              <p
                class="text-[11px] font-bold uppercase tracking-wide text-slate-400"
              >
                Mensaje
              </p>

              <p class="mt-2 wrap-break-word text-sm leading-6 text-slate-700">
                {{ message.body || "Mensaje sin contenido" }}
              </p>
            </div>

            <!-- Acción -->
            <button
              type="button"
              @click="openDeleteModal(message)"
              class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#F7CBC2] bg-[#FFF1ED] px-4 py-3 text-sm font-semibold text-[#D96854] transition hover:border-[#F2826D] hover:bg-white active:scale-[0.98]"
            >
              <TrashIcon class="h-5 w-5" />
              <span>Eliminar mensaje</span>
            </button>
          </article>
        </div>

        <!-- Paginación -->
        <nav
          v-if="totalPages > 1"
          class="mt-6 flex items-center justify-center gap-2"
          aria-label="Paginación de mensajes"
        >
          <button
            type="button"
            @click="goTo(page - 1)"
            :disabled="page === 1"
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6E8FB] bg-white text-lg transition"
            :class="
              page === 1
                ? 'cursor-not-allowed text-slate-300'
                : 'text-slate-700 hover:border-[#3082E3] hover:text-[#3082E3] active:scale-[0.97]'
            "
          >
            ‹
          </button>

          <button
            v-for="pageNumber in visiblePages"
            :key="pageNumber"
            type="button"
            @click="goTo(pageNumber)"
            class="flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition"
            :class="
              pageNumber === page
                ? 'bg-[#3082E3] text-white shadow-[0_6px_14px_rgba(48,130,227,0.22)]'
                : 'border border-[#D6E8FB] bg-white text-slate-700 hover:border-[#3082E3] hover:text-[#3082E3] active:scale-[0.97]'
            "
          >
            {{ pageNumber }}
          </button>

          <button
            type="button"
            @click="goTo(page + 1)"
            :disabled="page === totalPages"
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6E8FB] bg-white text-lg transition"
            :class="
              page === totalPages
                ? 'cursor-not-allowed text-slate-300'
                : 'text-slate-700 hover:border-[#3082E3] hover:text-[#3082E3] active:scale-[0.97]'
            "
          >
            ›
          </button>
        </nav>
      </div>
    </div>

    <!-- Modal para eliminar -->
    <div
      v-if="isDeleteModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]"
      @click.self="closeDeleteModal"
    >
      <div
        class="w-full max-w-sm rounded-[28px] border border-[#F7CBC2] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.20)]"
      >
        <div
          class="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF1ED] text-[#D96854]"
        >
          <TrashIcon class="h-6 w-6" />
        </div>

        <h3 class="mt-5 text-xl font-bold text-slate-900">Eliminar mensaje</h3>

        <p class="mt-2 text-sm leading-6 text-slate-500">
          Esta acción eliminará el mensaje definitivamente y no se puede
          deshacer.
        </p>

        <div
          v-if="messageToDelete"
          class="mt-4 rounded-[18px] border border-[#E6EDF7] bg-[#F9FBFD] p-4"
        >
          <p
            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            Mensaje seleccionado
          </p>

          <p class="mt-2 break-all text-sm font-bold text-slate-800">
            {{ messageToDelete.email || "Usuario sin email" }}
          </p>

          <p class="mt-2 wrap-break-word text-sm leading-6 text-slate-600">
            {{ messageToDelete.body }}
          </p>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="closeDeleteModal"
            class="rounded-2xl border border-[#D6E8FB] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#EEF4FF] active:scale-[0.98]"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="confirmDeleteMessage"
            :disabled="deletingMessageId === messageToDelete?.id"
            class="rounded-2xl bg-[#F2826D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#E67661] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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

    <!-- Modal de éxito -->
    <div
      v-if="isSuccessModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
      @click.self="closeSuccessModal"
    >
      <div
        class="w-full max-w-sm rounded-[28px] border border-[#D6E8FB] bg-white p-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
      >
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF4FF] text-[#3082E3]"
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
          class="mt-5 w-full rounded-2xl bg-[#3082E3] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#085BAF] active:scale-[0.98]"
        >
          Entendido
        </button>
      </div>
    </div>
  </section>
</template>
