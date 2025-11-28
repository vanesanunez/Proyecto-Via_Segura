import './style.css';
import 'leaflet/dist/leaflet.css';
import { createApp } from "vue";
import router from "./router/router";
import App from "./App.vue";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";



const app = createApp(App);
app.use(router);
app.mount('#app');










