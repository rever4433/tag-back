# 用户标记与评论收藏器 - Chrome浏览器插件

一个用于在知乎、IT之家、微博等网站上标记用户和收藏评论的Chrome浏览器插件。

## 功能特性

### 核心功能
- **用户标记**：在网页上标记特定用户，支持自定义标签、颜色和备注
- **评论收藏**：收藏用户的评论历史，支持分类和搜索
- **数据管理**：本地存储所有标记和收藏数据，支持导入导出
- **界面集成**：在网页上添加标记按钮和可视化标识

### 支持网站
- **知乎** (zhihu.com) - 问答社区
- **IT之家** (ithome.com) - 科技资讯网站
- **微博** (weibo.com) - 社交媒体

## 项目结构

```
user-comment-manager/
├── manifest.json                    # Chrome插件清单文件
├── background.js                    # 后台服务脚本
├── content.js                       # 内容脚本
├── popup/                           # 弹出窗口
│   ├── popup.html                  # 弹出窗口HTML
│   ├── popup.css                   # 弹出窗口样式
│   ├── popup.js                    # 弹出窗口逻辑
│   └── components/                 # Vue组件
│       ├── UserList.vue            # 用户列表组件
│       ├── CommentList.vue         # 评论列表组件
│       ├── TagCloud.vue            # 标签云组件
│       └── SearchBar.vue           # 搜索栏组件
├── options/                         # 选项页面
│   ├── options.html                # 选项页面HTML
│   ├── options.css                 # 选项页面样式
│   ├── options.js                  # 选项页面逻辑
│   └── components/                 # Vue组件
│       ├── SiteConfig.vue          # 网站配置组件
│       ├── DataManager.vue         # 数据管理组件
│       └── Settings.vue            # 设置组件
├── icons/                           # 图标文件夹
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── utils/                           # 工具函数
│   ├── storage.js                  # 数据存储工具
│   ├── dom.js                      # DOM操作工具
│   ├── helpers.js                  # 辅助函数
│   └── adapters/                   # 网站适配器
│       ├── zhihu.js                # 知乎适配器
│       ├── ithome.js               # IT之家适配器
│       ├── weibo.js                # 微博适配器
│       └── adapter-manager.js      # 适配器管理器
├── assets/
│   └── styles/
│       └── common.css              # 公共样式
└── vue-app/                        # Vue应用目录
    ├── main.js                     # Vue应用入口
    ├── store.js                    # Vuex状态管理
    └── router.js                   # Vue路由
```

## 安装和使用

### 安装步骤

1. **下载插件**
   - 克隆或下载此仓库

2. **加载到Chrome**
   - 打开Chrome浏览器，访问 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `user-comment-manager` 文件夹

3. **使用插件**
   - 访问支持的网站（知乎、IT之家、微博）
   - 在用户元素旁会显示"标记"按钮
   - 在评论旁会显示"收藏"按钮
   - 点击按钮即可标记用户或收藏评论

### 使用方法

#### 标记用户
1. 在支持的网站上找到用户元素
2. 点击用户旁边的"标记"按钮
3. 填写备注信息和标签
4. 选择标记颜色
5. 点击"确认标记"

#### 收藏评论
1. 在支持的网站上找到评论
2. 点击评论旁边的"收藏"按钮
3. 填写备注信息和标签
4. 点击"确认收藏"

#### 查看和管理数据
1. 点击浏览器工具栏的插件图标
2. 在弹出窗口中查看标记的用户和收藏的评论
3. 使用搜索和标签筛选功能
4. 点击"导出"按钮导出数据
5. 点击"导入"按钮导入数据

#### 配置插件
1. 点击弹出窗口中的"设置"按钮
2. 在选项页面中配置：
   - 启用/禁用的网站
   - 数据管理（导入/导出/清除）
   - 外观设置（颜色、按钮文本）
   - 行为设置（自动标记、通知等）

## 技术架构

### 技术栈
- **Manifest V3**：使用最新的Chrome扩展API规范
- **模块化设计**：分离内容脚本、后台脚本、UI组件
- **响应式设计**：适配不同网站的UI风格
- **数据持久化**：使用Chrome Storage API存储数据

### 核心组件

#### 1. 内容脚本 (content.js)
- 监听网页动态加载的用户元素
- 在用户元素旁添加标记按钮
- 为已标记用户添加CSS样式
- 识别并收集用户评论

#### 2. 后台脚本 (background.js)
- 处理Chrome Storage API的本地读写
- 处理内容脚本和Popup的消息传递
- 支持数据导出和导入
- 管理通知

#### 3. 弹出窗口 (popup.html/js)
- 显示已标记用户列表
- 显示收藏的评论
- 支持搜索和筛选
- 提供快速操作按钮

#### 4. 选项页面 (options.html/js)
- 配置启用/禁用的网站
- 数据管理（导入/导出/清除）
- 外观设置
- 通知设置

### 数据结构

```javascript
// 用户标记数据结构
const userMarkData = {
  userId: "unique-user-id",
  username: "用户名",
  profileUrl: "用户主页链接",
  markDate: "2024-01-15T10:30:00Z",
  markColor: "#ff0000",
  markNote: "备注信息",
  tags: ["专家", "活跃用户"],
  website: "目标网站域名" // zhihu, ithome, weibo
};

// 评论收藏数据结构
const commentData = {
  commentId: "unique-comment-id",
  userId: "关联的用户ID",
  content: "评论内容",
  commentDate: "2024-01-15T10:30:00Z",
  commentUrl: "评论所在页面链接",
  tags: ["重要", "有趣"],
  note: "收藏备注"
};
```

## 开发指南

### 环境要求
- Chrome浏览器（版本88+）
- Node.js（用于开发工具）
- 代码编辑器（推荐VS Code）

### 开发步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd user-comment-manager
   ```

2. **安装依赖（可选）**
   ```bash
   npm install
   ```

3. **加载到Chrome**
   - 打开 `chrome://extensions/`
   - 启用"开发者模式"
   - 加载扩展程序

4. **测试功能**
   - 访问支持的网站
   - 测试标记和收藏功能
   - 检查数据存储和导出

### 调试技巧

1. **查看控制台日志**
   - 右键点击页面 → 检查 → Console
   - 查看内容脚本的日志

2. **查看后台脚本日志**
   - 访问 `chrome://extensions/`
   - 点击"检查视图" → "Service Worker"
   - 查看后台脚本的日志

3. **检查存储数据**
   - 访问 `chrome://extensions/`
   - 点击"检查视图" → "Service Worker"
   - 在Console中输入 `chrome.storage.local.get(null, console.log)`

## 常见问题

### Q: 为什么在某些网站上看不到标记按钮？
A: 请确保：
1. 网站已添加到支持的网站列表中
2. 插件已正确加载
3. 网站的DOM结构已正确识别

### Q: 数据存储在哪里？
A: 所有数据都存储在Chrome的本地存储中，不会上传到服务器。

### Q: 如何备份数据？
A: 在弹出窗口中点击"导出"按钮，或在选项页面中导出数据。

### Q: 如何恢复数据？
A: 在弹出窗口中点击"导入"按钮，或在选项页面中导入数据。

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -am 'Add some feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 创建 Pull Request

## 许可证

MIT License - 详见 LICENSE 文件

## 更新日志

### v1.0.0 (2026-02-28)
- 初始版本发布
- 支持知乎、IT之家、微博
- 实现用户标记功能
- 实现评论收藏功能
- 支持数据导入导出
- 支持标签系统
- 支持搜索筛选功能

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 项目讨论区

---

**注意**：此插件仅供个人使用，请遵守目标网站的使用条款和隐私政策。