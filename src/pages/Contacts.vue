<!-- <script setup>
import { ref, onMounted, computed } from 'vue';
import { getAllUsers, getTrustedContacts, addTrustedContact, removeTrustedContact } from '../services/contacts';
import supabase from '../services/supabase';
import MainLoader from '../components/MainLoader.vue';
import AppH1 from '../components/AppH1.vue';
import BottomNavigation from '../components/BottomNavigation.vue';

const loading = ref(true);
const allUsers = ref([]);
const trustedContacts = ref([]);
const filter = ref('');
const user = ref(null);

onMounted(async () => {
  try {
    // Obtener usuario actual (supabase.auth.getUser)
    const res = await supabase.auth.getUser();
    // new supabase client returns: { data: { user } }
    user.value = res?.data?.user || null;
    if (!user.value) {
      // si no está logueado, redirigir:
      loading.value = false;
      return;
    }

    await loadData();
  } catch (e) {
    console.error('[Contacts.vue onMounted] ', e);
  } finally {
    loading.value = false;
  }
});

async function loadData() {
  try {
    const [users, contacts] = await Promise.all([
      getAllUsers(),
      getTrustedContacts(user.value.id),
    ]);

    // Todos los usuarios menos el que está logueado
    allUsers.value = users.filter(u => u.id !== user.value.id);
    trustedContacts.value = contacts || [];
  } catch (e) {
    console.error('[Contacts.vue loadData] ', e);
  }
}

const filteredUsers = computed(() => {
  const q = filter.value.trim().toLowerCase();
  const trustedIds = new Set(trustedContacts.value.map(c => c.id));

  return allUsers.value
    .filter(u => !trustedIds.has(u.id))
    .filter(u => {
      if (!q) return true;

      // concateno name + lastname para buscar por cualquiera de los dos
      const fullName = `${u.name || ''} ${u.lastname || ''}`.toLowerCase();

      return fullName.includes(q);
    });
});

function isTrusted(userId) {
  return trustedContacts.value.some(c => c.id === userId);
}

async function toggleTrust(contactId) {
  try {
    const existing = trustedContacts.value.find(c => c.id === contactId);
    if (existing) {
      // eliminar por relation id
      await removeTrustedContact(existing.trusted_contact_id);
    } else {
      await addTrustedContact(user.value.id, contactId);
    }
    await loadData();
  } catch (e) {
    console.error('[Contacts.vue toggleTrust] ', e);
  }
}

