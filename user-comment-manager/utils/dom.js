// DOM操作工具
class DOMManager {
  constructor() {
    this.observer = null;
    this.markedElements = new Map();
  }

  // 创建标记按钮
  createMarkButton(userData, onClick) {
    const button = document.createElement('button');
    button.className = 'ucm-mark-button';
    button.textContent = '标记';
    button.title = '标记用户';
    button.style.cssText = `
      background: #4285F4;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 4px;
      vertical-align: middle;
    `;

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick(userData);
    });

    return button;
  }

  // 创建收藏按钮
  createSaveButton(commentData, onClick) {
    const button = document.createElement('button');
    button.className = 'ucm-save-button';
    button.textContent = '收藏';
    button.title = '收藏评论';
    button.style.cssText = `
      background: #34A853;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 4px;
      vertical-align: middle;
    `;

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick(commentData);
    });

    return button;
  }

  // 创建已标记用户的视觉标识
  createMarkedIndicator(userMarkData) {
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
      vertical-align: middle;
      cursor: pointer;
    `;

    indicator.title = userMarkData.markNote || '已标记用户';
    indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      // 可以在这里添加查看详情的功能
    });

    return indicator;
  }

  // 在元素旁插入按钮（优化版 - 修复 ithome 显示问题）
  insertButtonAfter(element, button) {
    if (!element || !button) return;
    
    // 方法 1: 直接追加到元素内部（更可靠）
    if (element.tagName === 'A' || element.classList.contains('comment-author') || element.classList.contains('user-name')) {
      element.appendChild(button);
      console.log('[UCM] 按钮已追加到元素内部:', element);
      return;
    }
    
    // 方法 2: 插入到父元素的子元素中
    if (element.parentNode) {
      // 尝试找到合适的位置（在用户名后面）
      const nextSibling = element.nextSibling;
      if (nextSibling) {
        element.parentNode.insertBefore(button, nextSibling);
      } else {
        element.parentNode.appendChild(button);
      }
      console.log('[UCM] 按钮已插入到元素后面:', element.parentNode);
    }
  }

  // 在元素前插入按钮
  insertButtonBefore(element, button) {
    if (element && element.parentNode) {
      element.parentNode.insertBefore(button, element);
    }
  }

  // 查找用户元素（根据网站适配器）
  findUserElements(adapter) {
    const selectors = adapter.getUserSelectors();
    const elements = [];

    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector);
      found.forEach(el => elements.push(el));
    });

    return elements;
  }

  // 查找评论元素（根据网站适配器）
  findCommentElements(adapter) {
    const selectors = adapter.getCommentSelectors();
    const elements = [];

    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector);
      found.forEach(el => elements.push(el));
    });

    return elements;
  }

  // 提取用户信息（根据网站适配器）
  extractUserData(element, adapter) {
    return adapter.extractUserData(element);
  }

  // 提取评论信息（根据网站适配器）
  extractCommentData(element, adapter) {
    return adapter.extractCommentData(element);
  }

  // 监听DOM变化
  observeDOMChanges(callback, options = {}) {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      callback(mutations);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      ...options
    });
  }

  // 停止监听
  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  // 添加CSS样式
  addStyles(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    return style;
  }

  // 创建弹出窗口
  createPopup(content, options = {}) {
    const popup = document.createElement('div');
    popup.className = 'ucm-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 80vw;
      max-height: 80vh;
      overflow: auto;
      padding: 20px;
    `;

    if (options.width) {
      popup.style.width = options.width;
    }

    if (options.height) {
      popup.style.height = options.height;
    }

    popup.innerHTML = content;

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;

    overlay.addEventListener('click', () => {
      document.body.removeChild(overlay);
      document.body.removeChild(popup);
    });

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    return { popup, overlay };
  }

  // 显示通知
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `ucm-notification ucm-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#34A853' : type === 'error' ? '#EA4335' : '#4285F4'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10001;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // 生成唯一ID
  generateId(prefix = 'ucm') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 格式化日期
  formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 截断文本
  truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }
}

// 创建单例实例
const domManager = new DOMManager();

// 添加CSS动画
domManager.addStyles(`
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  .ucm-mark-button:hover, .ucm-save-button:hover {
    opacity: 0.9;
    transform: scale(1.05);
  }
  .ucm-marked-indicator:hover {
    opacity: 0.8;
  }
`);

export default domManager;