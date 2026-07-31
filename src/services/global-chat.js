import supabase from "../services/supabase";

export async function loadLastGlobalChatMessages() {
  const { data, error } = await supabase
    .from("global_chat")
    .select()
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error(
      "[global-chat.js loadLastGlobalChatMessages] Error al traer los mensajes: ",
      error
    );
    throw error;
  }

  return data;
}

/**
 * Graba un nuevo mensaje de chat
 */
export async function saveGlobalChatMessage(data) {
  const { error } = await supabase
    .from("global_chat")
    .insert({
      user_id: data.user_id,
      email: data.email,
      name: data.name,
      lastname: data.lastname,
      body: data.body,
    });

  if (error) {
    console.error(
      "[global-chat.js saveGlobalChatMessage] Error al insertar el registro:",
      error
    );
    throw error;
  }
}

export function subscribeToGlobalChatNewMessages(callback) {

  const chatChannel = supabase.channel("global-chat", {
    config: {
      broadcast: {
        self: true,
      },
    },
  });

  chatChannel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "global_chat",
    },
    (data) => {
      callback(data.new);
    }
  );

  chatChannel.subscribe();

  return () => {
    supabase.removeChannel(chatChannel);
  };
}

export async function fetchAllGlobalChatMessages() {
  const { data, error } = await supabase
    .from("global_chat")
    .select(
      "id, user_id, email, name, lastname, body, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[global-chat.js fetchAllGlobalChatMessages] Error al traer mensajes:",
      error
    );
    throw error;
  }

  return data ?? [];
}

export async function deleteGlobalChatMessage(messageId) {
  const { error } = await supabase
    .from("global_chat")
    .delete()
    .eq("id", messageId);

  if (error) {
    console.error(
      "[global-chat.js deleteGlobalChatMessage] Error al eliminar mensaje:",
      error
    );
    throw error;
  }
}