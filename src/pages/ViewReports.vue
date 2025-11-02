<script setup>
import { ref, watch, onMounted } from 'vue'
import { fetchUserReportsPageWithCount } from '../services/reports'
import { subscribeToUserState } from '../services/auth'  

const page = ref(1)
const pageSize = 2
const reports = ref([])
const total = ref(0)
const lastPage = ref(1)
const loading = ref(false)
const error = ref('')
const user = ref({ id: null, email: null })

subscribeToUserState((u) => {
  user.value = u || { id: null, email: null }
  if (user.value?.id || user.value?.email) {
    page.value = 1
    loadPage(1)
  }
})

async function loadPage(p = 1) {
  try {
    if (!user.value?.id && !user.value?.email) return
    loading.value = true
    error.value = ''

    const { data, count } = await fetchUserReportsPageWithCount({
      userId: user.value.id,
      email:  user.value.email,
      page:   p,
      pageSize
    })

    total.value = count
    lastPage.value = Math.max(1, Math.ceil(count / pageSize))

    if (p > lastPage.value) {
      page.value = lastPage.value
      return
    }

    reports.value = data
  } catch (e) {
    console.error(e)
    error.value = 'No pudimos cargar tus reportes.'
  } finally {
    loading.value = false
  }
}

watch(page, (p) => loadPage(p))

function thumb(r) {
  return r.imagen || null
}
</script>

<template>
  <main class="max-w-3xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-semibold mb-5">Tus reportes</h1>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div class="animate-pulse h-20 rounded-2xl bg-slate-100"></div>
      <div class="animate-pulse h-20 rounded-2xl bg-slate-100"></div>
    </div>

    <!-- Error -->
    <p v-else-if="error" class="text-red-600 text-sm">{{ error }}</p>

    <!-- Lista: tarjetas más grandes -->
    <ul v-else class="space-y-3">
      <li v-for="r in reports" :key="r.id">
        <router-link
          :to="`/report/${r.id}`"
          class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-sm transition"
        >
          <!-- Miniatura grande -->
          <div class="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            <img v-if="thumb(r)" :src="thumb(r)" alt="" class="w-full h-full object-cover" />
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 class="w-7 h-7 text-slate-500"><path fill="currentColor"
                 d="M19 19H5V5h14v14ZM5 3a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V5c0-1.1-.9-2-2-2H5Zm10 6a2 2 0 1 1-4 0a2 2 0 0 1 4 0Zm-9 8l3.5-4.5l2.5 3l3.5-4.5L20 17H6Z"/></svg>
          </div>

          <!-- Texto más grande -->
          <div class="min-w-0 flex-1">
            <div class="text-base font-semibold text-slate-900">
              {{ r.categoria || 'Reporte' }}
            </div>
            <div class="text-sm text-slate-700 line-clamp-2">
              {{ r.descripcion }}
            </div>
            <div class="text-xs text-slate-500 mt-1">
              {{ new Date(r.created_at).toLocaleString() }}
            </div>
          </div>

          <!-- Chevron -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               class="w-5 h-5 text-slate-400">
            <path fill="currentColor" d="M9.29 6.71a1 1 0 0 0 0 1.41L13.17 12l-3.88 3.88a1 1 0 1 0 1.42 1.41l4.59-4.59a1 1 0 0 0 0-1.41L10.71 6.7a1 1 0 0 0-1.42 0Z"/>
          </svg>
        </router-link>
      </li>

      <li v-if="!loading && reports.length === 0" class="text-sm text-slate-500 px-2 py-6">
        No tenés reportes en esta página.
      </li>
    </ul>

    <!-- Paginación debajo de la lista -->
    <div v-if="lastPage > 1" class="mt-8 flex justify-center">
      <v-pagination
        v-model="page"
        :length="lastPage"
        :total-visible="5"
        rounded
        prev-icon="mdi-chevron-left"
        next-icon="mdi-chevron-right"
      />
    </div>
  </main>
</template>