#!/bin/bash

# Eye Ballz 图片清理脚本
# 使用方法: chmod +x clear-images.sh && ./clear-images.sh

echo "🧹 开始清理 Eye Ballz 项目中的图片文件..."
echo ""

# 确认操作
read -p "⚠️  此操作将删除所有已生成的图片和视频文件，确定继续？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 取消清理操作"
    exit 1
fi

echo ""
echo "🔍 正在检查项目文件..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 删除 outputs 目录中的所有文件
if [ -d "outputs" ]; then
    echo "📁 正在删除 outputs/ 目录中的所有文件..."
    rm -rf outputs/* 2>/dev/null
    echo "✅ outputs/ 目录已清理"
else
    echo "ℹ️  outputs/ 目录不存在"
fi

# 删除 photos 目录中的所有文件
if [ -d "photos" ]; then
    echo "📁 正在删除 photos/ 目录中的所有文件..."
    rm -rf photos/* 2>/dev/null
    echo "✅ photos/ 目录已清理"
else
    echo "ℹ️  photos/ 目录不存在"
fi

# 删除生成的 concat.txt 文件
if [ -f "concat.txt" ]; then
    echo "📄 正在删除 concat.txt 文件..."
    rm -f concat.txt
    echo "✅ concat.txt 已删除"
fi

# 检查并清空 photos.ts 中的图片配置（保留结构）
if [ -f "photos.ts" ]; then
    echo "🔧 正在重置 photos.ts 配置文件..."
    cat > photos.ts << 'EOF'
// this is just a list of generated items so I can reference them

export const photos = {
  // 照片会在上传后自动添加到这里
}

export type Photo = typeof photos[keyof typeof photos];
EOF
    echo "✅ photos.ts 已重置"
fi

echo ""
echo "🎉 清理完成！"
echo ""
echo "📋 接下来您可以："
echo "1. 上传新的图片文件到 photos/ 目录"
echo "2. 运行 'npm run generate' 生成 3D 效果"
echo "3. 访问 http://localhost:6767 查看效果"
echo ""
echo "💡 如果需要重新生成，请先上传图片到 photos/ 目录"
