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
  let profileData = { ...data };

  // =========================
  // SUBIR FOTO SI EXISTE
  // =========================
  if (data.photoFile) {
    const file = data.photoFile;

    const fileExt = file.name.split(".").pop();

    const filePath = `profiles/${id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      console.error(
        "[user-profiles.js updateUserProfile] Error al subir imagen: ",
        uploadError
      );
      throw uploadError;
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    profileData.photo_url = publicUrlData.publicUrl;
  }

  // IMPORTANTE:
  // eliminar photoFile antes del update SQL
  delete profileData.photoFile;

  const { error } = await supabase
    .from("user_profiles")
    .update(profileData)
    .eq("id", id);

  if (error) {
    console.error(
      "[user-profiles.js updateUserProfile] Error al actualizar el perfil del usuario: ",
      error
    );
    throw error;
  }

  return profileData;
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