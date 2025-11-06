// Version 3.30 - Refactor: Moved report rendering functions to ui-reports.js
// Version 3.29 - Refactor: Extract notifications & debugTools
// Version 3.28 - Refactor: Extract modalManager to ui-modal-manager.js
// Version 3.27 - Fix: Populate warehouse selectors in Goal Settings drawer
// Version 3.26 - Refactor: Extract formatters to ui-formatters.js
// Version 3.25 - Add missing functions: populateAllFilters (fixes F5 crash) and updateBrandFilterOptions (fixes Realtime crash)
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
    // === START: NEW FUNCTION (FIX FOR VẤN ĐỀ 1) ===
    /**
     * Điền dữ liệu vào tất cả các bộ lọc (Kho, Bộ phận, Nhân viên) trên các tab.
     * Được gọi sau khi DSNV được tải.
     */
    populateAllFilters() {
        console.log("[ui-components.js populateAllFilters] Đang điền dữ liệu vào tất cả bộ lọc...");
        if (!appState.danhSachNhanVien || appState.danhSachNhanVien.length === 0) {
            console.warn("[ui-components.js populateAllFilters] DSNV trống, không thể điền bộ lọc.");
            return;
        }

        try {
            const uniqueWarehouses = [...new Set(appState.danhSachNhanVien.map(nv => nv.maKho).filter(Boolean))].sort();
            const uniqueDepartments = [...new Set(appState.danhSachNhanVien.map(nv => nv.boPhan).filter(Boolean))].sort();
            const allEmployees = [...appState.danhSachNhanVien].sort((a, b) => a.hoTen.localeCompare(b.hoTen));

            const warehouseOptions = [{ value: '', label: 'Tất cả Kho', selected: true }]
                .concat(uniqueWarehouses.map(item => ({ value: item, label: item })));
            
            const departmentOptions = [{ value: '', label: 'Tất cả Bộ phận', selected: true }]
                .concat(uniqueDepartments.map(item => ({ value: item, label: item })));

            const employeeOptions = allEmployees.map(item => ({
                value: String(item.maNV),
                label: `${item.hoTen} - ${item.maNV} (${item.boPhan})`
            }));

            ['luyke', 'sknv', 'realtime'].forEach(prefix => {
                const whChoices = appState.choices[`${prefix}_warehouse`];
                if (whChoices) {
                    const currentVal = whChoices.getValue(true);
                    whChoices.clearStore();
                    whChoices.setChoices(warehouseOptions, 'value', 'label', true);
                    if (currentVal) whChoices.setValue([currentVal]);
                }
                
                const deptChoices = appState.choices[`${prefix}_department`];
                if (deptChoices) {
                    const currentVal = deptChoices.getValue(true);
                    deptChoices.clearStore();
                    deptChoices.setChoices(departmentOptions, 'value', 'label', true);
                    if (currentVal) deptChoices.setValue([currentVal]);
                }

                const empChoices = appState.choices[`${prefix}_employee`];
                if (empChoices) {
                    const currentVal = empChoices.getValue(true);
                    empChoices.clearStore();
                    empChoices.setChoices(employeeOptions, 'value', 'label', true);
                    if (currentVal) empChoices.setValue(currentVal);
                }
            });

            // === START: SỬA LỖI (v3.27) - Điền dữ liệu cho Goal Settings Drawer ===
            try {
                const goalWarehouseOptions = uniqueWarehouses.map(item => ({ value: item, label: item }));
                
                const luykeGoalSelect = document.getElementById('luyke-goal-warehouse-select');
                if (luykeGoalSelect) {
                    luykeGoalSelect.innerHTML = goalWarehouseOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
                }

                const rtGoalSelect = document.getElementById('rt-goal-warehouse-select');
                if (rtGoalSelect) {
                    rtGoalSelect.innerHTML = goalWarehouseOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
                }
                
                // Sau khi điền, gọi hàm load setting để chọn đúng kho (nếu có)
                settingsService.loadAndApplyLuykeGoalSettings();
                settingsService.loadAndApplyRealtimeGoalSettings();

            } catch (goalError) {
                console.error("[ui-components.js populateAllFilters] Lỗi khi điền bộ lọc cho Goal Drawer:", goalError);
            }
            // === END: SỬA LỖI (v3.27) ===

            console.log("[ui-components.js populateAllFilters] Đã điền xong bộ lọc.");
        } catch (error) {
            console.error("[ui-components.js populateAllFilters] Lỗi nghiêm trọng khi điền bộ lọc:", error);
        }
    },
    // === END: NEW FUNCTION ===

    // === START: NEW FUNCTION (FIX FOR VẤN ĐỀ 4) ===
    /**
     * Cập nhật danh sách 'Hãng' dựa trên 'Ngành hàng' đã chọn trong tab Realtime.
     * @param {string} selectedCategory - Ngành hàng đã chọn.
     */
    updateBrandFilterOptions(selectedCategory) {
        const brandFilterEl = document.getElementById('realtime-brand-filter');
        const brandChoices = appState.choices['realtime_brand_filter']; 
        
        if (!brandFilterEl || !brandChoices) {
            console.warn("[updateBrandFilterOptions] Lỗi: Brand filter hoặc Choices instance chưa sẵn sàng.");
            return;
        }

        let availableBrands = [];
        if (selectedCategory) {
            // Lọc các hãng dựa trên ngành hàng đã chọn trong dữ liệu realtime
            availableBrands = [...new Set(appState.realtimeYCXData
                .filter(row => utils.cleanCategoryName(row.nganhHang) === selectedCategory)
                .map(row => row.nhaSanXuat || 'Hãng khác')
                .filter(Boolean))
            ].sort();
        } else {
            // Nếu không chọn ngành hàng, hiển thị tất cả hãng có trong dữ liệu realtime
            availableBrands = [...new Set(appState.realtimeYCXData
                .map(row => row.nhaSanXuat || 'Hãng khác')
                .filter(Boolean))
            ].sort();
        }

        // Tạo danh sách options
        let brandOptions = [{ value: '', label: 'Tất cả các hãng', selected: true }];
        brandOptions = brandOptions.concat(availableBrands.map(brand => ({ value: brand, label: brand })));
        
        // Lấy giá trị hiện tại để cố gắng bảo toàn lựa chọn
        const currentValue = brandChoices.getValue(true);
        
        // Cập nhật Choices.js
        brandChoices.clearStore();
        brandChoices.setChoices(brandOptions, 'value', 'label', true);
        
        // Cố gắng đặt lại giá trị cũ nếu nó vẫn tồn tại trong danh sách mới
        if (currentValue && availableBrands.includes(currentValue)) {
            brandChoices.setValue([currentValue]);
        } else {
             brandChoices.setValue(['']); // Reset về "Tất cả"
        }
    },
    // === END: NEW FUNCTION ===

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
    populateCompetitionFilters() {
        // ... (Giữ nguyên)
        const groupSelectInstance = appState.choices['competition_group'];
        if (!groupSelectInstance) return;
        const uniqueGroups = [...new Set(appState.categoryStructure.map(item => utils.cleanCategoryName(item.nhomHang)).filter(Boolean))].sort();
        const groupOptions = uniqueGroups.map(group => ({ value: group, label: group }));
        groupSelectInstance.clearStore();
        groupSelectInstance.setChoices(groupOptions, 'value', 'label', true);
    },
    populateCompetitionBrandFilter() {
        // ... (Giữ nguyên)
        const brandSelectInstance = appState.choices['competition_brand'];
        if (!brandSelectInstance) return;
        const brands = appState.brandList || [];
        const brandOptions = brands.map(brand => ({ value: brand, label: brand }));
        brandSelectInstance.clearStore();
        brandSelectInstance.setChoices(brandOptions, 'value', 'label', true);
    },
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
         if (supermarketReport && supermarketReport.nganhHangChiTiet) {
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

    populateWarehouseSelector() {
        // ... (Giữ nguyên)
        const selector = document.getElementById('data-warehouse-selector');
        if (!selector) {
            console.error("Không tìm thấy #data-warehouse-selector");
            return;
        }

        if (!appState.danhSachNhanVien || appState.danhSachNhanVien.length === 0) {
            selector.innerHTML = '<option value="">-- Vui lòng tải Danh sách Nhân viên --</option>';
            selector.disabled = true;
            console.log("populateWarehouseSelector: DSNV trống.");
            return;
        }

        const uniqueWarehouses = [...new Set(appState.danhSachNhanVien.map(nv => String(nv.maKho).trim()).filter(Boolean))].sort();
        console.log("populateWarehouseSelector: Các kho tìm thấy (dạng chuỗi):", uniqueWarehouses);

        let optionsHTML = '<option value="">-- Chọn Kho --</option>';
        optionsHTML += uniqueWarehouses.map(kho => `<option value="${kho}">${kho}</option>`).join('');
        selector.innerHTML = optionsHTML;
        selector.disabled = false;

        let currentSelected = appState.selectedWarehouse ? String(appState.selectedWarehouse).trim() : null;
        if (!currentSelected) {
             const storedValue = localStorage.getItem('selectedWarehouse');
             currentSelected = storedValue ? String(storedValue).trim() : '';
        }
        console.log("populateWarehouseSelector: Kho đang chọn (state/local, dạng chuỗi):", currentSelected);
        if (currentSelected && uniqueWarehouses.includes(currentSelected)) {
            selector.value = currentSelected;
            if (appState.selectedWarehouse !== currentSelected) {
                 appState.selectedWarehouse = currentSelected;
                 console.log("populateWarehouseSelector: Đã cập nhật state.selectedWarehouse thành:", currentSelected);
            }
            console.log("populateWarehouseSelector: Đã chọn kho:", selector.value);
        } else {
             if (currentSelected && !uniqueWarehouses.includes(currentSelected)) {
                 console.log(`populateWarehouseSelector: Kho đã lưu '${currentSelected}' không hợp lệ (không có trong ${uniqueWarehouses.join(',')}), đang reset.`);
                 appState.selectedWarehouse = null;
                 localStorage.removeItem('selectedWarehouse');
                 selector.value = "";
                 console.log("populateWarehouseSelector: Reset state về null và selector về '-- Chọn Kho --'.");
             } else if (!currentSelected) {
                 console.log("populateWarehouseSelector: Không có kho nào được lưu.");
                 appState.selectedWarehouse = null;
                 selector.value = "";
                 console.log("populateWarehouseSelector: Reset state về null và selector về '-- Chọn Kho --'.");
             } else {
                 console.log(`populateWarehouseSelector: Kho '${currentSelected}' hợp lệ hoặc không có gì để reset.`);
             }
        }
    },

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
    renderAdminHelpEditors() {
         if (appState.isAdmin) {
            const dataEl = document.getElementById('edit-help-data');
            if (dataEl) dataEl.value = appState.helpContent.data || '';
            const luykeEl = document.getElementById('edit-help-luyke');
            if (luykeEl) luykeEl.value = appState.helpContent.luyke || '';
            const sknvEl = document.getElementById('edit-help-sknv');
            if (sknvEl) sknvEl.value = appState.helpContent.sknv || '';
            const realtimeEl = document.getElementById('edit-help-realtime');
            if (realtimeEl) realtimeEl.value = appState.helpContent.realtime || '';
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

    // *** MODIFIED FUNCTION (v3.21) - SỬA LỖI CÚ PHÁP ***
    renderUserStatsTable(users) {
        const container = document.getElementById('user-stats-container');
        if (!container) return;

        if (!users || users.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Không có dữ liệu người dùng.</p>';
            return;
        }

        const sortState = appState.sortState.user_stats || { key: 'lastLogin', direction: 'desc' };
        const { key, direction } = sortState;

        const sortedUsers = [...users].sort((a, b) => {
            let valA = a[key];
             let valB = b[key];

            if (key === 'lastLogin') {
                valA = valA instanceof Date ? valA.getTime() : 0;
                valB = valB instanceof Date ? valB.getTime() : 0;
            }
            else if (key === 'loginCount' || key === 'actionsTaken') {
                 valA = Number(valA) || 0;
                 valB = Number(valB) || 0;
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        let tableHTML = `
            <div class="overflow-x-auto max-h-[600px]">
                <table class="min-w-full text-sm table-bordered table-striped" data-table-type="user_stats">
                     <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold sticky top-0">
                        <tr>
                            <th class="${headerClass('email')}" data-sort="email">Email <span class="sort-indicator"></span></th>
                            <th class="${headerClass('loginCount')} text-right" data-sort="loginCount">Lượt truy cập <span class="sort-indicator"></span></th>
                            <th class="${headerClass('actionsTaken')} text-right" data-sort="actionsTaken">Lượt sử dụng <span class="sort-indicator"></span></th>
                             <th class="${headerClass('lastLogin')} text-right" data-sort="lastLogin">Lần cuối truy cập <span class="sort-indicator"></span></th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sortedUsers.forEach(user => {
            const lastLoginDate = user.lastLogin instanceof Date ? user.lastLogin : null;
            const formattedLastLogin = lastLoginDate
                ? `${lastLoginDate.toLocaleDateString('vi-VN')} ${lastLoginDate.toLocaleTimeString('vi-VN')}`
                 : 'Chưa rõ';

            // *** SỬA LỖI CÚ PHÁP: Đã sửa cách nhúng biến vào template string ***
            tableHTML += `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-medium text-gray-900">${user.email}</td>
                    <td class="px-4 py-2 text-right font-bold">${formatters.formatNumber(user.loginCount || 0)}</td>
                    <td class="px-4 py-2 text-right font-bold">${formatters.formatNumber(user.actionsTaken || 0)}</td>
                     <td class="px-4 py-2 text-right">${formattedLastLogin}</td>
                </tr>
            `;
            // *** KẾT THÚC SỬA LỖI ***
        });

        tableHTML += `</tbody></table></div>`;
        container.innerHTML = tableHTML;
    },
    // *** END MODIFIED FUNCTION ***

    // *** START: NEW FUNCTION (v3.23) ***
    /**
     * Render bảng ánh xạ tên thi đua trong Tab Khai báo.
     */
    renderCompetitionNameMappingTable() {
        const container = document.getElementById('competition-name-mapping-container');
        if (!container) return;

        const mappings = appState.competitionNameMappings || {};
        const mappingEntries = Object.entries(mappings);

        if (mappingEntries.length === 0) {
             container.innerHTML = '<p class="text-gray-500 italic">Vui lòng dán dữ liệu "Thi đua nhân viên" ở tab "Cập nhật dữ liệu" để hệ thống tự động trích xuất tên...</p>';
            return;
        }

        let tableHTML = `
            <table class="min-w-full text-sm table-bordered bg-white">
                <thead class="text-xs text-slate-800 uppercase bg-slate-100 font-bold">
                    <tr>
                        <th class="px-4 py-2 text-left w-1/2">Tên Gốc (Từ dữ liệu dán)</th>
                         <th class="px-4 py-2 text-left w-1/2">Tên Rút Gọn (Nhập để thay thế)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        mappingEntries.forEach(([originalName, shortName]) => {
            tableHTML += `
                <tr class="border-t hover:bg-gray-50">
                    <td class="px-4 py-2 text-gray-600 align-top text-xs">
                         ${originalName}
                    </td>
                    <td class="px-4 py-2 align-top">
                        <input 
                            type="text" 
                            class="competition-name-input w-full p-1 border rounded-md text-sm" 
                             value="${shortName || ''}" 
                            data-original-name="${originalName}"
                            placeholder="Nhập tên rút gọn..."
                        >
                    </td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        container.innerHTML = tableHTML;
    }
    // *** END: NEW FUNCTION (v3.23) ***
};