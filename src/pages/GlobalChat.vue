<script>
import { nextTick } from 'vue';
import AppH1 from '../components/AppH1.vue';
import { saveGlobalChatMessage, subscribeToGlobalChatNewMessages, loadLastGlobalChatMessages } from '../services/global-chat';
import { subscribeToUserState } from '../services/auth';
import { RouterLink } from 'vue-router';
import MainLoader from '../components/MainLoader.vue';
import { PaperAirplaneIcon } from '@heroicons/vue/24/solid'; 
import BottomNavigation from '../components/BottomNavigation.vue';


let unsubAuth = () => { };

export default {
    name: 'GlobalChat',
    components: { AppH1, MainLoader, PaperAirplaneIcon, BottomNavigation },

    data() {
        return {
            messages: [],
            loadingMessages: true,

            newMessage: {
                body: '',
            },
            user: {
                id: null,
                email: null,
                name: null,
                lastname: null,
                dni: null,
            }
        }
    },

    methods: {
        async sendMessage() {
            if (!this.newMessage.body.trim()) return; // no enviar mensajes vacíos
            await saveGlobalChatMessage({
                body: this.newMessage.body,
                user_id: this.user.id,
                email: this.user.email,
            });
            this.newMessage.body = "";
        }
    },

    async mounted() {
        unsubAuth = subscribeToUserState(newUserData => (this.user = newUserData));

        try {
            this.messages = await loadLastGlobalChatMessages();
            this.loadingMessages = false;

            await nextTick();
            if (this.$refs.chatContainer) {
                this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight;
            }

            subscribeToGlobalChatNewMessages(async newMessageReceived => {
                this.messages.push(newMessageReceived);
                await nextTick();
                if (this.$refs.chatContainer) {
                    this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight;
                }
            });
        } catch (error) {
            console.error("Error cargando mensajes:", error);
        }
    },

    unmounted() {
        unsubAuth();
    }
}
</script>

<template>
    <AppH1>Chat general</AppH1>

    <div class="flex flex-col md:flex-row gap-4 items-start justify-center md:justify-start">

        <section ref="chatContainer" class="overflow-y-auto w-full h-100 p-2 border border-blue-200 rounded">

            <h2 class="sr-only">Lista de mensajes</h2>

            <ul v-if="!loadingMessages" class="flex flex-col gap-4">
                <li v-for="message in messages" :key="message.id" class="flex flex-col gap-0.5">

                    <div>
                        <RouterLink :to="`/usuario/${message.user_id}`" class="font-bold text-blue-700 underline">
                            {{ message.email }}
                        </RouterLink>
                        dijo:
                    </div>
                    <div>{{ message.body }}</div>
                    <div class="text-sm text-gray-500 italic">{{ message.created_at }}</div>
                </li>
            </ul>

            <div v-else class="flex justify-center items-center h-full">
                <MainLoader />
            </div>
        </section>

        <section class="md:w-3/12 w-full flex flex-col">

            <form @submit.prevent="sendMessage" class="flex gap-2 items-center">

                <input type="text" v-model="newMessage.body" placeholder="Escribí un mensaje..."
                    class="flex-1 p-2 border border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" />

                <button type="submit"
                    class="p-2 bg-blue-600 rounded-full hover:bg-blue-500 active:bg-blue-700 text-white flex items-center justify-center">
                    <PaperAirplaneIcon class="h-5 w-5 "/> 
                </button>
            </form>
        </section>
    </div>
    <BottomNavigation />
</template>
