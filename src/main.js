// src/main.js
const resizeObserverErrHandler = (err) => {
    if (err.message.includes('ResizeObserver')) {
      return false; // 阻止错误传播
    }
  };
  window.addEventListener('error', resizeObserverErrHandler);
import { createApp } from 'vue';
import { createPinia } from 'pinia'; // 如果你使用 Pinia
import ElementPlus from 'element-plus'; // 引入 Element Plus
import 'element-plus/dist/index.css'; // 引入 Element Plus 样式
// 如果需要，可以引入 Element Plus 图标
// import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue';
import router from './router'; // 假设你使用了 Vue Router

// --- 清理 Vant ---
// import Vant from 'vant'; // 移除
// import 'vant/lib/index.css'; // 移除

const app = createApp(App);

// --- 注册 Element Plus 图标 (如果需要) ---
// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component)
// }

// --- 注册 Pinia (如果使用) ---
const pinia = createPinia();
app.use(pinia);

app.use(router); // 使用 Vue Router
app.use(ElementPlus); // 全局注册 Element Plus

app.mount('#app');