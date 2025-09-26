// Version 21.5 - Add counter triggers for page load and file upload
// MODULE 5: BỘ ĐIỀU KHIỂN TRUNG TÂM (MAIN)
// File này đóng vai trò điều phối, nhập khẩu các module khác và khởi chạy ứng dụng.

import { config } from './config.js';
import { appState } from './state.js';
import { services } from './services.js';
import { ui } from './ui.js';
import { firebase } from './firebase.js';
import { luykeTab } from './tab-luyke.js';
import { sknvTab } from './tab-sknv.js';
import { realtimeTab } from './tab-realtime.js';
import { utils } from './utils.js';

// --- IndexedDB Helper ---
const idbHelper = {
    db: null,
    dbName: 'AppStorageDB',
    storeName: 'fileStore',

    openDB() {
        return new Promise((resolve, reject) => {
            if (this.db) return resolve(this.db);
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.errorCode);
                reject(event.target.error);
            };
        });
    },

    async setItem(id, value) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ id, value });
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    },

    async getItem(id) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);
            request.onsuccess = (event) => {
                resolve(event.target.result ? event.target.result.value : null);
            };
            request.onerror = (event) => reject(event.target.error);
        });
    }
};


const app = {
    currentVersion: '2.7',

    async init() {
        try {
            await firebase.init();
            await idbHelper.openDB();

            // === START: GỌI HÀM ĐẾM LƯỢT TRUY CẬP ===
            firebase.incrementCounter('pageLoads');
            // === END: GỌI HÀM ĐẾM LƯỢT TRUY CẬP ===
            
            await this.loadDataFromStorage();
            
            utils.loadInterfaceSettings();
            this.setupEventListeners();
            utils.applyContrastSetting();
            utils.loadHighlightSettings();
            
            ui.populateAllFilters();
            
            utils.loadAndApplyLuykeGoalSettings();
            utils.loadAndApplyRealtimeGoalSettings();

            this.loadPastedData();
            
            this.switchTab('home-section');

            this.checkForUpdates();
            setInterval(() => this.checkForUpdates(), 15 * 60 * 1000); 
        } catch (error) {
            console.error("Lỗi nghiêm trọng trong quá trình khởi tạo ứng dụng:", error);
        }
    },

    async checkForUpdates() {
        try {
            const response = await fetch(`./version.json?v=${new Date().getTime()}`);
            if (!response.ok) return;
            const serverConfig = await response.json();
            if (serverConfig.version && serverConfig.version !== this.currentVersion) {
                console.log(`Phiên bản mới ${serverConfig.version} đã sẵn sàng!`);
                ui.toggleModal('force-update-modal', true);
            }
        } catch (error) {
            console.error('Không thể kiểm tra phiên bản mới:', error);
        }
    },

    async loadDataFromStorage() {
        document.getElementById('declaration-ycx').value = localStorage.getItem('declaration_ycx') || config.DEFAULT_DATA.HINH_THUC_XUAT_TINH_DOANH_THU.join('\n');
        document.getElementById('declaration-ycx-gop').value = localStorage.getItem('declaration_ycx_gop') || config.DEFAULT_DATA.HINH_THUC_XUAT_TRA_GOP.join('\n');
        document.getElementById('declaration-heso').value = localStorage.getItem('declaration_heso') || Object.entries(config.DEFAULT_DATA.HE_SO_QUY_DOI).map(([k, v]) => `${k},${v}`).join('\n');

        const loadSavedFile = async (saveKey, stateKey, fileType, uiId, uiName) => {
            const savedData = await idbHelper.getItem(saveKey);
            if (!savedData) return;
            try {
                const { normalizedData, success } = services.normalizeData(savedData, fileType);
                if (success) {
                    appState[stateKey] = normalizedData;
                    if (stateKey === 'danhSachNhanVien') {
                         services.updateEmployeeMaps();
                         document.getElementById('danhsachnv-saved-status').textContent = `Đã lưu ${appState.danhSachNhanVien.length} nhân viên.`;
                    }
                    ui.updateFileStatus(uiId, 'Tải từ bộ nhớ đệm', `✓ Đã tải ${normalizedData.length} dòng.`, 'success');
                }
            } catch (e) { console.error(`Lỗi đọc ${uiName} từ IndexedDB:`, e); }
        };

        await loadSavedFile('saved_danhsachnv', 'danhSachNhanVien', 'danhsachnv', 'danhsachnv', 'DSNV');
        await loadSavedFile('saved_ycx_thangtruoc', 'ycxDataThangTruoc', 'ycx', 'ycx-thangtruoc', 'YCXL Tháng Trước');
        await loadSavedFile('saved_thuongnong_thangtruoc', 'thuongNongDataThangTruoc', 'thuongnong', 'thuongnong-thangtruoc', 'Thưởng Nóng Tháng Trước');
        await loadSavedFile('saved_ycx', 'ycxData', 'ycx', 'ycx', 'Yêu cầu xuất lũy kế');

        try {
            const savedLuykeGoals = localStorage.getItem('luykeGoalSettings');
            if(savedLuykeGoals) appState.luykeGoalSettings = JSON.parse(savedLuykeGoals);
            const savedRealtimeGoals = localStorage.getItem('realtimeGoalSettings');
            if (savedRealtimeGoals) appState.realtimeGoalSettings = JSON.parse(savedRealtimeGoals);
            const savedTemplates = localStorage.getItem('composerTemplates');
            if (savedTemplates) appState.composerTemplates = JSON.parse(savedTemplates);
        } catch (e) { console.error("Lỗi đọc cài đặt từ localStorage:", e); }
    },
    
    loadPastedData() {
        const pasteThuongERPThangTruoc = localStorage.getItem('saved_thuongerp_thangtruoc');
        if (pasteThuongERPThangTruoc) {
            const el = document.getElementById('paste-thuongerp-thangtruoc');
            if(el) {
                el.value = pasteThuongERPThangTruoc;
                this.handleErpThangTruocPaste({ target: el });
            }
        }

        const pasteLuyke = localStorage.getItem('daily_paste_luyke');
        if (pasteLuyke) {
            document.getElementById('paste-luyke').value = pasteLuyke;
            this.handleLuykePaste();
        }

        const pasteThiduaNV = localStorage.getItem('daily_paste_thiduanv');
        if (pasteThiduaNV) {
            document.getElementById('paste-thiduanv').value = pasteThiduaNV;
            this.handleThiduaNVPaste();
        }

        const pasteThuongERP = localStorage.getItem('daily_paste_thuongerp');
        if (pasteThuongERP) {
            const el = document.getElementById('paste-thuongerp');
            if(el) {
                el.value = pasteThuongERP;
                this.handleErpPaste();
            }
        }
        this.processAndRenderAllReports();
    },

    handleFileRead(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error("No file provided."));
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    resolve(workbook);
                } catch (err) { reject(err); }
            };
            reader.onerror = (err) => reject(new Error("Could not read the file: " + err));
            reader.readAsArrayBuffer(file);
        });
    },

    processAndRenderAllReports() {
        if (appState.danhSachNhanVien.length === 0) return;
        luykeTab.render();
        sknvTab.render();
        realtimeTab.render();
    },

    switchTab(targetId) {
        document.querySelectorAll('.page-section').forEach(section => section.classList.toggle('hidden', section.id !== targetId));
        document.querySelectorAll('.nav-link').forEach(link => {
            const isActive = link.getAttribute('href') === `#${targetId}`;
            link.classList.toggle('bg-blue-100', isActive);
            link.classList.toggle('text-blue-700', isActive);
        });
        
        if (targetId === 'home-section') ui.renderHomePage();
        else if (targetId === 'health-section') luykeTab.render();
        else if (targetId === 'health-employee-section') sknvTab.render();
        else if (targetId === 'realtime-section') realtimeTab.render();
        else if (targetId === 'declaration-section' && appState.isAdmin) ui.renderAdminHelpEditors();
    },

    setupEventListeners() {
        try {
            const multiSelectConfig = { 
                removeItemButton: true, 
                placeholder: true, 
                placeholderValue: 'Chọn hoặc gõ để tìm...', 
                searchPlaceholderValue: 'Tìm kiếm...' 
            };

            ['luyke', 'sknv', 'realtime'].forEach(prefix => {
                const employeeEl = document.getElementById(`${prefix}-filter-name`);
                if (employeeEl) {
                    appState.choices[`${prefix}_employee`] = new Choices(employeeEl, multiSelectConfig);
                }
                
                ['warehouse', 'department'].forEach(type => {
                    const el = document.getElementById(`${prefix}-filter-${type}`);
                    if(el) {
                         appState.choices[`${prefix}_${type}`] = new Choices(el, { searchEnabled: true, removeItemButton: false, itemSelectText: 'Chọn' });
                    }
                });

                ['nhanhang', 'nhomhang', 'employee'].forEach(type => {
                    const highlightEl = document.getElementById(`${prefix}-highlight-${type}`);
                    if (highlightEl) {
                        appState.choices[`${prefix}_highlight_${type}`] = new Choices(highlightEl, multiSelectConfig);
                    }
                });
            });

            const singleSelectConfig = { 
                searchEnabled: true, 
                removeItemButton: false, 
                itemSelectText: 'Chọn', 
                searchPlaceholderValue: 'Tìm kiếm...' 
            };
            const singleSelects = {
                'sknv-employee-filter': 'sknv_employee_detail',
                'thidua-employee-filter': 'thidua_employee_detail',
                'realtime-employee-detail-filter': 'realtime_employee_detail',
                'thidua-vung-filter-supermarket': 'thiDuaVung_sieuThi'
            };
            for (const [id, key] of Object.entries(singleSelects)) {
                 const el = document.getElementById(id);
                 if (el) {
                    appState.choices[key] = new Choices(el, singleSelectConfig);
                 }
            }

        } catch (error) { console.error("Lỗi khi khởi tạo Choices.js:", error); }

        try {
            const initDatePicker = (prefix, renderFunc) => {
                const datePickerEl = document.getElementById(`${prefix}-filter-date`);
                if (!datePickerEl) return;
                const datePicker = flatpickr(datePickerEl, {
                    mode: "multiple", dateFormat: "d/m", maxDate: "today",
                    onClose: (selectedDates, dateStr, instance) => {
                        if (selectedDates.length === 2) {
                            const [start, end] = selectedDates.sort((a,b) => a - b);
                            const dateRange = Array.from({length: (end - start) / 86400000 + 1}, (_, i) => new Date(start.getTime() + i * 86400000));
                            instance.setDate(dateRange, false);
                        }
                        ui.updateDateSummary(document.getElementById(`${prefix}-date-summary`), instance);
                        renderFunc();
                    }
                });
                appState.choices[`${prefix}_date_picker`] = datePicker;
                document.getElementById(`${prefix}-clear-date`)?.addEventListener('click', () => { datePicker.clear(); renderFunc(); });
            };
            initDatePicker('luyke', luykeTab.render);
            initDatePicker('sknv', sknvTab.render);
        } catch (error) { console.error("Lỗi khi khởi tạo Flatpickr:", error); }

        document.getElementById('force-reload-btn')?.addEventListener('click', () => window.location.reload());

        document.querySelectorAll('a.nav-link').forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); this.switchTab(link.getAttribute('href').substring(1)); }));
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.addEventListener('click', (e) => {
            ui.handleSubTabClick(e.currentTarget);
            luykeTab.render();
        }));
        document.querySelectorAll('.toggle-filters-btn').forEach(button => button.addEventListener('click', () => ui.toggleFilterSection(button.dataset.target)));
        
        document.querySelectorAll('.file-input').forEach(input => {
            if (input.id !== 'file-thidua-vung') {
                input.addEventListener('change', (e) => this.handleFileInputChange(e));
            }
        });
        
        document.getElementById('paste-luyke')?.addEventListener('input', () => this.handleLuykePaste());
        document.getElementById('paste-thiduanv')?.addEventListener('input', () => this.handleThiduaNVPaste());
        document.getElementById('paste-thuongerp')?.addEventListener('input', () => this.handleErpPaste());
        document.getElementById('paste-thuongerp-thangtruoc')?.addEventListener('input', (e) => this.handleErpThangTruocPaste(e));
        document.getElementById('realtime-file-input')?.addEventListener('change', (e) => this.handleRealtimeFileInput(e));
        document.getElementById('download-danhsachnv-template-btn')?.addEventListener('click', () => this.handleTemplateDownload());
        
        document.getElementById('file-thidua-vung')?.addEventListener('change', (e) => this.handleThiDuaVungFileInput(e));
        document.getElementById('thidua-vung-filter-supermarket')?.addEventListener('change', () => this.handleThiDuaVungFilterChange());

        ['luyke', 'sknv', 'realtime'].forEach(prefix => {
            document.getElementById(`${prefix}-filter-warehouse`)?.addEventListener('change', () => this.handleFilterChange(prefix));
            document.getElementById(`${prefix}-filter-department`)?.addEventListener('change', () => this.handleFilterChange(prefix));
            document.getElementById(`${prefix}-filter-name`)?.addEventListener('change', () => this.handleFilterChange(prefix));
        });
        document.getElementById('sknv-view-selector')?.addEventListener('click', (e) => this.handleSknvViewChange(e));
        document.getElementById('sknv-employee-filter')?.addEventListener('change', () => sknvTab.render());
        document.getElementById('luyke-thidua-view-selector')?.addEventListener('click', (e) => this.handleLuykeThiDuaViewChange(e));
        document.getElementById('thidua-view-selector')?.addEventListener('click', (e) => this.handleThiDuaViewChange(e));
        document.getElementById('thidua-employee-filter')?.addEventListener('change', () => ui.displayCompetitionReport('employee'));
        document.getElementById('dtnv-realtime-view-selector')?.addEventListener('click', (e) => this.handleDtnvRealtimeViewChange(e));
        document.getElementById('realtime-employee-detail-filter')?.addEventListener('change', () => realtimeTab.handleEmployeeDetailChange());
        document.getElementById('dthang-realtime-view-selector')?.addEventListener('click', (e) => this.handleDthangRealtimeViewChange(e));
        document.getElementById('realtime-brand-category-filter')?.addEventListener('change', () => realtimeTab.handleBrandFilterChange());
        document.getElementById('realtime-brand-filter')?.addEventListener('change', () => realtimeTab.handleBrandFilterChange());

        this.setupSettingsAndModals();
        this.setupHighlightingEventListeners();
        this.setupActionButtons();
        this.setupCollaborationEventListeners();
        this.setupSortingEventListeners();
    },
    
    setupSortingEventListeners() {
        document.body.addEventListener('click', (e) => {
            const header = e.target.closest('.sortable');
            if (!header) return;

            const table = header.closest('table');
            const tableType = table?.dataset.tableType;
            const sortKey = header.dataset.sort;

            if (!tableType || !sortKey) return;

            const currentState = appState.sortState[tableType] || { key: sortKey, direction: 'desc' };
            
            let newDirection;
            if (currentState.key === sortKey) {
                newDirection = currentState.direction === 'desc' ? 'asc' : 'desc';
            } else {
                newDirection = 'desc';
            }
            appState.sortState[tableType] = { key: sortKey, direction: newDirection };

            if (tableType.startsWith('luyke')) luykeTab.render();
            else if (tableType.startsWith('sknv') || tableType.startsWith('doanhthu_lk') || tableType.startsWith('thunhap') || tableType.startsWith('hieu_qua')) sknvTab.render();
            else if (tableType.startsWith('realtime')) realtimeTab.render();
        });
    },

    setupSettingsAndModals() {
        document.getElementById('admin-access-btn')?.addEventListener('click', () => ui.toggleModal('admin-modal', true));
        document.getElementById('admin-submit-btn')?.addEventListener('click', () => this.handleAdminLogin());
        document.getElementById('admin-cancel-btn')?.addEventListener('click', () => ui.toggleModal('admin-modal', false));
        document.getElementById('interface-settings-btn')?.addEventListener('click', () => ui.toggleDrawer('interface-drawer', true));
        document.getElementById('goal-settings-btn')?.addEventListener('click', () => ui.toggleDrawer('goal-drawer', true));
        document.querySelectorAll('.close-drawer-btn, #drawer-overlay').forEach(el => el.addEventListener('click', () => ui.closeAllDrawers()));
        document.querySelectorAll('.contrast-selector').forEach(sel => sel.addEventListener('change', (e) => this.handleContrastChange(e)));
        
        document.getElementById('global-font-size-slider')?.addEventListener('input', (e) => utils.handleFontSizeChange(e, 'global'));
        document.getElementById('kpi-font-size-slider')?.addEventListener('input', (e) => utils.handleFontSizeChange(e, 'kpi'));

        document.querySelectorAll('.kpi-color-input').forEach(picker => picker.addEventListener('input', () => utils.saveInterfaceSettings()));
        document.getElementById('save-declaration-btn')?.addEventListener('click', () => this.saveDeclarations());
        
        document.getElementById('rt-goal-warehouse-select')?.addEventListener('change', () => utils.loadAndApplyRealtimeGoalSettings());
        document.getElementById('luyke-goal-warehouse-select')?.addEventListener('change', () => utils.loadAndApplyLuykeGoalSettings());
        
        document.querySelectorAll('.rt-goal-input, .rt-setting-input').forEach(input => input.addEventListener('input', () => {
            utils.saveRealtimeGoalSettings();
            realtimeTab.render();
        }));
        document.querySelectorAll('.luyke-goal-input').forEach(input => input.addEventListener('input', () => {
            utils.saveLuykeGoalSettings();
            sknvTab.render();
            luykeTab.render();
        }));

        document.getElementById('toggle-debug-btn')?.addEventListener('click', (e) => ui.toggleDebugTool(e.currentTarget));
        document.body.addEventListener('click', (e) => {
            const helpTrigger = e.target.closest('.page-header__help-btn');
            if(helpTrigger) ui.showHelpModal(helpTrigger.dataset.helpId);
            const closeModalTrigger = e.target.closest('[data-close-modal]');
            if (closeModalTrigger) ui.toggleModal(closeModalTrigger.closest('.modal').id, false);
        });
    },

    setupHighlightingEventListeners() {
        ['luyke', 'sknv', 'realtime'].forEach(prefix => {
            document.getElementById(`${prefix}-highlight-nhanhang`)?.addEventListener('change', () => this.handleHighlightFilterChange(prefix, 'nhanhang'));
            document.getElementById(`${prefix}-highlight-nhomhang`)?.addEventListener('change', () => this.handleHighlightFilterChange(prefix, 'nhomhang'));
            document.getElementById(`${prefix}-highlight-employee`)?.addEventListener('change', () => this.handleHighlightFilterChange(prefix, 'employee'));
            document.getElementById(`${prefix}-highlight-color`)?.addEventListener('input', (e) => this.handleHighlightColorChange(prefix));
            document.getElementById(`${prefix}-clear-highlight`)?.addEventListener('click', () => this.handleClearHighlight(prefix));
        });
    },

    setupCollaborationEventListeners() {
        document.body.addEventListener('click', async (e) => {
            const target = e.target;
            if (target.id === 'submit-feedback-btn') this.handleSubmitFeedback();
            const feedbackItem = target.closest('.feedback-item');
            if (feedbackItem) this.handleFeedbackReplyActions(e, feedbackItem);
            
            const composerTrigger = target.closest('.action-btn--composer');
            if (composerTrigger) {
                const sectionId = composerTrigger.id.split('-')[1];
                this.prepareAndShowComposer(sectionId);
            }

            const composerModal = target.closest('#composer-modal');
            if (composerModal) this.handleComposerActions(e, composerModal);

            if (target.id === 'copy-from-preview-btn') ui.copyFromPreview();
            if (target.id === 'save-help-content-btn') this.saveHelpContent();
        });
    },

    setupActionButtons() {
        ['luyke', 'sknv', 'realtime'].forEach(prefix => {
            const captureBtn = document.getElementById(`capture-${prefix}-btn`);
            if (!captureBtn) return;
            captureBtn.addEventListener('click', () => {
                const navId = prefix === 'luyke' ? 'luyke-subtabs-nav' : (prefix === 'sknv' ? 'employee-subtabs-nav' : 'realtime-subtabs-nav');
                const contentContainerId = prefix === 'luyke' ? 'luyke-subtabs-content' : (prefix === 'sknv' ? 'employee-subtabs-content' : 'realtime-subtabs-content');

                const activeTabButton = document.querySelector(`#${navId} .sub-tab-btn.active`);
                if (!activeTabButton) { ui.showNotification('Không tìm thấy tab đang hoạt động.', 'error'); return; }
                
                const title = activeTabButton.dataset.title || 'BaoCao';
                let elementToCapture;

                if (prefix === 'luyke' && activeTabButton.dataset.target === 'subtab-luyke-thidua-vung') {
                    elementToCapture = document.getElementById('thidua-vung-infographic-container');
                } else {
                    elementToCapture = document.querySelector(`#${contentContainerId} .sub-tab-content:not(.hidden)`);
                }

                if (!elementToCapture || elementToCapture.children.length === 0) { ui.showNotification('Không có nội dung để chụp.', 'error'); return; }

                utils.captureDashboardInParts(elementToCapture, title);
            });

            document.getElementById(`export-${prefix}-btn`)?.addEventListener('click', () => {
                const navId = prefix === 'sknv' ? 'sknv-subtabs-nav' : `${prefix}-subtabs-nav`;
                const contentContainerId = prefix === 'sknv' ? 'employee-subtabs-content' : `${prefix}-subtabs-content`;
                
                const activeTabButton = document.querySelector(`#${navId} .sub-tab-btn.active`);
                const activeTabContent = document.querySelector(`#${contentContainerId} .sub-tab-content:not(.hidden)`);
                if (activeTabContent && activeTabButton) {
                    const title = activeTabButton.dataset.title || 'BaoCao';
                    const timestamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
                    utils.exportTableToExcel(activeTabContent, `${title}_${timestamp}`);
                } else {
                     ui.showNotification('Không tìm thấy tab để xuất.', 'error');
                }
            });
        });
    },

    async handleFileInputChange(e) {
        const fileInput = e.target;
        const file = fileInput.files[0];
        const fileType = fileInput.id.replace('file-', '');
        const dataName = fileInput.dataset.name || fileType;
        const stateKey = fileInput.dataset.stateKey; 
        
        if (!file || !stateKey) return; 
        
        ui.updateFileStatus(fileType, file.name, 'Đang xử lý...', 'default');
        ui.showProgressBar(fileType);

        try {
            const workbook = await this.handleFileRead(file);
            const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const normalizeType = fileType.includes('thangtruoc') ? fileType.replace('-thangtruoc', '') : fileType;
            const { normalizedData, success, missingColumns } = services.normalizeData(rawData, normalizeType);
            ui.displayDebugInfo(fileType);

            if (success) {
                // === START: GỌI HÀM ĐẾM LƯỢT SỬ DỤNG ===
                firebase.incrementCounter('actionsTaken');
                // === END: GỌI HÀM ĐẾM LƯỢT SỬ DỤNG ===
                
                appState[stateKey] = normalizedData;
                if (stateKey === 'danhSachNhanVien') {
                    services.updateEmployeeMaps();
                    ui.populateAllFilters();
                    
                    utils.loadAndApplyLuykeGoalSettings();
                    utils.loadAndApplyRealtimeGoalSettings();
                }
                ui.updateFileStatus(fileType, file.name, `✓ Đã tải ${normalizedData.length} dòng.`, 'success');
                ui.showNotification(`Tải thành công file "${dataName}"!`, 'success');
                
                if (fileInput.dataset.saveKey) {
                    await idbHelper.setItem(fileInput.dataset.saveKey, rawData);
                    const savedStatusSpan = document.getElementById(`${fileType}-saved-status`);
                    if (savedStatusSpan) savedStatusSpan.textContent = `Đã lưu ${normalizedData.length} dòng.`;
                    ui.showNotification(`Đã lưu "${dataName}" vào bộ nhớ đệm của trình duyệt.`, 'success');
                } else {
                    const dailySaveKeys = {
                        'giocong': 'daily_giocong_data_raw',
                        'thuongnong': 'daily_thuongnong_data_raw'
                    };
                    if (dailySaveKeys[fileType]) {
                        localStorage.setItem(dailySaveKeys[fileType], JSON.stringify(rawData));
                    }
                }

                this.processAndRenderAllReports();
            } else { 
                const errorMessage = `Lỗi file "${dataName}": Thiếu cột: ${missingColumns.join(', ')}.`;
                ui.updateFileStatus(fileType, file.name, `Lỗi: Thiếu cột dữ liệu.`, 'error');
                ui.showNotification(errorMessage, 'error');
                if (document.getElementById('debug-tool-container')?.classList.contains('hidden')) {
                    document.getElementById('toggle-debug-btn')?.click();
                }
            }
        } catch (error) {
            console.error(`Lỗi xử lý file ${dataName}:`, error);
            ui.updateFileStatus(fileType, file.name, `Lỗi: ${error.message}`, 'error');
            ui.showNotification(`Lỗi khi xử lý file "${dataName}".`, 'error');
        } finally {
            ui.hideProgressBar(fileType);
        }
    },
    
    async handleRealtimeFileInput(e) {
        const file = e.target.files[0];
        if (!file) return;
        ui.showNotification('Đang xử lý file realtime...', 'success');
        appState.realtimeYCXData = []; 
        e.target.value = '';
        try {
            const workbook = await this.handleFileRead(file);
            const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const { normalizedData, success, missingColumns } = services.normalizeData(rawData, 'ycx'); 
            ui.displayDebugInfo('ycx-realtime');
            if (success) {
                appState.realtimeYCXData = normalizedData;
                ui.populateRealtimeBrandCategoryFilter();
                ui.showNotification(`Tải thành công ${normalizedData.length} dòng realtime!`, 'success');
                realtimeTab.render();
            } else {
                 ui.showNotification(`File realtime lỗi: Thiếu cột ${missingColumns.join(', ')}.`, 'error');
                 if (document.getElementById('debug-tool-container')?.classList.contains('hidden')) {
                    document.getElementById('toggle-debug-btn')?.click();
                 }
            }
        } catch (err) { ui.showNotification(`Có lỗi khi đọc file: ${err.message}`, 'error'); console.error(err); }
    },

    async handleTemplateDownload() {
        ui.showNotification('Đang chuẩn bị file mẫu...', 'success');
        try {
            const url = await firebase.getTemplateDownloadURL();
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Danh_Sach_Nhan_Vien_Mau.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Lỗi khi tải file mẫu:", error);
            ui.showNotification('Không thể tải file mẫu. Vui lòng thử lại.', 'error');
        }
    },

    handleFilterChange(prefix) {
        ui.updateEmployeeFilter(prefix);
        if (prefix === 'luyke') luykeTab.render();
        else if (prefix === 'sknv') sknvTab.render();
        else if (prefix === 'realtime') realtimeTab.render();
    },

    handleHighlightFilterChange(prefix, type) {
        const choicesInstance = appState.choices[`${prefix}_highlight_${type}`];
        if (!choicesInstance) return;
        const values = choicesInstance.getValue(true);
        const color = document.getElementById(`${prefix}-highlight-color`).value;
        appState.highlightSettings[prefix] = { type, values, color };
        localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
        utils.applyHighlights(prefix);
    },
    
    handleHighlightColorChange(prefix) {
        const activeType = appState.highlightSettings[prefix]?.type;
        if (activeType) this.handleHighlightFilterChange(prefix, activeType);
    },

    handleClearHighlight(prefix) {
        appState.highlightSettings[prefix] = {};
        localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
        ['nhanhang', 'nhomhang', 'employee'].forEach(type => {
             appState.choices[`${prefix}_highlight_${type}`]?.removeActiveItemsByValue(appState.choices[`${prefix}_highlight_${type}`]?.getValue(true) || []);
        });
        utils.applyHighlights(prefix);
    },

    handleContrastChange(e) {
        const level = e.target.value;
        localStorage.setItem('contrastLevel', level);
        document.documentElement.dataset.contrast = level;
    },

    handleLuykePaste() {
        const pastedText = document.getElementById('paste-luyke')?.value || '';
        localStorage.setItem('daily_paste_luyke', pastedText);
        ui.updatePasteStatus('status-luyke');
        this.processAndRenderAllReports();
    },

    handleThiduaNVPaste() {
        const pastedText = document.getElementById('paste-thiduanv')?.value || '';
        localStorage.setItem('daily_paste_thiduanv', pastedText);
        sknvTab.render();
        ui.updatePasteStatus('status-thiduanv', '✓ Đã xử lý và hiển thị báo cáo.');
    },

    handleErpPaste() {
        const pastedText = document.getElementById('paste-thuongerp')?.value || '';
        localStorage.setItem('daily_paste_thuongerp', pastedText);
        appState.thuongERPData = services.processThuongERP(pastedText);
        ui.updatePasteStatus('status-thuongerp', `✓ Đã xử lý ${appState.thuongERPData.length} nhân viên.`);
        this.processAndRenderAllReports();
    },

    handleErpThangTruocPaste(e) {
         const pastedText = e.target.value;
         localStorage.setItem('saved_thuongerp_thangtruoc', pastedText);
         appState.thuongERPDataThangTruoc = services.processThuongERP(pastedText);
         ui.updatePasteStatus('status-thuongerp-thangtruoc', `✓ Đã xử lý ${appState.thuongERPDataThangTruoc.length} nhân viên.`);
         sknvTab.render();
    },
    
    handleAdminLogin() {
        if (document.getElementById('admin-password-input').value === config.ADMIN_PASSWORD) {
            appState.isAdmin = true;
            ui.renderFeedbackSection();
            ui.renderAdminHelpEditors();
            this.switchTab('declaration-section');
            ui.toggleModal('admin-modal', false);
            document.getElementById('admin-password-input').value = '';
            document.getElementById('admin-error-msg').classList.add('hidden');
        } else {
            document.getElementById('admin-error-msg').classList.remove('hidden');
        }
    },
    
    saveDeclarations() {
        localStorage.setItem('declaration_ycx', document.getElementById('declaration-ycx').value);
        localStorage.setItem('declaration_ycx_gop', document.getElementById('declaration-ycx-gop').value);
        localStorage.setItem('declaration_heso', document.getElementById('declaration-heso').value);
        ui.showNotification('Đã lưu khai báo!', 'success');
        this.processAndRenderAllReports();
    },
    
    saveHelpContent() {
        const contents = {
            data: document.getElementById('edit-help-data').value,
            luyke: document.getElementById('edit-help-luyke').value,
            sknv: document.getElementById('edit-help-sknv').value,
            realtime: document.getElementById('edit-help-realtime').value
        };
        firebase.saveHelpContent(contents);
    },
    
    async handleSubmitFeedback() {
        const textarea = document.getElementById('feedback-textarea');
        const success = await firebase.submitFeedback(textarea.value.trim());
        if (success) textarea.value = '';
    },
    
    async handleFeedbackReplyActions(e, feedbackItem) {
        const docId = feedbackItem.dataset.id;
        const replyForm = feedbackItem.querySelector('.reply-form-container');
        if (e.target.classList.contains('reply-btn')) {
            replyForm.classList.remove('hidden');
        }
        if (e.target.classList.contains('cancel-reply-btn')) {
            replyForm.classList.add('hidden');
        }
        if (e.target.classList.contains('submit-reply-btn')) {
            const textarea = replyForm.querySelector('textarea');
            const success = await firebase.submitReply(docId, textarea.value.trim());
            if (success) {
                textarea.value = '';
                replyForm.classList.add('hidden');
            }
        }
    },
    
    _getFilteredReportData(sectionId) {
        const masterData = appState.masterReportData[sectionId] || [];
        if (masterData.length === 0) return [];

        const selectedWarehouse = document.getElementById(`${sectionId}-filter-warehouse`).value;
        const selectedDept = document.getElementById(`${sectionId}-filter-department`).value;
        const selectedNames = appState.choices[`${sectionId}_employee`] ? appState.choices[`${sectionId}_employee`].getValue(true) : [];
        
        let filteredReport = masterData;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedNames && selectedNames.length > 0) filteredReport = filteredReport.filter(nv => selectedNames.includes(String(nv.maNV)));

        return filteredReport;
    },

    prepareAndShowComposer(sectionId) {
        const deptFilter = document.getElementById('composer-dept-filter');
        if (deptFilter) {
            const uniqueDepartments = [...new Set(appState.danhSachNhanVien.map(nv => nv.boPhan).filter(Boolean))].sort();
            deptFilter.innerHTML = '<option value="ALL">Toàn siêu thị</option>' + uniqueDepartments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
        }
        
        const filteredReportData = this._getFilteredReportData(sectionId);
        if (filteredReportData.length === 0) {
            ui.showNotification("Không có dữ liệu đã lọc để tạo thẻ nhận xét.", "error");
        }
        const supermarketReport = services.aggregateReport(filteredReportData);

        const qdcContainer = document.getElementById('composer-qdc-tags-container');
        if (qdcContainer) {
            qdcContainer.innerHTML = '<h5 class="composer__tag-group-title">Chọn Nhóm Hàng QĐC</h5>';
            if (supermarketReport.qdc) {
                Object.values(supermarketReport.qdc).sort((a,b) => b.dtqd - a.dtqd).forEach(item => {
                    const btn = document.createElement('button');
                    btn.className = 'composer__tag-btn';
                    btn.dataset.tagTemplate = `[QDC_INFO_${item.name}]`;
                    btn.textContent = item.name;
                    qdcContainer.appendChild(btn);
                });
            }
        }
        
        const nganhHangContainer = document.getElementById('composer-nganhhang-tags-container');
        if (nganhHangContainer) {
            nganhHangContainer.innerHTML = '<h5 class="composer__tag-group-title">Chọn Ngành Hàng Chi Tiết</h5>';
            if (supermarketReport.nganhHangChiTiet) {
                 Object.values(supermarketReport.nganhHangChiTiet).sort((a,b) => b.revenue - a.revenue).forEach(item => {
                    const btn = document.createElement('button');
                    btn.className = 'composer__tag-btn';
                    btn.dataset.tagTemplate = `[NH_INFO_${item.name}]`;
                    btn.textContent = utils.cleanCategoryName(item.name);
                    nganhHangContainer.appendChild(btn);
                });
            }
        }
        
        ui.showComposerModal(sectionId);
    },

    handleComposerActions(e, modal) {
        const textarea = document.getElementById('composer-textarea');
        
        if (e.target.matches('.composer__tab-btn, .composer__sub-tab-btn')) {
            const nav = e.target.closest('.composer__nav, .composer__sub-nav');
            const content = nav.nextElementSibling;
            nav.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
            content.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            const targetId = e.target.dataset.tab || e.target.dataset.subTab;
            content.querySelector(`#${targetId}`).classList.add('active');
            return;
        }

        if (e.target.matches('.composer__icon-btn')) {
            ui.insertComposerTag(textarea, e.target.textContent);
            return;
        }
        
        if (e.target.matches('.composer__tag-btn')) {
            let tagToInsert = e.target.dataset.tag;
            if (e.target.dataset.tagTemplate) {
                const dept = document.getElementById('composer-dept-filter').value;
                tagToInsert = e.target.dataset.tagTemplate.replace('{dept}', dept);
            }
            ui.insertComposerTag(textarea, tagToInsert);
            return;
        }

        const sectionId = modal.dataset.sectionId;
        if (e.target.id === 'save-composer-template-btn') {
            appState.composerTemplates[sectionId] = textarea.value;
            localStorage.setItem('composerTemplates', JSON.stringify(appState.composerTemplates));
            ui.showNotification(`Đã lưu mẫu cho tab ${sectionId.toUpperCase()}!`, 'success');
        }
        if (e.target.id === 'copy-composed-notification-btn') {
            const template = textarea.value;
            const filteredReportData = this._getFilteredReportData(sectionId);
            if (filteredReportData.length === 0 && sectionId !== 'luyke') {
                ui.showNotification("Lỗi: Không có dữ liệu đã lọc để tạo nhận xét.", "error"); return;
            }

            const supermarketReport = services.aggregateReport(filteredReportData);
            const selectedWarehouse = document.getElementById(`${sectionId}-filter-warehouse`).value;
            const goals = sectionId === 'realtime' ? utils.getRealtimeGoalSettings(selectedWarehouse).goals : utils.getLuykeGoalSettings(selectedWarehouse).goals;
            
            if (sectionId === 'luyke') {
                const pastedData = services.parseLuyKePastedData(document.getElementById('paste-luyke').value);
                supermarketReport.comparisonData = pastedData.comparisonData;
            }

            const processedText = services.processComposerTemplate(template, supermarketReport, goals, filteredReportData, appState.competitionData);
            ui.showPreviewAndCopy(processedText);
        }
    },

    handleSknvViewChange(e) {
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#sknv-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const view = button.dataset.view;
            document.getElementById('sknv-employee-selector-container').classList.toggle('hidden', view !== 'detail');
            sknvTab.render();
        }
    },

    handleLuykeThiDuaViewChange(e) {
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#luyke-thidua-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            luykeTab.render();
        }
    },

    handleDtnvRealtimeViewChange(e) {
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#dtnv-realtime-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const view = button.dataset.view;
            document.getElementById('dtnv-realtime-employee-selector-container').classList.toggle('hidden', view !== 'infographic');
            realtimeTab.render();
        }
    },

    handleDthangRealtimeViewChange(e) {
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#dthang-realtime-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            realtimeTab.render();
        }
    },

    handleThiDuaViewChange(e) {
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#thidua-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const view = button.dataset.view;
            document.getElementById('thidua-employee-selector-container').classList.toggle('hidden', view !== 'employee');
            ui.displayCompetitionReport(view);
        }
    },
    
    async handleThiDuaVungFileInput(e) {
        const fileInput = e.target;
        const file = fileInput.files[0];
        if (!file) return;

        ui.updateFileStatus('thidua-vung', file.name, 'Đang xử lý...', 'default');
        
        try {
            const workbook = await this.handleFileRead(file);
            const { chiTietData, tongData } = services.processThiDuaVungFile(workbook);

            if (!tongData || tongData.length === 0) {
                throw new Error('Không tìm thấy dữ liệu hợp lệ trong sheet "TONG".');
            }

            appState.thiDuaVungChiTiet = chiTietData;
            appState.thiDuaVungTong = tongData;

            appState.debugInfo.thiDuaVungChiTietRaw = chiTietData.slice(0, 10);
            appState.debugInfo.thiDuaVungTongRaw = tongData.slice(0, 10);
            ui.displayThiDuaVungDebugInfo();

            const supermarketKey = Object.keys(tongData[0]).find(k => k.trim().toLowerCase().includes('siêu thị'));
            const supermarketNames = [...new Set(tongData.map(row => row[supermarketKey]).filter(Boolean))].sort();
            
            const choicesInstance = appState.choices.thiDuaVung_sieuThi;
            if (choicesInstance) {
                choicesInstance.clearStore();
                choicesInstance.setChoices(
                    supermarketNames.map(name => ({ value: name, label: name })),
                    'value',
                    'label',
                    true
                );
            }
            
            ui.updateFileStatus('thidua-vung', file.name, `✓ Đã xử lý ${supermarketNames.length} siêu thị.`, 'success');
            ui.showNotification('Tải file Thi đua vùng thành công!', 'success');
        } catch (error) {
            console.error('Lỗi xử lý file Thi đua vùng:', error);
            ui.updateFileStatus('thidua-vung', file.name, `Lỗi: ${error.message}`, 'error');
            ui.showNotification(`Lỗi khi xử lý file Thi đua vùng: ${error.message}`, 'error');
        }
    },

    handleThiDuaVungFilterChange() {
        const choicesInstance = appState.choices.thiDuaVung_sieuThi;
        if (!choicesInstance) return;

        const selectedValue = choicesInstance.getValue(true);
        if (selectedValue) {
            const reportData = services.generateThiDuaVungReport(selectedValue);
            ui.renderThiDuaVungInfographic(reportData);
        } else {
            const container = document.getElementById('thidua-vung-infographic-container');
            if(container) container.innerHTML = `<div class="placeholder-message">Vui lòng chọn một siêu thị để xem báo cáo.</div>`;
        }
    }
};

app.init();