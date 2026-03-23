// 数据存储工具 - Chrome Storage API封装
class StorageManager {
  constructor() {
    this.storageKey = 'userCommentManager';
  }

  // 获取所有数据
  async getAllData() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          const defaultData = {
            markedUsers: {},
            savedComments: {},
            settings: {
              enabledSites: ['zhihu.com', 'ithome.com', 'weibo.com'],
              autoMark: false,
              notificationEnabled: true
            }
          };
          resolve(result[this.storageKey] || defaultData);
        }
      });
    });
  }

  // 保存数据
  async saveData(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.storageKey]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(true);
        }
      });
    });
  }

  // 获取标记的用户
  async getMarkedUsers() {
    const data = await this.getAllData();
    return data.markedUsers || {};
  }

  // 获取收藏的评论
  async getSavedComments() {
    const data = await this.getAllData();
    return data.savedComments || {};
  }

  // 获取设置
  async getSettings() {
    const data = await this.getAllData();
    return data.settings || {};
  }

  // 添加或更新用户标记
  async markUser(userData) {
    const data = await this.getAllData();
    if (!data.markedUsers) {
      data.markedUsers = {};
    }
    data.markedUsers[userData.userId] = userData;
    await this.saveData(data);
    return userData;
  }

  // 移除用户标记
  async unmarkUser(userId) {
    const data = await this.getAllData();
    if (data.markedUsers && data.markedUsers[userId]) {
      delete data.markedUsers[userId];
      await this.saveData(data);
      return true;
    }
    return false;
  }

  // 添加评论收藏
  async saveComment(commentData) {
    const data = await this.getAllData();
    if (!data.savedComments) {
      data.savedComments = {};
    }
    data.savedComments[commentData.commentId] = commentData;
    await this.saveData(data);
    return commentData;
  }

  // 移除评论收藏
  async removeComment(commentId) {
    const data = await this.getAllData();
    if (data.savedComments && data.savedComments[commentId]) {
      delete data.savedComments[commentId];
      await this.saveData(data);
      return true;
    }
    return false;
  }

  // 更新设置
  async updateSettings(newSettings) {
    const data = await this.getAllData();
    if (!data.settings) {
      data.settings = {};
    }
    data.settings = { ...data.settings, ...newSettings };
    await this.saveData(data);
    return data.settings;
  }

  // 导出数据
  async exportData() {
    const data = await this.getAllData();
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      data: data
    };
    return exportData;
  }

  // 导入数据
  async importData(importData) {
    try {
      if (typeof importData === 'string') {
        importData = JSON.parse(importData);
      }

      // 验证数据格式
      if (!importData || !importData.data) {
        throw new Error('无效的数据格式');
      }

      const data = importData.data;

      // 合并数据（保留现有数据，不覆盖）
      const currentData = await this.getAllData();
      const mergedData = {
        markedUsers: { ...currentData.markedUsers, ...data.markedUsers },
        savedComments: { ...currentData.savedComments, ...data.savedComments },
        settings: { ...currentData.settings, ...data.settings }
      };

      await this.saveData(mergedData);
      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      throw error;
    }
  }

  // 清除所有数据
  async clearAllData() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([this.storageKey], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(true);
        }
      });
    });
  }

  // 搜索用户
  async searchUsers(query, filters = {}) {
    const users = await this.getMarkedUsers();
    const results = [];

    for (const userId in users) {
      const user = users[userId];

      // 文本搜索
      if (query) {
        const searchText = `${user.username} ${user.markNote} ${user.tags?.join(' ') || ''}`.toLowerCase();
        if (!searchText.includes(query.toLowerCase())) {
          continue;
        }
      }

      // 网站过滤
      if (filters.website && user.website !== filters.website) {
        continue;
      }

      // 标签过滤
      if (filters.tag && (!user.tags || !user.tags.includes(filters.tag))) {
        continue;
      }

      results.push(user);
    }

    return results;
  }

  // 搜索评论
  async searchComments(query, filters = {}) {
    const comments = await this.getSavedComments();
    const results = [];

    for (const commentId in comments) {
      const comment = comments[commentId];

      // 文本搜索
      if (query) {
        const searchText = `${comment.content} ${comment.note} ${comment.tags?.join(' ') || ''}`.toLowerCase();
        if (!searchText.includes(query.toLowerCase())) {
          continue;
        }
      }

      // 用户过滤
      if (filters.userId && comment.userId !== filters.userId) {
        continue;
      }

      // 标签过滤
      if (filters.tag && (!comment.tags || !comment.tags.includes(filters.tag))) {
        continue;
      }

      results.push(comment);
    }

    return results;
  }

  // 获取所有标签
  async getAllTags() {
    const users = await this.getMarkedUsers();
    const comments = await this.getSavedComments();
    const tags = new Set();

    // 从用户中提取标签
    for (const userId in users) {
      const user = users[userId];
      if (user.tags) {
        user.tags.forEach(tag => tags.add(tag));
      }
    }

    // 从评论中提取标签
    for (const commentId in comments) {
      const comment = comments[commentId];
      if (comment.tags) {
        comment.tags.forEach(tag => tags.add(tag));
      }
    }

    return Array.from(tags);
  }
}

// 创建单例实例
const storageManager = new StorageManager();

// 导出工具函数
export default storageManager;