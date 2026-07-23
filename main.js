const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

function createWindow() {
    const win = new BrowserWindow({
        width: 600,
        height: 900,
        resizable: true,
        maximizable: true,
        backgroundColor: '#2a2b2f',
        
        icon: path.join(__dirname, 'icon.ico'),
        titleBarStyle: 'hidden',
        
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true
    });

    win.loadFile('public/index.html');
}


ipcMain.on('window:minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
});
ipcMain.on('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
    }
});
ipcMain.on('window:close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Dialog handlers
ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
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
ipcMain.on('start-download-item', async (event, { id, link, engine, downloadDir, format, quality, autoPriority }) => {
    const ytDlpPath = './bin/yt-dlp.exe';
    const gdlPath = './bin/gallery-dl-app.exe';
    const gdlConfigPath = './bin/config1.json';

    const getGdlArgs = () => {
        let args = ['-d', downloadDir, '--config', gdlConfigPath];
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
                // Si falla gallery-dl también, la tarjeta quedará con su error.
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
