// Version 3.26 - Fix incorrect import paths (./ changed to ../)
// Version 3.25 - Add event listener for download-data-btn
// Version 3.24 - Implement Cloud Storage upload and save metadata logic
// MODULE: EVENT LISTENERS INITIALIZER
// File này đóng vai trò là điểm khởi đầu, import và khởi chạy tất cả các module listener con.

import { appState } from '../state.js';
import { ui } from '../ui.js';
import { services } from '../services.js';
import { luykeTab } from '../tab-luyke.js';
import { sknvTab } from '../tab-sknv.js';
import { uiRealtime } from '../ui-realtime.js';
import { initializeActionListeners } from './listeners-actions.js';
import { initializeCollaborationListeners } from './listeners-collaboration.js';
import { initializeCompetitionListeners } from './listeners-competition.js';
import { initializeHighlightingListeners } from './listeners-highlighting.js';
import { initializeSettingsListeners } from './listeners-settings.js';
import { initializeSortingListeners } from './listeners-sorting.js';
import { dragDroplisteners } from './listeners-dragdrop.js';
import { captureService } from '../modules/capture.service.js';
import { firebase } from '../firebase.js';
import { uiComponents } from '../ui-components.js';

let appController = null;

// --- CONSTANTS ---
const LOCAL_DATA_VERSIONS_KEY = '_localDataVersions'; // Key for localStorage

// --- HELPERS / HANDLERS ---

