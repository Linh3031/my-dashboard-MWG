// Version 2.1 - Add logging to diagnose re-render issue on drop
// MODULE: LISTENERS - DRAG & DROP
// Chứa logic khởi tạo và xử lý sự kiện kéo-thả cột bằng SortableJS.

import { settingsService } from '../modules/settings.service.js';

let appController = null;

/**
 * Khởi tạo SortableJS trên khu vực chứa các thẻ tùy chỉnh cột.
 * @param {HTMLElement} container - Phần tử DOM chứa bảng và các nút tùy chỉnh.
 */
function activateSortableOnColumnToggles(container) {
    if (!container) return;

    const toggleContainer = container.querySelector('#efficiency-column-toggles');
    if (!toggleContainer) return;

    // Hủy bỏ instance cũ nếu có để tránh lỗi khởi tạo nhiều lần
    if (toggleContainer.sortable) {
        toggleContainer.sortable.destroy();
    }

    // Tạo instance mới
    toggleContainer.sortable = new Sortable(toggleContainer, {
        animation: 150, // Hiệu ứng chuyển động mượt mà
        filter: '.non-draggable', // Bỏ qua các phần tử có class này (ví dụ: label "Tùy chỉnh cột:")
        handle: '.drag-handle-icon', // Chỉ cho phép kéo khi bấm vào icon
        onEnd: (evt) => {
            // Lấy danh sách các thẻ <button> theo thứ tự mới
            const newButtonOrder = Array.from(evt.target.querySelectorAll('button.column-toggle-btn'));
            
            // Lấy ra ID của các cột theo thứ tự mới từ thuộc tính data-column-id
            const newColumnIdOrder = newButtonOrder.map(btn => btn.dataset.columnId).filter(Boolean);

            // Tải cài đặt hiện tại
            const currentSettings = settingsService.loadEfficiencyViewSettings();
             
            // Tạo một Map để truy cập nhanh các đối tượng cài đặt theo ID
            const settingsMap = new Map(currentSettings.map(s => [s.id, s]));

            // Tạo lại mảng cài đặt theo thứ tự mới
            const reorderedSettings = newColumnIdOrder.map(id => settingsMap.get(id));
               
            // Thêm lại các cột đã bị ẩn (nếu có) vào cuối danh sách để không làm mất chúng
            currentSettings.forEach(setting => {
                if (!reorderedSettings.find(s => s.id === setting.id)) {
                    reorderedSettings.push(setting);
                }
            });

            // Lưu lại cấu hình mới
            settingsService.saveEfficiencyViewSettings(reorderedSettings);

            // Vẽ lại toàn bộ tab để đồng bộ header, body, và footer của bảng
            if (appController) {
                console.log("LOG: Yêu cầu render lại tab sau khi kéo thả."); // <<< THÊM DÒNG NÀY ĐỂ GỠ LỖI
                appController.updateAndRenderCurrentTab();
            }
        }
    });
}


export const dragDroplisteners = {
    /**
     * Hàm khởi tạo chính, nhận vào controller của ứng dụng.
     * @param {object} mainAppController - Controller chính của ứng dụng.
     */
    init(mainAppController) {
        appController = mainAppController;
    },
    
    /**
     * Hàm được gọi sau mỗi lần render để kích hoạt lại tính năng kéo-thả.
     * @param {string} containerId - ID của container chứa bảng (ví dụ: 'efficiency-report-container').
     */
    initializeForContainer(containerId) {
        const container = document.getElementById(containerId);
        activateSortableOnColumnToggles(container);
    }
};