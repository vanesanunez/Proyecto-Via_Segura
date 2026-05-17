import supabase from "./supabase";

export async function createUserProfile(data) {
  const { error } = await supabase.from("user_profiles").insert(data);

  if (error) {
    console.error(
      "[user-profiles.js createUserProfile] Error al crear el perfil del usuario: ",
      error
    );
    throw error;
  }
}

export async function updateUserProfile(id, data) {
  const { error } = await supabase
    .from("user_profiles")
    .update(data)
    .eq("id", id);

  if (error) {
    console.error(
      "[user-profiles.js updateUserProfile] Error al actualizar el perfil del usuario: ",
      error
    );
    throw error;
  }
  return data;
}

export async function getUserProfileById(id) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select()
    .eq("id", id);

  if (error) {
    console.error(
      "[user-profiles.js getUserProfileById] Error al traer el perfil del usuario: ",
      error
    );
    throw error;
  }
  return data[0];
}
export async function fetchAllUserProfiles() {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, name, lastname, email, dni, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[user-profiles.js fetchAllUserProfiles] Error al traer usuarios:",
      error
    );
    throw error;
  }

  return data ?? [];
}

export async function updateUserRole(userId, newRole) {
  const { data, error } = await supabase
    .from("user_profiles")
    .update({ role: newRole })
    .eq("id", userId)
    .select("id, role")
    .single();

  if (error) {
    console.error(
      "[user-profiles.js updateUserRole] Error al actualizar rol:",
      error
    );
    throw error;
  }

  return data;
}