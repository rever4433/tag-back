// 弹出窗口逻辑
import helpers from '../utils/helpers.js';

class PopupApp {
  constructor() {
    this.currentTab = 'users';
    this.currentFilter = null;
    this.searchQuery = '';
    this.users = {};
    this.comments = {};
    this.tags = [];
  }

  // 初始化
  async init() {
    // 绑定事件
    this.bindEvents();

    // 加载数据
    await this.loadData();

    // 渲染界面
    this.render();
  }

  // 绑定事件
  bindEvents() {
    // 标签页切换
    document.querySelectorAll('.ucm-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // 搜索
    document.getElementById('btn-search').addEventListener('click', () => {
      this.handleSearch();
    });

    document.getElementById('search-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch();
      }
    });

    // 导出
    document.getElementById('btn-export').addEventListener('click', () => {
      this.handleExport();
    });

    // 导入
    document.getElementById('btn-import').addEventListener('click', () => {
      this.showImportModal();
    });

    // 设置
    document.getElementById('btn-settings').addEventListener('click', () => {
      this.openSettings();
    });

    // 导入对话框
    document.getElementById('btn-cancel-import').addEventListener('click', () => {
      this.hideImportModal();
    });

    document.getElementById('btn-confirm-import').addEventListener('click', () => {
      this.handleImport();
    });

