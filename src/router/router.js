import { createRouter, createWebHistory} from 'vue-router';
import { subscribeToUserState } from "../services/auth";


const routes = [
  { path: '/ingresar',              component: () => import('../pages/Login.vue')},
  { path: '/crear-cuenta',          component: () => import('../pages/Register.vue')},
  { path: '/',                      component: () => import('../pages/Home.vue'),             meta:{ requiresAuth: true,},}, 
  { path: '/chat',                  component: () => import('../pages/GlobalChat.vue'),       meta:{ requiresAuth: true,},}, 
  { path: '/mi-perfil',             component: () => import('../pages/MyProfile.vue'),        meta:{ requiresAuth: true,},}, 
  { path: '/mi-perfil/editar',      component: () => import('../pages/MyProfileEdit.vue'),    meta:{ requiresAuth: true,},}, 
  { path: '/usuario/:id',           component: () => import('../pages/UserProfile.vue'),      meta:{ requiresAuth: true,},}, 
  { path: '/usuario/:id/chat',      component: () => import('../pages/PrivateChat.vue'),      meta:{ requiresAuth: true,},}, 
  
    
    
  // Ruta para crear nuevo reporte
  {
    path: '/report/nuevo',
    name: 'NuevoReporte',
    component: () => import('../pages/NewReport.vue'),
  },

  //  Ruta de confirmación después de enviar reporte
  {
    path: '/report/confirmado',
    name: 'ConfirmacionReporte',
    component: () => import('../pages/ReportConfirm.vue'),
  },

  {
  path: '/reportes',
  name: 'VerReportes',
  component: () => import('../pages/ViewReports.vue'),
},

{
  path: '/contactos',
  name: 'ContactosConfianza',
  component: () => import('../pages/Contacts.vue')
},
{
  path: '/recorrido-seguro',
  name: 'Routes',
  component: () => import('../pages/Routes.vue')
}
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