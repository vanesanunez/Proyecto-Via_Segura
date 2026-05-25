<script setup>
import { HandThumbUpIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  report: { type: Object, required: true },
  to: { type: String, default: null },
  supporting: { type: Boolean, default: false },
  alreadySupported: { type: Boolean, default: false },
});

const emit = defineEmits(["support"]);

function getStatusClasses(status) {
  switch (status) {
    case "Resuelto":
      return "bg-green-100 text-green-700";
    case "En curso":
      return "bg-blue-100 text-blue-700";
    case "Pendiente":
    default:
      return "bg-[#fff1ed] text-[#e67661]";
  }
}

function handleSupport() {
  emit("support", props.report);
}
</script>

<template>
  <li
    class="max-w-2xl mx-auto rounded-[22px] bg-[#E0E5EC] p-4 md:p-5
           shadow-[-6px_-6px_12px_rgba(255,255,255,0.82),6px_6px_12px_rgba(163,177,198,0.28)]
           transition-all duration-300 ease-out hover:-translate-y-0.5"
  >
    <div class="flex items-start gap-3 w-full">
      <img
        :src="report.imagen"
        alt="Imagen del reporte"
        class="w-14 h-14 md:w-16 md:h-16 rounded-[14px] object-cover bg-gray-100 shrink-0"
      />

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="text-xs text-slate-500">
            {{ new Date(report.created_at).toLocaleString() }}
          </p>

          <span
            class="text-[10px] uppercase tracking-wide bg-[#eef4ff] text-[#3082e3] px-2.5 py-1 rounded-full"
          >
            {{ report.categoria }}
          </span>

          <span
            class="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            :class="getStatusClasses(report.estado)"
          >
            {{ report.estado || "Pendiente" }}
          </span>
        </div>

        <p class="font-semibold text-sm md:text-base mt-2 truncate text-slate-900">
          {{ report.email }}
        </p>

        <p class="font-semibold text-sm md:text-base mt-1 text-slate-900 line-clamp-2">
          {{ report.descripcion }}
        </p>

        <p class="text-slate-500 text-xs mt-1 line-clamp-1">
          {{ report.ubicacion }}
        </p>

        <div class="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <div
            class="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-medium text-[#3082e3]
                   shadow-[-3px_-3px_8px_rgba(255,255,255,0.82),3px_3px_8px_rgba(163,177,198,0.22)]"
          >
             <HandThumbUpIcon class="h-4 w-4" />

            <span>Apoyos: {{ report.apoyos ?? 0 }}</span>
          </div>

          <button
            type="button"
            @click="handleSupport"
            :disabled="alreadySupported || supporting"
            class="rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98]"
            :class="
              alreadySupported
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-[#3082e3] text-white hover:bg-[#085baf]'
            "
          >
            {{
              supporting
                ? 'Sumando...'
                : alreadySupported
                  ? 'Ya te sumaste'
                  : 'Sumarme al reporte'
            }}
          </button>
        </div>
      </div>
    </div>
  </li>
</template>