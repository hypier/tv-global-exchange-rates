#!/bin/bash

echo "Resolving symlinks in .open-next directory..."

# 递归查找并解析所有符号链接
find .open-next -type l 2>/dev/null | while read -r link; do
    # 获取符号链接指向的真实路径（使用 realpath 或 readlink -f）
    if command -v realpath &> /dev/null; then
        target=$(realpath "$link" 2>/dev/null || echo "")
    else
        target=$(readlink -f "$link" 2>/dev/null || echo "")
    fi
    
    # 如果无法解析目标，跳过
    if [ -z "$target" ] || [ ! -e "$target" ]; then
        echo "⚠ Skipping broken link: $link"
        continue
    fi
    
    # 删除符号链接
    rm -f "$link"
    
    # 复制实际文件或目录
    if [ -d "$target" ]; then
        cp -rL "$target" "$link" 2>/dev/null || echo "⚠ Failed to copy: $link"
    else
        cp -L "$target" "$link" 2>/dev/null || echo "⚠ Failed to copy: $link"
    fi
    
    if [ -e "$link" ]; then
        echo "✓ Resolved: $link"
    fi
done

echo "✓ Symlink resolution complete"
