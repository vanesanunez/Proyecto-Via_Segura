
/*import '@mdi/font/css/materialdesignicons.css' 
import 'vuetify/styles'*/



import './style.css';
import 'leaflet/dist/leaflet.css';

//Vue y Router
import { createApp } from "vue";
import router from "./router/router";
import App from "./App.vue";

// Vuetify
// import 'vuetify/styles'
// import { createVuetify } from 'vuetify'
// import * as components from 'vuetify/components'
// import * as directives from 'vuetify/directives'

// Components
// import App from './App.vue'

// const vuetify = createVuetify({
//   components,
//   directives,
// })

const app = createApp(App);
app.use(router);
app.mount('#app');










