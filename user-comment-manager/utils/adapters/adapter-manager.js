// 适配器管理器 - 根据当前网站选择合适的适配器
import ZhihuAdapter from './zhihu.js';
import ITHomeAdapter from './ithome.js';
import WeiboAdapter from './weibo.js';

class AdapterManager {
  constructor() {
    this.adapters = {
      'zhihu.com': new ZhihuAdapter(),
      'ithome.com': new ITHomeAdapter(),
      'weibo.com': new WeiboAdapter()
    };
  }

  // 获取当前网站的适配器
  getCurrentAdapter() {
    const hostname = window.location.hostname;

    for (const domain in this.adapters) {
      if (hostname.includes(domain)) {
        return this.adapters[domain];
      }
    }

    return null;
  }

  // 根据域名获取适配器
  getAdapterByDomain(domain) {
    return this.adapters[domain] || null;
  }

  // 获取所有支持的网站
  getSupportedSites() {
    return Object.keys(this.adapters);
  }

  // 检查当前网站是否支持
  isSupportedSite() {
    return this.getCurrentAdapter() !== null;
  }

  // 获取当前网站名称
  getCurrentSiteName() {
    const adapter = this.getCurrentAdapter();
    return adapter ? adapter.siteName : 'unknown';
  }

  // 获取当前网站域名
  getCurrentSiteDomain() {
    const adapter = this.getCurrentAdapter();
    return adapter ? adapter.siteDomain : null;
  }

  // 获取当前页面类型
  getCurrentPageType() {
    const adapter = this.getCurrentAdapter();
    return adapter ? adapter.getPageType() : 'unknown';
  }

  // 获取当前页面的用户信息（从URL）
  getCurrentUserFromUrl() {
    const adapter = this.getCurrentAdapter();
    return adapter ? adapter.getCurrentUserFromUrl() : null;
  }

  // 提取用户信息
  extractUserData(element) {
    const adapter = this.getCurrentAdapter();
    if (!adapter) return null;

    return adapter.extractUserData(element);
  }

  // 提取评论信息
  extractCommentData(element) {
    const adapter = this.getCurrentAdapter();
    if (!adapter) return null;

    return adapter.extractCommentData(element);
  }

  // 获取用户元素选择器
  getUserSelectors() {
    const adapter = this.getCurrentAdapter();
    return adapter ? adapter.getUserSelectors() : [];
  }

  // 获取评论元素选择器
  getCommentSelectors() {
    const adapter = this.getCurrentAdapter();
    return adapter ? adapter.getCommentSelectors() : [];
  }

  // 获取评论容器
  getCommentContainer() {
    const adapter = this.getCurrentAdapter();
    return adapter ? adapter.getCommentContainer() : null;
  }

  // 获取用户信息容器
  getUserInfoContainer() {
    const adapter = this.getCurrentAdapter();
    return adapter ? adapter.getUserInfoContainer() : null;
  }
}

// 创建单例实例
const adapterManager = new AdapterManager();

export default adapterManager;