// Version 3.34 - Refactor: Hoàn tất di dời 2 listener (Template, Debug) sang data.service.js
// Version 3.33 - Fix: Gỡ bỏ comment [cite] gây lỗi cú pháp
// Version 3.32 - Refactor: Di dời logic xử lý file/paste sang data.service.js
// Version 3.31 - Fix: Thêm dấu phẩy (,) bị thiếu trong object 'singleSelects'
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
import { dataService } from '../services/data.service.js';

let appController = null;

// --- CONSTANTS ---
// (Đã xóa LOCAL_DATA_VERSIONS_KEY)

// --- HELPERS / HANDLERS ---

// (ĐÃ XÓA TOÀN BỘ HÀM handleFileInputChange)

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
        
        const singleSelects = {
             'thidua-employee-filter': 'thidua_employee_detail',
            'thidua-vung-filter-supermarket': 'thiDuaVung_sieuThi',
            'realtime-brand-category-filter': 'realtime_brand_category_filter',
            'realtime-brand-filter': 'realtime_brand_filter',
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
    document.querySelectorAll('.toggle-filters-btn').forEach(button =>
        button.addEventListener('click', () => ui.toggleFilterSection(button.dataset.target)));

    // --- BẮT ĐẦU TÁI CẤU TRÚC (v3.32 -> v3.34) ---
    // File input listeners - Trỏ đến dataService
    document.querySelectorAll('.file-input').forEach(input => {
        if (input.id !== 'file-thidua-vung' && input.id !== 'file-category-structure' && input.id !== 'realtime-file-input' && input.id !== 'debug-competition-file-input') {
            input.addEventListener('change', (e) => dataService.handleFileUpload(e));
        }
    });
    // Gán các handler đặc biệt - Trỏ đến dataService
    document.getElementById('file-category-structure')?.addEventListener('change', (e) => dataService.handleCategoryFile(e));
    document.getElementById('paste-luyke')?.addEventListener('input', () => dataService.handleLuykePaste());
    document.getElementById('paste-thiduanv')?.addEventListener('input', () => dataService.handleThiduaNVPaste());
    document.getElementById('paste-thuongerp')?.addEventListener('input', () => dataService.handleErpPaste());
    document.getElementById('paste-thuongerp-thangtruoc')?.addEventListener('input', (e) => dataService.handleErpThangTruocPaste(e));
    document.getElementById('realtime-file-input')?.addEventListener('change', (e) => dataService.handleRealtimeFileInput(e));
    document.getElementById('file-thidua-vung')?.addEventListener('change', (e) => dataService.handleThiDuaVungFileInput(e));
    
    // <<< CẬP NHẬT (v3.34) >>>
    document.getElementById('download-danhsachnv-template-btn')?.addEventListener('click', () => dataService.handleTemplateDownload()); 
    document.getElementById('thidua-vung-filter-supermarket')?.addEventListener('change', () => appController.handleThiDuaVungFilterChange()); // (Giữ nguyên)
    document.getElementById('debug-competition-file-input')?.addEventListener('change', (e) => dataService.handleCompetitionDebugFile(e)); 
    // --- KẾT THÚC TÁI CẤU TRÚC ---

    // Filter change listeners (Giữ nguyên)
    ['luyke', 'sknv', 'realtime'].forEach(prefix => {
        document.getElementById(`${prefix}-filter-warehouse`)?.addEventListener('change', () => handleFilterChange(prefix));
        document.getElementById(`${prefix}-filter-department`)?.addEventListener('change', () => handleFilterChange(prefix));
         document.getElementById(`${prefix}-filter-name`)?.addEventListener('change', () => handleFilterChange(prefix));
    });

    // Warehouse selector listener (Giữ nguyên logic, nhưng thay đổi hàm callback)
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
                dataService.handleCloudDataUpdate(cloudData); 
            });
            ['ycx', 'giocong', 'thuongnong'].forEach(ft => {
                const versionInfo = appController._localDataVersions?.[selectedKho]?.[ft];
                if (!versionInfo || !versionInfo.version ||
                    versionInfo.version === 0) {
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

    // Body click listener (Giữ nguyên logic, nhưng thay đổi hàm callback)
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
                dataService.handleDownloadAndProcessData(dataType, warehouse); 
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