<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, required: true },
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
      "border border-[#dfe9f7] bg-white hover:border-[#c7daf7] hover:shadow-[0_10px_22px_rgba(148,163,184,0.10)]",
    iconWrap: "bg-[#eef4ff]",
  },
  green: {
    wrapper:
    "border border-[#d6e8fb] bg-white hover:border-[#c4dcfa] hover:shadow-[0_10px_22px_rgba(48,130,227,0.08)]",
    iconWrap: "bg-[#eef4ff]",
  },
  yellow: {
    wrapper:
       "border border-[#dfe9f7] bg-white hover:border-[#c7daf7] hover:shadow-[0_10px_22px_rgba(148,163,184,0.10)]",
    iconWrap: "bg-[#eef4ff]",
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
    "group relative w-full min-h-[92px] rounded-[20px] px-4 py-4 transition-all duration-200 active:scale-[0.98]",
    selected.wrapper,
  ].join(" ");
});

const iconWrapClasses = computed(() => {
  const selected = accentMap[props.accent] || accentMap.blue;

  return [
    "flex h-10 w-10 items-center justify-center rounded-[14px] shrink-0",
    selected.iconWrap,
  ].join(" ");
});

const isLongTitle = computed(() => props.title.length >= 16);

const titleClasses = computed(() =>
  isLongTitle.value
    ? "text-[13px] leading-[1.15] font-bold text-[#2a2a2a]"
    : "text-[15px] leading-[1.15] font-bold text-[#2a2a2a]",
);
</script>

<template>
  <router-link :to="to" :class="cardClasses">
    <div class="flex h-full items-center gap-3">
      <div :class="iconWrapClasses">
        <slot name="icon" />
      </div>

      <div class="min-w-0 flex-1">
        <h3
          :class="titleClasses"
          class="whitespace-normal"
          style="text-wrap: balance"
        >
          <slot name="title">{{ title }}</slot>
        </h3>
      </div>
    </div>
  </router-link>
</template>
