// Electron sandboxed preload scripts can't use top-level ESM `import`.
// Use the sandbox-provided CommonJS `require()` instead.
const { contextBridge, ipcRenderer } = require("electron");

// Expose safe window control API to renderer (React)
// Accessible as window.electronAPI in your components
contextBridge.exposeInMainWorld("electronAPI", {
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  maximizeWindow: () => ipcRenderer.send("window-maximize"),
  closeWindow: () => ipcRenderer.send("window-close"),
});
