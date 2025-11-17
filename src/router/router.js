import { createRouter, createWebHistory} from 'vue-router';
import { subscribeToUserState } from "../services/auth";


const routes = [
  { path: '/ingresar',                  component: () => import('../pages/Login.vue')},
  { path: '/crear-cuenta',              component: () => import('../pages/Register.vue')},
  { path: '/',                          component: () => import('../pages/Home.vue'),               meta:{ requiresAuth: true,},}, 
  { path: '/chat',                      component: () => import('../pages/GlobalChat.vue'),         meta:{ requiresAuth: true,},}, 
  { path: '/mi-perfil',                 component: () => import('../pages/MyProfile.vue'),          meta:{ requiresAuth: true,},}, 
  { path: '/mi-perfil/editar',          component: () => import('../pages/MyProfileEdit.vue'),      meta:{ requiresAuth: true,},}, 
  { path: '/usuario/:id',               component: () => import('../pages/UserProfile.vue'),        meta:{ requiresAuth: true,},}, 
  { path: '/usuario/:id/chat',          component: () => import('../pages/PrivateChat.vue'),        meta:{ requiresAuth: true,},},   
  // Ruta para crear nuevo reporte
  { path: '/report/nuevo',              component: () => import('../pages/NewReport.vue'),          meta:{ requiresAuth: true,},},
  //  Ruta de confirmación después de enviar reporte
  { path: '/report/confirmado',         component: () => import('../pages/ReportConfirm.vue'),      meta:{ requiresAuth: true,},},
  { path: '/reportes',                  component: () => import('../pages/ViewReports.vue'),        meta:{ requiresAuth: true,},},
  { path: '/contactos',                 component: () => import('../pages/Contacts.vue'),           meta:{ requiresAuth: true,},},
  { path: '/recorrido-seguro',          component: () => import('../pages/Routes.vue'),             meta:{ requiresAuth: true,},},
  { path: '/compartir',                 component: () => import('../pages/SharePathPage.vue'),      meta:{ requiresAuth: true,},},
  { path: '/ver-recorrido/:pathId',     component: () => import('../pages/ViewSharedPathPage.vue'), meta:{ requiresAuth: true,},},
];

const router = createRouter({
    routes,
    history: createWebHistory(),
});

//1ro verifico que el usuario está autenticado
let user = {
  id: null,
  email: null,
}
subscribeToUserState(newUserData => user = newUserData);

//navigation guard
router.beforeEach((to, from) => {  
  if(to.meta.requiresAuth && user.id === null){  //si el usuario no está autenticado redireccionamos a iniciar sesión
      return '/ingresar';
  }
});

export default router;