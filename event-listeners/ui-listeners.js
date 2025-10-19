// Version 3.12 - Critical Fix: Correct all import paths and update click listener
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

let appController = null;

// --- HELPERS / HANDLERS ---

async function handleFileInputChange(e) {
    const fileInput = e.target;
    const file = fileInput.files[0];
    const fileType = fileInput.id.replace('file-', '');
    const dataName = fileInput.dataset.name || fileType;
    const stateKey = fileInput.dataset.stateKey;
    if (!file || !stateKey) return;

    ui.updateFileStatus(fileType, file.name, 'Đang xử lý...', 'default');
    ui.showProgressBar(fileType);

    try {
        const workbook = await appController.handleFileRead(file);
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const normalizeType = fileType.includes('thangtruoc') ? fileType.replace('-thangtruoc', '') : fileType;
        const { normalizedData, success, missingColumns } = services.normalizeData(rawData, normalizeType);
        ui.displayDebugInfo(fileType);

        if (success) {
            appState[stateKey] = normalizedData;
            if (stateKey === 'danhSachNhanVien') {
                services.updateEmployeeMaps();
                ui.populateAllFilters();
            }
            ui.updateFileStatus(fileType, file.name, `✓ Đã tải ${normalizedData.length} dòng.`, 'success');
            ui.showNotification(`Tải thành công file "${dataName}"!`, 'success');
            
            if (fileInput.dataset.saveKey) {
                await appController.storage.setItem(fileInput.dataset.saveKey, rawData);
                const savedStatusSpan = document.getElementById(`${fileType}-saved-status`);
                if (savedStatusSpan) savedStatusSpan.textContent = `Đã lưu ${normalizedData.length} dòng.`;
                ui.showNotification(`Đã lưu "${dataName}" vào bộ nhớ đệm của trình duyệt.`, 'success');
            }
            appController.updateAndRenderCurrentTab();
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
}

function handleFilterChange(prefix) {
    appState.viewingDetailFor = null;
    ui.updateEmployeeFilter(prefix);
    appController.updateAndRenderCurrentTab();
}

// --- MAIN INITIALIZER ---

export function initializeEventListeners(mainAppController) {
    appController = mainAppController;

    try {
        const multiSelectConfig = {
            removeItemButton: true,
            placeholder: true,
            placeholderValue: 'Chọn hoặc gõ để tìm...',
            searchPlaceholderValue: 'Tìm kiếm...'
        };

        const competitionMultiSelectConfig = {
            removeItemButton: true,
            placeholder: true,
            placeholderValue: 'Chọn hoặc gõ để tìm...',
            searchPlaceholderValue: 'Tìm kiếm...',
        };

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

        const singleSelectConfig = {
            searchEnabled: true,
            removeItemButton: false,
            itemSelectText: 'Chọn',
            searchPlaceholderValue: 'Tìm kiếm...'
        };
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
                    ui.updateDateSummary(document.getElementById(`${prefix}-date-summary`), instance);
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

    initializeSettingsListeners(appController);
    initializeHighlightingListeners(appController);
    initializeActionListeners();
    initializeCollaborationListeners(appController);
    initializeSortingListeners(appController);
    initializeCompetitionListeners(appController);
    dragDroplisteners.init(appController);

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
    
    document.getElementById('sknv-view-selector')?.addEventListener('click', (e) => appController.handleSknvViewChange(e));
    document.getElementById('sknv-employee-filter')?.addEventListener('change', () => sknvTab.render());
    
    document.body.addEventListener('click', (e) => {
        // === START: UPDATED CLICK LOGIC (V3.12) ===
        // This now targets '.interactive-row' which is on both summary cards and table rows
        const interactiveRow = e.target.closest('.interactive-row');
        if (interactiveRow && interactiveRow.dataset.employeeId) {
            e.preventDefault();
            
            // Prevent re-triggering if already viewing the same employee's detail
            if (appState.viewingDetailFor && appState.viewingDetailFor.employeeId === interactiveRow.dataset.employeeId) {
                return;
            }
            
            appState.viewingDetailFor = {
                employeeId: interactiveRow.dataset.employeeId,
                sourceTab: interactiveRow.dataset.sourceTab
            };
            appController.updateAndRenderCurrentTab();
            return;
        }
        // === END: UPDATED CLICK LOGIC ===

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
            if (areaToCapture) {
                captureService.captureDashboardInParts(areaToCapture, title);
            }
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
    });
    
    document.getElementById('thidua-employee-filter')?.addEventListener('change', () => ui.displayCompetitionReport('employee'));
    document.getElementById('realtime-brand-category-filter')?.addEventListener('change', () => uiRealtime.handleBrandFilterChange());
    document.getElementById('realtime-brand-filter')?.addEventListener('change', () => uiRealtime.handleBrandFilterChange());
}