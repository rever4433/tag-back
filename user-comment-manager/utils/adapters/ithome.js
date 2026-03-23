// IT 之家网站适配器
class ITHomeAdapter {
  constructor() {
    this.siteName = 'ithome';
    this.siteDomain = 'www.ithome.com';
  }

  // 获取用户元素选择器
  getUserSelectors() {
    return [
      '.nick',                    // IT 之家用户名（最常见）
      '.nick a',                  // 用户名链接
      '.comment-author',          // 评论作者
      '.comment-user',            // 评论用户
      '.user-name',               // 用户名
      '.author-name',             // 作者名称
      '.comment-list .user',      // 评论列表中的用户
      '.reply-user',              // 回复用户
      '.floor-user'               // 楼层用户
    ];
  }

  // 获取评论元素选择器
  getCommentSelectors() {
    return [
      '.cdiv',                    // IT 之家评论容器（最常见）
      '.comment-item',            // 评论项
      '.comment-content',         // 评论内容
      '.comment-list > div',      // 评论列表下的 div
      '.reply-item',              // 回复项
      '.floor-item'               // 楼层项
    ];
  }

  // 提取用户信息
  extractUserData(element) {
    try {
      let username = '';
      let profileUrl = '';
      let userId = '';

      // 如果是 .nick 元素，提取内部的 a 标签
      if (element.classList.contains('nick')) {
        const link = element.querySelector('a');
        if (link) {
          profileUrl = link.href;
          username = link.textContent.trim();
        } else {
          username = element.textContent.trim();
        }
      }
      // 如果是链接元素
      else if (element.tagName === 'A' && element.href) {
        profileUrl = element.href;
        username = element.textContent.trim();
      }
      // 其他情况
      else {
        username = element.textContent.trim();
        const link = element.querySelector('a');
        if (link && link.href) {
          profileUrl = link.href;
        }
      }

      // 生成用户 ID
      userId = this.generateUserId(username, profileUrl);

      return {
        userId: userId || 'unknown',
        username: username || '未知用户',
        profileUrl: profileUrl || '',
        website: this.siteName
      };
    } catch (error) {
      console.error('提取 IT 之家用户信息失败:', error);
      return null;
    }
  }

  // 提取评论信息
  extractCommentData(element) {
    try {
      let content = '';
      let commentDate = '';
      let author = '';
      let commentId = '';

      // IT 之家评论结构：.cdiv > p (评论内容) 或 .cdiv .comm p
      const contentElements = element.querySelectorAll('p:not(.p-ref)');
      if (contentElements.length > 0) {
        content = Array.from(contentElements).map(p => p.textContent.trim()).join('\n');
      } else {
        content = element.textContent.trim();
      }

      // 查找评论时间
      const timeElement = element.querySelector('.posandtime, .comment-time, .time');
      if (timeElement) {
        commentDate = timeElement.textContent.trim();
      }

      // 查找作者
      const authorElement = element.querySelector('.nick, .nick a, .comment-author, .user-name');
      if (authorElement) {
        author = authorElement.textContent.trim();
      }

      // 生成评论 ID
      commentId = this.generateCommentId(content, commentDate, author);

      return {
        commentId: commentId,
        content: content,
        commentDate: commentDate || new Date().toISOString(),
        author: author,
        website: this.siteName
      };
    } catch (error) {
      console.error('提取 IT 之家评论信息失败:', error);
      return null;
    }
  }

  // 生成用户 ID
  generateUserId(username, profileUrl) {
    const baseId = `${username}_${profileUrl}`.replace(/\s+/g, '_');
    try {
      return btoa(baseId).replace(/=/g, '').substr(0, 16);
    } catch (e) {
      return `user_${username.length}_${Date.now()}`;
    }
  }

  // 生成评论 ID
  generateCommentId(content, commentDate, author) {
    const baseId = `${content}_${commentDate}_${author}`.replace(/\s+/g, '_');
    try {
      return btoa(baseId).replace(/=/g, '').substr(0, 16);
    } catch (e) {
      return `comment_${Date.now()}`;
    }
  }

  // 检查是否在目标页面
  isTargetPage() {
    return window.location.hostname === this.siteDomain;
  }

  // 获取页面类型
  getPageType() {
    const path = window.location.pathname;

    if (path.includes('/news/')) {
      return 'news';
    } else if (path.includes('/article/')) {
      return 'article';
    } else if (path.includes('/user/')) {
      return 'profile';
    } else {
      return 'other';
    }
  }

  // 获取当前页面的用户信息（从 URL）
  getCurrentUserFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/user\/(\d+)/);

    if (match) {
      return {
        userId: match[1],
        profileUrl: window.location.href,
        website: this.siteName
      };
    }

    return null;
  }

  // 获取评论容器
  getCommentContainer() {
    return document.querySelector('.comment-list, .comments, .comment-box, .bttbar');
  }

  // 获取用户信息容器
  getUserInfoContainer() {
    return document.querySelector('.user-info, .profile-info, .author-info');
  }
}

// 导出适配器
export default ITHomeAdapter;
