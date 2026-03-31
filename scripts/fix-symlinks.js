#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * 递归遍历目录，将所有符号链接替换为实际文件的副本
 */
function resolveSymlinks(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    try {
      const stats = fs.lstatSync(fullPath);
      
      if (stats.isSymbolicLink()) {
        // 读取符号链接指向的真实路径
        const realPath = fs.readlinkSync(fullPath);
        const absolutePath = path.resolve(dir, realPath);
        
        // 删除符号链接
        fs.unlinkSync(fullPath);
        
        // 检查目标是文件还是目录
        const targetStats = fs.statSync(absolutePath);
        
        if (targetStats.isDirectory()) {
          // 如果是目录，递归复制
          copyDir(absolutePath, fullPath);
        } else {
          // 如果是文件，直接复制
          fs.copyFileSync(absolutePath, fullPath);
        }
        
        console.log(`✓ Resolved symlink: ${fullPath}`);
      } else if (stats.isDirectory()) {
        // 递归处理子目录
        resolveSymlinks(fullPath);
      }
    } catch (err) {
      console.warn(`⚠ Warning: Could not process ${fullPath}: ${err.message}`);
    }
  }
}

/**
 * 递归复制目录
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 主执行
const openNextDir = path.join(process.cwd(), '.open-next');

if (!fs.existsSync(openNextDir)) {
  console.error('Error: .open-next directory not found');
  process.exit(1);
}

console.log('Resolving symlinks in .open-next directory...');
resolveSymlinks(openNextDir);
console.log('✓ All symlinks resolved successfully');