    // 标签云点击
    document.getElementById('tag-cloud').addEventListener('click', (e) => {
      if (e.target.classList.contains('ucm-tag-cloud-item')) {
        this.handleTagClick(e.target.dataset.tag);
      }
    });
  }

  // 加载数据
  async loadData() {
    try {
      // 发送消息到后台获取数据
      const usersResponse = await this.sendMessage('getMarkedUsers');
      const commentsResponse = await this.sendMessage('getSavedComments');
      const tagsResponse = await this.sendMessage('getAllTags');

      if (usersResponse.success) {
        this.users = usersResponse.data;
      }

      if (commentsResponse.success) {
        this.comments = commentsResponse.data;
      }

      if (tagsResponse.success) {
        this.tags = tagsResponse.data;
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      this.showNotification('加载数据失败: ' + error.message, 'error');
    }
  }

  // 渲染界面
  render() {
    this.renderStats();
    this.renderTagCloud();
    this.renderUserList();
    this.renderCommentList();
  }

  // 渲染统计信息
  renderStats() {
    const userCount = Object.keys(this.users).length;
    const commentCount = Object.keys(this.comments).length;

    document.getElementById('user-count').textContent = userCount;
    document.getElementById('comment-count').textContent = commentCount;
  }

  // 渲染标签云
  renderTagCloud() {
    const container = document.getElementById('tag-cloud');
    container.innerHTML = '';

    if (this.tags.length === 0) {
      container.innerHTML = '<div style="color: #999; font-size: 12px;">暂无标签</div>';
      return;
    }

    // 添加"全部"标签
    const allTag = document.createElement('div');
    allTag.className = 'ucm-tag-cloud-item' + (this.currentFilter === null ? ' active' : '');
    allTag.textContent = '全部';
    allTag.dataset.tag = 'all';
    container.appendChild(allTag);

    // 添加其他标签
    this.tags.forEach(tag => {
      const tagElement = document.createElement('div');
      tagElement.className = 'ucm-tag-cloud-item' + (this.currentFilter === tag ? ' active' : '');
      tagElement.textContent = tag;
      tagElement.dataset.tag = tag;
      container.appendChild(tagElement);
    });
  }

  // 渲染用户列表
  renderUserList() {
    const container = document.getElementById('user-list');
    const emptyState = document.getElementById('user-empty');

    // 过滤用户
    let filteredUsers = Object.values(this.users);

    // 应用搜索过滤
    if (this.searchQuery) {
      filteredUsers = filteredUsers.filter(user => {
        const searchText = `${user.username} ${user.markNote} ${user.tags?.join(' ') || ''}`.toLowerCase();
        return searchText.includes(this.searchQuery.toLowerCase());
      });
    }

    // 应用标签过滤
    if (this.currentFilter) {
      filteredUsers = filteredUsers.filter(user => {
        return user.tags && user.tags.includes(this.currentFilter);
      });
    }

    // 排序（按标记日期降序）
    filteredUsers.sort((a, b) => {
      return new Date(b.markDate) - new Date(a.markDate);
    });

    // 渲染列表
    container.innerHTML = '';

    if (filteredUsers.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    filteredUsers.forEach(user => {
      const item = document.createElement('div');
      item.className = 'ucm-list-item';
      item.innerHTML = `
        <div class="ucm-user-item">
          <div class="ucm-user-avatar">${user.username.charAt(0).toUpperCase()}</div>
          <div class="ucm-user-info">
            <div class="ucm-user-name">${helpers.truncateText(user.username, 20)}</div>
            <div class="ucm-user-meta">${helpers.formatDate(user.markDate)}</div>
            ${user.tags && user.tags.length > 0 ? `
              <div class="ucm-user-tags">
                ${user.tags.map(tag => `<span class="ucm-user-tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="ucm-user-actions">
            <button class="ucm-button-secondary" data-action="view" data-user-id="${user.userId}">查看</button>
            <button class="ucm-button-danger" data-action="remove" data-user-id="${user.userId}">删除</button>
          </div>
        </div>
      `;

      // 绑定事件
      item.querySelector('[data-action="view"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.viewUser(user);
      });

      item.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeUser(user.userId);
      });

      // 点击整个项目打开用户主页
      item.addEventListener('click', () => {
        if (user.profileUrl) {
          window.open(user.profileUrl, '_blank');
        }
      });

      container.appendChild(item);
    });
  }

  // 渲染评论列表
  renderCommentList() {
    const container = document.getElementById('comment-list');
    const emptyState = document.getElementById('comment-empty');

    // 过滤评论
    let filteredComments = Object.values(this.comments);

    // 应用搜索过滤
    if (this.searchQuery) {
      filteredComments = filteredComments.filter(comment => {
        const searchText = `${comment.content} ${comment.note} ${comment.tags?.join(' ') || ''}`.toLowerCase();
        return searchText.includes(this.searchQuery.toLowerCase());
      });
    }

    // 应用标签过滤
    if (this.currentFilter) {
      filteredComments = filteredComments.filter(comment => {
        return comment.tags && comment.tags.includes(this.currentFilter);
      });
    }

    // 排序（按收藏日期降序）
    filteredComments.sort((a, b) => {
      return new Date(b.commentDate) - new Date(a.commentDate);
    });

    // 渲染列表
    container.innerHTML = '';

    if (filteredComments.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    filteredComments.forEach(comment => {
      const item = document.createElement('div');
      item.className = 'ucm-list-item';
      item.innerHTML = `
        <div class="ucm-comment-item">
          <div class="ucm-comment-content">${helpers.truncateText(comment.content, 150)}</div>
          <div class="ucm-comment-meta">
            <span>${helpers.formatDate(comment.commentDate)}</span>
            ${comment.tags && comment.tags.length > 0 ? `
              <div class="ucm-comment-tags">
                ${comment.tags.map(tag => `<span class="ucm-comment-tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          ${comment.note ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">备注: ${helpers.truncateText(comment.note, 50)}</div>` : ''}
          <div class="ucm-comment-actions">
            <button class="ucm-button-secondary" data-action="view" data-comment-id="${comment.commentId}">查看</button>
            <button class="ucm-button-danger" data-action="remove" data-comment-id="${comment.commentId}">删除</button>
          </div>
        </div>
      `;

      // 绑定事件
      item.querySelector('[data-action="view"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.viewComment(comment);
      });

      item.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeComment(comment.commentId);
      });

      // 点击整个项目打开评论页面
      item.addEventListener('click', () => {
        if (comment.commentUrl) {
          window.open(comment.commentUrl, '_blank');
        }
      });

      container.appendChild(item);
    });
  }

  // 切换标签页
  switchTab(tab) {
    this.currentTab = tab;

    // 更新标签样式
    document.querySelectorAll('.ucm-tab').forEach(t => {
      t.classList.remove('active');
      if (t.dataset.tab === tab) {
        t.classList.add('active');
      }
    });

    // 更新内容显示
    document.querySelectorAll('.ucm-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tab}-tab`).classList.add('active');
  }

  // 处理搜索
  handleSearch() {
    const input = document.getElementById('search-input');
    this.searchQuery = input.value.trim();

    // 重新渲染当前标签页
    if (this.currentTab === 'users') {
      this.renderUserList();
    } else {
      this.renderCommentList();
    }
  }

  // 处理标签点击
  handleTagClick(tag) {
    if (tag === 'all') {
      this.currentFilter = null;
    } else {
      this.currentFilter = tag;
    }

    // 重新渲染标签云
    this.renderTagCloud();

    // 重新渲染当前标签页
    if (this.currentTab === 'users') {
      this.renderUserList();
    } else {
      this.renderCommentList();
    }
  }

  // 查看用户
  viewUser(user) {
    if (user.profileUrl) {
      window.open(user.profileUrl, '_blank');
    } else {
      this.showNotification('用户没有主页链接', 'info');
    }
  }

  // 查看评论
  viewComment(comment) {
    if (comment.commentUrl) {
      window.open(comment.commentUrl, '_blank');
    } else {
      this.showNotification('评论没有链接', 'info');
    }
  }

  // 删除用户
  async removeUser(userId) {
    if (!confirm('确定要删除这个用户的标记吗？')) {
      return;
    }

    try {
      const response = await this.sendMessage('unmarkUser', { userId });

      if (response.success) {
        delete this.users[userId];
        this.render();
        this.showNotification('用户标记已删除', 'success');
      } else {
        this.showNotification('删除失败: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      this.showNotification('删除失败: ' + error.message, 'error');
    }
  }

  // 删除评论
  async removeComment(commentId) {
    if (!confirm('确定要删除这个收藏的评论吗？')) {
      return;
    }

    try {
      const response = await this.sendMessage('removeComment', { commentId });

      if (response.success) {
        delete this.comments[commentId];
        this.render();
        this.showNotification('评论收藏已删除', 'success');
      } else {
        this.showNotification('删除失败: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      this.showNotification('删除失败: ' + error.message, 'error');
    }
  }

  // 处理导出
  async handleExport() {
    try {
      const response = await this.sendMessage('exportData');

      if (response.success) {
        // 下载JSON文件
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-comment-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('数据导出成功', 'success');
      } else {
        this.showNotification('导出失败: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('导出失败:', error);
      this.showNotification('导出失败: ' + error.message, 'error');
    }
  }

  // 显示导入对话框
  showImportModal() {
    document.getElementById('import-modal').style.display = 'flex';
    document.getElementById('import-file').value = '';
  }

  // 隐藏导入对话框
  hideImportModal() {
    document.getElementById('import-modal').style.display = 'none';
  }

  // 处理导入
  async handleImport() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];

    if (!file) {
      this.showNotification('请选择要导入的文件', 'error');
      return;
    }

    try {
      // 读取文件内容
      const text = await file.text();
      const data = JSON.parse(text);

      // 发送消息到后台导入数据
      const response = await this.sendMessage('importData', data);

      if (response.success) {
        // 重新加载数据
        await this.loadData();
        this.render();

        this.hideImportModal();
        this.showNotification('数据导入成功', 'success');
      } else {
        this.showNotification('导入失败: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('导入失败:', error);
      this.showNotification('导入失败: ' + error.message, 'error');
    }
  }

  // 打开设置页面
  openSettings() {
    // 打开选项页面
    chrome.runtime.openOptionsPage();
  }

  // 显示通知
  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `ucm-popup-notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        notification.style.display = 'none';
        notification.style.animation = '';
      }, 300);
    }, 3000);
  }

  // 发送消息到后台
  sendMessage(action, data = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action, data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// 初始化应用
const app = new PopupApp();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});