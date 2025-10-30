<script>
import AppH1 from '../components/AppH1.vue';
import { subscribeToUserState, updateAuthUserProfile } from '../services/auth';
import MainLoader from '../components/MainLoader.vue';
import MainButton from '../components/MainButton.vue';


//Variable para guardar la función de cancelar la suscripción a la autenticación.
let unsubAuth = () => { }

export default {
    name: 'MyProfileEdit',
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
            profile: {
                email: null,
                name: null,
                lastname: null,
            },
            updating: false,

            feedback: {
                type: 'success',
                message: null,
            }
        }
    },
    methods: {
        async handleSubmit() {
            this.feedback.message = null;

            try {
                this.updating = true;
                await updateAuthUserProfile({
                    ...this.profile
                });
                this.updating = false;

                this.feedback = {
                    type: 'success',
                    message: 'Tu perfil se actualizó con éxito.',
                    
                }

            } catch (error) {
                this.feedback = {
                    type: 'error',
                    message: 'Ocurrió un error al actualizar el perfil.',
                }
            }
        }
    },
    mounted() {
        unsubAuth = subscribeToUserState(newUserState => {
            this.user = newUserState;

            //datos iniciales del form
            this.profile = {
                email: this.user.email,
                name: this.user.name,
                lastname: this.user.lastname,
            }
        });
    },
    unmounted() {
        //cancelar la suscripción 
        unsubAuth();
    }
}
</script>

<template>
    <div class="flex gap-4 items-end">
        <AppH1>Editar mi perfil</AppH1>
    </div>

    <div
        v-if="feedback.message != null"
        class="p-4 mb-4 rounded"
        :class="{
            'bg-red-100 text-red-700' : feedback.type === 'error',
            'bg-green-100 text-green-700' : feedback.type === 'success',
        }"
    >
        {{ feedback.message }}
    </div>

    <form action="#" @submit.prevent="handleSubmit">
        <div class="mb-4">
            <label for="email" class="block mb-2">Email</label>
            <input type="text" id="email" class="w-full p-2 border border-blue-400 rounded" v-model="profile.email">
        </div>
        <div class="mb-4">
            <label for="name" class="block mb-2">Nombre</label>
            <input type="text" id="name" class="w-full p-2 border border-blue-400 rounded" v-model="profile.name">
        </div>
        <div class="mb-4">
            <label for="lastname" class="block mb-2">Apellido</label>
            <input type="text" id="lastname" class="w-full p-2 border border-blue-400 rounded"
                v-model="profile.lastname">
        </div>
        <MainButton type="submit"
        >
            <template v-if="!updating" >Actualizar</template>
            <MainLoader v-else />
        </MainButton>
    </form>

</template>