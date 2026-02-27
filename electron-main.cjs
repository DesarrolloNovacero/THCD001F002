const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let pyProc = null;

function startPython() {
  if (app.isPackaged) {
    const exePath = path.join(process.resourcesPath, 'run_server.exe');
    console.log('Iniciando backend desde:', exePath);

    pyProc = spawn(exePath, [], {
      cwd: process.resourcesPath,
      windowsHide: true
    });

  } else {
    const scriptPath = path.join(__dirname, 'run_server.py');
    pyProc = spawn('python', [scriptPath], {
      cwd: __dirname,
      windowsHide: true
    });
  }

  pyProc.on('spawn', () => {
    console.log('Backend lanzado');
  });

  pyProc.on('exit', (code, signal) => {
    console.log('Backend cerrado', { code, signal });
    pyProc = null;
  });

  pyProc.on('error', (err) => {
    console.error('Error iniciando backend:', err);
  });
}

function stopPython() {
  if (pyProc) {
    try { pyProc.kill(); } catch (e) {}
  }
}

async function waitForBackend(timeoutMs = 30000) {
  const start = Date.now();
  const url = 'http://127.0.0.1:8000/health';

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {}

    await new Promise(r => setTimeout(r, 500));
  }

  return false;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  if (!app.isPackaged) {
    win.loadURL('http://127.0.0.1:5173');
  } else {
    win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  startPython();
  await waitForBackend(30000);
  createWindow();
});

app.on('before-quit', stopPython);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
