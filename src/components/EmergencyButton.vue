<script>
import StateLoader from './StateLoader.vue';


export default {
  name: "EmergencyButton",
  components: { StateLoader },
  data() {
    return {
      toastVisible: false,
    };
  },
  methods: {
    mostrarToast() {
      this.toastVisible = true;
    },
    cancelarEmergencia() {
      this.toastVisible = false;
    },
  },
};
</script>

<template>
  <div class="relative w-full inline-block">
    <button @click="mostrarToast"
      class="bg-[#f2826d] text-white mt-6 font-bold py-3 px-6 rounded-lg w-full transition-transform active:scale-95 active:opacity-80">
      EMERGENCIA
    </button>

    <transition name="slide-down" appear>
      <div v-if="toastVisible"
        class="absolute top-full w-full left-1/2 transform -translate-x-1/2 mt-2  bg-white border border-blue-200 rounded-xl shadow-blue-100 shadow-lg z-50"
        role="alert" tabindex="-1" aria-labelledby="hs-toast-with-icons-label">
        <div class="flex p-4">
          <div class="shrink-0">
            <svg class="size-5 text-gray-600 mt-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
          </div>
          <div class="ms-4">


            <StateLoader />

            <p id="hs-toast-with-icons-label" class="text-gray-800 font-bold">
              Emergencia activada
            </p>

            <div class="mt-1 text-sm text-gray-600">
              <p> Si presionaste el botón por error, podés cancelar.</p>
            </div>

            <div class="mt-4">
              <button type="button" @click="cancelarEmergencia" class=" p-2 text-white bg-blue-500 rounded">
                Cancelar
              </button>
            </div>

          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px) translateX(-50%);
}

.slide-down-enter-to {
  opacity: 1;
  transform: translateY(0) translateX(-50%);
}

.slide-down-leave-from {
  opacity: 1;
  transform: translateY(0) translateX(-50%);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px) translateX(-50%);
}
</style>