async function removeContact(relationId) {
  try {
    if (!relationId) return;
    await removeTrustedContact(relationId);
    await loadData();
  } catch (e) {
    console.error('[Contacts.vue removeContact] ', e);
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <AppH1>Contactos</AppH1>

    <div class="mb-4">
      <input v-model="filter" placeholder="Buscar por nombre o apellido..." class="w-full border rounded px-3 py-2" />
    </div>

    <div v-if="loading" class="text-gray-500 text-center py-6">
      <div class="flex justify-center items-center h-full">
        <MainLoader />
      </div>
      Cargando contactos...

    </div>


    <div v-else>
      <div v-if="trustedContacts.length" class="mb-6">
        <h2 class="text-lg font-medium mb-2">Tus contactos de confianza</h2>
        <div v-for="c in trustedContacts" :key="c.id"
          class="flex items-center justify-between bg-blue-50 p-3 rounded-xl shadow-sm border border-blue-100 mb-2">
          <div class="flex items-center gap-3">
            <div>
              <div class="font-medium">{{ c.name }}, {{ c.lastname }}</div>

            </div>
          </div>
          <button @click="removeContact(c.trusted_contact_id)"
            class="px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200">
            Eliminar
          </button>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-medium mb-2">Agregar nuevo contacto</h2>
        <div v-if="filteredUsers.length === 0" class="text-gray-500">No hay usuarios disponibles.</div>
        <div v-for="u in filteredUsers" :key="u.id"
          class="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-2">
          <div class="flex items-center gap-3">
            <div>
              <div class="font-medium">{{ u.name }}, {{ u.lastname }}</div>
              <div class="text-sm text-gray-500">{{ u.email }}</div>
            </div>
          </div>

          <button @click="toggleTrust(u.id)" class="px-3 py-1.5 rounded-full text-sm font-medium transition"
            :class="isTrusted(u.id) ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'">
            {{ isTrusted(u.id) ? 'Eliminar' : 'Agregar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <BottomNavigation />
</template>


<style scoped>
input::placeholder {
  color: #9aa3a8;
}
</style> -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { getAllUsers, getTrustedContacts, addTrustedContact, removeTrustedContact } from '../services/contacts';
import supabase from '../services/supabase';
import MainLoader from '../components/MainLoader.vue';
import BottomNavigation from '../components/BottomNavigation.vue';

const loading = ref(true);
const allUsers = ref([]);
const trustedContacts = ref([]);
const filter = ref('');
const user = ref(null);

// ── Acordeón "Agregar nuevo contacto" ─────────────────────────────────────
const addSectionOpen = ref(false);

// ── Modal de confirmación al elegir un contacto ───────────────────────────
const pendingAdd = ref(null); // usuario que se está por agregar
const addingId = ref(null); // id en proceso de guardado (loading en el botón)

// ── Modal de confirmación al quitar un contacto ───────────────────────────
const pendingRemove = ref(null);
const removingId = ref(null);

// ── Toast de éxito con micro-animación ────────────────────────────────────
const toastMessage = ref('');
let toastTimeout = null;

function showToast(message) {
  toastMessage.value = message;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMessage.value = '';
  }, 2600);
}

onMounted(async () => {
  try {
    const res = await supabase.auth.getUser();
    user.value = res?.data?.user || null;
    if (!user.value) {
      loading.value = false;
      return;
    }

    await loadData();
  } catch (e) {
    console.error('[Contacts.vue onMounted] ', e);
  } finally {
    loading.value = false;
  }
});

async function loadData() {
  try {
    const [users, contacts] = await Promise.all([
      getAllUsers(),
      getTrustedContacts(user.value.id),
    ]);

    allUsers.value = users.filter((u) => u.id !== user.value.id);
    trustedContacts.value = contacts || [];
  } catch (e) {
    console.error('[Contacts.vue loadData] ', e);
  }
}

const filteredUsers = computed(() => {
  const q = filter.value.trim().toLowerCase();
  const trustedIds = new Set(trustedContacts.value.map((c) => c.id));

  return allUsers.value
    .filter((u) => !trustedIds.has(u.id))
    .filter((u) => {
      if (!q) return true;
      const fullName = `${u.name || ''} ${u.lastname || ''}`.toLowerCase();
      return fullName.includes(q);
    });
});

function initials(u) {
  return ((u.name?.[0] || '') + (u.lastname?.[0] || '')).toUpperCase() || 'U';
}

// Si el usuario busca algo, abrimos el acordeón solo automáticamente
function onSearchInput() {
  if (filter.value.trim().length > 0) addSectionOpen.value = true;
}

// ── Agregar contacto (con confirmación) ───────────────────────────────────
function askAddContact(u) {
  pendingAdd.value = u;
}

function cancelAddContact() {
  pendingAdd.value = null;
}

async function confirmAddContact() {
  if (!pendingAdd.value) return;

  addingId.value = pendingAdd.value.id;

  try {
    await addTrustedContact(user.value.id, pendingAdd.value.id);
    const addedName = pendingAdd.value.name;
    await loadData();
    pendingAdd.value = null;
    showToast(`${addedName} se agregó a tus contactos de confianza`);
  } catch (e) {
    console.error('[Contacts.vue confirmAddContact] ', e);
  } finally {
    addingId.value = null;
  }
}

// ── Quitar contacto (con confirmación) ────────────────────────────────────
function askRemoveContact(c) {
  pendingRemove.value = c;
}

function cancelRemoveContact() {
  pendingRemove.value = null;
}

async function confirmRemoveContact() {
  if (!pendingRemove.value) return;

  removingId.value = pendingRemove.value.trusted_contact_id;

  try {
    await removeTrustedContact(pendingRemove.value.trusted_contact_id);
    pendingRemove.value = null;
    await loadData();
  } catch (e) {
    console.error('[Contacts.vue confirmRemoveContact] ', e);
  } finally {
    removingId.value = null;
  }
}
</script>

<template>
  <div class="mt-4 min-h-screen bg-white pb-28" style="color:#2a2a2a;">
    <!-- HEADER -->
    <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      <button
        @click="$router.back()"
        class="flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200 shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#2a2a2a" stroke-width="2.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="min-w-0">
        <h1 class="text-base font-semibold leading-tight">Contactos de confianza</h1>
        <p class="text-xs" style="color:#6b7280;">Van a poder seguir tus recorridos compartidos</p>
      </div>
    </div>

    <div class="mx-auto w-full max-w-md px-4">
      <!-- Toast de éxito -->
      <transition name="toast-pop">
        <div
          v-if="toastMessage"
          class="mt-4 flex items-center gap-3 rounded-2xl bg-[#eef4ff] border border-[#d6e8fb] px-4 py-3"
        >
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3082e3] text-white toast-check">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </span>
          <p class="text-sm font-semibold text-[#3082e3]">{{ toastMessage }}</p>
        </div>
      </transition>

      <div v-if="loading" class="flex flex-col items-center justify-center gap-3 py-16">
        <MainLoader />
        <p class="text-sm text-slate-500">Cargando contactos...</p>
      </div>

      <template v-else>
        <!-- BUSCADOR -->
        <div class="relative mt-5">
          <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            v-model="filter"
            @input="onSearchInput"
            placeholder="Buscar por nombre o apellido..."
            class="w-full rounded-xl pl-9 pr-4 py-3 text-sm bg-white border border-gray-100 shadow-[0_8px_20px_rgba(15,23,42,0.08)] focus:outline-none focus:ring-2 focus:ring-[#3082e3]/25"
          />
        </div>

        <!-- ══════════ Mis contactos de confianza ══════════ -->
        <section class="mt-6">
          <div class="flex items-center justify-between">
            <h2 class="text-[15px] font-bold text-[#2a2a2a]">Tus contactos</h2>
            <span
              v-if="trustedContacts.length"
              class="rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#3082e3]"
            >
              {{ trustedContacts.length }}
            </span>
          </div>

          <!-- Estado vacío -->
          <div
            v-if="!trustedContacts.length"
            class="mt-3 rounded-[22px] border border-dashed border-[#d6e8fb] bg-[#f7f9fc] px-5 py-8 text-center"
          >
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 8a3 3 0 10-2.83-4H15a3 3 0 000 6h.17A3 3 0 1018 8zM6 8a3 3 0 100 6 3 3 0 000-6zm0 8c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4zm12 0c-.62 0-1.21.14-1.74.38A5.99 5.99 0 0118 20h4c0-2.21-1.79-4-4-4z" />
              </svg>
            </div>
            <p class="mt-3 text-sm font-semibold text-slate-700">Todavía no tenés contactos</p>
            <p class="mt-1 text-xs text-slate-500">Agregá a alguien de confianza para compartir tus recorridos</p>
          </div>

          <!-- Lista -->
          <TransitionGroup v-else tag="div" name="contact-list" class="mt-3 space-y-2.5">
            <div
              v-for="c in trustedContacts"
              :key="c.id"
              class="flex items-center gap-3 rounded-2xl border border-[#e4ebf4] bg-white px-3.5 py-3 shadow-[0_6px_16px_rgba(148,163,184,0.10)] transition hover:border-[#c7daf7]"
            >
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3] font-bold">
                {{ initials(c) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-slate-900 truncate">{{ c.name }} {{ c.lastname }}</p>
                <p class="text-[11px] text-slate-500">Contacto de confianza</p>
              </div>
              <button
                @click="askRemoveContact(c)"
                :disabled="removingId === c.trusted_contact_id"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-[#f2826d] transition hover:bg-red-50 active:scale-90 disabled:opacity-50"
                aria-label="Quitar contacto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </TransitionGroup>
        </section>

        <!-- ══════════ Agregar nuevo contacto (acordeón) ══════════ -->
        <section class="mt-6">
          <button
            type="button"
            @click="addSectionOpen = !addSectionOpen"
            class="flex w-full items-center justify-between rounded-2xl border border-[#d6e8fb] bg-[#eef4ff] px-4 py-3.5 transition active:scale-[0.99]"
          >
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#3082e3] shadow-[0_4px_12px_rgba(48,130,227,0.16)]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </span>
              <span class="text-sm font-semibold text-[#3082e3]">Agregar nuevo contacto</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-[#3082e3] transition-transform duration-300"
              :class="addSectionOpen ? 'rotate-180' : ''"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <transition name="accordion">
            <div v-if="addSectionOpen" class="overflow-hidden">
              <div class="mt-3">
                <div v-if="filteredUsers.length === 0" class="rounded-2xl bg-[#f7f9fc] px-4 py-6 text-center text-sm text-slate-500">
                  No hay usuarios disponibles para agregar.
                </div>

                <TransitionGroup v-else tag="div" name="contact-list" class="max-h-80 space-y-2 overflow-y-auto pr-1">
                  <button
                    v-for="u in filteredUsers"
                    :key="u.id"
                    type="button"
                    @click="askAddContact(u)"
                    class="flex w-full items-center gap-3 rounded-2xl border border-[#e4ebf4] bg-white px-3.5 py-3 text-left transition hover:border-[#c7daf7] hover:bg-[#f9fbff] active:scale-[0.98]"
                  >
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f7f9fc] text-slate-500 font-bold">
                      {{ initials(u) }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-slate-900 truncate">{{ u.name }} {{ u.lastname }}</p>
                      <p class="text-[11px] text-slate-500 truncate">{{ u.email }}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </TransitionGroup>
              </div>
            </div>
          </transition>
        </section>
      </template>
    </div>

    <!-- ══════════ MODAL: confirmar agregar contacto ══════════ -->
    <div v-if="pendingAdd" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div class="w-full max-w-sm rounded-[26px] bg-white p-6 shadow-[0_22px_48px_rgba(15,23,42,0.22)] modal-pop">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef4ff] text-[#3082e3] text-xl font-bold">
          {{ initials(pendingAdd) }}
        </div>
        <h3 class="mt-4 text-center text-[18px] font-bold text-slate-900">
          ¿Agregar a {{ pendingAdd.name }} {{ pendingAdd.lastname }}?
        </h3>
        <p class="mt-2 text-center text-sm leading-6 text-slate-500">
          Va a poder ver tu ubicación en tiempo real cuando compartas un recorrido.
        </p>

        <div class="mt-6 space-y-3">
          <button
            type="button"
            @click="confirmAddContact"
            :disabled="addingId === pendingAdd.id"
            class="w-full rounded-2xl bg-[#3082e3] py-3 text-sm font-semibold text-white transition hover:bg-[#085baf] active:scale-[0.98] disabled:opacity-60"
          >
            {{ addingId === pendingAdd.id ? "Agregando..." : "Confirmar" }}
          </button>
          <button
            type="button"
            @click="cancelAddContact"
            :disabled="addingId === pendingAdd.id"
            class="w-full rounded-2xl bg-[#f7f9fc] py-3 text-sm font-semibold text-slate-600 transition active:scale-[0.98]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════ MODAL: confirmar quitar contacto ══════════ -->
    <div v-if="pendingRemove" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div class="w-full max-w-sm rounded-[26px] bg-white p-6 shadow-[0_22px_48px_rgba(15,23,42,0.22)] modal-pop">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1ed] text-[#f2826d]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 class="mt-4 text-center text-[18px] font-bold text-slate-900">
          ¿Quitar a {{ pendingRemove.name }} {{ pendingRemove.lastname }}?
        </h3>
        <p class="mt-2 text-center text-sm leading-6 text-slate-500">
          Ya no va a poder ver tus recorridos compartidos.
        </p>

        <div class="mt-6 space-y-3">
          <button
            type="button"
            @click="confirmRemoveContact"
            :disabled="removingId === pendingRemove.trusted_contact_id"
            class="w-full rounded-2xl bg-[#f2826d] py-3 text-sm font-semibold text-white transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
          >
            {{ removingId === pendingRemove.trusted_contact_id ? "Quitando..." : "Sí, quitar" }}
          </button>
          <button
            type="button"
            @click="cancelRemoveContact"
            :disabled="removingId === pendingRemove.trusted_contact_id"
            class="w-full rounded-2xl bg-[#f7f9fc] py-3 text-sm font-semibold text-slate-600 transition active:scale-[0.98]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>

  <BottomNavigation />
</template>

<style scoped>
/* Toast */
.toast-pop-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-pop-leave-active { transition: all 0.25s ease; }
.toast-pop-enter-from { opacity: 0; transform: translateY(-8px) scale(0.96); }
.toast-pop-leave-to { opacity: 0; transform: translateY(-8px); }

@keyframes checkPop {
  0% { transform: scale(0.6); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
.toast-check {
  animation: checkPop 0.4s ease-out;
}

/* Lista de contactos (agregar/quitar con transición) */
.contact-list-enter-active,
.contact-list-leave-active {
  transition: all 0.28s ease;
}
.contact-list-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
.contact-list-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(0.97);
}
.contact-list-leave-active {
  position: absolute;
}
.contact-list-move {
  transition: transform 0.28s ease;
}

/* Acordeón de "agregar contacto" */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
}
.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-6px);
}
.accordion-enter-to,
.accordion-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* Modales */
@keyframes modalPop {
  0% { opacity: 0; transform: scale(0.92) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-pop {
  animation: modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>