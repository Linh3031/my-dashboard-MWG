// Version 1.2 - Make capture button context-aware (detail vs. summary)
// Version 1.0 - Refactored from ui-listeners.js
// MODULE: LISTENERS - ACTIONS
// Chứa logic đăng ký sự kiện cho các nút hành động chung (Chụp ảnh, Xuất Excel).

import { ui } from '../ui.js';
import { utils } from '../utils.js';
import { captureService } from '../modules/capture.service.js';
import { appState } from '../state.js'; // <-- ĐÃ THÊM

export function initializeActionListeners() {
    ['luyke', 'sknv', 'realtime'].forEach(prefix => {
        const captureBtn = document.getElementById(`capture-${prefix}-btn`);
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                const navId = prefix === 'luyke' ? 'luyke-subtabs-nav' : (prefix === 'sknv' ? 'employee-subtabs-nav' : 'realtime-subtabs-nav');
                const contentContainerId = prefix === 'luyke' ? 'luyke-subtabs-content' : (prefix === 'sknv' ? 'employee-subtabs-content' : 'realtime-subtabs-content');

                const activeTabButton = document.querySelector(`#${navId} .sub-tab-btn.active`);
                if (!activeTabButton) {
                    ui.showNotification('Không tìm thấy tab đang hoạt động.', 'error');
                    return;
                }
                
                // *** START: NEW LOGIC FOR DETAIL VIEW (v1.2) ***
                // Kiểm tra xem có đang xem chi tiết nhân viên không
                if (prefix === 'sknv' && appState.viewingDetailFor) {
                    const { employeeId, sourceTab } = appState.viewingDetailFor;
                    const activeTabTarget = activeTabButton.dataset.target;

                    let elementToCapture = null;
                    let title = '';
                    const preset = 'preset-mobile-portrait';

                    if (sourceTab === 'sknv' && activeTabTarget === 'subtab-sknv') {
                        elementToCapture = document.getElementById('sknv-detail-capture-area');
                        title = `SKNV_ChiTiet_${employeeId}`;
                    } else if (sourceTab === 'dtnv-lk' && activeTabTarget === 'subtab-doanhthu-lk') {
                        elementToCapture = document.getElementById('dtnv-lk-capture-area');
                        title = `DTLK_ChiTiet_${employeeId}`;
                    }
                    // (Bạn có thể thêm logic cho 'dtnv-rt' ở đây nếu muốn)
                    // else if (sourceTab === 'dtnv-rt' && activeTabTarget === 'subtab-realtime-nhan-vien') {
                    //     elementToCapture = document.getElementById('dtnv-rt-capture-area');
                    //     title = `DTRT_ChiTiet_${employeeId}`;
                    // }

                    if (elementToCapture) {
                        if (!elementToCapture || elementToCapture.children.length === 0) {
                            ui.showNotification('Không có nội dung chi tiết để chụp.', 'error');
                            return;
                        }
                        // Gọi hàm captureAndDownload (giống logic của nút cũ đã bị xóa)
                        captureService.captureAndDownload(elementToCapture, title, preset);
                        return; // Dừng lại, đã xử lý xong phần chụp chi tiết
                    }
                }
                // *** END: NEW LOGIC FOR DETAIL VIEW (v1.2) ***
                
                // Logic chụp tóm tắt (như cũ) chỉ chạy khi không ở chế độ xem chi tiết
                const title = activeTabButton.dataset.title || 'BaoCao';
                let elementToCapture;

                // *** START BUG 4 FIX (v1.1) ***
                // Logic đặc biệt cho tab Thi đua NV LK có view switcher
                if (prefix === 'sknv' && activeTabButton.dataset.target === 'subtab-hieu-qua-thi-dua-lk') {
                    const activeViewBtn = document.querySelector('#sknv-thidua-view-selector .view-switcher__btn.active');
                    const viewType = activeViewBtn ? activeViewBtn.dataset.view : 'program';
                    
                    if (viewType === 'program') {
                        elementToCapture = document.getElementById('competition-report-container-lk');
                    } else { // 'employee'
                        elementToCapture = document.getElementById('pasted-competition-report-container');
                    }
                } 
                // Logic đặc biệt cho tab Thi đua Vùng (Lũy kế)
                else if (prefix === 'luyke' && activeTabButton.dataset.target === 'subtab-luyke-thidua-vung') {
                    elementToCapture = document.getElementById('thidua-vung-infographic-container');
                } 
                // Logic gốc cho tất cả các tab khác
                else {
                    elementToCapture = document.querySelector(`#${contentContainerId} .sub-tab-content:not(.hidden)`);
                }
                // *** END BUG 4 FIX (v1.1) ***

                if (!elementToCapture || elementToCapture.children.length === 0) {
                    ui.showNotification('Không có nội dung để chụp.', 'error');
                    return;
                }

                captureService.captureDashboardInParts(elementToCapture, title);
            });
        }

        const exportBtn = document.getElementById(`export-${prefix}-btn`);
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const navId = prefix === 'sknv' ? 'employee-subtabs-nav' : `${prefix}-subtabs-nav`;
                const contentContainerId = prefix === 'sknv' ? 'employee-subtabs-content' : `${prefix}-subtabs-content`;
                
                const activeTabButton = document.querySelector(`#${navId} .sub-tab-btn.active`);
                let activeTabContent; // Thay đổi từ const sang let

                // *** START BUG 4 FIX (v1.1) ***
                // Logic đặc biệt cho tab Thi đua NV LK có view switcher
                if (prefix === 'sknv' && activeTabButton?.dataset.target === 'subtab-hieu-qua-thi-dua-lk') {
                    const activeViewBtn = document.querySelector('#sknv-thidua-view-selector .view-switcher__btn.active');
                    const viewType = activeViewBtn ? activeViewBtn.dataset.view : 'program';

                    if (viewType === 'program') {
                        activeTabContent = document.getElementById('competition-report-container-lk');
                    } else { // 'employee'
                        activeTabContent = document.getElementById('pasted-competition-report-container');
                    }
                } 
                // Logic gốc cho tất cả các tab khác
                else {
                    activeTabContent = document.querySelector(`#${contentContainerId} .sub-tab-content:not(.hidden)`);
                }
                // *** END BUG 4 FIX (v1.1) ***

                if (activeTabContent && activeTabButton) {
                    const title = activeTabButton.dataset.title || 'BaoCao';
                    const timestamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
                    utils.exportTableToExcel(activeTabContent, `${title}_${timestamp}`);
                } else {
                     ui.showNotification('Không tìm thấy tab để xuất.', 'error');
                }
            });
        }
    });
}