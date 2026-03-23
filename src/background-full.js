// 后台服务脚本 - 用户标记与评论收藏器
// 此版本合并了所有依赖，不需要 ES6 模块导入

console.log('[UCM-BG] 后台服务启动');

// ==================== 辅助函数 ====================
const helpers = {
  generateId: function(prefix = 'ucm') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  generateColor: function(seed = '') {
    const colors = ['#4285F4', '#34A853', '#EA4335', '#FBBC05', '#9334E6', '#00ACC1', '#FF6D00', '#C2185B'];
    if (seed) {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    }
    return colors[Math.floor(Math.random() * colors.length)];
  }
};

// ==================== 存储管理器 ====================
const storageManager = {
  storageKey: 'userCommentManager',

  getAllData: async function() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          const defaultData = {
            markedUsers: {},
            savedComments: {},
            tags: ['专家', '活跃用户', '重要', '黑名单'], // 默认标签
            settings: {
              enabledSites: ['zhihu.com', 'ithome.com', 'weibo.com'],
              autoMark: false,
              notificationEnabled: true,
              autoSaveComments: false,
              defaultColor: '#4285F4',
              markButtonText: '标记',
              saveButtonText: '收藏'
            }
          };
          resolve(result[this.storageKey] || defaultData);
        }
      });
    });
  },

  saveData: async function(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.storageKey]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(true);
        }
      });
    });
  },

  getMarkedUsers: async function() {
    const data = await this.getAllData();
    return data.markedUsers || {};
  },

  getSavedComments: async function() {
    const data = await this.getAllData();
    return data.savedComments || {};
  },

  getSettings: async function() {
    const data = await this.getAllData();
    return data.settings || {};
  },

  getTags: async function() {
    const data = await this.getAllData();
    return data.tags || [];
  },

  saveTags: async function(tags) {
    const data = await this.getAllData();
    data.tags = tags;
    await this.saveData(data);
    return tags;
  },

  addTag: async function(tag) {
    const data = await this.getAllData();
    if (!data.tags) data.tags = [];
    if (!data.tags.includes(tag)) {
      data.tags.push(tag);
      await this.saveData(data);
    }
    return data.tags;
  },

  removeTag: async function(tag) {
    const data = await this.getAllData();
    if (data.tags) {
      data.tags = data.tags.filter(t => t !== tag);
      await this.saveData(data);
    }
    return data.tags;
  },

  markUser: async function(userData) {
    const data = await this.getAllData();
    if (!data.markedUsers) data.markedUsers = {};
    data.markedUsers[userData.userId] = userData;
    await this.saveData(data);
    return userData;
  },

  unmarkUser: async function(userId) {
    const data = await this.getAllData();
    if (data.markedUsers && data.markedUsers[userId]) {
      delete data.markedUsers[userId];
      await this.saveData(data);
      return true;
    }
    return false;
  },

  saveComment: async function(commentData) {
    const data = await this.getAllData();
    if (!data.savedComments) data.savedComments = {};
    data.savedComments[commentData.commentId] = commentData;
    await this.saveData(data);
    return commentData;
  },

  removeComment: async function(commentId) {
    const data = await this.getAllData();
    if (data.savedComments && data.savedComments[commentId]) {
      delete data.savedComments[commentId];
      await this.saveData(data);
      return true;
    }
    return false;
  },

  updateSettings: async function(newSettings) {
    const data = await this.getAllData();
    if (!data.settings) {
      data.settings = {};
    }
    data.settings = { ...data.settings, ...newSettings };
    await this.saveData(data);
    return data.settings;
  },

  exportData: async function() {
    return await this.getAllData();
  },

  importData: async function(data) {
    await this.saveData(data);
    return true;
  }
};

// ==================== 消息处理 ====================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[UCM-BG] 收到消息:', request.action);

  switch (request.action) {
    case 'markUser':
      handleMarkUser(request.data, sendResponse);
      return true;

    case 'unmarkUser':
      handleUnmarkUser(request.data, sendResponse);
      return true;

    case 'saveComment':
      handleSaveComment(request.data, sendResponse);
      return true;

    case 'removeComment':
      handleRemoveComment(request.data, sendResponse);
      return true;

    case 'getMarkedUsers':
      handleGetMarkedUsers(sendResponse);
      return true;

    case 'getSavedComments':
      handleGetSavedComments(sendResponse);
      return true;

    case 'exportData':
      handleExportData(sendResponse);
      return true;

    case 'importData':
      handleImportData(request.data, sendResponse);
      return true;

    case 'getAllTags':
      handleGetAllTags(sendResponse);
      return true;

    case 'saveTags':
      handleSaveTags(request.data, sendResponse);
      return true;

    case 'addTag':
      handleAddTag(request.data, sendResponse);
      return true;

    case 'removeTag':
      handleRemoveTag(request.data, sendResponse);
      return true;

    case 'getSettings':
      handleGetSettings(sendResponse);
      return true;

    case 'updateSettings':
      handleUpdateSettings(request.data, sendResponse);
      return true;

    default:
      console.log('[UCM-BG] 未知消息类型:', request.action);
      sendResponse({ success: false, error: '未知消息类型' });
  }
});

