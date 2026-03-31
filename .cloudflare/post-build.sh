#!/bin/bash
set -e

echo "Resolving symlinks in .open-next directory..."

# 递归查找并解析所有符号链接
find .open-next -type l | while read -r link; do
    target=$(readlink "$link")
    
    # 如果是相对路径，转换为绝对路径
    if [[ "$target" != /* ]]; then
        dir=$(dirname "$link")
        target="$dir/$target"
    fi
    
    # 删除符号链接并复制实际文件
    rm "$link"
    
    if [ -d "$target" ]; then
        cp -r "$target" "$link"
    else
        cp "$target" "$link"
    fi
    
    echo "✓ Resolved: $link"
done

echo "✓ All symlinks resolved"
