
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

    function openSettings() { 
        settingsModal.classList.add('show'); 
        loadCookies();
    }
    function closeSettings() { 
        settingsModal.classList.remove('show'); 
    }

    if(btnSettings) btnSettings.addEventListener('click', openSettings);
    if(btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettings);
    settingsModal.addEventListener('click', (e) => {
        if(e.target === settingsModal) closeSettings();
    });

    // State
    let currentEngine = localStorage.getItem('term_engine') || 'yt-dlp';
    let currentFolder = localStorage.getItem('term_folder') || 'C:\\Users\\jorge\\Downloads\\Media';
    let currentQuality = localStorage.getItem('term_quality') || 'best';
    let currentConcurrent = localStorage.getItem('term_concurrent') || '3';
    let currentAutoPriority = localStorage.getItem('term_auto_priority') || 'gallery-dl';
    let currentSubtitles = localStorage.getItem('term_subtitles') || 'none';
    let currentEmbedSubs = localStorage.getItem('term_embed_subs') || 'true';
    
    let selectedTxtFile = null;

    // Initialize UI
    configPath.value = currentFolder;
    configQuality.value = currentQuality;
    
    const configSubtitles = document.getElementById('configSubtitles');
    const configEmbedSubtitles = document.getElementById('configEmbedSubtitles');
    if (configSubtitles) configSubtitles.value = currentSubtitles;
    if (configEmbedSubtitles) configEmbedSubtitles.value = currentEmbedSubs;
    
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

    // Download Mode Switcher (Tabs)
    const tabQuickMode = document.getElementById('tabQuickMode');
    const tabBatchMode = document.getElementById('tabBatchMode');
    const quickSection = document.getElementById('quickSection');
    const batchSection = document.getElementById('batchSection');
    const downloadsGrid = document.getElementById('downloadsGrid');
    const downloadsGridTxt = document.getElementById('downloadsGridTxt');

    function setDownloadMode(mode) {
        if (mode === 'batch') {
            tabBatchMode.classList.add('active');
            tabQuickMode.classList.remove('active');
            batchSection.classList.remove('hidden');
            quickSection.classList.add('hidden');
            if (downloadsGrid) downloadsGrid.classList.add('hidden');
            if (downloadsGridTxt && downloadsGridTxt.children.length > 0) {
                downloadsGridTxt.classList.remove('hidden');
                downloadsGridTxt.style.display = 'flex';
            }
            localStorage.setItem('term_dl_mode', 'batch');
        } else {
            tabQuickMode.classList.add('active');
            tabBatchMode.classList.remove('active');
            quickSection.classList.remove('hidden');
            batchSection.classList.add('hidden');
            if (downloadsGridTxt) downloadsGridTxt.classList.add('hidden');
            if (downloadsGrid && downloadsGrid.children.length > 0) {
                downloadsGrid.classList.remove('hidden');
                downloadsGrid.style.display = 'flex';
            }
            localStorage.setItem('term_dl_mode', 'quick');
        }
    }

    if (tabQuickMode && tabBatchMode) {
        tabQuickMode.addEventListener('click', () => setDownloadMode('quick'));
        tabBatchMode.addEventListener('click', () => setDownloadMode('batch'));
        
        const savedMode = localStorage.getItem('term_dl_mode') || 'quick';
        setDownloadMode(savedMode);
    }

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
        if(downloadsGrid) {
            downloadsGrid.innerHTML = '';
            downloadsGrid.classList.add('hidden');
            downloadsGrid.style.display = 'none';
        }
    });
    
    clearGridTxtBtn.addEventListener('click', () => {
        if(downloadsGridTxt) {
            downloadsGridTxt.innerHTML = '';
            downloadsGridTxt.classList.add('hidden');
            downloadsGridTxt.style.display = 'none';
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

    const batchDropZone = document.getElementById('batchDropZone');
    if(btnSelectTxtFile) {
        btnSelectTxtFile.addEventListener('click', async (e) => {
            e.stopPropagation();
            const filePath = await window.electronAPI.openFileDialog();
            if (filePath) {
                selectedTxtFile = filePath;
                txtFileLabel.innerText = filePath.split('\\').pop(); // Show just filename
                txtFileLabel.style.color = 'var(--term-green)';
            }
        });
    }

    if (batchDropZone) {
        batchDropZone.addEventListener('click', () => {
            if (btnSelectTxtFile) btnSelectTxtFile.click();
        });

        batchDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            batchDropZone.style.borderColor = 'var(--term-cyan)';
            batchDropZone.style.background = 'rgba(0, 242, 254, 0.08)';
        });

        batchDropZone.addEventListener('dragleave', () => {
            batchDropZone.style.borderColor = '';
            batchDropZone.style.background = '';
        });

        batchDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            batchDropZone.style.borderColor = '';
            batchDropZone.style.background = '';
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.name.toLowerCase().endsWith('.txt')) {
                    selectedTxtFile = file.path || file.name;
                    txtFileLabel.innerText = file.name;
                    txtFileLabel.style.color = 'var(--term-green)';
                } else {
                    alert('Por favor selecciona un archivo con extensión .txt');
                }
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

    // Save Settings
    saveConfigBtn.addEventListener('click', () => {
        currentFolder = configPath.value.trim() || 'C:\\Users\\jorge\\Downloads\\Media';
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
        
        if (configSubtitles) {
            currentSubtitles = configSubtitles.value;
            localStorage.setItem('term_subtitles', currentSubtitles);
        }

        if (configEmbedSubtitles) {
            currentEmbedSubs = configEmbedSubtitles.value;
            localStorage.setItem('term_embed_subs', currentEmbedSubs);
        }
        
        localStorage.setItem('term_engine', currentEngine);
        localStorage.setItem('term_folder', currentFolder);
        localStorage.setItem('term_quality', currentQuality);
        localStorage.setItem('term_concurrent', currentConcurrent);
        
        saveConfigBtn.innerText = '¡GUARDADO!';
        saveConfigBtn.style.background = '#00e676';
        saveConfigBtn.style.color = '#000';
        setTimeout(() => {
            saveConfigBtn.innerText = 'GUARDAR CAMBIOS';
            saveConfigBtn.style.background = '';
            saveConfigBtn.style.color = '';
            closeSettings();
        }, 600);
    });

    // Queue System
    let downloadQueue = [];
    let activeDownloads = 0;
    let cardElements = {};
    let activeSelectedTaskId = null;

    // Panel Flotante de Información Superpuesto
    const taskDetailsPanel = document.getElementById('taskDetailsPanel');
    const detailFileName = document.getElementById('detailFileName');
    const detailStatusBadge = document.getElementById('detailStatusBadge');
    const detailProgressBar = document.getElementById('detailProgressBar');
    const detailProgressStat = document.getElementById('detailProgressStat');
    const detailFilesCount = document.getElementById('detailFilesCount');
    const detailLocationPath = document.getElementById('detailLocationPath');
    const btnOpenDestinationFolder = document.getElementById('btnOpenDestinationFolder');
    const detailErrorBox = document.getElementById('detailErrorBox');
    const detailErrorMessage = document.getElementById('detailErrorMessage');
    const detailEngineName = document.getElementById('detailEngineName');
    let hoverTimeout = null;

    function getHumanFriendlyError(rawError) {
        if (!rawError) return 'Error desconocido al intentar descargar el archivo.';
        const lower = String(rawError).toLowerCase();
        
        if (lower.includes('403') || lower.includes('forbidden')) {
            return 'El enlace ha expirado o el sitio web requiere iniciar sesión / cookies de acceso.';
        }
        if (lower.includes('404') || lower.includes('not found')) {
            return 'El video o archivo fue eliminado o ya no existe en el servidor.';
        }
        if (lower.includes('429') || lower.includes('too many requests')) {
            return 'Demasiadas solicitudes simultáneas al servidor. Espera unos minutos antes de reintentar.';
        }
        if (lower.includes('private') || lower.includes('members-only') || lower.includes('login required')) {
            return 'El contenido es privado o exclusivo para miembros. Requiere importar cookies en Ajustes.';
        }
        if (lower.includes('unsupported url') || lower.includes('no extractor')) {
            return 'El formato o enlace ingresado no es compatible con los motores de descarga actuales.';
        }
        if (lower.includes('permission') || lower.includes('winerror') || lower.includes('access is denied')) {
            return 'Sin permisos de escritura en la carpeta de destino. Elige otra carpeta en Ajustes.';
        }
        if (lower.includes('timed out') || lower.includes('network') || lower.includes('connection refused') || lower.includes('unreachable')) {
            return 'Error de conexión a internet o el servidor no responde.';
        }
        if (lower.includes('format') && (lower.includes('not available') || lower.includes('requested'))) {
            return 'La calidad o formato seleccionado no está disponible para este contenido.';
        }
        if (lower.includes('ffmpeg') || lower.includes('postprocessing')) {
            return 'Error al procesar o convertir el archivo multimedia con FFmpeg.';
        }
        
        const cleaned = rawError.replace(/\[[a-zA-Z0-9_\-]+\]/g, '').replace(/ERROR:\s*/gi, '').trim();
        return cleaned || 'No se pudo completar la descarga. Verifica que el enlace sea válido y público.';
    }

    function showTaskDetails(id) {
        const els = cardElements[id];
        if (!els || !taskDetailsPanel) return;

        activeSelectedTaskId = id;

        // Nombre
        detailFileName.innerText = els.extractedName || els.link || 'Descarga';

        // Estado
        detailStatusBadge.className = 'task-status-tag ' + els.statusState;
        detailStatusBadge.innerText = els.statusLabel;

        // Barra y progreso
        detailProgressBar.className = 'dl-progress-fill ' + (els.statusState === 'completed' ? 'completed' : els.statusState === 'error' ? 'error' : '');
        detailProgressBar.style.width = els.currentPercent + '%';
        detailProgressStat.innerText = els.progressText || '0 B / 0 B';

        // Cantidad de archivos
        detailFilesCount.innerText = `${els.downloadedCount} / ${els.totalFiles}`;

        // Ubicación
        detailLocationPath.innerText = els.destinationFolder || currentFolder;

        // Motor
        detailEngineName.innerText = els.currentEngineName || currentEngine || 'Auto';

        // Error
        if (els.statusState === 'error') {
            detailErrorBox.classList.remove('hidden');
            detailErrorMessage.innerText = els.friendlyError || getHumanFriendlyError(els.rawError);
        } else {
            detailErrorBox.classList.add('hidden');
        }

        taskDetailsPanel.classList.remove('hidden');
    }

    function positionAndShowFloatingDetails(targetEl, id) {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        showTaskDetails(id);
        if (!taskDetailsPanel || !targetEl) return;

        // Resaltar fila activa
        document.querySelectorAll('.dl-row-card').forEach(c => c.classList.remove('hovered-row'));
        if (cardElements[id] && cardElements[id].card) {
            cardElements[id].card.classList.add('hovered-row');
        }

        // Posicionar justo arriba del proceso (+y hacia arriba / superpuesto sobre el proceso superior)
        if (typeof targetEl.getBoundingClientRect === 'function') {
            const rect = targetEl.getBoundingClientRect();
            const panelWidth = 330;
            
            taskDetailsPanel.style.visibility = 'hidden';
            taskDetailsPanel.classList.remove('hidden');
            const panelHeight = taskDetailsPanel.offsetHeight || 220;

            let topPos = rect.top - panelHeight - 6;
            if (topPos < 8) {
                topPos = Math.max(8, rect.top - panelHeight + 35);
            }

            let leftPos = rect.right - panelWidth + 10;
            if (leftPos < 10) leftPos = 10;
            if (typeof window !== 'undefined' && window.innerWidth && leftPos + panelWidth > window.innerWidth - 10) {
                leftPos = window.innerWidth - panelWidth - 10;
            }

            taskDetailsPanel.style.top = topPos + 'px';
            taskDetailsPanel.style.left = leftPos + 'px';
            taskDetailsPanel.style.visibility = 'visible';
        }
    }

    function scheduleHideFloatingDetails() {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
            closeTaskDetails();
        }, 220);
    }

    function closeTaskDetails() {
        if (taskDetailsPanel) taskDetailsPanel.classList.add('hidden');
        document.querySelectorAll('.dl-row-card').forEach(c => c.classList.remove('hovered-row'));
        activeSelectedTaskId = null;
    }

    if (taskDetailsPanel) {
        taskDetailsPanel.addEventListener('mouseenter', () => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
        });
        taskDetailsPanel.addEventListener('mouseleave', () => {
            scheduleHideFloatingDetails();
        });
    }

    if (btnOpenDestinationFolder) {
        btnOpenDestinationFolder.addEventListener('click', () => {
            const folder = (activeSelectedTaskId && cardElements[activeSelectedTaskId] && cardElements[activeSelectedTaskId].destinationFolder) || currentFolder;
            if (window.electronAPI && window.electronAPI.openFolder) {
                window.electronAPI.openFolder(folder);
            }
        });
    }

    function updateLiveDetailsIfActive(id) {
        if (activeSelectedTaskId === id && taskDetailsPanel && !taskDetailsPanel.classList.contains('hidden')) {
            showTaskDetails(id);
        }
    }

    function processQueue() {
        while (activeDownloads < parseInt(currentConcurrent) && downloadQueue.length > 0) {
            const item = downloadQueue.shift();
            startDownloadTask(item);
        }
    }

    function createCard(id, link) {
        const grid = activeConsole;
        
        // Ensure table header exists inside grid if empty
        if (!grid.querySelector('.dl-table-header')) {
            const headerEl = document.createElement('div');
            headerEl.className = 'dl-table-header';
            headerEl.innerHTML = `
                <div class="dl-th-name">Nombre</div>
                <div class="dl-th-count">Archivos</div>
                <div class="dl-th-progress">Progreso</div>
                <div class="dl-th-inspect"></div>
            `;
            grid.appendChild(headerEl);
        }

        const card = document.createElement('div');
        card.className = 'dl-row-card';
        card.id = `card-${id}`;
        card.innerHTML = `
            <div class="dl-row-main" id="header-${id}">
                <div class="dl-col-name" id="name-${id}" title="${link}">
                    <span class="dl-name-text" id="name-text-${id}">${link}</span>
                </div>
                <div class="dl-col-count" id="count-${id}">
                    <span class="dl-count-badge" id="count-badge-${id}">0/1</span>
                </div>
                <div class="dl-col-progress">
                    <div class="dl-progress-track">
                        <div class="dl-progress-fill" id="pbar-${id}" style="width: 0%;"></div>
                        <span class="dl-progress-text" id="ptext-${id}">0 B / 0 B</span>
                    </div>
                </div>
                <div class="dl-col-inspect">
                    <button class="dl-row-inspect-btn" id="inspect-${id}" type="button" title="Ver detalles de la descarga">
                        <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
        
        const inspectBtn = card.querySelector(`#inspect-${id}`);

        // Eventos hover: Activación ÚNICAMENTE al posar el cursor sobre la lupa
        if (inspectBtn) {
            inspectBtn.addEventListener('mouseenter', () => positionAndShowFloatingDetails(inspectBtn, id));
            inspectBtn.addEventListener('mouseleave', scheduleHideFloatingDetails);
            inspectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                positionAndShowFloatingDetails(inspectBtn, id);
            });
        }

        cardElements[id] = { 
            card, 
            id,
            link,
            nameEl: card.querySelector(`#name-text-${id}`) || card.querySelector(`#name-${id}`),
            countBadge: card.querySelector(`#count-badge-${id}`) || card.querySelector(`#count-${id}`),
            pbar: card.querySelector(`#pbar-${id}`),
            ptext: card.querySelector(`#ptext-${id}`),
            downloadedCount: 0,
            totalFiles: 1,
            currentPercent: 0,
            extractedName: '',
            statusState: 'pending',
            statusLabel: 'En cola',
            progressText: '0 B / 0 B',
            destinationFolder: currentFolder,
            currentEngineName: currentEngine,
            totalSizeFormatted: '',
            rawError: '',
            friendlyError: ''
        };
        
        grid.scrollTop = grid.scrollHeight;
    }

    function startDownloadTask(item) {
        activeDownloads++;
        const { id, link } = item;
        const els = cardElements[id];
        
        if (els) {
            els.statusState = 'downloading';
            els.statusLabel = 'Descargando';
            els.currentEngineName = currentEngine;
            els.destinationFolder = currentFolder;
            if (els.pbar) els.pbar.style.width = '2%';
            if (els.ptext) els.ptext.innerText = 'Iniciando...';
            els.progressText = 'Iniciando...';
            if (els.countBadge) els.countBadge.innerText = `0/${els.totalFiles}`;
            updateLiveDetailsIfActive(id);
        }
        
        let format = 'videoaudio';
        if(currentQuality === 'audio') format = 'audio';

        const data = {
            id: id,
            link: link,
            engine: currentEngine,
            downloadDir: currentFolder,
            format: format,
            quality: currentQuality,
            autoPriority: currentAutoPriority,
            subtitles: currentSubtitles,
            embedSubs: currentEmbedSubs
        };
        window.electronAPI.startDownloadItem(data);
    }

    function parseLogForProgress(text, els) {
        if (!text || !els) return;

        const lines = text.split(/\r?\n/);
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // 1. Filename / Title Extraction (yt-dlp)
            const ytDestMatch = line.match(/\[download\] Destination:\s*(.+)/i) ||
                                 line.match(/\[Merger\] Merging formats into "(.+)"/i) ||
                                 line.match(/\[ExtractAudio\] Destination:\s*(.+)/i) ||
                                 line.match(/\[download\]\s+(.+)\s+has already been downloaded/i);
            if (ytDestMatch && ytDestMatch[1]) {
                const raw = ytDestMatch[1].trim();
                const filename = raw.split(/[/\\]/).pop();
                if (filename && filename !== els.extractedName) {
                    els.extractedName = filename;
                    if (els.nameEl) {
                        els.nameEl.innerText = filename;
                        els.nameEl.title = filename;
                    }
                }
            }

            // 1.2 Filename / Title Extraction (gallery-dl)
            if (!els.extractedName) {
                const gdlFileMatch = line.match(/(?:[a-zA-Z]:[/\\]|\/)[^:\r\n]+\.([a-zA-Z0-9]{2,5})/i);
                if (gdlFileMatch) {
                    const raw = gdlFileMatch[0].trim();
                    const filename = raw.split(/[/\\]/).pop();
                    if (filename && !filename.toLowerCase().includes('gallery-dl')) {
                        els.extractedName = filename;
                        if (els.nameEl) {
                            els.nameEl.innerText = filename;
                            els.nameEl.title = filename;
                        }
                    }
                }
            }

            // 2. yt-dlp Progress extraction (descargado / por descargar)
            const ytProgressMatch = line.match(/\[download\]\s+([0-9.]+)%/i);
            if (ytProgressMatch) {
                const pct = Math.min(100, Math.max(0, parseFloat(ytProgressMatch[1])));
                els.currentPercent = pct;
                if (els.pbar) els.pbar.style.width = pct + '%';
                
                const sizeMatch = line.match(/of\s+~?\s*([0-9.]+[KMGTP]?i?B)/i);
                if (sizeMatch) {
                    els.totalSizeFormatted = sizeMatch[1];
                    const numSize = parseFloat(sizeMatch[1]);
                    const unit = sizeMatch[1].replace(/^[0-9.]+/, '');
                    const downloadedAmount = ((numSize * pct) / 100).toFixed(1);
                    const formattedProg = `${downloadedAmount} ${unit} / ${sizeMatch[1]}`;
                    els.progressText = formattedProg;
                    if (els.ptext) els.ptext.innerText = formattedProg;
                } else {
                    const formattedProg = `${pct.toFixed(0)}%`;
                    els.progressText = formattedProg;
                    if (els.ptext) els.ptext.innerText = formattedProg;
                }

                if (pct >= 100) {
                    els.downloadedCount = 1;
                    els.totalFiles = 1;
                    if (els.countBadge) {
                        els.countBadge.innerText = '1/1';
                        els.countBadge.classList.add('completed');
                    }
                }
            }

            // 3. gallery-dl counter extraction (descargado / por descargar)
            const gdlCountMatch = line.match(/(?:#|\[gallery-dl\])\s*(\d+)\s*\/\s*(\d+)/i);
            if (gdlCountMatch) {
                const cur = parseInt(gdlCountMatch[1], 10);
                const total = parseInt(gdlCountMatch[2], 10);
                if (!isNaN(cur) && !isNaN(total) && total > 0) {
                    els.downloadedCount = cur;
                    els.totalFiles = total;
                    if (els.countBadge) els.countBadge.innerText = `${cur}/${total}`;
                    const pct = Math.min(100, Math.round((cur / total) * 100));
                    els.currentPercent = pct;
                    if (els.pbar) els.pbar.style.width = pct + '%';
                    const formattedProg = `${cur} / ${total} archivos`;
                    els.progressText = formattedProg;
                    if (els.ptext) els.ptext.innerText = formattedProg;
                }
            } else if (line.match(/(?:[a-zA-Z]:[/\\]|\/)[^:\r\n]+\.(?:jpg|jpeg|png|gif|webp|mp4|webm|mkv|zip)/i)) {
                // Discrete downloaded file
                els.downloadedCount++;
                if (els.totalFiles < els.downloadedCount) {
                    els.totalFiles = els.downloadedCount;
                }
                if (els.countBadge) els.countBadge.innerText = `${els.downloadedCount}/${els.totalFiles}`;
                const pct = Math.min(95, Math.round((els.downloadedCount / Math.max(1, els.totalFiles + 1)) * 100));
                if (els.pbar) els.pbar.style.width = pct + '%';
                const formattedProg = `${els.downloadedCount} / ${els.totalFiles} archivos`;
                els.progressText = formattedProg;
                if (els.ptext) els.ptext.innerText = formattedProg;
            }
        }

        updateLiveDetailsIfActive(els.id);
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
    consoleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Let it make a newline
        } else if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            executeCommand();
        }
    });

    // IPC Listeners
    window.electronAPI.onItemLog((_event, logData) => {
        const els = cardElements[logData.id];
        if (els) {
            parseLogForProgress(logData.text, els);
        }
    });

    window.electronAPI.onItemStatus((_event, statusData) => {
        const els = cardElements[statusData.id];
        if (els) {
            els.currentEngineName = statusData.engine;
            updateLiveDetailsIfActive(statusData.id);
        }
    });

    window.electronAPI.onItemComplete((_event, result) => {
        const els = cardElements[result.id];
        if (els) {
            if (result.success) {
                els.statusState = 'completed';
                els.statusLabel = 'Completado';
                els.currentPercent = 100;
                if (els.pbar) {
                    els.pbar.style.width = '100%';
                    els.pbar.classList.add('completed');
                }
                const finalSize = els.totalSizeFormatted || 'Listo';
                const finalProg = `${finalSize} / ${finalSize}`;
                els.progressText = finalProg;
                if (els.ptext) {
                    els.ptext.innerText = finalProg;
                    els.ptext.classList.add('completed');
                }
                if (els.downloadedCount === 0) els.downloadedCount = 1;
                if (els.totalFiles < els.downloadedCount) els.totalFiles = els.downloadedCount;
                if (els.countBadge) {
                    els.countBadge.innerText = `${els.downloadedCount}/${els.totalFiles}`;
                    els.countBadge.classList.add('completed');
                }
            } else {
                els.statusState = 'error';
                els.statusLabel = 'Falló';
                els.rawError = result.error || 'Error desconocido.';
                els.friendlyError = getHumanFriendlyError(result.error);
                if (els.pbar) {
                    els.pbar.style.width = '100%';
                    els.pbar.classList.add('error');
                }
                els.progressText = 'Error';
                if (els.ptext) {
                    els.ptext.innerText = 'Error';
                    els.ptext.classList.add('error');
                }
            }
            updateLiveDetailsIfActive(result.id);
        }
        activeDownloads--;
        processQueue();
    });

    clearGridBtn.addEventListener('click', () => {
        closeTaskDetails();
    });
    clearGridTxtBtn.addEventListener('click', () => {
        closeTaskDetails();
    });

});
