// Version 1.3 - Refactor: Di dời 2 hàm (TemplateDownload, CompetitionDebug) từ main.js
// Version 1.2 - Fix: Xóa dấu phẩy (trailing comma) ở cuối object
// Version 1.1 - Fix: Thêm dấu phẩy bị thiếu sau hàm cuối cùng
// Version 1.0 - Refactor: Tách logic xử lý data từ main.js và ui-listeners.js
import { appState } from '../state.js';
import { ui } from '../ui.js';
import { services } from '../services.js';
import { firebase } from '../firebase.js';
import { settingsService } from '../modules/settings.service.js';
import { uiRealtime } from '../ui-realtime.js';

// --- CONSTANTS ---
const LOCAL_DATA_VERSIONS_KEY = '_localDataVersions';
const LOCAL_METADATA_PREFIX = '_localMetadata_';
const LOCAL_DSNV_FILENAME_KEY = '_localDsnvFilename';
const RAW_PASTE_THIDUANV_KEY = 'raw_paste_thiduanv';

export const dataService = {
    appController: null, // Sẽ được set bởi main.js

    /**
     * Khởi tạo service, nhận controller chính để truy cập các thành phần khác
     * @param {object} controller - Đối tượng 'app' từ main.js
     */
    init(controller) {
        this.appController = controller;
    },

    // --- HÀM HELPER (TỪ MAIN.JS) ---
    /**
     * Đọc file Excel/CSV bằng FileReader và XLSX.
     * (Đã di chuyển từ main.js)
     */
    async _handleFileRead(file) {
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

    /**
     * Lấy metadata đã lưu từ localStorage.
     * (Đã di chuyển từ main.js)
     */
    _getSavedMetadata(warehouse, dataType) {
        const metadataKey = `${LOCAL_METADATA_PREFIX}${warehouse}_${dataType}`;
        try {
            const storedMetadata = localStorage.getItem(metadataKey);
            return storedMetadata ? JSON.parse(storedMetadata) : null;
        } catch (e) {
            console.error(`Error reading metadata ${metadataKey} from localStorage:`, e);
            return null;
        }
    },

    // --- HÀM TẢI FILE (TỪ UI-LISTENERS.JS) ---
    /**
     * Xử lý logic khi người dùng chọn file (trừ DSNV và các file đặc biệt).
     * Bao gồm: đọc, chuẩn hóa, lưu cache, và đồng bộ cloud.
     * (Đã di chuyển từ ui-listeners.js)
     */
    async handleFileUpload(e) {
        const fileInput = e.target;
        const file = fileInput.files[0];
        if (!file) {
            const fileType = fileInput.id.replace('file-', '');
            const mappingInfo = this.appController?.ALL_DATA_MAPPING
                ? Object.values(this.appController.ALL_DATA_MAPPING).find(m => m.uiId === fileType)
                : null;
            if (mappingInfo && mappingInfo.uiId) {
                ui.updateFileStatus(mappingInfo.uiId, '', 'Chưa thêm file', 'default');
            }
            return;
        }

        const fileType = fileInput.id.replace('file-', '');
        const mappingInfo = this.appController?.ALL_DATA_MAPPING
            ? Object.values(this.appController.ALL_DATA_MAPPING).find(m => m.uiId === fileType)
            : null;

        if (!mappingInfo) {
            if (fileType === 'danhsachnv') {
                return this.handleDsnvUpload(e, file);
            }
            console.error(`[handleFileUpload] No mapping info found for fileType: ${fileType}`);
            ui.updateFileStatus(fileType, file.name, `Lỗi: Không tìm thấy cấu hình cho loại file '${fileType}'.`, 'error');
            return;
        }

        const { stateKey, saveKey, firestoreKey } = mappingInfo;
        const dataName = fileInput.dataset.name || fileType;

        ui.updateFileStatus(fileType, file.name, 'Đang đọc & chuẩn hóa...', 'default');
        ui.showProgressBar(fileType);

        try {
            const workbook = await this._handleFileRead(file);
            const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const normalizeType = fileType.replace('-thangtruoc', '');
            const { normalizedData, success, missingColumns } = services.normalizeData(rawData, normalizeType);
            ui.displayDebugInfo(fileType);

            if (!success) {
                const errorMessage = `Lỗi file "${dataName}": Thiếu cột: ${missingColumns.join(', ')}.`;
                ui.updateFileStatus(fileType, file.name, `Lỗi: Thiếu cột dữ liệu.`, 'error');
                ui.showNotification(errorMessage, 'error');
                if (document.getElementById('debug-tool-container')?.classList.contains('hidden')) {
                     document.getElementById('toggle-debug-btn')?.click();
                }
                 fileInput.value = '';
                return;
            }

            if (appState.currentUser?.email) {
                 firebase.incrementCounter('actionsTaken', appState.currentUser.email);
                 console.log(`Incremented actionsTaken for ${appState.currentUser.email}`);
            } else {
                 firebase.incrementCounter('actionsTaken'); // Fallback if email somehow isn't available
                 console.warn("User email not found in appState, incrementing global actionsTaken.");
            }

            appState[stateKey] = normalizedData;
            ui.showNotification(`Tải thành công file "${dataName}"!`, 'success');

            if (saveKey) {
                console.log(`[handleFileUpload] Saving normalized data (${normalizedData.length} rows) to cache: ${saveKey}`);
                await this.appController.storage.setItem(saveKey, normalizedData);
                console.log(`%c[DEBUG POST-CACHE] Successfully saved ${fileType} to cache. Proceeding...`, "color: brown;");
            }

            const warehouseToSync = appState.selectedWarehouse;
            const currentFirestoreKey = firestoreKey;

            console.log(`%c[DEBUG PRE-SYNC CHECK] File Type: ${fileType}, Warehouse: ${warehouseToSync}, Firestore Key: ${currentFirestoreKey}`, "color: purple; font-weight: bold;");

            if (warehouseToSync && currentFirestoreKey) {
                console.log(`%c[DEBUG SYNC BLOCK START] Entering cloud sync block for ${fileType} (Firestore Key: ${currentFirestoreKey})`, "color: magenta;");

                ui.updateFileStatus(fileType, file.name, `Đang chuẩn bị đồng bộ cloud...`, 'default');

                let localDataVersions = this.appController._localDataVersions;
                const currentVersion = localDataVersions?.[warehouseToSync]?.[currentFirestoreKey]?.version || 0;
                const newVersion = currentVersion + 1;
                const uploadTimestamp = Date.now();

                const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
                const storagePath = `uploads/${warehouseToSync}/${currentFirestoreKey}_v${newVersion}${fileExtension}`;

                console.log(`%c[handleFileUpload] Cloud Upload for ${currentFirestoreKey}:`, "color: magenta; font-weight: bold;");

                const onProgress = (progress) => {
                    ui.updateFileStatus(fileType, file.name, `Đang tải lên cloud... ${Math.round(progress)}%`, 'default');
                };

                try {
                    const downloadURL = await firebase.uploadFileToStorage(file, storagePath, onProgress);
                    ui.updateFileStatus(fileType, file.name, `Upload xong, đang lưu thông tin...`, 'default');

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
                        console.log(`[handleFileUpload] Saved metadata for ${currentFirestoreKey} to localStorage ('${metadataKey}') immediately.`);
                    } catch (lsError) {
                        console.error(`[handleFileUpload] Error saving metadata for ${currentFirestoreKey} to localStorage:`, lsError);
                    }

                    if (!localDataVersions[warehouseToSync]) localDataVersions[warehouseToSync] = {};
                    localDataVersions[warehouseToSync][currentFirestoreKey] = { version: newVersion, timestamp: uploadTimestamp };
                    localStorage.setItem(LOCAL_DATA_VERSIONS_KEY, JSON.stringify(localDataVersions));
                    this.appController._localDataVersions = localDataVersions;

                    console.log(`%c[handleFileUpload] Successfully uploaded ${currentFirestoreKey} (v${newVersion}).`, "color: magenta;");

                    ui.updateFileStatus(fileType, file.name, '', 'success', false, metadataToSaveLocally);

                } catch (syncError) {
                    console.error(`%c[handleFileUpload] Cloud sync failed for ${currentFirestoreKey}:`, "color: red;", syncError);
                    ui.updateFileStatus(fileType, file.name, `Lỗi đồng bộ cloud: ${syncError.message}`, 'error');
                }
                console.log(`%c[DEBUG SYNC BLOCK END] Finished cloud sync block for ${fileType}`, "color: magenta;");
            } else {
                 console.log(`%c[DEBUG SYNC SKIP] Skipping cloud sync for ${fileType}. Warehouse selected: ${!!warehouseToSync}, Firestore key exists: ${!!currentFirestoreKey}`, "color: orange;");
                ui.updateFileStatus(fileType, file.name, `✓ Đã tải ${normalizedData.length} dòng (Chưa đồng bộ).`, 'success', false, null);
            }

            console.log(`%c[DEBUG PRE-RENDER] About to call updateAndRenderCurrentTab for ${fileType}`, "color: blue;");
            this.appController.updateAndRenderCurrentTab();

        } catch (error) {
            console.error(`Lỗi xử lý file ${dataName}:`, error);
            ui.updateFileStatus(fileType, file.name, `Lỗi đọc file: ${error.message}`, 'error');
            ui.showNotification(`Lỗi khi xử lý file "${dataName}".`, 'error');
        } finally {
            ui.hideProgressBar(fileType);
            fileInput.value = '';
            console.log(`%c[DEBUG FUNCTION END] handleFileUpload finished for ${fileType}`, "color: gray;");
        }
    },

    // --- CÁC HÀM TỪ MAIN.JS ---

    /**
     * Xử lý tải lên file Danh sách nhân viên.
     * (Đã di chuyển từ main.js)
     */
    async handleDsnvUpload(e, file) {
        const fileType = 'danhsachnv';
        const dataName = 'Danh sách nhân viên';
        const stateKey = 'danhSachNhanVien';
        const saveKey = 'saved_danhsachnv';

        ui.updateFileStatus(fileType, file.name, 'Đang đọc & chuẩn hóa...', 'default');
        ui.showProgressBar(fileType);

        try {
            const workbook = await this._handleFileRead(file);
            const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const { normalizedData, success, missingColumns } = services.normalizeData(rawData, fileType);
            ui.displayDebugInfo(fileType);

            if (!success) {
                const errorMessage = `Lỗi file "${dataName}": Thiếu cột: ${missingColumns.join(', ')}.`;
                ui.updateFileStatus(fileType, file.name, `Lỗi: Thiếu cột dữ liệu.`, 'error');
                ui.showNotification(errorMessage, 'error');
                if (document.getElementById('debug-tool-container')?.classList.contains('hidden')) {
                    document.getElementById('toggle-debug-btn')?.click();
                }
                return;
            }

            appState[stateKey] = normalizedData;
            services.updateEmployeeMaps();
            ui.populateAllFilters();
            ui.populateWarehouseSelector();

            try {
                localStorage.setItem(LOCAL_DSNV_FILENAME_KEY, file.name);
                console.log(`[handleDsnvUpload] Saved DSNV filename '${file.name}' to localStorage.`);
            } catch (lsError) {
                console.error("[handleDsnvUpload] Error saving DSNV filename to localStorage:", lsError);
            }

            ui.showNotification(`Tải thành công file "${dataName}"!`, 'success');

            if (saveKey) {
                console.log(`[handleDsnvUpload] Saving normalized data (${normalizedData.length} rows) to cache: ${saveKey}`);
                await this.appController.storage.setItem(saveKey, normalizedData);
            }

            ui.updateFileStatus(fileType, file.name, `✓ Đã tải ${normalizedData.length} dòng.`, 'success', false, null);
            this.appController.updateAndRenderCurrentTab();

        } catch (error) {
            console.error(`Lỗi xử lý file ${dataName}:`, error);
            ui.updateFileStatus(fileType, file.name, `Lỗi đọc file: ${error.message}`, 'error');
            ui.showNotification(`Lỗi khi xử lý file "${dataName}".`, 'error');
        } finally {
            ui.hideProgressBar(fileType);
            if(e.target) e.target.value = ''; // Thêm kiểm tra e.target
        }
    },

    /**
     * Xử lý dữ liệu mới nhận từ listener Firestore.
     * (Đã di chuyển từ main.js)
     */
    async handleCloudDataUpdate(cloudData) {
        const receivedTime = new Date().toLocaleTimeString();
        console.log(`%c[handleCloudDataUpdate @ ${receivedTime}] Received data snapshot from Firestore listener:`, "color: blue; font-weight: bold;", JSON.stringify(cloudData).substring(0, 500) + "...");
        let showSyncNotification = false;

        const currentWarehouse = appState.selectedWarehouse;
        if (!currentWarehouse) {
            console.warn(`[handleCloudDataUpdate @ ${receivedTime}] Received update but no warehouse selected. Ignoring.`);
            return;
        }

        for (const [dataType, mappingInfo] of Object.entries(this.appController.ALL_DATA_MAPPING)) {
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
                const fileName = cloudMetadata.fileName || 'Cloud';

                const localVersionInfo = this.appController._localDataVersions?.[currentWarehouse]?.[dataType] || { version: 0, timestamp: 0 };
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
                            if (stateKey && processFunc && cloudMetadata.content && dataType !== 'pastedThiduaNVBI') {
                                try {
                                    const processed = processFunc(cloudMetadata.content);
                                    processedCount = processed?.length || 0;
                                } catch (e) { console.error(`Error processing pasted content during status update for ${dataType}:`, e); }
                            } else if (dataType === 'pastedThiduaNVBI') {
                                const processedData = JSON.parse(localStorage.getItem(saveKey) || '[]');
                                processedCount = processedData.length;
                            }
                            ui.updatePasteStatus(uiId, '', 'success', cloudMetadata, processedCount);
                        } else {
                            ui.updateFileStatus(uiId, fileName, '', 'success', false, cloudMetadata);
                        }
                    } else {
                        showSyncNotification = true;
                        if (isPasted) {
                            console.log(`%c[handleCloudDataUpdate] Pasted data ${dataType} is new. Processing content...`, "color: darkcyan; font-weight: bold;");
                            const content = cloudMetadata.content || '';
                            let processedCount = 0;
                            try {
                                if (dataType === 'pastedThiduaNVBI') {
                                    const parsedData = services.parsePastedThiDuaTableData(content);
                                    if (!parsedData.success) throw new Error(parsedData.error);
                                    
                                    services.updateCompetitionNameMappings(parsedData.mainHeaders);
                                    
                                    const processedData = services.processThiDuaNhanVienData(parsedData, appState.competitionData);
                                    
                                    appState[stateKey] = processedData;
                                    localStorage.setItem(saveKey, JSON.stringify(processedData));
                                    processedCount = processedData.length;

                                    localStorage.setItem(RAW_PASTE_THIDUANV_KEY, content);
                                    const el = document.getElementById('paste-thiduanv');
                                    if (el) el.value = content;

                                } else {
                                    localStorage.setItem(saveKey, content);
                                    if (stateKey && processFunc) {
                                        const processedData = processFunc(content);
                                        appState[stateKey] = processedData;
                                        processedCount = processedData?.length || 0;
                                    } else if (stateKey) {
                                        console.warn(`Missing processFunc for pasted data ${dataType}`);
                                    } else if (uiId === 'status-luyke') {
                                        document.getElementById('paste-luyke').value = content;
                                    }
                                }

                                if (!this.appController._localDataVersions[currentWarehouse]) this.appController._localDataVersions[currentWarehouse] = {};
                                this.appController._localDataVersions[currentWarehouse][dataType] = { version: cloudVersion, timestamp: cloudLocalTimestamp };
                                localStorage.setItem(LOCAL_DATA_VERSIONS_KEY, JSON.stringify(this.appController._localDataVersions));

                                ui.updatePasteStatus(uiId, '', 'success', cloudMetadata, processedCount);
                                this.appController.updateAndRenderCurrentTab();
                                if (dataType === 'pastedThiduaNVBI' && appState.isAdmin && document.getElementById('declaration-section')?.classList.contains('hidden') === false) {
                                    ui.renderAdminPage();
                                }
                            } catch (e) {
                                console.error(`Error processing pasted data ${dataType} from cloud:`, e);
                                ui.updatePasteStatus(uiId, `Lỗi xử lý v${cloudVersion} từ cloud.`, 'error');
                            }
                        } else {
                            ui.updateFileStatus(uiId, fileName, '', 'default', true, cloudMetadata, dataType, currentWarehouse);
                        }
                    }
                } else {
                    const reasonText = '';
                    if (appState.currentUser && updatedBy === appState.currentUser.email) {
                        const statusText = `✓ Đã đồng bộ cloud ${updatedTime} ${reasonText}`.trim();
                        isPasted ? ui.updatePasteStatus(uiId, statusText, 'success', cloudMetadata) : ui.updateFileStatus(uiId, fileName, statusText, 'success', false, cloudMetadata);
                    } else {
                        const statusText = `ⓘ ${updatedBy} cập nhật ${updatedTime} ${reasonText}`.trim();
                        isPasted ? ui.updatePasteStatus(uiId, statusText, 'default', cloudMetadata) : ui.updateFileStatus(uiId, fileName, statusText, 'default', false, cloudMetadata);
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

    /**
     * Tải file từ cloud (khi user click) và xử lý.
     * (Đã di chuyển từ main.js)
     */
    async handleDownloadAndProcessData(dataType, warehouse) {
        console.log(`%c[handleDownloadAndProcessData] User requested download for ${dataType} @ ${warehouse}`, "color: darkcyan; font-weight: bold;");
        const metadataKey = `${LOCAL_METADATA_PREFIX}${warehouse}_${dataType}`;

        const mappingInfo = Object.values(this.appController.ALL_DATA_MAPPING).find(m => m.firestoreKey === dataType);

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

            ui.updateFileStatus(uiId, expectedFileName, `Đang tải file...`, 'default', false);
            ui.showProgressBar(uiId);

            console.log(`[handleDownloadAndProcessData] Fetching file from: ${downloadURL}`);
            const response = await fetch(downloadURL);
            if (!response.ok) {
                throw new Error(`Tải file thất bại: ${response.status} ${response.statusText}`);
            }
            const fileBlob = await response.blob();
            console.log(`[handleDownloadAndProcessData] File downloaded successfully. Blob size: ${fileBlob.size}`);
            const downloadedFile = new File([fileBlob], expectedFileName, { type: fileBlob.type });

            ui.updateFileStatus(uiId, expectedFileName, `Đang xử lý file...`, 'default');

            const workbook = await this._handleFileRead(downloadedFile);
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
                await this.appController.storage.setItem(saveKey, normalizedData);
            }

            if (!this.appController._localDataVersions[warehouse]) this.appController._localDataVersions[warehouse] = {};
            this.appController._localDataVersions[warehouse][dataType] = { version: expectedVersion, timestamp: expectedTimestamp };
            try {
                localStorage.setItem(LOCAL_DATA_VERSIONS_KEY, JSON.stringify(this.appController._localDataVersions));
                console.log(`%c[handleDownloadAndProcessData] CRITICAL FIX: Updated local version tracker to (v${expectedVersion}, t${expectedTimestamp}) and saved to localStorage.`, "color: purple; font-weight: bold;");
            } catch (e) {
                console.error("[handleDownloadAndProcessData] Error saving updated versions/timestamps to localStorage:", e);
            }

            ui.updateFileStatus(uiId, expectedFileName, '', 'success', false, metadata);
            ui.showNotification(`Đã tải và xử lý thành công dữ liệu ${dataType} (v${expectedVersion})!`, 'success');

            this.appController.updateAndRenderCurrentTab();

        } catch (error) {
            console.error(`%c[handleDownloadAndProcessData] Error processing ${dataType} @ ${warehouse}:`, "color: red;", error);
            ui.showNotification(`Lỗi khi tải/xử lý dữ liệu ${dataType}: ${error.message}`, 'error');
            if (metadata) {
                const statusText = `Lỗi tải/xử lý. Thử lại?`;
                ui.updateFileStatus(uiId, metadata.fileName || 'Cloud', statusText, 'error', true, metadata, dataType, warehouse);
            } else {
                const fallbackMetadata = this._getSavedMetadata(warehouse, dataType);
                if (fallbackMetadata) {
                    const statusText = `Lỗi tải/xử lý. Thử lại?`;
                    ui.updateFileStatus(uiId, fallbackMetadata.fileName || 'Cloud', statusText, 'error', true, fallbackMetadata, dataType, warehouse);
                } else {
                    ui.updateFileStatus(uiId, 'Cloud', 'Lỗi tải/xử lý. Không tìm thấy thông tin.', 'error', false);
                }
            }
        } finally {
            ui.hideProgressBar(uiId);
        }
    },

    /**
     * Xử lý đồng bộ dữ liệu dán (paste) lên cloud.
     * (Đã di chuyển từ main.js)
     */
    async _handlePastedDataSync(pastedText, kho, dataType, uiId, localStorageKey, stateKey = null, processFunc = null) {
        console.log(`%c[DEBUG _handlePastedDataSync] Bắt đầu đồng bộ cho: ${dataType}`, "color: darkcyan; font-weight: bold;");

        if (dataType !== 'pastedThiduaNVBI') {
            try {
                localStorage.setItem(localStorageKey, pastedText);
                console.log(`%c[DEBUG _handlePastedDataSync]   > Đã LƯU (setItem) text thô vào localStorage key: ${localStorageKey}`, "color: darkcyan;");
            } catch (e) {
                console.error(`%c[DEBUG _handlePastedDataSync]   > LỖI khi lưu text thô vào localStorage key: ${localStorageKey}`, "color: red;", e);
            }
        }

        let processedData = null;
        let processedCount = 0;
        
        if (dataType === 'pastedThiduaNVBI') {
            const parsedData = services.parsePastedThiDuaTableData(pastedText);
            if(parsedData.success) {
                services.updateCompetitionNameMappings(parsedData.mainHeaders);
                processedData = services.processThiDuaNhanVienData(parsedData, appState.competitionData);
                appState[stateKey] = processedData;
                processedCount = processedData.length;
                localStorage.setItem(localStorageKey, JSON.stringify(processedData));
            } else {
                throw new Error(parsedData.error || "Lỗi phân tích cú pháp dữ liệu thi đua từ cloud");
            }
        } 
        else if (stateKey && processFunc) {
            processedData = processFunc(pastedText);
            appState[stateKey] = processedData;
            processedCount = processedData?.length || 0;
        }

        if (!kho) {
            ui.updatePasteStatus(uiId, '✓ Đã nhận (Chọn kho để đồng bộ)', 'success', null, processedCount);
            if (dataType !== 'pastedLuykeBI') this.appController.updateAndRenderCurrentTab();
            return;
        }

        ui.updatePasteStatus(uiId, 'Đang đồng bộ cloud...', 'default');

        try {
            const localDataVersions = this.appController._localDataVersions;
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

            ui.updatePasteStatus(uiId, '', 'success', metadataToSaveLocally, processedCount);

        } catch (error) {
            console.error(`[${dataType} Paste] Cloud sync failed:`, error);
            ui.updatePasteStatus(uiId, `Lỗi đồng bộ cloud: ${error.message}`, 'error');
        }

        if (dataType !== 'pastedLuykeBI') {
            this.appController.updateAndRenderCurrentTab();
        }
    },

    /**
     * Xử lý dán dữ liệu Lũy kế BI.
     * (Đã di chuyển từ main.js)
     */
    async handleLuykePaste() {
        const pastedText = document.getElementById('paste-luyke')?.value || '';
        const kho = appState.selectedWarehouse;
        const mappingInfo = this.appController.ALL_DATA_MAPPING['pastedLuykeBI'];

        try {
            localStorage.setItem(mappingInfo.saveKey, pastedText);
            console.log(`%c[DEBUG handleLuykePaste] Đã LƯU (setItem) vào localStorage key: ${mappingInfo.saveKey} (Độ dài: ${pastedText.length})`, "color: green;");
        } catch (e) {
            console.error(`%c[DEBUG handleLuykePaste] LỖI khi lưu vào localStorage key: ${mappingInfo.saveKey}`, "color: red;", e);
        }
        
        ui.updatePasteStatus(mappingInfo.uiId, '✓ Đã nhận dữ liệu.', 'success');

        if (kho) {
            await this._handlePastedDataSync(
                pastedText,
                kho,
                mappingInfo.firestoreKey,
                mappingInfo.uiId,
                mappingInfo.saveKey
            );
        }
        this.appController.updateAndRenderCurrentTab();
    },

    /**
     * Xử lý dán dữ liệu Thi đua Nhân viên.
     * (Đã di chuyển từ main.js)
     */
    async handleThiduaNVPaste() {
        const pastedText = document.getElementById('paste-thiduanv')?.value || '';
        const kho = appState.selectedWarehouse;
        const mappingInfo = this.appController.ALL_DATA_MAPPING['pastedThiduaNVBI'];
        if (!mappingInfo) return;

        const { stateKey, saveKey, firestoreKey, uiId } = mappingInfo;

        try {
            localStorage.setItem(RAW_PASTE_THIDUANV_KEY, pastedText);
            console.log(`%c[DEBUG handleThiduaNVPaste] Đã LƯU (setItem) text thô vào localStorage key: ${RAW_PASTE_THIDUANV_KEY} (Độ dài: ${pastedText.length})`, "color: green;");
        } catch (e) {
            console.warn("Không thể lưu raw_paste_thiduanv vào localStorage:", e);
        }

        try {
            const parsedData = services.parsePastedThiDuaTableData(pastedText);
            if (!parsedData.success) {
                throw new Error(parsedData.error || "Lỗi phân tích cú pháp dữ liệu.");
            }

            services.updateCompetitionNameMappings(parsedData.mainHeaders);
            const processedData = services.processThiDuaNhanVienData(parsedData, appState.competitionData);
            
            appState[stateKey] = processedData;
            localStorage.setItem(saveKey, JSON.stringify(processedData));
            
            settingsService.loadPastedCompetitionViewSettings();
            console.log("[dataService handleThiduaNVPaste] Đã tải và hợp nhất cài đặt cột thi đua.");

            const processedCount = processedData.length;
            
            await this._handlePastedDataSync(
                pastedText,
                kho,
                firestoreKey,
                uiId,
                saveKey,
                stateKey,
                null
            );

            this.appController.updateAndRenderCurrentTab();
            if (appState.isAdmin && document.getElementById('declaration-section')?.classList.contains('hidden') === false) {
                ui.renderAdminPage();
            }

        } catch (error) {
            console.error("Lỗi khi xử lý dữ liệu dán Thi đua NV:", error);
            ui.updatePasteStatus(uiId, `Lỗi: ${error.message}`, 'error');
            const debugContainer = document.getElementById('debug-tool-container');
            if (debugContainer?.classList.contains('hidden')) {
                document.getElementById('toggle-debug-btn')?.click();
            }
        }
    },

    /**
     * Xử lý dán dữ liệu Thưởng ERP.
     * (Đã di chuyển từ main.js)
     */
    async handleErpPaste() {
        const pastedText = document.getElementById('paste-thuongerp')?.value || '';
        const kho = appState.selectedWarehouse;
        const mappingInfo = this.appController.ALL_DATA_MAPPING['pastedThuongERP'];
        
        try {
            localStorage.setItem(mappingInfo.saveKey, pastedText);
            console.log(`%c[DEBUG handleErpPaste] Đã LƯU (setItem) vào localStorage key: ${mappingInfo.saveKey} (Độ dài: ${pastedText.length})`, "color: green;");
        } catch (e) {
            console.error(`%c[DEBUG handleErpPaste] LỖI khi lưu vào localStorage key: ${mappingInfo.saveKey}`, "color: red;", e);
        }

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

    /**
     * Xử lý dán dữ liệu Thưởng ERP tháng trước.
     * (Đã di chuyển từ main.js)
     */
    async handleErpThangTruocPaste(e) {
        const pastedText = e.target.value;
        const kho = appState.selectedWarehouse;
        const mappingInfo = this.appController.ALL_DATA_MAPPING['pastedThuongERPThangTruoc'];
        
        try {
            localStorage.setItem(mappingInfo.saveKey, pastedText);
            console.log(`%c[DEBUG handleErpThangTruocPaste] Đã LƯU (setItem) vào localStorage key: ${mappingInfo.saveKey} (Độ dài: ${pastedText.length})`, "color: green;");
        } catch (lsError) {
            console.error(`%c[DEBUG handleErpThangTruocPaste] LỖI khi lưu vào localStorage key: ${mappingInfo.saveKey}`, "color: red;", lsError);
        }

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

    /**
     * Xử lý tải file Realtime.
     * (Đã di chuyển từ main.js)
     */
    async handleRealtimeFileInput(e) {
        const file = e.target.files[0];
        if (!file) return;
        ui.showNotification('Đang xử lý file realtime...', 'success');
        appState.realtimeYCXData = [];
        e.target.value = '';
        try {
            const workbook = await this._handleFileRead(file);
            const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const { normalizedData, success, missingColumns } = services.normalizeData(rawData, 'ycx');
            ui.displayDebugInfo('ycx-realtime');
            if (success) {
                appState.realtimeYCXData = normalizedData;
                uiRealtime.populateRealtimeBrandCategoryFilter();
                ui.showNotification(`Tải thành công ${normalizedData.length} dòng realtime!`, 'success');
                this.appController.updateAndRenderCurrentTab();
            } else {
                ui.showNotification(`File realtime lỗi: Thiếu cột ${missingColumns.join(', ')}.`, 'error');
                const debugContainer = document.getElementById('debug-tool-container');
                if (debugContainer?.classList.contains('hidden')) {
                    document.getElementById('toggle-debug-btn')?.click();
                }
            }
        } catch (err) { ui.showNotification(`Có lỗi khi đọc file: ${err.message}`, 'error'); console.error(err); }
    },

    /**
     * Xử lý tải file Cấu trúc Ngành hàng.
     * (Đã di chuyển từ main.js)
     */
    async handleCategoryFile(e) {
        const fileInput = e.target;
        const file = fileInput.files[0];
        if (!file) return;
        ui.updateFileStatus('category-structure', file.name, 'Đang xử lý...', 'default');
        ui.showProgressBar('category-structure');
        try {
            const workbook = await this._handleFileRead(file);
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
                ui.updateFileStatus('category-structure', file.name, `✓ Đã xử lý và đồng bộ ${categoryResult.normalizedData.length} nhóm & ${brandResult.normalizedData.length} hãng.`, 'success');
            } else {
                ui.showNotification(`Lỗi xử lý file khai báo: ${categoryResult.error}`, 'error');
            }
        } catch (error) {
            ui.updateFileStatus('category-structure', file.name, `Lỗi: ${error.message}`, 'error');
        } finally {
            ui.hideProgressBar('category-structure');
            fileInput.value = '';
        }
    },

    /**
     * Xử lý tải file Thi Đua Vùng.
     * (Đã di chuyển từ main.js)
     */
    async handleThiDuaVungFileInput(e) {
        const fileInput = e.target;
        const file = fileInput.files[0];
        if (!file) return;
        ui.updateFileStatus('thidua-vung', file.name, 'Đang xử lý...', 'default');
        try {
            const workbook = await this._handleFileRead(file);
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
            ui.updateFileStatus('thidua-vung', file.name, `✓ Đã xử lý ${supermarketNames.length} siêu thị.`, 'success');
        } catch (error) {
            ui.updateFileStatus('thidua-vung', file.name, `Lỗi: ${error.message}`, 'error');
        }
    },
    
    // --- CÁC HÀM MỚI (v1.3) ---

    /**
     * Tải file mẫu DSNV.
     * (Đã di chuyển từ main.js )
     */
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

    /**
     * Xử lý file gỡ lỗi thi đua.
     * (Đã di chuyển từ main.js )
     */
    async handleCompetitionDebugFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        ui.showNotification('Đang phân tích file gỡ lỗi...', 'success');
        try {
            const workbook = await this._handleFileRead(file);
            const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const debugResults = services.debugCompetitionFiltering(rawData);
            ui.renderCompetitionDebugReport(debugResults);
        } catch (err) {
            ui.showNotification(`Lỗi khi đọc file gỡ lỗi: ${err.message}`, 'error');
        }
    }
};