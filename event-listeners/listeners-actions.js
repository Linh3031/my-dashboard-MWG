// Version 1.0 - Refactored from ui-listeners.js
// MODULE: LISTENERS - ACTIONS
// Chứa logic đăng ký sự kiện cho các nút hành động chung (Chụp ảnh, Xuất Excel).

import { ui } from '../ui.js';
import { utils } from '../utils.js';
import { captureService } from '../modules/capture.service.js';

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
                
                const title = activeTabButton.dataset.title || 'BaoCao';
                let elementToCapture;

                if (prefix === 'luyke' && activeTabButton.dataset.target === 'subtab-luyke-thidua-vung') {
                    elementToCapture = document.getElementById('thidua-vung-infographic-container');
                } else {
                    elementToCapture = document.querySelector(`#${contentContainerId} .sub-tab-content:not(.hidden)`);
                }

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
                const activeTabContent = document.querySelector(`#${contentContainerId} .sub-tab-content:not(.hidden)`);
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