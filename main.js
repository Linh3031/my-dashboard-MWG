// Version 4.37 - Add EXTREMELY granular logging and try/catch before sync check
// MODULE 5: BỘ ĐIỀU KHIỂN TRUNG TÂM (MAIN)
// File này đóng vai trò điều phối, nhập khẩu các module khác và khởi chạy ứng dụng.

import { config } from './config.js';
import { appState } from './state.js';
import { services } from './services.js';
import { ui } from './ui.js';
import { firebase } from './firebase.js';
import { auth } from './auth.js';
import { luykeTab } from './tab-luyke.js';
import { sknvTab } from './tab-sknv.js';
import { uiRealtime } from './ui-realtime.js';
import { initializeEventListeners } from './event-listeners/ui-listeners.js';
import { sidebar } from './components/sidebar.js';
import { storage } from './modules/storage.js';
import { drawerInterface } from './components/drawer-interface.js';
import { drawerGoal } from './components/drawer-goal.js';
import { modalForceUpdate } from './components/modal-force-update.js';
import { modalAdmin } from './components/modal-admin.js';
import { modalLogin } from './components/modal-login.js';
import { modalHelp } from './components/modal-help.js';
import { modalChart } from './components/modal-chart.js';
import { modalComposer } from './components/modal-composer.js';
import { modalPreview } from './components/modal-preview.js';
import { modalSelection } from './components/modal-selection.js';
import { settingsService } from './modules/settings.service.js';
import { highlightService } from './modules/highlight.service.js';
import { uiComponents } from './ui-components.js';

const LOCAL_DATA_VERSIONS_KEY = '_localDataVersions';
const LOCAL_METADATA_PREFIX = '_localMetadata_';
const LOCAL_DSNV_FILENAME_KEY = '_localDsnvFilename'; // Key for DSNV filename

const ALL_DATA_MAPPING = {
    // Daily Files
    'ycx': { stateKey: 'ycxData', saveKey: 'saved_ycx', isPasted: false, uiId: 'ycx', firestoreKey: 'ycx' },
    'giocong': { stateKey: 'rawGioCongData', saveKey: 'saved_giocong', isPasted: false, uiId: 'giocong', firestoreKey: 'giocong' },
    'thuongnong': { stateKey: 'thuongNongData', saveKey: 'saved_thuongnong', isPasted: false, uiId: 'thuongnong', firestoreKey: 'thuongnong' },
    // Daily Pasted
    'pastedLuykeBI': { stateKey: null, saveKey: 'daily_paste_luyke', isPasted: true, uiId: 'status-luyke', firestoreKey: 'pastedLuykeBI' },
    'pastedThuongERP': { stateKey: 'thuongERPData', saveKey: 'daily_paste_thuongerp', isPasted: true, uiId: 'status-thuongerp', firestoreKey: 'pastedThuongERP', processFunc: services.processThuongERP },
    'pastedThiduaNVBI': { stateKey: null, saveKey: 'daily_paste_thiduanv', isPasted: true, uiId: 'status-thiduanv', firestoreKey: 'pastedThiduaNVBI' },
    // Previous Month Files
    'ycx-thangtruoc': { stateKey: 'ycxDataThangTruoc', saveKey: 'saved_ycx_thangtruoc', isPasted: false, uiId: 'ycx-thangtruoc', firestoreKey: 'ycx_thangtruoc' },
    'thuongnong-thangtruoc': { stateKey: 'thuongNongDataThangTruoc', saveKey: 'saved_thuongnong_thangtruoc', isPasted: false, uiId: 'thuongnong-thangtruoc', firestoreKey: 'thuongnong_thangtruoc' },
    // Previous Month Pasted
    'pastedThuongERPThangTruoc': { stateKey: 'thuongERPDataThangTruoc', saveKey: 'saved_thuongerp_thangtruoc', isPasted: true, uiId: 'status-thuongerp-thangtruoc', firestoreKey: 'pastedThuongERPThangTruoc', processFunc: services.processThuongERP }
};

