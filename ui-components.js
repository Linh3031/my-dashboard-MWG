// Version 3.31 - Refactor: Remove admin and filter functions (moved to ui-admin.js and ui-filters.js)
// Version 3.30 - Refactor: Moved report rendering functions to ui-reports.js
// Version 3.29 - Refactor: Extract notifications & debugTools
// ... (các phiên bản trước giữ nguyên)
// MODULE: UI COMPONENTS
// Chứa các hàm UI chung, tái sử dụng được trên toàn bộ ứng dụng.

import { appState } from './state.js';
import { services } from './services.js';
import { utils } from './utils.js';
import { settingsService } from './modules/settings.service.js';
import { ui } from './ui.js';
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

    renderCompetitionConfigUI() {
        // ... (Giữ nguyên)
        const container = document.getElementById(`competition-list-container`);
        if (!container) return;
        const configs = appState.competitionConfigs || [];

        if (configs.length === 0) {
            container.innerHTML = '<p class="text-xs text-center text-gray-500 italic">Chưa có chương trình nào được tạo.</p>';
            return;
        }

        container.innerHTML = configs.map((config, index) => {
                return `
                    <div class="p-3 border rounded-lg bg-white flex justify-between items-center shadow-sm">
                        <div>
                            <div class="flex items-center gap-x-2">
                                <p class="font-bold text-gray-800">${config.name}</p>
                            </div>
                            <div class="text-xs text-gray-500 mt-1 space-y-1">
                                <p><strong>Hãng:</strong> <span class="font-semibold text-blue-600">${(config.brands || []).join(', ')}</span></p>
                                <p><strong>Nhóm hàng:</strong> <span class="font-semibold">${(config.groups || []).length > 0 ? (config.groups || []).join(', ') : 'Tất cả'}</span></p>
                            </div>
                        </div>
                        <div class="flex items-center gap-x-2 flex-shrink-0">
                            <button class="edit-competition-btn p-2 rounded-md hover:bg-gray-200 text-gray-600" data-index="${index}" title="Sửa chương trình">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="delete-competition-btn p-2 rounded-md hover:bg-red-100 text-red-600" data-index="${index}" title="Xóa chương trình">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                `;
        }).join('');
    },

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
    // displayEmployeeRevenueReport, renderRevenueTableForDepartment,
    // displayEmployeeEfficiencyReport, renderEfficiencyTableForDepartment,
    // renderCategoryTable, displayCategoryRevenueReport
    // ĐÃ BỊ XÓA KHỎI ĐÂY và chuyển sang ui-reports.js
    // === END: KHỐI HÀM ĐÃ BỊ XÓA ===

    // === START: KHỐI HÀM ĐÃ BỊ XÓA (v3.31) ===
    // 1 hàm (populateWarehouseSelector)
    // ĐÃ BỊ XÓA khỏi đây vì đã tồn tại trong 'ui-filters.js'.
    // === END: KHỐI HÀM ĐÃ BỊ XÓA ===

    // ... (Các hàm khác như showProgressBar, hideProgressBar, etc. giữ nguyên) ...
    showProgressBar: (elementId) => { const el = document.getElementById(`progress-${elementId}`); if(el) el.classList.remove('hidden'); },
    hideProgressBar: (elementId) => { const el = document.getElementById(`progress-${elementId}`); if(el) el.classList.add('hidden'); },
    
    // <<< === START: KHỐI CODE BỊ XÓA (v3.29) === >>>
    // 3 HÀM (showNotification, showUpdateNotification, updateUsageCounter)
    // ĐÃ BỊ XÓA KHỎI ĐÂY.
    // <<< === END: KHỐI CODE BỊ XÓA === >>>

    ...notifications, // <<< THÊM MỚI (v3.29)

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
                uiComponents.showNotification('Đã sao chép nội dung!', 'success');
                uiComponents.toggleModal('preview-modal', false);
                })
                .catch(err => {
                console.error('Lỗi sao chép:', err);
                    uiComponents.showNotification('Lỗi khi sao chép.', 'error');
                });
    },

    // === START: KHỐI HÀM ĐÃ BỊ XÓA (v3.31) ===
    // 1 hàm (renderAdminHelpEditors)
    // ĐÃ BỊ XÓA khỏi đây vì đã chuyển sang 'ui-admin.js'.
    // === END: KHỐI HÀM ĐÃ BỊ XÓA ===

    renderHomePage() {
        this.renderUpdateHistory();
        this.renderFeedbackSection();
    },
    async renderUpdateHistory() {
        const container = document.getElementById('update-history-list');
        if (!container) return;
        try {
                const response = await fetch(`./changelog.json?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error('Không thể tải lịch sử cập nhật.');
            const updateHistory = await response.json();
            container.innerHTML = updateHistory.map(item => `
                <div class="bg-white rounded-xl shadow-md p-5 border border-gray-200">
                        <h4 class="font-bold text-blue-600 mb-2">Phiên bản ${item.version} (${item.date})</h4>
                        <ul class="list-disc list-inside text-gray-700 space-y-1 text-sm">
                            ${item.notes.map(note => `<li>${note}</li>`).join('')}
                    </ul>
                    </div>`).join('');
        } catch (error) {
            console.error("Lỗi khi render lịch sử cập nhật:", error);
            container.innerHTML = '<p class="text-red-500">Không thể tải lịch sử cập nhật.</p>';
        }
    },
    renderFeedbackSection() {
            const composerContainer = document.getElementById('feedback-composer');
            const listContainer = document.getElementById('feedback-list');
            if (!composerContainer || !listContainer) return;

        composerContainer.innerHTML = `
                <h4 class="text-lg font-semibold text-gray-800 mb-3">Gửi góp ý của bạn</h4>
            <textarea id="feedback-textarea" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3" rows="4" placeholder="Chúng tôi luôn lắng nghe ý kiến của bạn để cải thiện công cụ tốt hơn..."></textarea>
                <button id="submit-feedback-btn" class="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition">Gửi góp ý</button>
        `;

        if (!appState.feedbackList || appState.feedbackList.length === 0) {
            listContainer.innerHTML = '<p class="text-center text-gray-500 mt-4">Chưa có góp ý nào.</p>';
            return;
        }

            listContainer.innerHTML = appState.feedbackList.map(item => {
            const userNameDisplay = item.user?.email || 'Người dùng ẩn danh';
            return `
                <div class="feedback-item bg-white rounded-xl shadow-md p-5 border border-gray-200" data-id="${item.id}">
                    <p class="text-gray-800">${item.content}</p>
                        <div class="text-xs text-gray-500 mt-3 flex justify-between items-center">
                            <span class="font-semibold">${userNameDisplay}</span>
                            <span>${formatters.formatTimeAgo(item.timestamp)}</span> 
                            ${appState.isAdmin ? `<button class="reply-btn text-blue-600 hover:underline">Trả lời</button>` : ''}
                    </div>
                    <div class="ml-6 mt-4 space-y-3">
                            ${(item.replies || []).map(reply => `
                                <div class="bg-gray-100 rounded-lg p-3">
                                <p class="text-gray-700 text-sm">${reply.content}</p>
                                    <div class="text-xs text-gray-500 mt-2">
                                        <strong>Admin</strong> - ${formatters.formatTimeAgo(reply.timestamp instanceof Date ? reply.timestamp : reply.timestamp?.toDate())} 
                                    </div>
                            </div>`).join('')}
                    </div>
                    <div class="reply-form-container hidden ml-6 mt-4">
                            <textarea class="w-full p-2 border rounded-lg text-sm" rows="2" placeholder="Viết câu trả lời..."></textarea>
                            <div class="flex justify-end gap-2 mt-2">
                            <button class="cancel-reply-btn text-sm text-gray-600 px-3 py-1 rounded-md hover:bg-gray-100">Hủy</button>
                                <button class="submit-reply-btn text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">Gửi</button>
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

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

    // <<< === START: KHỐI CODE BỊ XÓA (v3.29) === >>>
    // 4 HÀM (displayDebugInfo, displayPastedDebugInfo, displayThiDuaVungDebugInfo, renderCompetitionDebugReport)
    // ĐÃ BỊ XÓA KHỎI ĐÂY.
    // <<< === END: KHỐI CODE BỊ XÓA === >>>

    ...debugTools, // <<< THÊM MỚI (v3.29)

    // === START: KHỐI HÀM ĐÃ BỊ XÓA (v3.31) ===
    // 2 hàm (renderUserStatsTable, renderCompetitionNameMappingTable)
    // ĐÃ BỊ XÓA khỏi đây vì đã chuyển sang 'ui-admin.js'.
    // === END: KHỐI HÀM ĐÃ BỊ XÓA ===
};