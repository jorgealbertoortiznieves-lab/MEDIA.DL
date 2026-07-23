
document.addEventListener('DOMContentLoaded', () => {

    // Window Controls
    const macClose = document.querySelector('.dot-close');
    const macMinimize = document.querySelector('.dot-minimize');
    const macMaximize = document.querySelector('.dot-maximize');

    if (macClose) macClose.addEventListener('click', () => { if (window.electronAPI) window.electronAPI.closeWindow(); });
    if (macMinimize) macMinimize.addEventListener('click', () => { if (window.electronAPI) window.electronAPI.minimizeWindow(); });
    if (macMaximize) macMaximize.addEventListener('click', () => { if (window.electronAPI) window.electronAPI.maximizeWindow(); });


    // UI Elements
    
    const consoleInput = document.getElementById('consoleInput');
    const consoleSendBtn = document.getElementById('consoleSendBtn');
    const consoleQuick = document.getElementById('consoleQuick');
    const consoleTxt = document.getElementById('consoleTxt');
    let activeConsole = consoleQuick; // Default
    
    const btnSelectTxtFile = document.getElementById('btnSelectTxtFile');
    const txtFileLabel = document.getElementById('txtFileLabel');
    const consoleTxtBtn = document.getElementById('consoleTxtBtn');
    
    const configPath = document.getElementById('configPath');
    const btnSelectFolder = document.getElementById('btnSelectFolder');
    const btnUpdateEngines = document.getElementById('btnUpdateEngines');
    const configEngineBtn = document.getElementById('configEngineBtn');
    const configQuality = document.getElementById('configQuality');
    const configConcurrent = document.getElementById('configConcurrent');
    const saveConfigBtn = document.getElementById('saveConfigBtn');

    // Modal Elements
    const settingsModal = document.getElementById('settings-modal');
    const btnSettings = document.getElementById('btn-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    function openSettings() { settingsModal.classList.add('show'); }
    function closeSettings() { settingsModal.classList.remove('show'); }

    if(btnSettings) btnSettings.addEventListener('click', openSettings);
    if(btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettings);
    settingsModal.addEventListener('click', (e) => {
        if(e.target === settingsModal) closeSettings();
    });

    // State
    let currentEngine = localStorage.getItem('term_engine') || 'yt-dlp';
    let currentFolder = localStorage.getItem('term_folder') || 'C:\\Downloads\\Media';
    let currentQuality = localStorage.getItem('term_quality') || 'best';
    let currentConcurrent = localStorage.getItem('term_concurrent') || '3';
    let currentAutoPriority = localStorage.getItem('term_auto_priority') || 'gallery-dl';
    
    let selectedTxtFile = null;

    // Initialize UI
    configPath.value = currentFolder;
    configQuality.value = currentQuality;
    
    
    const configConcurrentCustom = document.getElementById('configConcurrentCustom');
    const configAutoPriority = document.getElementById('configAutoPriority');
    const btnAddCookie = document.getElementById('btnAddCookie');
    const cookieListContainer = document.getElementById('cookieListContainer');

    if (['1', '3', '5', '10'].includes(currentConcurrent)) {
        configConcurrent.value = currentConcurrent;
    } else {
        configConcurrent.value = 'custom';
        configConcurrentCustom.value = currentConcurrent;
        configConcurrentCustom.classList.remove('hidden');
    }

    if (configAutoPriority) configAutoPriority.value = currentAutoPriority;
    const autoLabel = document.getElementById('autoLabel');
    const modeSwitch = document.getElementById('modeSwitch');
    const manualEngines = document.getElementById('manualEngines');
    const btnGdl = document.getElementById('btn-gdl');
    const btnYt = document.getElementById('btn-yt');

    const clearGridBtn = document.getElementById('clearGridBtn');
    const clearGridTxtBtn = document.getElementById('clearGridTxtBtn');

    // Default state: Auto
    currentEngine = 'auto';
    
    // Switch Handler
    modeSwitch.addEventListener('change', (e) => {
        if (!e.target.checked) {
            // Auto mode
            currentEngine = 'auto';
            autoLabel.classList.add('active-auto');
            manualEngines.classList.remove('active');
        } else {
            // Manual mode
            currentEngine = btnGdl.classList.contains('selected') ? 'gallery-dl' : 'yt-dlp';
            autoLabel.classList.remove('active-auto');
            manualEngines.classList.add('active');
            if(!btnGdl.classList.contains('selected') && !btnYt.classList.contains('selected')) {
                btnGdl.classList.add('selected'); // default to gdl when switching to manual
                currentEngine = 'gallery-dl';
            }
        }
    });

    // Manual Engine Buttons
    btnGdl.addEventListener('click', () => {
        if (!modeSwitch.checked) return;
        btnGdl.classList.add('selected');
        btnYt.classList.remove('selected');
        currentEngine = 'gallery-dl';
    });

    btnYt.addEventListener('click', () => {
        if (!modeSwitch.checked) return;
        btnYt.classList.add('selected');
        btnGdl.classList.remove('selected');
        currentEngine = 'yt-dlp';
    });

    // Clear Terminal Buttons
    clearGridBtn.addEventListener('click', () => {
        if(document.getElementById('downloadsGrid')) {
            document.getElementById('downloadsGrid').innerHTML = '';
        }
    });
    
    clearGridTxtBtn.addEventListener('click', () => {
        if(document.getElementById('downloadsGridTxt')) {
            document.getElementById('downloadsGridTxt').innerHTML = '';
        }
    });

    if(btnSelectFolder) {
        btnSelectFolder.addEventListener('click', async () => {
            const folderPath = await window.electronAPI.openDirectoryDialog();
            if (folderPath) {
                configPath.value = folderPath;
            }
        });
    }

    if(btnUpdateEngines) {
        btnUpdateEngines.addEventListener('click', async () => {
            const statusSpan = document.getElementById('updateEnginesStatus');
            btnUpdateEngines.disabled = true;
            btnUpdateEngines.innerText = 'ACTUALIZANDO...';
            statusSpan.innerText = 'Buscando actualizaciones para yt-dlp y gallery-dl...';
            statusSpan.style.color = 'var(--term-cyan)';

            const { wasUpdated, ytResult, gdlResult } = await window.electronAPI.updateEngines();
            
            if (wasUpdated) {
                statusSpan.innerText = '¡Actualización completada! Reiniciando aplicación en 3 segundos...';
                statusSpan.style.color = '#0f0';
            } else {
                statusSpan.innerText = 'Ambos motores ya se encuentran en su última versión.';
                statusSpan.style.color = '#0f0';
                btnUpdateEngines.innerText = 'ACTUALIZAR MOTORES';
                btnUpdateEngines.disabled = false;
            }
        });
    }

    if(btnSelectTxtFile) {
        btnSelectTxtFile.addEventListener('click', async () => {
            const filePath = await window.electronAPI.openFileDialog();
            if (filePath) {
                selectedTxtFile = filePath;
                txtFileLabel.innerText = filePath.split('\\').pop(); // Show just filename
            }
        });
    }

    // Concurrent Select Logic
    configConcurrent.addEventListener('change', () => {
        if (configConcurrent.value === 'custom') {
            configConcurrentCustom.classList.remove('hidden');
        } else {
            configConcurrentCustom.classList.add('hidden');
        }
    });

    // Cookies Management Logic
    async function loadCookies() {
        if (!window.electronAPI.listCookies) return;
        const cookies = await window.electronAPI.listCookies();
        cookieListContainer.innerHTML = '';
        cookies.forEach(c => {
            const div = document.createElement('div');
            div.className = 'cookie-item';
            div.innerHTML = `
                <div class="cookie-item-info">
                    <span class="cookie-item-name">${c.name}</span>
                    <span class="cookie-item-path">${c.path}</span>
                </div>
                <button class="cookie-delete-btn" data-filename="${c.name}">ELIMINAR</button>
            `;
            cookieListContainer.appendChild(div);
        });

        document.querySelectorAll('.cookie-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const filename = e.target.getAttribute('data-filename');
                const success = await window.electronAPI.deleteCookie(filename);
                if (success) loadCookies();
            });
        });
    }

    if (btnAddCookie) {
        btnAddCookie.addEventListener('click', async () => {
            const added = await window.electronAPI.addCookie();
            if (added) loadCookies();
        });
    }

    // Load Settings Modal
    btnSettings.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
        loadCookies();
    });

    // Save Settings
    saveConfigBtn.addEventListener('click', () => {
        currentFolder = configPath.value.trim() || 'C:\\Downloads\\Media';
        currentQuality = configQuality.value;
        
        if (configConcurrent.value === 'custom') {
            currentConcurrent = configConcurrentCustom.value || '1';
        } else {
            currentConcurrent = configConcurrent.value;
        }

        if (configAutoPriority) {
            currentAutoPriority = configAutoPriority.value;
            localStorage.setItem('term_auto_priority', currentAutoPriority);
        }
        
        localStorage.setItem('term_engine', currentEngine);
        localStorage.setItem('term_folder', currentFolder);
        localStorage.setItem('term_quality', currentQuality);
        localStorage.setItem('term_concurrent', currentConcurrent);
        
        saveConfigBtn.innerText = 'GUARDADO!';
        saveConfigBtn.style.background = '#00e676';
        saveConfigBtn.style.color = '#000';
        setTimeout(() => {
            saveConfigBtn.innerText = 'GUARDAR CONFIG';
            saveConfigBtn.style.background = 'transparent';
            saveConfigBtn.style.color = 'var(--text-primary)';
            closeSettings();
        }, 600);
        
        appendLog('[SYSTEM] Configuración guardada exitosamente.', 'success');
    });

    // Queue System
    let downloadQueue = [];
    let activeDownloads = 0;
    let cardElements = {};

    function processQueue() {
        while (activeDownloads < parseInt(currentConcurrent) && downloadQueue.length > 0) {
            const item = downloadQueue.shift();
            startDownloadTask(item);
        }
    }

    function createCard(id, link) {
        const grid = activeConsole;
        const card = document.createElement('div');
        card.className = 'dl-card';
        card.innerHTML = `
            <div class="dl-card-header" id="header-${id}">
                <div class="dl-url-group">
                    <span class="dl-toggle-icon" id="icon-${id}">▼</span>
                    <span class="dl-url" title="${link}">${link}</span>
                </div>
                <span class="dl-status-badge pending" id="status-${id}">ESPERANDO</span>
            </div>
            <div class="dl-card-body hidden" id="body-${id}">
                <div class="dl-engine" id="engine-${id}">Motor: En cola...</div>
                <div class="dl-logs hidden" id="logs-${id}"></div>
                <div class="dl-error-msg hidden" id="err-${id}"></div>
            </div>
        `;
        grid.appendChild(card);
        
        const header = card.querySelector(`#header-${id}`);
        const body = card.querySelector(`#body-${id}`);
        const icon = card.querySelector(`#icon-${id}`);

        header.addEventListener('click', () => {
            body.classList.toggle('hidden');
            icon.classList.toggle('open');
        });

        cardElements[id] = { 
            card, 
            status: card.querySelector(`#status-${id}`), 
            engine: card.querySelector(`#engine-${id}`), 
            logs: card.querySelector(`#logs-${id}`), 
            err: card.querySelector(`#err-${id}`),
            body: body,
            icon: icon
        };
        
        // Auto-scroll
        grid.scrollTop = grid.scrollHeight;
    }

    function startDownloadTask(item) {
        activeDownloads++;
        const { id, link } = item;
        const els = cardElements[id];
        
        els.status.className = 'dl-status-badge running';
        els.status.innerText = 'PROCESANDO';
        els.engine.innerText = `Motor: Inicializando...`;
        
        let format = 'videoaudio';
        if(currentQuality === 'audio') format = 'audio';

        const data = {
            id: id,
            link: link,
            engine: currentEngine,
            downloadDir: currentFolder,
            format: format,
            quality: currentQuality,
            autoPriority: currentAutoPriority
        };
        window.electronAPI.startDownloadItem(data);
    }
    // Execute Download (Text Area)
    async function executeCommand() {
        let text = consoleInput.value.trim();
        let fromClipboard = false;

        if (!text) {
            try {
                text = await window.electronAPI.readClipboard() || "";
                text = text.trim();
                if (text) {
                    fromClipboard = true;
                }
            } catch(e) {
                console.error("Clipboard Error:", e);
            }
        }

        if (!text) {
            alert("No escribiste ningún enlace y tu portapapeles está vacío.");
            return;
        }
        
        const links = text.split('\n').map(l => l.trim()).filter(l => l);
        
        const grid = document.getElementById('downloadsGrid');
        activeConsole = grid;
        grid.classList.remove('hidden');
        grid.style.display = 'flex';
        consoleInput.value = ''; // CLEAR INPUT

        links.forEach(link => {
            const id = 'dl_' + Math.random().toString(36).substr(2, 9);
            createCard(id, link);
            downloadQueue.push({ id, link });
        });
        
        processQueue();
    }

    // Execute Download from TXT File
    consoleTxtBtn.addEventListener('click', async () => {
        if (!selectedTxtFile) {
            alert('Por favor selecciona un archivo .txt primero.');
            return;
        }

        const grid = document.getElementById('downloadsGridTxt');
        activeConsole = grid;
        grid.classList.remove('hidden');
        grid.style.display = 'flex';

        const links = await window.electronAPI.readTxtFile(selectedTxtFile);
        if (links.length === 0) {
            alert("El archivo está vacío o no se pudo leer.");
            return;
        }

        links.forEach(link => {
            const id = 'dl_' + Math.random().toString(36).substr(2, 9);
            createCard(id, link);
            downloadQueue.push({ id, link });
        });
        
        processQueue();
    });

    consoleSendBtn.addEventListener('click', executeCommand);
    
    // For textarea, Enter should just add a newline. 
    // To execute with keyboard, maybe Shift+Enter. 
    consoleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Let it make a newline, don't execute automatically!
            // If user wants to execute with enter, they need Shift+Enter
        } else if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            executeCommand();
        }
    });

    // IPC Listeners
    window.electronAPI.onItemLog((_event, logData) => {
        const els = cardElements[logData.id];
        if (els) {
            els.logs.classList.remove('hidden');
            els.logs.innerText += logData.text;
            els.logs.scrollTop = els.logs.scrollHeight;
        }
    });

    window.electronAPI.onItemStatus((_event, statusData) => {
        const els = cardElements[statusData.id];
        if (els) {
            els.engine.innerText = `Motor: ${statusData.engine}`;
        }
    });

    window.electronAPI.onItemComplete((_event, result) => {
        const els = cardElements[result.id];
        if (els) {
            if (result.success) {
                els.status.className = 'dl-status-badge success';
                els.status.innerText = 'COMPLETADO';
                els.card.classList.add('success-card');
                // Auto-close body on success if it was open
                if (!els.body.classList.contains('hidden')) {
                    els.body.classList.add('hidden');
                    els.icon.classList.remove('open');
                }
            } else {
                els.status.className = 'dl-status-badge error';
                els.status.innerText = 'FALLÓ';
                els.card.classList.add('error-card');
                els.err.classList.remove('hidden');
                els.err.innerText = result.error || 'Error desconocido.';
                // Auto-open body on error
                if (els.body.classList.contains('hidden')) {
                    els.body.classList.remove('hidden');
                    els.icon.classList.add('open');
                }
            }
        }
        activeDownloads--;
        processQueue();
    });

});
