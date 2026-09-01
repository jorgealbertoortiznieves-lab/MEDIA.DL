const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, Notification, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, exec } = require('child_process');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let isDialogOpen = false;

// Bloqueo de instancia única para evitar múltiples procesos duplicados
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            showTrayWindow();
        }
    });
}

function getTrayPosition() {
    if (!mainWindow) return { x: 0, y: 0 };
    
    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workArea;
    const [winWidth, winHeight] = mainWindow.getSize();

    // Pegado al borde derecho de la pantalla y encima de la barra de tareas
    const marginX = 12;
    const marginY = 8;

    const x = Math.round(workArea.x + workArea.width - winWidth - marginX);
    const y = Math.round(workArea.y + workArea.height - winHeight - marginY);

    return { x, y };
}

function showTrayWindow() {
    if (!mainWindow) return;
    const { x, y } = getTrayPosition();
    mainWindow.setPosition(x, y, false);
    mainWindow.show();
    mainWindow.focus();
}

function hideTrayWindow() {
    if (mainWindow && mainWindow.isVisible()) {
        mainWindow.hide();
    }
}

function toggleTrayWindow() {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
        hideTrayWindow();
    } else {
        showTrayWindow();
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 480,
        height: 720,
        show: false, // Inicia oculta en segundo plano (System Tray)
        skipTaskbar: true, // NUNCA aparece en la barra de tareas
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        backgroundColor: '#0c0b16',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true
    });

    mainWindow.loadFile('public/index.html');

    // Interceptar el cierre para ocultar a la bandeja en lugar de matar la app
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    // Ocultar al hacer clic fuera (blur) salvo que haya un diálogo abierto
    mainWindow.on('blur', () => {
        if (!isQuitting && !isDialogOpen && mainWindow.isVisible()) {
            mainWindow.hide();
        }
    });
}

function createTray() {
    if (tray) return;

    const iconIco = path.join(__dirname, 'icon.ico');
    const iconPng = path.join(__dirname, 'icon.png');
    const trayIconPath = fs.existsSync(iconIco) ? iconIco : iconPng;

    tray = new Tray(trayIconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'MEDIA.DL v2.0 (Segundo Plano)',
            enabled: false
        },
        { type: 'separator' },
        {
            label: 'Abrir MEDIA.DL',
            click: () => {
                showTrayWindow();
            }
        },
        {
            label: 'Ocultar',
            click: () => {
                hideTrayWindow();
            }
        },
        { type: 'separator' },
        {
            label: 'Abrir Carpeta de Descargas',
            click: async () => {
                const fallback = path.join(os.homedir(), 'Downloads');
                await shell.openPath(fallback);
            }
        },
        { type: 'separator' },
        {
            label: 'Salir de MEDIA.DL',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('MEDIA.DL v2.0 - Activo en segundo plano');
    tray.setContextMenu(contextMenu);

    // Clic izquierdo / Doble clic: Alternar despliegue en la esquina de la bandeja
    tray.on('click', () => {
        toggleTrayWindow();
    });

    tray.on('double-click', () => {
        showTrayWindow();
    });
}

ipcMain.on('window:minimize', () => {
    if (mainWindow) mainWindow.hide();
});
ipcMain.on('window:maximize', () => {
    // En modo tray popover no se maximiza a pantalla completa, mantiene tamaño compacto
});
ipcMain.on('window:close', () => {
    if (mainWindow) mainWindow.hide();
});

app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else if (mainWindow) {
            showTrayWindow();
        }
    });
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('window-all-closed', () => {
    // Mantenerse vivo en segundo plano en la bandeja de sistema
    if (isQuitting && process.platform !== 'darwin') {
        app.quit();
    }
});

// Dialog handlers
ipcMain.handle('dialog:openFile', async () => {
    isDialogOpen = true;
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Text Files', extensions: ['txt'] }]
        });
        if (canceled) {
            return null;
        } else {
            return filePaths[0];
        }
    } finally {
        setTimeout(() => { isDialogOpen = false; }, 300);
    }
});

ipcMain.handle('dialog:openDirectory', async () => {
    isDialogOpen = true;
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        if (canceled) {
            return null;
        } else {
            return filePaths[0];
        }
    } finally {
        setTimeout(() => { isDialogOpen = false; }, 300);
    }
});

// Handler to open folder in system file explorer
ipcMain.handle('open-folder', async (event, folderPath) => {
    try {
        if (folderPath && fs.existsSync(folderPath)) {
            await shell.openPath(folderPath);
            return true;
        } else {
            const fallback = path.join(os.homedir(), 'Downloads');
            if (fs.existsSync(fallback)) {
                await shell.openPath(fallback);
                return true;
            }
        }
    } catch (e) {
        console.error("Error opening folder:", e);
    }
    return false;
});

