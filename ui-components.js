// Version 3.25 - Add missing functions: populateAllFilters (fixes F5 crash) and updateBrandFilterOptions (fixes Realtime crash)
// Version 3.24 - Add updateBrandFilterOptions to fix realtime tab crash
// Version 3.23 - Add renderCompetitionNameMappingTable
// Version 3.22 - Fix syntax error in renderUserStatsTable causing comments to display
// Version 3.21 - Add 'actionsTaken' column to renderUserStatsTable
// Version 3.20 - Add renderUserStatsTable for admin panel
// ... (các phiên bản trước giữ nguyên)
// MODULE: UI COMPONENTS
// Chứa các hàm UI chung, tái sử dụng được trên toàn bộ ứng dụng.

import { appState } from './state.js';
import { services } from './services.js';
import { utils } from './utils.js';
import { settingsService } from './modules/settings.service.js';
import { ui } from './ui.js';

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
    displayEmployeeRevenueReport: (reportData, containerId, sortStateKey) => {
        // ... (Giữ nguyên)
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        let detailContainerId;
        if (sortStateKey === 'doanhthu_lk') {
            detailContainerId = 'dtnv-lk-details-container';
        } else if (sortStateKey === 'realtime_dt_nhanvien') {
            detailContainerId = 'realtime-employee-detail-container';
        } else {
            detailContainerId = 'sknv-details-container';
        }

        const detailContainer = document.getElementById(detailContainerId);
        if (detailContainer) {
             detailContainer.innerHTML = '';
             detailContainer.classList.add('hidden');
        }
        container.classList.remove('hidden');

        if (!reportData || reportData.length === 0) {
             container.innerHTML = '<p class="text-gray-500">Không có dữ liệu doanh thu cho lựa chọn này.</p>';
            return;
        }
        let finalHTML = `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden" data-capture-group="1">
             <div class="p-4 header-group-1 text-gray-800">
                 <h3 class="text-xl font-bold uppercase">Doanh thu nhân viên</h3>
                 <p class="text-sm italic text-gray-600">(đơn vị tính: Triệu đồng)</p>
             </div>`;

        const groupedByDept = {};
        reportData.forEach(item => {
            const dept = item.boPhan;
             if (!groupedByDept[dept]) groupedByDept[dept] = [];
             groupedByDept[dept].push(item);
        });

        const departmentOrder = utils.getSortedDepartmentList(reportData);
        departmentOrder.forEach(deptName => {
             if (groupedByDept[deptName]) {
                 finalHTML += uiComponents.renderRevenueTableForDepartment(deptName, groupedByDept[deptName], sortStateKey);
            }
        });

        finalHTML += `</div>`;
        container.innerHTML = finalHTML;
    },
    renderRevenueTableForDepartment: (title, data, sortStateKey) => {
        // ... (Giữ nguyên)
        const sortState = appState.sortState[sortStateKey] || { key: 'doanhThu', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...data].sort((a, b) => {
             const valA = a[key] || 0; const valB = b[key] || 0;
             return direction === 'asc' ? valA - valB : valB - valA;
        });

        const totals = data.reduce((acc, item) => {
            acc.doanhThu += item.doanhThu || 0;
            acc.doanhThuQuyDoi += item.doanhThuQuyDoi || 0;
            acc.doanhThuTraGop += item.doanhThuTraGop || 0;
            acc.doanhThuChuaXuat += item.doanhThuChuaXuat || 0;
            return acc;
        }, { doanhThu: 0, doanhThuQuyDoi: 0, doanhThuTraGop: 0, doanhThuChuaXuat: 0 });

        totals.hieuQuaQuyDoi = totals.doanhThu > 0 ? (totals.doanhThuQuyDoi / totals.doanhThu) - 1 : 0;
        totals.tyLeTraCham = totals.doanhThu > 0 ? totals.doanhThuTraGop / totals.doanhThu : 0;

        let titleClass = '';
        if (title.includes('Tư Vấn')) titleClass = 'department-header-tv';
        else if (title.includes('Kho')) titleClass = 'department-header-kho';
        else if (title.includes('Trang Trí')) titleClass = 'department-header-tt';

        const isRealtime = sortStateKey === 'realtime_dt_nhanvien';
        const headerClasses = {
            hoTen: '',
            doanhThu: isRealtime ? 'header-group-4' : 'header-bg-blue',
             doanhThuQuyDoi: isRealtime ? 'header-group-4' : 'header-bg-blue',
            hieuQuaQuyDoi: isRealtime ? 'header-group-4' : 'header-bg-blue',
            doanhThuTraGop: isRealtime ? 'header-group-5' : 'header-bg-green',
            tyLeTraCham: isRealtime ? 'header-group-5' : 'header-bg-green',
            doanhThuChuaXuat: isRealtime ? 'header-group-6' : 'header-bg-yellow'
         };

        const headerClass = (sortKey) => `px-4 py-3 sortable ${headerClasses[sortKey] || ''} ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        let tableHTML = `<div class="department-block"><h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${title}</h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}" data-capture-columns="7">
             <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                     <tr>
                             <th class="${headerClass('hoTen')}" data-sort="hoTen">Nhân viên <span class="sort-indicator"></span></th>
                             <th class="${headerClass('doanhThu')} text-right" data-sort="doanhThu">Doanh Thu <span class="sort-indicator"></span></th>
                             <th class="${headerClass('doanhThuQuyDoi')} text-right" data-sort="doanhThuQuyDoi">Doanh Thu QĐ <span class="sort-indicator"></span></th>
                             <th class="${headerClass('hieuQuaQuyDoi')} text-right" data-sort="hieuQuaQuyDoi">% QĐ <span class="sort-indicator"></span></th>
                             <th class="${headerClass('doanhThuTraGop')} text-right" data-sort="doanhThuTraGop">DT trả chậm <span class="sort-indicator"></span></th>
                             <th class="${headerClass('tyLeTraCham')} text-right" data-sort="tyLeTraCham">% trả chậm <span class="sort-indicator"></span></th>
                             <th class="${headerClass('doanhThuChuaXuat')} text-right" data-sort="doanhThuChuaXuat">DT Chưa Xuất <span class="sort-indicator"></span></th>
                      </tr>
                 </thead><tbody>`;
        sortedData.forEach(item => {
            const { mucTieu } = item;
             const qdClass = (mucTieu && item.hieuQuaQuyDoi < (mucTieu.phanTramQD / 100)) ? 'cell-performance is-below' : '';
             const tcClass = (mucTieu && item.tyLeTraCham < (mucTieu.phanTramTC / 100)) ? 'cell-performance is-below' : '';

            let sourceTab;
            if (sortStateKey === 'doanhthu_lk') sourceTab = 'dtnv-lk';
             else if (sortStateKey === 'realtime_dt_nhanvien') sourceTab = 'dtnv-rt';
            else sourceTab = 'sknv';

             tableHTML += `<tr class="interactive-row" data-employee-id="${item.maNV}" data-source-tab="${sourceTab}">
                    <td class="px-4 py-2 font-semibold line-clamp-2 employee-name-cell">
                        <a href="#">${uiComponents.getShortEmployeeName(item.hoTen, item.maNV)}</a>
                    </td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.doanhThu)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.doanhThuQuyDoi)}</td>
                     <td class="px-4 py-2 text-right font-bold ${qdClass}">${uiComponents.formatPercentage(item.hieuQuaQuyDoi)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.doanhThuTraGop)}</td>
                    <td class="px-4 py-2 text-right font-bold ${tcClass}">${uiComponents.formatPercentage(item.tyLeTraCham)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.doanhThuChuaXuat)}</td></tr>`;
        });
         tableHTML += `</tbody><tfoot class="table-footer font-bold"><tr>
                      <td class="px-4 py-2">Tổng</td>
                     <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.doanhThu)}</td>
                     <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.doanhThuQuyDoi)}</td>
                   <td class="px-4 py-2 text-right">${uiComponents.formatPercentage(totals.hieuQuaQuyDoi)}</td>
                   <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.doanhThuTraGop)}</td>
                     <td class="px-4 py-2 text-right">${uiComponents.formatPercentage(totals.tyLeTraCham)}</td>
                     <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.doanhThuChuaXuat)}</td>
                  </tr></tfoot></table></div></div>`;
        return tableHTML;
    },
    displayEmployeeEfficiencyReport: (reportData, containerId, sortStateKey) => {
        // ... (Giữ nguyên)
         const container = document.getElementById(containerId);
         if (!container) return;
         if (!reportData || reportData.length === 0) {
             container.innerHTML = '<p class="text-gray-500">Không có dữ liệu hiệu quả cho lựa chọn này.</p>';
             return;
         }

         const columnSettings = settingsService.loadEfficiencyViewSettings();
         const visibleColumns = columnSettings.filter(c => c.visible);

         const columnTogglesHTML = `
            <div id="efficiency-column-toggles" class="p-3 border-b border-gray-200 flex flex-wrap items-center gap-x-2 gap-y-2">
                 <span class="text-sm font-semibold mr-2 text-gray-700 non-draggable">Tùy chỉnh cột:</span>
                  ${columnSettings.map(col => `
                     <button
                         class="column-toggle-btn draggable-tag flex items-center ${col.visible ? 'active' : ''}"
                         data-column-id="${col.id}">
                         <svg class="drag-handle-icon mr-2 cursor-grab" width="12" height="12" viewBox="0 0 10 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 2a1 1 0 10-2 0 1 1 0 002 0zM2 9a1 1 0 110-2 1 1 0 010 2zm0 5a1 1 0 110-2 1 1 0 010 2zm5-12a1 1 0 10-2 0 1 1 0 002 0zM7 9a1 1 0 110-2 1 1 0 010 2zm0 5a1 1 0 110-2 1 1 0 010 2z" fill="currentColor"></path></svg>
                         <span>${col.label}</span>
                     </button>
                 `).join('')}
             </div>
         `;

         let finalHTML = `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                          ${columnTogglesHTML}
                              <div data-capture-group="efficiency-table">
                                 <div class="p-4 header-group-3 text-gray-800">
                                     <h3 class="text-xl font-bold uppercase">HIỆU QUẢ KHAI THÁC THEO NHÂN VIÊN</h3>
                                      <p class="text-sm italic text-gray-600">(đơn vị tính: Triệu đồng)</p>
                                 </div>`;

         const groupedByDept = {};
         reportData.forEach(item => {
             const dept = item.boPhan;
             if (!groupedByDept[dept]) groupedByDept[dept] = [];
             groupedByDept[dept].push(item);
         });

         const departmentOrder = utils.getSortedDepartmentList(reportData);

         departmentOrder.forEach(deptName => {
            if (groupedByDept[deptName]) {
                 finalHTML += uiComponents.renderEfficiencyTableForDepartment(deptName, groupedByDept[deptName], sortStateKey, visibleColumns);
             }
         });

         finalHTML += `   </div>
                      </div>`;
         container.innerHTML = finalHTML;
    },
    renderEfficiencyTableForDepartment: (title, data, sortStateKey, visibleColumns) => {
        // ... (Giữ nguyên)
        const sortState = appState.sortState[sortStateKey] || { key: 'dtICT', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...data].sort((a, b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });

        const formatMap = {
            dtICT: (val) => uiComponents.formatRevenue(val),
            dtPhuKien: (val) => uiComponents.formatRevenue(val),
            dtCE: (val) => uiComponents.formatRevenue(val),
            dtGiaDung: (val) => uiComponents.formatRevenue(val),
            defaultPercent: (val) => uiComponents.formatPercentage(val)
        };

        const totals = data.reduce((acc, item) => {
             acc.dtICT += item.dtICT || 0;
             acc.dtPhuKien += item.dtPhuKien || 0;
             acc.dtCE += item.dtCE || 0;
             acc.dtGiaDung += item.dtGiaDung || 0;
             acc.dtMLN += item.dtMLN || 0;
             acc.slSmartphone += item.slSmartphone || 0;
             acc.slSimOnline += item.slSimOnline || 0;
             acc.slUDDD += item.slUDDD || 0;
             acc.slBaoHiemDenominator += item.slBaoHiemDenominator || 0;
             acc.slBaoHiemVAS += item.slBaoHiemVAS || 0;
             return acc;
        }, { dtICT: 0, dtPhuKien: 0, dtCE: 0, dtGiaDung: 0, dtMLN: 0, slSmartphone: 0, slSimOnline: 0, slUDDD: 0, slBaoHiemDenominator: 0, slBaoHiemVAS: 0 });

        totals.pctPhuKien = totals.dtICT > 0 ? totals.dtPhuKien / totals.dtICT : 0;
        totals.pctGiaDung = totals.dtCE > 0 ? totals.dtGiaDung / totals.dtCE : 0;
        totals.pctMLN = totals.dtCE > 0 ? totals.dtMLN / totals.dtCE : 0;
        totals.pctSim = totals.slSmartphone > 0 ? totals.slSimOnline / totals.slSmartphone : 0;
        totals.pctVAS = totals.slSmartphone > 0 ? totals.slUDDD / totals.slSmartphone : 0;
        totals.pctBaoHiem = totals.slBaoHiemDenominator > 0 ? totals.slBaoHiemVAS / totals.slBaoHiemDenominator : 0;

        let titleClass = '';
        if (title.includes('Tư Vấn')) titleClass = 'department-header-tv';
        else if (title.includes('Kho')) titleClass = 'department-header-kho';
        else if (title.includes('Trang Trí')) titleClass = 'department-header-tt';
        const allHeaders = {
            dtICT: { label: 'DT ICT', class: 'text-right header-group-10' },
            dtPhuKien: { label: 'DT Phụ kiện', class: 'text-right header-group-10' },
            pctPhuKien: { label: '% Phụ kiện', class: 'text-right header-group-10' },
            dtCE: { label: 'DT CE', class: 'text-right header-group-11' },
            dtGiaDung: { label: 'DT Gia dụng', class: 'text-right header-group-11' },
            pctGiaDung: { label: '% Gia dụng', class: 'text-right header-group-11' },
            pctMLN: { label: '% MLN', class: 'text-right header-group-12' },
            pctSim: { label: '% Sim', class: 'text-right header-group-12' },
            pctVAS: { label: '% VAS', class: 'text-right header-group-12' },
            pctBaoHiem: { label: '% Bảo hiểm', class: 'text-right header-group-12' }
        };

        const headerClass = (sortKey) => `px-4 py-3 sortable draggable-header ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        const captureColumnCount = 1 + visibleColumns.length;
        let tableHTML = `<div class="department-block"><h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${title}</h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}" data-capture-columns="${captureColumnCount}">
            <thead class="text-xs text-slate-800 uppercase font-bold">
                 <tr>
                    <th class="${headerClass('hoTen')}" data-sort="hoTen">Tên nhân viên <span class="sort-indicator"></span></th>
                     ${visibleColumns.map(col => `<th class="${headerClass(col.id)} ${allHeaders[col.id]?.class || ''}" data-sort="${col.id}">${allHeaders[col.id]?.label || col.id} <span class="sort-indicator"></span></th>`).join('')}
                 </tr>
            </thead><tbody>`;

        sortedData.forEach(item => {
             const { mucTieu } = item;
            const classMap = {
                 pctPhuKien: (mucTieu && item.pctPhuKien < (mucTieu.phanTramPhuKien / 100)) ? 'cell-performance is-below' : '',
                 pctGiaDung: (mucTieu && item.pctGiaDung < (mucTieu.phanTramGiaDung / 100)) ? 'cell-performance is-below' : '',
                 pctMLN: (mucTieu && item.pctMLN < (mucTieu.phanTramMLN / 100)) ? 'cell-performance is-below' : '',
                 pctSim: (mucTieu && item.pctSim < (mucTieu.phanTramSim / 100)) ? 'cell-performance is-below' : '',
                 pctVAS: (mucTieu && item.pctVAS < (mucTieu.phanTramVAS / 100)) ? 'cell-performance is-below' : '',
                 pctBaoHiem: (mucTieu && item.pctBaoHiem < (mucTieu.phanTramBaoHiem / 100)) ? 'cell-performance is-below' : ''
            };

             tableHTML += `<tr class="interactive-row" data-employee-id="${item.maNV}" data-source-tab="sknv">
                <td class="px-4 py-2 font-semibold line-clamp-2 employee-name-cell">
                     <a href="#">${uiComponents.getShortEmployeeName(item.hoTen, item.maNV)}</a>
                 </td>
                 ${visibleColumns.map(col => {
                    const value = item[col.id];
                    const className = classMap[col.id] || '';
                    const formatter = formatMap[col.id] || formatMap.defaultPercent;
                    return `<td class="px-4 py-2 text-right font-bold ${className}">${formatter(value)}</td>`;
                }).join('')}
            </tr>`;
        });

        tableHTML += `</tbody><tfoot class="table-footer font-bold">
            <tr>
                 <td class="px-4 py-2">Tổng</td>
                 ${visibleColumns.map(col => {
                     const value = totals[col.id];
                     const formatter = formatMap[col.id] || formatMap.defaultPercent;
                     return `<td class="px-4 py-2 text-right">${formatter(value)}</td>`;
                }).join('')}
            </tr>
        </tfoot></table></div></div>`;
        return tableHTML;
    },
    renderCategoryTable(title, sortStateKey, reportData, mainRevenueKey, mainQuantityKey, subQuantityKeys, subQuantityLabels) {
        // ... (Giữ nguyên)
        const sortState = appState.sortState[sortStateKey] || { key: mainRevenueKey, direction: 'desc' };
        const { key, direction } = sortState;

        const sortedData = [...reportData].sort((a, b) => {
            const valA = a[key] || 0;
            const valB = b[key] || 0;
             return direction === 'asc' ? valA - valB : valB - valA;
        });

        const totals = reportData.reduce((acc, item) => {
             acc[mainRevenueKey] = (acc[mainRevenueKey] || 0) + (item[mainRevenueKey] || 0);
            acc[mainQuantityKey] = (acc[mainQuantityKey] || 0) + (item[mainQuantityKey] || 0);
             subQuantityKeys.forEach(subKey => {
                acc[subKey] = (acc[subKey] || 0) + (item[subKey] || 0);
            });
            return acc;
        }, {});

        const headerClass = (sortKey) => `px-2 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        const titleClass = {
            'ICT': 'category-header-ict',
            'PHỤ KIỆN': 'category-header-phukien',
            'GIA DỤNG': 'category-header-giadung',
            'CE': 'category-header-ce',
             'BẢO HIỂM': 'category-header-baohiem',
        }[title] || 'bg-gray-200';

        const subHeaders = subQuantityLabels.map((label) => `<th class="px-2 py-2 text-right">${label}</th>`).join('');

        const tableRows = [];
        sortedData.forEach(item => {
            if ((item[mainRevenueKey] || 0) > 0 || (item[mainQuantityKey] || 0) > 0) {
                 tableRows.push(`
                    <tr class="interactive-row" data-employee-id="${item.maNV}" data-source-tab="sknv">
                        <td class="px-2 py-2 font-semibold line-clamp-2 employee-name-cell">
                            <a href="#">${this.getShortEmployeeName(item.hoTen, item.maNV)}</a>
                        </td>
                         <td class="px-2 py-2 text-right font-bold">${this.formatRevenue(item[mainRevenueKey])}</td>
                         <td class="px-2 py-2 text-right font-bold">${this.formatNumberOrDash(item[mainQuantityKey])}</td>
                         ${subQuantityKeys.map(subKey => `<td class="px-2 py-2 text-right">${this.formatNumberOrDash(item[subKey])}</td>`).join('')}
                     </tr>
                `);
            }
        });

        if (tableRows.length === 0) {
             return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                         <h4 class="text-lg font-bold p-3 border-b ${titleClass}">${title}</h4>
                         <p class="p-4 text-gray-500">Không có dữ liệu cho ngành hàng này.</p>
                     </div>`;
        }

        const html = `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <h4 class="text-lg font-bold p-3 border-b ${titleClass}">${title}</h4>
                 <div class="overflow-x-auto">
                     <table class="min-w-full text-sm table-bordered table-striped" data-table-type="${sortStateKey}">
                         <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                             <tr>
                                <th rowspan="2" class="${headerClass('hoTen')}" data-sort="hoTen">Nhân viên</th>
                                 <th rowspan="2" class="${headerClass(mainRevenueKey)} text-right" data-sort="${mainRevenueKey}">DT</th>
                                <th rowspan="2" class="${headerClass(mainQuantityKey)} text-right" data-sort="${mainQuantityKey}">Tổng SL</th>
                                 <th colspan="${subQuantityKeys.length}" class="px-2 py-2 text-center">Chi tiết SL</th>
                            </tr>
                            <tr>${subHeaders}</tr>
                         </thead>
                          <tbody>
                             ${tableRows.join('')}
                        </tbody>
                          <tfoot class="table-footer font-bold">
                            <tr>
                                <td class="px-2 py-2">Tổng</td>
                                 <td class="px-2 py-2 text-right">${this.formatRevenue(totals[mainRevenueKey] || 0)}</td>
                                 <td class="px-2 py-2 text-right">${this.formatNumberOrDash(totals[mainQuantityKey] || 0)}</td>
                                 ${subQuantityKeys.map(subKey => `<td class="px-2 py-2 text-right">${this.formatNumberOrDash(totals[subKey] || 0)}</td>`).join('')}
                             </tr>
                          </tfoot>
                     </table>
                </div>
            </div>`;
        return html;
    },
    displayCategoryRevenueReport(reportData, containerId, sortStatePrefix) {
        // ... (Giữ nguyên)
         const container = document.getElementById(containerId);
         if (!container) return;

         const hasAnyData = reportData.some(item => (item.dtICT || 0) > 0 || (item.dtPhuKien || 0) > 0 || (item.dtGiaDung || 0) > 0 || (item.dtCE || 0) > 0 || (item.dtBaoHiem || 0) > 0);
         if (!hasAnyData) {
             container.innerHTML = '<p class="text-yellow-600 font-semibold">Không tìm thấy doanh thu cho các ngành hàng chính.</p>';
             return;
         }

         const htmlParts = [
             '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">',
             `<div data-capture-group="1" data-capture-columns="6">${this.renderCategoryTable('ICT', `${sortStatePrefix}_ict`, reportData, 'dtICT', 'slICT', ['slDienThoai', 'slLaptop'], ['SL Điện thoại', 'SL Laptop'])}</div>`,
             `<div data-capture-group="1" data-capture-columns="6">${this.renderCategoryTable('PHỤ KIỆN', `${sortStatePrefix}_phukien`, reportData, 'dtPhuKien', 'slPhuKien', ['slPinSDP', 'slCamera', 'slTaiNgheBLT'], ['SL Pin SDP', 'SL Camera', 'SL Tai nghe BLT'])}</div>`,
             `<div data-capture-group="2" data-capture-columns="6">${this.renderCategoryTable('GIA DỤNG', `${sortStatePrefix}_giadung`, reportData, 'dtGiaDung', 'slGiaDung', ['slNoiChien', 'slMLN', 'slRobotHB'], ['SL Nồi chiên', 'SL MLN', 'SL Robot HB'])}</div>`,
             `<div data-capture-group="2" data-capture-columns="6">${this.renderCategoryTable('CE', `${sortStatePrefix}_ce`, reportData, 'dtCE', 'slCE', ['slTivi', 'slTuLanh', 'slMayGiat', 'slMayLanh'], ['SL Tivi', 'SL Tủ lạnh', 'SL Máy giặt', 'SL Máy lạnh'])}</div>`,
             `<div class="lg:col-span-2" data-capture-group="3" data-capture-columns="7">${this.renderCategoryTable('BẢO HIỂM', `${sortStatePrefix}_baohiem`, reportData, 'dtBaoHiem', 'slBaoHiem', ['slBH1d1', 'slBHXM', 'slBHRV', 'slBHMR'], ['BH 1-1', 'BHXM', 'BHRV', 'BHMR'])}</div>`,
             '</div>'
         ];
         container.innerHTML = htmlParts.join('');
    },
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
    showNotification: (message, type = 'success') => {
        const notification = document.getElementById('notification');
        if (!notification) return;
        notification.textContent = message;
        notification.className = `fixed bottom-5 right-5 p-4 rounded-lg shadow-md text-white z-[1200] opacity-0 transition-opacity duration-500 transform translate-y-10 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
        void notification.offsetWidth;
        notification.classList.remove('hidden', 'opacity-0', 'translate-y-10');
        notification.classList.add('opacity-100', 'translate-y-0');

        setTimeout(() => {
             notification.classList.remove('opacity-100', 'translate-y-0');
             notification.classList.add('opacity-0', 'translate-y-10');
             setTimeout(() => notification.classList.add('hidden'), 500);
        }, 3000);
    },
    showUpdateNotification() {
        const notification = document.getElementById('update-notification');
        if (notification) {
             notification.classList.remove('hidden');
             const button = notification.querySelector('button');
             if (button && !button.onclick) {
                button.onclick = () => window.location.reload();
             }
         }
    },
     updateUsageCounter: (statsData) => {
        const visitorCountEl = document.getElementById('visitor-count');
         const actionCountEl = document.getElementById('action-count');
         const userCountEl = document.getElementById('user-count');
         if (visitorCountEl) visitorCountEl.textContent = statsData?.pageLoads ? uiComponents.formatNumber(statsData.pageLoads) : '0';
         if (actionCountEl) actionCountEl.textContent = statsData?.actionsTaken ? uiComponents.formatNumber(statsData.actionsTaken) : '0';
         if (userCountEl) userCountEl.textContent = statsData?.totalUsers ? uiComponents.formatNumber(statsData.totalUsers) : '0';
     },
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
                     timeAgo = this.formatTimeAgo(timestampDate);
                 }
             }

             if (statusType === 'success' && metadata) {
                 countText = metadata.rowCount ? `${uiComponents.formatNumber(metadata.rowCount)} dòng` : '';
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
                     timeAgo = this.formatTimeAgo(timestampDate);
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
    formatNumber: (value, decimals = 0) => {
        if (isNaN(value) || value === null) return '0';
        return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
    },
    formatRevenue(value, decimals = 1) {
         if (!isFinite(value) || value === null || value === 0) return '-';
         const millions = value / 1000000;
         const roundedValue = parseFloat(millions.toFixed(decimals));
         if (roundedValue === 0 && millions !== 0) {
              return millions > 0 ? '> 0' : '< 0';
         }
         return new Intl.NumberFormat('vi-VN', {
             minimumFractionDigits: 0,
             maximumFractionDigits: decimals
         }).format(roundedValue);
     },
     formatNumberOrDash: (value, decimals = 1) => {
         if (!isFinite(value) || value === null || value === 0) return '-';
          const roundedValue = parseFloat(value.toFixed(decimals));
          if (roundedValue === 0 && value !== 0) {
               return value > 0 ? '> 0' : '< 0';
          }
           if (roundedValue === 0) return '-';
          return new Intl.NumberFormat('vi-VN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: decimals
          }).format(roundedValue);
      },
     formatPercentage: (value, decimals = 0) => {
         if (!isFinite(value) || value === null) return '-';
          if (value === 0) return '-';
          const percentageValue = value * 100;
          const roundedValue = parseFloat(percentageValue.toFixed(decimals));
          if (roundedValue === 0 && percentageValue !== 0) {
             return percentageValue > 0 ? '> 0%' : '< 0%';
          }
         return new Intl.NumberFormat('vi-VN', {
             minimumFractionDigits: decimals,
              maximumFractionDigits: decimals
          }).format(roundedValue) + '%';
      },
    formatTimeAgo(date) {
         if (!date || !(date instanceof Date) || isNaN(date)) return '';
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
        const nameParts = hoTen.split(' ').filter(p => p);
        let displayName = hoTen;
        if (nameParts.length > 2) {
            displayName = nameParts.slice(-2).join(' ');
        }
        return `${displayName} - ${maNV}`;
    },
    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.toggle('hidden', !show);
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
            setTimeout(() => {
                 if (!drawer.classList.contains('open')) {
                     drawer.classList.add('hidden');
                 }
             }, 300);
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
                         <span>${this.formatTimeAgo(item.timestamp)}</span>
                         ${appState.isAdmin ? `<button class="reply-btn text-blue-600 hover:underline">Trả lời</button>` : ''}
                    </div>
                    <div class="ml-6 mt-4 space-y-3">
                         ${(item.replies || []).map(reply => `
                             <div class="bg-gray-100 rounded-lg p-3">
                                <p class="text-gray-700 text-sm">${reply.content}</p>
                                 <div class="text-xs text-gray-500 mt-2">
                                     <strong>Admin</strong> - ${this.formatTimeAgo(reply.timestamp instanceof Date ? reply.timestamp : reply.timestamp?.toDate())}
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

    displayDebugInfo(fileType) {
        // ... (Giữ nguyên)
         const resultsContainer = document.getElementById('debug-results-container');
         if (!fileType) {
             if (resultsContainer) resultsContainer.innerHTML = '<p class="text-gray-500">Chưa có file nào được tải lên để kiểm tra.</p>';
             return;
         }
         if (resultsContainer && resultsContainer.innerHTML.includes('Chưa có file nào')) resultsContainer.innerHTML = '';

         const debugData = appState.debugInfo[fileType];
         if (!debugData) return;

         const fileInputEl = document.querySelector(`#file-${fileType}`);
         const fileName = fileInputEl?.dataset.name || fileType;
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
        // ... (Giữ nguyên)
         const container = document.getElementById('pasted-debug-results-container');
         if (!container) return;

         const debugData = appState.debugInfo[dataType];
         if (!debugData) {
             container.innerHTML = '';
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
        // ... (Giữ nguyên)
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

        const tongRaw = appState.debugInfo?.thiDuaVungTongRaw?.slice(0, 10) || [];
        const chiTietRaw = appState.debugInfo?.thiDuaVungChiTietRaw?.slice(0, 10) || [];

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
    renderCompetitionDebugReport(debugResults) {
        // ... (Giữ nguyên)
         const container = document.getElementById('debug-competition-results');
        if (!container) return;

        if (!debugResults || debugResults.length === 0) {
             container.innerHTML = '<p class="text-gray-600">Không có dữ liệu để phân tích.</p>';
            return;
        }

        const validCount = debugResults.filter(r => r.isOverallValid).length;
        const totalCount = debugResults.length;
        const checkHeaders = ['HTX Hợp lệ', 'Đã thu', 'Chưa hủy', 'Chưa trả', 'Đã xuất'];

        let tableHTML = `
            <div class="p-4 bg-white border rounded-lg">
                <h4 class="font-bold text-lg mb-2">Kết quả Phân tích File: <span class="text-green-600">${validCount}</span> / ${totalCount} dòng hợp lệ</h4>
                 <div class="overflow-x-auto max-h-[600px]">
                     <table class="min-w-full text-xs table-bordered competition-debug-table">
                         <thead class="bg-gray-100 sticky top-0">
                             <tr>
                                <th class="p-2">Người tạo</th>
                                 <th class="p-2">Nhóm hàng</th>
                                 <th class="p-2">HT Xuất</th>
                                 <th class="p-2">TT Thu tiền</th>
                                 <th class="p-2">TT Hủy</th>
                                <th class="p-2">TT Trả</th>
                                 <th class="p-2">TT Xuất</th>
                                 ${checkHeaders.map(h => `<th class="p-2">${h}</th>`).join('')}
                                 <th class="p-2">Tổng thể</th>
                             </tr>
                         </thead>
                        <tbody>`;

        const renderCheck = (status) => `<td class="text-center font-bold text-lg">${status ? '<span class="text-green-500">✅</span>' : '<span class="text-red-500">❌</span>'}</td>`;

        debugResults.forEach(result => {
            const rowClass = result.isOverallValid ? 'bg-green-50' : 'bg-red-50';
            const { rowData, checks, isOverallValid } = result;
             tableHTML += `
                <tr class="${rowClass}">
                     <td class="p-2">${rowData.nguoiTao || ''}</td>
                     <td class="p-2">${rowData.nhomHang || ''}</td>
                     <td class="p-2">${rowData.hinhThucXuat || ''}</td>
                     <td class="p-2">${rowData.trangThaiThuTien || ''}</td>
                    <td class="p-2">${rowData.trangThaiHuy || ''}</td>
                     <td class="p-2">${rowData.tinhTrangTra || ''}</td>
                    <td class="p-2">${rowData.trangThaiXuat || ''}</td>
                    ${renderCheck(checks.isDoanhThuHTX)}
                    ${renderCheck(checks.isThuTien)}
                    ${renderCheck(checks.isChuaHuy)}
                    ${renderCheck(checks.isChuaTra)}
                    ${renderCheck(checks.isDaXuat)}
                    ${renderCheck(isOverallValid)}
                </tr>
            `;
        });

        tableHTML += '</tbody></table></div></div>';
        container.innerHTML = tableHTML;
    },

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
                    <td class="px-4 py-2 text-right font-bold">${this.formatNumber(user.loginCount || 0)}</td>
                    <td class="px-4 py-2 text-right font-bold">${this.formatNumber(user.actionsTaken || 0)}</td>
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