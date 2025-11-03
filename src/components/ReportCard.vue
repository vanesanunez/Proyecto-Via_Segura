<script setup>
const props = defineProps({
  report: { type: Object, required: true },
  to: { type: String, default: null },
})
</script>

<template>
  <li
    class="max-w-2xl mx-auto rounded-xl border-2 border-[#3082e3] bg-white p-4 md:p-5 flex items-center justify-between 
         shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#3082e3] hover:bg-blue-50/40 
         transition-all duration-300 ease-out"
  >
    <div class="flex items-start gap-3 w-full">
      <img
        :src="report.imagen"
        alt="Imagen del reporte"
        class="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover bg-gray-100 flex-shrink-0"
      />

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="text-xs text-gray-500">
            {{ new Date(report.created_at).toLocaleString() }}
          </p>
          <span
            class="text-[10px] uppercase tracking-wide bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
          >
            {{ report.categoria }}
          </span>
        </div>
         <p class="font-semibold text-sm md:text-base mt-1 truncate">
          {{ report.email }}
        </p>
        <p class="font-semibold text-sm md:text-base mt-1 truncate">
          {{ report.descripcion }}
        </p>
        <p class="text-gray-500 text-xs truncate">
          {{ report.ubicacion }}
        </p>
      </div>
    </div>

  </li>
</template>