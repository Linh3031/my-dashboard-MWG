// Version 1.9 - Add usage counter display function
// MODULE: UI COMPONENTS
// Chứa các hàm UI chung, tái sử dụng được trên toàn bộ ứng dụng.

import { appState } from './state.js';
import { services } from './services.js';
import { utils } from './utils.js';

export const uiComponents = {
    // --- GENERAL UI HELPERS ---
    showProgressBar: (elementId) => document.getElementById(`progress-${elementId}`)?.classList.remove('hidden'),
    hideProgressBar: (elementId) => document.getElementById(`progress-${elementId}`)?.classList.add('hidden'),
    
    showNotification: (message, type = 'success') => {
        const notification = document.getElementById('notification');
        if (!notification) return;
        notification.textContent = message;
        notification.className = `notification ${type === 'success' ? 'notification-success' : 'notification-error'} show`;
        setTimeout(() => notification.classList.remove('show'), 3000);
    },

    showUpdateNotification() {
        const notification = document.getElementById('update-notification');
        if (notification) {
            notification.classList.add('show');
            notification.querySelector('button').onclick = () => window.location.reload();
        }
    },
    
    // --- HÀM MỚI ĐỂ HIỂN THỊ BỘ ĐẾM ---
    updateUsageCounter: (statsData) => {
        const visitorCountEl = document.getElementById('visitor-count');
        const actionCountEl = document.getElementById('action-count');

        if (visitorCountEl) {
            visitorCountEl.textContent = statsData.pageLoads ? uiComponents.formatNumber(statsData.pageLoads) : '0';
        }
        if (actionCountEl) {
            actionCountEl.textContent = statsData.actionsTaken ? uiComponents.formatNumber(statsData.actionsTaken) : '0';
        }
    },

    updateFileStatus(fileType, fileName, statusText, statusType = 'default') {
        const fileNameSpan = document.getElementById(`file-name-${fileType}`);
        const fileStatusSpan = document.getElementById(`file-status-${fileType}`);
        if (fileNameSpan) fileNameSpan.textContent = fileName;
        if (fileStatusSpan) {
            fileStatusSpan.textContent = statusText;
            fileStatusSpan.className = `data-input-group__status-text data-input-group__status-text--${statusType}`;
        }
    },

    updatePasteStatus(elementId, statusText = '✓ Đã nhận dữ liệu.') {
        const statusSpan = document.getElementById(elementId);
        if (statusSpan) {
            statusSpan.textContent = statusText;
            statusSpan.className = 'data-input-group__status-text data-input-group__status-text--success';
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

    // --- FORMATTERS ---
    formatNumber: (value, decimals = 0) => {
        if (isNaN(value) || value === null) return '0';
        return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
    },
    
    formatRevenue(value) {
        if (!isFinite(value) || value === null || value === 0) return '-';
        const millions = value / 1000000;
        const roundedValue = Math.round(millions * 10) / 10;
        return new Intl.NumberFormat('vi-VN', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 1 
        }).format(roundedValue);
    },

    formatNumberOrDash: (value) => {
        if (!isFinite(value) || value === null || value === 0) return '-';
        const roundedValue = Math.round(value * 10) / 10;
        if (roundedValue === 0) return '-';
        return new Intl.NumberFormat('vi-VN', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 1 
        }).format(roundedValue);
    },

    formatPercentage: (value) => {
        if (!isFinite(value) || value === null) return '-';
        if (value === 0) return '-';
        return new Intl.NumberFormat('vi-VN', { 
            style: 'percent', 
            maximumFractionDigits: 0 
        }).format(value);
    },
    
    formatTimeAgo(date) {
        if (!date) return '';
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return "vài giây trước";
    },

    getShortEmployeeName(hoTen, maNV) {
        if (!hoTen) return maNV || '';
        const nameParts = hoTen.split(' ');
        const firstName = nameParts[nameParts.length - 1];
        return `${firstName} - ${maNV}`;
    },

    // --- MODALS, DRAWERS, TABS ---
    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        if (show) {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('is-visible'), 10);
        } else {
            modal.classList.remove('is-visible');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    },

    toggleDrawer(drawerId, show) {
        const drawer = document.getElementById(drawerId);
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('drawer-overlay');

        if (!drawer || !sidebar || !overlay) return;

        if (show) {
            drawer.classList.remove('hidden');
            setTimeout(() => {
                drawer.classList.add('open');
                sidebar.classList.add('menu-locked');
                overlay.classList.remove('hidden');
            }, 10);
        } else {
            drawer.classList.remove('open');
            sidebar.classList.remove('menu-locked');
            overlay.classList.add('hidden');
            setTimeout(() => drawer.classList.add('hidden'), 300);
        }
    },

    closeAllDrawers() {
        this.toggleDrawer('interface-drawer', false);
        this.toggleDrawer('goal-drawer', false);
    },
    
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
        }
    },

    toggleDebugTool(button) {
        const container = document.getElementById('debug-tool-container');
        if (container) {
            container.classList.toggle('hidden');
            button.textContent = container.classList.contains('hidden') ? 'Hiển thị Công cụ Gỡ lỗi' : 'Ẩn Công cụ Gỡ lỗi';
        }
    },

    // --- COMPOSER, HELP, FEEDBACK UI ---
    showHelpModal(helpId) {
        const title = `Hướng dẫn cho Tab ${helpId.charAt(0).toUpperCase() + helpId.slice(1)}`;
        const content = appState.helpContent[helpId] || "Nội dung hướng dẫn không có sẵn.";
        
        document.getElementById('help-modal-title').textContent = title;
        document.getElementById('help-modal-content').innerHTML = content.replace(/\n/g, '<br>');
        this.toggleModal('help-modal', true);
    },

    showComposerModal(sectionId) {
        const modal = document.getElementById('composer-modal');
        if (!modal) return;
        modal.dataset.sectionId = sectionId;
        const textarea = document.getElementById('composer-textarea');
        textarea.value = appState.composerTemplates[sectionId] || '';
        document.getElementById('composer-modal-title').textContent = `Nhận xét cho Tab ${sectionId.toUpperCase()}`;
        this.toggleModal('composer-modal', true);
    },
    
    insertComposerTag(textarea, tag) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = `${textarea.value.substring(0, start)}${tag}${textarea.value.substring(end)}`;
        textarea.focus();
        textarea.selectionEnd = start + tag.length;
    },

    showPreviewAndCopy(processedText) {
        const previewContentEl = document.getElementById('preview-modal-content');
        if (!previewContentEl) return;
        previewContentEl.textContent = processedText;
        this.toggleModal('preview-modal', true);
    },

    copyFromPreview() {
        const content = document.getElementById('preview-modal-content').textContent;
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

    renderAdminHelpEditors() {
        if (appState.isAdmin) {
            document.getElementById('edit-help-data').value = appState.helpContent.data;
            document.getElementById('edit-help-luyke').value = appState.helpContent.luyke;
            document.getElementById('edit-help-sknv').value = appState.helpContent.sknv;
            document.getElementById('edit-help-realtime').value = appState.helpContent.realtime;
        }
    },
    
    renderHomePage() {
        this.renderUpdateHistory();
        this.renderFeedbackSection();
    },

    async renderUpdateHistory() {
        const container = document.getElementById('update-history-list');
        if (!container) return;
        
        try {
            const response = await fetch(`./changelog.json?v=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error('Không thể tải lịch sử cập nhật.');
            }
            const updateHistory = await response.json();
            
            container.innerHTML = updateHistory.map(item => `
                <div class="bg-white rounded-xl shadow-md p-5 border border-gray-200">
                    <h4 class="font-bold text-blue-600 mb-2">Phiên bản ${item.version} (${item.date})</h4>
                    <ul class="list-disc list-inside text-gray-700 space-y-1 text-sm">
                        ${item.notes.map(note => `<li>${note}</li>`).join('')}
                    </ul>
                </div>
            `).join('');

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

        if (appState.feedbackList.length === 0) {
            listContainer.innerHTML = '<p class="text-center text-gray-500 mt-4">Chưa có góp ý nào.</p>';
            return;
        }

        listContainer.innerHTML = appState.feedbackList.map(item => `
            <div class="feedback-item bg-white rounded-xl shadow-md p-5 border border-gray-200" data-id="${item.id}">
                <p class="text-gray-800">${item.content}</p>
                <div class="text-xs text-gray-500 mt-3 flex justify-between items-center">
                    <span>${item.user} - ${this.formatTimeAgo(item.timestamp)}</span>
                    ${appState.isAdmin ? `<button class="reply-btn text-blue-600 hover:underline">Trả lời</button>` : ''}
                </div>
                
                <div class="ml-6 mt-4 space-y-3">
                    ${(item.replies || []).map(reply => `
                        <div class="bg-gray-100 rounded-lg p-3">
                            <p class="text-gray-700 text-sm">${reply.content}</p>
                            <div class="text-xs text-gray-500 mt-2">
                                <strong>Admin</strong> - ${this.formatTimeAgo(reply.timestamp instanceof Date ? reply.timestamp : reply.timestamp?.toDate())}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="reply-form-container hidden ml-6 mt-4">
                    <textarea class="w-full p-2 border rounded-lg text-sm" rows="2" placeholder="Viết câu trả lời..."></textarea>
                    <div class="flex justify-end gap-2 mt-2">
                        <button class="cancel-reply-btn text-sm text-gray-600 px-3 py-1 rounded-md hover:bg-gray-100">Hủy</button>
                        <button class="submit-reply-btn text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">Gửi</button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // --- SETTINGS & FILTERS UI ---
    applyInterfaceSettings(settings) {
        const root = document.documentElement;
        if (settings.kpiCard1Bg) root.style.setProperty('--kpi-card-1-bg', settings.kpiCard1Bg);
        if (settings.kpiCard2Bg) root.style.setProperty('--kpi-card-2-bg', settings.kpiCard2Bg);
        if (settings.kpiCard3Bg) root.style.setProperty('--kpi-card-3-bg', settings.kpiCard3Bg);
        if (settings.kpiCard4Bg) root.style.setProperty('--kpi-card-4-bg', settings.kpiCard4Bg);
        if (settings.kpiCard5Bg) root.style.setProperty('--kpi-card-5-bg', settings.kpiCard5Bg);
        if (settings.kpiCard6Bg) root.style.setProperty('--kpi-card-6-bg', settings.kpiCard6Bg);
        if (settings.kpiTextColor) root.style.setProperty('--kpi-text-color', settings.kpiTextColor);
    },

    displayDebugInfo(fileType) {
        const resultsContainer = document.getElementById('debug-results-container');
        if (!fileType) {
            if (resultsContainer) resultsContainer.innerHTML = '<p class="text-gray-500">Chưa có file nào được tải lên để kiểm tra.</p>';
            return;
        }
        if (resultsContainer && resultsContainer.innerHTML.includes('Chưa có file nào')) resultsContainer.innerHTML = '';

        const debugData = appState.debugInfo[fileType];
        if (!debugData) return;

        const fileName = document.querySelector(`#file-${fileType}`)?.dataset.name || fileType;
        let tableHTML = `<div class="p-2 border rounded-md bg-white mb-4"><h4 class="font-bold text-gray-800 mb-2">${fileName}</h4><table class="min-w-full text-sm">
            <thead class="bg-gray-100"><tr><th class="px-2 py-1 text-left font-semibold text-gray-600">Yêu cầu</th><th class="px-2 py-1 text-left font-semibold text-gray-600">Cột tìm thấy</th><th class="px-2 py-1 text-center font-semibold text-gray-600">Trạng thái</th></tr></thead><tbody>`;
        (debugData.required || []).forEach(res => {
            const statusClass = res.status ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
            tableHTML += `<tr class="border-t"><td class="px-2 py-1 font-medium">${res.displayName}</td><td class="px-2 py-1 font-mono">${res.foundName}</td><td class="px-2 py-1 text-center font-bold ${statusClass}">${res.status ? 'OK' : 'LỖI'}</td></tr>`;
        });
        tableHTML += `</tbody></table>`;
        if (debugData.firstFiveMsnv && debugData.firstFiveMsnv.length > 0) {
            tableHTML += `<div class="mt-2 p-2 bg-gray-50 rounded"><p class="text-xs font-semibold">5 MSNV đầu tiên đọc được:</p><ul class="text-xs font-mono list-disc list-inside">${debugData.firstFiveMsnv.map(msnv => `<li>"${msnv}"</li>`).join('')}</ul></div>`;
        }
        tableHTML += `</div>`;

        const existingEl = document.getElementById(`debug-table-${fileType}`);
        if (existingEl) {
            existingEl.innerHTML = tableHTML;
        } else if (resultsContainer) {
            const wrapper = document.createElement('div');
            wrapper.id = `debug-table-${fileType}`;
            wrapper.innerHTML = tableHTML;
            resultsContainer.appendChild(wrapper);
        }
    },
    
    displayPastedDebugInfo(dataType) {
        const container = document.getElementById('pasted-debug-results-container');
        if (!container) return;

        const debugData = appState.debugInfo[dataType];
        if (!debugData) {
            container.innerHTML = ''; // Clear if no data
            return;
        }

        let content = `<div class="p-2 border rounded-md bg-white mb-4">
            <h4 class="font-bold text-gray-800 mb-2">Chẩn đoán dữ liệu dán: ${dataType.replace('-pasted', '')}</h4>`;

        if (debugData.found && debugData.found.length > 0) {
            content += '<ul>';
            debugData.found.forEach(item => {
                content += `<li class="text-sm ${item.status ? 'text-green-700' : 'text-red-700'}"><strong>${item.name}:</strong> ${item.value}</li>`;
            });
            content += '</ul>';
        }
        content += `<p class="text-xs italic mt-2"><strong>Trạng thái xử lý:</strong> ${debugData.status}</p></div>`;
        container.innerHTML = content;
    },
    
    displayThiDuaVungDebugInfo() {
        const resultsContainer = document.getElementById('debug-results-container');
        if (!resultsContainer) return;
    
        const renderDebugTable = (title, data) => {
            if (!data || data.length === 0) {
                return `<div class="p-2 border rounded-md bg-white mb-4">
                    <h4 class="font-bold text-gray-800 mb-2">${title}</h4>
                    <p class="text-gray-500">Không có dữ liệu để hiển thị.</p>
                </div>`;
            }
    
            const headers = Object.keys(data[0]);
            let tableHTML = `<div class="p-2 border rounded-md bg-white mb-4">
                <h4 class="font-bold text-gray-800 mb-2">${title}</h4>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-xs">
                        <thead class="bg-gray-100">
                            <tr>${headers.map(h => `<th class="px-2 py-1 text-left font-semibold text-gray-600 whitespace-nowrap">${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>`;
            
            data.forEach(row => {
                tableHTML += `<tr class="border-t">`;
                headers.forEach(header => {
                    tableHTML += `<td class="px-2 py-1 font-mono">${row[header] !== undefined ? row[header] : ''}</td>`;
                });
                tableHTML += `</tr>`;
            });
    
            tableHTML += `</tbody></table></div></div>`;
            return tableHTML;
        };
    
        const tongRaw = appState.debugInfo.thiDuaVungTongRaw;
        const chiTietRaw = appState.debugInfo.thiDuaVungChiTietRaw;
    
        let finalHTML = renderDebugTable('Thi Đua Vùng - Sheet TONG (10 dòng đầu)', tongRaw);
        finalHTML += renderDebugTable('Thi Đua Vùng - Sheet CHITIET (10 dòng đầu)', chiTietRaw);
        
        const existingEl = document.getElementById('debug-table-thidua-vung');
        if (existingEl) {
            existingEl.innerHTML = finalHTML;
        } else {
            const wrapper = document.createElement('div');
            wrapper.id = `debug-table-thidua-vung`;
            wrapper.innerHTML = finalHTML;
            resultsContainer.appendChild(wrapper);
        }
    },

    populateAllFilters: () => {
        const { danhSachNhanVien } = appState;
        if (danhSachNhanVien.length === 0) return;

        const uniqueWarehouses = [...new Set(danhSachNhanVien.map(nv => nv.maKho).filter(Boolean))].sort();
        const uniqueDepartments = [...new Set(danhSachNhanVien.map(nv => nv.boPhan).filter(Boolean))].sort();

        const createChoicesOptions = (items, includeAllOption = true) => {
            const options = items.map(item => ({ value: String(item), label: String(item) }));
            if (includeAllOption) {
                options.unshift({ value: '', label: 'Tất cả' });
            }
            return options;
        };

        const warehouseChoicesOptions = createChoicesOptions(uniqueWarehouses);
        const departmentChoicesOptions = createChoicesOptions(uniqueDepartments);

        ['luyke', 'sknv', 'realtime'].forEach(prefix => {
            const warehouseInstance = appState.choices[`${prefix}_warehouse`];
            if (warehouseInstance) {
                warehouseInstance.clearStore();
                warehouseInstance.setChoices(warehouseChoicesOptions, 'value', 'label', true);
            }
            
            const departmentInstance = appState.choices[`${prefix}_department`];
            if (departmentInstance) {
                departmentInstance.clearStore();
                departmentInstance.setChoices(departmentChoicesOptions, 'value', 'label', true);
            }
            
            uiComponents.updateEmployeeFilter(prefix);
        });
        
        const createOptionsHTML = (items, includeAllOption = false) => {
             let html = includeAllOption ? '<option value="">Tất cả</option>' : '';
             html += items.map(item => `<option value="${item}">${item}</option>`).join('');
             return html;
        };
        const luykeGoalEl = document.getElementById('luyke-goal-warehouse-select');
        if (luykeGoalEl) luykeGoalEl.innerHTML = createOptionsHTML(uniqueWarehouses);
        
        const rtGoalEl = document.getElementById('rt-goal-warehouse-select');
        if (rtGoalEl) rtGoalEl.innerHTML = createOptionsHTML(uniqueWarehouses);
    },

    populateRealtimeBrandCategoryFilter: () => {
        const { realtimeYCXData } = appState;
        const realtimeBrandCategoryFilter = document.getElementById('realtime-brand-category-filter');
        if (!realtimeBrandCategoryFilter) return;

        if (realtimeYCXData.length > 0) {
            const uniqueCategories = [...new Set(realtimeYCXData.map(r => utils.cleanCategoryName(r.nganhHang)).filter(Boolean))].sort();
            let html = '<option value="">Tất cả</option>';
            html += uniqueCategories.map(item => `<option value="${item}">${item}</option>`).join('');
            realtimeBrandCategoryFilter.innerHTML = html;
        } else {
            realtimeBrandCategoryFilter.innerHTML = '<option value="">Tất cả</option>';
        }
    },

    updateEmployeeFilter: (prefix) => {
        const multiSelectInstance = appState.choices[`${prefix}_employee`];
        const selectedWarehouse = appState.choices[`${prefix}_warehouse`]?.getValue(true) || '';
        const selectedDept = appState.choices[`${prefix}_department`]?.getValue(true) || '';

        const filteredEmployees = appState.danhSachNhanVien.filter(nv => 
            (!selectedWarehouse || String(nv.maKho) == selectedWarehouse) &&
            (!selectedDept || nv.boPhan === selectedDept)
        );

        if (multiSelectInstance) {
            const currentMultiSelectValues = multiSelectInstance.getValue(true);
            const multiSelectOptions = filteredEmployees.map(nv => ({
                value: nv.maNV,
                label: `${uiComponents.getShortEmployeeName(nv.hoTen, nv.maNV)}`,
                selected: currentMultiSelectValues.includes(String(nv.maNV))
            }));
            multiSelectInstance.clearStore();
            multiSelectInstance.setChoices(multiSelectOptions, 'value', 'label', false);
        }

        const singleSelectOptions = filteredEmployees.map(nv => ({
            value: nv.maNV,
            label: uiComponents.getShortEmployeeName(nv.hoTen, nv.maNV)
        }));

        const updateSingleSelect = (instanceKey) => {
            const instance = appState.choices[instanceKey];
            if (instance) {
                const currentValue = instance.getValue(true);
                instance.clearStore();
                instance.setChoices(singleSelectOptions, 'value', 'label', false);
                
                if (currentValue && filteredEmployees.some(e => String(e.maNV) == currentValue)) {
                    instance.setValue([currentValue]);
                }
            }
        };
        
        if (prefix === 'sknv') {
            updateSingleSelect('sknv_employee_detail');
            updateSingleSelect('thidua_employee_detail');
        } else if (prefix === 'realtime') {
            updateSingleSelect('realtime_employee_detail');
        }
    },
    
    updateBrandFilterOptions(selectedCategory) {
        const brandFilter = document.getElementById('realtime-brand-filter');
        if (!brandFilter) return;

        const brands = [...new Set(appState.realtimeYCXData
            .filter(row => !selectedCategory || utils.cleanCategoryName(row.nganhHang) === selectedCategory)
            .map(row => (row.nhaSanXuat || 'Hãng khác'))
        )].sort();
        
        let html = '<option value="">Tất cả hãng</option>' + brands.map(b => `<option value="${b}">${b}</option>`).join('');
        brandFilter.innerHTML = html;
    },
    
    updateDateSummary(summaryEl, datePickerInstance) {
        if (!summaryEl || !datePickerInstance) return;
        const { selectedDates } = datePickerInstance;
        if (selectedDates.length > 1) {
            const sortedDates = selectedDates.sort((a,b) => a - b);
            summaryEl.textContent = `Đang chọn ${selectedDates.length} ngày: ${datePickerInstance.formatDate(sortedDates[0], "d/m")} - ${datePickerInstance.formatDate(sortedDates[sortedDates.length - 1], "d/m")}`;
        } else if (selectedDates.length === 1) {
            summaryEl.textContent = `Đang chọn 1 ngày`;
        } else {
            summaryEl.textContent = '';
        }
    },
};