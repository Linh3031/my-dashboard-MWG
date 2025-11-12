// Version 3.33 - Fix: Phá vỡ vòng lặp (circular dependency) với ui.js
// Version 3.32 - Refactor: Remove HomePage functions (moved to ui-home.js) and renderCompetitionConfigUI (moved to ui-admin.js)
// Version 3.31 - Refactor: Remove admin and filter functions (moved to ui-admin.js and ui-filters.js)
// ... (các phiên bản trước giữ nguyên)
// MODULE: UI COMPONENTS
// Chứa các hàm UI chung, tái sử dụng được trên toàn bộ ứng dụng.

import { appState } from './state.js';
import { services } from './services.js';
import { utils } from './utils.js';
import { settingsService } from './modules/settings.service.js';
// === START: SỬA LỖI VÒNG LẶP ===
// ĐÃ XÓA: import { ui } from './ui.js';
// === END: SỬA LỖI VÒNG LẶP ===
import { formatters } from './ui-formatters.js'; // (v3.26)
import { modalManager } from './ui-modal-manager.js'; // (v3.28)
import { notifications } from './ui-notifications.js'; // <<< THÊM MỚI (v3.29)
import { debugTools } from './ui-debug.js'; // <<< THÊM MỚI (v3.29)

export const uiComponents = {
    // === START: KHỐI HÀM ĐÃ BỊ XÓA (v3.31) ===
    // 5 hàm (populateAllFilters, updateBrandFilterOptions, populateCompetitionFilters, 
    // populateCompetitionBrandFilter, populateWarehouseSelector)
    // ĐÃ BỊ XÓA khỏi đây vì đã tồn tại trong 'ui-filters.js'.
    // === END: KHỐI HÀM ĐÃ BỊ XÓA ===

    renderSettingsButton(idSuffix) {
        return `<button id="settings-btn-${idSuffix}" class="settings-trigger-btn" title="Tùy chỉnh hiển thị">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>`;
    },

    // === START: KHỐI HÀM ĐÃ BỊ XÓA (v3.32) ===
    // 1 hàm (renderCompetitionConfigUI)
    // ĐÃ BỊ XÓA khỏi đây vì đã chuyển sang 'ui-admin.js'.
    // === END: KHỐI HÀM ĐÃ BỊ XÓA ===

    // === START: KHỐI HÀM ĐÃ BỊ XÓA (v3.31) ===
    // 2 hàm (populateCompetitionFilters, populateCompetitionBrandFilter)
    // ĐÃ BỊ XÓA khỏi đây vì đã tồn tại trong 'ui-filters.js'.
    // === END: KHỐI HÀM ĐÃ BỊ XÓA ===

    populateComposerDetailTags(supermarketReport) {
        // ... (Giữ nguyên)
            const qdcContainer = document.getElementById('composer-qdc-tags-container');
            const nganhHangContainer = document.getElementById('composer-nganhhang-tags-container');
            if (!qdcContainer || !nganhHangContainer) return;

            qdcContainer.innerHTML = '<h5 class="composer__tag-group-title">Chọn Nhóm Hàng QĐC</h5>';
            nganhHangContainer.innerHTML = '<h5 class="composer__tag-group-title">Chọn Ngành Hàng Chi Tiết</h5>';

            const createTagButton = (tag, text) => {
                const button = document.createElement('button');
                button.className = 'composer__tag-btn';
                button.dataset.tag = tag;
                button.textContent = text;
                return button;
            };

            if (supermarketReport && supermarketReport.qdc) {
                    const qdcItems = Object.values(supermarketReport.qdc)
                    .filter(item => item.sl > 0)
                    .sort((a,b) => b.dtqd - a.dtqd);
                qdcItems.forEach(item => {
                    const tag = `[QDC_INFO_${item.name}]`;
                    qdcContainer.appendChild(createTagButton(tag, item.name));
                });
            }
            if (supermarketReport && supermarketReport.nganhHangChiTiết) {
                const nganhHangItems = Object.values(supermarketReport.nganhHangChiTiet)
                    .filter(item => item.quantity > 0)
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 15);
                nganhHangItems.forEach(item => {
                    const cleanName = utils.cleanCategoryName(item.name);
                    const tag = `[NH_INFO_${cleanName}]`;
                    nganhHangContainer.appendChild(createTagButton(tag, cleanName));
                });
            }
    },
    
    // === START: KHỐI HÀM ĐÃ BỊ XÓA ===
    // (Đã chuyển sang ui-reports.js)
    // === END: KHỐI HÀM ĐÃ BỊ XÓA ===

    // === START: KHỐI HÀM ĐÃ BỊ XÓA (v3.31) ===
    // 1 hàm (populateWarehouseSelector)
    // ĐÃ BỊ XÓA khỏi đây vì đã tồn tại trong 'ui-filters.js'.
    // === END: KHỐI HÀM ĐÃ BỊ XÓA ===

    showProgressBar: (elementId) => { const el = document.getElementById(`progress-${elementId}`); if(el) el.classList.remove('hidden'); },
    hideProgressBar: (elementId) => { const el = document.getElementById(`progress-${elementId}`); if(el) el.classList.add('hidden'); },
    
    ...notifications, // (v3.29)

        updateFileStatus(uiId, fileName = '', statusText, statusType = 'default', showDownloadButton = false, metadata = null, dataType = '', warehouse = '') {
            const fileNameSpan = document.getElementById(`file-name-${uiId}`);
            const fileStatusSpan = document.getElementById(`file-status-${uiId}`);

            if (fileNameSpan) fileNameSpan.textContent = fileName || 'Chưa thêm file';

            if (fileStatusSpan) {
                let finalStatusText = statusText;
                let timeAgo = '';
                let buttonHTML = '';
                let countText = '';

                if (metadata && metadata.updatedAt) {
                    const timestampDate = metadata.updatedAt.toDate ? metadata.updatedAt.toDate() : new Date(metadata.updatedAt);
                    if (!isNaN(timestampDate)) {
                        timeAgo = formatters.formatTimeAgo(timestampDate); // (v3.28)
                    }
                }

                if (statusType === 'success' && metadata) {
                    countText = metadata.rowCount ? `${formatters.formatNumber(metadata.rowCount)} dòng` : ''; // (v3.28)
                    finalStatusText = `✓ Đã đồng bộ cloud ${countText} ${timeAgo}`.trim();
                } else if (statusType === 'default' && showDownloadButton && metadata) {
                    finalStatusText = `Có cập nhật mới từ ${metadata.updatedBy || 'ai đó'} ${timeAgo}`;
                }

                if (showDownloadButton && dataType && warehouse) {
                    buttonHTML = `
                        <button
                            class="download-data-btn ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                            data-type="${dataType}"
                            data-warehouse="${warehouse}"
                            title="Tải và xử lý phiên bản dữ liệu mới này">
                            Tải & Xử lý
                        </button>
                    `;
                }

                fileStatusSpan.innerHTML = `<span class="data-input-group__status-text data-input-group__status-text--${statusType}">${finalStatusText}</span>${buttonHTML}`;
            }
        },
        updatePasteStatus(uiId, statusText, statusType = 'success', metadata = null, processedCount = 0) {
            const statusSpan = document.getElementById(uiId);
            if (statusSpan) {
                let finalStatusText = statusText;
                let timeAgo = '';
                let countText = '';

                if (metadata && metadata.updatedAt) {
                    const timestampDate = metadata.updatedAt.toDate ? metadata.updatedAt.toDate() : new Date(metadata.updatedAt);
                    if (!isNaN(timestampDate)) {
                        timeAgo = formatters.formatTimeAgo(timestampDate); // (v3.28)
                    }
                }

                if (statusType === 'success' && metadata) {
                    if ((uiId === 'status-thuongerp' || uiId === 'status-thuongerp-thangtruoc' || uiId === 'status-thiduanv') && processedCount > 0) {
                        countText = `${processedCount} nhân viên`;
                    } else if (uiId === 'status-luyke') {
                        countText = '';
                    }
                    
                    finalStatusText = `✓ Đã đồng bộ cloud ${countText} ${timeAgo}`.trim();
                }

                statusSpan.textContent = finalStatusText;
                statusSpan.className = `data-input-group__status-text data-input-group__status-text--${statusType}`;
            }
        },
        togglePlaceholder: (sectionId, show) => {
            const placeholder = document.getElementById(`${sectionId}-placeholder`);
            const content = document.getElementById(`${sectionId}-content`);
            if (placeholder && content) {
                placeholder.classList.toggle('hidden', !show);
                content.classList.toggle('hidden', show);
            }
        },

    ...formatters, // (v3.26)
    ...modalManager, // (v3.28)

    handleSubTabClick(button) {
        const nav = button.closest('nav');
        if (!nav) return;
        const targetId = button.dataset.target;
        const contentContainer = document.getElementById(nav.dataset.contentContainer);
        if (!contentContainer) return;

        nav.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        contentContainer.querySelectorAll('.sub-tab-content').forEach(content => content.classList.toggle('hidden', content.id !== targetId));
    },
    toggleFilterSection(targetId) {
        const targetContainer = document.getElementById(targetId);
        const button = document.querySelector(`.toggle-filters-btn[data-target="${targetId}"]`);
        if (targetContainer && button) {
            targetContainer.classList.toggle('hidden');
            const isHidden = targetContainer.classList.contains('hidden');
            button.classList.toggle('active', !isHidden);
            const textSpan = button.querySelector('.text');
            if (textSpan) textSpan.textContent = isHidden ? 'Hiện bộ lọc nâng cao' : 'Ẩn bộ lọc nâng cao';
            const icon = button.querySelector('.icon');
            if(icon) icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    },
    toggleDebugTool(button) {
        const container = document.getElementById('debug-tool-container');
        if (container) {
                container.classList.toggle('hidden');
            button.textContent = container.classList.contains('hidden') ? 'Hiển thị Công cụ Gỡ lỗi' : 'Ẩn Công cụ Gỡ lỗi';
        }
    },
    showHelpModal(helpId) {
        const titleEl = document.getElementById('help-modal-title');
        const contentEl = document.getElementById('help-modal-content');
        if (!titleEl || !contentEl) return;
        const title = `Hướng dẫn cho Tab ${helpId.charAt(0).toUpperCase() + helpId.slice(1)}`;
        const content = appState.helpContent[helpId] || "Nội dung hướng dẫn không có sẵn.";
        titleEl.textContent = title;
        contentEl.innerHTML = content.replace(/\n/g, '<br>');
        this.toggleModal('help-modal', true);
    },
    showComposerModal(sectionId) {
            this.toggleModal('composer-modal', true);
        const firstTextarea = document.querySelector('#composer-context-content textarea');
        firstTextarea?.focus();
    },
        insertComposerTag(textarea, tag) {
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const textToInsert = tag || '';
        textarea.value = `${textarea.value.substring(0, start)}${textToInsert}${textarea.value.substring(end)}`;
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
    },
    showPreviewAndCopy(processedText) {
        const previewContentEl = document.getElementById('preview-modal-content');
        if (!previewContentEl) return;
        previewContentEl.textContent = processedText;
        this.toggleModal('preview-modal', true);
    },
    copyFromPreview() {
        const contentEl = document.getElementById('preview-modal-content');
        if (!contentEl) return;
        const content = contentEl.textContent;
        navigator.clipboard.writeText(content)
                .then(() => {
                // === START: SỬA LỖI VÒNG LẶP ===
                // Sử dụng 'this.showNotification' thay vì 'ui.showNotification'
                this.showNotification('Đã sao chép nội dung!', 'success');
                // Sử dụng 'this.toggleModal' thay vì 'ui.toggleModal'
                this.toggleModal('preview-modal', false);
                // === END: SỬA LỖI VÒNG LẶP ===
                })
                .catch(err => {
                console.error('Lỗi sao chép:', err);
                // === START: SỬA LỖI VÒNG LẶP ===
                // Sử dụng 'this.showNotification'
                this.showNotification('Lỗi khi sao chép.', 'error');
                // === END: SỬA LỖI VÒNG LẶP ===
                });
    },

    // === START: KHỐI HÀM ĐÃ BỊ XÓA (v3.31) ===
    // 1 hàm (renderAdminHelpEditors)
    // ĐÃ BỊ XÓA khỏi đây vì đã chuyển sang 'ui-admin.js'.
    // === END: KHỐI HÀM ĐÃ BỊ XÓA ===

    // === START: KHỐI HÀM ĐÃ BỊ XÓA (v3.32) ===
    // 3 hàm (renderHomePage, renderUpdateHistory, renderFeedbackSection)
    // ĐÃ BỊ XÓA khỏi đây vì đã chuyển sang 'ui-home.js'.
    // === END: KHỐI HÀM ĐÃ BỊ XÓA ===

    applyInterfaceSettings(settings) {
            const root = document.documentElement;
            if (settings.kpiCard1Bg) root.style.setProperty('--kpi-card-1-bg', settings.kpiCard1Bg);
            if (settings.kpiCard2Bg) root.style.setProperty('--kpi-card-2-bg', settings.kpiCard2Bg);
            if (settings.kpiCard3Bg) root.style.setProperty('--kpi-card-3-bg', settings.kpiCard3Bg);
            if (settings.kpiCard4Bg) root.style.setProperty('--kpi-card-4-bg', settings.kpiCard4Bg);
            if (settings.kpiCard5Bg) root.style.setProperty('--kpi-card-5-bg', settings.kpiCard5Bg);
            if (settings.kpiCard6Bg) root.style.setProperty('--kpi-card-6-bg', settings.kpiCard6Bg);
            if (settings.kpiCard7Bg) root.style.setProperty('--kpi-card-7-bg', settings.kpiCard7Bg);
            if (settings.kpiCard8Bg) root.style.setProperty('--kpi-card-8-bg', settings.kpiCard8Bg);
            if (settings.kpiTitleColor) root.style.setProperty('--kpi-title-color', settings.kpiTitleColor);
            if (settings.kpiMainColor) root.style.setProperty('--kpi-main-color', settings.kpiMainColor);
            if (settings.kpiSubColor) root.style.setProperty('--kpi-sub-color', settings.kpiSubColor);
        },

    ...debugTools, // (v3.29)

    // === START: KHỐI HÀM ĐÃ BỊ XÓA (v3.31) ===
    // 2 hàm (renderUserStatsTable, renderCompetitionNameMappingTable)
    // ĐÃ BỊ XÓA khỏi đây vì đã chuyển sang 'ui-admin.js'.
    // === END: KHỐI HÀM ĐÃ BỊ XÓA ===
};