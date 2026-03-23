// Vuex状态管理
// 这是一个可选的状态管理模块，用于更复杂的应用状态管理

import { createStore } from 'vuex';

// 创建Vuex store
const store = createStore({
  state() {
    return {
      // 用户标记数据
      markedUsers: {},
      // 评论收藏数据
      savedComments: {},
      // 应用设置
      settings: {
        enabledSites: ['zhihu.com', 'ithome.com', 'weibo.com'],
        autoMark: false,
        notificationEnabled: true,
        defaultColor: '#4285F4',
        markButtonText: '标记',
        saveButtonText: '收藏'
      },
      // 当前过滤器
      currentFilter: null,
      // 搜索查询
      searchQuery: '',
      // 当前标签页
      currentTab: 'users',
      // 加载状态
      isLoading: false,
      // 错误信息
      error: null
    };
  },

  getters: {
    // 获取标记的用户列表
    markedUsersList: (state) => {
      return Object.values(state.markedUsers);
    },

    // 获取收藏的评论列表
    savedCommentsList: (state) => {
      return Object.values(state.savedComments);
    },

    // 获取所有标签
    allTags: (state) => {
      const tags = new Set();

      // 从用户中提取标签
      Object.values(state.markedUsers).forEach(user => {
        if (user.tags) {
          user.tags.forEach(tag => tags.add(tag));
        }
      });

      // 从评论中提取标签
      Object.values(state.savedComments).forEach(comment => {
        if (comment.tags) {
          comment.tags.forEach(tag => tags.add(tag));
        }
      });

      return Array.from(tags);
    },

    // 过滤后的用户列表
    filteredUsers: (state, getters) => {
      let users = getters.markedUsersList;

      // 应用搜索过滤
      if (state.searchQuery) {
        users = users.filter(user => {
          const searchText = `${user.username} ${user.markNote} ${user.tags?.join(' ') || ''}`.toLowerCase();
          return searchText.includes(state.searchQuery.toLowerCase());
        });
      }

      // 应用标签过滤
      if (state.currentFilter) {
        users = users.filter(user => {
          return user.tags && user.tags.includes(state.currentFilter);
        });
      }

      // 按标记日期降序排序
      return users.sort((a, b) => new Date(b.markDate) - new Date(a.markDate));
    },

    // 过滤后的评论列表
    filteredComments: (state, getters) => {
      let comments = getters.savedCommentsList;

      // 应用搜索过滤
      if (state.searchQuery) {
        comments = comments.filter(comment => {
          const searchText = `${comment.content} ${comment.note} ${comment.tags?.join(' ') || ''}`.toLowerCase();
          return searchText.includes(state.searchQuery.toLowerCase());
        });
      }

      // 应用标签过滤
      if (state.currentFilter) {
        comments = comments.filter(comment => {
          return comment.tags && comment.tags.includes(state.currentFilter);
        });
      }

      // 按收藏日期降序排序
      return comments.sort((a, b) => new Date(b.commentDate) - new Date(a.commentDate));
    },

    // 统计信息
    stats: (state) => {
      return {
        userCount: Object.keys(state.markedUsers).length,
        commentCount: Object.keys(state.savedComments).length
      };
    },

    // 检查用户是否已标记
    isUserMarked: (state) => (userId) => {
      return state.markedUsers[userId] !== undefined;
    },

    // 检查评论是否已收藏
    isCommentSaved: (state) => (commentId) => {
      return state.savedComments[commentId] !== undefined;
    }
  },

  mutations: {
    // 设置标记的用户
    SET_MARKED_USERS(state, users) {
      state.markedUsers = users || {};
    },

    // 设置收藏的评论
    SET_SAVED_COMMENTS(state, comments) {
      state.savedComments = comments || {};
    },

    // 设置设置
    SET_SETTINGS(state, settings) {
      state.settings = { ...state.settings, ...settings };
    },

    // 添加用户标记
    ADD_USER_MARK(state, user) {
      if (user && user.userId) {
        state.markedUsers[user.userId] = user;
      }
    },

    // 移除用户标记
    REMOVE_USER_MARK(state, userId) {
      if (userId && state.markedUsers[userId]) {
        delete state.markedUsers[userId];
      }
    },

    // 添加评论收藏
    ADD_COMMENT_SAVE(state, comment) {
      if (comment && comment.commentId) {
        state.savedComments[comment.commentId] = comment;
      }
    },

    // 移除评论收藏
    REMOVE_COMMENT_SAVE(state, commentId) {
      if (commentId && state.savedComments[commentId]) {
        delete state.savedComments[commentId];
      }
    },

    // 设置当前过滤器
    SET_CURRENT_FILTER(state, filter) {
      state.currentFilter = filter;
    },

    // 设置搜索查询
    SET_SEARCH_QUERY(state, query) {
      state.searchQuery = query;
    },

    // 设置当前标签页
    SET_CURRENT_TAB(state, tab) {
      state.currentTab = tab;
    },

    // 设置加载状态
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },

    // 设置错误
    SET_ERROR(state, error) {
      state.error = error;
    },

    // 清除所有数据
    CLEAR_ALL_DATA(state) {
      state.markedUsers = {};
      state.savedComments = {};
    }
  },

  actions: {
    // 加载数据
    async loadData({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);

      try {
        // 发送消息到后台获取数据
        const usersResponse = await this.sendMessage('getMarkedUsers');
        const commentsResponse = await this.sendMessage('getSavedComments');
        const settingsResponse = await this.sendMessage('getSettings');

        if (usersResponse.success) {
          commit('SET_MARKED_USERS', usersResponse.data);
        }

        if (commentsResponse.success) {
          commit('SET_SAVED_COMMENTS', commentsResponse.data);
        }

        if (settingsResponse.success) {
          commit('SET_SETTINGS', settingsResponse.data);
        }
      } catch (error) {
        commit('SET_ERROR', error.message);
        console.error('加载数据失败:', error);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    // 标记用户
    async markUser({ commit }, userData) {
      try {
        const response = await this.sendMessage('markUser', userData);

        if (response.success) {
          commit('ADD_USER_MARK', response.data);
          return response.data;
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('标记用户失败:', error);
        throw error;
      }
    },

    // 取消标记用户
    async unmarkUser({ commit }, userId) {
      try {
        const response = await this.sendMessage('unmarkUser', { userId });

        if (response.success) {
          commit('REMOVE_USER_MARK', userId);
          return true;
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('取消标记用户失败:', error);
        throw error;
      }
    },

    // 收藏评论
    async saveComment({ commit }, commentData) {
      try {
        const response = await this.sendMessage('saveComment', commentData);

        if (response.success) {
          commit('ADD_COMMENT_SAVE', response.data);
          return response.data;
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('收藏评论失败:', error);
        throw error;
      }
    },

    // 移除评论收藏
    async removeComment({ commit }, commentId) {
      try {
        const response = await this.sendMessage('removeComment', { commentId });

        if (response.success) {
          commit('REMOVE_COMMENT_SAVE', commentId);
          return true;
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('移除评论收藏失败:', error);
        throw error;
      }
    },

    // 更新设置
    async updateSettings({ commit }, settings) {
      try {
        const response = await this.sendMessage('updateSettings', settings);

        if (response.success) {
          commit('SET_SETTINGS', response.data);
          return response.data;
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('更新设置失败:', error);
        throw error;
      }
    },

    // 导出数据
    async exportData() {
      try {
        const response = await this.sendMessage('exportData');

        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('导出数据失败:', error);
        throw error;
      }
    },

    // 导入数据
    async importData({ commit }, data) {
      try {
        const response = await this.sendMessage('importData', data);

        if (response.success) {
          // 重新加载数据
          await this.dispatch('loadData');
          return true;
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('导入数据失败:', error);
        throw error;
      }
    },

    // 清除所有数据
    async clearAllData({ commit }) {
      try {
        const response = await this.sendMessage('clearAllData');

        if (response.success) {
          commit('CLEAR_ALL_DATA');
          return true;
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('清除数据失败:', error);
        throw error;
      }
    },

    // 发送消息到后台
    sendMessage({ state }, { action, data }) {
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
});

export default store;