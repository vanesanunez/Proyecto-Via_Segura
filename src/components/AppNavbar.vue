<script>
import { RouterLink } from 'vue-router';
import { logout, subscribeToUserState } from '../services/auth';

export default {
    name: 'AppNavbar',
    data() {
        return {
            user: {
                id: null,
                email: null,
            }
        }
    },
    methods: {
        handleLogout() {
            logout();
            this.$router.push('/ingresar');
        }
    },
    mounted() {
        //se suscribe al estado de autenticación
        subscribeToUserState(newUserState => this.user = newUserState);
    }
}
</script>

<template>
    <nav class="flex justify-between items-center gap-8 p-4 colorinst ">
        <RouterLink class="text-xl" to="/">Vía Segura</RouterLink>
        <ul class="flex gap-4">
            <li>
                <RouterLink to="/">Inicio</RouterLink>
            </li>
            <template v-if="user.id !== null">
                <li>
                    <RouterLink to="/chat">Chat</RouterLink>
                </li>
                <li>
                    <RouterLink to="/mi-perfil">Mi perfil</RouterLink>
                </li>
                <li>
                    <form action="#" @submit.prevent="handleLogout">
                        <button type="submit">Cerrar sesión</button>
                    </form>
                </li>
            </template>
            <template v-else>
                <li>
                    <RouterLink to="/ingresar">Ingresar</RouterLink>
                </li>
                <li>
                    <RouterLink to="/crear-cuenta">Crear cuenta</RouterLink>
                </li>
            </template>
        </ul>
    </nav>

</template>
