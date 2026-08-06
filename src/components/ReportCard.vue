<script setup>
import { HandThumbUpIcon, MapPinIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  report: { type: Object, required: true },
  to: { type: String, default: null },
  supporting: { type: Boolean, default: false },
  alreadySupported: { type: Boolean, default: false },
  showSupportButton: {
    type: Boolean,
    default: true,
  },
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
    class="w-full overflow-hidden rounded-3xl border border-[#C7D9F2] bg-[#E3ECFA] p-4 shadow-[0_10px_24px_rgba(48,130,227,0.12)] transition-all duration-300 ease-out"
  >
    <div class="flex items-start gap-4 w-full">
      <img
        :src="report.imagen"
        alt="Imagen del reporte"
        class="h-16 w-16 shrink-0 rounded-2xl object-cover bg-slate-100 shadow-[0_6px_16px_rgba(148,163,184,0.18)]"
      />

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="text-[12px] text-slate-500">
            {{ new Date(report.created_at).toLocaleString() }}
          </p>

          <span
            class="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#3082e3]"
          >
            {{ report.categoria }}
          </span>

          <span
            class="rounded-full px-2.5 py-1 text-[10px] font-semibold"
            :class="getStatusClasses(report.estado)"
          >
            {{ report.estado || "Pendiente" }}
          </span>
        </div>

        <div class="mt-3">
          <p class="wrap-break-word text-sm font-medium text-slate-700">
            {{ report.email }}
          </p>

          <p
            class="mt-1 wrap-break-word text-[18px] font-bold leading-snug text-slate-900 line-clamp-2"
          >
            {{ report.descripcion }}
          </p>

          <div class="mt-2 flex items-start gap-2 text-sm text-slate-500">
            <MapPinIcon class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p class="wrap-break-word line-clamp-2">
              {{ report.ubicacion }}
            </p>
          </div>
        </div>

        <div class="mt-4 border-t border-white/60 pt-4">
          <div class="flex flex-col gap-3">
            <div
              class="inline-flex w-fit items-center gap-2 rounded-full border border-[#D6E8FB] bg-white px-3 py-1.5 text-xs font-semibold text-[#3082e3] shadow-[0_6px_16px_rgba(48,130,227,0.08)]"
            >
              <HandThumbUpIcon class="h-4 w-4" />
              <span>Apoyos: {{ report.apoyos ?? 0 }}</span>
            </div>

            <RouterLink
              :to="to"
              class="mb-3 flex w-full items-center justify-center rounded-xl border border-[#3082e3] px-4 py-2.5 text-sm font-semibold text-[#3082e3] transition hover:bg-[#eef4ff] active:scale-[0.98]">
              Ver detalle del reporte
            </RouterLink>

            <button
              v-if="showSupportButton"
              type="button"
              @click="handleSupport"
              :disabled="alreadySupported || supporting"
              class="inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]"
              :class="
                alreadySupported
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-[#3082e3] text-white hover:bg-[#085baf]'
              "
            >
              {{
                supporting
                  ? "Sumando..."
                  : alreadySupported
                    ? "Ya te sumaste"
                    : "Sumarme al reporte"
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </li>
</template>