async function handleMarkUser(data, sendResponse) {
  try {
    console.log('[UCM-BG] 标记用户:', data.username);

    const userData = {
      userId: data.userId || helpers.generateId('user'),
      username: data.username || '未知用户',
      profileUrl: data.profileUrl || '',
      markDate: new Date().toISOString(),
      markColor: data.markColor || helpers.generateColor(data.username),
      markNote: data.markNote || '',
      tags: data.tags || [],
      website: data.website || 'unknown'
    };

    await storageManager.markUser(userData);
    console.log('[UCM-BG] 用户保存成功:', userData.userId);
    sendResponse({ success: true, data: userData });
  } catch (error) {
    console.error('[UCM-BG] 标记用户失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUnmarkUser(data, sendResponse) {
  try {
    const result = await storageManager.unmarkUser(data.userId);
    sendResponse({ success: result });
  } catch (error) {
    console.error('[UCM-BG] 取消标记失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSaveComment(data, sendResponse) {
  try {
    console.log('[UCM-BG] 收藏评论:', data.content.substring(0, 30) + '...');

    const commentData = {
      commentId: data.commentId || helpers.generateId('comment'),
      content: data.content || '',
      commentDate: data.commentDate || new Date().toISOString(),
      author: data.author || '',
      note: data.note || '',
      tags: data.tags || [],
      commentUrl: data.commentUrl || '',
      website: data.website || 'unknown'
    };

    await storageManager.saveComment(commentData);
    console.log('[UCM-BG] 评论保存成功:', commentData.commentId);
    sendResponse({ success: true, data: commentData });
  } catch (error) {
    console.error('[UCM-BG] 收藏评论失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleRemoveComment(data, sendResponse) {
  try {
    const result = await storageManager.removeComment(data.commentId);
    sendResponse({ success: result });
  } catch (error) {
    console.error('[UCM-BG] 删除评论失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetMarkedUsers(sendResponse) {
  try {
    const users = await storageManager.getMarkedUsers();
    sendResponse({ success: true, data: users });
  } catch (error) {
    console.error('[UCM-BG] 获取标记用户失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetSavedComments(sendResponse) {
  try {
    const comments = await storageManager.getSavedComments();
    sendResponse({ success: true, data: comments });
  } catch (error) {
    console.error('[UCM-BG] 获取收藏评论失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleExportData(sendResponse) {
  try {
    const data = await storageManager.exportData();
    sendResponse({ success: true, data: data });
  } catch (error) {
    console.error('[UCM-BG] 导出数据失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleImportData(data, sendResponse) {
  try {
    await storageManager.importData(data);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[UCM-BG] 导入数据失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetAllTags(sendResponse) {
  try {
    const tags = await storageManager.getTags();
    sendResponse({ success: true, data: tags });
  } catch (error) {
    console.error('[UCM-BG] 获取标签失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSaveTags(data, sendResponse) {
  try {
    const tags = await storageManager.saveTags(data.tags || []);
    sendResponse({ success: true, data: tags });
  } catch (error) {
    console.error('[UCM-BG] 保存标签失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleAddTag(data, sendResponse) {
  try {
    const tags = await storageManager.addTag(data.tag);
    sendResponse({ success: true, data: tags });
  } catch (error) {
    console.error('[UCM-BG] 添加标签失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleRemoveTag(data, sendResponse) {
  try {
    const tags = await storageManager.removeTag(data.tag);
    sendResponse({ success: true, data: tags });
  } catch (error) {
    console.error('[UCM-BG] 删除标签失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetSettings(sendResponse) {
  try {
    const settings = await storageManager.getSettings();
    sendResponse({ success: true, data: settings });
  } catch (error) {
    console.error('[UCM-BG] 获取设置失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateSettings(data, sendResponse) {
  try {
    const settings = await storageManager.updateSettings(data);
    sendResponse({ success: true, data: settings });
  } catch (error) {
    console.error('[UCM-BG] 更新设置失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ==================== 标签页更新监听 ====================
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const supportedSites = ['zhihu.com', 'ithome.com', 'weibo.com'];
    const isSupported = supportedSites.some(site => tab.url.includes(site));

    if (isSupported) {
      console.log('[UCM-BG] 检测到支持的网站，注入内容脚本:', tab.url);
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content-full.js']
      }).catch(error => {
        console.error('[UCM-BG] 注入内容脚本失败:', error);
      });
    }
  }
});

// ==================== 扩展安装监听 ====================
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[UCM-BG] 扩展已安装');
    chrome.contextMenus.create({
      id: 'mark-user',
      title: '标记此用户',
      contexts: ['selection']
    });
  } else if (details.reason === 'update') {
    console.log('[UCM-BG] 扩展已更新');
  }
});

console.log('[UCM-BG] 后台服务初始化完成');
