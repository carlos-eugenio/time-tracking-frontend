import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import "@flaticon/flaticon-uicons/css/regular/rounded.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter } from "./router";

import App from "./App.vue";

const app = createApp(App);
app.use(createPinia());
app.use(createRouter());
app.mount("#app");
