// Vue Router配置
// 这是一个可选的路由模块，用于更复杂的单页应用

import { createRouter, createWebHashHistory } from 'vue-router';

// 导入组件（如果需要）
// import UserList from '../popup/components/UserList.vue';
// import CommentList from '../popup/components/CommentList.vue';
// import TagCloud from '../popup/components/TagCloud.vue';
// import SearchBar from '../popup/components/SearchBar.vue';

// 定义路由
const routes = [
  {
    path: '/',
    name: 'home',
    component: {
      template: `
        <div>
          <h1>用户标记与评论收藏器</h1>
          <p>这是一个Vue应用，可以用于更复杂的UI需求。</p>
          <p>当前版本使用原生JavaScript实现。</p>
        </div>
      `
    }
  },
  {
    path: '/users',
    name: 'users',
    component: {
      template: `
        <div>
          <h2>用户列表</h2>
          <p>用户标记管理功能</p>
        </div>
      `
    }
  },
  {
    path: '/comments',
    name: 'comments',
    component: {
      template: `
        <div>
          <h2>评论收藏</h2>
          <p>评论收藏管理功能</p>
        </div>
      `
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: {
      template: `
        <div>
          <h2>设置</h2>
          <p>应用设置管理功能</p>
        </div>
      `
    }
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// 导出路由实例
export default router;