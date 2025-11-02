import './style.css';
import 'leaflet/dist/leaflet.css';
import { createApp } from "vue";
import router from "./router/router";
import App from "./App.vue";

const app = createApp(App);
app.use(router);
app.mount('#app');
app.use(vuetify)

//  Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css' // iconos mdi



const vuetify = createVuetify({ components, directives })

