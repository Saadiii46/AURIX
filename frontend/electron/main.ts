import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  session,
} from "electron";
import path from "path";
import { fileURLToPath } from "url";
import serve from "electron-serve";
import { getVSCodeBridge } from './vscode-bridge.js';
import { AGENT_TOOLS, AGENT_SYSTEM_PROMPT, AGENT_MODEL } from './agent-tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loadURL = serve({ directory: path.join(__dirname, "../out") });

const IS_PROD = process.env.NODE_ENV === "production";
const API_BASE_URL = IS_PROD
  ? "https://aurix-api.vercel.app"
  : "http://localhost:8000";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,

    // Frameless native window (Discord-style)
    frame: false,
    titleBarStyle: "hidden", // macOS: keeps traffic-light buttons
    transparent: false,
    // Windows 11 acrylic remove if targeting older Windows
    // backgroundMaterial: "acrylic",

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
    title: "AURIX Voice Assistant",
    icon: path.join(__dirname, "../public/vite.svg"),
  });

  // Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self' app:; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "font-src 'self' https://fonts.gstatic.com; " +
              "img-src 'self' data: https:; " +
              "media-src 'self' blob: mediastream:; " +
              `connect-src 'self' ${API_BASE_URL} https://aurix-api.vercel.app https://api.deepgram.com wss://api.deepgram.com https://api.groq.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com; ` +
              "worker-src 'self' blob:;",
          ],
        },
      });
    },
  );

  // Disable right-click context menu
  mainWindow.webContents.on("context-menu", (e) => e.preventDefault());

  // Disable zoom (browser-feel)
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (
      (input.control || input.meta) &&
      (input.key === "+" || input.key === "-" || input.key === "=")
    ) {
      event.preventDefault();
    }
  });

  // Disable back/forward navigation
  mainWindow.webContents.on("will-navigate", (e) => e.preventDefault());

  // Load app
  if (process.env.NEXT_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.NEXT_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    loadURL(mainWindow);
  }

  // Minimize to tray on close
  mainWindow.on("close", (e) => {
    e.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC: Window controls from renderer
ipcMain.on("window-minimize", () => mainWindow?.minimize());
ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on("window-close", () => mainWindow?.hide());

// --- Helper ---
async function extractBackendError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === 'string') return body.detail;
    if (body?.detail) return JSON.stringify(body.detail);
    return fallback;
  } catch {
    return fallback;
  }
}

// ─── Chat IPC Handlers ─────────────────────────────────────────

