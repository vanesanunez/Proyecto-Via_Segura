<script>
import { RouterLink } from 'vue-router';
import AppH1 from '../components/AppH1.vue';
import MainLoader from '../components/MainLoader.vue';
import { getUserProfileById } from '../services/user-profiles';
import MainButton from '../components/MainButton.vue';

export default {
    name: 'UserProfile',
    components: { AppH1, MainLoader, MainButton },
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
    <div class="p-4">

        <template v-if="!loading">
            <AppH1 class="text-center">Perfil de {{ user.email }}</AppH1>

            <div
                class="bg-gray-50 flex flex-col border-gray-200 gap-2 p-2 sm:flex-row sm:items-center sm:gap-6 sm:py-4 mb-4">
                <img class="mx-auto block h-12 rounded-full sm:mx-0 sm:shrink-0"
                    src="https://i.pinimg.com/474x/2a/41/40/2a414093e5999810ac5f40783a0f1f7f.jpg" alt="icono usuario" />
                <div class="space-y-2 text-center sm:text-left">
                    <div class="space-y-0.5">
                        <p class="text-lg font-semibold text-black">{{ user.display_name }}</p>
                    </div>

                    <MainButton>
                        <RouterLink :to="`/usuario/${user.id}/chat`" class="text-white">Enviar mensaje</RouterLink>
                    </MainButton>

                </div>
            </div>

            <dl class="mb-4">
                <dt class="font-bold mb-2">Email</dt>
                <dd class="mb-4">{{ user.email }}</dd>
                <dt class="font-bold mb-2">Nombre</dt>
                <dd class="mb-4">{{ user.name }}</dd>
                <dt class="font-bold mb-2">Apellido</dt>
                <dd class="mb-4">{{ user.lastname }}</dd>
            </dl>
        </template>

        <div v-else class="flex justify-center items-center h-full">
            <MainLoader />
        </div>
    </div>
</template>