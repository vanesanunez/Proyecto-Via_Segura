<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  to: { type: String, required: true },
  accent: { type: String, default: "blue" },
});

const accentMap = {
  blue: {
    wrapper:
      "border border-[#dfe9f7] bg-white hover:border-[#c7daf7] hover:shadow-[0_10px_22px_rgba(148,163,184,0.10)]",
    iconWrap: "bg-[#eef4ff]",
  },
  coral: {
    wrapper:
      "border border-[#f8dfd9] bg-white hover:border-[#f3c8bd] hover:shadow-[0_10px_22px_rgba(242,130,109,0.10)]",
    iconWrap: "bg-[#fff1ed]",
  },
  green: {
    wrapper:
      "border border-[#dbf3ea] bg-white hover:border-[#c4ebdc] hover:shadow-[0_10px_22px_rgba(32,180,134,0.10)]",
    iconWrap: "bg-[#eefaf5]",
  },
  yellow: {
    wrapper:
      "border border-[#f8edd0] bg-white hover:border-[#f3dfa2] hover:shadow-[0_10px_22px_rgba(242,179,33,0.10)]",
    iconWrap: "bg-[#fff8e7]",
  },
  "blue-soft": {
    wrapper:
      "border border-[#e2ecfb] bg-white hover:border-[#cfdef8] hover:shadow-[0_10px_22px_rgba(48,130,227,0.08)]",
    iconWrap: "bg-[#f2f7ff]",
  },
};

const cardClasses = computed(() => {
  const selected = accentMap[props.accent] || accentMap.blue;

  return [
    "group relative min-h-[112px] rounded-[20px] px-4 py-4 transition-all duration-200 active:scale-[0.98]",
    selected.wrapper,
  ].join(" ");
});

const iconWrapClasses = computed(() => {
  const selected = accentMap[props.accent] || accentMap.blue;
  return [
    "flex h-11 w-11 items-center justify-center rounded-[14px] shrink-0",
    selected.iconWrap,
  ].join(" ");
});
</script>

<template>
  <router-link :to="to" :class="cardClasses">
    <div class="flex h-full items-start justify-between gap-3">
      <div class="flex gap-3">
        <div :class="iconWrapClasses">
          <slot name="icon" />
        </div>

        <div class="min-w-0">
          <h4 class="text-[15px] font-bold leading-5 text-[#2a2a2a]">
            {{ title }}
          </h4>

          <p
            v-if="description"
            class="mt-1 text-[13px] leading-5 text-slate-500"
          >
            {{ description }}
          </p>
        </div>
      </div>

      <div class="pt-1 text-slate-400 transition group-hover:text-[#3082e3]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </router-link>
</template>