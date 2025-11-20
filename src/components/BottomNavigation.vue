<script>
  import { useRouter, useRoute } from 'vue-router';
  import { 
    HomeIcon, 
    MapPinIcon, 
    PlusCircleIcon, 
    ChatBubbleLeftEllipsisIcon, 
    UserIcon 
  } from '@heroicons/vue/24/solid'; 
  
  export default {
    name: "BottomNavigation",
    components: { HomeIcon, MapPinIcon, PlusCircleIcon, ChatBubbleLeftEllipsisIcon, UserIcon },
    setup() {
      const router = useRouter();
      const route = useRoute();
  
      const goTo = (path) => {
        if (route.path !== path) {
          router.push(path);
        }
      };
  
      const buttonClass = (path) => {
        return [
          "flex flex-col items-center text-white hover:text-gray-200",
          route.path === path ? "text-gray-200" : ""
        ];
      };
  
      return { goTo, buttonClass };
    }
  };
  </script>

<template>
    <nav class="fixed bottom-0 left-0 w-full bg-[#3082e3] shadow-md flex justify-around items-center h-13 z-50">
     
      <button @click="goTo('/')"
              :class="buttonClass('/')">
        <HomeIcon class="h-6 w-6"/>
        <span class="text-xs">Home</span>
      </button>
  
     
      <button @click="goTo('/compartir')"
              :class="buttonClass('/compartir')">
        <MapPinIcon class="h-6 w-6"/>
        <span class="text-xs">Rutas</span>
      </button>
  
     
      <button @click="goTo('/report/nuevo')"
        class="flex items-center justify-center bg-white text-[#3082e3] p-3 rounded-full -mt-6 shadow-lg">
        <PlusCircleIcon class="h-8 w-8"/>
      </button>
  
     
      <button @click="goTo('/chat')"
              :class="buttonClass('/chat')">
        <ChatBubbleLeftEllipsisIcon class="h-6 w-6"/>
        <span class="text-xs">Chat</span>
      </button>
  
      <button @click="goTo('/mi-perfil')"
              :class="buttonClass('/mi-perfil')">
        <UserIcon class="h-6 w-6"/>
        <span class="text-xs">Perfil</span>
      </button>
    </nav>
  </template>
  
  <style scoped>
  button:active {
    transform: scale(0.95);
    transition: transform 0.1s;
  }
  </style>
  
  