ipcMain.handle('chat-send-message', async (_event, message: string) => {
  try {
    const backendResponse = await fetch(`${API_BASE_URL}/api/v1/groq/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!backendResponse.ok) {
      throw new Error(await extractBackendError(backendResponse, 'Chat request failed'));
    }
    const data = (await backendResponse.json()) as { message: string };
    return { success: true, response: data.message };
  } catch (error: any) {
    console.error('Chat error:', error);
    return { success: false, error: error.message || 'Unknown chat error' };
  }
});

ipcMain.handle('chat-clear-history', async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/groq/chat/history`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await extractBackendError(response, 'Failed to clear history'));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('chat-get-history', async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/groq/chat/history`);
    if (!response.ok) throw new Error(await extractBackendError(response, 'Failed to get history'));
    const data = (await response.json()) as { history: any[] };
    return { success: true, history: data.history };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('chat-set-system-prompt', async (_event, prompt: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/groq/chat/system-prompt`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error(await extractBackendError(response, 'Failed to set system prompt'));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ─── Deepgram STT IPC Handlers ─────────────────────────────────

ipcMain.handle('deepgram-status', async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Backend health check failed');
    return { success: true, status: 'connected' };
  } catch (error: any) {
    return { success: false, status: 'disconnected', error: error.message };
  }
});

ipcMain.handle('deepgram-transcribe-audio', async (_event, filePath: string) => {
  try {
    const fs = await import('fs');
    const audioBuffer = fs.readFileSync(filePath);
    const blob = new Blob([audioBuffer]);
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');

    const response = await fetch(`${API_BASE_URL}/api/v1/deepgram/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(await extractBackendError(response, 'Transcription failed'));
    const data = await response.json();
    return { success: true, ...data };
  } catch (error: any) {
    console.error('Deepgram transcribe error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('deepgram-save-and-transcribe', async (_event, audioBuffer: ArrayBuffer) => {
  try {
    const blob = new Blob([Buffer.from(audioBuffer)]);
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');

    const response = await fetch(`${API_BASE_URL}/api/v1/deepgram/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(await extractBackendError(response, 'Transcription failed'));
    const data = await response.json();
    return { success: true, ...data };
  } catch (error: any) {
    console.error('Deepgram save-and-transcribe error:', error);
    return { success: false, error: error.message };
  }
});

// ─── TTS IPC Handlers ──────────────────────────────────────────

let currentTTSVoice = 'aura-asteria-en';

ipcMain.handle('tts-synthesize', async (_event, text: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/deepgram/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: currentTTSVoice }),
    });
    if (!response.ok) throw new Error(await extractBackendError(response, 'TTS synthesis failed'));
    const arrayBuffer = await response.arrayBuffer();
    return { success: true, audio: Buffer.from(arrayBuffer) };
  } catch (error: any) {
    console.error('TTS error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tts-set-voice', async (_event, voice: string) => {
  currentTTSVoice = voice;
  return { success: true, voice: currentTTSVoice };
});

ipcMain.handle('tts-get-voices', async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/deepgram/voices`);
    if (!response.ok) throw new Error(await extractBackendError(response, 'Failed to get voices'));
    const data = (await response.json()) as { voices: string[] };
    return { success: true, voices: data.voices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tts-status', async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Backend health check failed');
    return { success: true, status: 'connected' };
  } catch (error: any) {
    return { success: false, status: 'disconnected', error: error.message };
  }
});

// ─── Retrieval (RAG) IPC Handlers ──────────────────────────────

ipcMain.handle('retrieval-search', async (_event, query: string, limit?: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/rag/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: limit || 5 }),
    });
    if (!response.ok) throw new Error(await extractBackendError(response, 'Search failed'));
    const data = await response.json();
    return { success: true, ...data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('retrieval-search-docs', async (_event, query: string, limit?: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/rag/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: limit || 5 }),
    });
    if (!response.ok) throw new Error(await extractBackendError(response, 'Search failed'));
    const data = await response.json();
    return { success: true, ...data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('retrieval-index-document', async (_event, content: string, metadata?: Record<string, any>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/rag/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, metadata }),
    });
    if (!response.ok) throw new Error(await extractBackendError(response, 'Document upload failed'));
    const data = await response.json();
    return { success: true, ...data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('retrieval-status', async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/rag/collection/info`);
    if (!response.ok) throw new Error(await extractBackendError(response, 'RAG status check failed'));
    const data = await response.json();
    return { success: true, ...data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ─── VS Code Bridge IPC Handlers ───────────────────────────────

ipcMain.handle('vscode-connect', async () => {
  try {
    const bridge = getVSCodeBridge();
    await bridge.connect();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vscode-disconnect', async () => {
  try {
    const bridge = getVSCodeBridge();
    bridge.disconnect();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vscode-status', async () => {
  try {
    const bridge = getVSCodeBridge();
    return { success: true, connected: bridge.isConnected() };
  } catch (error: any) {
    return { success: false, connected: false, error: error.message };
  }
});

// ─── Agent IPC Handler ─────────────────────────────────────────

ipcMain.handle('agent-execute-task', async (_event, message: string) => {
  try {
    const bridge = getVSCodeBridge();
    if (!bridge.isConnected()) {
      throw new Error('VS Code extension not connected. Please open VS Code and ensure the Aurix extension is running.');
    }

    await fetch(`${API_BASE_URL}/api/v1/groq/chat/system-prompt`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: AGENT_SYSTEM_PROMPT }),
    });
    await fetch(`${API_BASE_URL}/api/v1/groq/chat/history`, { method: 'DELETE' });

    const steps: Array<{ tool: string; args: any; result: any }> = [];

    let agentResponse = await fetch(`${API_BASE_URL}/api/v1/groq/chat/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, tools: AGENT_TOOLS }),
    });
    if (!agentResponse.ok) throw new Error(await extractBackendError(agentResponse, 'Agent request failed'));

    let result = (await agentResponse.json()) as {
      type: string; response?: string;
      tool_calls?: Array<{ id: string; name: string; arguments: any }>;
    };

    while (result.type === 'tool_calls' && result.tool_calls) {
      const toolResults: Array<{ tool_call_id: string; result: any }> = [];
      for (const toolCall of result.tool_calls) {
        let toolResult: any;
        try { toolResult = await bridge.sendCommand(toolCall.name, toolCall.arguments); }
        catch (err: any) { toolResult = { error: err.message }; }
        steps.push({ tool: toolCall.name, args: toolCall.arguments, result: toolResult });
        if (mainWindow) {
          mainWindow.webContents.send('agent-step', { tool: toolCall.name, args: toolCall.arguments, result: toolResult, timestamp: Date.now() });
        }
        toolResults.push({ tool_call_id: toolCall.id, result: toolResult });
      }

      agentResponse = await fetch(`${API_BASE_URL}/api/v1/groq/chat/agent/tool-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_results: toolResults }),
      });
      if (!agentResponse.ok) throw new Error(await extractBackendError(agentResponse, 'Agent tool results failed'));
      result = (await agentResponse.json()) as { type: string; response?: string; tool_calls?: Array<{ id: string; name: string; arguments: any }> };
    }

    await fetch(`${API_BASE_URL}/api/v1/groq/chat/system-prompt`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'You are a helpful voice assistant. Provide clear, concise, and friendly responses.' }),
    });

    return { success: true, response: result.response || 'Done.', steps };
  } catch (error: any) {
    console.error('Agent execution error:', error);
    return { success: false, error: error.message };
  }
});

// System tray
function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, "../public/vite.svg"),
  );
  tray = new Tray(icon);
  tray.setToolTip("AURIX Voice Assistant");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Open AURIX",
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          tray?.destroy();
          app.exit(0);
        },
      },
    ]),
  );

  tray.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.focus();
    } else {
      mainWindow?.show();
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ["https://aurix-api.vercel.app/*"] },
    (details, callback) => {
      details.requestHeaders["Origin"] = "https://aurix-api.vercel.app";
      callback({ requestHeaders: details.requestHeaders });
    },
  );

  createWindow();
  createTray();

  app.on("activate", () => {
    // macOS: re-create window when clicking dock icon
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on("window-all-closed", () => {
  // Keep app alive in tray on Windows/Linux
  if (process.platform === "darwin") app.quit();
});
