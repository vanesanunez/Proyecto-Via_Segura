<script>
import { RouterLink } from 'vue-router';
import AppH1 from '../components/AppH1.vue';
import MainLoader from '../components/MainLoader.vue';
import { getUserProfileById } from '../services/user-profiles';


export default {
    name: 'UserProfile',
    components: { AppH1, MainLoader },
    data() {
        return {
            user: {
                id: null, 
                email: null,
                name: null,
                lastname: null,
                dni: null,
            },
            loading: false,
        }
    },
   async mounted() {
      try {
        this.loading = true;
        this.user = await getUserProfileById(this.$route.params.id);
        this.loading = false;
        
      } catch (error) {
        //manejar error
      }
    }
}
</script>

<template>
    <template v-if="!loading">
    <AppH1 class="text-center">Perfil de {{ user.email }}</AppH1>
    
    <dl class="mb-4">
        <dt class="font-bold mb-2">Email</dt>
        <dd class="mb-4">{{ user.email }}</dd>
        <dt class="font-bold mb-2">Nombre</dt>
        <dd class="mb-4">{{ user.name }}</dd>
        <dt class="font-bold mb-2">Apellido</dt>
        <dd class="mb-4">{{ user.lastname }}</dd>
        </dl>

        <hr class="mb-4">
        <RouterLink 
            :to="`/usuario/${user.id}/chat`"
            class="text-blue-700"
        >Iniciar conversación privada con {{ user.email }}
        </RouterLink>
    </template>
   
    <div v-else class="flex justify-center items-center h-full">
        <MainLoader />
    </div>
</template>