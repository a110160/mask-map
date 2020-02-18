import Vue from 'vue'
import App from './App.vue'
import store from './store'

import axios from 'axios'
import VueAxios from 'vue-axios'
import "leaflet/dist/leaflet.css"
import L from "leaflet";


Vue.use(VueAxios, axios)



Vue.config.productionTip = false

new Vue({
  L,
  store,
  render: h => h(App)
}).$mount('#app')