// *** MODIFIED FUNCTION (v3.24) ***
async function handleFileInputChange(e) {
    const fileInput = e.target;
    const file = fileInput.files[0]; // The original Excel/CSV file object
    const fileType = fileInput.id.replace('file-', '');
    const dataName = fileInput.dataset.name || fileType;
    const stateKey = fileInput.dataset.stateKey;
    const saveKey = fileInput.dataset.saveKey; // Key for IndexedDB cache
    if (!file || !stateKey) return;

    // --- Step 1: Read, Normalize, and Update Local State/Cache (as before) ---
    ui.updateFileStatus(fileType, file.name, 'Đang đọc & chuẩn hóa...', 'default'); // Updated status
    ui.showProgressBar(fileType); // Show progress bar early

    try {
        const workbook = await appController.handleFileRead(file);
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const normalizeType = fileType.includes('thangtruoc') ? fileType.replace('-thangtruoc', '') : fileType;
        const { normalizedData, success, missingColumns } = services.normalizeData(rawData, normalizeType);
        ui.displayDebugInfo(fileType);

        if (!success) {
            const errorMessage = `Lỗi file "${dataName}": Thiếu cột: ${missingColumns.join(', ')}.`;
            ui.updateFileStatus(fileType, file.name, `Lỗi: Thiếu cột dữ liệu.`, 'error');
            ui.showNotification(errorMessage, 'error');
            if (document.getElementById('debug-tool-container')?.classList.contains('hidden')) {
                document.getElementById('toggle-debug-btn')?.click();
            }
            ui.hideProgressBar(fileType); // Hide progress bar on error
            return; // Stop processing if normalization failed
        }

        // Update appState immediately for responsiveness
        appState[stateKey] = normalizedData;
        if (stateKey === 'danhSachNhanVien') {
            services.updateEmployeeMaps();
            ui.populateAllFilters();
            uiComponents.populateWarehouseSelector();
        }

        // Update UI status after local processing
        ui.updateFileStatus(fileType, file.name, `✓ Đã tải ${normalizedData.length} dòng.`, 'success'); // Keep this simple message
        ui.showNotification(`Tải thành công file "${dataName}"!`, 'success');

        // Save normalized data to local cache (IndexedDB)
        if (saveKey) {
            console.log(`[handleFileInputChange] Saving normalized data (${normalizedData.length} rows) to cache: ${saveKey}`);
            await appController.storage.setItem(saveKey, normalizedData);
        }

        // --- Step 2: Cloud Synchronization (Upload file to Storage, save metadata to Firestore) ---
        const warehouseToSync = appState.selectedWarehouse;
        if (warehouseToSync && ['ycx', 'giocong', 'thuongnong'].includes(fileType)) {
            console.log(`[DEBUG] Preparing Cloud Sync for ${fileType}, kho: ${warehouseToSync}`);
            ui.updateFileStatus(fileType, file.name, `Đang chuẩn bị đồng bộ cloud...`, 'default'); // New status

            // Get local version info
            let localDataVersions = {};
            try {
                const storedVersions = localStorage.getItem(LOCAL_DATA_VERSIONS_KEY);
                if (storedVersions) localDataVersions = JSON.parse(storedVersions);
            } catch (e) { console.error("Error reading local data versions:", e); localDataVersions = {}; }

            const currentVersion = localDataVersions?.[warehouseToSync]?.[fileType]?.version || 0;
            const newVersion = currentVersion + 1;
            const uploadTimestamp = Date.now();

            // Construct storage path: uploads/khoID/dataType_vX.ext
            const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
            const storagePath = `uploads/${warehouseToSync}/${fileType}_v${newVersion}${fileExtension}`;

            console.log(`%c[handleFileInputChange] Cloud Upload for ${fileType} @ ${warehouseToSync}:`, "color: magenta; font-weight: bold;");
            console.log(`%c  -> New Version: ${newVersion}`, "color: magenta;");
            console.log(`%c  -> Upload Timestamp: ${uploadTimestamp}`, "color: magenta;");
            console.log(`%c  -> Storage Path: ${storagePath}`, "color: magenta;");

            // Define progress callback for storage upload
            const onProgress = (progress) => {
                ui.updateFileStatus(fileType, file.name, `Đang tải lên cloud... ${Math.round(progress)}%`, 'default');
            };

            try {
                // Upload the original file to Cloud Storage
                const downloadURL = await firebase.uploadFileToStorage(file, storagePath, onProgress);
                ui.updateFileStatus(fileType, file.name, `Upload xong, đang lưu thông tin...`, 'default'); // New status

                // Prepare metadata object
                const metadata = {
                    storagePath: storagePath,
                    downloadURL: downloadURL,
                    version: newVersion,
                    timestamp: uploadTimestamp, // local timestamp
                    // updatedBy is added by saveMetadataToFirestore
                    rowCount: normalizedData.length,
                    fileName: file.name
                };

                // Save metadata to Firestore
                await firebase.saveMetadataToFirestore(warehouseToSync, fileType, metadata);

                // Update local version/timestamp state ONLY AFTER successful metadata save
                if (!localDataVersions[warehouseToSync]) localDataVersions[warehouseToSync] = {};
                localDataVersions[warehouseToSync][fileType] = { version: newVersion, timestamp: uploadTimestamp };
                localStorage.setItem(LOCAL_DATA_VERSIONS_KEY, JSON.stringify(localDataVersions));
                appController._localDataVersions = localDataVersions; // Update in-memory state

                console.log(`%c[handleFileInputChange] Successfully uploaded file and saved metadata for ${fileType} @ ${warehouseToSync} (v${newVersion}).`, "color: magenta;");
                // Final success status - User Friendly
                ui.updateFileStatus(fileType, file.name, `✓ Đã đồng bộ lên cloud.`, 'success');

            } catch (syncError) {
                console.error(`%c[handleFileInputChange] Cloud sync failed for ${fileType}:`, "color: red;", syncError);
                // Error notification is handled within firebase functions, just update status here
                ui.updateFileStatus(fileType, file.name, `Lỗi đồng bộ cloud: ${syncError.message}`, 'error');
            }

        } else if (['ycx', 'giocong', 'thuongnong'].includes(fileType)) {
             console.warn(`[DEBUG] Skipping cloud save for ${fileType} because appState.selectedWarehouse is not set.`);
             // Status already set to "✓ Đã tải..." earlier, no change needed here.
        }

        // Always render after processing, regardless of sync status
        appController.updateAndRenderCurrentTab();

    } catch (error) { // Catch errors from reading/normalizing
        console.error(`Lỗi xử lý file ${dataName}:`, error);
        ui.updateFileStatus(fileType, file.name, `Lỗi đọc file: ${error.message}`, 'error');
        ui.showNotification(`Lỗi khi xử lý file "${dataName}".`, 'error');
    } finally {
        ui.hideProgressBar(fileType);
    }
}


