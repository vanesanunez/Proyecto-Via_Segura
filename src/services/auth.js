import supabase from "./supabase";
import {
  createUserProfile,
  getUserProfileById,
  updateUserProfile,
} from "./user-profiles";

//defino una variable que contenga los datos del usuario ("subject")
let user = {
  id: null,
  email: null,
  name: null,
  lastname: null,
  dni: null,
  role: null,
  photoURL: null,
};

//Array para guardar la lista de observers que deben ser notificados de los cambios en "user"
let observers = [];

//pedimos cargar la data actual del usuario apenas arranca:
loadInitialUserState();

//apenas levanta la aplicación pregunta si hay un usuario en localstorage que figure como autenticado
if (localStorage.getItem("user")) {
  user = JSON.parse(localStorage.getItem("user"));
}

//Carga la información del usuario autenticado,si es que existe alguno
async function loadInitialUserState() {
  const { data } = await supabase.auth.getUser();

  if (!data.user) return;

  updateUser({
    id: data.user.id,
    email: data.user.email,
  });

  loadUserExtendedProfile();
}

async function loadUserExtendedProfile() {
  try {
    const profileData = await getUserProfileById(user.id);

    if (!profileData) {
      console.warn(
        "[auth.js loadUserExtendedProfile] No se encontró perfil para el usuario:",
        user.id,
      );
      return;
    }

    updateUser({
      name: profileData.name,
      lastname: profileData.lastname,
      dni: profileData.dni,
      role: profileData.role,
      photoURL: profileData.photo_url,
    });
  } catch (error) {
    console.error(
      "[auth.js loadUserExtendedProfile] Error al traer perfil extendido del usuario: ",
      error,
    );
  }
}

export async function register(email, name, lastname, dni, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("[auth.js register] Error al crear una cuenta: ", error);
    throw error;
  }

  try {
    await createUserProfile({
      id: data.user.id,
      name,
      lastname,
      dni,
      email,
      photo_url: null,
    });
  } catch (errorProfile) {
    throw errorProfile;
  }


   // Después de registrarse, cerramos la sesión automática.
  // La persona tendrá que iniciar sesión con su nueva cuenta.
  await supabase.auth.signOut();
  
  // Limpiamos cualquier dato que haya quedado del usuario anterior.
  updateUser({
    id: null,
    email: null,
    name: null,
    lastname: null,
    dni: null,
    role: null,
    photoURL: null,
  });
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[auth.js login] Error al iniciar sesión: ", error);
    throw error;
  }

  updateUser({
    id: data.user.id,
    email: data.user.email,
  });

  loadUserExtendedProfile();

  return data.user;
}

export async function logout() {
  supabase.auth.signOut();

  updateUser({
    id: null,
    email: null,
    name: null,
    lastname: null,
    dni: null,
    role: null,
    photoURL: null,
  });
}

/**
 *
 * @param {{ email: string, name: string, lastname: string, photoFile?: File }} data
 */
export async function updateAuthUserProfile(data) {
  try {
    const updatedData = await updateUserProfile(user.id, data);

    updateUser({
      ...updatedData,
      // conservar foto actual si no se subió una nueva
      photoURL: updatedData.photo_url || user.photoURL,
    });
  } catch (error) {
    console.error(
      "[auth.js updateAuthUserProfile] Error al actualizar perfil: ",
      error,
    );
    throw error;
  }
}

//Métodos para el observer//

export function subscribeToUserState(callback) {
  observers.push(callback);

  notify(callback);

  return () => (observers = observers.filter((obs) => obs !== callback));
}

export function notify(callback) {
  callback({ ...user });
}

function notifyAll() {
  observers.forEach((callback) => notify(callback));
}

function updateUser(data) {
  user = {
    ...user,
    ...data,
  };

  if (user.id !== null) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }

  notifyAll();
}
