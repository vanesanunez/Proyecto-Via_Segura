<script>
import MainLoader from "../components/MainLoader.vue";

  export default {
    name: "EmergencyButton",
    components: {MainLoader},
    data() {
      return {
        toastVisible: false,
      };
    },
    methods: {
      mostrarToast() {
        this.toastVisible = true;
        setTimeout(() => {
          this.toastVisible = false;
        }, 5000);
      },
    },
  };
  </script>
  
  <template>
    <div class="relative w-full inline-block">
      <!-- Botón de emergencia -->
      <button
        @click="mostrarToast"
        class="bg-[#f2826d] text-white mt-6 font-bold py-3 px-6 rounded-lg w-full transition-transform active:scale-95 active:opacity-80"
      >
        EMERGENCIA
      </button>
  
      <!-- Toast -->
      <transition name="slide-down" appear>
        <div
          v-if="toastVisible"
          class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white text-gray-700 px-4 py-2 rounded shadow-lg shadow-blue-100 whitespace-nowrap z-50"
        >
        <p class="text-xl">Conectando con emergencias...</p> 
        <div class="m-4 flex justify-center items-center h-full">
            
            <MainLoader />
        </div>
         
        </div>
      </transition>
    </div>
  </template>
  

  <style scoped>
  /* Animación con Tailwind compatible */
 
  
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
  