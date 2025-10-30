import supabase from "./supabase";
import { createUserProfile, getUserProfileById, updateUserProfile } from "./user-profiles";

//defino una variable que contenga los datos del usuario ("subject")
let user = {
  id: null,
  email: null,
  name: null,
  lastname: null,
  dni: null,
};
//Array para guardar la lista de observers que deben ser notificados de los cambios en "user"
let observers = [];

//pedimos cargar la data actual del usuario apenas arranca:
loadInitialUserState();

//apenas levanta la aplicación pregunta si hay un usuario en localstorage que figure como autenticado
if(localStorage.getItem('user')) {
  user = JSON.parse(localStorage.getItem('user'));  //si hay usuario lo parseo y guardo en la variable "user"
}

//Carga la información del usuario autenticado,si es que existe alguno
async function loadInitialUserState() {
  const { data } = await supabase.auth.getUser();

  if (!data.user) return;

  updateUser({
    id: data.user.id,
    email: data.user.email,
  });

    //traemos los datos faltantes (los que agregué después, nombre,apellido y dni)
    loadUserExtendedProfile();
}

async function loadUserExtendedProfile() {
  try {
    const profileData = await getUserProfileById(user.id);

    updateUser({
      name: profileData.name,
      lastname: profileData.lastname,
      dni: profileData.dni,
    });
  } catch (error) {
    console.error(
      "[auth.js loadUserExtendedProfile] Error al traer perfil extendido del usuario: ",
      error
    );
    throw error;
  }
}

export async function register(email, name, lastname, dni, password) {
  //método signUp() de auth de supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    name,
    lastname,
    dni,
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
    });
  } catch (errorProfile) {
    throw errorProfile;
  }

  //guardar los datos del usuario autenticado notificar a los observers del cambio
  updateUser({
    id: data.user.id,
    email: data.user.email,
  });
  
}

export async function login(email, password) {
  //método signInWithPassword() de auth de supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[auth.js login] Error al iniciar sesión: ", error);
    throw error;
  }

  //guardar los datos del usuario autenticado notificar a los observers del cambio
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
  });
}

/**
 * 
 * @param {{ email: string, name: string, lastname: string}} data 
 */
export async function updateAuthUserProfile(data) {
    try {
        await updateUserProfile(user.id, data);

        updateUser(data);
    } catch (error) {
        console.error("[auth.js updateAuthUserProfile] Error al actualizar perfil: ", error);
        throw error;
    }
}


//Métodos para el observer//

/**
 * Suscribe un obseerver que se va a ejecutar cada vez que los datos del usuario autenticado cambien.
 * El observer  debe ser una función (callback) que recibe como argumento el objeto con los datos del usuario.
 * Retorna una nueva función que permite cancelar la suscripción.
 * 
 * @param {({id: string|null, email:string|null}) => void} callback
 */
export function subscribeToUserState(callback) {
  //Agregamos el callback al stack de observers
  observers.push(callback);

  //ejecutamos el callback para pasarle los datos actuales
  notify(callback);

  //retornamos una nueva función que elimina el callback de la lista de observers
  return () => observers = observers.filter(obs => obs !== callback);
}


/**
 * invoca un observer y le pasa los datos del usuario
 * @param {({id: string|null, email:string|null}) => void} callback
 */
export function notify(callback) {
  callback({ ...user });
}

/**
 * notifica a todos los observers cada vez que ocurra un cambio (en la variable "user")
 */
function notifyAll() {
  observers.forEach((callback) => notify(callback));
  //observers.forEach(notify);
}

/**
 * función para notificar a todos los observers de lso cambios del subject
 * @param {{id?: string||null, email?: string|null}} data
 */
function updateUser(data) {
  user = {
    ...user,
    ...data,
  }

  if(user.id !== null){
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }

  notifyAll();
}
