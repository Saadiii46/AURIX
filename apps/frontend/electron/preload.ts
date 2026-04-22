// Electron sandboxed preload scripts can't use top-level ESM `import`.
// Use the sandbox-provided CommonJS `require()` instead.
const { contextBridge, ipcRenderer } = require("electron");

// Expose safe APIs to renderer (React)
// Accessible as window.electronAPI in your components
contextBridge.exposeInMainWorld("electronAPI", {
  // Window controls
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  maximizeWindow: () => ipcRenderer.send("window-maximize"),
  closeWindow: () => ipcRenderer.send("window-close"),

  // Deepgram STT
  deepgramStatus: () => ipcRenderer.invoke("deepgram-status"),
  deepgramTranscribeAudio: (filePath: string) =>
    ipcRenderer.invoke("deepgram-transcribe-audio", filePath),
  deepgramSaveAndTranscribe: (audioBuffer: ArrayBuffer) =>
    ipcRenderer.invoke("deepgram-save-and-transcribe", audioBuffer),

  // TTS
  ttsSynthesize: (text: string) => ipcRenderer.invoke("tts-synthesize", text),
  ttsSetVoice: (voice: string) => ipcRenderer.invoke("tts-set-voice", voice),
  ttsStatus: () => ipcRenderer.invoke("tts-status"),

  // Streaming events (LLM + TTS progressive playback)
  onStreamingText: (callback: (...args: any[]) => void) => {
    ipcRenderer.removeAllListeners("streaming-text");
    ipcRenderer.on("streaming-text", (_event: any, ...args: any[]) =>
      callback(...args)
    );
  },
  onStreamingAudio: (callback: (...args: any[]) => void) => {
    ipcRenderer.removeAllListeners("streaming-audio");
    ipcRenderer.on("streaming-audio", (_event: any, ...args: any[]) =>
      callback(...args)
    );
  },
  onStreamingDone: (callback: (...args: any[]) => void) => {
    ipcRenderer.removeAllListeners("streaming-done");
    ipcRenderer.on("streaming-done", (_event: any, ...args: any[]) =>
      callback(...args)
    );
  },

  // Chat
  chatSendMessage: (message: string) =>
    ipcRenderer.invoke("chat-send-message", message),
  chatSendMessageStreaming: (message: string) =>
    ipcRenderer.invoke("chat-send-message-streaming", message),
  chatClearHistory: () => ipcRenderer.invoke("chat-clear-history"),
  chatGetHistory: () => ipcRenderer.invoke("chat-get-history"),
  chatSetSystemPrompt: (prompt: string) =>
    ipcRenderer.invoke("chat-set-system-prompt", prompt),

  // Retrieval (RAG)
  retrievalSearch: (query: string, limit?: number) =>
    ipcRenderer.invoke("retrieval-search", query, limit),
  retrievalSearchDocs: (query: string, limit?: number) =>
    ipcRenderer.invoke("retrieval-search-docs", query, limit),
  retrievalIndexDocument: (content: string, metadata?: Record<string, any>) =>
    ipcRenderer.invoke("retrieval-index-document", content, metadata),
  retrievalStatus: () => ipcRenderer.invoke("retrieval-status"),

  // VS Code Bridge
  vscodeConnect: () => ipcRenderer.invoke("vscode-connect"),
  vscodeDisconnect: () => ipcRenderer.invoke("vscode-disconnect"),
  vscodeStatus: () => ipcRenderer.invoke("vscode-status"),

  // Agent
  agentExecuteTask: (message: string) =>
    ipcRenderer.invoke("agent-execute-task", message),
  onAgentStep: (callback: (...args: any[]) => void) =>
    ipcRenderer.on("agent-step", (_event: any, ...args: any[]) =>
      callback(...args)
    ),
});
