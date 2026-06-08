<script setup>
import { ref, onMounted, computed, watch } from "vue";
import {
  fetchAllUserProfiles,
  updateUserRole,
} from "../services/user-profiles";
import { useRouter } from "vue-router";
import { ChevronDownIcon } from "@heroicons/vue/24/solid";

const router = useRouter();

const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");
const users = ref([]);
const updatingUserId = ref(null);

const page = ref(1);
const pageSize = 5;

const totalPages = computed(() =>
  Math.max(1, Math.ceil(users.value.length / pageSize)),
);

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * pageSize;
  const end = start + pageSize;
  return users.value.slice(start, end);
});

function goTo(p) {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
}

watch(
  () => users.value.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value;
    }
  },
);

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

async function loadUsers() {
  loading.value = true;
  errorMessage.value = "";

  try {
    users.value = await fetchAllUserProfiles();
  } catch (error) {
    console.error("[AdminUsers] Error cargando usuarios:", error);
    errorMessage.value = "No se pudieron cargar los usuarios.";
  } finally {
    loading.value = false;
  }
}

async function handleRoleChange(userId, event) {
  const newRole = event.target.value;
  updatingUserId.value = userId;

  try {
    await updateUserRole(userId, newRole);

    users.value = users.value.map((user) =>
      user.id === userId ? { ...user, role: newRole } : user,
    );

    showSuccessMessage("Rol actualizado con éxito.");
  } catch (error) {
    console.error("[AdminUsers] Error actualizando rol:", error);
    errorMessage.value = "No se pudo actualizar el rol del usuario.";
  } finally {
    updatingUserId.value = null;
  }
}

function roleBadgeClass(role) {
  return role === "admin"
    ? "bg-[#eef4ff] text-[#3082e3]"
    : "bg-slate-200 text-slate-700";
}

onMounted(() => {
  loadUsers();
});
</script>

