import { createRouter, createWebHistory} from 'vue-router';
import { subscribeToUserState } from "../services/auth";
import supabase from "../services/supabase";
//import { consoleError } from 'vuetify/lib/util/console.mjs';


const routes = [
  { path: '/ingresar',                  component: () => import('../pages/Login.vue')},
  { path: '/crear-cuenta',              component: () => import('../pages/Register.vue')},
  { path: '/',                          component: () => import('../pages/Home.vue'),               meta:{ requiresAuth: true,},}, 
  { path: '/chat',                      component: () => import('../pages/GlobalChat.vue'),         meta:{ requiresAuth: true,},}, 
  { path: '/mi-perfil',                 component: () => import('../pages/MyProfile.vue'),          meta:{ requiresAuth: true,},}, 
  { path: '/mi-perfil/editar',          component: () => import('../pages/MyProfileEdit.vue'),      meta:{ requiresAuth: true,},}, 
  { path: '/usuario/:id',               component: () => import('../pages/UserProfile.vue'),        meta:{ requiresAuth: true,},}, 
  { path: '/usuario/:id/chat',          component: () => import('../pages/PrivateChat.vue'),        meta:{ requiresAuth: true,},},   
  { path: '/report/nuevo',              component: () => import('../pages/NewReport.vue'),          meta:{ requiresAuth: true,},},
  { path: '/report/confirmado',         component: () => import('../pages/ReportConfirm.vue'),      meta:{ requiresAuth: true,},},
  { path: '/reportes',                  component: () => import('../pages/ViewReports.vue'),        meta:{ requiresAuth: true,},},
  { path: '/contactos',                 component: () => import('../pages/Contacts.vue'),           meta:{ requiresAuth: true,},},
  { path: '/compartir',                 component: () => import('../pages/SharePathPage.vue'),      meta:{ requiresAuth: true,},},
  { path: '/ver-recorrido/:pathId',     component: () => import('../pages/ViewSharedPathPage.vue'), meta:{ requiresAuth: true,},},
  { path: '/info',                      component: () => import('../pages/Info.vue'),               meta:{ requiresAuth: true,},},
  { path: '/puntos-seguros',            component: () => import('../pages/Points.vue'),             meta:{ requiresAuth: true,},},
  { path: '/admin/dashboard',           component: () => import('../pages/AdminDashboard.vue'),     meta: { requiresAuth: true, requiresAdmin: true },},
  { path: '/admin/reportes',            component: () => import('../pages/AdminReports.vue'),       meta: { requiresAuth: true, requiresAdmin: true },},
  { path: '/admin/usuarios',            component: () => import('../pages/AdminUsers.vue'),         meta: { requiresAuth: true, requiresAdmin: true },},
  { path: '/admin/chat',                component: () => import('../pages/AdminChat.vue'),          meta: { requiresAuth: true, requiresAdmin: true },},
  {  path: '/admin/reportes/:id/editar',  component: () => import('../pages/AdminEditReport.vue'),  meta: { requiresAuth: true, requiresAdmin: true },},


];

const router = createRouter({
    routes,
    history: createWebHistory(),
});

//1ro verifico que el usuario está autenticado
let user = {
  id: null,
  email: null,
  role: null,
}
subscribeToUserState(newUserData => user = newUserData);

async function isAdmin(){
  const{ data,error } = await supabase.auth.getUser();

  if (error || !data.user){
    return false;
  }

  const { data: profile, error: profileError } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('id', data.user.id)
  .single();

  if (profileError){
    console.error('[router] Error al verificar rol admin:', profileError);
    return false;
  }

  return profile?.role === 'admin';
}

//navigation guard
router.beforeEach(async (to, from) => {  
  if(to.meta.requiresAuth && user.id === null){  //si el usuario no está autenticado redireccionamos a iniciar sesión
      return '/ingresar';
  }

  if (to.meta.requiresAdmin){
    const admin = await isAdmin();

    if (!admin){
      return '/';
    }
  }
    return true;
});

export default router;