<script>
import { nextTick } from 'vue';
import AppH1 from '../components/AppH1.vue';
import MainButton from '../components/MainButton.vue';
import MainLoader from '../components/MainLoader.vue';
import { subscribeToUserState } from '../services/auth';
import { getLastPrivateChatMessages, sendPrivateChatMessage, subscribeToPrivateChatNewMessages } from '../services/private-chats';
import { getUserProfileById } from '../services/user-profiles';

export default {
    name: 'PrivateChat',
    components: { AppH1, MainLoader, MainButton },
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
            try {
                sendPrivateChatMessage(this.userAuth.id, this.userChat.id, this.NewMessage.body);
                this.NewMessage.body = '';
            } catch (error) {
                //manejar error
            }
        }
    },
    async mounted() {
    try {
        subscribeToUserState(newDataUser => this.userAuth = newDataUser);

        this.loadingUser = true;
        this.loadingMessages = true;

        this.userChat = await getUserProfileById(this.$route.params.id);
        this.loadingUser = false;

        subscribeToPrivateChatNewMessages(this.userAuth.id, this.userChat.id, async newMessage => {
            this.messages.push(newMessage);
            await nextTick(); // scroll hacia abajo, para que se muestren los último msjs
            if (this.$refs.chatContainer) {
                this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight;
            }
        });

        this.messages = await getLastPrivateChatMessages(this.userAuth.id, this.userChat.id);
        this.loadingMessages = false; 
        await nextTick(); // scroll hacia abajo, para que se muestren los último msjs
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
        <AppH1>Chat privado con {{ userChat.email }}</AppH1>
        <section 
            ref="chatContainer" 
            class="overflow-y-auto h-100 p-4 mb-4 border border-blue-400 rounded">

            <h2 class="sr-only">Lista de mensajes</h2>

            <ul v-if="!loadingMessages" 
                class="flex flex-col items-start gap-4">
                <li 
                    v-for="message in messages" 
                    :key="message.id" 
                    class="flex flex-col gap-0.5 max-w-8/12 p-4 rounded"
                    :class="{
                        'bg-gray-100': message.sender_id !== userAuth.id,
                        'bg-green-100 self-end': message.sender_id === userAuth.id,
                    }"
                    >
                    
                    <div>{{ message.body }}</div>
                    <div class="text-sm text-gray-600">{{ message.created_at }}</div>
                </li>
            </ul>
            <div v-else class="flex justify-center items-center h-full">
                <MainLoader />
            </div>
        </section>
        <section>
            <h2 class="sr-only">Enviar un mensaje</h2>

            <form 
                class="flex items-stretch gap-4" 
                action="#" @submit.prevent="() => sendMessage()"
            >
                <div class="w-full">
                    <label for="body" class="sr-only">Mensaje</label>
                    <textarea 
                        id="body" 
                        class="w-full p-2 border border-r-blue-400 rounded"
                        v-model="NewMessage.body"
                        ></textarea>
                </div>
                <MainButton>Enviar</MainButton>
            </form>
        </section>
    </template>
    <MainLoader v-else />
</template>