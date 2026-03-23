#!/bin/bash
# 快速重新加载扩展脚本

EXTENSION_PATH="/Users/gaoyakang/Documents/Gitlab/BlockLists/user-comment-manager"

echo "🔄 重新加载 Chrome 扩展..."
echo "📂 扩展路径：$EXTENSION_PATH"

# 打开扩展页面
open -a "Google Chrome" "chrome://extensions/"

echo ""
echo "✅ 请在 Chrome 扩展页面:"
echo "   1. 开启右上角的「开发者模式」"
echo "   2. 找到「用户标记与评论收藏器」扩展"
echo "   3. 点击刷新按钮 🔄"
echo ""
echo "或者访问 IT 之家页面测试：https://www.ithome.com/"
