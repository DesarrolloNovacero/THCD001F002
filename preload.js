const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Placeholder: add methods if you need native integrations
});
