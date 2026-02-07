const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const dataPath = path.join(app.getPath('userData'), 'diaries.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    titleBarOverlay: process.platform === 'win32' ? {
      color: '#f5f0eb',
      symbolColor: '#3a3632',
      height: 40
    } : false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    backgroundColor: '#e8e2db',
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 移除默认菜单
  if (process.platform !== 'darwin') {
    mainWindow.setMenu(null);
  } else {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }
    ]));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 窗口关闭前提醒
  mainWindow.on('close', (e) => {
    // 可以在这里添加保存提醒逻辑
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ========== Data Persistence ==========
// 从文件读取日记
ipcMain.handle('load-diaries', async () => {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      return { success: true, data: JSON.parse(data) };
    }
    return { success: true, data: [] };
  } catch (err) {
    console.error('Failed to load diaries:', err);
    return { success: false, error: err.message };
  }
});

// 保存日记到文件
ipcMain.handle('save-diaries', async (event, diaries) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(diaries, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    console.error('Failed to save diaries:', err);
    return { success: false, error: err.message };
  }
});

// 导出日记
ipcMain.handle('export-diaries', async (event, data) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `流光日记_${new Date().toLocaleDateString('zh-CN')}.md`,
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (filePath) {
    try {
      fs.writeFileSync(filePath, data, 'utf-8');
      return { success: true, filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, canceled: true };
});

// 导入日记
ipcMain.handle('import-diaries', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (filePaths && filePaths.length > 0) {
    try {
      const data = fs.readFileSync(filePaths[0], 'utf-8');
      const diaries = JSON.parse(data);
      return { success: true, diaries };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, canceled: true };
});

// 获取应用数据路径
ipcMain.handle('get-data-path', () => {
  return dataPath;
});

// 获取应用版本
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});
