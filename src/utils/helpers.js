// 辅助函数工具
class Helpers {
  // 生成唯一ID
  generateId(prefix = 'ucm') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 格式化日期
  formatDate(date, format = 'datetime') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    switch (format) {
      case 'date':
        return `${year}-${month}-${day}`;
      case 'time':
        return `${hours}:${minutes}:${seconds}`;
      case 'datetime':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      case 'iso':
        return d.toISOString();
      default:
        return d.toLocaleString('zh-CN');
    }
  }

  // 截断文本
  truncateText(text, maxLength = 100, suffix = '...') {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - suffix.length) + suffix;
  }

  // 生成颜色
  generateColor(seed = '') {
    const colors = [
      '#4285F4', // Google Blue
      '#34A853', // Google Green
      '#EA4335', // Google Red
      '#FBBC05', // Google Yellow
      '#9334E6', // Purple
      '#00ACC1', // Cyan
      '#FF6D00', // Orange
      '#C2185B'  // Pink
    ];

    if (seed) {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    }

    return colors[Math.floor(Math.random() * colors.length)];
  }

  // 深度合并对象
  deepMerge(target, source) {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }

    return output;
  }

  // 检查是否为对象
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 节流函数
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // 检查URL是否匹配模式
  urlMatchesPattern(url, pattern) {
    try {
      const urlObj = new URL(url);
      const patternObj = new URL(pattern, 'http://example.com');

      // 检查域名
      if (patternObj.hostname && !urlObj.hostname.includes(patternObj.hostname)) {
        return false;
      }

      // 检查路径
      if (patternObj.pathname && patternObj.pathname !== '/') {
        const pathPattern = patternObj.pathname.replace(/\*/g, '.*');
        const pathRegex = new RegExp(pathPattern);
        if (!pathRegex.test(urlObj.pathname)) {
          return false;
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  // 生成用户ID（基于用户名和URL）
  generateUserId(username, profileUrl, website) {
    const baseId = `${website}_${username}_${profileUrl}`.replace(/\s+/g, '_');
    return btoa(baseId).replace(/=/g, '').substr(0, 16);
  }

  // 生成评论ID（基于内容、日期和作者）
  generateCommentId(content, commentDate, author, website) {
    const baseId = `${website}_${content}_${commentDate}_${author}`.replace(/\s+/g, '_');
    return btoa(baseId).replace(/=/g, '').substr(0, 16);
  }

  // 解析相对时间
  parseRelativeTime(text) {
    const now = new Date();
    let date = new Date();

    if (text.includes('刚刚')) {
      date = now;
    } else if (text.includes('分钟前')) {
      const minutes = parseInt(text.match(/\d+/)[0]);
      date = new Date(now.getTime() - minutes * 60000);
    } else if (text.includes('小时前')) {
      const hours = parseInt(text.match(/\d+/)[0]);
      date = new Date(now.getTime() - hours * 3600000);
    } else if (text.includes('天前')) {
      const days = parseInt(text.match(/\d+/)[0]);
      date = new Date(now.getTime() - days * 86400000);
    } else if (text.includes('昨天')) {
      date = new Date(now.getTime() - 86400000);
    } else if (text.includes('前天')) {
      date = new Date(now.getTime() - 2 * 86400000);
    }

    return date.toISOString();
  }

  // 检查是否为有效URL
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // 从文本中提取URL
  extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  }

  // 清理HTML文本
  cleanHtmlText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  // 计算相似度（简单实现）
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein距离
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // 导出数据为JSON文件
  exportToJson(data, filename = 'user-comment-data.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 从文件导入JSON数据
  importFromJson(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  }

  // 创建下载链接
  createDownloadLink(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    return a;
  }

  // 复制到剪贴板
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('复制失败:', error);
      return false;
    }
  }

  // 从剪贴板读取
  async readFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch (error) {
      console.error('读取剪贴板失败:', error);
      return null;
    }
  }

  // 生成UUID
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // 检查是否为移动设备
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // 获取浏览器信息
  getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'unknown';
    let version = 'unknown';

    if (ua.includes('Chrome')) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      if (match) version = match[1];
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      if (match) version = match[1];
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      if (match) version = match[1];
    }

    return { browser, version };
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 延迟执行
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 重试执行
  async retry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.sleep(delay);
      }
    }
  }
}

// 创建单例实例
const helpers = new Helpers();

export default helpers;