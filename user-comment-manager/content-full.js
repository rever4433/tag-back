// 完整内容脚本 - 用户标记与评论收藏器
// 此版本合并了所有依赖，不需要 ES6 模块导入

console.log('[UCM] 完整内容脚本已加载');

(function() {
  'use strict';

  // ==================== 辅助函数 ====================
  const helpers = {
    // 生成唯一 ID
    generateId: function(prefix = 'ucm') {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // 格式化日期
    formatDate: function(date) {
      const d = new Date(date);
      return d.toLocaleString('zh-CN');
    },

    // 截断文本
    truncateText: function(text, maxLength = 100) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substr(0, maxLength) + '...';
    },

    // 生成颜色
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
    },

    generateStableId: function(prefix, ...parts) {
      const baseString = parts.filter(Boolean).join('_') || `${prefix}_${Date.now()}`;
      let hash = 0;
      for (let i = 0; i < baseString.length; i++) {
        hash = ((hash << 5) - hash) + baseString.charCodeAt(i);
        hash |= 0;
      }
      return `${prefix}_${Math.abs(hash).toString(16)}`;
    },

    // 发送消息到后台
    sendMessage: function(action, data = {}) {
      return new Promise((resolve, reject) => {
        if (!chrome.runtime || !chrome.runtime.id) {
          console.log('[UCM] Chrome runtime 不可用');
          reject(new Error('Chrome runtime not available'));
          return;
        }
        console.log('[UCM] 发送消息到后台:', action);
        chrome.runtime.sendMessage({ action, data }, (response) => {
          console.log('[UCM] 收到后台响应:', response);
          if (chrome.runtime.lastError) {
            console.error('[UCM] 消息发送失败:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    }
  };

  const siteConfigs = {
    'ithome.com': {
      userSelectors: ['.nick', '.nick a'],
      getUserElements: function() {
        const elements = [];
        const seen = new Set();

        document.querySelectorAll('.nick').forEach(el => {
          if (!seen.has(el)) {
            seen.add(el);
            elements.push(el);
          }
        });

        document.querySelectorAll('.nick a, .comment-author, .comment-user, .user-name, .author-name').forEach(el => {
          const preferredContainer = el.closest('.nick');
          const target = preferredContainer || el;
          if (!seen.has(target)) {
            seen.add(target);
            elements.push(target);
          }
        });

        return elements;
      },
      getCommentUserElement: function(element) {
        return element.querySelector('.nick a, .nick, .comment-author, .comment-user, .user-name');
      },
      commentSelectors: ['.cdiv'],
      mutationSelectors: ['.nick', '.cdiv'],
      extractUserData: function(element) {
        try {
          let username = '';
          let profileUrl = '';

          if (element.classList.contains('nick')) {
            const link = element.querySelector('a');
            if (link) {
              profileUrl = link.href;
              username = link.textContent.trim();
            } else {
              username = element.textContent.trim();
            }
          } else if (element.tagName === 'A') {
            profileUrl = element.href;
            username = element.textContent.trim();
          } else {
            username = element.textContent.trim();
          }

          if (!username) {
            return null;
          }

          return {
            userId: helpers.generateStableId('user', 'ithome', username, profileUrl),
            username: username || '未知用户',
            profileUrl: profileUrl || '',
            website: 'ithome'
          };
        } catch (error) {
          console.error('提取用户信息失败:', error);
          return null;
        }
      },
      extractCommentData: function(element) {
        try {
          let content = '';
          let commentDate = '';
          let author = '';

          const contentElements = element.querySelectorAll('p:not(.p-ref)');
          if (contentElements.length > 0) {
            content = Array.from(contentElements).map(p => p.textContent.trim()).join('\n');
          }

          const timeElement = element.querySelector('.posandtime');
          if (timeElement) {
            commentDate = timeElement.textContent.trim();
          }

          const authorElement = element.querySelector('.nick');
          if (authorElement) {
            author = authorElement.textContent.trim();
          }

          return {
            commentId: helpers.generateStableId('comment', 'ithome', content || element.textContent.trim(), commentDate, author),
            content: content || element.textContent.trim(),
            commentDate: commentDate || new Date().toISOString(),
            author: author,
            website: 'ithome'
          };
        } catch (error) {
          console.error('提取评论信息失败:', error);
          return null;
        }
      },
      getCommentActionContainer: function(element) {
        return element.querySelector('.posandtime') || element;
      }
    },
    'zhihu.com': {
      dedupeAdjacentMarkActions: true,
      useInlineActionContainer: true,
      userSelectors: [
        '.ContentItem-author a[href*="/people/"]',
        '.AuthorInfo a[href*="/people/"]',
        '.CommentItem-meta a[href*="/people/"]',
        '.CommentItemV2-meta a[href*="/people/"]',
        '.Comments-container div[data-id] a[href*="/people/"]',
        '[data-testid="comment-item"] a[href*="/people/"]'
      ],
      getUserElements: function() {
        const elements = [];
        const seen = new Set();

        document.querySelectorAll('.ContentItem').forEach(root => {
          const authorLink = root.querySelector('.ContentItem-author a[href*="/people/"], .AuthorInfo a[href*="/people/"]');
          if (authorLink && !seen.has(authorLink)) {
            seen.add(authorLink);
            elements.push(authorLink);
          }
        });

        document.querySelectorAll('.Comments-container div[data-id]').forEach(root => {
          const authorLink = root.querySelector('a[href*="/people/"]');
          if (authorLink && !seen.has(authorLink)) {
            seen.add(authorLink);
            elements.push(authorLink);
          }
        });

        return elements;
      },
      getCommentUserElement: function(element) {
        return element.querySelector('a[href*="/people/"]');
      },
      commentSelectors: [
        '.CommentItem',
        '.CommentItemV2',
        '.Comments-container div[data-id]',
        '[data-testid="comment-item"]',
        '.NestComment'
      ],
      mutationSelectors: [
        '.Comments-container',
        'div[data-id]',
        '.ContentItem',
        '.CommentItem',
        '.CommentItemV2',
        '[data-testid="comment-item"]',
        '.ContentItem-author',
        '.AuthorInfo',
        '.CommentItem-meta',
        '.CommentItemV2-meta'
      ],
      extractUserData: function(element) {
        try {
          const link = element.matches('a[href*="/people/"]')
            ? element
            : element.querySelector('a[href*="/people/"]') || element.closest('a[href*="/people/"]');
          const profileUrl = link?.href || '';
          const username = (link?.textContent || element.textContent || '').trim().replace(/\s+/g, ' ');
          const match = profileUrl.match(/\/people\/([^/?#]+)/);

          if (!username || username.length > 50) {
            return null;
          }

          return {
            userId: match ? match[1] : helpers.generateStableId('user', 'zhihu', username, profileUrl),
            username,
            profileUrl,
            website: 'zhihu'
          };
        } catch (error) {
          console.error('提取知乎用户信息失败:', error);
          return null;
        }
      },
      extractCommentData: function(element) {
        try {
          const contentElement = element.querySelector('.CommentContent, .RichContent-inner, .RichText, [class*="CommentItem-content"]');
          const authorLink = element.querySelector('a[href*="/people/"]');
          const timeElement = element.querySelector('time, a[href*="#"]');
          const content = (contentElement?.textContent || element.textContent || '').trim().replace(/\s+/g, ' ');
          const author = (authorLink?.textContent || '').trim();
          const commentDate = timeElement?.getAttribute('datetime') || timeElement?.textContent?.trim() || '';

          if (!content) {
            return null;
          }

          return {
            commentId: element.getAttribute('data-zop') || element.dataset?.testid || helpers.generateStableId('comment', 'zhihu', content, commentDate, author),
            content,
            commentDate: commentDate || new Date().toISOString(),
            author,
            website: 'zhihu'
          };
        } catch (error) {
          console.error('提取知乎评论信息失败:', error);
          return null;
        }
      },
      getCommentActionContainer: function(element) {
        const authorLink = element.querySelector('a[href*="/people/"]');
        if (authorLink?.parentNode) {
          return authorLink;
        }
        return element.querySelector('.CommentItemV2-footer, .CommentItem-footer, .CommentItem-meta') || element;
      }
    }
  };

  function getCurrentSiteConfig() {
    const hostname = window.location.hostname;
    if (hostname.includes('zhihu.com')) {
      return siteConfigs['zhihu.com'];
    }
    if (hostname.includes('ithome.com')) {
      return siteConfigs['ithome.com'];
    }
    return null;
  }

  // ==================== DOM 管理器 ====================
  const domManager = {
    // 创建标记按钮
    createMarkButton: function(userData, onClick) {
      const button = document.createElement('button');
      button.className = 'ucm-mark-button';
      button.textContent = '标记';
      button.title = '标记用户';
      button.style.cssText = `
        background: transparent;
        color: #175199;
        border: none;
        padding: 0;
        border-radius: 0;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        margin-left: 4px;
        vertical-align: middle;
        line-height: 1.2;
        white-space: nowrap;
      `;

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick(userData);
      });

      return button;
    },

    // 创建收藏按钮
    createSaveButton: function(commentData, onClick) {
      const button = document.createElement('button');
      button.className = 'ucm-save-button';
      button.textContent = '收藏';
      button.title = '收藏评论';
      button.style.cssText = `
        background: transparent;
        color: #175199;
        border: none;
        padding: 0;
        border-radius: 0;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        margin-left: 4px;
        vertical-align: middle;
        line-height: 1.2;
        white-space: nowrap;
      `;

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick(commentData);
      });

      return button;
    },

    // 创建已标记标识
    createMarkedIndicator: function(userMarkData) {
      const indicator = document.createElement('span');
      indicator.className = 'ucm-marked-indicator';
      indicator.textContent = userMarkData.tags?.join(', ') || '已标记';
      indicator.style.cssText = `
        background: ${userMarkData.markColor || '#4285F4'};
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        margin-left: 4px;
        cursor: pointer;
      `;
      indicator.title = userMarkData.markNote || '已标记用户';
      return indicator;
    },

    // 查找用户元素
    findUserElements: function(selectors, siteConfig) {
      if (siteConfig?.getUserElements) {
        return siteConfig.getUserElements();
      }

      const elements = [];
      const seen = new Set();
      selectors.forEach(selector => {
        const found = document.querySelectorAll(selector);
        found.forEach(el => {
          if (!seen.has(el)) {
            seen.add(el);
            elements.push(el);
          }
        });
      });
      return elements;
    },

    // 查找评论元素
    findCommentElements: function(selectors) {
      const elements = [];
      const seen = new Set();
      selectors.forEach(selector => {
        const found = document.querySelectorAll(selector);
        found.forEach(el => {
          if (!seen.has(el)) {
            seen.add(el);
            elements.push(el);
          }
        });
      });
      return elements;
    },

    getInlineActionContainer: function(element) {
      if (!element?.parentNode) return null;

      let container = element.nextElementSibling;
      if (container?.classList?.contains('ucm-inline-actions')) {
        return container;
      }

      container = document.createElement('span');
      container.className = 'ucm-inline-actions';
      container.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 4px;
        vertical-align: middle;
        white-space: nowrap;
      `;
      element.parentNode.insertBefore(container, element.nextSibling);
      return container;
    },

    getInlineNameWrapper: function(element) {
      if (!element?.parentNode) return null;

      let wrapper = element.parentNode;
      if (wrapper.classList?.contains('ucm-name-wrapper')) {
        return wrapper;
      }

      wrapper = document.createElement('span');
      wrapper.className = 'ucm-name-wrapper';
      wrapper.style.cssText = `
        display: inline-flex;
        align-items: center;
        flex-wrap: nowrap;
        white-space: nowrap;
        vertical-align: middle;
      `;
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);
      return wrapper;
    },

    insertActionNearElement: function(element, actionElement, siteConfig) {
      if (!element || !actionElement) return;

      if (siteConfig?.useInlineActionContainer && element.tagName === 'A') {
        this.getInlineNameWrapper(element);
        const container = this.getInlineActionContainer(element);
        container?.appendChild(actionElement);
        return;
      }

      if (element.tagName === 'A' && element.parentNode) {
        element.parentNode.insertBefore(actionElement, element.nextSibling);
        return;
      }

      element.appendChild(actionElement);
    },

    findAdjacentActionElements: function(element, selector) {
      const results = [];
      if (!element?.parentNode) return results;

      const inlineContainer = element.nextElementSibling;
      if (inlineContainer?.classList?.contains('ucm-inline-actions')) {
        inlineContainer.querySelectorAll(selector).forEach(actionEl => results.push(actionEl));
        return results;
      }

      let sibling = element.nextElementSibling;
      while (sibling && sibling.matches?.(selector)) {
        results.push(sibling);
        sibling = sibling.nextElementSibling;
      }

      return results;
    },

    removeAdjacentActionElements: function(element, selector, preserveElement = null) {
      this.findAdjacentActionElements(element, selector).forEach(actionEl => {
        if (actionEl !== preserveElement) {
          actionEl.remove();
        }
      });

      const inlineContainer = element?.nextElementSibling;
      if (inlineContainer?.classList?.contains('ucm-inline-actions') && inlineContainer.childElementCount === 0) {
        inlineContainer.remove();
      }
    },

    removeActionElement: function(element) {
      if (!element) return;

      if (element.classList?.contains('ucm-mark-button') || element.classList?.contains('ucm-marked-indicator')) {
        element.remove();
      }
    },

    extractUserData: function(element, siteConfig) {
      return siteConfig?.extractUserData ? siteConfig.extractUserData(element) : null;
    },

    extractCommentData: function(element, siteConfig) {
      return siteConfig?.extractCommentData ? siteConfig.extractCommentData(element) : null;
    }
  };

  // ==================== 主逻辑 ====================
  class ContentScript {
    constructor() {
      this.markedUsers = new Map();
      this.savedComments = new Map();
      this.settings = {
        markButtonText: '标记',
        saveButtonText: '收藏'
      };
      this.initialized = false;
      this.siteConfig = getCurrentSiteConfig();
    }

    async init() {
      if (this.initialized) return;
      if (!this.siteConfig) {
        console.log('[UCM] 当前站点暂未适配:', window.location.hostname);
        return;
      }

      console.log('[UCM] 开始初始化...');

      // 加载已标记的数据（异步，不阻塞）
      try {
        helpers.sendMessage('getMarkedUsers').then(usersResponse => {
          if (usersResponse && usersResponse.success) {
            Object.keys(usersResponse.data).forEach(userId => {
              this.markedUsers.set(userId, usersResponse.data[userId]);
            });
            console.log('[UCM] 已加载标记用户:', this.markedUsers.size);
          }
        });
      } catch (e) {
        console.log('[UCM] 加载用户数据失败:', e.message);
      }

      try {
        helpers.sendMessage('getSavedComments').then(commentsResponse => {
          if (commentsResponse && commentsResponse.success) {
            Object.keys(commentsResponse.data).forEach(commentId => {
              this.savedComments.set(commentId, commentsResponse.data[commentId]);
            });
            console.log('[UCM] 已加载收藏评论:', this.savedComments.size);
          }
        });
      } catch (e) {
        console.log('[UCM] 加载评论数据失败:', e.message);
      }

      try {
        helpers.sendMessage('getSettings').then(settingsResponse => {
          if (settingsResponse && settingsResponse.success) {
            this.settings = {
              ...this.settings,
              ...settingsResponse.data
            };
            console.log('[UCM] 已加载设置');
          }
        });
      } catch (e) {
        console.log('[UCM] 加载设置失败:', e.message);
      }

      // 选择器
      const userSelectors = this.siteConfig.userSelectors;
      const commentSelectors = this.siteConfig.commentSelectors;

      // 注入按钮的函数
      const injectButtons = () => {
        console.log('[UCM] 执行按钮注入...');
        this.injectMarkButtons(userSelectors);
        this.injectSaveButtons(commentSelectors);
      };

      // 立即执行一次
      console.log('[UCM] 立即执行注入...');
      setTimeout(injectButtons, 800);

      // 延迟执行，等待更多评论加载
      setTimeout(() => {
        console.log('[UCM] 延迟执行注入...');
        injectButtons();
      }, 2000);

      // 监听 DOM 变化
      const observer = new MutationObserver((mutations) => {
        let shouldInject = false;
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) {
                if (node.querySelector && this.siteConfig.mutationSelectors.some(selector => node.matches?.(selector) || node.querySelector(selector))) {
                  shouldInject = true;
                }
              }
            });
          }
        });
        if (shouldInject) {
          console.log('[UCM] DOM 变化检测到新内容');
          setTimeout(injectButtons, 500);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      console.log('[UCM] 已启动 DOM 监听');
      this.initialized = true;
    }

    injectMarkButtons(selectors) {
      const userElements = domManager.findUserElements(selectors, this.siteConfig);
      console.log('[UCM] 找到用户元素数量:', userElements.length);

      let addedCount = 0;
      userElements.forEach((element, index) => {
        // 检查元素本身是否有按钮类
        if (element.classList.contains('ucm-mark-button') || element.classList.contains('ucm-marked-indicator')) return;
        // 检查子元素是否有按钮
        if (element.querySelector('.ucm-mark-button') || element.querySelector('.ucm-marked-indicator')) return;
        // 检查是否已经有测试按钮（旧版本残留）
        if (element.querySelector('.ucm-test-btn')) return;

        const userData = domManager.extractUserData(element, this.siteConfig);
        if (!userData) return;

        if (this.siteConfig.dedupeAdjacentMarkActions) {
          const existingActions = domManager.findAdjacentActionElements(
            element,
            '.ucm-mark-button, .ucm-marked-indicator'
          );
          const hasMatchingAction = existingActions.some(actionEl => actionEl.dataset.ucmUserId === userData.userId);
          if (hasMatchingAction) {
            domManager.removeAdjacentActionElements(
              element,
              '.ucm-mark-button, .ucm-marked-indicator',
              existingActions.find(actionEl => actionEl.dataset.ucmUserId === userData.userId)
            );
            return;
          }

          domManager.removeAdjacentActionElements(element, '.ucm-mark-button, .ucm-marked-indicator');
        }

        const isMarked = this.markedUsers.has(userData.userId);

        if (isMarked) {
          const userMarkData = this.markedUsers.get(userData.userId);
          // 创建标签显示在用户名后面
          const indicator = document.createElement('span');
          indicator.className = 'ucm-marked-indicator';
          indicator.textContent = userMarkData.tags?.join(', ') || '已标记';
          indicator.style.cssText = `
            background: transparent;
            color: ${userMarkData.markColor || '#175199'};
            padding: 0;
            border-radius: 0;
            font-size: 13px;
            font-weight: 500;
            margin-left: 2px;
            margin-right: 2px;
            cursor: pointer;
            display: inline;
            line-height: inherit;
            white-space: nowrap;
          `;
          indicator.title = userMarkData.markNote || '已标记用户';
          if (this.siteConfig.dedupeAdjacentMarkActions) {
            indicator.dataset.ucmUserId = userData.userId;
          }
          indicator.addEventListener('click', (e) => {
            e.stopPropagation();
            alert(`用户：${userData.username}\n备注：${userMarkData.markNote || '无'}\n标签：${userMarkData.tags?.join(', ') || '无'}`);
          });
          domManager.insertActionNearElement(element, indicator, this.siteConfig);
          console.log('[UCM] 已标记用户，显示标签:', userData.username);
        } else {
          // 只添加标记按钮，不显示标签
          const button = domManager.createMarkButton(userData, (data) => {
            this.handleMarkUser(data);
          });
          button.textContent = this.settings.markButtonText || '标记';
          if (this.siteConfig.dedupeAdjacentMarkActions) {
            button.dataset.ucmUserId = userData.userId;
          }
          domManager.insertActionNearElement(element, button, this.siteConfig);
          console.log('[UCM] 添加标记按钮:', userData.username);
        }

        addedCount++;
      });

      console.log('[UCM] 新增标记按钮/标签:', addedCount);
    }

    injectSaveButtons(selectors) {
      const commentElements = domManager.findCommentElements(selectors);
      console.log('[UCM] 找到评论元素数量:', commentElements.length);

      let addedCount = 0;
      const processedCommentIds = new Set();
      commentElements.forEach((element, index) => {
        const commentData = domManager.extractCommentData(element, this.siteConfig);
        if (!commentData) return;
        if (processedCommentIds.has(commentData.commentId)) return;
        processedCommentIds.add(commentData.commentId);

        const commentUserElement = this.siteConfig.getCommentUserElement
          ? this.siteConfig.getCommentUserElement(element)
          : null;

        if (commentUserElement) {
          const existingSaveActions = domManager.findAdjacentActionElements(commentUserElement, '.ucm-save-button');
          const matchedAction = existingSaveActions.find(actionEl => actionEl.dataset.ucmCommentId === commentData.commentId);
          if (matchedAction) {
            existingSaveActions.forEach(actionEl => {
              if (actionEl !== matchedAction) {
                actionEl.remove();
              }
            });
            return;
          }

          existingSaveActions.forEach(actionEl => actionEl.remove());
        } else if (element.querySelector('.ucm-save-button')) {
          return;
        }

        const isSaved = this.savedComments.has(commentData.commentId);

        const button = domManager.createSaveButton(commentData, (data) => {
          this.handleSaveComment(data);
        });
        button.textContent = this.settings.saveButtonText || '收藏';
        button.dataset.ucmCommentId = commentData.commentId;

        if (isSaved) {
          button.textContent = '已收藏';
          button.style.color = '#8590a6';
        }

        if (commentUserElement) {
          domManager.insertActionNearElement(commentUserElement, button, this.siteConfig);
        } else {
          const actionContainer = this.siteConfig.getCommentActionContainer
            ? this.siteConfig.getCommentActionContainer(element)
            : element;
          actionContainer.appendChild(button);
        }

        addedCount++;
      });

      console.log('[UCM] 新增收藏按钮:', addedCount);
    }

    handleMarkUser(userData) {
      console.log('[UCM] 准备标记用户:', userData);

      // 先获取现有标签列表
      helpers.sendMessage('getAllTags').then(tagsResponse => {
        const existingTags = tagsResponse.success ? tagsResponse.data : [];

        // 创建标记对话框
        const dialog = document.createElement('div');
        dialog.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          z-index: 100000;
          padding: 20px;
          min-width: 300px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        let selectedTags = [];

        dialog.innerHTML = `
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">标记用户：${userData.username}</h3>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">备注：</label>
            <input type="text" id="ucm-mark-note" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="输入备注...">
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">选择标签：</label>
            <div id="ucm-tag-list" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 150px; overflow-y: auto; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
              ${existingTags.length > 0 ? existingTags.map(tag => `
                <span class="ucm-tag-option" data-tag="${tag}" style="
                  background: #e8f0fe;
                  color: #1a73e8;
                  padding: 4px 10px;
                  border-radius: 12px;
                  font-size: 12px;
                  cursor: pointer;
                  border: 2px solid transparent;
                  transition: all 0.2s;
                ">${tag}</span>
              `).join('') : '<span style="color: #999; font-size: 12px;">暂无标签，请在扩展 popup 中管理标签</span>'}
            </div>
            <input type="text" id="ucm-new-tag" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; margin-top: 8px;" placeholder="输入新标签，按回车添加...">
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button id="ucm-cancel-btn" style="padding: 8px 16px; border: none; background: #f1f3f4; border-radius: 4px; cursor: pointer; font-size: 14px;">取消</button>
            <button id="ucm-confirm-btn" style="padding: 8px 16px; border: none; background: #4285F4; color: white; border-radius: 4px; cursor: pointer; font-size: 14px;">确定</button>
          </div>
        `;

        // 添加遮罩层
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          z-index: 99999;
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        // 标签选择逻辑
        dialog.querySelectorAll('.ucm-tag-option').forEach(tagEl => {
          tagEl.addEventListener('click', () => {
            const tag = tagEl.dataset.tag;
            if (selectedTags.includes(tag)) {
              selectedTags = selectedTags.filter(t => t !== tag);
              tagEl.style.background = '#e8f0fe';
              tagEl.style.color = '#1a73e8';
              tagEl.style.borderColor = 'transparent';
            } else {
              selectedTags.push(tag);
              tagEl.style.background = '#4285F4';
              tagEl.style.color = 'white';
              tagEl.style.borderColor = '#4285F4';
            }
          });
        });

        // 添加新标签
        const newTagInput = dialog.querySelector('#ucm-new-tag');
        newTagInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && newTagInput.value.trim()) {
            const newTag = newTagInput.value.trim();
            if (!existingTags.includes(newTag)) {
              existingTags.push(newTag);
              const tagEl = document.createElement('span');
              tagEl.className = 'ucm-tag-option';
              tagEl.dataset.tag = newTag;
              tagEl.textContent = newTag;
              tagEl.style.cssText = `
                background: #e8f0fe;
                color: #1a73e8;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
                cursor: pointer;
                border: 2px solid transparent;
                transition: all 0.2s;
              `;
              dialog.querySelector('#ucm-tag-list').appendChild(tagEl);

              tagEl.addEventListener('click', () => {
                if (selectedTags.includes(newTag)) {
                  selectedTags = selectedTags.filter(t => t !== newTag);
                  tagEl.style.background = '#e8f0fe';
                  tagEl.style.color = '#1a73e8';
                  tagEl.style.borderColor = 'transparent';
                } else {
                  selectedTags.push(newTag);
                  tagEl.style.background = '#4285F4';
                  tagEl.style.color = 'white';
                  tagEl.style.borderColor = '#4285F4';
                }
              });
            }
            newTagInput.value = '';
          }
        });

        // 取消按钮
        dialog.querySelector('#ucm-cancel-btn').addEventListener('click', () => {
          document.body.removeChild(dialog);
          document.body.removeChild(overlay);
        });

        // 确定按钮
        dialog.querySelector('#ucm-confirm-btn').addEventListener('click', () => {
          const note = dialog.querySelector('#ucm-mark-note').value;

          const markData = {
            ...userData,
            markDate: new Date().toISOString(),
            markNote: note,
            tags: selectedTags,
            markColor: helpers.generateColor(userData.username)
          };

          console.log('[UCM] 提交标记数据:', markData);

          helpers.sendMessage('markUser', markData).then(response => {
            console.log('[UCM] 后台响应:', response);
            if (response.success) {
              this.markedUsers.set(userData.userId, markData);
              // 保存新标签到后台
              if (selectedTags.length > 0) {
                helpers.sendMessage('saveTags', { tags: existingTags });
              }
              alert('已标记用户：' + userData.username);
              // 重新注入按钮，显示标签
              setTimeout(() => {
                this.injectMarkButtons(this.siteConfig.userSelectors);
                this.injectSaveButtons(this.siteConfig.commentSelectors);
              }, 300);
            } else {
              alert('标记失败：' + (response.error || '未知错误'));
            }
          }).catch(e => {
            console.error('[UCM] 标记失败:', e);
            this.markedUsers.set(userData.userId, markData);
            alert('已本地标记用户：' + userData.username);
            setTimeout(() => {
              this.injectMarkButtons(this.siteConfig.userSelectors);
              this.injectSaveButtons(this.siteConfig.commentSelectors);
            }, 300);
          });

          document.body.removeChild(dialog);
          document.body.removeChild(overlay);
        });
      }).catch(e => {
        console.error('[UCM] 获取标签失败:', e);
        // 如果获取标签失败，使用简单对话框
        const note = prompt('添加备注:', '');
        if (note === null) return;

        const markData = {
          ...userData,
          markDate: new Date().toISOString(),
          markNote: note,
          tags: [],
          markColor: helpers.generateColor(userData.username)
        };

        helpers.sendMessage('markUser', markData).then(response => {
          if (response.success) {
            this.markedUsers.set(userData.userId, markData);
            alert('已标记用户：' + userData.username);
            setTimeout(() => {
              this.injectMarkButtons(this.siteConfig.userSelectors);
              this.injectSaveButtons(this.siteConfig.commentSelectors);
            }, 300);
          }
        }).catch(e => {
          console.error('[UCM] 标记失败:', e);
          this.markedUsers.set(userData.userId, markData);
          alert('已本地标记用户：' + userData.username);
        });
      });
    }

    handleSaveComment(commentData) {
      const note = prompt('添加备注:', '');
      if (note === null) return;

      const tags = prompt('添加标签（用逗号分隔）:', '');

      const saveData = {
        ...commentData,
        note: note,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : []
      };

      helpers.sendMessage('saveComment', saveData).then(response => {
        if (response.success) {
          this.savedComments.set(commentData.commentId, saveData);
          alert('已收藏评论');
          // 刷新按钮
          setTimeout(() => this.injectSaveButtons(this.siteConfig.commentSelectors), 500);
        }
      }).catch(e => {
        console.error('收藏失败:', e);
        alert('已收藏评论（未保存到扩展存储）');
      });
    }
  }

  // 启动
  const contentScript = new ContentScript();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => contentScript.init());
  } else {
    contentScript.init();
  }
})();
