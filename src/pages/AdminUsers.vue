<script setup>
import { ref, onMounted } from "vue";
import {
  fetchAllUserProfiles,
  updateUserRole,
} from "../services/user-profiles";
import { useRouter } from "vue-router";
const router = useRouter();

const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");
const users = ref([]);
const updatingUserId = ref(null);

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

onMounted(() => {
  loadUsers();
});
</script>

<template>
  <section class="min-h-screen bg-slate-50 p-6">
    <div class="mx-auto max-w-6xl">
      <button
        type="button"
        @click="router.push('/admin/dashboard')"
        class="mb-6 inline-flex items-center gap-3 text-left transition group"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-[#3082e3] transition group-hover:bg-[#3082e3] group-hover:text-white"
        >
          ←
        </span>

        <span>
          <span
            class="block text-sm font-semibold text-slate-900 group-hover:text-[#3082e3]"
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
          Gestión de usuarios
        </h1>
        <p class="mt-2 text-sm text-slate-600 sm:text-base">
          Desde acá vas a poder administrar usuarios y roles.
        </p>
      </header>

      <div
        v-if="successMessage"
        class="fixed top-20 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 shadow-lg"
      >
        <p class="text-sm font-medium">{{ successMessage }}</p>
      </div>

      <div v-if="loading" class="rounded-2xl bg-white p-6 shadow-sm">
        <p class="text-slate-600">Cargando usuarios...</p>
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
              Usuarios registrados
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              Podés visualizar los perfiles y cambiar su rol.
            </p>
          </div>

          <div v-if="users.length === 0" class="py-4">
            <p class="text-slate-600">Todavía no hay usuarios cargados.</p>
          </div>

          <div v-else>
            <!-- Mobile -->
            <div class="space-y-4 md:hidden">
              <article
                v-for="user in users"
                :key="user.id"
                class="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-semibold text-slate-800">
                      {{ user.name || "Sin nombre" }} {{ user.lastname || "" }}
                    </p>
                    <p class="mt-1 text-sm text-slate-500 break-all">
                      {{ user.email }}
                    </p>
                  </div>

                  <span
                    class="rounded-full px-3 py-1 text-xs font-medium"
                    :class="
                      user.role === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-200 text-slate-700'
                    "
                  >
                    {{ user.role }}
                  </span>
                </div>

                <div class="mt-3 space-y-2 text-sm text-slate-700">
                  <p>
                    <span class="font-medium text-slate-500">DNI:</span>
                    {{ user.dni || "Sin dato" }}
                  </p>

                  <p>
                    <span class="font-medium text-slate-500">Fecha:</span>
                    {{ new Date(user.created_at).toLocaleDateString() }}
                  </p>
                </div>

                <div class="mt-4">
                  <label class="mb-1 block text-sm font-medium text-slate-600">
                    Cambiar rol
                  </label>

                  <select
                    :value="user.role"
                    @change="handleRoleChange(user.id, $event)"
                    :disabled="updatingUserId === user.id"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </article>
            </div>

            <!-- Desktop -->
            <div class="hidden overflow-x-auto md:block">
              <table class="min-w-full border-collapse">
                <thead>
                  <tr class="border-b border-slate-200 text-left">
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
                    v-for="user in users"
                    :key="user.id"
                    class="border-b border-slate-100"
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

                    <td class="px-3 py-3 text-sm text-slate-700">
                      {{ user.role }}
                    </td>

                    <td class="px-3 py-3 text-sm text-slate-700">
                      {{ new Date(user.created_at).toLocaleDateString() }}
                    </td>

                    <td class="px-3 py-3">
                      <select
                        :value="user.role"
                        @change="handleRoleChange(user.id, $event)"
                        :disabled="updatingUserId === user.id"
                        class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
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
