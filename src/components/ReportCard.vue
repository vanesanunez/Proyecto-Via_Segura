<script setup>
import {
  HandThumbUpIcon,
  MapPinIcon,
} from "@heroicons/vue/24/outline";

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
    class="max-w-2xl mx-auto rounded-[24px] bg-[#E0E5EC] p-4 md:p-5
           shadow-[-6px_-6px_12px_rgba(255,255,255,0.82),6px_6px_12px_rgba(163,177,198,0.28)]
           transition-all duration-300 ease-out hover:-translate-y-0.5"
  >
    <div class="flex items-start gap-4 w-full">
      <!-- imagen -->
      <img
        :src="report.imagen"
        alt="Imagen del reporte"
        class="w-16 h-16 md:w-[72px] md:h-[72px] rounded-[16px] object-cover bg-slate-100 shrink-0
               shadow-[-3px_-3px_8px_rgba(255,255,255,0.75),3px_3px_8px_rgba(163,177,198,0.18)]"
      />

      <div class="min-w-0 flex-1">
        <!-- meta -->
        <div class="flex items-center gap-2 flex-wrap">
          <p class="text-[12px] text-slate-500">
            {{ new Date(report.created_at).toLocaleString() }}
          </p>

          <span
            class="text-[10px] font-semibold uppercase tracking-wide bg-[#eef4ff] text-[#3082e3] px-2.5 py-1 rounded-full"
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

        <!-- contenido principal -->
        <div class="mt-3">
          <p class="text-sm font-medium text-slate-700 truncate">
            {{ report.email }}
          </p>

          <p class="mt-1 text-[18px] font-bold leading-snug text-slate-900 line-clamp-2">
            {{ report.descripcion }}
          </p>

          <div class="mt-2 flex items-start gap-2 text-sm text-slate-500">
            <MapPinIcon class="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
            <p class="line-clamp-2">
              {{ report.ubicacion }}
            </p>
          </div>
        </div>

        <!-- acciones -->
        <div
          class="mt-4 flex flex-col gap-3 border-t border-white/60 pt-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div
            class="inline-flex w-fit items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-semibold text-[#3082e3]
                   shadow-[-3px_-3px_8px_rgba(255,255,255,0.82),3px_3px_8px_rgba(163,177,198,0.22)]"
          >
            <HandThumbUpIcon class="h-4 w-4" />
            <span>Apoyos: {{ report.apoyos ?? 0 }}</span>
          </div>

          <button
            type="button"
            @click="handleSupport"
            :disabled="alreadySupported || supporting"
            class="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98]"
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