<script>
import AppH1 from '../components/AppH1.vue';
import MainButton from '../components/MainButton.vue';
import MainLoader from '../components/MainLoader.vue';
import { register } from '../services/auth';

export default {
    name: 'Register',
    components: { AppH1, MainLoader, MainButton },
    data () {
        return {
            user: {
                email: '', 
                name: '',
                lastname: '',
                dni: '',
                password: '',
            },
            loading: false,
        }
    },
    methods: {
       async handleSubmit() {
        try {
            this.loading = true;
            await register(this.user.email, this.user.name, this.user.lastname, this.user.dni, this.user.password);
            this.loading = false;
        } catch (error) {
            //manejar el error (un cartel?)
        }
            
        },
    }
}
</script>

<template>
    <AppH1>Crear una nueva cuenta</AppH1>

    <form action="#"
          @submit.prevent="handleSubmit"
    >
        <div class="mb-4">
            <label for="email" class="mb-2">Email</label>
            <input 
                type="email" 
                id="email" 
                class="w-full p-2 border border-blue-300 rounded"
                v-model="user.email"
                >
        </div>
        <div class="mb-4">
            <label for="name" class="mb-2">Nombre</label>
            <input 
                type="name" 
                id="name" 
                class="w-full p-2 border border-blue-300 rounded"
                v-model="user.name"
                >
        </div>
        <div class="mb-4">
            <label for="lastname" class="mb-2">Apellido</label>
            <input 
                type="lastname" 
                id="lastname" 
                class="w-full p-2 border border-blue-300 rounded"
                v-model="user.lastname"
                >
        </div>
        <div class="mb-4">
            <label for="lastname" class="mb-2">DNI</label>
            <input 
                type="dni" 
                id="dni" 
                class="w-full p-2 border border-blue-300 rounded"
                v-model="user.dni"
                >
        </div>
        <div class="mb-4">
            <label for="password" class="block mb-2">Contraseña</label>
            <input 
                type="password" 
                id="password" 
                class="w-full p-2 border border-blue-300 rounded"
                v-model="user.password"
                >
        </div>
        <MainButton type="submit"
        >
        <template v-if="!loading">Enviar</template>
            <MainLoader v-else />
        </MainButton>
    </form>
</template>