const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  verifyIdentity: () => ipcRenderer.invoke('verify-identity')
});