<template>
  <section class="min-h-screen bg-white px-4 pt-4 pb-8">
    <div class="mx-auto w-full max-w-[430px] md:max-w-5xl">
      <!-- volver -->
      <button
        type="button"
        @click="router.push('/admin/dashboard')"
        class="mb-6 inline-flex items-center gap-3 text-left transition group active:scale-95"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0E5EC] text-xl font-bold text-[#3082e3] shadow-[-6px_-6px_12px_rgba(255,255,255,0.85),6px_6px_12px_rgba(163,177,198,0.35)] transition group-hover:text-[#085baf] group-active:text-[#085baf]"
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

      <!-- header -->
      <header class="mb-6">
        <h1 class="sr-only">Usuarios</h1>

        <section
          class="rounded-[26px] bg-[#3082e3] px-5 py-5 text-white shadow-[0_12px_28px_rgba(48,130,227,0.28)]"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/20 text-white"
                >
                  Gestión de usuarios
                </span>
              </div>

              <h2 class="mt-3 text-[22px] font-bold leading-tight">
                Usuarios registrados
              </h2>

              <p class="mt-2 text-[15px] leading-[1.7] text-white/85">
                Visualizá perfiles y cambiá roles.
              </p>
            </div>

            <div
              class="flex h-14 min-w-[56px] items-center justify-center rounded-full bg-white text-2xl font-bold text-[#3082e3] shadow-[0_8px_20px_rgba(15,23,42,0.12)]"
            >
              {{ users.length }}
            </div>
          </div>
        </section>
      </header>

      <!-- success -->
      <div
        v-if="successMessage"
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
        Cargando usuarios...
      </div>

      <template v-else>
        <!-- empty -->
        <div
          v-if="users.length === 0"
          class="rounded-[24px] bg-[#E0E5EC] px-4 py-5 text-slate-600 shadow-[0_10px_24px_rgba(148,163,184,0.18)]"
        >
          Todavía no hay usuarios cargados.
        </div>

        <template v-else>
          <!-- mobile -->
          <div class="space-y-5 md:hidden">
            <article
              v-for="user in paginatedUsers"
              :key="user.id"
              class="rounded-[24px] bg-[#E0E5EC] px-4 py-4 shadow-[0_10px_24px_rgba(148,163,184,0.18)]"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      class="text-[11px] font-semibold px-3 py-1 rounded-full"
                      :class="roleBadgeClass(user.role)"
                    >
                      {{ user.role }}
                    </span>
                  </div>

                  <h3
                    class="mt-3 text-[18px] font-bold text-slate-900 leading-snug"
                  >
                    {{ user.name || "Sin nombre" }} {{ user.lastname || "" }}
                  </h3>

                  <p class="mt-1 text-sm text-slate-500 break-all">
                    {{ user.email }}
                  </p>
                </div>
              </div>

              <div class="mt-4 space-y-2 text-sm text-slate-600">
                <p>
                  <span class="font-medium text-slate-500">DNI:</span>
                  {{ user.dni || "Sin dato" }}
                </p>

                <p>
                  <span class="font-medium text-slate-500">Fecha:</span>
                  {{ new Date(user.created_at).toLocaleDateString() }}
                </p>
              </div>

              <div class="mt-4 border-t border-white/60 pt-4">
                <label class="mb-2 block text-sm font-medium text-slate-600">
                  Cambiar rol
                </label>

                <div class="relative">
                  <select
                    :value="user.role"
                    @change="handleRoleChange(user.id, $event)"
                    :disabled="updatingUserId === user.id"
                    class="w-full appearance-none rounded-2xl border-0 bg-white px-4 py-3 pr-12 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.16)] focus:outline-none focus:ring-2 focus:ring-[#3082e3]/25 disabled:opacity-60"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>

                  <ChevronDownIcon
                    class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </article>
          </div>

          <!-- desktop -->
          <section
            class="hidden md:block rounded-[24px] bg-[#E0E5EC] p-5 shadow-[0_10px_24px_rgba(148,163,184,0.18)]"
          >
            <div class="overflow-x-auto">
              <table class="min-w-full border-collapse">
                <thead>
                  <tr class="border-b border-white/70 text-left">
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Nombre
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Apellido
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Email
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      DNI
                    </th>
                    <th class="px-3 py-3 text-sm font-semibold text-slate-700">
                      Rol
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
                    v-for="user in paginatedUsers"
                    :key="user.id"
                    class="border-b border-white/50 last:border-b-0"
                  >
                    <td class="px-3 py-3 text-sm text-slate-700">
                      {{ user.name || "Sin nombre" }}
                    </td>

                    <td class="px-3 py-3 text-sm text-slate-700">
                      {{ user.lastname || "Sin apellido" }}
                    </td>

                    <td class="px-3 py-3 text-sm text-slate-700 break-all">
                      {{ user.email }}
                    </td>

                    <td class="px-3 py-3 text-sm text-slate-700">
                      {{ user.dni || "Sin dato" }}
                    </td>

                    <td class="px-3 py-3">
                      <span
                        class="inline-flex text-[11px] font-semibold px-3 py-1 rounded-full"
                        :class="roleBadgeClass(user.role)"
                      >
                        {{ user.role }}
                      </span>
                    </td>

                    <td class="px-3 py-3 text-sm text-slate-700">
                      {{ new Date(user.created_at).toLocaleDateString() }}
                    </td>

                    <td class="px-3 py-3">
                      <select
                        :value="user.role"
                        @change="handleRoleChange(user.id, $event)"
                        :disabled="updatingUserId === user.id"
                        class="rounded-2xl border-0 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.16)] focus:outline-none focus:ring-2 focus:ring-[#3082e3]/25 disabled:opacity-60"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- paginado -->
          <nav
            v-if="totalPages > 1"
            class="mt-6 flex items-center justify-center gap-2"
          >
            <button
              @click="goTo(page - 1)"
              :disabled="page === 1"
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0E5EC] text-lg shadow-[-4px_-4px_8px_rgba(255,255,255,0.82),4px_4px_8px_rgba(163,177,198,0.22)] transition"
              :class="
                page === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:text-[#3082e3] active:scale-[0.97]'
              "
            >
              ‹
            </button>

            <button
              v-for="p in totalPages"
              :key="p"
              @click="goTo(p)"
              class="flex h-10 min-w-[40px] items-center justify-center rounded-xl px-3 text-sm font-semibold transition"
              :class="
                p === page
                  ? 'bg-[#3082e3] text-white shadow-sm'
                  : 'bg-[#E0E5EC] text-slate-700 shadow-[-4px_-4px_8px_rgba(255,255,255,0.82),4px_4px_8px_rgba(163,177,198,0.22)] hover:text-[#3082e3] active:scale-[0.97]'
              "
            >
              {{ p }}
            </button>

            <button
              @click="goTo(page + 1)"
              :disabled="page === totalPages"
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0E5EC] text-lg shadow-[-4px_-4px_8px_rgba(255,255,255,0.82),4px_4px_8px_rgba(163,177,198,0.22)] transition"
              :class="
                page === totalPages
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:text-[#3082e3] active:scale-[0.97]'
              "
            >
              ›
            </button>
          </nav>
        </template>
      </template>
    </div>
  </section>
</template>
