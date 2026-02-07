# 图标文件

此文件夹应包含以下图标文件：

- `icon.ico` - Windows 图标 (256x256 或更大，多尺寸)
- `icon.icns` - macOS 图标 (1024x1024)
- `icon.png` - Linux 图标 (512x512 或 1024x1024)

## 从 SVG 生成图标

可以使用以下工具将 `icon.svg` 转换为所需格式：

### 在线工具
- [Convertio](https://convertio.co/svg-ico/)
- [CloudConvert](https://cloudconvert.com/svg-to-ico)
- [ICO Convert](https://icoconvert.com/)

### 命令行工具

#### macOS (使用 ImageMagick)
```bash
# 转换为 PNG
convert icon.svg -resize 1024x1024 icon.png

# 转换为 ICO (Windows)
convert icon.svg -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

#### 使用 Node.js
```bash
npm install -g svg-export
svg-export icon.svg icon.png 1024:1024
```

## 临时解决方案

如果没有图标文件，Electron 将使用默认图标。应用仍然可以正常运行。
