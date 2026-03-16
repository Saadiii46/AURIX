import { contextBridge, ipcRenderer } from "electron";

// Expose safe window control API to renderer (React)
// Accessible as window.electronAPI in your components
contextBridge.exposeInMainWorld("electronAPI", {
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  maximizeWindow: () => ipcRenderer.send("window-maximize"),
  closeWindow: () => ipcRenderer.send("window-close"),
});
