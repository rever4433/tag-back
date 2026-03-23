// 知乎网站适配器
class ZhihuAdapter {
  constructor() {
    this.siteName = 'zhihu';
    this.siteDomain = 'www.zhihu.com';
  }

  // 获取用户元素选择器
  getUserSelectors() {
    return [
      '.author-link',           // 回答作者链接
      '.user-link',             // 用户主页链接
      '.author-info',           // 作者信息区域
      '.PeopleItem-name',       // 个人主页名称
      '.UserLink-link',         // 用户链接
      '.ContentItem-author',    // 内容作者
      '.CommentItem-author',    // 评论作者
      '.comment-item .author'   // 评论中的作者
    ];
  }

  // 获取评论元素选择器
  getCommentSelectors() {
    return [
      '.comment-item',          // 评论项
      '.CommentItem',           // 评论项（新版本）
      '.CommentItem-content',   // 评论内容
      '.RichText',              // 富文本内容
      '.CommentItem-meta',      // 评论元信息
      '.comment-list .comment-item' // 评论列表中的评论
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

        // 从URL中提取用户ID
        const match = profileUrl.match(/people\/([^/?#]+)/);
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
          const match = profileUrl.match(/people\/([^/?#]+)/);
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
          const match = profileUrl.match(/people\/([^/?#]+)/);
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
      console.error('提取知乎用户信息失败:', error);
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
      const contentElement = element.querySelector('.CommentItem-content, .RichText, .comment-content');
      if (contentElement) {
        content = contentElement.textContent.trim();
      } else {
        content = element.textContent.trim();
      }

      // 查找评论时间
      const timeElement = element.querySelector('.CommentItem-meta, .comment-meta, time');
      if (timeElement) {
        commentDate = timeElement.textContent.trim();
        // 尝试解析相对时间
        if (commentDate.includes('分钟前') || commentDate.includes('小时前') || commentDate.includes('天前')) {
          commentDate = this.parseRelativeTime(commentDate);
        }
      }

      // 查找作者
      const authorElement = element.querySelector('.CommentItem-author, .author, .user-name');
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
      console.error('提取知乎评论信息失败:', error);
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

  // 解析相对时间
  parseRelativeTime(text) {
    const now = new Date();
    let date = new Date();

    if (text.includes('分钟前')) {
      const minutes = parseInt(text.match(/\d+/)[0]);
      date = new Date(now.getTime() - minutes * 60000);
    } else if (text.includes('小时前')) {
      const hours = parseInt(text.match(/\d+/)[0]);
      date = new Date(now.getTime() - hours * 3600000);
    } else if (text.includes('天前')) {
      const days = parseInt(text.match(/\d+/)[0]);
      date = new Date(now.getTime() - days * 86400000);
    }

    return date.toISOString();
  }

  // 检查是否在目标页面
  isTargetPage() {
    return window.location.hostname === this.siteDomain;
  }

  // 获取页面类型
  getPageType() {
    const path = window.location.pathname;

    if (path.includes('/question/')) {
      return 'question';
    } else if (path.includes('/answer/')) {
      return 'answer';
    } else if (path.includes('/people/')) {
      return 'profile';
    } else if (path.includes('/column/')) {
      return 'column';
    } else if (path.includes('/topic/')) {
      return 'topic';
    } else {
      return 'other';
    }
  }

  // 获取当前页面的用户信息（从URL）
  getCurrentUserFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/people\/([^/?#]+)/);

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
    return document.querySelector('.comment-list, .CommentList, [data-testid="comment-list"]');
  }

  // 获取用户信息容器
  getUserInfoContainer() {
    return document.querySelector('.ProfileHeader-main, .UserHeader-main, .PeopleHeader');
  }
}

// 导出适配器
export default ZhihuAdapter;