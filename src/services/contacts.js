import supabase from "./supabase";

//Traer todos los perfiles de usuario
export async function getAllUsers() {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, name, lastname, email")
    .order("name", { ascending: true });

  if (error) {
    console.error("[contacts.js getAllUsers] Error al traer users:", error);
    throw error;
  }
  return data || [];
}

/**
 * Obtener contactos de confianza para un userId
 * - Primero trae las filas de trusted_contacts para el user
 * - Luego trae los user_profiles cuyos ids están en contact_ids
 */
export async function getTrustedContacts(userId) {
  //obtener relaciones
  const { data: rels, error: errRels } = await supabase
    .from("trusted_contacts")
    .select("id, contact_id")
    .eq("user_id", userId);

  if (errRels) {
    console.error(
      "[contacts.js getTrustedContacts] Error al traer relaciones:",
      errRels
    );
    throw errRels;
  }

  if (!rels || rels.length === 0) return []; // sin contactos

  const contactIds = rels.map((r) => r.contact_id);

  // obtener perfiles
  const { data: profiles, error: errProfiles } = await supabase
    .from("user_profiles")
    .select("id, name, lastname, email ")
    .in("id", contactIds);

  if (errProfiles) {
    console.error(
      "[contacts.js getTrustedContacts] Error al traer perfiles:",
      errProfiles
    );
    throw errProfiles;
  }

  // Mapear para incluir el id de la relación (trusted_contact_id)
  return profiles.map((p) => {
    const rel = rels.find((r) => r.contact_id === p.id);
    return {
      id: p.id,
      name: p.name,
      lastname: p.lastname,
      trusted_contact_id: rel ? rel.id : null,
    };
  });
}

//Agregar relación trusted_contacts
export async function addTrustedContact(userId, contactId) {
  const { data, error } = await supabase
    .from("trusted_contacts")
    .insert([{ user_id: userId, contact_id: contactId }]);

  if (error) {
    console.error(
      "[contacts.js addTrustedContact] Error al insertar relación:",
      error
    );
    throw error;
  }
  return data;
}

//Eliminar relación trusted_contacts por el id de la relación
export async function removeTrustedContact(relationId) {
  const { error } = await supabase
    .from("trusted_contacts")
    .delete()
    .eq("id", relationId);

  if (error) {
    console.error(
      "[contacts.js removeTrustedContact] Error al eliminar relación:",
      error
    );
    throw error;
  }
}