// IPC handler for clipboard
const { clipboard } = require('electron');
ipcMain.handle('read-clipboard', () => {
    return clipboard.readText();
});

// IPC handler to read text files
ipcMain.handle('read-txt-file', (event, filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    } catch (err) {
        console.error("Error reading TXT file:", err);
        return [];
    }
});

// Cookies Management
const cookiesDir = path.join(app.getPath('userData'), 'cookies');
if (!fs.existsSync(cookiesDir)) fs.mkdirSync(cookiesDir, { recursive: true });
const masterCookiesPath = path.join(app.getPath('userData'), 'master_cookies.txt');

function buildMasterCookies() {
    try {
        let content = '';
        const files = fs.readdirSync(cookiesDir);
        for (const file of files) {
            if (file.endsWith('.txt')) {
                const text = fs.readFileSync(path.join(cookiesDir, file), 'utf-8');
                content += text + '\n';
            }
        }
        if (content.trim()) {
            fs.writeFileSync(masterCookiesPath, content, 'utf-8');
        } else if (fs.existsSync(masterCookiesPath)) {
            fs.unlinkSync(masterCookiesPath);
        }
    } catch (e) {
        console.error("Failed to build master cookies:", e);
    }
}

ipcMain.handle('list-cookies', () => {
    try {
        const files = fs.readdirSync(cookiesDir);
        return files.filter(f => f.endsWith('.txt')).map(f => ({
            name: f,
            path: path.join(cookiesDir, f)
        }));
    } catch (e) {
        return [];
    }
});

ipcMain.handle('add-cookie', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
    });
    if (canceled || filePaths.length === 0) return null;
    
    try {
        const src = filePaths[0];
        const filename = path.basename(src);
        const dest = path.join(cookiesDir, filename);
        fs.copyFileSync(src, dest);
        buildMasterCookies();
        return { name: filename, path: dest };
    } catch (e) {
        return null;
    }
});

ipcMain.handle('delete-cookie', (event, filename) => {
    try {
        const filepath = path.join(cookiesDir, filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            buildMasterCookies();
            return true;
        }
    } catch (e) {}
    return false;
});

// Helper function to spawn process and return a promise
function runProcess(executable, args, id, event, prefix) {
    return new Promise((resolve) => {
        const proc = spawn(executable, args);
        let output = '';

        proc.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            event.reply('item-log', { id, text, type: 'stdout', source: prefix });
        });

        proc.stderr.on('data', (data) => {
            const text = data.toString();
            output += text;
            event.reply('item-log', { id, text, type: 'stderr', source: prefix });
        });

        proc.on('close', (code) => {
            resolve({ code, output });
        });

        proc.on('error', (err) => {
            resolve({ code: -1, output: err.message });
        });
    });
}

