// 选项页面逻辑
import helpers from '../utils/helpers.js';

class OptionsApp {
  constructor() {
    this.settings = {};
    this.users = {};
    this.comments = {};
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

    // 网站配置
    document.getElementById('btn-save-sites').addEventListener('click', () => {
      this.saveSiteConfig();
    });

    // 数据导出
    document.getElementById('btn-export-data').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('btn-export-users').addEventListener('click', () => {
      this.exportUsers();
    });

    document.getElementById('btn-export-comments').addEventListener('click', () => {
      this.exportComments();
    });

    // 数据导入
    document.getElementById('btn-import-data').addEventListener('click', () => {
      this.importData();
    });

    // 数据清理
    document.getElementById('btn-clear-users').addEventListener('click', () => {
      this.clearUsers();
    });

    document.getElementById('btn-clear-comments').addEventListener('click', () => {
      this.clearComments();
    });

    document.getElementById('btn-clear-all').addEventListener('click', () => {
      this.clearAllData();
    });

    // 颜色选择器
    document.getElementById('default-color-picker').addEventListener('click', (e) => {
      if (e.target.classList.contains('ucm-color-option')) {
        document.querySelectorAll('#default-color-picker .ucm-color-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        e.target.classList.add('selected');
      }
    });

    // 保存设置
    document.getElementById('btn-save-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    // 重置设置
    document.getElementById('btn-reset-settings').addEventListener('click', () => {
      this.resetSettings();
    });
  }

  // 加载数据
  async loadData() {
    try {
      // 发送消息到后台获取数据
      const settingsResponse = await this.sendMessage('getSettings');
      const usersResponse = await this.sendMessage('getMarkedUsers');
      const commentsResponse = await this.sendMessage('getSavedComments');

      if (settingsResponse.success) {
        this.settings = settingsResponse.data;
      }

      if (usersResponse.success) {
        this.users = usersResponse.data;
      }

      if (commentsResponse.success) {
        this.comments = commentsResponse.data;
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      this.showNotification('加载数据失败: ' + error.message, 'error');
    }
  }

  // 渲染界面
  render() {
    this.renderStats();
    this.renderSettings();
  }

  // 渲染统计信息
  renderStats() {
    const userCount = Object.keys(this.users).length;
    const commentCount = Object.keys(this.comments).length;

    // 计算数据大小
    const dataSize = new Blob([JSON.stringify({ users: this.users, comments: this.comments })]).size;
    const dataSizeKB = (dataSize / 1024).toFixed(2);

    document.getElementById('user-count').textContent = userCount;
    document.getElementById('comment-count').textContent = commentCount;
    document.getElementById('data-size').textContent = dataSizeKB + ' KB';
  }

  // 渲染设置
  renderSettings() {
    // 渲染网站配置
    const siteCheckboxes = document.querySelectorAll('.ucm-site-checkbox');
    siteCheckboxes.forEach(checkbox => {
      const site = checkbox.dataset.site;
      if (this.settings.enabledSites && this.settings.enabledSites.includes(site)) {
        checkbox.checked = true;
      } else {
        checkbox.checked = false;
      }
    });

    // 渲染行为设置
    document.getElementById('auto-mark').checked = this.settings.autoMark || false;
    document.getElementById('notification-enabled').checked = this.settings.notificationEnabled !== false;
    document.getElementById('auto-save-comments').checked = this.settings.autoSaveComments || false;

    // 渲染标记样式
    if (this.settings.defaultColor) {
      document.querySelectorAll('#default-color-picker .ucm-color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === this.settings.defaultColor) {
          opt.classList.add('selected');
        }
      });
    }

    // 渲染按钮文本
    document.getElementById('mark-button-text').value = this.settings.markButtonText || '标记';
    document.getElementById('save-button-text').value = this.settings.saveButtonText || '收藏';
  }

  // 切换标签页
  switchTab(tab) {
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

  // 保存网站配置
  async saveSiteConfig() {
    const enabledSites = [];
    document.querySelectorAll('.ucm-site-checkbox:checked').forEach(checkbox => {
      enabledSites.push(checkbox.dataset.site);
    });

    // 自定义规则
    const customRules = document.getElementById('custom-rules').value.trim();
    let customRulesData = null;
    if (customRules) {
      try {
        customRulesData = JSON.parse(customRules);
      } catch (error) {
        this.showNotification('自定义规则格式错误: ' + error.message, 'error');
        return;
      }
    }

    try {
      const response = await this.sendMessage('updateSettings', {
        enabledSites: enabledSites,
        customRules: customRulesData
      });

      if (response.success) {
        this.settings = response.data;
        this.showNotification('网站配置已保存', 'success');
      } else {
        this.showNotification('保存失败: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('保存网站配置失败:', error);
      this.showNotification('保存失败: ' + error.message, 'error');
    }
  }

  // 导出数据
  async exportData() {
    try {
      const response = await this.sendMessage('exportData');

      if (response.success) {
        this.downloadJson(response.data, `user-comment-data-${new Date().toISOString().split('T')[0]}.json`);
        this.showNotification('数据导出成功', 'success');
      } else {
        this.showNotification('导出失败: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('导出失败:', error);
      this.showNotification('导出失败: ' + error.message, 'error');
    }
  }

  // 导出用户
  async exportUsers() {
    const data = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      data: {
        markedUsers: this.users
      }
    };

    this.downloadJson(data, `users-${new Date().toISOString().split('T')[0]}.json`);
    this.showNotification('用户数据导出成功', 'success');
  }

  // 导出评论
  async exportComments() {
    const data = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      data: {
        savedComments: this.comments
      }
    };

    this.downloadJson(data, `comments-${new Date().toISOString().split('T')[0]}.json`);
    this.showNotification('评论数据导出成功', 'success');
  }

  // 导入数据
  async importData() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];

    if (!file) {
      this.showNotification('请选择要导入的文件', 'error');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await this.sendMessage('importData', data);

      if (response.success) {
        // 重新加载数据
        await this.loadData();
        this.renderStats();
        this.showNotification('数据导入成功', 'success');
      } else {
        this.showNotification('导入失败: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('导入失败:', error);
      this.showNotification('导入失败: ' + error.message, 'error');
    }
  }

  // 清除用户
  async clearUsers() {
    if (!confirm('确定要清除所有标记的用户吗？此操作不可恢复。')) {
      return;
    }

    try {
      // 重新加载数据以获取最新状态
      await this.loadData();

      // 删除所有用户
      const userIds = Object.keys(this.users);
      for (const userId of userIds) {
        await this.sendMessage('unmarkUser', { userId });
      }

      // 重新加载数据
      await this.loadData();
      this.renderStats();
      this.showNotification('所有用户已清除', 'success');
    } catch (error) {
      console.error('清除用户失败:', error);
      this.showNotification('清除用户失败: ' + error.message, 'error');
    }
  }

  // 清除评论
  async clearComments() {
    if (!confirm('确定要清除所有收藏的评论吗？此操作不可恢复。')) {
      return;
    }

    try {
      // 重新加载数据以获取最新状态
      await this.loadData();

      // 删除所有评论
      const commentIds = Object.keys(this.comments);
      for (const commentId of commentIds) {
        await this.sendMessage('removeComment', { commentId });
      }

      // 重新加载数据
      await this.loadData();
      this.renderStats();
      this.showNotification('所有评论已清除', 'success');
    } catch (error) {
      console.error('清除评论失败:', error);
      this.showNotification('清除评论失败: ' + error.message, 'error');
    }
  }

  // 清除所有数据
  async clearAllData() {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复，包括用户标记和评论收藏。')) {
      return;
    }

    try {
      const response = await this.sendMessage('clearAllData');

      if (response.success) {
        // 重新加载数据
        await this.loadData();
        this.renderStats();
        this.showNotification('所有数据已清除', 'success');
      } else {
        this.showNotification('清除失败: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('清除数据失败:', error);
      this.showNotification('清除数据失败: ' + error.message, 'error');
    }
  }

  // 保存设置
  async saveSettings() {
    // 获取颜色选择
    const selectedColor = document.querySelector('#default-color-picker .ucm-color-option.selected')?.dataset.color || '#4285F4';

    // 获取其他设置
    const settings = {
      defaultColor: selectedColor,
      markButtonText: document.getElementById('mark-button-text').value || '标记',
      saveButtonText: document.getElementById('save-button-text').value || '收藏',
      autoMark: document.getElementById('auto-mark').checked,
      notificationEnabled: document.getElementById('notification-enabled').checked,
      autoSaveComments: document.getElementById('auto-save-comments').checked
    };

    try {
      const response = await this.sendMessage('updateSettings', settings);

      if (response.success) {
        this.settings = response.data;
        this.showNotification('设置已保存', 'success');
      } else {
        this.showNotification('保存失败: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      this.showNotification('保存失败: ' + error.message, 'error');
    }
  }

  // 重置设置
  async resetSettings() {
    if (!confirm('确定要重置为默认设置吗？')) {
      return;
    }

    // 重置UI
    document.querySelectorAll('.ucm-site-checkbox').forEach(checkbox => {
      checkbox.checked = true;
    });

    document.getElementById('custom-rules').value = '';

    document.getElementById('auto-mark').checked = false;
    document.getElementById('notification-enabled').checked = true;
    document.getElementById('auto-save-comments').checked = false;

    document.querySelectorAll('#default-color-picker .ucm-color-option').forEach(opt => {
      opt.classList.remove('selected');
      if (opt.dataset.color === '#4285F4') {
        opt.classList.add('selected');
      }
    });

    document.getElementById('mark-button-text').value = '标记';
    document.getElementById('save-button-text').value = '收藏';

    // 保存默认设置
    await this.saveSettings();
  }

  // 下载JSON文件
  downloadJson(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 显示通知
  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `ucm-notification ${type}`;
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
const app = new OptionsApp();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});