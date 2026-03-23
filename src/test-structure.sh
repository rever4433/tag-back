#!/bin/bash

# 测试项目结构脚本

echo "测试用户标记与评论收藏器项目结构..."
echo ""

# 检查目录结构
echo "1. 检查目录结构..."
echo ""

DIRECTORIES=(
    "popup"
    "popup/components"
    "options"
    "options/components"
    "utils"
    "utils/adapters"
    "icons"
    "assets"
    "assets/styles"
    "vue-app"
)

for dir in "${DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        echo "✓ $dir"
    else
        echo "✗ $dir (缺失)"
    fi
done

echo ""
echo "2. 检查关键文件..."
echo ""

# 检查关键文件
KEY_FILES=(
    "manifest.json"
    "background.js"
    "content.js"
    "popup/popup.html"
    "popup/popup.css"
    "popup/popup.js"
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
    "vue-app/main.js"
    "vue-app/store.js"
    "vue-app/router.js"
    "popup/components/UserList.vue"
    "popup/components/CommentList.vue"
    "popup/components/TagCloud.vue"
    "popup/components/SearchBar.vue"
    "README.md"
    "package.json"
)

for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (缺失)"
    fi
done

echo ""
echo "3. 检查图标文件..."
echo ""

ICON_FILES=("icons/icon16.png" "icons/icon48.png" "icons/icon128.png")
for icon in "${ICON_FILES[@]}"; do
    if [ -f "$icon" ]; then
        echo "✓ $icon"
    else
        echo "⚠ $icon (缺失)"
    fi
done

echo ""
echo "4. 检查文件大小..."
echo ""

# 检查主要文件的大小
for file in "manifest.json" "background.js" "content.js"; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file")
        echo "✓ $file: $size bytes"
    fi
done

echo ""
echo "5. 项目结构总结..."
echo ""

# 统计文件数量
total_files=$(find . -type f | wc -l)
echo "总文件数: $total_files"

# 统计目录数量
total_dirs=$(find . -type d | wc -l)
echo "总目录数: $total_dirs"

echo ""
echo "=========================================="
echo "项目结构测试完成！"
echo "=========================================="
echo ""
echo "要安装扩展程序，请运行:"
echo "  ./install.sh"
echo ""
echo "要查看使用说明，请查看:"
echo "  README.md"
echo ""