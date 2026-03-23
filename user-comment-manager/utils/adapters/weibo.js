// 微博网站适配器
class WeiboAdapter {
  constructor() {
    this.siteName = 'weibo';
    this.siteDomain = 'weibo.com';
  }

  // 获取用户元素选择器
  getUserSelectors() {
    return [
      '.W_name',                // 微博用户名
      '.user-name',             // 用户名
      '.avatar',                // 头像
      '.WB_name',               // 微博名称
      '.WB_info a',             // 微博信息链接
      '.comment-user',          // 评论用户
      '.user-info',             // 用户信息
      '.WB_text a',             // 微博文本中的链接
      '.WB_from a'              // 微博来源链接
    ];
  }

  // 获取评论元素选择器
  getCommentSelectors() {
    return [
      '.comment-item',          // 评论项
      '.WB_comment',            // 微博评论
      '.comment-content',       // 评论内容
      '.comment-text',          // 评论文本
      '.WB_feed_detail',        // 微博详情
      '.comment-list .item'     // 评论列表项
    ];
  }

  // 提取用户信息
  extractUserData(element) {
    try {
      let username = '';
      let profileUrl = '';
      let userId = '';

      // 尝试从链接中提取
      if (element.tagName === 'A' && element.href) {
        profileUrl = element.href;
        username = element.textContent.trim();

        // 微博用户ID通常在URL中
        const match = profileUrl.match(/u\/(\d+)/);
        if (match) {
          userId = match[1];
        } else {
          userId = this.generateUserId(username, profileUrl);
        }
      }
      // 从文本内容中提取
      else {
        username = element.textContent.trim();
        const link = element.querySelector('a');
        if (link && link.href) {
          profileUrl = link.href;
          const match = profileUrl.match(/u\/(\d+)/);
          if (match) {
            userId = match[1];
          } else {
            userId = this.generateUserId(username, profileUrl);
          }
        } else {
          userId = this.generateUserId(username, element.textContent);
        }
      }

      // 如果没有找到用户ID，尝试从父元素中查找
      if (!userId) {
        const parentLink = element.closest('a');
        if (parentLink && parentLink.href) {
          profileUrl = parentLink.href;
          const match = profileUrl.match(/u\/(\d+)/);
          if (match) {
            userId = match[1];
          }
        }
      }

      // 如果仍然没有用户ID，使用用户名作为标识
      if (!userId && username) {
        userId = this.generateUserId(username, profileUrl);
      }

      return {
        userId: userId || 'unknown',
        username: username || '未知用户',
        profileUrl: profileUrl || '',
        website: this.siteName
      };
    } catch (error) {
      console.error('提取微博用户信息失败:', error);
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

      // 查找评论内容
      const contentElement = element.querySelector('.comment-content, .comment-text, .WB_text');
      if (contentElement) {
        content = contentElement.textContent.trim();
      } else {
        content = element.textContent.trim();
      }

      // 查找评论时间
      const timeElement = element.querySelector('.comment-time, .time, .WB_from');
      if (timeElement) {
        commentDate = timeElement.textContent.trim();
        // 微博时间格式通常是 "01-15 10:30" 或 "今天 10:30"
        if (commentDate.includes('今天')) {
          const now = new Date();
          const timeMatch = commentDate.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            now.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
            commentDate = now.toISOString();
          }
        } else if (commentDate.match(/\d{2}-\d{2}/)) {
          const now = new Date();
          const dateMatch = commentDate.match(/(\d{2})-(\d{2})/);
          if (dateMatch) {
            now.setMonth(parseInt(dateMatch[1]) - 1, parseInt(dateMatch[2]));
            commentDate = now.toISOString();
          }
        }
      }

      // 查找作者
      const authorElement = element.querySelector('.comment-user, .user-name, .W_name');
      if (authorElement) {
        author = authorElement.textContent.trim();
      }

      // 生成评论ID
      commentId = this.generateCommentId(content, commentDate, author);

      return {
        commentId: commentId,
        content: content,
        commentDate: commentDate || new Date().toISOString(),
        author: author,
        website: this.siteName
      };
    } catch (error) {
      console.error('提取微博评论信息失败:', error);
      return null;
    }
  }

  // 生成用户ID
  generateUserId(username, profileUrl) {
    const baseId = `${username}_${profileUrl}`.replace(/\s+/g, '_');
    return btoa(baseId).replace(/=/g, '').substr(0, 16);
  }

  // 生成评论ID
  generateCommentId(content, commentDate, author) {
    const baseId = `${content}_${commentDate}_${author}`.replace(/\s+/g, '_');
    return btoa(baseId).replace(/=/g, '').substr(0, 16);
  }

  // 检查是否在目标页面
  isTargetPage() {
    return window.location.hostname === this.siteDomain;
  }

  // 获取页面类型
  getPageType() {
    const path = window.location.pathname;

    if (path.includes('/status/')) {
      return 'status';
    } else if (path.includes('/u/')) {
      return 'profile';
    } else if (path.includes('/home')) {
      return 'home';
    } else if (path.includes('/search')) {
      return 'search';
    } else {
      return 'other';
    }
  }

  // 获取当前页面的用户信息（从URL）
  getCurrentUserFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/u\/(\d+)/);

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
    return document.querySelector('.comment-list, .WB_feed_detail, .comment-box');
  }

  // 获取用户信息容器
  getUserInfoContainer() {
    return document.querySelector('.WB_info, .user-info, .profile-info');
  }
}

// 导出适配器
export default WeiboAdapter;