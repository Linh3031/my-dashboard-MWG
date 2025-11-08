// Version 1.4 - Flatten category table header (removes "CHI TIẾT SL" row)
// Version 1.3 - Fix layout bug (remove extra header row) and add sorting to sub-columns
// Version 1.2 - Remove stray comments from HTML template literals
// Version 1.1 - Fix capture logic to support vertical stitching
// Version 1.0 - Refactored from ui-components.js
// MODULE: UI REPORTS
// Chịu trách nhiệm tạo HTML cho các bảng báo cáo dữ liệu phức tạp.

import { appState } from './state.js';
import { utils } from './utils.js';
import { formatters } from './ui-formatters.js';
import { settingsService } from './modules/settings.service.js';

export const uiReports = {
    /**
     * Hiển thị báo cáo doanh thu nhân viên, nhóm theo bộ phận.
     */
    displayEmployeeRevenueReport: (reportData, containerId, sortStateKey) => {
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
        
        // *** START: SỬA LỖI (v1.1) ***
        // Xóa data-capture-group="1" và overflow-hidden
        let finalHTML = `<div class="bg-white rounded-xl shadow-md border border-gray-200">
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
                 finalHTML += uiReports.renderRevenueTableForDepartment(deptName, groupedByDept[deptName], sortStateKey);
            }
        });

        finalHTML += `</div>`;
        container.innerHTML = finalHTML;
    },

    /**
     * Render một bảng doanh thu cho một bộ phận cụ thể.
     */
    renderRevenueTableForDepartment: (title, data, sortStateKey) => {
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

        // *** START: SỬA LỖI (v1.1) ***
        // Thêm data-capture-group="report-part"
        let tableHTML = `<div class="department-block" data-capture-group="report-part"><h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${title}</h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}" data-capture-columns="7">
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
                        <a href="#">${formatters.getShortEmployeeName(item.hoTen, item.maNV)}</a>
                    </td>
                    <td class="px-4 py-2 text-right font-bold">${formatters.formatRevenue(item.doanhThu)}</td>
                    <td class="px-4 py-2 text-right font-bold">${formatters.formatRevenue(item.doanhThuQuyDoi)}</td>
                     <td class="px-4 py-2 text-right font-bold ${qdClass}">${formatters.formatPercentage(item.hieuQuaQuyDoi)}</td>
                    <td class="px-4 py-2 text-right font-bold">${formatters.formatRevenue(item.doanhThuTraGop)}</td>
                    <td class="px-4 py-2 text-right font-bold ${tcClass}">${formatters.formatPercentage(item.tyLeTraCham)}</td>
                    <td class="px-4 py-2 text-right font-bold">${formatters.formatRevenue(item.doanhThuChuaXuat)}</td></tr>`;
        });
         tableHTML += `</tbody><tfoot class="table-footer font-bold"><tr>
                      <td class="px-4 py-2">Tổng</td>
                     <td class="px-4 py-2 text-right">${formatters.formatRevenue(totals.doanhThu)}</td>
                     <td class="px-4 py-2 text-right">${formatters.formatRevenue(totals.doanhThuQuyDoi)}</td>
                   <td class="px-4 py-2 text-right">${formatters.formatPercentage(totals.hieuQuaQuyDoi)}</td>
                   <td class="px-4 py-2 text-right">${formatters.formatRevenue(totals.doanhThuTraGop)}</td>
                     <td class="px-4 py-2 text-right">${formatters.formatPercentage(totals.tyLeTraCham)}</td>
                     <td class="px-4 py-2 text-right">${formatters.formatRevenue(totals.doanhThuChuaXuat)}</td>
                  </tr></tfoot></table></div></div>`;
        return tableHTML;
    },

    /**
     * Hiển thị báo cáo hiệu quả khai thác (ICT, CE, PK, GD, v.v.), nhóm theo bộ phận.
     */
    displayEmployeeEfficiencyReport: (reportData, containerId, sortStateKey) => {
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
                 finalHTML += uiReports.renderEfficiencyTableForDepartment(deptName, groupedByDept[deptName], sortStateKey, visibleColumns);
             }
         });

         finalHTML += `   </div>
                      </div>`;
         container.innerHTML = finalHTML;
    },

    /**
     * Render một bảng hiệu quả khai thác cho một bộ phận cụ thể.
     */
    renderEfficiencyTableForDepartment: (title, data, sortStateKey, visibleColumns) => {
        const sortState = appState.sortState[sortStateKey] || { key: 'dtICT', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...data].sort((a, b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });

        const formatMap = {
            dtICT: (val) => formatters.formatRevenue(val),
            dtPhuKien: (val) => formatters.formatRevenue(val),
            dtCE: (val) => formatters.formatRevenue(val),
            dtGiaDung: (val) => formatters.formatRevenue(val),
            defaultPercent: (val) => formatters.formatPercentage(val)
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
        let tableHTML = `<div class="department-block" data-capture-group="report-part"><h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${title}</h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}" data-capture-columns="${captureColumnCount}">
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
                     <a href="#">${formatters.getShortEmployeeName(item.hoTen, item.maNV)}</a>
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

    /**
     * Render bảng doanh thu chi tiết theo ngành hàng (ICT, PK, GD, CE, BH).
     */
    renderCategoryTable(title, sortStateKey, reportData, mainRevenueKey, mainQuantityKey, subQuantityKeys, subQuantityLabels) {
        const sortState = appState.sortState[sortStateKey] || { key: mainRevenueKey, direction: 'desc' };
        const { key, direction } = sortState;

        const sortedData = [...reportData].sort((a, b) => {
            // === START: THAY ĐỔI ===
            // Thêm logic sắp xếp cho các cột con (subQuantityKeys)
            let valA, valB;
            if (key === 'hoTen') {
                valA = a.hoTen || '';
                valB = b.hoTen || '';
                return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            // Kiểm tra xem key có phải là một trong các subQuantityKeys không
            const subKeyIndex = subQuantityKeys.indexOf(key);
            if (subKeyIndex > -1) {
                valA = a[key] || 0;
                valB = b[key] || 0;
            } else {
                // Sắp xếp theo các cột chính (mainRevenueKey, mainQuantityKey)
                valA = a[key] || 0;
                valB = b[key] || 0;
            }
            return direction === 'asc' ? valA - valB : valB - valA;
            // === END: THAY ĐỔI ===
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

        // === START: THAY ĐỔI (Thêm data-sort và loại bỏ <tr> thừa) ===
        const subHeaders = subQuantityLabels.map((label, index) => {
            const subKey = subQuantityKeys[index];
            return `<th class="${headerClass(subKey)} text-right" data-sort="${subKey}">${label} <span class="sort-indicator"></span></th>`;
        }).join('');
        // === END: THAY ĐỔI ===

        const tableRows = [];
        sortedData.forEach(item => {
            if ((item[mainRevenueKey] || 0) > 0 || (item[mainQuantityKey] || 0) > 0) {
                 tableRows.push(`
                    <tr class="interactive-row" data-employee-id="${item.maNV}" data-source-tab="sknv">
                        <td class="px-2 py-2 font-semibold line-clamp-2 employee-name-cell">
                            <a href="#">${formatters.getShortEmployeeName(item.hoTen, item.maNV)}</a>
                        </td>
                         <td class="px-2 py-2 text-right font-bold">${formatters.formatRevenue(item[mainRevenueKey])}</td>
                         <td class="px-2 py-2 text-right font-bold">${formatters.formatNumberOrDash(item[mainQuantityKey])}</td>
                         ${subQuantityKeys.map(subKey => `<td class="px-2 py-2 text-right">${formatters.formatNumberOrDash(item[subKey])}</td>`).join('')}
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
        
        // === START: CHỈNH SỬA (v1.4) - Loại bỏ rowspan và hàng 2 ===
        const html = `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <h4 class="text-lg font-bold p-3 border-b ${titleClass}">${title}</h4>
                 <div class="overflow-x-auto">
                     <table class="min-w-full text-sm table-bordered table-striped" data-table-type="${sortStateKey}">
                         <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                             <tr>
                                <th class="px-2 py-3 sortable" data-sort="hoTen">Nhân viên <span class="sort-indicator"></span></th>
                                 <th class="${headerClass(mainRevenueKey)} text-right" data-sort="${mainRevenueKey}">DT <span class="sort-indicator"></span></th>
                                <th class="${headerClass(mainQuantityKey)} text-right" data-sort="${mainQuantityKey}">Tổng SL <span class="sort-indicator"></span></th>
                                ${subHeaders}
                            </tr>
                         </thead>
                          <tbody>
                             ${tableRows.join('')}
                        </tbody>
                          <tfoot class="table-footer font-bold">
                            <tr>
                                <td class="px-2 py-2">Tổng</td>
                                 <td class="px-2 py-2 text-right">${formatters.formatRevenue(totals[mainRevenueKey] || 0)}</td>
                                 <td class="px-2 py-2 text-right">${formatters.formatNumberOrDash(totals[mainQuantityKey] || 0)}</td>
                                 ${subQuantityKeys.map(subKey => `<td class="px-2 py-2 text-right">${formatters.formatNumberOrDash(totals[subKey] || 0)}</td>`).join('')}
                             </tr>
                          </tfoot>
                     </table>
                </div>
            </div>`;
        // === END: CHỈNH SỬA (v1.4) ===
        return html;
    },

    /**
     * Hiển thị nhiều bảng doanh thu theo ngành hàng.
     */
    displayCategoryRevenueReport(reportData, containerId, sortStatePrefix) {
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
};