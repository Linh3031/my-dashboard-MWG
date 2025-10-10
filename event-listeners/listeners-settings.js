// Version 1.2 - Add save handlers for QDC and Category view settings
// MODULE: LISTENERS - SETTINGS
// Chứa logic sự kiện cho các drawers Cài đặt và các Modals.

import { ui } from '../ui.js';
import { settingsService } from '../modules/settings.service.js';

export function initializeSettingsListeners(appController) {
    // --- Open/Close Modals & Drawers ---
    document.getElementById('admin-access-btn')?.addEventListener('click', () => ui.toggleModal('admin-modal', true));
    document.getElementById('admin-submit-btn')?.addEventListener('click', () => appController.handleAdminLogin());
    document.getElementById('admin-cancel-btn')?.addEventListener('click', () => ui.toggleModal('admin-modal', false));
    document.getElementById('interface-settings-btn')?.addEventListener('click', () => ui.toggleDrawer('interface-drawer', true));
    document.getElementById('goal-settings-btn')?.addEventListener('click', () => ui.toggleDrawer('goal-drawer', true));
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
                settingsService.saveEfficiencyViewSettings(selectedItems);
            } else if (settingType === 'qdcView') { // <<< THÊM LOGIC MỚI
                settingsService.saveQdcViewSettings(selectedItems);
            } else if (settingType === 'categoryView') { // <<< THÊM LOGIC MỚI
                settingsService.saveCategoryViewSettings(selectedItems);
            }

            ui.toggleModal('selection-modal', false);
            ui.showNotification('Đã lưu cài đặt hiển thị!', 'success');
            appController.updateAndRenderCurrentTab(); // Render lại tab để áp dụng thay đổi
        }
    });

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