<template>
  <main class="min-h-[100dvh] bg-[#F7F9F6] pb-24">
    <section class="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <!-- Encabezado -->
      <div class="mb-8">
        <RouterLink
          to="/mi-perfil"
          class="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#085BAF] hover:underline"
        >
          ← Volver a mi perfil
        </RouterLink>

        <div
          class="rounded-3xl bg-gradient-to-r from-[#3082E3] to-[#085BAF] p-6 text-white shadow-sm md:p-8"
        >
          <p
            class="mb-2 text-sm font-semibold uppercase tracking-wide opacity-90"
          >
            Beneficios Vía Segura
          </p>

          <h1 class="text-2xl font-bold md:text-3xl">
            Tus acciones mejoran la comunidad
          </h1>

          <p
            class="mt-3 max-w-2xl text-sm leading-relaxed text-blue-50 md:text-base"
          >
            Usá los puntos que obtenés al crear y apoyar reportes para acceder
            a beneficios de comercios y espacios adheridos.
          </p>

          <div
            class="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/15 px-5 py-3 backdrop-blur"
          >
            <span class="text-sm text-blue-50">
              Puntos disponibles
            </span>

            <strong class="text-2xl">
              {{ availablePoints }}
            </strong>
          </div>
        </div>
      </div>

      <!-- Cargando -->
      <div
        v-if="loading"
        class="rounded-2xl border border-[#D6E8FB] bg-white p-8 text-center text-gray-600"
      >
        Cargando beneficios...
      </div>

      <!-- Error -->
      <div
        v-else-if="errorMessage"
        class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
      >
        {{ errorMessage }}
      </div>

      <!-- Sin beneficios -->
      <div
        v-else-if="benefits.length === 0"
        class="rounded-2xl border border-[#D6E8FB] bg-white p-8 text-center"
      >
        <h2 class="font-bold text-[#2A2A2A]">
          Todavía no hay beneficios disponibles
        </h2>

        <p class="mt-2 text-sm text-gray-600">
          Próximamente se incorporarán nuevas propuestas.
        </p>
      </div>

      <!-- Beneficios -->
      <div
        v-else
        class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <article
          v-for="benefit in benefits"
          :key="benefit.id"
          class="flex flex-col overflow-hidden rounded-3xl border border-[#D6E8FB] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <!-- Imagen o ícono -->
          <div
            class="flex min-h-36 items-center justify-center bg-[#EEF4FF] p-6"
          >
            <img
              v-if="benefit.image_url"
              :src="benefit.image_url"
              :alt="benefit.title"
              class="h-28 w-full object-contain"
            />

            <div
              v-else
              class="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#3082E3] shadow-[0_8px_18px_rgba(48,130,227,0.12)]"
            >
              <GiftIcon class="h-10 w-10 stroke-[1.8]" />
            </div>
          </div>

          <div class="flex flex-1 flex-col p-5">
            <p
              class="text-xs font-bold uppercase tracking-wide text-[#3082E3]"
            >
              {{ benefit.partner_name }}
            </p>

            <h2 class="mt-2 text-xl font-bold text-[#2A2A2A]">
              {{ benefit.title }}
            </h2>

            <p class="mt-3 flex-1 text-sm leading-relaxed text-gray-600">
              {{ benefit.description }}
            </p>

            <div class="mt-5 border-t border-gray-100 pt-4">
              <div class="mb-4 flex items-center justify-between">
                <span class="text-sm text-gray-500">
                  Costo
                </span>

                <strong class="text-lg text-[#085BAF]">
                  {{ benefit.points_cost }} puntos
                </strong>
              </div>

              <button
                type="button"
                disabled
                class="w-full cursor-not-allowed rounded-xl px-4 py-3 text-sm font-bold"
                :class="
                  canAfford(benefit)
                    ? 'bg-[#D6E8FB] text-[#085BAF]'
                    : 'bg-gray-100 text-gray-400'
                "
              >
                {{
                  canAfford(benefit)
                    ? "Canje disponible próximamente"
                    : "Puntos insuficientes"
                }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { GiftIcon } from "@heroicons/vue/24/outline";
import supabase from "../services/supabase";
import {
  fetchActiveBenefits,
  fetchAvailablePoints,
} from "../services/benefits";

const benefits = ref([]);
const availablePoints = ref(0);
const loading = ref(true);
const errorMessage = ref("");

function canAfford(benefit) {
  return availablePoints.value >= benefit.points_cost;
}

async function loadBenefitsPage() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      errorMessage.value =
        "Necesitás iniciar sesión para consultar los beneficios.";

      return;
    }

    const [benefitsData, pointsData] = await Promise.all([
      fetchActiveBenefits(),
      fetchAvailablePoints(user.id),
    ]);

    benefits.value = benefitsData;
    availablePoints.value = pointsData;
  } catch (error) {
    console.error(
      "[Benefits.vue] Error cargando la pantalla:",
      error,
    );

    errorMessage.value =
      "No pudimos cargar los beneficios. Intentá nuevamente.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadBenefitsPage);
</script>