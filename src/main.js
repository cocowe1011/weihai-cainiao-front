import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import ElementPlus from 'element-plus'; //全局引入element-plus
import zhCn from 'element-plus/es/locale/lang/zh-cn'; //中文语言包（Element Plus 默认英文，需显式指定）
import 'element-plus/dist/index.css'; //全局引入element-plus的样式
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import axios from 'axios';
import './assets/iconfont.css';

axios.defaults.timeout = 20000;

// 缩放：zoomFactor为数字型才执行缩放（如0.6），非数字型(如"")不缩放
const { webFrame, remote } = require('electron');
const zoomFactor = remote.getGlobal('sharedObject').zoomFactor;

if (typeof zoomFactor === 'number') {
  webFrame.setZoomFactor(zoomFactor);
  let rafId = null;
  let checkStart = 0;
  window.addEventListener('resize', () => {
    webFrame.setZoomFactor(zoomFactor);
    checkStart = Date.now();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function check() {
      if (Date.now() - checkStart > 5000) {
        rafId = null;
        return;
      }
      if (Math.abs(webFrame.getZoomFactor() - zoomFactor) > 0.01) {
        webFrame.setZoomFactor(zoomFactor);
      }
      rafId = requestAnimationFrame(check);
    });
  });
}

const app = createApp(App);
// 全局注册element-plus图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
app.use(router);
app.use(store);
app.use(ElementPlus, { locale: zhCn });
app.mount('#app');
