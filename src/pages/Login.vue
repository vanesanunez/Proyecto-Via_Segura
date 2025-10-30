<script>
import AppH1 from '../components/AppH1.vue';
import MainButton from '../components/MainButton.vue';
import MainLoader from '../components/MainLoader.vue';
import { login } from '../services/auth';


export default {
    name: 'Login',
    components: { AppH1, MainLoader, MainButton },
    data() {
        return {
            user: {
                email: '',
                password: '',
            },
            loading: false,
        }
    },
    methods: {
        async handleSubmit() {
            try {
                this.loading = true;
                const user = await login(this.user.email, this.user.password);
                this.loading = false;
                this.$router.push('/');
            } catch (error) {
                //manejar el error
            }
        }
    },
    
}
</script>

<template>
    <AppH1>Ingresar a mi cuenta</AppH1>

    <div v-if="loading" class="flex justify-center items-center h-full">
    <MainLoader />
    </div>

    <form v-else
        action="#"
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
        <template v-if="!loading">Ingresar</template>
            <MainLoader v-else />
        </MainButton>
    </form>

</template>