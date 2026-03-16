// Extend the Window interface so TypeScript knows about window.electronAPI
// exposed by preload.ts via contextBridge

export {};

declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
    };
  }
}
