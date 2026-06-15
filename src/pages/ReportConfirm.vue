<script setup>
import { onMounted } from "vue";
import confetti from "canvas-confetti";

onMounted(() => {
  confetti({
    particleCount: 55,
    spread: 65,
    startVelocity: 24,
    scalar: 0.9,
    origin: { y: 0.7 },
  });
});
</script>

<template>
  <section class="min-h-screen bg-white px-4 pt-6 pb-24">
    <div class="mx-auto w-full max-w-[390px]">
      <div
        class="overflow-hidden rounded-[30px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
      >
        <div class="bg-gradient-to-br from-[#3082e3] to-[#5aa0f0] px-5 pb-14 pt-6 text-white">
          <span
            class="inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold"
          >
            Reporte enviado
          </span>

          <h1 class="mt-3 text-[28px] font-bold leading-tight">
            ¡Gracias por cuidar tu zona!
          </h1>

          <p class="mt-2 text-[15px] leading-[1.6] text-white/90">
            Tu reporte ya quedó registrado y podrá ayudar a visibilizar lo que pasa en la comunidad.
          </p>
        </div>

        <div class="-mt-10 px-5">
          <div
            class="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-white text-[#3082e3] shadow-[0_14px_28px_rgba(48,130,227,0.18)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="h-10 w-10"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
        </div>

        <div class="px-5 pb-6 pt-5">
          <div class="text-center">
            <h2 class="text-[22px] font-bold leading-tight text-slate-900">
              Aporte registrado
            </h2>

            <p class="mt-2 text-[15px] leading-[1.7] text-slate-500">
              Gracias por ayudarnos a mantener una comunidad más atenta, visible y acompañada.
            </p>
          </div>

          <div
            class="mt-5 rounded-[24px] bg-[#E0E5EC] p-4 shadow-[0_10px_24px_rgba(148,163,184,0.14)]"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <span
                  class="inline-flex rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold text-[#3082e3]"
                >
                  Recompensa simbólica
                </span>

                <h3 class="mt-3 text-[18px] font-bold text-slate-900">
                  +10 por crear un reporte útil
                </h3>

                <p class="mt-2 text-sm leading-6 text-slate-500">
                  Tu acción ayuda a visibilizar un problema real en la zona.
                </p>
              </div>

              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-xl font-bold text-[#3082e3] shadow-[0_6px_16px_rgba(148,163,184,0.18)]"
              >
                +10
              </div>
            </div>
          </div>

          <div
            class="mt-4 rounded-[24px] border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(148,163,184,0.10)]"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-[#f2826d]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  class="h-5 w-5"
                >
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.002 6.002 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>
              </div>

              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-slate-900">
                  Tu aporte ayuda a la comunidad
                </p>
                <p class="mt-1 text-sm leading-6 text-slate-500">
                  Cada reporte suma información útil para que otras personas puedan anticiparse y cuidarse mejor.
                </p>
              </div>
            </div>
          </div>

          <div class="mt-5">
            <div class="mb-2 flex items-center justify-between text-sm">
              <span class="font-medium text-slate-700">Progreso inicial</span>
              <span class="text-slate-500">1/4 acciones</span>
            </div>

            <div class="h-2 overflow-hidden rounded-full bg-slate-200">
              <div class="h-full w-1/4 rounded-full bg-[#3082e3]"></div>
            </div>

            <p class="mt-2 text-sm text-slate-500">
              Te falta poco para desbloquear tu primera insignia comunitaria.
            </p>
          </div>

          <div class="mt-6 space-y-3">
            <router-link
              to="/reportes"
              class="flex w-full items-center justify-center rounded-2xl bg-[#3082e3] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#085baf] active:scale-[0.98]"
            >
              Ver reportes de la comunidad
            </router-link>

            <router-link
              to="/report/nuevo"
              class="flex w-full items-center justify-center rounded-2xl bg-[#E0E5EC] px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_6px_16px_rgba(148,163,184,0.14)] transition hover:text-[#3082e3] active:scale-[0.98]"
            >
              Hacer otro reporte
            </router-link>

            <router-link
              to="/"
              class="mt-1 flex w-full items-center justify-center text-sm font-medium text-slate-500 transition hover:text-[#3082e3]"
            >
              Volver al inicio
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>