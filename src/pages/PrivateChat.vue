<script>
import { nextTick } from 'vue';
import AppH1 from '../components/AppH1.vue';
import MainLoader from '../components/MainLoader.vue';
import { subscribeToUserState } from '../services/auth';
import { getLastPrivateChatMessages, sendPrivateChatMessage, subscribeToPrivateChatNewMessages } from '../services/private-chats';
import { getUserProfileById } from '../services/user-profiles';

export default {
    name: 'PrivateChat',
    components: { AppH1, MainLoader },
    data() {
        return {
            userAuth: {
                id: null,
                email: null,
                name: null,
                lastname: null,
            },

            userChat: {
                id: null,
                email: null,
                name: null,
                lastname: null,
            },
            loadingUser: false,
            messages: [],
            loadingMessages: false,
            NewMessage: {
                body: '',
            }
        }
    },
    methods: {
        async sendMessage() {
            if (!this.NewMessage.body.trim()) return; // no enviar mensajes vacíos
            try {
                await sendPrivateChatMessage(this.userAuth.id, this.userChat.id, this.NewMessage.body);
                this.NewMessage.body = '';
            } catch (error) {
                console.error("Error enviando mensaje:", error);
            }
        }
    },
    async mounted() {
        try {
            // Esperar a que userAuth esté disponible
            await new Promise(resolve => {
                subscribeToUserState(user => {
                    this.userAuth = user;
                    resolve();
                });
            });

            this.loadingUser = true;
            this.loadingMessages = true;

            // Traer información del usuario con el que chateamos
            this.userChat = await getUserProfileById(this.$route.params.id);
            this.loadingUser = false;

            // Suscribirse a nuevos mensajes
            subscribeToPrivateChatNewMessages(this.userAuth.id, this.userChat.id, async newMessage => {
                this.messages.push(newMessage);
                await nextTick();
                if (this.$refs.chatContainer) {
                    this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight;
                }
            });

            // Traer últimos mensajes
            this.messages = await getLastPrivateChatMessages(this.userAuth.id, this.userChat.id);
            this.loadingMessages = false;
            await nextTick();
            if (this.$refs.chatContainer) {
                this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight;
            }

        } catch (error) {
            console.error("Error en mounted:", error);
        }
    }
}
</script>

<template>
    <template v-if="!loadingUser">

        <header class="flex items-center gap-3 p-3 border-b border-gray-200 shadow-sm bg-white">

            <div class="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M5.121 17.804A8.966 8.966 0 0112 15a8.966 8.966 0 016.879 2.804M12 12a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
            </div>

            <h2 class="text-lg font-semibold">{{ userChat.name }}</h2>
        </header>


        <section ref="chatContainer" class="overflow-y-auto h-100 p-4 mb-4 border border-blue-400 rounded">

            <h2 class="sr-only">Lista de mensajes</h2>

            <ul v-if="!loadingMessages" class="flex flex-col gap-4">
                <li v-for="message in messages" :key="message.id" class="flex flex-col gap-0.5 max-w-8/12 p-4 rounded"
                    :class="{
                        'bg-gray-100': message.sender_id !== userAuth.id,
                        'bg-green-100 self-end': message.sender_id === userAuth.id,
                    }">
                    <div>{{ message.body }}</div>
                    <div class="text-sm text-gray-600">{{ message.created_at }}</div>
                </li>
            </ul>

            <div v-else class="flex justify-center items-center h-full">
                <MainLoader />
            </div>
        </section>

        <section>
            <form @submit.prevent="sendMessage" class="flex gap-2 items-center">

                <input type="text" v-model="NewMessage.body" placeholder="Escribí un mensaje..."
                    class="flex-1 p-2 border border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" />


                <button type="submit"
                    class="p-2 bg-blue-600 rounded-full hover:bg-blue-500 active:bg-blue-700 text-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M14.752 11.168l-9.193-5.39a1 1 0 00-1.447.894v10.756a1 1 0 001.447.894l9.193-5.39a1 1 0 000-1.768z" />
                    </svg>
                </button>
            </form>
        </section>
    </template>

    <MainLoader v-else />
</template>
