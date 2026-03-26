import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
            "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "font-src 'self' https://fonts.gstatic.com; " +
              "img-src 'self' data: https:; " +
              "media-src 'self' blob: mediastream:; " +
              "connect-src 'self' https://api.deepgram.com wss://api.deepgram.com https://api.groq.com; " +
              "worker-src 'self' blob:;",
          ],
        },
      });
    },
  );

  // Permission handler (microphone only)
  //   mainWindow.webContents.session.setPermissionRequestHandler(
  //     (webContents, permission, callback) => {
  //       console.log("Permission requested:", permission);
  //       callback(permission === "media");
  //     },
  //   );

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
  // Load app — replace the existing if/else block
  if (process.env.NEXT_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.NEXT_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist-next/index.html"));
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
