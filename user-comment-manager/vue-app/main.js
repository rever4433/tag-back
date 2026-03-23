// Vue应用入口文件
// 这是一个可选的Vue应用，用于更复杂的UI需求
// 当前版本使用原生JavaScript实现，但保留此结构以备将来扩展

import { createApp } from 'vue';
import store from './store.js';
import router from './router.js';

// 创建Vue应用
const app = createApp({
  // 根组件
  template: `
    <div id="vue-app">
      <router-view />
    </div>
  `
});

// 使用Vuex状态管理
app.use(store);

// 使用Vue Router
app.use(router);

// 挂载应用
// app.mount('#vue-app');

// 导出应用实例
export default app;