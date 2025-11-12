// Version 1.8 - Fix "Ghost Bug" by re-rendering lists on goal drawer open
// MODULE: LISTENERS - SETTINGS
// Chứa logic sự kiện cho các drawers Cài đặt và các Modals.

import { ui } from '../ui.js';
import { settingsService } from '../modules/settings.service.js';
import { appState } from '../state.js';
// import { firebase } from '../firebase.js'; // <-- ĐÃ XÓA
import { adminService } from '../services/admin.service.js'; // <-- ĐÃ THÊM 
import { services } from '../services.js'; // *** NEW (v1.5) ***
import { adminModal } from '../main.js'; // <--- THAY ĐỔI 1: Import modal Svelte

export function initializeSettingsListeners(appController) {
    // *** NEW (v1.5): Helper debounce function ***
    let debounceTimer;
    const debounce = (func, delay) => {
        return (...args) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    // *** NEW (v1.5): Create a debounced save function (e.g., wait 1 second after last keystroke) ***
    const debouncedSaveMappings = debounce((mappings) => {
        // 1. Save to Firestore
        // === START: TÁI CẤU TRÚC (RE-WIRING) ===
        adminService.saveCompetitionNameMappings(mappings); // 
        // === END: TÁI CẤU TRÚC (RE-WIRING) ===
        ui.showNotification('Đã tự động lưu tên rút gọn lên Cloud!', 'success');
        
        // 2. (Bug 1 Fix) Re-process pasted data with new names
        const pastedText = document.getElementById('paste-thiduanv')?.value || '';
        
        // Chỉ xử lý lại nếu đã có dữ liệu được dán và xử lý trước đó
        // `appState.pastedThiDuaReportData` sẽ có dữ liệu sau lần dán đầu tiên
        if (pastedText && appState.pastedThiDuaReportData) { 
            console.log("Re-processing pasted thi dua data after name change...");
            try {
                const parsedData = services.parsePastedThiDuaTableData(pastedText);
                if (parsedData.success) {
                    // Use the NEW mappings from appState
                    appState.pastedThiDuaReportData = services.processThiDuaNhanVienData(parsedData, appState.competitionData);
                    // Save the re-processed data to localStorage
                    localStorage.setItem('daily_paste_thiduanv', JSON.stringify(appState.pastedThiDuaReportData));
                    
                    // Re-render the current tab if it's the SKNV tab
                    const activeTab = document.querySelector('.page-section:not(.hidden)');
                    if (activeTab && activeTab.id === 'health-employee-section') {
                        appController.updateAndRenderCurrentTab();
                    }
                }
            } catch (e) {
                 console.error("Error re-processing pasted data after name mapping change:", e);
            }
        }
    }, 1000); // 1000ms (1 second) delay

    // --- Open/Close Modals & Drawers ---
    // <--- THAY ĐỔI 2: Giữ nguyên code bạn đã sửa
    document.getElementById('admin-access-btn')?.addEventListener('click', () => {
      if (adminModal) adminModal.$set({ isVisible: true }); // Hiện modal Svelte
    });
    // <--- THAY ĐỔI 3: XÓA 2 DÒNG BÊN DƯỚI (nếu bạn chưa xóa)
    // document.getElementById('admin-submit-btn')?.addEventListener('click', () => appController.handleAdminLogin());
    // document.getElementById('admin-cancel-btn')?.addEventListener('click', () => ui.toggleModal('admin-modal', false));
    
    document.getElementById('interface-settings-btn')?.addEventListener('click', () => ui.toggleDrawer('interface-drawer', true));
    
    // === START: SỬA LỖI (Bug 3 - Lỗi "Ma") ===
    document.getElementById('goal-settings-btn')?.addEventListener('click', () => {
        // Render lại cả hai danh sách MỖI KHI MỞ drawer để xóa trạng thái "ma"
        // (Đây là các hàm trong ui-admin.js, được export qua ui.js)
        ui.renderCompetitionConfigUI(); // Render lại list "Thi đua Tùy chỉnh"
        ui.renderSpecialProgramConfigUI(); // Render lại list "SP Đặc Quyền"
        
        // Mở drawer sau khi đã render
        ui.toggleDrawer('goal-drawer', true);
    });
    // === END: SỬA LỖI (Bug 3) ===

    document.querySelectorAll('.close-drawer-btn, #drawer-overlay').forEach(el => el.addEventListener('click', () => ui.closeAllDrawers()));

    // --- Interface Settings ---
    document.querySelectorAll('.contrast-selector').forEach(sel => sel.addEventListener('change', (e) => appController.handleContrastChange(e)));
    document.getElementById('global-font-size-slider')?.addEventListener('input', (e) => settingsService.handleFontSizeChange(e, 'global'));
    document.getElementById('kpi-font-size-slider')?.addEventListener('input', (e) => settingsService.handleFontSizeChange(e, 'kpi'));
    document.querySelectorAll('.kpi-color-input').forEach(picker => picker.addEventListener('input', () => settingsService.saveInterfaceSettings()));

    // --- Goal Settings ---
    document.getElementById('rt-goal-warehouse-select')?.addEventListener('change', () => settingsService.loadAndApplyRealtimeGoalSettings());
    document.getElementById('luyke-goal-warehouse-select')?.addEventListener('change', () => settingsService.loadAndApplyLuykeGoalSettings());
    document.querySelectorAll('.rt-goal-input, .rt-setting-input').forEach(input => input.addEventListener('input', () => {
         settingsService.saveRealtimeGoalSettings();
        appController.updateAndRenderCurrentTab();
    }));
    document.querySelectorAll('.luyke-goal-input').forEach(input => input.addEventListener('input', () => {
         settingsService.saveLuykeGoalSettings();
         appController.updateAndRenderCurrentTab();
    }));
    
    // --- Declaration Settings ---
    document.getElementById('save-declaration-btn')?.addEventListener('click', () => appController.saveDeclarations());

    // --- Global Modals (Help, etc.) & Debug Tool ---
    document.getElementById('toggle-debug-btn')?.addEventListener('click', (e) => ui.toggleDebugTool(e.currentTarget));
    
    // --- Event Delegation for dynamically added elements --- 
    document.body.addEventListener('click', (e) => {
        const helpTrigger = e.target.closest('.page-header__help-btn');
        if(helpTrigger) {
            ui.showHelpModal(helpTrigger.dataset.helpId);
        }

        const closeModalTrigger = e.target.closest('[data-close-modal]');
        if (closeModalTrigger) {
            const modal = closeModalTrigger.closest('.modal');
            if(modal) {
                 ui.toggleModal(modal.id, false);
            }
        }
        
        const selectionSaveBtn = e.target.closest('#selection-modal-save-btn');
        if (selectionSaveBtn) {
            const modal = document.getElementById('selection-modal');
            const settingType = modal.dataset.settingType;

            const selectedItems = [];
            document.querySelectorAll('#selection-modal-list input[type="checkbox"]:checked').forEach(checkbox => {
                selectedItems.push(checkbox.value);
            });

            if (settingType === 'efficiencyView') {
                // Logic cũ này vẫn có thể được sử dụng bởi modal, nhưng UI mới sẽ dùng logic riêng
                const allItems = settingsService.loadEfficiencyViewSettings();
                const updatedItems = allItems.map(item => ({...item, visible: selectedItems.includes(item.id)}));
                settingsService.saveEfficiencyViewSettings(updatedItems);
            } else if (settingType === 'qdcView') {
                settingsService.saveQdcViewSettings(selectedItems);
            } else if (settingType === 'categoryView') {
                 settingsService.saveCategoryViewSettings(selectedItems);
            }

            ui.toggleModal('selection-modal', false);
            ui.showNotification('Đã lưu cài đặt hiển thị!', 'success');
            appController.updateAndRenderCurrentTab();
        }

        // === LOGIC TÙY CHỈNH CỘT (HIỆU QUẢ NV LK) ===
        const columnToggleButton = e.target.closest('.column-toggle-btn');
        if (columnToggleButton && columnToggleButton.closest('#efficiency-column-toggles')) {
            e.preventDefault();
            const columnId = columnToggleButton.dataset.columnId;
            
            // 1. Tải cài đặt hiện tại
            const currentSettings = settingsService.loadEfficiencyViewSettings();
            
            // 2. Thay đổi trạng thái của cột được nhấp
            const newSettings = currentSettings.map(col => {
                 if (col.id === columnId) {
                    return { ...col, visible: !col.visible };
                 }
                return col;
            });

            // 3. Lưu cài đặt mới
            settingsService.saveEfficiencyViewSettings(newSettings);
            
            // 4. Render lại tab để áp dụng thay đổi
            appController.updateAndRenderCurrentTab();
        }
        
        // === START: NEW LOGIC (v1.6) - TÙY CHỈNH CỘT (THI ĐUA NV DÁN VÀO) ===
        const pastedCompToggleButton = e.target.closest('.pasted-comp-toggle-btn');
        if (pastedCompToggleButton && pastedCompToggleButton.closest('#pasted-competition-column-toggles')) {
            e.preventDefault();
            const columnTenGoc = pastedCompToggleButton.dataset.columnTenGoc; // Dùng tên gốc làm ID
            
            // 1. Tải cài đặt hiện tại
            const currentSettings = settingsService.loadPastedCompetitionViewSettings();
            
            // 2. Thay đổi trạng thái
            const newSettings = currentSettings.map(col => {
                if (col.tenGoc === columnTenGoc) {
                    return { ...col, visible: !col.visible };
                }
                return col;
            });
            
            // 3. Lưu cài đặt mới
            settingsService.savePastedCompetitionViewSettings(newSettings);
            
            // 4. Render lại tab
            appController.updateAndRenderCurrentTab();
        }
        // === END: NEW LOGIC (v1.6) ===
    });

    // *** MODIFIED (v1.5): Event delegation for auto-saving competition name mappings ***
    document.body.addEventListener('input', (e) => {
        const mappingInput = e.target.closest('.competition-name-input');
        
        if (mappingInput) {
            const originalName = mappingInput.dataset.originalName;
            const shortName = mappingInput.value.trim();
            
            if (originalName) {
                if (!appState.competitionNameMappings) {
                    appState.competitionNameMappings = {};
                }
                // 1. Update the state immediately
                appState.competitionNameMappings[originalName] = shortName;
                
                // 2. Call the debounced function to save to Firestore & re-process data
                debouncedSaveMappings(appState.competitionNameMappings);
            }
        }
    });
    // *** END MODIFIED ***

    const searchInput = document.getElementById('selection-modal-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('#selection-modal-list .selection-item').forEach(item => {
                 const label = item.querySelector('label').textContent.toLowerCase();
                item.style.display = label.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}