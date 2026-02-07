# 流光日记 - Flow Diary

一个优雅的日记应用，基于 Electron 构建。

## 功能特点

- 🌊 流动的 Three.js 背景动画
- 📝 简洁优雅的日记编辑界面
- 🏷️ 支持标签管理
- 😊 心情和天气记录
- 🔍 日记搜索功能（带防抖）
- 📊 统计信息展示
- 💾 自动保存
- 📤 Markdown 导出
- 📥 JSON 导入
- 🎨 支持深色模式（跟随系统）
- 💻 跨平台支持（Windows/macOS/Linux）

## 安装和运行

### 安装依赖

```bash
cd diary
npm install
```

### 开发模式运行

```bash
npm start
```

### 打包应用

```bash
# 打包所有平台
npm run build

# 仅打包 Windows
npm run build:win

# 仅打包 macOS
npm run build:mac

# 仅打包 Linux
npm run build:linux
```

## 项目结构

```
diary/
├── main.js          # Electron 主进程
├── preload.js       # 预加载脚本
├── package.json     # 项目配置
├── renderer/        # 渲染进程文件
│   ├── index.html   # 主界面
│   ├── app.js       # 应用逻辑
│   └── js/
│       └── three.min.js  # Three.js 库（本地）
├── assets/          # 资源文件
│   ├── icon.ico     # Windows 图标
│   ├── icon.icns    # macOS 图标
│   └── icon.png     # Linux 图标
└── README.md        # 说明文档
```

## 数据存储

- **Electron 模式**: 数据保存在用户数据目录的 `diaries.json` 文件中
  - Windows: `%APPDATA%/flow-diary/diaries.json`
  - macOS: `~/Library/Application Support/flow-diary/diaries.json`
  - Linux: `~/.config/flow-diary/diaries.json`
- **浏览器模式**: 使用 localStorage 存储

## 快捷键

- `Ctrl/Cmd + N` - 新建日记
- `Esc` - 关闭弹窗

## 导入/导出

### 导出
将日记导出为 Markdown 格式，包含所有日记内容、标签、心情和天气信息。

### 导入
支持导入 JSON 格式的日记数据（从其他设备备份的文件）。

**注意**: 导入将覆盖现有数据，请谨慎操作。

## 技术栈

- Electron 33
- Three.js (背景动画)
- HTML5 / CSS3 / JavaScript
- Node.js fs API（文件存储）

## 更新日志

### v1.0.0
- 初始版本发布
- 支持日记的增删改查
- 标签、心情、天气记录
- Markdown 导出
- JSON 导入
- 自动保存
- 深色模式支持
