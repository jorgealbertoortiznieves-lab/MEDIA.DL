const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('window:minimize'),
    maximizeWindow: () => ipcRenderer.send('window:maximize'),
    closeWindow: () => ipcRenderer.send('window:close'),
    getPathForFile: (file) => webUtils.getPathForFile(file),
    openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
    openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
    openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),

    // Clipboard API
    readClipboard: () => ipcRenderer.invoke('read-clipboard'),

    // File reading
    readTxtFile: (filePath) => ipcRenderer.invoke('read-txt-file', filePath),

    // Cookies Management
    listCookies: () => ipcRenderer.invoke('list-cookies'),
    addCookie: () => ipcRenderer.invoke('add-cookie'),
    deleteCookie: (filename) => ipcRenderer.invoke('delete-cookie', filename),

    // Unified Download API
    startDownloadItem: (data) => ipcRenderer.send('start-download-item', data),
    onItemLog: (callback) => ipcRenderer.on('item-log', callback),
    onItemStatus: (callback) => ipcRenderer.on('item-status', callback),
    onItemComplete: (callback) => ipcRenderer.on('item-complete', callback),

    // App Updater
    updateEngines: () => ipcRenderer.invoke('update-engines')
});
