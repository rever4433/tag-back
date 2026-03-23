#!/bin/bash

# 用户标记与评论收藏器 - 安装脚本

echo "=========================================="
echo "用户标记与评论收藏器 - 安装脚本"
echo "=========================================="
echo ""

# 检查是否在正确的目录
if [ ! -f "manifest.json" ]; then
    echo "错误：请在项目根目录运行此脚本"
    echo "当前目录：$(pwd)"
    exit 1
fi

echo "1. 检查项目文件..."
echo ""

# 检查关键文件
REQUIRED_FILES=(
    "manifest.json"
    "background-full.js"
    "content-full.js"
    "popup/popup.html"
    "popup/popup.css"
    "popup/popup-full.js"
    "options/options.html"
    "options/options.css"
    "options/options.js"
    "utils/storage.js"
    "utils/dom.js"
    "utils/helpers.js"
    "utils/adapters/zhihu.js"
    "utils/adapters/ithome.js"
    "utils/adapters/weibo.js"
    "utils/adapters/adapter-manager.js"
    "assets/styles/common.css"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (缺失)"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

echo ""
if [ $MISSING_FILES -gt 0 ]; then
    echo "错误：缺少 $MISSING_FILES 个必需文件"
    exit 1
fi

echo "2. 检查图标文件..."
echo ""

# 检查图标文件
ICON_FILES=("icons/icon16.png" "icons/icon48.png" "icons/icon128.png")
for icon in "${ICON_FILES[@]}"; do
    if [ -f "$icon" ]; then
        echo "✓ $icon"
    else
        echo "⚠ $icon (缺失，将使用默认图标)"
    fi
done

echo ""
echo "3. 安装说明..."
echo ""
echo "要安装此Chrome扩展程序，请按照以下步骤操作："
echo ""
echo "1. 打开Chrome浏览器"
echo "2. 访问 chrome://extensions/"
echo "3. 启用'开发者模式'（右上角开关）"
echo "4. 点击'加载已解压的扩展程序'"
echo "5. 选择当前目录: $(pwd)"
echo "6. 扩展程序将被加载并显示在工具栏中"
echo ""
echo "或者，您可以使用以下命令快速打开扩展程序页面："
echo "  open chrome://extensions/"
echo ""
echo "4. 使用说明..."
echo ""
echo "安装后，您可以："
echo "  - 访问知乎、IT之家或微博网站"
echo "  - 在用户元素旁点击'标记'按钮"
echo "  - 在评论旁点击'收藏'按钮"
echo "  - 点击工具栏图标查看和管理数据"
echo ""
echo "5. 开发说明..."
echo ""
echo "如果您想进行开发："
echo "  - 修改代码后，重新加载扩展程序"
echo "  - 在chrome://extensions/页面点击'刷新'按钮"
echo "  - 查看控制台日志进行调试"
echo ""
echo "=========================================="
echo "安装脚本执行完成！"
echo "=========================================="
echo ""
echo "如有问题，请查看 README.md 文件"
echo ""