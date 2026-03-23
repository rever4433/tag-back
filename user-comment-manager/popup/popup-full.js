// popup.js - 弹出窗口逻辑（无模块版本）

(function() {
  'use strict';

  console.log('[UCM-Popup] 初始化...');

  // 发送消息到后台
  function sendMessage(action, data = {}) {
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

  // 应用状态
  const state = {
    currentTab: 'users',
    currentFilter: null,
    searchQuery: '',
    users: {},
    comments: {},
    tags: []
  };

  // 初始化
  async function init() {
    bindEvents();
    await loadData();
    render();
  }

  // 绑定事件
  function bindEvents() {
    // 标签页切换
    document.querySelectorAll('.ucm-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        switchTab(e.target.dataset.tab);
      });
    });

    // 搜索
    document.getElementById('btn-search').addEventListener('click', handleSearch);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearch();
    });

    // 导出
    document.getElementById('btn-export').addEventListener('click', handleExport);
    // 导入
    document.getElementById('btn-import').addEventListener('click', showImportModal);
    // 设置
    document.getElementById('btn-settings').addEventListener('click', openSettings);

    // 导入对话框
    document.getElementById('btn-cancel-import').addEventListener('click', hideImportModal);
    document.getElementById('btn-confirm-import').addEventListener('click', handleImport);

    // 标签云点击
    document.getElementById('tag-cloud').addEventListener('click', (e) => {
      if (e.target.classList.contains('ucm-tag-cloud-item')) {
        handleTagClick(e.target.dataset.tag);
      }
    });

    // 标签管理
    document.getElementById('add-tag-btn').addEventListener('click', addTag);
    document.getElementById('new-tag-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTag();
    });
  }

  // 加载数据
  async function loadData() {
    try {
      const [usersResponse, commentsResponse, tagsResponse] = await Promise.all([
        sendMessage('getMarkedUsers'),
        sendMessage('getSavedComments'),
        sendMessage('getAllTags')
      ]);

      if (usersResponse.success) state.users = usersResponse.data;
      if (commentsResponse.success) state.comments = commentsResponse.data;
      if (tagsResponse.success) state.tags = tagsResponse.data;

      console.log('[UCM-Popup] 数据加载完成:', {
        users: Object.keys(state.users).length,
        comments: Object.keys(state.comments).length,
        tags: state.tags.length
      });
    } catch (error) {
      console.error('[UCM-Popup] 加载数据失败:', error);
      showNotification('加载数据失败：' + error.message, 'error');
    }
  }

  // 渲染界面
  function render() {
    renderStats();
    renderTagCloud();
    renderUserList();
    renderCommentList();
    renderTagsList();
  }

  // 切换标签页
  function switchTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.ucm-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ucm-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-tab`).classList.add('active');
  }

  // 渲染统计
  function renderStats() {
    document.getElementById('user-count').textContent = Object.keys(state.users).length;
    document.getElementById('comment-count').textContent = Object.keys(state.comments).length;
  }

  // 渲染标签云
  function renderTagCloud() {
    const container = document.getElementById('tag-cloud');
    container.innerHTML = '';

    if (state.tags.length === 0) {
      container.innerHTML = '<div style="color: #999; font-size: 12px;">暂无标签</div>';
      return;
    }

    // "全部"标签
    const allTag = document.createElement('div');
    allTag.className = 'ucm-tag-cloud-item' + (state.currentFilter === null ? ' active' : '');
    allTag.textContent = '全部';
    allTag.dataset.tag = 'all';
    container.appendChild(allTag);

    // 其他标签
    state.tags.forEach(tag => {
      const tagEl = document.createElement('div');
      tagEl.className = 'ucm-tag-cloud-item' + (state.currentFilter === tag ? ' active' : '');
      tagEl.textContent = tag;
      tagEl.dataset.tag = tag;
      container.appendChild(tagEl);
    });
  }

  // 渲染用户列表
  function renderUserList() {
    const container = document.getElementById('user-list');
    const emptyState = document.getElementById('user-empty');

    let filteredUsers = Object.values(state.users);

    if (state.searchQuery) {
      filteredUsers = filteredUsers.filter(user => {
        const searchText = `${user.username} ${user.markNote} ${user.tags?.join(' ') || ''}`.toLowerCase();
        return searchText.includes(state.searchQuery.toLowerCase());
      });
    }

    if (state.currentFilter) {
      filteredUsers = filteredUsers.filter(user => user.tags && user.tags.includes(state.currentFilter));
    }

    filteredUsers.sort((a, b) => new Date(b.markDate) - new Date(a.markDate));

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
            <div class="ucm-user-name">${truncateText(user.username, 20)}</div>
            <div class="ucm-user-meta">${formatDate(user.markDate)}</div>
            ${user.tags && user.tags.length > 0 ? `
              <div class="ucm-user-tags">
                ${user.tags.map(tag => `<span class="ucm-user-tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="ucm-user-actions">
            <button class="ucm-button-danger" data-action="remove" data-user-id="${user.userId}">删除</button>
          </div>
        </div>
      `;

      item.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
        e.stopPropagation();
        removeUser(user.userId);
      });

      item.addEventListener('click', () => {
        if (user.profileUrl) {
          window.open(user.profileUrl, '_blank');
        }
      });

      container.appendChild(item);
    });
  }

  // 渲染评论列表
  function renderCommentList() {
    const container = document.getElementById('comment-list');
    const emptyState = document.getElementById('comment-empty');

    let filteredComments = Object.values(state.comments);

    if (state.searchQuery) {
      filteredComments = filteredComments.filter(comment => {
        const searchText = `${comment.content} ${comment.note} ${comment.tags?.join(' ') || ''}`.toLowerCase();
        return searchText.includes(state.searchQuery.toLowerCase());
      });
    }

    if (state.currentFilter) {
      filteredComments = filteredComments.filter(comment => comment.tags && comment.tags.includes(state.currentFilter));
    }

    filteredComments.sort((a, b) => new Date(b.commentDate) - new Date(a.commentDate));

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
          <div class="ucm-comment-content">${truncateText(comment.content, 150)}</div>
          <div class="ucm-comment-meta">
            <span>${formatDate(comment.commentDate)}</span>
            ${comment.tags && comment.tags.length > 0 ? `
              <div class="ucm-comment-tags">
                ${comment.tags.map(tag => `<span class="ucm-comment-tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          ${comment.note ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">备注：${truncateText(comment.note, 50)}</div>` : ''}
          <div class="ucm-comment-actions">
            <button class="ucm-button-danger" data-action="remove" data-comment-id="${comment.commentId}">删除</button>
          </div>
        </div>
      `;

      item.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
        e.stopPropagation();
        removeComment(comment.commentId);
      });

      item.addEventListener('click', () => {
        if (comment.commentUrl) {
          window.open(comment.commentUrl, '_blank');
        }
      });

      container.appendChild(item);
    });
  }

  // 渲染标签管理列表
  function renderTagsList() {
    const container = document.getElementById('tags-list');
    container.innerHTML = '';

    if (state.tags.length === 0) {
      container.innerHTML = '<div style="color: #999; font-size: 12px; width: 100%; text-align: center; padding: 20px;">暂无标签，请添加</div>';
      return;
    }

    state.tags.forEach(tag => {
      const tagEl = document.createElement('div');
      tagEl.className = 'ucm-manage-tag';
      tagEl.innerHTML = `
        <span style="
          background: #e8f0fe;
          color: #1a73e8;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 13px;
        ">${tag}</span>
        <button class="ucm-remove-tag" data-tag="${tag}" style="
          margin-left: 4px;
          background: #EA4335;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        ">删除</button>
      `;

      tagEl.querySelector('.ucm-remove-tag').addEventListener('click', () => {
        removeTag(tag);
      });

      container.appendChild(tagEl);
    });
  }

  // 搜索处理
  function handleSearch() {
    state.searchQuery = document.getElementById('search-input').value.trim();
    render();
  }

  // 标签点击
  function handleTagClick(tag) {
    state.currentFilter = tag === 'all' ? null : tag;
    renderTagCloud();
    render();
  }

  // 删除用户
  async function removeUser(userId) {
    if (!confirm('确定要删除这个用户的标记吗？')) return;

    try {
      const response = await sendMessage('unmarkUser', { userId });
      if (response.success) {
        delete state.users[userId];
        render();
        showNotification('用户标记已删除', 'success');
      }
    } catch (error) {
      showNotification('删除失败：' + error.message, 'error');
    }
  }

  // 删除评论
  async function removeComment(commentId) {
    if (!confirm('确定要删除这个收藏的评论吗？')) return;

    try {
      const response = await sendMessage('removeComment', { commentId });
      if (response.success) {
        delete state.comments[commentId];
        render();
        showNotification('评论收藏已删除', 'success');
      }
    } catch (error) {
      showNotification('删除失败：' + error.message, 'error');
    }
  }

  // 添加标签
  async function addTag() {
    const input = document.getElementById('new-tag-input');
    const tagName = input.value.trim();

    if (!tagName) {
      showNotification('请输入标签名称', 'error');
      return;
    }

    if (state.tags.includes(tagName)) {
      showNotification('标签已存在', 'error');
      return;
    }

    try {
      const response = await sendMessage('addTag', { tag: tagName });
      if (response.success) {
        state.tags = response.data;
        renderTagsList();
        renderTagCloud();
        input.value = '';
        showNotification('标签添加成功', 'success');
      }
    } catch (error) {
      showNotification('添加失败：' + error.message, 'error');
    }
  }

  // 删除标签
  async function removeTag(tagName) {
    if (!confirm(`确定要删除标签"${tagName}"吗？`)) return;

    try {
      const response = await sendMessage('removeTag', { tag: tagName });
      if (response.success) {
        state.tags = response.data;
        renderTagsList();
        renderTagCloud();
        showNotification('标签已删除', 'success');
      }
    } catch (error) {
      showNotification('删除失败：' + error.message, 'error');
    }
  }

  // 导出
  async function handleExport() {
    try {
      const response = await sendMessage('exportData');
      if (response.success) {
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
        showNotification('数据导出成功', 'success');
      }
    } catch (error) {
      showNotification('导出失败：' + error.message, 'error');
    }
  }

  // 导入对话框
  function showImportModal() {
    document.getElementById('import-modal').style.display = 'flex';
    document.getElementById('import-file').value = '';
  }

  function hideImportModal() {
    document.getElementById('import-modal').style.display = 'none';
  }

  // 处理导入
  async function handleImport() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];

    if (!file) {
      showNotification('请选择要导入的文件', 'error');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const response = await sendMessage('importData', data);

      if (response.success) {
        await loadData();
        render();
        hideImportModal();
        showNotification('数据导入成功', 'success');
      }
    } catch (error) {
      showNotification('导入失败：' + error.message, 'error');
    }
  }

  // 打开设置
  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  // 通知
  function showNotification(message, type = 'info') {
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

  // 工具函数
  function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }

  // 启动
  document.addEventListener('DOMContentLoaded', init);
})();
