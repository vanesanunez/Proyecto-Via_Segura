//importaciones globales
import './style.css';
import 'leaflet/dist/leaflet.css';
import '@mdi/font/css/materialdesignicons.css' // iconos mdi


//vuetify primero
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

//Vue y Router
import { createApp } from "vue";
import router from "./router/router";
import App from "./App.vue";

//crear Vuetify y App
const vuetify = createVuetify({ components, directives })
const app = createApp(App);

//usar dependencias en orden
app.use(router);
app.use(vuetify);

//montar la app
app.mount('#app');










