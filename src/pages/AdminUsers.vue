<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";

import {
  fetchAllUserProfiles,
  updateUserRole,
} from "../services/user-profiles";

import {
  ChevronDownIcon,
  UsersIcon,
  ShieldCheckIcon,
} from "@heroicons/vue/24/solid";

const router = useRouter();

// Datos principales
const users = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");
const updatingUserId = ref(null);

// Paginación: tres usuarios por página
const page = ref(1);
const pageSize = 3;

// Métricas
const adminCount = computed(() => {
  return users.value.filter((user) => user.role === "admin").length;
});

const regularUserCount = computed(() => {
  return users.value.filter((user) => user.role !== "admin").length;
});

// Cantidad total de páginas
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(users.value.length / pageSize));
});

// Usuarios que se muestran en la página actual
const paginatedUsers = computed(() => {
  const start = (page.value - 1) * pageSize;
  const end = start + pageSize;

  return users.value.slice(start, end);
});

// Cambiar de página
function goTo(newPage) {
  if (newPage < 1 || newPage > totalPages.value) return;

  page.value = newPage;
}

// Si cambia la cantidad de usuarios, controla que la página siga existiendo
watch(
  () => users.value.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value;
    }
  },
);

let successTimeout = null;

// Mostrar mensaje de éxito durante tres segundos
function showSuccessMessage(message) {
  successMessage.value = message;

  if (successTimeout) {
    clearTimeout(successTimeout);
  }

  successTimeout = setTimeout(() => {
    successMessage.value = "";
  }, 3000);
}

// Obtener usuarios desde Supabase
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

// Cambiar el rol de un usuario
async function handleRoleChange(userId, event) {
  const newRole = event.target.value;

  updatingUserId.value = userId;
  errorMessage.value = "";

  try {
    await updateUserRole(userId, newRole);

    users.value = users.value.map((user) => {
      if (user.id === userId) {
        return {
          ...user,
          role: newRole,
        };
      }

      return user;
    });

    showSuccessMessage("Rol actualizado con éxito.");
  } catch (error) {
    console.error("[AdminUsers] Error actualizando rol:", error);

    errorMessage.value = "No se pudo actualizar el rol del usuario.";
  } finally {
    updatingUserId.value = null;
  }
}

// Color de la etiqueta según el rol
function roleBadgeClass(role) {
  if (role === "admin") {
    return "border border-[#D6E8FB] bg-[#EEF4FF] text-[#3082E3]";
  }

  return "border border-slate-200 bg-white text-slate-600";
}

// Iniciales para el avatar
function userInitials(user) {
  const nameInitial = user?.name?.trim()?.charAt(0) || "";
  const lastnameInitial = user?.lastname?.trim()?.charAt(0) || "";

  return `${nameInitial}${lastnameInitial}`.toUpperCase() || "U";
}

onMounted(() => {
  loadUsers();
});
</script>

