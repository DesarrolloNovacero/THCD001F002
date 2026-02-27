const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');

let pyProc = null;

function startPython() {
  const isProd = !process.env.ELECTRON_DEV;
  if (isProd) {
    const exe = path.join(process.resourcesPath, 'run_server.exe');
    pyProc = spawn(exe, [], { stdio: 'inherit' });
  } else {
    const script = path.join(__dirname, 'run_server.py');
    pyProc = spawn('python', [script], { stdio: 'inherit' });
  }

  pyProc.on('exit', (code) => {
    console.log('Python process exited with', code);
    pyProc = null;
  });
}

function stopPython() {
  if (pyProc) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${pyProc.pid} /t /f`, (err) => {
          if (err) console.error(err);
        });
      } else {
        pyProc.kill();
      }
    } catch (e) {
      console.error(e);
    }
  }
}

async function waitForBackend(timeoutMs = 30000) {
  const start = Date.now();
  const url = 'http://127.0.0.1:8000/health';
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {
    }
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
      contextIsolation: true,
    },
  });

  if (process.env.ELECTRON_DEV) {
    win.loadURL('http://127.0.0.1:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  startPython();
  const ready = await waitForBackend(30000);
  if (!ready) console.warn('Backend did not respond in time, opening window anyway');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => { stopPython(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
