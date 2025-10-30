import supabase from '../services/supabase';

export async function loadLastGlobalChatMessages() {
    const { data, error } = await supabase
    .from('global_chat')
    .select();

    if(error) {
        console.error ('[global-chat.js loadLastGlobalChatMessages] Error al traer los mensajes: ', error);
        throw error;
    }
    return data;
}

/**
 * Graba un nuevo mensaje de chat
 * @param {{email: string, body: string}} data 
 * @returns {promise}
 */
export async function saveGlobalChatMessage(data) {   
    const { error } = await supabase
    .from('global_chat')
    .insert({
        user_id: data.user_id,
        email: data.email,
        body: data.body,
    });
    if(error) {
        console.error('[global-chat.js saveGlobalChatMessage] Error al insertar el registro: ', error);
        throw error;
    }
}

export async function subscribeToGlobalChatNewMessages(callback) {   
    const chatChannel = supabase.channel('global-chat', {
        config: {
            broadcast: {
                self: true,
            }
        },
    });
    chatChannel.on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'global_chat',

        },
        data => {
            callback(data.new);
        }
    );
    chatChannel.subscribe();
}