// Unified IPC handler to start a single download item
ipcMain.on('start-download-item', async (event, { id, link, engine, downloadDir, format, quality, autoPriority, subtitles, embedSubs }) => {
    const ytDlpPath = 'C:\\Users\\jorge\\OneDrive\\Documentos\\Jorge\\Multimedia\\yt-dlp\\yt-dlp.exe';
    const gdlPath = 'C:\\Users\\jorge\\OneDrive\\Documentos\\Jorge\\Multimedia\\Gallery-dl\\gallery-dl-app.exe';
    const gdlConfigPath = 'C:\\Users\\jorge\\OneDrive\\Documentos\\Jorge\\Multimedia\\Gallery-dl\\config1.json';

    const getGdlArgs = () => {
        let args = ['-d', downloadDir, '--config', gdlConfigPath, '--no-check-certificate'];
        if (fs.existsSync(masterCookiesPath)) {
            args.push('--cookies', masterCookiesPath);
        }
        args.push(link);
        return args;
    };
    
    const getYtdlpArgs = () => {
        const downloadsFolder = path.join(downloadDir, '%(title)s.%(ext)s');
        let args = ['-o', downloadsFolder, '--no-check-certificate'];
        
        if (fs.existsSync(masterCookiesPath)) {
            args.push('--cookies', masterCookiesPath);
        }
        
        let formatArg = '';
        if (format === 'audio') {
            formatArg = 'bestaudio';
            args.push('-x');
        } else {
            let vQual = 'bestvideo';
            let aQual = 'bestaudio';
            if (quality && quality !== 'best') {
                vQual = `bestvideo[height<=${quality}]`;
            }
            if (format === 'videoaudio') {
                formatArg = `${vQual}+${aQual}/best`;
            } else if (format === 'video') {
                formatArg = vQual;
            }
        }
        if (formatArg) {
            args.push('-f', formatArg);
        }

        if (subtitles && subtitles !== 'none') {
            args.push('--write-subs', '--write-auto-subs');
            args.push('--sub-langs', subtitles);
            if (embedSubs !== false && embedSubs !== 'false') {
                args.push('--embed-subs');
            }
        }

        args.push(link);
        return args;
    };

    let finalSuccess = false;
    let finalErrorMsg = '';

    const runYt = async () => {
        event.reply('item-status', { id, status: 'running', engine: 'yt-dlp' });
        const { code, output } = await runProcess(ytDlpPath, getYtdlpArgs(), id, event, 'yt-dlp');
        if (code === 0) finalSuccess = true;
        else finalErrorMsg = extractYtError(output) || `yt-dlp falló (código ${code})`;
    };

    const runGdl = async (isFallback = false) => {
        event.reply('item-status', { id, status: 'running', engine: isFallback ? 'gallery-dl (fallback)' : 'gallery-dl' });
        const { code, output } = await runProcess(gdlPath, getGdlArgs(), id, event, 'gallery-dl');
        if (code === 0) {
            finalSuccess = true;
        } else {
            const isUnsupported = output.toLowerCase().includes('unsupported url') || output.toLowerCase().includes('no extractor found');
            finalErrorMsg = extractGdlError(output) || `gallery-dl falló (código ${code})`;
            return isUnsupported;
        }
        return false;
    };

    if (engine === 'auto') {
        if (autoPriority === 'yt-dlp') {
            await runYt();
            if (!finalSuccess && (finalErrorMsg.toLowerCase().includes('unsupported url') || finalErrorMsg.includes('falló'))) {
                const unsupported = await runGdl(true);
            }
        } else {
            // Default Auto (gallery-dl first)
            const isUnsupported = await runGdl();
            if (!finalSuccess && isUnsupported) {
                await runYt();
            }
        }
    } else if (engine === 'gallery-dl') {
        await runGdl();
    } else if (engine === 'yt-dlp') {
        await runYt();
    }

    if (finalSuccess) {
        event.reply('item-complete', { id, success: true });
    } else {
        event.reply('item-complete', { id, success: false, error: finalErrorMsg });
    }
});

function extractGdlError(output) {
    const lines = output.split('\n');
    for (let line of lines) {
        if (line.toLowerCase().includes('error:')) {
            return line.trim();
        }
    }
    return null;
}

function extractYtError(output) {
    const lines = output.split('\n');
    for (let line of lines) {
        if (line.toLowerCase().includes('error:')) {
            return line.trim();
        }
    }
    return null;
}

ipcMain.handle('update-engines', async () => {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    const ytDlpPath = 'C:\\\\Users\\\\jorge\\\\OneDrive\\\\Documentos\\\\Jorge\\\\Multimedia\\\\yt-dlp\\\\yt-dlp.exe';
    const gdlPath = 'C:\\\\Users\\\\jorge\\\\OneDrive\\\\Documentos\\\\Jorge\\\\Multimedia\\\\Gallery-dl\\\\gallery-dl-app.exe';

    let ytResult = '';
    let gdlResult = '';
    let wasUpdated = false;

    try {
        const yt = await execPromise(`"${ytDlpPath}" -U --no-check-certificate`);
        ytResult = yt.stdout + yt.stderr;
        if (ytResult.toLowerCase().includes('updated')) wasUpdated = true;
    } catch (e) {
        ytResult = (e.stdout || '') + (e.stderr || '') + e.message;
        if (ytResult.toLowerCase().includes('updated')) wasUpdated = true;
    }

    try {
        const gdl = await execPromise(`"${gdlPath}" -U --no-check-certificate`);
        gdlResult = gdl.stdout + gdl.stderr;
        if (gdlResult.toLowerCase().includes('updated') || gdlResult.toLowerCase().includes('actualizado') || gdlResult.toLowerCase().includes('success') || gdlResult.toLowerCase().includes('installed')) wasUpdated = true;
    } catch (e) {
        gdlResult = (e.stdout || '') + (e.stderr || '') + e.message;
        if (gdlResult.toLowerCase().includes('updated') || gdlResult.toLowerCase().includes('actualizado') || gdlResult.toLowerCase().includes('success') || gdlResult.toLowerCase().includes('installed')) wasUpdated = true;
    }

    if (wasUpdated) {
        setTimeout(() => {
            app.relaunch();
            app.exit();
        }, 3000);
    }

    return { wasUpdated, ytResult, gdlResult };
});
