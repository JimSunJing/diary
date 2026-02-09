const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Data persistence
  loadDiaries: () => ipcRenderer.invoke('load-diaries'),
  saveDiaries: (diaries) => ipcRenderer.invoke('save-diaries', diaries),
  
  // Template management
  loadTemplates: () => ipcRenderer.invoke('load-templates'),
  saveTemplates: (templates) => ipcRenderer.invoke('save-templates', templates),
  
  // Import/Export
  exportDiaries: (data) => ipcRenderer.invoke('export-diaries', data),
  importDiaries: () => ipcRenderer.invoke('import-diaries'),
  
  // App info
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform
});
