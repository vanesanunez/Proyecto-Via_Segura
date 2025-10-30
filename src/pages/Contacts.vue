
<script setup>
import { ref, onMounted, computed } from 'vue';
import { getAllUsers, getTrustedContacts, addTrustedContact, removeTrustedContact } from '../services/contacts';
import supabase from '../services/supabase';
import MainLoader from '../components/MainLoader.vue';
import AppH1 from '../components/AppH1.vue';

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
    <AppH1>Contactos de confianza</AppH1>

    <div class="mb-4">
      <input
        v-model="filter"
        placeholder="Buscar por nombre o apellido..."
        class="w-full border rounded px-3 py-2"
      />
    </div>

    <div v-if="loading" class="text-gray-500 text-center py-6">
      <div class="flex justify-center items-center h-full">
                <MainLoader />
            </div>
      Cargando contactos...
      
    </div>
    

    <div v-else>
      <div v-if="trustedContacts.length" class="mb-6">
        <h2 class="text-lg font-medium mb-2">Tus contactos</h2>
        <div v-for="c in trustedContacts" :key="c.id" class="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-2">
          <div class="flex items-center gap-3">
            <div>
              <div class="font-medium">{{ c.name }},  {{ c.lastname }}</div>
              
            </div>
          </div>
          <button @click="removeContact(c.trusted_contact_id)" class="px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200">
            Eliminar
          </button>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-medium mb-2">Agregar nuevo contacto</h2>
        <div v-if="filteredUsers.length === 0" class="text-gray-500">No hay usuarios disponibles.</div>
        <div v-for="u in filteredUsers" :key="u.id" class="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-2">
          <div class="flex items-center gap-3">
            <div>
              <div class="font-medium">{{ u.name }},  {{ u.lastname }}</div>
              <div class="text-sm text-gray-500">{{ u.email }}</div>
            </div>
          </div>
          
          <button
            @click="toggleTrust(u.id)"
            class="px-3 py-1.5 rounded-full text-sm font-medium transition"
            :class="isTrusted(u.id) ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'"
          >
            {{ isTrusted(u.id) ? 'Eliminar' : 'Agregar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  
</template>


<style scoped>
input::placeholder {
  color: #9aa3a8;
}
</style>
