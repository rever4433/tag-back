# 用户标记与评论收藏器

一个基于 Chrome Manifest V3 的浏览器扩展，用来在网页里标记用户、收藏评论，并在扩展弹窗中统一管理这些数据。

当前仓库的扩展源码位于 `src/` 目录，加载扩展时请选择这个目录。

## 当前已实现功能

### 1. 页面内标记用户
- 在支持的网站页面中，为识别到的用户名称旁注入“标记”按钮
- 标记时可填写备注
- 可从已有标签中选择，也可以临时新增标签
- 标记后会在用户名旁显示标签/已标记状态

### 2. 页面内收藏评论
- 在评论区域附近注入“收藏”按钮
- 收藏时可填写备注
- 支持手动输入多个标签
- 已收藏评论会显示“已收藏”状态

### 3. 弹窗管理
- 查看已标记用户列表
- 查看已收藏评论列表
- 搜索用户、备注、评论内容和标签
- 使用标签云筛选内容
- 删除单个用户标记或评论收藏
- 在弹窗中新增/删除标签
- 导出全部数据为 JSON
- 导入历史 JSON 数据

### 4. 设置页
- 启用或关闭指定站点
- 配置默认颜色
- 自定义“标记”“收藏”按钮文案
- 开关通知、自动标记、自动保存评论等选项
- 导出全部数据 / 仅用户 / 仅评论
- 清空全部用户标记
- 清空全部评论收藏

## 当前支持情况

### 已适配
- 知乎 `zhihu.com`
- IT之家 `ithome.com`

### 已声明但未完整落地
- 微博 `weibo.com`

说明：`manifest.json` 中已经包含微博权限，但当前 `content-full.js` 只实现了知乎和 IT 之家的站点配置，因此 README 按实际可用能力描述。

## 安装方式

1. 打开 Chrome，进入 `chrome://extensions/`
2. 打开右上角“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择目录 `/Users/gaoyakang/Documents/Gitlab/BlockLists/src`

安装完成后，扩展会出现在浏览器工具栏中。

## 使用说明

### 标记用户
1. 打开知乎或 IT 之家页面
2. 在用户名附近点击“标记”
3. 填写备注，选择或新增标签
4. 点击确认后，页面会显示已标记状态

### 收藏评论
1. 在评论区域点击“收藏”
2. 输入备注
3. 输入标签，多个标签用逗号分隔
4. 保存后，按钮会变成“已收藏”

### 管理数据
1. 点击扩展图标打开弹窗
2. 在“用户列表”“评论收藏”“标签管理”之间切换
3. 可搜索、筛选、删除、导入、导出数据
4. 点击“设置”进入选项页调整配置

## 数据存储

- 所有数据存储在 `chrome.storage.local`
- 默认存储键为 `userCommentManager`
- 数据不会上传到远程服务器

主要数据包括：
- `markedUsers`：已标记用户
- `savedComments`：已收藏评论
- `tags`：标签列表
- `settings`：扩展设置

## 项目结构

```text
BlockLists/
├── README.md
├── LICENSE
└── src/
    ├── manifest.json
    ├── background-full.js
    ├── content-full.js
    ├── popup/
    ├── options/
    ├── utils/
    ├── assets/
    ├── icons/
    ├── package.json
    ├── install.sh
    └── 其他说明文档
```

其中几个关键文件：
- `src/manifest.json`：扩展清单
- `src/content-full.js`：页面注入、站点适配、标记/收藏交互
- `src/background-full.js`：数据存储和消息处理
- `src/popup/popup-full.js`：弹窗管理界面逻辑
- `src/options/options.js`：设置页逻辑

## 开发说明

仓库当前以“直接加载源码到浏览器”方式开发，没有真正的打包流程。

可用命令：

```bash
cd /Users/gaoyakang/Documents/Gitlab/BlockLists/src
npm install
npm run dev
```

说明：
- `npm run dev` 目前只输出提示信息，不会启动本地开发服务器
- 修改代码后，需要回到扩展页面手动点击“刷新”

## 已知限制

- 当前内容脚本仅实现知乎和 IT 之家适配
- 微博权限已保留，但尚未在内容脚本中完成适配
- 设置页中有“清除所有数据”入口，但后台脚本当前未实现对应消息处理，现阶段更稳妥的做法是分别清空用户和评论
- 仓库中同时保留了一套模块化草稿文件和一套 `*-full.js` 的实际运行版本，浏览器实际加载的是后者

## 许可证

MIT，详见 [LICENSE](/Users/gaoyakang/Documents/Gitlab/BlockLists/LICENSE)
