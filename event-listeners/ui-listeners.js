// Version 3.30 - Initialize choices.js for realtime brand/category filters
// Version 3.29 - Add event listener for sknv-thidua-view-selector
// Version 3.28 - Call incrementCounter with email for user-specific actionsTaken
// Version 3.27 - Add actionsTaken counter increment on successful file upload
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

async function handleFileInputChange(e) {
    const fileInput = e.target;
    const file = fileInput.files[0];
    if (!file) {
        // Clear status if user cancels file selection
        const fileType = fileInput.id.replace('file-', '');
        // Find mapping info using appController if available, otherwise might need direct access or different approach
         const mappingInfo = appController?.ALL_DATA_MAPPING
            ? Object.values(appController.ALL_DATA_MAPPING).find(m => m.uiId === fileType)
            : null; // Fallback if appController isn't ready or doesn't have the mapping yet
        if (mappingInfo && mappingInfo.uiId) {
            uiComponents.updateFileStatus(mappingInfo.uiId, '', 'Chưa thêm file', 'default');
        }
        return;
    }

    const fileType = fileInput.id.replace('file-', '');
    // Find mapping info using appController if available
     const mappingInfo = appController?.ALL_DATA_MAPPING
        ? Object.values(appController.ALL_DATA_MAPPING).find(m => m.uiId === fileType)
        : null; // Fallback

    if (!mappingInfo) {
        if (fileType === 'danhsachnv') {
            return appController.handleDsnvUpload(e, file);
        }
        console.error(`[handleFileInputChange] No mapping info found for fileType: ${fileType}`);
        uiComponents.updateFileStatus(fileType, file.name, `Lỗi: Không tìm thấy cấu hình cho loại file '${fileType}'.`, 'error');
        return;
    }


    const { stateKey, saveKey, firestoreKey } = mappingInfo;
    const dataName = fileInput.dataset.name || fileType;

    uiComponents.updateFileStatus(fileType, file.name, 'Đang đọc & chuẩn hóa...', 'default');
    ui.showProgressBar(fileType);

    try {
        const workbook = await appController.handleFileRead(file);
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
             fileInput.value = ''; // Reset input on error
            return;
        }

        // *** >>> SỬA ĐỂ GỌI HÀM ĐẾM VỚI EMAIL <<< ***
        if (appState.currentUser?.email) {
             firebase.incrementCounter('actionsTaken', appState.currentUser.email);
             console.log(`Incremented actionsTaken for ${appState.currentUser.email}`);
        } else {
             firebase.incrementCounter('actionsTaken'); // Fallback if email somehow isn't available
             console.warn("User email not found in appState, incrementing global actionsTaken.");
        }
        // *** >>> KẾT THÚC SỬA ĐỔI <<< ***

        appState[stateKey] = normalizedData;
        ui.showNotification(`Tải thành công file "${dataName}"!`, 'success');

        if (saveKey) {
            console.log(`[handleFileInputChange] Saving normalized data (${normalizedData.length} rows) to cache: ${saveKey}`);
            await appController.storage.setItem(saveKey, normalizedData);
            console.log(`%c[DEBUG POST-CACHE] Successfully saved ${fileType} to cache. Proceeding...`, "color: brown;");
        }

        // --- Cloud Synchronization ---
        const warehouseToSync = appState.selectedWarehouse;
        const currentFirestoreKey = firestoreKey;

        console.log(`%c[DEBUG PRE-SYNC CHECK] File Type: ${fileType}, Warehouse: ${warehouseToSync}, Firestore Key: ${currentFirestoreKey}`, "color: purple; font-weight: bold;");

        if (warehouseToSync && currentFirestoreKey) {
            console.log(`%c[DEBUG SYNC BLOCK START] Entering cloud sync block for ${fileType} (Firestore Key: ${currentFirestoreKey})`, "color: magenta;");

            uiComponents.updateFileStatus(fileType, file.name, `Đang chuẩn bị đồng bộ cloud...`, 'default');

            let localDataVersions = appController._localDataVersions;
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

                const metadataKey = `${appController.LOCAL_METADATA_PREFIX}${warehouseToSync}_${currentFirestoreKey}`;
                const metadataToSaveLocally = { ...metadata, updatedAt: new Date() };
                try {
                    localStorage.setItem(metadataKey, JSON.stringify(metadataToSaveLocally));
                    console.log(`[handleFileInputChange] Saved metadata for ${currentFirestoreKey} to localStorage ('${metadataKey}') immediately.`);
                } catch (lsError) {
                    console.error(`[handleFileInputChange] Error saving metadata for ${currentFirestoreKey} to localStorage:`, lsError);
                }

                if (!localDataVersions[warehouseToSync]) localDataVersions[warehouseToSync] = {};
                localDataVersions[warehouseToSync][currentFirestoreKey] = { version: newVersion, timestamp: uploadTimestamp };
                localStorage.setItem(LOCAL_DATA_VERSIONS_KEY, JSON.stringify(localDataVersions));
                appController._localDataVersions = localDataVersions;

                console.log(`%c[handleFileInputChange] Successfully uploaded ${currentFirestoreKey} (v${newVersion}).`, "color: magenta;");

                uiComponents.updateFileStatus(fileType, file.name, '', 'success', false, metadataToSaveLocally);

            } catch (syncError) {
                console.error(`%c[handleFileInputChange] Cloud sync failed for ${currentFirestoreKey}:`, "color: red;", syncError);
                uiComponents.updateFileStatus(fileType, file.name, `Lỗi đồng bộ cloud: ${syncError.message}`, 'error');
            }
            console.log(`%c[DEBUG SYNC BLOCK END] Finished cloud sync block for ${fileType}`, "color: magenta;");
        } else {
             console.log(`%c[DEBUG SYNC SKIP] Skipping cloud sync for ${fileType}. Warehouse selected: ${!!warehouseToSync}, Firestore key exists: ${!!currentFirestoreKey}`, "color: orange;");
            uiComponents.updateFileStatus(fileType, file.name, `✓ Đã tải ${normalizedData.length} dòng (Chưa đồng bộ).`, 'success', false, null);
        }

        console.log(`%c[DEBUG PRE-RENDER] About to call updateAndRenderCurrentTab for ${fileType}`, "color: blue;");
        appController.updateAndRenderCurrentTab();

    } catch (error) {
        console.error(`Lỗi xử lý file ${dataName}:`, error);
        uiComponents.updateFileStatus(fileType, file.name, `Lỗi đọc file: ${error.message}`, 'error');
        ui.showNotification(`Lỗi khi xử lý file "${dataName}".`, 'error');
    } finally {
        ui.hideProgressBar(fileType);
        fileInput.value = '';
        console.log(`%c[DEBUG FUNCTION END] handleFileInputChange finished for ${fileType}`, "color: gray;");
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

    // Khởi tạo Choices.js và Flatpickr (Giữ nguyên)
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
        
        // === FIX 4 (Sửa) ===
        // Thêm 2 ID bộ lọc của tab Realtime vào đây
        const singleSelects = {
             'thidua-employee-filter': 'thidua_employee_detail',
            'thidua-vung-filter-supermarket': 'thiDuaVung_sieuThi',
            'realtime-brand-category-filter': 'realtime_brand_category_filter', // Đã thêm
            'realtime-brand-filter': 'realtime_brand_filter' // Đã thêm
        };
        // === END FIX 4 ===

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

    // General UI Listeners (Giữ nguyên)
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

    // File input listeners - Gán hàm xử lý chung đã sửa
    document.querySelectorAll('.file-input').forEach(input => {
        if (input.id !== 'file-thidua-vung' && input.id !== 'file-category-structure' && input.id !== 'realtime-file-input' && input.id !== 'debug-competition-file-input') {
            input.addEventListener('change', handleFileInputChange); // Gán hàm đã định nghĩa ở trên
        }
    });
    // Gán các handler đặc biệt (Giữ nguyên)
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

    // Filter change listeners (Giữ nguyên)
    ['luyke', 'sknv', 'realtime'].forEach(prefix => {
        document.getElementById(`${prefix}-filter-warehouse`)?.addEventListener('change', () => handleFilterChange(prefix));
        document.getElementById(`${prefix}-filter-department`)?.addEventListener('change', () => handleFilterChange(prefix));
         document.getElementById(`${prefix}-filter-name`)?.addEventListener('change', () => handleFilterChange(prefix));
    });

    // Warehouse selector listener (Giữ nguyên)
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
                const versionInfo = appController._localDataVersions?.[selectedKho]?.[ft];
                if (!versionInfo || !versionInfo.version || versionInfo.version === 0) {
                     uiComponents.updateFileStatus(ft, 'Cloud', `Đang chờ đồng bộ từ kho ${selectedKho}...`, 'default');
                }
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
             ['ycx', 'giocong', 'thuongnong'].forEach(ft => uiComponents.updateFileStatus(ft, '', 'Chọn kho để đồng bộ...', 'default'));
        }
        appController.updateAndRenderCurrentTab();
    });

    // Other specific listeners (Giữ nguyên)
    document.getElementById('sknv-view-selector')?.addEventListener('click', (e) => appController.handleSknvViewChange(e));
    document.getElementById('sknv-employee-filter')?.addEventListener('change', () => sknvTab.render());

    // Body click listener (Giữ nguyên)
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

        // *** NEW (v3.29) ***
        const sknvThiDuaViewSwitcherBtn = e.target.closest('#sknv-thidua-view-selector .view-switcher__btn');
        if (sknvThiDuaViewSwitcherBtn) {
            e.preventDefault();
            // Xử lý chuyển đổi view trực tiếp
            const viewSelector = sknvThiDuaViewSwitcherBtn.closest('#sknv-thidua-view-selector');
            if (viewSelector) {
                 viewSelector.querySelectorAll('.view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            }
            sknvThiDuaViewSwitcherBtn.classList.add('active');
            
            // Render lại tab SKNV (nó sẽ đọc nút active này)
            appController.updateAndRenderCurrentTab(); 
            return;
        }
        // *** END NEW ***

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

        const downloadBtn = e.target.closest('.download-data-btn');
        if (downloadBtn) {
            e.preventDefault();
            const dataType = downloadBtn.dataset.type;
            const warehouse = downloadBtn.dataset.warehouse;
            if (dataType && warehouse && appController) {
                console.log(`[Body Click Listener] Download button clicked for ${dataType} @ ${warehouse}`);
                appController.handleDownloadAndProcessData(dataType, warehouse);
            } else {
                console.error("Download button clicked but missing data-type or data-warehouse.", downloadBtn);
            }
            return;
        }
    });

    // Specific filter listeners (Giữ nguyên)
    document.getElementById('thidua-employee-filter')?.addEventListener('change', () => ui.displayCompetitionReport('employee'));
    document.getElementById('realtime-brand-category-filter')?.addEventListener('change', () => uiRealtime.handleBrandFilterChange());
    document.getElementById('realtime-brand-filter')?.addEventListener('change', () => uiRealtime.handleBrandFilterChange());
}