function handleFilterChange(prefix) {
    appState.viewingDetailFor = null;
    uiComponents.updateEmployeeFilter(prefix);
    appController.updateAndRenderCurrentTab();
}

// --- MAIN INITIALIZER ---

export function initializeEventListeners(mainAppController) {
    appController = mainAppController;

    // ... (Khởi tạo Choices.js và Flatpickr giữ nguyên như v3.24) ...
    try {
        const multiSelectConfig = { removeItemButton: true, placeholder: true, placeholderValue: 'Chọn hoặc gõ để tìm...', searchPlaceholderValue: 'Tìm kiếm...' };
        const competitionMultiSelectConfig = { ...multiSelectConfig };

        ['luyke', 'sknv', 'realtime'].forEach(prefix => {
            const employeeEl = document.getElementById(`${prefix}-filter-name`);
            if (employeeEl) appState.choices[`${prefix}_employee`] = new Choices(employeeEl, multiSelectConfig);
            ['warehouse', 'department'].forEach(type => {
                const el = document.getElementById(`${prefix}-filter-${type}`);
                if(el) appState.choices[`${prefix}_${type}`] = new Choices(el, { searchEnabled: true, removeItemButton: false, itemSelectText: 'Chọn' });
            });
            ['nhanhang', 'nhomhang', 'employee'].forEach(type => {
                const highlightEl = document.getElementById(`${prefix}-highlight-${type}`);
                if (highlightEl) appState.choices[`${prefix}_highlight_${type}`] = new Choices(highlightEl, multiSelectConfig);
            });
        });
        const competitionBrandEl = document.getElementById('competition-brand');
        if (competitionBrandEl) appState.choices['competition_brand'] = new Choices(competitionBrandEl, competitionMultiSelectConfig);
        const competitionGroupEl = document.getElementById('competition-group');
        if (competitionGroupEl) appState.choices['competition_group'] = new Choices(competitionGroupEl, competitionMultiSelectConfig);
        const singleSelectConfig = { searchEnabled: true, removeItemButton: false, itemSelectText: 'Chọn', searchPlaceholderValue: 'Tìm kiếm...' };
        const singleSelects = {
             'thidua-employee-filter': 'thidua_employee_detail',
            'thidua-vung-filter-supermarket': 'thiDuaVung_sieuThi',
        };
        for (const [id, key] of Object.entries(singleSelects)) {
             const el = document.getElementById(id);
             if (el) appState.choices[key] = new Choices(el, singleSelectConfig);
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
                    uiComponents.updateDateSummary(document.getElementById(`${prefix}-date-summary`), instance);
                    appState.viewingDetailFor = null;
                    renderFunc();
                }
            });
            appState.choices[`${prefix}_date_picker`] = datePicker;
            document.getElementById(`${prefix}-clear-date`)?.addEventListener('click', () => { datePicker.clear(); renderFunc(); });
        };
        initDatePicker('luyke', luykeTab.render);
        initDatePicker('sknv', sknvTab.render);
    } catch (error) { console.error("Lỗi khi khởi tạo Flatpickr:", error); }

    // Gọi các hàm khởi tạo listener con
    initializeSettingsListeners(appController);
    initializeHighlightingListeners(appController);
    initializeActionListeners();
    initializeCollaborationListeners(appController);
    initializeSortingListeners(appController);
    initializeCompetitionListeners(appController);
    dragDroplisteners.init(appController);

    // ... (Các listeners khác giữ nguyên như v3.24) ...
    document.getElementById('force-reload-btn')?.addEventListener('click', () => window.location.reload());
    document.querySelectorAll('a.nav-link').forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); appController.switchTab(link.getAttribute('href').substring(1)); }));
    document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.addEventListener('click', (e) => {
        ui.handleSubTabClick(e.currentTarget);
        appState.viewingDetailFor = null;
        const mainTabId = e.currentTarget.closest('.page-section')?.id || e.currentTarget.closest('.settings-drawer')?.id;
        if (mainTabId === 'health-section') luykeTab.render();
        else if (mainTabId === 'health-employee-section') sknvTab.render();
        else if (mainTabId === 'realtime-section') uiRealtime.render();
    }));
    document.querySelectorAll('.toggle-filters-btn').forEach(button => button.addEventListener('click', () => ui.toggleFilterSection(button.dataset.target)));
    document.querySelectorAll('.file-input').forEach(input => {
        if (input.id !== 'file-thidua-vung' && input.id !== 'file-category-structure') {
            input.addEventListener('change', (e) => handleFileInputChange(e));
        }
    });
    document.getElementById('file-category-structure')?.addEventListener('change', (e) => appController.handleCategoryFile(e));
    document.getElementById('paste-luyke')?.addEventListener('input', () => appController.handleLuykePaste());
    document.getElementById('paste-thiduanv')?.addEventListener('input', () => appController.handleThiduaNVPaste());
    document.getElementById('paste-thuongerp')?.addEventListener('input', () => appController.handleErpPaste());
    document.getElementById('paste-thuongerp-thangtruoc')?.addEventListener('input', (e) => appController.handleErpThangTruocPaste(e));
    document.getElementById('realtime-file-input')?.addEventListener('change', (e) => appController.handleRealtimeFileInput(e));
    document.getElementById('download-danhsachnv-template-btn')?.addEventListener('click', () => appController.handleTemplateDownload());
    document.getElementById('file-thidua-vung')?.addEventListener('change', (e) => appController.handleThiDuaVungFileInput(e));
    document.getElementById('thidua-vung-filter-supermarket')?.addEventListener('change', () => appController.handleThiDuaVungFilterChange());
    document.getElementById('debug-competition-file-input')?.addEventListener('change', (e) => appController.handleCompetitionDebugFile(e));
    ['luyke', 'sknv', 'realtime'].forEach(prefix => {
        document.getElementById(`${prefix}-filter-warehouse`)?.addEventListener('change', () => handleFilterChange(prefix));
        document.getElementById(`${prefix}-filter-department`)?.addEventListener('change', () => handleFilterChange(prefix));
         document.getElementById(`${prefix}-filter-name`)?.addEventListener('change', () => handleFilterChange(prefix));
    });
    document.getElementById('data-warehouse-selector')?.addEventListener('change', (e) => {
        const selectedKho = e.target.value;
        console.log("[DEBUG] Kho selection changed. Selected:", selectedKho);
        if (selectedKho) {
            appState.selectedWarehouse = selectedKho;
            localStorage.setItem('selectedWarehouse', selectedKho);
            ui.showNotification(`Đã chuyển sang làm việc với kho ${selectedKho}.`, 'success');
            if(appController.unsubscribeDataListener) {
                console.log("[DEBUG] Unsubscribing from previous warehouse listener.");
                appController.unsubscribeDataListener();
            }
            appController.unsubscribeDataListener = firebase.listenForDataChanges(selectedKho, (cloudData) => {
                appController.handleCloudDataUpdate(cloudData);
            });
            ['ycx', 'giocong', 'thuongnong'].forEach(ft => {
                // *** MODIFIED (v4.19): Check metadata version/timestamp in memory ***
                const versionInfo = appController._localDataVersions?.[selectedKho]?.[ft];
                if (!versionInfo || !versionInfo.version || versionInfo.version === 0) {
                     ui.updateFileStatus(ft, 'Cloud', `Đang chờ đồng bộ từ kho ${selectedKho}...`, 'default');
                }
                // Else: Do nothing, continueInit in main.js will handle setting the status from cache/metadata
            });
        } else {
            appState.selectedWarehouse = null;
            localStorage.removeItem('selectedWarehouse');
            ui.showNotification(`Đã bỏ chọn kho. Đồng bộ cloud tạm dừng.`, 'success');
            if(appController.unsubscribeDataListener) {
                 console.log("[DEBUG] Unsubscribing warehouse listener (no warehouse selected).");
                appController.unsubscribeDataListener();
                appController.unsubscribeDataListener = null;
            }
             ['ycx', 'giocong', 'thuongnong'].forEach(ft => ui.updateFileStatus(ft, '', 'Chọn kho để đồng bộ...', 'default'));
        }
        appController.updateAndRenderCurrentTab();
    });
    document.getElementById('sknv-view-selector')?.addEventListener('click', (e) => appController.handleSknvViewChange(e));
    document.getElementById('sknv-employee-filter')?.addEventListener('change', () => sknvTab.render());

    // *** MODIFIED (v3.25): Added listener for download-data-btn ***
    document.body.addEventListener('click', (e) => {
        const interactiveRow = e.target.closest('.interactive-row');
        if (interactiveRow && interactiveRow.dataset.employeeId) {
            e.preventDefault();
            if (appState.viewingDetailFor && appState.viewingDetailFor.employeeId === interactiveRow.dataset.employeeId) return;
            appState.viewingDetailFor = { employeeId: interactiveRow.dataset.employeeId, sourceTab: interactiveRow.dataset.sourceTab };
            appController.updateAndRenderCurrentTab();
            return;
        }
        const backButton = e.target.closest('.back-to-summary-btn');
        if (backButton) {
            e.preventDefault();
            appState.viewingDetailFor = null;
            appController.updateAndRenderCurrentTab();
            return;
        }
        const captureDetailBtn = e.target.closest('#capture-sknv-detail-btn, #capture-dtnv-lk-detail-btn, #capture-dtnv-rt-detail-btn');
        if (captureDetailBtn) {
            e.preventDefault();
            const areaToCapture = captureDetailBtn.closest('.sub-tab-content')?.querySelector('[id$="-capture-area"]');
            const title = appState.viewingDetailFor?.employeeId || 'ChiTietNV';
            if (areaToCapture) captureService.captureDashboardInParts(areaToCapture, title);
            return;
        }
        const luykeViewSwitcherBtn = e.target.closest('#luyke-thidua-view-selector .view-switcher__btn');
        if (luykeViewSwitcherBtn) {
            e.preventDefault();
            appController.handleLuykeThiDuaViewChange(e);
            return;
        }
        const thiDuaViewSwitcherBtn = e.target.closest('#thidua-view-selector .view-switcher__btn');
        if (thiDuaViewSwitcherBtn) {
            e.preventDefault();
            appController.handleThiDuaViewChange(e);
            return;
        }
        const dtHangViewSwitcherBtn = e.target.closest('#dthang-realtime-view-selector .view-switcher__btn');
        if (dtHangViewSwitcherBtn) {
            e.preventDefault();
            appController.handleDthangRealtimeViewChange(e);
            return;
        }

        // *** ADDED (v3.25): Listener for Download Data Button ***
        const downloadBtn = e.target.closest('.download-data-btn');
        if (downloadBtn) {
            e.preventDefault(); // Ngăn hành vi mặc định (nếu có)
            const dataType = downloadBtn.dataset.type;
            const warehouse = downloadBtn.dataset.warehouse;
            if (dataType && warehouse && appController) {
                console.log(`[Body Click Listener] Download button clicked for ${dataType} @ ${warehouse}`);
                // Gọi hàm xử lý trong main controller
                appController.handleDownloadAndProcessData(dataType, warehouse);
            } else {
                console.error("Download button clicked but missing data-type or data-warehouse.", downloadBtn);
            }
            return; // Dừng xử lý
        }
        // *** END ADDED (v3.25) ***
    });

    document.getElementById('thidua-employee-filter')?.addEventListener('change', () => ui.displayCompetitionReport('employee'));
    document.getElementById('realtime-brand-category-filter')?.addEventListener('change', () => uiRealtime.handleBrandFilterChange());
    document.getElementById('realtime-brand-filter')?.addEventListener('change', () => uiRealtime.handleBrandFilterChange());
}