const app = {
    currentVersion: '3.5',
    storage: storage,
    unsubscribeDataListener: null,
    _isInitialized: false,
    _localDataVersions: {},

    async init() {
        // ... (Giữ nguyên init)
        try {
            await firebase.initCore();
            console.log("Rendering static UI components...");
            sidebar.render('#sidebar-container');
            drawerInterface.render('#interface-drawer-container');
            drawerGoal.render('#goal-drawer-container');
            modalForceUpdate.render('#modal-force-update-container');
            modalAdmin.render('#modal-admin-container');
            await modalLogin.render('#modal-login-container');
            console.log("[main.js init] Finished awaiting modalLogin.render.");
            modalHelp.render('#modal-help-container');
            modalChart.render('#modal-chart-container');
            modalComposer.render('#modal-composer-container');
            modalPreview.render('#modal-preview-container');
            modalSelection.render('#modal-selection-container');
            feather.replace();
            console.log("Static UI components rendered.");

            console.log("Ensuring anonymous authentication...");
            const user = await auth.ensureAnonymousAuth();

            if (user && !this._isInitialized) {
                this._isInitialized = true;
                console.log("Anonymous auth confirmed. Setting up listeners and email identification...");
                firebase.setupListeners();
                console.log("[main.js init] Calling auth.initEmailIdentification...");
                auth.initEmailIdentification(this.continueInit.bind(this));
            } else if (user && this._isInitialized) {
                console.log("App already initialized, skipping init steps.");
            }

        } catch (error) {
            console.error("Lỗi nghiêm trọng trong quá trình khởi tạo ứng dụng:", error);
            ui.showNotification("Lỗi khởi tạo. Vui lòng thử tải lại trang.", "error");
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                 mainContent.innerHTML = '<div class="placeholder-message notification-error">Lỗi nghiêm trọng, không thể khởi động ứng dụng. Vui lòng kiểm tra kết nối mạng, cài đặt Firebase Rules và thử lại.</div>';
            }
        }
    },

    async continueInit() {
        // ... (Giữ nguyên continueInit)
        if (!appState.currentUser || !appState.currentUser.email) {
             console.error("continueInit called without user email in appState.");
             ui.showNotification("Lỗi: Không tìm thấy thông tin người dùng.", "error");
             return;
        }
        console.log(`Email identification complete: ${appState.currentUser.email}. Continuing app initialization...`);

        appState.competitionConfigs = [];
        appState.viewingDetailFor = null;

        try {
            const storedVersions = localStorage.getItem(LOCAL_DATA_VERSIONS_KEY);
            if (storedVersions) {
                this._localDataVersions = JSON.parse(storedVersions);
                console.log("%c[continueInit] Loaded _localDataVersions from localStorage:", "color: brown;", this._localDataVersions);
            } else {
                this._localDataVersions = {};
                console.log("%c[continueInit] No _localDataVersions found in localStorage, initialized as {}.", "color: brown;");
            }
        } catch (e) {
            console.error("%cError loading _localDataVersions from localStorage:", "color: red;", e);
            this._localDataVersions = {};
        }

        this.loadAndApplyBookmarkLink();
        this.loadAndDisplayQrCode();
        this.setupMarquee();
        await this.storage.openDB();
        console.log("Loading category data from Firestore...");
        try {
            const { categories, brands } = await firebase.loadCategoryDataFromFirestore();
            appState.categoryStructure = categories;
            appState.brandList = brands;
            console.log(`Successfully populated ${appState.categoryStructure.length} categories and ${appState.brandList.length} brands from Firestore.`);
        } catch (error) {
             console.error("Error loading category data after auth:", error);
             ui.showNotification("Không thể tải cấu trúc ngành hàng từ cloud.", "error");
        }

        console.log("Loading calculation declarations from Firestore...");
        try {
            const declarations = await firebase.loadDeclarationsFromFirestore();
            appState.declarations = declarations;
            const decYcxEl = document.getElementById('declaration-ycx');
            if (decYcxEl) decYcxEl.value = declarations.hinhThucXuat || config.DEFAULT_DATA.HINH_THUC_XUAT_TINH_DOANH_THU.join('\n');
            const decYcxGopEl = document.getElementById('declaration-ycx-gop');
            if (decYcxGopEl) decYcxGopEl.value = declarations.hinhThucXuatGop || config.DEFAULT_DATA.HINH_THUC_XUAT_TRA_GOP.join('\n');
            const decHeSoEl = document.getElementById('declaration-heso');
            if (decHeSoEl) decHeSoEl.value = declarations.heSoQuyDoi || Object.entries(config.DEFAULT_DATA.HE_SO_QUY_DOI).map(([k, v]) => `${k},${v}`).join('\n');
        } catch (error) {
             console.error("Error loading declarations after auth:", error);
             ui.showNotification("Không thể tải khai báo tính toán từ cloud.", "error");
        }

         initializeEventListeners(this);
        await this.loadDataFromStorage();

        const savedWarehouse = localStorage.getItem('selectedWarehouse');
        if (savedWarehouse) {
            appState.selectedWarehouse = savedWarehouse;
            if(this.unsubscribeDataListener) this.unsubscribeDataListener();
            console.log(`Re-attaching listener for saved warehouse: ${savedWarehouse}`);
            this.unsubscribeDataListener = firebase.listenForDataChanges(savedWarehouse, (cloudData) => {
                this.handleCloudDataUpdate(cloudData);
            });

            console.log(`%c[continueInit] Checking sync status for warehouse ${savedWarehouse} (AFTER loadDataFromStorage)...`, "color: teal; font-weight: bold;");

            const fileDataTypes = Object.keys(ALL_DATA_MAPPING).filter(k => !ALL_DATA_MAPPING[k].isPasted);

            fileDataTypes.forEach(fileTypeKey => {
                const mappingInfo = ALL_DATA_MAPPING[fileTypeKey];
                if (!mappingInfo) return;

                const { firestoreKey, uiId } = mappingInfo;
                const metadata = this._getSavedMetadata(savedWarehouse, firestoreKey);
                const localVersionInfo = this._localDataVersions?.[savedWarehouse]?.[firestoreKey] || { version: 0, timestamp: 0 };

                console.log(`%c[continueInit] --> Checking ${firestoreKey}:`, "color: teal;");
                console.log(`%c    Metadata (localStorage):`, "color: teal;", metadata ? `v${metadata.version}, ts ${metadata.timestamp}, by ${metadata.updatedBy}` : 'null');
                console.log(`%c    Local Version Info (_localDataVersions):`, "color: teal;", `v${localVersionInfo.version}, ts ${localVersionInfo.timestamp}`);

                const fileStatusSpan = document.getElementById(`file-status-${uiId}`);
                const currentStatusIsCache = fileStatusSpan?.textContent?.includes('cache');

                if (currentStatusIsCache) {
                     if (metadata && metadata.version > localVersionInfo.version) {
                        console.log(`%c[continueInit] Cache loaded for ${firestoreKey}, but cloud v${metadata.version} is newer. Showing download button.`, "color: orange;");
                        uiComponents.updateFileStatus(uiId, metadata.fileName || 'Cloud', '', 'default', true, metadata, firestoreKey, savedWarehouse);
                     } else {
                        console.log(`%c[continueInit] UI status for ${firestoreKey} was set by loadDataFromStorage (cache) and is up-to-date. Keeping it.`, "color: green;");
                     }
                } else if (metadata) {
                    if (metadata.version > localVersionInfo.version) {
                        uiComponents.updateFileStatus(uiId, metadata.fileName || 'Cloud', '', 'default', true, metadata, firestoreKey, savedWarehouse);
                        console.log(`%c[continueInit] UI status for ${firestoreKey} requires download (Cloud v${metadata.version} > Local v${localVersionInfo.version}).`, "color: green;");
                    } else {
                        uiComponents.updateFileStatus(uiId, metadata.fileName || 'Cloud', '', 'default', true, metadata, firestoreKey, savedWarehouse);
                        console.log(`%c[continueInit] UI status for ${firestoreKey} requires download (v${metadata.version}). Cache empty or not loaded.`, "color: orange;");
                    }
                } else {
                    uiComponents.updateFileStatus(uiId, '', `Đang chờ đồng bộ từ kho ${savedWarehouse}...`, 'default');
                    console.log(`%c[continueInit] No metadata for ${firestoreKey}, waiting for sync.`, "color: orange;");
                }
            });
            console.log(`%c[continueInit] Finished checking sync status.`, "color: teal; font-weight: bold;");

        } else {
             Object.keys(ALL_DATA_MAPPING).filter(k => !ALL_DATA_MAPPING[k].isPasted).forEach(fileTypeKey => {
                 uiComponents.updateFileStatus(ALL_DATA_MAPPING[fileTypeKey].uiId, '', 'Chọn kho để đồng bộ...', 'default');
             });
             const dsnvFilename = localStorage.getItem(LOCAL_DSNV_FILENAME_KEY);
             if (!dsnvFilename) {
                 uiComponents.updateFileStatus('danhsachnv', '', 'Chưa thêm file', 'default');
             }
        }

        if (appState.danhSachNhanVien.length > 0) {
            uiComponents.populateWarehouseSelector();
        } else {
             console.error("[main.js continueInit] CRITICAL: appState.danhSachNhanVien is empty! Warehouse selector cannot be populated.");
             const selector = document.getElementById('data-warehouse-selector');
             if (selector) {
                 selector.innerHTML = '<option value="">-- Vui lòng tải Danh sách Nhân viên --</option>';
                 selector.disabled = true;
             }
        }

        settingsService.loadInterfaceSettings();
        settingsService.applyContrastSetting();
        settingsService.loadHighlightSettings();
        ui.populateAllFilters();
        settingsService.loadAndApplyLuykeGoalSettings();
        settingsService.loadAndApplyRealtimeGoalSettings();
        this.loadPastedDataFromStorage();
        this.switchTab('data-section');
        this.checkForUpdates();
        setInterval(() => this.checkForUpdates(), 15 * 60 * 1000);
    },

    async handleCloudDataUpdate(cloudData) {
        // ... (Giữ nguyên)
        const receivedTime = new Date().toLocaleTimeString();
        console.log(`%c[handleCloudDataUpdate @ ${receivedTime}] Received data snapshot from Firestore listener:`, "color: blue; font-weight: bold;", JSON.stringify(cloudData).substring(0, 500) + "...");
        let showSyncNotification = false;

        const currentWarehouse = appState.selectedWarehouse;
        if (!currentWarehouse) {
            console.warn(`[handleCloudDataUpdate @ ${receivedTime}] Received update but no warehouse selected. Ignoring.`);
            return;
        }

        for (const [dataType, mappingInfo] of Object.entries(ALL_DATA_MAPPING)) {
            const cloudMetadata = cloudData[dataType];
            const { stateKey, saveKey, isPasted, uiId, processFunc } = mappingInfo;

            if (dataType === 'giocong' || dataType === 'thuongnong' || dataType.startsWith('pasted')) {
                console.log(`%c[handleCloudDataUpdate @ ${receivedTime}] --> Processing METADATA for WATCHED dataType: ${dataType}`, "color: fuchsia; font-weight: bold;", cloudMetadata);
            }

            if (cloudMetadata && typeof cloudMetadata === 'object' && cloudMetadata.version !== undefined && cloudMetadata.timestamp !== undefined) {

                const updatedBy = cloudMetadata.updatedBy;
                const cloudServerTimestampObj = cloudMetadata.updatedAt;
                 const updatedTime = cloudServerTimestampObj
                    ? ui.formatTimeAgo(cloudServerTimestampObj.toDate ? cloudServerTimestampObj.toDate() : new Date(cloudServerTimestampObj))
                    : 'vừa xong';


                const cloudVersion = cloudMetadata.version || 0;
                const cloudLocalTimestamp = cloudMetadata.timestamp || 0;
                const rowCount = cloudMetadata.rowCount || 0;
                const fileName = cloudMetadata.fileName || 'Cloud';

                const localVersionInfo = this._localDataVersions?.[currentWarehouse]?.[dataType] || { version: 0, timestamp: 0 };
                const lastLocalVersion = localVersionInfo.version;
                const lastLocalTimestamp = localVersionInfo.timestamp;

                let shouldUpdateLocalInfo = false;
                if (cloudVersion > lastLocalVersion) {
                    shouldUpdateLocalInfo = true;
                } else if (cloudVersion === lastLocalVersion && cloudLocalTimestamp > lastLocalTimestamp) {
                     shouldUpdateLocalInfo = true;
                }

                if (shouldUpdateLocalInfo) {
                    const metadataKey = `${LOCAL_METADATA_PREFIX}${currentWarehouse}_${dataType}`;
                    try {
                        localStorage.setItem(metadataKey, JSON.stringify(cloudMetadata));
                        console.log(`%c[handleCloudDataUpdate @ ${receivedTime}] Saved received metadata for ${dataType} @ ${currentWarehouse} to localStorage ('${metadataKey}').`, "color: green; font-weight: bold;");
                    } catch (e) {
                        console.error(`Error saving metadata for ${dataType} to localStorage:`, e);
                    }

                    if (appState.currentUser && updatedBy === appState.currentUser.email) {
                        if (isPasted) {
                            let processedCount = 0;
                            if (stateKey && processFunc && cloudMetadata.content) {
                                try {
                                    const processed = processFunc(cloudMetadata.content);
                                    processedCount = processed?.length || 0;
                                } catch (e) { console.error(`Error processing pasted content during status update for ${dataType}:`, e); }
                            }
                             uiComponents.updatePasteStatus(uiId, '', 'success', cloudMetadata, processedCount);
                        } else {
                             uiComponents.updateFileStatus(uiId, fileName, '', 'success', false, cloudMetadata);
                        }
                    } else {
                        showSyncNotification = true;
                        if (isPasted) {
                            console.log(`%c[handleCloudDataUpdate] Pasted data ${dataType} is new. Processing content...`, "color: darkcyan; font-weight: bold;");
                            const content = cloudMetadata.content || '';
                            let processedCount = 0;
                            try {
                                 localStorage.setItem(saveKey, content);

                                if (stateKey && processFunc) {
                                    const processedData = processFunc(content);
                                    appState[stateKey] = processedData;
                                    processedCount = processedData?.length || 0;
                                } else if (stateKey) {
                                    console.warn(`Missing processFunc for pasted data ${dataType}`);
                                } else if (uiId === 'status-luyke') {
                                    document.getElementById('paste-luyke').value = content;
                                } else if (uiId === 'status-thiduanv') {
                                     document.getElementById('paste-thiduanv').value = content;
                                }

                                if (!this._localDataVersions[currentWarehouse]) this._localDataVersions[currentWarehouse] = {};
                                this._localDataVersions[currentWarehouse][dataType] = { version: cloudVersion, timestamp: cloudLocalTimestamp };
                                localStorage.setItem(LOCAL_DATA_VERSIONS_KEY, JSON.stringify(this._localDataVersions));

                                uiComponents.updatePasteStatus(uiId, '', 'success', cloudMetadata, processedCount);
                                this.updateAndRenderCurrentTab();
                            } catch (e) {
                                console.error(`Error processing pasted data ${dataType} from cloud:`, e);
                                uiComponents.updatePasteStatus(uiId, `Lỗi xử lý v${cloudVersion} từ cloud.`, 'error');
                            }
                        } else {
                            uiComponents.updateFileStatus(uiId, fileName, '', 'default', true, cloudMetadata, dataType, currentWarehouse);
                        }
                    }
                } else {
                    const reasonText = '';
                    if (appState.currentUser && updatedBy === appState.currentUser.email) {
                         const statusText = `✓ Đã đồng bộ cloud ${updatedTime} ${reasonText}`.trim();
                         isPasted ? uiComponents.updatePasteStatus(uiId, statusText, 'success', cloudMetadata) : uiComponents.updateFileStatus(uiId, fileName, statusText, 'success', false, cloudMetadata);
                    } else {
                          const statusText = `ⓘ ${updatedBy} cập nhật ${updatedTime} ${reasonText}`.trim();
                          isPasted ? uiComponents.updatePasteStatus(uiId, statusText, 'default', cloudMetadata) : uiComponents.updateFileStatus(uiId, fileName, statusText, 'default', false, cloudMetadata);
                    }
                }
            } else {
                 if (dataType === 'giocong' || dataType === 'thuongnong' || dataType.startsWith('pasted')) {
                     console.warn(`%c[handleCloudDataUpdate @ ${receivedTime}] No valid METADATA structure found (version or timestamp missing) for WATCHED dataType ${dataType}. Received:`, "color: red; font-weight: bold;", cloudMetadata);
                 }
            }
        }
        if (showSyncNotification) {
            ui.showNotification('Có bản cập nhật dữ liệu mới từ cloud!', 'success');
        }
    },

    async handleDownloadAndProcessData(dataType, warehouse) {
        // ... (Giữ nguyên)
        console.log(`%c[handleDownloadAndProcessData] User requested download for ${dataType} @ ${warehouse}`, "color: darkcyan; font-weight: bold;");
        const metadataKey = `${LOCAL_METADATA_PREFIX}${warehouse}_${dataType}`;

        const mappingInfo = Object.values(ALL_DATA_MAPPING).find(m => m.firestoreKey === dataType);

        if (!mappingInfo || mappingInfo.isPasted) {
            console.error(`[handleDownloadAndProcessData] Invalid or non-file dataType: ${dataType}`);
            ui.showNotification(`Lỗi: Loại dữ liệu không hợp lệ (${dataType}).`, 'error');
            return;
        }
        const { stateKey, saveKey, uiId } = mappingInfo;

        let metadata;

        try {
            const storedMetadata = localStorage.getItem(metadataKey);
            if (!storedMetadata) {
                throw new Error(`Không tìm thấy thông tin đồng bộ (${metadataKey}) trong localStorage.`);
            }
            metadata = JSON.parse(storedMetadata);
            const downloadURL = metadata.downloadURL;
            const expectedVersion = metadata.version;
            const expectedTimestamp = metadata.timestamp;
            const expectedFileName = metadata.fileName || `${dataType}_v${expectedVersion}.xlsx`;

            if (!downloadURL) {
                 throw new Error("URL tải xuống không hợp lệ trong thông tin đồng bộ.");
            }

            uiComponents.updateFileStatus(uiId, expectedFileName, `Đang tải file...`, 'default', false);
            ui.showProgressBar(uiId);

            console.log(`[handleDownloadAndProcessData] Fetching file from: ${downloadURL}`);
            const response = await fetch(downloadURL);
            if (!response.ok) {
                throw new Error(`Tải file thất bại: ${response.status} ${response.statusText}`);
            }
            const fileBlob = await response.blob();
            console.log(`[handleDownloadAndProcessData] File downloaded successfully. Blob size: ${fileBlob.size}`);
            const downloadedFile = new File([fileBlob], expectedFileName, { type: fileBlob.type });

            uiComponents.updateFileStatus(uiId, expectedFileName, `Đang xử lý file...`, 'default');

            const workbook = await this.handleFileRead(downloadedFile);
            const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

            const normalizeType = dataType.replace('_thangtruoc', '');

            const { normalizedData, success, missingColumns } = services.normalizeData(rawData, normalizeType);
            console.log(`[handleDownloadAndProcessData] File processing result - Success: ${success}, Rows: ${normalizedData?.length}`);

            if (!success) {
                throw new Error(`File tải về lỗi: Thiếu cột ${missingColumns.join(', ')}.`);
            }

            appState[stateKey] = normalizedData;
            if (saveKey) {
                console.log(`[handleDownloadAndProcessData] Saving downloaded & processed data (${normalizedData.length} rows) to cache: ${saveKey}`);
                await this.storage.setItem(saveKey, normalizedData);
            }

            if (!this._localDataVersions[warehouse]) this._localDataVersions[warehouse] = {};
            this._localDataVersions[warehouse][dataType] = { version: expectedVersion, timestamp: expectedTimestamp };
            try {
                localStorage.setItem(LOCAL_DATA_VERSIONS_KEY, JSON.stringify(this._localDataVersions));
                console.log(`%c[handleDownloadAndProcessData] CRITICAL FIX: Updated local version tracker to (v${expectedVersion}, t${expectedTimestamp}) and saved to localStorage.`, "color: purple; font-weight: bold;");
            } catch (e) {
                 console.error("[handleDownloadAndProcessData] Error saving updated versions/timestamps to localStorage:", e);
            }

            uiComponents.updateFileStatus(uiId, expectedFileName, '', 'success', false, metadata);
            ui.showNotification(`Đã tải và xử lý thành công dữ liệu ${dataType} (v${expectedVersion})!`, 'success');

            this.updateAndRenderCurrentTab();

        } catch (error) {
            console.error(`%c[handleDownloadAndProcessData] Error processing ${dataType} @ ${warehouse}:`, "color: red;", error);
            ui.showNotification(`Lỗi khi tải/xử lý dữ liệu ${dataType}: ${error.message}`, 'error');
             if (metadata) {
                  const statusText = `Lỗi tải/xử lý. Thử lại?`;
                   uiComponents.updateFileStatus(uiId, metadata.fileName || 'Cloud', statusText, 'error', true, metadata, dataType, warehouse);
             } else {
                  const fallbackMetadata = this._getSavedMetadata(warehouse, dataType);
                  if(fallbackMetadata) {
                      const statusText = `Lỗi tải/xử lý. Thử lại?`;
                      uiComponents.updateFileStatus(uiId, fallbackMetadata.fileName || 'Cloud', statusText, 'error', true, fallbackMetadata, dataType, warehouse);
                  } else {
                      uiComponents.updateFileStatus(uiId, 'Cloud', 'Lỗi tải/xử lý. Không tìm thấy thông tin.', 'error', false);
                  }
             }
        } finally {
            ui.hideProgressBar(uiId);
        }
    },

    _getSavedMetadata(warehouse, dataType) {
        // ... (Giữ nguyên)
        const metadataKey = `${LOCAL_METADATA_PREFIX}${warehouse}_${dataType}`;
        try {
            const storedMetadata = localStorage.getItem(metadataKey);
            return storedMetadata ? JSON.parse(storedMetadata) : null;
        } catch (e) {
            console.error(`Error reading metadata ${metadataKey} from localStorage:`, e);
            return null;
        }
    },

    async setupMarquee() {
        // ... (Giữ nguyên)
        const marqueeContainer = document.getElementById('version-marquee-container');
        const marqueeText = marqueeContainer?.querySelector('.marquee-text');
        if (!marqueeContainer || !marqueeText) return;
        try {
            const versionRes = await fetch(`./version.json?v=${new Date().getTime()}`);
            const versionInfo = await versionRes.json();
            const currentVersion = versionInfo.version || this.currentVersion;
            marqueeText.textContent = `🔥 Chi tiết bản cập nhật - Phiên bản ${currentVersion}`;
            marqueeContainer.addEventListener('click', async () => {
                try {
                    const changelogRes = await fetch(`./changelog.json?v=${new Date().getTime()}`);
                    const changelogData = await changelogRes.json();
                    const modalTitle = document.getElementById('help-modal-title');
                    const modalContent = document.getElementById('help-modal-content');
                    if (modalTitle) modalTitle.textContent = "Lịch Sử Cập Nhật";
                    if (modalContent) modalContent.innerHTML = this._formatChangelogForModal(changelogData);
                    ui.toggleModal('help-modal', true);
                } catch (error) {
                    console.error("Lỗi khi tải hoặc hiển thị changelog:", error);
                    ui.showNotification("Không thể tải chi tiết cập nhật.", "error");
                }
            });
        } catch (error) {
            console.error("Lỗi khi thiết lập marquee:", error);
            marqueeText.textContent = "Không thể tải thông tin phiên bản.";
        }
    },

    _formatChangelogForModal(changelogData) {
        // ... (Giữ nguyên)
        if (!changelogData || changelogData.length === 0) return '<p>Không có lịch sử cập nhật.</p>';
        return changelogData.map(item => `
            <div class="mb-4 pb-4 border-b last:border-b-0">
                <h4 class="font-bold text-blue-600 mb-2">Phiên bản ${item.version} (${item.date})</h4>
                <ul class="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    ${item.notes.map(note => `<li>${note}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    },

    async checkForUpdates() {
        // ... (Giữ nguyên)
        try {
            const response = await fetch(`./version.json?v=${new Date().getTime()}`);
            if (!response.ok) return;
            const serverConfig = await response.json();
            if (serverConfig.version && serverConfig.version !== this.currentVersion) {
                 console.log(`Phiên bản mới ${serverConfig.version} đã sẵn sàng!`);
                const changelogRes = await fetch(`./changelog.json?v=${new Date().getTime()}`);
                const changelogData = await changelogRes.json();
                const newVersionDetails = changelogData.find(log => log.version === serverConfig.version);
                const titleEl = document.getElementById('force-update-title');
                const notesContainer = document.getElementById('update-notes-container');
                if (titleEl) titleEl.textContent = `📢 Đã có phiên bản mới ${serverConfig.version}!`;
                if (notesContainer && newVersionDetails && newVersionDetails.notes) {
                    notesContainer.innerHTML = `
                        <p class="text-sm font-semibold text-gray-700 mb-2">Nội dung cập nhật:</p>
                        <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
                             ${newVersionDetails.notes.map(note => `<li>${note}</li>`).join('')}
                        </ul>
                    `;
                } else if (notesContainer) {
                    notesContainer.innerHTML = '<p class="text-sm text-gray-500">Không thể tải chi tiết cập nhật.</p>';
                }
                ui.toggleModal('force-update-modal', true);
            }
        } catch (error) {
             console.error('Không thể kiểm tra phiên bản mới:', error);
        }
    },

    async loadDataFromStorage() {
        // ... (Giữ nguyên)
        let dsnvLoadSuccess = false;
        const loadSavedFile = async (saveKey, stateKey, fileType, uiId) => {
            console.log(`[main.js loadDataFromStorage] Attempting to load ${saveKey} from IndexedDB...`);
            let savedData = null;
            try {
                savedData = await this.storage.getItem(saveKey);
            } catch (indexedDbError) {
                 console.error(`[main.js loadDataFromStorage] CRITICAL Error reading ${saveKey} from IndexedDB:`, indexedDbError);
                 uiComponents.updateFileStatus(uiId, '', `Lỗi đọc cache IndexedDB!`, 'error');
                 if (saveKey === 'saved_danhsachnv') {
                     const selector = document.getElementById('data-warehouse-selector');
                     if (selector) {
                         selector.innerHTML = '<option value="">Lỗi tải DSNV từ cache!</option>';
                         selector.disabled = true;
                     }
                 }
                 return;
            }

            if (!savedData) {
                console.log(`[main.js loadDataFromStorage] ${saveKey} not found in IndexedDB.`);
                return;
            }

            console.log(`[main.js loadDataFromStorage] Found ${saveKey} in IndexedDB.`);
            try {
                if (saveKey === 'saved_category_structure') {
                     if (appState.categoryStructure.length > 0 || appState.brandList.length > 0) {
                         uiComponents.updateFileStatus('category-structure', 'Tải từ Cloud', `✓ Đã tải ${appState.categoryStructure.length} nhóm & ${appState.brandList.length} hãng.`, 'success', false);
                    }
                    return;
                }
                const normalizedData = savedData;
                if (normalizedData && Array.isArray(normalizedData) && normalizedData.length > 0) {
                    console.log(`[main.js loadDataFromStorage] Successfully validated data for ${saveKey}, ${normalizedData.length} rows.`);
                    appState[stateKey] = normalizedData;

                    let fileNameToShow = `Cache (${normalizedData.length} dòng)`;
                    let statusText = `✓ Đã tải từ cache`;
                    let statusType = 'success';
                    let metadata = null;

                    const mappingEntry = Object.values(ALL_DATA_MAPPING).find(m => m.saveKey === saveKey);
                    const firestoreKey = mappingEntry ? mappingEntry.firestoreKey : null;

                    if (saveKey === 'saved_danhsachnv') {
                         dsnvLoadSuccess = true;
                         fileNameToShow = localStorage.getItem(LOCAL_DSNV_FILENAME_KEY) || fileNameToShow;
                    } else if (firestoreKey && !mappingEntry.isPasted) {
                         const currentWarehouse = localStorage.getItem('selectedWarehouse');
                         if (currentWarehouse) {
                             metadata = this._getSavedMetadata(currentWarehouse, firestoreKey);
                             if (metadata) {
                                  fileNameToShow = metadata.fileName || fileNameToShow;
                                 console.log(`[main.js loadDataFromStorage] Found metadata for ${firestoreKey}, will use it in status update.`);
                             } else {
                                 console.log(`[main.js loadDataFromStorage] No metadata found in localStorage for ${firestoreKey}, using basic cache status.`);
                             }
                         } else {
                              console.log(`[main.js loadDataFromStorage] No warehouse selected, using basic cache status for ${firestoreKey}.`);
                         }
                    }

                    uiComponents.updateFileStatus(uiId, fileNameToShow, statusText, statusType, false, metadata);

                    if (stateKey === 'danhSachNhanVien') {
                        console.log("[main.js loadDataFromStorage] Updating employee maps after loading DSNV from cache.");
                        services.updateEmployeeMaps();
                    }
                } else {
                     console.error(`[main.js loadDataFromStorage] Invalid or empty data array found in cache for ${saveKey}.`);
                     uiComponents.updateFileStatus(uiId, '', `Lỗi dữ liệu cache.`, 'error');
                     try {
                         await this.storage.setItem(saveKey, null);
                         console.log(`[main.js loadDataFromStorage] Cleared potentially corrupted cache for ${saveKey}.`);
                     } catch(clearError) {
                         console.error(`[main.js loadDataFromStorage] Failed to clear corrupted cache for ${saveKey}:`, clearError);
                     }
                }
             } catch (e) {
                console.error(`[main.js loadDataFromStorage] Lỗi xử lý ${saveKey} từ IndexedDB:`, e);
                uiComponents.updateFileStatus(uiId, '', `Lỗi xử lý cache.`, 'error');
            }
        };

        await loadSavedFile('saved_danhsachnv', 'danhSachNhanVien', 'danhsachnv', 'danhsachnv');
        if (!dsnvLoadSuccess) {
              console.error("[main.js loadDataFromStorage] CRITICAL: Failed to load 'saved_danhsachnv' from IndexedDB. App state might be incorrect.");
            const selector = document.getElementById('data-warehouse-selector');
             if (selector) {
                 selector.innerHTML = '<option value="">Lỗi tải DSNV từ cache!</option>';
                 selector.disabled = true;
             }
        }

        await loadSavedFile('saved_ycx_thangtruoc', 'ycxDataThangTruoc', 'ycx', 'ycx-thangtruoc');
        await loadSavedFile('saved_thuongnong_thangtruoc', 'thuongNongDataThangTruoc', 'thuongnong', 'thuongnong-thangtruoc');
        await loadSavedFile('saved_ycx', 'ycxData', 'ycx', 'ycx');
        await loadSavedFile('saved_giocong', 'rawGioCongData', 'giocong', 'giocong');
        await loadSavedFile('saved_thuongnong', 'thuongNongData', 'thuongnong', 'thuongnong');

        try {
             const savedLuykeGoals = localStorage.getItem('luykeGoalSettings');
            if(savedLuykeGoals) appState.luykeGoalSettings = JSON.parse(savedLuykeGoals);
            const savedRealtimeGoals = localStorage.getItem('realtimeGoalSettings');
            if (savedRealtimeGoals) appState.realtimeGoalSettings = JSON.parse(savedRealtimeGoals);
            const savedTemplates = localStorage.getItem('composerTemplates');
            if (savedTemplates) {
                let parsedTemplates = JSON.parse(savedTemplates);
                for (const key in parsedTemplates) {
                    if (typeof parsedTemplates[key] === 'string') {
                        const oldString = parsedTemplates[key];
                        parsedTemplates[key] = {};
                        if (key === 'luyke') parsedTemplates[key]['subtab-luyke-sieu-thi'] = oldString;
                        else if (key === 'sknv') parsedTemplates[key]['subtab-sknv'] = oldString;
                        else if (key === 'realtime') parsedTemplates[key]['subtab-realtime-sieu-thi'] = oldString;
                    }
                  }
                appState.composerTemplates = parsedTemplates;
            } else {
                appState.composerTemplates = { luyke: {}, sknv: {}, realtime: {} };
            }
            const savedCompetition = localStorage.getItem('competitionConfigs');
            if (savedCompetition) appState.competitionConfigs = JSON.parse(savedCompetition);
        } catch (e) { console.error("Lỗi đọc cài đặt từ localStorage:", e); }
    },

    loadPastedDataFromStorage() {
        // ... (Giữ nguyên)
        const loadPasted = (saveKey, stateKey, uiId, processFunc) => {
            const pastedText = localStorage.getItem(saveKey);
            if (pastedText) {
                 const el = document.getElementById(uiId.replace('status-', 'paste-'));
                if (el) el.value = pastedText;

                let processedCount = 0;
                if (stateKey && processFunc) {
                    const processedData = processFunc(pastedText);
                    appState[stateKey] = processedData;
                    processedCount = processedData?.length || 0;
                }

                const kho = localStorage.getItem('selectedWarehouse');
                const mappingInfo = Object.values(ALL_DATA_MAPPING).find(m => m.saveKey === saveKey);
                let metadata = null;
                if (kho && mappingInfo) {
                    metadata = this._getSavedMetadata(kho, mappingInfo.firestoreKey);
                    if (metadata) {
                         uiComponents.updatePasteStatus(uiId, '', 'success', metadata, processedCount);
                    } else {
                         uiComponents.updatePasteStatus(uiId, '✓ Đã tải từ cache (chưa đồng bộ)', 'success');
                    }
                } else if (pastedText) {
                    uiComponents.updatePasteStatus(uiId, '✓ Đã tải từ cache (chưa chọn kho)', 'success');
                }
            }
        };

        loadPasted('saved_thuongerp_thangtruoc', 'thuongERPDataThangTruoc', 'status-thuongerp-thangtruoc', services.processThuongERP);
        loadPasted('daily_paste_luyke', null, 'status-luyke', null);
        loadPasted('daily_paste_thiduanv', null, 'status-thiduanv', null);
        loadPasted('daily_paste_thuongerp', 'thuongERPData', 'status-thuongerp', services.processThuongERP);
    },

    // *** MODIFIED FUNCTION (v4.36) ***
    async handleFileInputChange(e) {
        const fileInput = e.target;
        const file = fileInput.files[0];
        const fileType = fileInput.id.replace('file-', '');

        const mappingInfo = Object.values(ALL_DATA_MAPPING).find(m => m.uiId === fileType);

        if (!file) return;

        if (!mappingInfo) {
            if (fileType === 'danhsachnv') {
                  return this.handleDsnvUpload(e, file);
            }
            console.error(`[handleFileInputChange] No mapping info found for fileType: ${fileType}`);
            return;
        }

        const { stateKey, saveKey, firestoreKey } = mappingInfo;
        const dataName = fileInput.dataset.name || fileType;

        uiComponents.updateFileStatus(fileType, file.name, 'Đang đọc & chuẩn hóa...', 'default');
        ui.showProgressBar(fileType);

        try {
            const workbook = await this.handleFileRead(file);
            const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const normalizeType = fileType.replace('-thangtruoc', '');
            const { normalizedData, success, missingColumns } = services.normalizeData(rawData, normalizeType);
            ui.displayDebugInfo(fileType);

            if (!success) {
                 const errorMessage = `Lỗi file "${dataName}": Thiếu cột: ${missingColumns.join(', ')}.`;
                 uiComponents.updateFileStatus(fileType, file.name, `Lỗi: Thiếu cột dữ liệu.`, 'error');
                 ui.showNotification(errorMessage, 'error');
                 if (document.getElementById('debug-tool-container')?.classList.contains('hidden')) {
                     document.getElementById('toggle-debug-btn')?.click();
                 }
                 ui.hideProgressBar(fileType);
                 return;
            }

            appState[stateKey] = normalizedData;
            ui.showNotification(`Tải thành công file "${dataName}"!`, 'success');

            if (saveKey) {
                console.log(`[handleFileInputChange] Saving normalized data (${normalizedData.length} rows) to cache: ${saveKey}`);
                await this.storage.setItem(saveKey, normalizedData);
                console.log(`%c[DEBUG POST-CACHE] Successfully saved ${fileType} to cache. Proceeding...`, "color: brown;");
            }

            // --- Section before sync check ---
            let warehouseToSync = null;
            let currentFirestoreKey = null;
            try {
                console.log("[DEBUG STEP 1] Getting warehouseToSync..."); // Log added
                warehouseToSync = appState.selectedWarehouse;
                console.log(`[DEBUG STEP 2] warehouseToSync = ${warehouseToSync}`); // Log added
                console.log("[DEBUG STEP 3] Getting firestoreKey..."); // Log added
                currentFirestoreKey = firestoreKey; // Use the firestoreKey from mappingInfo
                console.log(`[DEBUG STEP 4] firestoreKey = ${currentFirestoreKey}`); // Log added

                console.log(`%c[DEBUG PRE-SYNC CHECK] File Type: ${fileType}, Warehouse: ${warehouseToSync}, Firestore Key: ${currentFirestoreKey}`, "color: purple; font-weight: bold;");

                if (warehouseToSync && currentFirestoreKey) {
                     console.log(`%c[DEBUG SYNC BLOCK START] Entering cloud sync block for ${fileType} (Firestore Key: ${currentFirestoreKey})`, "color: magenta;");

                    uiComponents.updateFileStatus(fileType, file.name, `Đang chuẩn bị đồng bộ cloud...`, 'default');

                    let localDataVersions = this._localDataVersions;
                    const currentVersion = localDataVersions?.[warehouseToSync]?.[currentFirestoreKey]?.version || 0;
                    const newVersion = currentVersion + 1;
                    const uploadTimestamp = Date.now();

                    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
                    const storagePath = `uploads/${warehouseToSync}/${currentFirestoreKey}_v${newVersion}${fileExtension}`;

                    console.log(`%c[handleFileInputChange] Cloud Upload for ${currentFirestoreKey}:`, "color: magenta; font-weight: bold;");

                    const onProgress = (progress) => {
                         uiComponents.updateFileStatus(fileType, file.name, `Đang tải lên cloud... ${Math.round(progress)}%`, 'default');
                    };

                    try {
                        const downloadURL = await firebase.uploadFileToStorage(file, storagePath, onProgress);
                        uiComponents.updateFileStatus(fileType, file.name, `Upload xong, đang lưu thông tin...`, 'default');

                        const metadata = {
                            storagePath: storagePath,
                            downloadURL: downloadURL,
                            version: newVersion,
                            timestamp: uploadTimestamp,
                            rowCount: normalizedData.length,
                            fileName: file.name
                        };

                        await firebase.saveMetadataToFirestore(warehouseToSync, currentFirestoreKey, metadata);

                        const metadataKey = `${LOCAL_METADATA_PREFIX}${warehouseToSync}_${currentFirestoreKey}`;
                        const metadataToSaveLocally = { ...metadata, updatedAt: new Date() };
                        try {
                            localStorage.setItem(metadataKey, JSON.stringify(metadataToSaveLocally));
                            console.log(`[handleFileInputChange] Saved metadata for ${currentFirestoreKey} to localStorage ('${metadataKey}') immediately.`);
                        } catch(lsError) {
                              console.error(`[handleFileInputChange] Error saving metadata for ${currentFirestoreKey} to localStorage:`, lsError);
                        }

                        if (!localDataVersions[warehouseToSync]) localDataVersions[warehouseToSync] = {};
                        localDataVersions[warehouseToSync][currentFirestoreKey] = { version: newVersion, timestamp: uploadTimestamp };
                        localStorage.setItem(LOCAL_DATA_VERSIONS_KEY, JSON.stringify(localDataVersions));
                        this._localDataVersions = localDataVersions;

                        console.log(`%c[handleFileInputChange] Successfully uploaded ${currentFirestoreKey} (v${newVersion}).`, "color: magenta;");

                         uiComponents.updateFileStatus(fileType, file.name, '', 'success', false, metadataToSaveLocally);

                     } catch (syncError) {
                        console.error(`%c[handleFileInputChange] Cloud sync failed for ${currentFirestoreKey}:`, "color: red;", syncError);
                        uiComponents.updateFileStatus(fileType, file.name, `Lỗi đồng bộ cloud: ${syncError.message}`, 'error');
                    }
                     console.log(`%c[DEBUG SYNC BLOCK END] Finished cloud sync block for ${fileType}`, "color: magenta;");
                } else {
                     console.log(`%c[DEBUG SYNC SKIP] Skipping cloud sync for ${fileType}. Warehouse selected: ${!!warehouseToSync}, Firestore key exists: ${!!currentFirestoreKey}`, "color: orange;");
                     if (currentFirestoreKey) {
                        uiComponents.updateFileStatus(fileType, file.name, `✓ Đã tải ${normalizedData.length} dòng (Chưa đồng bộ).`, 'success', false, null);
                     }
                }

            } catch(preSyncError) {
                 // ** ADDED v4.36: Catch errors before sync check **
                 console.error(`%c[DEBUG PRE-SYNC ERROR] Error before sync check for ${fileType}:`, "color: red; font-weight: bold;", preSyncError);
                 uiComponents.updateFileStatus(fileType, file.name, `Lỗi chuẩn bị đồng bộ: ${preSyncError.message}`, 'error');
                 // ** END ADDED **
            }

            console.log(`%c[DEBUG PRE-RENDER] About to call updateAndRenderCurrentTab for ${fileType}`, "color: blue;");
            this.updateAndRenderCurrentTab();

        } catch (error) {
            console.error(`Lỗi xử lý file ${dataName}:`, error);
            uiComponents.updateFileStatus(fileType, file.name, `Lỗi đọc file: ${error.message}`, 'error');
            ui.showNotification(`Lỗi khi xử lý file "${dataName}".`, 'error');
        } finally {
            ui.hideProgressBar(fileType);
            fileInput.value = '';
            console.log(`%c[DEBUG FUNCTION END] handleFileInputChange finished for ${fileType}`, "color: gray;");
        }
    },

    async handleDsnvUpload(e, file) {
        // ... (Giữ nguyên handleDsnvUpload)
        const fileType = 'danhsachnv';
        const dataName = 'Danh sách nhân viên';
        const stateKey = 'danhSachNhanVien';
        const saveKey = 'saved_danhsachnv';

        uiComponents.updateFileStatus(fileType, file.name, 'Đang đọc & chuẩn hóa...', 'default');
        ui.showProgressBar(fileType);

        try {
            const workbook = await this.handleFileRead(file);
            const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const { normalizedData, success, missingColumns } = services.normalizeData(rawData, fileType);
            ui.displayDebugInfo(fileType);

            if (!success) {
                const errorMessage = `Lỗi file "${dataName}": Thiếu cột: ${missingColumns.join(', ')}.`;
                uiComponents.updateFileStatus(fileType, file.name, `Lỗi: Thiếu cột dữ liệu.`, 'error');
                ui.showNotification(errorMessage, 'error');
                if (document.getElementById('debug-tool-container')?.classList.contains('hidden')) {
                     document.getElementById('toggle-debug-btn')?.click();
                }
                return;
            }

            appState[stateKey] = normalizedData;
            services.updateEmployeeMaps();
            ui.populateAllFilters();
            uiComponents.populateWarehouseSelector();

            try {
                localStorage.setItem(LOCAL_DSNV_FILENAME_KEY, file.name);
                console.log(`[handleDsnvUpload] Saved DSNV filename '${file.name}' to localStorage.`);
            } catch (lsError) {
                console.error("[handleDsnvUpload] Error saving DSNV filename to localStorage:", lsError);
            }

            ui.showNotification(`Tải thành công file "${dataName}"!`, 'success');

            if (saveKey) {
                 console.log(`[handleDsnvUpload] Saving normalized data (${normalizedData.length} rows) to cache: ${saveKey}`);
                 await this.storage.setItem(saveKey, normalizedData);
            }

            uiComponents.updateFileStatus(fileType, file.name, `✓ Đã tải ${normalizedData.length} dòng.`, 'success', false, null);
            this.updateAndRenderCurrentTab();

        } catch (error) {
             console.error(`Lỗi xử lý file ${dataName}:`, error);
             uiComponents.updateFileStatus(fileType, file.name, `Lỗi đọc file: ${error.message}`, 'error');
             ui.showNotification(`Lỗi khi xử lý file "${dataName}".`, 'error');
        } finally {
            ui.hideProgressBar(fileType);
            e.target.value = '';
        }
    },


    handleFileRead(file) {
        // ... (Giữ nguyên)
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

    updateAndRenderCurrentTab() {
        // ... (Giữ nguyên)
        uiComponents.renderCompetitionConfigUI();
        const activeTab = document.querySelector('.page-section:not(.hidden)');
        if (!activeTab) {
            return;
        }
        switch (activeTab.id) {
            case 'health-section': luykeTab.render(); break;
            case 'health-employee-section': sknvTab.render(); break;
            case 'realtime-section': uiRealtime.render(); break;
        }
        feather.replace();
    },

    switchTab(targetId) {
        // ... (Giữ nguyên)
        document.querySelectorAll('.page-section').forEach(section => section.classList.toggle('hidden', section.id !== targetId));
        document.querySelectorAll('.nav-link').forEach(link => {
            const isActive = link.getAttribute('href') === `#${targetId}`;
             link.classList.toggle('bg-blue-100', isActive);
            link.classList.toggle('text-blue-700', isActive);
        });
        if (targetId === 'home-section') ui.renderHomePage();
        else if (targetId === 'health-section') luykeTab.render();
        else if (targetId === 'health-employee-section') sknvTab.render();
        else if (targetId === 'realtime-section') uiRealtime.render();
        else if (targetId === 'declaration-section' && appState.isAdmin) ui.renderAdminPage();
        feather.replace();
    },

    async loadAndApplyBookmarkLink() {
        // ... (Giữ nguyên)
         try {
            const bookmarkUrl = await firebase.getBookmarkDownloadURL();
            const linkElement = document.getElementById('download-bookmark-link');
            if (linkElement) linkElement.href = bookmarkUrl;
        } catch (error) {
            console.error("Không thể tải link bookmark:", error);
            const linkElement = document.getElementById('download-bookmark-link');
            if (linkElement) linkElement.style.display = 'none';
        }
    },

    async _handlePastedDataSync(pastedText, kho, dataType, uiId, localStorageKey, stateKey = null, processFunc = null) {
        // ... (Giữ nguyên)
        localStorage.setItem(localStorageKey, pastedText);

        let processedData = null;
        let processedCount = 0;
        if (stateKey && processFunc) {
            processedData = processFunc(pastedText);
            appState[stateKey] = processedData;
            processedCount = processedData?.length || 0;
        } else if (uiId === 'status-thiduanv') {
             sknvTab.render();
        }

        if (!kho) {
            uiComponents.updatePasteStatus(uiId, '✓ Đã nhận (Chọn kho để đồng bộ)', 'success');
            if (dataType !== 'pastedLuykeBI') this.updateAndRenderCurrentTab();
            return;
        }

        uiComponents.updatePasteStatus(uiId, 'Đang đồng bộ cloud...', 'default');

        try {
            const localDataVersions = this._localDataVersions;
            const currentVersion = localDataVersions?.[kho]?.[dataType]?.version || 0;
            const newVersion = currentVersion + 1;
            const uploadTimestamp = Date.now();
            const versionInfo = { version: newVersion, timestamp: uploadTimestamp };

            const metadata = {
                content: pastedText,
                version: versionInfo.version,
                timestamp: versionInfo.timestamp,
                updatedBy: appState.currentUser.email
            };

            await firebase.savePastedDataToFirestore(kho, dataType, metadata.content, versionInfo);

            if (!localDataVersions[kho]) localDataVersions[kho] = {};
            localDataVersions[kho][dataType] = versionInfo;
            localStorage.setItem(LOCAL_DATA_VERSIONS_KEY, JSON.stringify(localDataVersions));

            const metadataKey = `${LOCAL_METADATA_PREFIX}${kho}_${dataType}`;
            const metadataToSaveLocally = { ...metadata, updatedAt: new Date() };
            localStorage.setItem(metadataKey, JSON.stringify(metadataToSaveLocally));

             uiComponents.updatePasteStatus(uiId, '', 'success', metadataToSaveLocally, processedCount);

        } catch (error) {
            console.error(`[${dataType} Paste] Cloud sync failed:`, error);
            uiComponents.updatePasteStatus(uiId, `Lỗi đồng bộ cloud: ${error.message}`, 'error');
        }

        if (dataType !== 'pastedLuykeBI') {
             this.updateAndRenderCurrentTab();
        }
    },


    async handleLuykePaste() {
        // ... (Giữ nguyên)
        const pastedText = document.getElementById('paste-luyke')?.value || '';
        const kho = appState.selectedWarehouse;
        const mappingInfo = ALL_DATA_MAPPING['pastedLuykeBI'];

        localStorage.setItem(mappingInfo.saveKey, pastedText);
        uiComponents.updatePasteStatus(mappingInfo.uiId, '✓ Đã nhận dữ liệu.', 'success');

        if (kho) {
             await this._handlePastedDataSync(
                 pastedText,
                 kho,
                 mappingInfo.firestoreKey,
                 mappingInfo.uiId,
                 mappingInfo.saveKey
             );
        }
         this.updateAndRenderCurrentTab();
    },

    async handleThiduaNVPaste() {
        // ... (Giữ nguyên)
        const pastedText = document.getElementById('paste-thiduanv')?.value || '';
        const kho = appState.selectedWarehouse;
        const mappingInfo = ALL_DATA_MAPPING['pastedThiduaNVBI'];
        await this._handlePastedDataSync(
            pastedText,
            kho,
            mappingInfo.firestoreKey,
            mappingInfo.uiId,
            mappingInfo.saveKey
        );
    },

    async handleErpPaste() {
        // ... (Giữ nguyên)
        const pastedText = document.getElementById('paste-thuongerp')?.value || '';
        const kho = appState.selectedWarehouse;
        const mappingInfo = ALL_DATA_MAPPING['pastedThuongERP'];
        await this._handlePastedDataSync(
            pastedText,
            kho,
            mappingInfo.firestoreKey,
            mappingInfo.uiId,
            mappingInfo.saveKey,
            mappingInfo.stateKey,
            mappingInfo.processFunc
        );
    },

    async handleErpThangTruocPaste(e) {
        // ... (Giữ nguyên)
         const pastedText = e.target.value;
         const kho = appState.selectedWarehouse;
         const mappingInfo = ALL_DATA_MAPPING['pastedThuongERPThangTruoc'];
         await this._handlePastedDataSync(
             pastedText,
            kho,
            mappingInfo.firestoreKey,
            mappingInfo.uiId,
            mappingInfo.saveKey,
            mappingInfo.stateKey,
            mappingInfo.processFunc
        );
    },

    async handleRealtimeFileInput(e) {
        // ... (Giữ nguyên)
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
                uiRealtime.populateRealtimeBrandCategoryFilter();
                ui.showNotification(`Tải thành công ${normalizedData.length} dòng realtime!`, 'success');
                this.updateAndRenderCurrentTab();
            } else {
                 ui.showNotification(`File realtime lỗi: Thiếu cột ${missingColumns.join(', ')}.`, 'error');
                 const debugContainer = document.getElementById('debug-tool-container');
                 if (debugContainer?.classList.contains('hidden')) {
                     document.getElementById('toggle-debug-btn')?.click();
                 }
            }
        } catch (err) { ui.showNotification(`Có lỗi khi đọc file: ${err.message}`, 'error'); console.error(err); }
    },

    async handleCategoryFile(e) {
        // ... (Giữ nguyên)
        const fileInput = e.target;
        const file = fileInput.files[0];
        if (!file) return;
        uiComponents.updateFileStatus('category-structure', file.name, 'Đang xử lý...', 'default');
        ui.showProgressBar('category-structure');
        try {
            const workbook = await this.handleFileRead(file);
            const categorySheet = workbook.Sheets[workbook.SheetNames[0]];
            const categoryRawData = XLSX.utils.sheet_to_json(categorySheet);
            const categoryResult = services.normalizeCategoryStructureData(categoryRawData);
            let brandResult = { success: true, normalizedData: [] };
            const brandSheetName = workbook.SheetNames.find(name => name.toLowerCase().trim() === 'hãng');
            if (brandSheetName) {
                const brandSheet = workbook.Sheets[brandSheetName];
                const brandRawData = XLSX.utils.sheet_to_json(brandSheet);
                brandResult = services.normalizeBrandData(brandRawData);
            }
            if(categoryResult.success) {
                appState.categoryStructure = categoryResult.normalizedData;
                appState.brandList = brandResult.normalizedData;
                await firebase.saveCategoryDataToFirestore({ categories: categoryResult.normalizedData, brands: brandResult.normalizedData });
                uiComponents.updateFileStatus('category-structure', file.name, `✓ Đã xử lý và đồng bộ ${categoryResult.normalizedData.length} nhóm & ${brandResult.normalizedData.length} hãng.`, 'success');
            } else {
                ui.showNotification(`Lỗi xử lý file khai báo: ${categoryResult.error}`, 'error');
            }
        } catch (error) {
            uiComponents.updateFileStatus('category-structure', file.name, `Lỗi: ${error.message}`, 'error');
        } finally {
            ui.hideProgressBar('category-structure');
            fileInput.value = '';
        }
    },

    async handleThiDuaVungFileInput(e) {
        // ... (Giữ nguyên)
        const fileInput = e.target;
        const file = fileInput.files[0];
        if (!file) return;
        uiComponents.updateFileStatus('thidua-vung', file.name, 'Đang xử lý...', 'default');
        try {
            const workbook = await this.handleFileRead(file);
            const { chiTietData, tongData } = services.processThiDuaVungFile(workbook);
            if (!tongData || tongData.length === 0) throw new Error('Không tìm thấy dữ liệu hợp lệ trong sheet "TONG".');
            appState.thiDuaVungChiTiet = chiTietData;
            appState.thiDuaVungTong = tongData;
            const supermarketKey = Object.keys(tongData[0]).find(k => k.trim().toLowerCase().includes('siêu thị'));
            const supermarketNames = [...new Set(tongData.map(row => row[supermarketKey]).filter(Boolean))].sort();
            const choicesInstance = appState.choices.thiDuaVung_sieuThi;
            if (choicesInstance) {
                choicesInstance.clearStore();
                choicesInstance.setChoices(supermarketNames.map(name => ({ value: name, label: name })), 'value', 'label', true);
            }
            uiComponents.updateFileStatus('thidua-vung', file.name, `✓ Đã xử lý ${supermarketNames.length} siêu thị.`, 'success');
        } catch (error) {
            uiComponents.updateFileStatus('thidua-vung', file.name, `Lỗi: ${error.message}`, 'error');
        }
    },

    handleThiDuaVungFilterChange() {
        // ... (Giữ nguyên)
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
    },

    handleDthangRealtimeViewChange(e) {
        // ... (Giữ nguyên)
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#dthang-realtime-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            uiRealtime.render();
        }
    },

    handleLuykeThiDuaViewChange(e) {
        // ... (Giữ nguyên)
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#luyke-thidua-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            luykeTab.render();
        }
    },

    handleThiDuaViewChange(e) {
        // ... (Giữ nguyên)
         const button = e.target.closest('.view-switcher__btn');
        if (button) {
             document.querySelectorAll('#thidua-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const view = button.dataset.view;
            const thiduaEmployeeSelectorEl = document.getElementById('thidua-employee-selector-container');
            if(thiduaEmployeeSelectorEl) thiduaEmployeeSelectorEl.classList.toggle('hidden', view !== 'employee');
            ui.displayCompetitionReport(view);
        }
    },

    async handleCompetitionDebugFile(e) {
        // ... (Giữ nguyên)
        const file = e.target.files[0];
        if (!file) return;
        ui.showNotification('Đang phân tích file gỡ lỗi...', 'success');
        try {
            const workbook = await this.handleFileRead(file);
            const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const debugResults = services.debugCompetitionFiltering(rawData);
            ui.renderCompetitionDebugReport(debugResults);
        } catch (err) {
            ui.showNotification(`Lỗi khi đọc file gỡ lỗi: ${err.message}`, 'error');
        }
    },

    _handleCompetitionFormShow(show = true, isEdit = false) {
        // ... (Giữ nguyên)
        const form = document.getElementById('competition-form');
        const addBtn = document.getElementById('add-competition-btn');
        if (!form || !addBtn) return;
        if (show) {
            uiComponents.populateCompetitionFilters();
            uiComponents.populateCompetitionBrandFilter();
        }
        form.classList.toggle('hidden', !show);
        addBtn.classList.toggle('hidden', show);
        if (show && !isEdit) {
            form.reset();
            document.getElementById('competition-id').value = '';
            appState.choices['competition_group']?.removeActiveItems();
            appState.choices['competition_brand']?.removeActiveItems();
            const priceSegmentEl = document.getElementById('price-segment');
            if(priceSegmentEl) priceSegmentEl.classList.add('hidden');
        }
    },

    _handleCompetitionFormEdit(index) {
        // ... (Giữ nguyên)
        const config = appState.competitionConfigs[index];
        if (!config) return;
        this._handleCompetitionFormShow(true, true);
        document.getElementById('competition-id').value = index;
        document.getElementById('competition-name').value = config.name;
        const brandChoices = appState.choices['competition_brand'];
        if(brandChoices) {
            brandChoices.removeActiveItems();
            brandChoices.setChoiceByValue(config.brands || []);
        }
        const compTypeEl = document.getElementById('competition-type');
        if(compTypeEl) compTypeEl.value = config.type;
        const compExcludeEl = document.getElementById('competition-exclude-apple');
        if(compExcludeEl) compExcludeEl.checked = config.excludeApple;
        const priceSegment = document.getElementById('price-segment');
        if(priceSegment) priceSegment.classList.toggle('hidden', config.type !== 'soluong');
        const minPriceEl = document.getElementById('competition-min-price');
        if(minPriceEl) minPriceEl.value = config.minPrice ? config.minPrice / 1000000 : '';
        const maxPriceEl = document.getElementById('competition-max-price');
        if(maxPriceEl) maxPriceEl.value = config.maxPrice ? config.maxPrice / 1000000 : '';
        const groupChoices = appState.choices['competition_group'];
        if (groupChoices) {
            groupChoices.removeActiveItems();
            groupChoices.setChoiceByValue(config.groups);
        }
    },

    _handleCompetitionDelete(index) {
        // ... (Giữ nguyên)
        appState.competitionConfigs.splice(index, 1);
        this._saveCompetitionConfigs();
        this.updateAndRenderCurrentTab();
        ui.showNotification('Đã xóa chương trình thi đua.', 'success');
    },

    _handleCompetitionFormSubmit(e) {
        // ... (Giữ nguyên)
        e.preventDefault();
        const id = document.getElementById('competition-id').value;
        const name = document.getElementById('competition-name').value.trim();
        if (!name) { ui.showNotification('Tên chương trình không được để trống.', 'error'); return; }
        const groupChoices = appState.choices['competition_group'];
        const groups = groupChoices ? groupChoices.getValue(true) : [];
        const brandChoices = appState.choices['competition_brand'];
        const brands = brandChoices ? brandChoices.getValue(true) : [];
        if (brands.length === 0) { ui.showNotification('Lỗi: Vui lòng chọn ít nhất một hãng sản xuất.', 'error'); return; }
        const compTypeEl = document.getElementById('competition-type');
        const minPriceEl = document.getElementById('competition-min-price');
        const maxPriceEl = document.getElementById('competition-max-price');
        const excludeAppleEl = document.getElementById('competition-exclude-apple');
        const newConfig = {
            id: id ? appState.competitionConfigs[parseInt(id, 10)].id : `comp_${new Date().getTime()}`,
            name: name,
            brands: brands,
            groups: groups,
            type: compTypeEl ? compTypeEl.value : 'doanhthu',
             minPrice: (parseFloat(minPriceEl?.value) || 0) * 1000000,
            maxPrice: (parseFloat(maxPriceEl?.value) || 0) * 1000000,
            excludeApple: excludeAppleEl ? excludeAppleEl.checked : false,
        };
        if (id !== '') { appState.competitionConfigs[parseInt(id, 10)] = newConfig; }
        else { appState.competitionConfigs.push(newConfig); }
        this._saveCompetitionConfigs();
        this._handleCompetitionFormShow(false);
        this.updateAndRenderCurrentTab();
        ui.showNotification('Đã lưu chương trình thi đua thành công!', 'success');
    },


     _saveCompetitionConfigs() {
        // ... (Giữ nguyên)
        localStorage.setItem('competitionConfigs', JSON.stringify(appState.competitionConfigs));
    },

    async handleTemplateDownload() {
        // ... (Giữ nguyên)
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

    handleAdminLogin() {
        // ... (Giữ nguyên)
        const passInputEl = document.getElementById('admin-password-input');
        const errorMsgEl = document.getElementById('admin-error-msg');
        if (passInputEl?.value === config.ADMIN_PASSWORD) {
            appState.isAdmin = true;
            ui.renderFeedbackSection();
            ui.renderAdminHelpEditors();
            this.switchTab('declaration-section');
            ui.toggleModal('admin-modal', false);
            passInputEl.value = '';
            if(errorMsgEl) errorMsgEl.classList.add('hidden');
        } else {
            if(errorMsgEl) errorMsgEl.classList.remove('hidden');
        }
    },

    handleContrastChange(e) {
        // ... (Giữ nguyên)
          const level = e.target.value;
         localStorage.setItem('contrastLevel', level);
         document.documentElement.dataset.contrast = level;
    },

    handleHighlightColorChange(prefix) {
        // ... (Giữ nguyên)
        const activeType = appState.highlightSettings[prefix]?.type;
        if (activeType) {
             const choicesInstance = appState.choices[`${prefix}_highlight_${activeType}`];
             if(choicesInstance) {
                const values = choicesInstance.getValue(true);
                const colorEl = document.getElementById(`${prefix}-highlight-color`);
                const color = colorEl ? colorEl.value : '#ffff00';
                appState.highlightSettings[prefix] = { type: activeType, values, color };
                localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
                highlightService.applyHighlights(prefix);
             }
        }
    },

    handleClearHighlight(prefix) {
        // ... (Giữ nguyên)
        appState.highlightSettings[prefix] = {};
        localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
        ['nhanhang', 'nhomhang', 'employee'].forEach(type => {
            appState.choices[`${prefix}_highlight_${type}`]?.removeActiveItemsByValue(appState.choices[`${prefix}_highlight_${type}`]?.getValue(true) || []);
        });
        highlightService.applyHighlights(prefix);
    },

    async saveDeclarations() {
        // ... (Giữ nguyên)
        const ycxEl = document.getElementById('declaration-ycx');
        const ycxGopEl = document.getElementById('declaration-ycx-gop');
        const heSoEl = document.getElementById('declaration-heso');
        const declarationsToSave = {
            ycx: ycxEl ? ycxEl.value : '',
            ycxGop: ycxGopEl ? ycxGopEl.value : '',
            heSo: heSoEl ? heSoEl.value : ''
        };
        await firebase.saveDeclarationsToFirestore(declarationsToSave);
        appState.declarations.hinhThucXuat = declarationsToSave.ycx;
        appState.declarations.hinhThucXuatGop = declarationsToSave.ycxGop;
        appState.declarations.heSoQuyDoi = declarationsToSave.heSo;
        this.updateAndRenderCurrentTab();
    },

    saveHelpContent() {
        // ... (Giữ nguyên)
        const dataEl = document.getElementById('edit-help-data');
        const luykeEl = document.getElementById('edit-help-luyke');
        const sknvEl = document.getElementById('edit-help-sknv');
        const realtimeEl = document.getElementById('edit-help-realtime');
        const contents = {
             data: dataEl ? dataEl.value : '',
             luyke: luykeEl ? luykeEl.value : '',
             sknv: sknvEl ? sknvEl.value : '',
             realtime: realtimeEl ? realtimeEl.value : ''
        };
        firebase.saveHelpContent(contents);
    },

    async handleSubmitFeedback() {
        // ... (Giữ nguyên)
        const textarea = document.getElementById('feedback-textarea');
        if(textarea){
            const success = await firebase.submitFeedback(textarea.value.trim());
            if (success) textarea.value = '';
        }
    },

    async handleFeedbackReplyActions(e, feedbackItem) {
        // ... (Giữ nguyên)
        const docId = feedbackItem.dataset.id;
        const replyForm = feedbackItem.querySelector('.reply-form-container');
        if (!replyForm) return;
        if (e.target.classList.contains('reply-btn')) { replyForm.classList.remove('hidden'); }
         if (e.target.classList.contains('cancel-reply-btn')) { replyForm.classList.add('hidden'); }
        if (e.target.classList.contains('submit-reply-btn')) {
             const textarea = replyForm.querySelector('textarea');
             if(textarea){
                const success = await firebase.submitReply(docId, textarea.value.trim());
                if (success) { textarea.value = ''; replyForm.classList.add('hidden'); }
             }
        }
    },

    _getFilteredReportData(sectionId) {
        // ... (Giữ nguyên)
        const masterData = appState.masterReportData[sectionId] || [];
        if (masterData.length === 0) return [];
        const warehouseEl = document.getElementById(`${sectionId}-filter-warehouse`);
        const deptEl = document.getElementById(`${sectionId}-filter-department`);
        const selectedWarehouse = warehouseEl ? warehouseEl.value : '';
        const selectedDept = deptEl ? deptEl.value : '';
        const selectedNames = appState.choices[`${sectionId}_employee`] ? appState.choices[`${sectionId}_employee`].getValue(true) : [];
        let filteredReport = masterData;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedNames && selectedNames.length > 0) filteredReport = filteredReport.filter(nv => selectedNames.includes(String(nv.maNV)));
        return filteredReport;
    },

    async prepareAndShowComposer(sectionId) {
        // ... (Giữ nguyên)
        const modal = document.getElementById('composer-modal');
        if (!modal) return;
        modal.dataset.sectionId = sectionId;
        const deptFilter = document.getElementById('composer-dept-filter');
        if (deptFilter) {
            const uniqueDepartments = [...new Set(appState.danhSachNhanVien.map(nv => nv.boPhan).filter(Boolean))].sort();
            deptFilter.innerHTML = '<option value="ALL">Toàn siêu thị</option>' + uniqueDepartments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
        }
        const navIdMap = { luyke: 'luyke-subtabs-nav', sknv: 'employee-subtabs-nav', realtime: 'realtime-subtabs-nav' };
        const mainViewNav = document.getElementById(navIdMap[sectionId]);
        const contextTabsContainer = document.getElementById('composer-context-tabs');
        const contextContentContainer = document.getElementById('composer-context-content');
        if(contextTabsContainer) contextTabsContainer.innerHTML = '';
        if(contextContentContainer) contextContentContainer.innerHTML = '';
        if (mainViewNav && contextTabsContainer && contextContentContainer) {
              const subTabButtons = mainViewNav.querySelectorAll('.sub-tab-btn');
            subTabButtons.forEach(btn => {
                const subTabId = btn.dataset.target;
                const isActive = btn.classList.contains('active');
                const newTabBtn = document.createElement('button');
                newTabBtn.className = `composer__tab-btn ${isActive ? 'active' : ''}`;
                newTabBtn.dataset.target = `context-pane-${subTabId}`;
                newTabBtn.textContent = btn.textContent.trim();
                 newTabBtn.addEventListener('click', () => {
                    contextTabsContainer.querySelectorAll('.composer__tab-btn').forEach(t => t.classList.remove('active'));
                    contextContentContainer.querySelectorAll('.composer__context-pane').forEach(c => c.classList.add('hidden'));
                    newTabBtn.classList.add('active');
                    const targetPane = document.getElementById(`context-pane-${subTabId}`);
                    if(targetPane) targetPane.classList.remove('hidden');
                });
                 contextTabsContainer.appendChild(newTabBtn);
                 const newContentPane = document.createElement('div');
                 newContentPane.id = `context-pane-${subTabId}`;
                 newContentPane.className = `composer__context-pane ${!isActive ? 'hidden' : ''}`;
                 const textarea = document.createElement('textarea');
                 textarea.className = 'composer__textarea';
                 textarea.rows = 15;
                 textarea.placeholder = `Soạn thảo nhận xét cho tab ${btn.textContent.trim()}...`;
                 if (!appState.composerTemplates[sectionId]) appState.composerTemplates[sectionId] = {};
                 textarea.value = appState.composerTemplates[sectionId]?.[subTabId] || '';
                 newContentPane.appendChild(textarea);
                 contextContentContainer.appendChild(newContentPane);
            });
            contextTabsContainer.classList.toggle('hidden', contextTabsContainer.children.length === 0);
        }
        const filteredReportData = this._getFilteredReportData(sectionId);
        const supermarketReport = services.aggregateReport(filteredReportData);
        ui.populateComposerDetailTags(supermarketReport);
        ui.showComposerModal(sectionId);
    },

    handleComposerActions(e, modal) {
        // ... (Giữ nguyên)
        const sectionId = modal.dataset.sectionId;
        const activeContextPane = modal.querySelector('.composer__context-pane:not(.hidden)');
        const activeTextarea = activeContextPane ? activeContextPane.querySelector('textarea') : null;
        if (e.target.matches('.composer__tab-btn:not([data-context-tab])')) {
            const nav = e.target.closest('.composer__nav');
            const content = nav?.nextElementSibling;
            if (nav && content) {
                 nav.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
                 content.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
                 e.target.classList.add('active');
                 const targetId = e.target.dataset.tab;
                 const targetContent = content.querySelector(`#${targetId}`);
                 if (targetContent) targetContent.classList.add('active');
            }
            return;
        }
        if (e.target.matches('.composer__icon-btn, .composer__tag-btn')) {
             if (!activeTextarea) { ui.showNotification("Vui lòng chọn một tab nội dung để chèn thẻ.", "error"); return; }
             let tagToInsert = e.target.dataset.tag;
            if (e.target.dataset.tagTemplate) {
                const deptFilterEl = document.getElementById('composer-dept-filter');
                const dept = deptFilterEl ? deptFilterEl.value : 'ALL';
                tagToInsert = e.target.dataset.tagTemplate.replace('{dept}', dept);
            }
            ui.insertComposerTag(activeTextarea, tagToInsert || e.target.textContent);
            return;
        }
         if (e.target.id === 'save-composer-template-btn') {
            if (!activeTextarea) return;
            const activeContextTab = modal.querySelector('#composer-context-tabs .composer__tab-btn.active');
            const subTabId = activeContextTab?.dataset.target.replace('context-pane-', '');
            if (subTabId) {
                 if (!appState.composerTemplates[sectionId]) appState.composerTemplates[sectionId] ={};
                appState.composerTemplates[sectionId][subTabId] = activeTextarea.value;
                localStorage.setItem('composerTemplates', JSON.stringify(appState.composerTemplates));
                ui.showNotification(`Đã lưu mẫu cho tab con!`, 'success');
            } else { ui.showNotification(`Không tìm thấy tab con để lưu.`, 'error'); }
        }
        if (e.target.id === 'copy-composed-notification-btn') {
             if (!activeTextarea) { ui.showNotification("Lỗi: Không tìm thấy ô nội dung đang hoạt động.", "error"); return; }
             const template = activeTextarea.value;
             const filteredReportData = this._getFilteredReportData(sectionId);
             const supermarketReport = services.aggregateReport(filteredReportData);
             const warehouseEl = document.getElementById(`${sectionId}-filter-warehouse`);
             const selectedWarehouse = warehouseEl ? warehouseEl.value : null;
             const goals = sectionId === 'realtime' ? settingsService.getRealtimeGoalSettings(selectedWarehouse).goals : settingsService.getLuykeGoalSettings(selectedWarehouse).goals;
             const pasteLuykeEl = document.getElementById('paste-luyke');
             const competitionDataForComposer = services.parseCompetitionDataFromLuyKe(pasteLuykeEl?.value || '');
             const processedText = services.processComposerTemplate(template, supermarketReport, goals, filteredReportData, competitionDataForComposer, sectionId);
             ui.showPreviewAndCopy(processedText);
        }
    },

    async loadAndDisplayQrCode() {
        // ... (Giữ nguyên)
         try {
            const qrUrl = await firebase.getQrCodeDownloadURL();
            const imgEl = document.getElementById('header-qr-image');
            if (imgEl) imgEl.src = qrUrl;
        }
        catch (error) {
             console.error("Không thể tải mã QR:", error);
            const container = document.querySelector('.header-qr-container');
            if (container) container.style.display = 'none';
        }
    }
};

// Khởi chạy ứng dụng khi DOM đã sẵn sàng
app.init();