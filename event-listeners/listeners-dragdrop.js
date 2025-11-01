// Version 2.2 - Add dragdrop support for pasted competition column toggles
// Version 2.1 - Add logging to diagnose re-render issue on drop
// MODULE: LISTENERS - DRAG & DROP
// Chứa logic khởi tạo và xử lý sự kiện kéo-thả cột bằng SortableJS.

import { settingsService } from '../modules/settings.service.js';

let appController = null;

/**
 * Kích hoạt SortableJS cho các thẻ tùy chỉnh cột (Bảng Hiệu quả NV LK)
 */
function activateSortableOnColumnToggles(container) {
    if (!container) return;

    const toggleContainer = container.querySelector('#efficiency-column-toggles');
    if (!toggleContainer) return;

    // Hủy bỏ instance cũ nếu có
    if (toggleContainer.sortable) {
        toggleContainer.sortable.destroy();
    }

    // Tạo instance mới
    toggleContainer.sortable = new Sortable(toggleContainer, {
        animation: 150,
        filter: '.non-draggable', 
        handle: '.drag-handle-icon',
        onEnd: (evt) => {
            const newButtonOrder = Array.from(evt.target.querySelectorAll('button.column-toggle-btn'));
            const newColumnIdOrder = newButtonOrder.map(btn => btn.dataset.columnId).filter(Boolean);
            const currentSettings = settingsService.loadEfficiencyViewSettings();
            const settingsMap = new Map(currentSettings.map(s => [s.id, s]));
            const reorderedSettings = newColumnIdOrder.map(id => settingsMap.get(id));
            
            currentSettings.forEach(setting => {
                if (!reorderedSettings.find(s => s.id === setting.id)) {
                    reorderedSettings.push(setting);
                }
            });

            settingsService.saveEfficiencyViewSettings(reorderedSettings);

            if (appController) {
                console.log("LOG: Yêu cầu render lại tab (efficiency) sau khi kéo thả."); 
                appController.updateAndRenderCurrentTab();
            }
        }
    });
}

// === START: NEW FUNCTION (v2.2) ===
/**
 * Kích hoạt SortableJS cho các thẻ tùy chỉnh cột (Bảng Thi Đua NV Dán VÀo)
 */
function activateSortableOnPastedCompToggles(container) {
    if (!container) return;

    // Target container mới
    const toggleContainer = container.querySelector('#pasted-competition-column-toggles');
    if (!toggleContainer) return;

    if (toggleContainer.sortable) {
        toggleContainer.sortable.destroy();
    }

    toggleContainer.sortable = new Sortable(toggleContainer, {
        animation: 150,
        filter: '.non-draggable',
        handle: '.drag-handle-icon',
        onEnd: (evt) => {
            // Target các nút bấm mới
            const newButtonOrder = Array.from(evt.target.querySelectorAll('button.pasted-comp-toggle-btn'));
            
            // Dùng 'tenGoc' làm ID duy nhất
            const newColumnNameOrder = newButtonOrder.map(btn => btn.dataset.columnTenGoc).filter(Boolean);
            
            // Gọi hàm settings mới
            const currentSettings = settingsService.loadPastedCompetitionViewSettings();
            
            const settingsMap = new Map(currentSettings.map(s => [s.tenGoc, s]));
            const reorderedSettings = newColumnNameOrder.map(name => settingsMap.get(name));
            
            currentSettings.forEach(setting => {
                if (!reorderedSettings.find(s => s.tenGoc === setting.tenGoc)) {
                    reorderedSettings.push(setting);
                }
            });

            // Gọi hàm save mới
            settingsService.savePastedCompetitionViewSettings(reorderedSettings);

            if (appController) {
                console.log("LOG: Yêu cầu render lại tab (pasted comp) sau khi kéo thả.");
                appController.updateAndRenderCurrentTab();
            }
        }
    });
}
// === END: NEW FUNCTION (v2.2) ===


export const dragDroplisteners = {
    /**
     * Hàm khởi tạo chính, nhận vào controller của ứng dụng.
     */
    init(mainAppController) {
        appController = mainAppController;
    },
    
    /**
     * Hàm được gọi sau mỗi lần render để kích hoạt lại tính năng kéo-thả.
     * * === MODIFIED (v2.2): Kích hoạt cho cả hai bảng ===
     */
    initializeForContainer(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            // Kích hoạt cho bảng Hiệu quả NV LK
            activateSortableOnColumnToggles(container);
            
            // Kích hoạt cho bảng Thi Đua NV Dán VÀo
            activateSortableOnPastedCompToggles(container);
        }
    }
};