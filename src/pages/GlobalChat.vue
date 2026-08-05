
<script>
import { nextTick } from 'vue';
import {
    saveGlobalChatMessage,
    subscribeToGlobalChatNewMessages,
    loadLastGlobalChatMessages
} from '../services/global-chat';

import { subscribeToUserState } from '../services/auth';
import MainLoader from '../components/MainLoader.vue';
import { PaperAirplaneIcon } from '@heroicons/vue/24/solid';

let unsubAuth = () => { };
let unsubscribeChat = null;

export default {
    name: 'GlobalChat',

    components: {
        MainLoader,
        PaperAirplaneIcon,
    },

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
        };
    },

    methods: {

        getInitials(message) {

            if (!message) return 'U';

            const first = message.name?.charAt(0) || '';
            const last = message.lastname?.charAt(0) || '';

            const initials = `${first}${last}`.toUpperCase();

            if (initials) return initials;

            if (message.email) {
                return message.email.substring(0, 2).toUpperCase();
            }

            return 'U';
        },

        formatUserName(message) {

            if (!message) return 'Usuario';

            if (message.user_id === this.user.id) {
                return 'Vos';
            }

            const fullName =
                `${message.name || ''} ${message.lastname || ''}`.trim();

            if (fullName.length > 0) {
                return fullName;
            }

            return message.email?.split('@')[0] || 'Usuario';
        },
        formatTime(dateString) {

            if (!dateString) return '';

            return new Date(dateString).toLocaleTimeString(
                'es-AR',
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            );
        },

        async sendMessage() {

            if (!this.newMessage.body.trim()) return;

            await saveGlobalChatMessage({
                body: this.newMessage.body,
                user_id: this.user.id,
                email: this.user.email,
                name: this.user.name,
                lastname: this.user.lastname,
            });

            this.newMessage.body = '';
        },

        async scrollToBottom() {
            await nextTick();

            if (this.$refs.chatContainer) {
                this.$refs.chatContainer.scrollTop =
                    this.$refs.chatContainer.scrollHeight;
            }
        },
    },

    async mounted() {

        unsubAuth = subscribeToUserState(
            newUserData => (this.user = newUserData)
        );

        try {

            const allMessages =
                await loadLastGlobalChatMessages();

            this.messages = allMessages.reverse();

            this.loadingMessages = false;

            await this.scrollToBottom();

            unsubscribeChat =
                subscribeToGlobalChatNewMessages(
                    async (newMessage) => {

                        this.messages.push(newMessage);

                        if (this.messages.length > 6) {
                            this.messages.shift();
                        }

                        await this.scrollToBottom();
                    }
                );

        } catch (error) {

            console.error(
                '[GlobalChat] Error cargando mensajes:',
                error
            );
        }
    },

    unmounted() {

        unsubAuth();

        if (unsubscribeChat) {
            unsubscribeChat();
        }
    }
};
</script>

<template>

    <div class="min-h-screen bg-[#f7f9fc] pb-28">
        <!-- HEADER -->
        <div class="mt-4 flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <button @click="$router.back()"
                class="flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#2a2a2a"
                    stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div class="min-w-0">
                <h1 class="text-base font-semibold leading-tight">Chat general</h1>
                <p class="text-xs mt-1" style="color:#6b7280;">Conectate con tu comunidad y compartí información útil
                    para ayudar a construir barrios más seguros.</p>
            </div>
        </div>


        <!-- CHAT -->

        <section ref="chatContainer" class="
        px-4
        mt-5
        overflow-y-auto
        " style="height: calc(100vh - 290px);">

            <div v-if="loadingMessages" class="
            flex
            justify-center
            items-center
            h-full
            ">
                <MainLoader />
            </div>

            <TransitionGroup v-else tag="ul" name="message" class="space-y-5">

                <li v-for="message in messages" :key="message.id">

                    <div class="flex gap-3" :class="{
                        'justify-end':
                            message.user_id === user.id
                    }">

                        <!-- Avatar -->

                        <div v-if="message.user_id !== user.id" class="shrink-0">

                            <div class="
                            w-11
                            h-11
                            rounded-full
                            flex
                            items-center
                            justify-center
                           bg-linear-to-br
                            from-[#d6e8fb]  
                            to-[#b8d6fa]
                                border
                                border-[#c4dcf8]
                                    shadow-sm
                            ">

                                <span class="
                                text-[#085baf]
                                font-bold
                                text-sm
                                ">
                                    {{
                                        getInitials(message)
                                    }}
                                </span>

                            </div>

                        </div>

                        <!-- MENSAJE -->

                        <div class="max-w-[80%]">

                            <div class="
                            flex
                            items-center
                            gap-2
                            mb-1.5
                            " :class="{
                                'justify-end':
                                    message.user_id === user.id
                            }">

                                <span class="
                                text-sm
                                font-semibold
                                text-[#2a2a2a]
                                ">
                                    {{ formatUserName(message) }}
                                </span>

                            </div>

                            <div class="
                            rounded-3xl
                            px-4
                            py-3
                            shadow-sm
                            wrap-break-word
                            " :class="message.user_id === user.id
                                ? 'bg-[#3082e3] text-white'
                                : 'bg-white border border-[#d6e8fb] text-[#2a2a2a]'
                                ">
                                {{ message.body }}
                            </div>

                            <div class="
                            text-xs
                            text-gray-400
                            mt-1
                            px-2
                            " :class="{
                                'text-right':
                                    message.user_id === user.id
                            }">
                                {{ formatTime(message.created_at) }}
                            </div>

                        </div>

                    </div>

                </li>

            </TransitionGroup>

        </section>

        <!-- INPUT -->

        <section class="
        fixed
        bottom-0
        left-0
        right-0
        bg-white
        border-t
        border-[#d6e8fb]
        px-4
        py-4
        ">

            <form @submit.prevent="sendMessage" class="max-w-4xl mx-auto">

                <div class="
                flex
                items-center
                gap-3
                bg-[#f7f9fc]
                border
                border-[#d6e8fb]
                rounded-full
                p-2
                shadow-sm
                ">

                    <input type="text" v-model="newMessage.body" placeholder="Escribí un mensaje..." class="
                    flex-1
                    bg-transparent
                    px-3
                    text-[#2a2a2a]
                    outline-none
                    " />

                    <button type="submit" class="
                    w-11
                    h-11
                    rounded-full
                    bg-[#3082e3]
                    text-white
                    flex
                    items-center
                    justify-center
                    transition-all
                    duration-200
                    hover:scale-105
                    active:scale-95
                    ">
                        <PaperAirplaneIcon class="w-5 h-5" />
                    </button>

                </div>

            </form>

        </section>

    </div>

</template>

<style scoped>
.message-enter-active {
    transition: all .25s ease;
}

.message-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.message-move {
    transition: all .25s ease;
}
</style>
```