<template>
  <section
    class="box-border min-h-dvh w-full max-w-full overflow-x-hidden bg-[#F7F9F6] px-3 pb-12 pt-5 sm:px-4"
  >
    <div class="mx-auto w-full min-w-0 max-w-5xl">
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
        <div class="flex min-w-0 items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div
              class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#3082E3]"
            >
              <UsersIcon class="h-4 w-4" />

              <span>Gestión de usuarios</span>
            </div>

            <h1
              class="mt-4 break-words text-[26px] font-bold leading-tight text-slate-900 sm:text-[34px]"
            >
              Usuarios registrados
            </h1>
          </div>

          <div
            class="hidden h-14 min-w-14 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-[#3082E3] shadow-[0_8px_20px_rgba(48,130,227,0.10)] sm:flex"
          >
            {{ users.length }}
          </div>
        </div>

        <p class="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          Consultá los perfiles de la comunidad y administrá sus permisos de
          acceso.
        </p>
      </header>

      <!-- Métricas -->
      <section
        class="mt-5 grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <article
          class="min-w-0 rounded-[20px] border border-[#D6E8FB] bg-white p-3 shadow-[0_8px_20px_rgba(48,130,227,0.06)]"
        >
          <p class="text-[11px] font-semibold text-slate-500">Total</p>

          <p class="mt-2 text-2xl font-bold text-[#3082E3]">
            {{ users.length }}
          </p>
        </article>

        <article
          class="min-w-0 rounded-[20px] border border-[#D6E8FB] bg-white p-3 shadow-[0_8px_20px_rgba(48,130,227,0.06)]"
        >
          <p class="break-words text-[11px] font-semibold text-slate-500">
            Admin
          </p>

          <p class="mt-2 text-2xl font-bold text-[#3082E3]">
            {{ adminCount }}
          </p>
        </article>

        <article
          class="col-span-2 min-w-0 rounded-[20px] border border-[#F7CBC2] bg-white p-3 shadow-[0_8px_20px_rgba(242,130,109,0.06)] sm:col-span-1"
        >
          <p class="text-[11px] font-semibold text-slate-500">Usuarios</p>

          <p class="mt-2 text-2xl font-bold text-[#F2826D]">
            {{ regularUserCount }}
          </p>
        </article>
      </section>

      <!-- Mensaje de éxito -->
      <div
        v-if="successMessage"
        class="mt-5 flex items-start gap-3 rounded-[20px] border border-[#D6E8FB] bg-[#EEF4FF] px-4 py-3 text-[#3082E3]"
      >
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-bold"
        >
          ✓
        </span>

        <div>
          <p class="text-sm font-semibold">
            {{ successMessage }}
          </p>

          <p class="mt-0.5 text-xs text-slate-500">
            Los permisos del usuario fueron actualizados.
          </p>
        </div>
      </div>

      <!-- Mensaje de error -->
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

      <!-- ESTADO 1: Cargando -->
      <div
        v-if="loading"
        class="mt-5 rounded-3xl border border-[#D6E8FB] bg-white p-6 shadow-[0_10px_26px_rgba(48,130,227,0.07)]"
      >
        <div class="flex items-center gap-3">
          <div
            class="h-6 w-6 animate-spin rounded-full border-2 border-[#D6E8FB] border-t-[#3082E3]"
          ></div>

          <p class="text-sm font-medium text-slate-600">Cargando usuarios...</p>
        </div>
      </div>

      <!-- ESTADO 2: No hay usuarios -->
      <div
        v-else-if="users.length === 0"
        class="mt-5 rounded-3xl border border-[#D6E8FB] bg-white px-5 py-10 text-center shadow-[0_10px_26px_rgba(48,130,227,0.07)]"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF4FF] text-[#3082E3]"
        >
          <UsersIcon class="h-7 w-7" />
        </div>

        <p class="mt-4 font-bold text-slate-900">Todavía no hay usuarios</p>

        <p class="mt-1 text-sm text-slate-500">
          Los nuevos perfiles aparecerán en esta sección.
        </p>
      </div>

      <!-- ESTADO 3: Hay usuarios -->
      <div v-else>
        <!-- Encabezado del listado -->
        <div class="mb-4 mt-7">
          <h2 class="text-[20px] font-bold text-slate-900">
            Perfiles de la comunidad
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            Revisá la información y asigná el rol correspondiente.
          </p>
        </div>

        <!-- Vista celular -->
        <div class="w-full min-w-0 space-y-4 overflow-hidden md:hidden">
          <article
            v-for="user in paginatedUsers"
            :key="user.id"
            class="box-border w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-[#D6E8FB] bg-white p-4 shadow-[0_10px_24px_rgba(48,130,227,0.07)]"
          >
            <!-- Información principal -->
            <div class="flex items-start gap-3">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-sm font-bold text-[#3082E3]"
              >
                {{ userInitials(user) }}
              </div>

              <div class="min-w-0 flex-1">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold"
                  :class="roleBadgeClass(user.role)"
                >
                  {{ user.role === "admin" ? "Administrador" : "Usuario" }}
                </span>

                <h3
                  class="mt-2 break-words text-[18px] font-bold leading-snug text-slate-900"
                >
                  {{ user.name || "Sin nombre" }}
                  {{ user.lastname || "" }}
                </h3>

                <p class="mt-1 break-all text-sm text-slate-500">
                  {{ user.email }}
                </p>
              </div>
            </div>

            <!-- Datos secundarios -->
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div
                class="rounded-2xl border border-[#E6EDF7] bg-[#F9FBFD] px-3 py-3"
              >
                <p class="text-[11px] font-semibold text-slate-400">DNI</p>

                <p class="mt-1 break-words text-sm font-bold text-slate-700">
                  {{ user.dni || "Sin dato" }}
                </p>
              </div>

              <div
                class="rounded-2xl border border-[#E6EDF7] bg-[#F9FBFD] px-3 py-3"
              >
                <p class="text-[11px] font-semibold text-slate-400">Registro</p>

                <p class="mt-1 text-sm font-bold text-slate-700">
                  {{ new Date(user.created_at).toLocaleDateString() }}
                </p>
              </div>
            </div>

            <!-- Cambio de rol -->
            <div
              class="mt-4 rounded-[18px] border border-[#D6E8FB] bg-[#EEF4FF] p-4"
            >
              <div class="flex items-center gap-2">
                <ShieldCheckIcon class="h-5 w-5 text-[#3082E3]" />

                <label
                  :for="`role-${user.id}`"
                  class="text-sm font-semibold text-slate-800"
                >
                  Permisos del usuario
                </label>
              </div>

              <p class="mt-1 text-xs leading-5 text-slate-500">
                Elegí qué nivel de acceso tendrá dentro de Vía Segura.
              </p>

              <div class="relative mt-3">
                <select
                  :id="`role-${user.id}`"
                  :value="user.role"
                  @change="handleRoleChange(user.id, $event)"
                  :disabled="updatingUserId === user.id"
                  class="w-full appearance-none rounded-2xl border border-[#D6E8FB] bg-white px-4 py-3 pr-12 text-sm font-medium text-slate-700 outline-none transition focus:border-[#3082E3] focus:ring-2 focus:ring-[#3082E3]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>

                <ChevronDownIcon
                  class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                />
              </div>

              <p
                v-if="updatingUserId === user.id"
                class="mt-2 text-xs font-medium text-[#3082E3]"
              >
                Actualizando permisos...
              </p>
            </div>
          </article>
        </div>

        <!-- Vista escritorio -->
        <section
          class="hidden overflow-hidden rounded-3xl border border-[#D6E8FB] bg-white shadow-[0_10px_26px_rgba(48,130,227,0.07)] md:block"
        >
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse">
              <thead class="bg-[#EEF4FF]">
                <tr class="text-left">
                  <th
                    class="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    Usuario
                  </th>

                  <th
                    class="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    Email
                  </th>

                  <th
                    class="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    DNI
                  </th>

                  <th
                    class="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    Fecha
                  </th>

                  <th
                    class="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    Rol
                  </th>

                  <th
                    class="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    Cambiar permisos
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="user in paginatedUsers"
                  :key="user.id"
                  class="border-t border-[#E6EDF7] transition hover:bg-[#F9FBFD]"
                >
                  <td class="px-4 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-xs font-bold text-[#3082E3]"
                      >
                        {{ userInitials(user) }}
                      </div>

                      <p class="font-semibold text-slate-800">
                        {{ user.name || "Sin nombre" }}
                        {{ user.lastname || "" }}
                      </p>
                    </div>
                  </td>

                  <td class="break-all px-4 py-4 text-sm text-slate-600">
                    {{ user.email }}
                  </td>

                  <td class="px-4 py-4 text-sm text-slate-600">
                    {{ user.dni || "Sin dato" }}
                  </td>

                  <td class="px-4 py-4 text-sm text-slate-600">
                    {{ new Date(user.created_at).toLocaleDateString() }}
                  </td>

                  <td class="px-4 py-4">
                    <span
                      class="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold"
                      :class="roleBadgeClass(user.role)"
                    >
                      {{ user.role === "admin" ? "Administrador" : "Usuario" }}
                    </span>
                  </td>

                  <td class="px-4 py-4">
                    <div class="relative min-w-[170px]">
                      <select
                        :value="user.role"
                        @change="handleRoleChange(user.id, $event)"
                        :disabled="updatingUserId === user.id"
                        class="w-full appearance-none rounded-xl border border-[#D6E8FB] bg-white px-3 py-2.5 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#3082E3] focus:ring-2 focus:ring-[#3082E3]/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                      </select>

                      <ChevronDownIcon
                        class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Paginación -->
        <nav
          v-if="totalPages > 1"
          class="mt-6 flex items-center justify-center gap-2"
          aria-label="Paginación de usuarios"
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
            v-for="pageNumber in totalPages"
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
  </section>
</template>
