// Version 3.8 - Improve getShortEmployeeName logic
// MODULE: UI COMPONENTS
// Chứa các hàm UI chung, tái sử dụng được trên toàn bộ ứng dụng.

import { appState } from './state.js';
import { services } from './services.js';
import { utils } from './utils.js';
import { settingsService } from './modules/settings.service.js';

export const uiComponents = {
    renderSettingsButton(idSuffix) {
        return `<button id="settings-btn-${idSuffix}" class="settings-trigger-btn" title="Tùy chỉnh hiển thị">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>`;
    },

    renderCompetitionConfigUI() {
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
                             <p><strong>Nhóm hàng:</strong> <span class="font-semibold">${(config.groups || []).length} nhóm</span></p>
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
    
    populateComposerDetailTags(supermarketReport) {
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
        const sortState = appState.sortState[sortStateKey] || { key: 'doanhThu', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...data].sort((a, b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });

        const totals = data.reduce((acc, item) => {
            acc.doanhThu += item.doanhThu;
            acc.doanhThuQuyDoi += item.doanhThuQuyDoi;
            acc.doanhThuTraGop += item.doanhThuTraGop;
            acc.doanhThuChuaXuat += item.doanhThuChuaXuat;
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

            tableHTML += `<tr class="interactive-row">
                    <td class="px-4 py-2 font-semibold line-clamp-2 employee-name-cell" data-employee-id="${item.maNV}" data-source-tab="${sourceTab}">
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

        finalHTML += `    </div> 
                        </div>`;
        container.innerHTML = finalHTML;
    },

    renderEfficiencyTableForDepartment: (title, data, sortStateKey, visibleColumns) => {
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
            acc.dtICT += item.dtICT;
            acc.dtPhuKien += item.dtPhuKien;
            acc.dtCE += item.dtCE;
            acc.dtGiaDung += item.dtGiaDung;
            acc.dtMLN += item.dtMLN;
            acc.slSmartphone += item.slSmartphone;
            acc.slSimOnline += item.slSimOnline;
            acc.slUDDD += item.slUDDD;
            acc.slBaoHiemDenominator += item.slBaoHiemDenominator;
            acc.slBaoHiemVAS += item.slBaoHiemVAS;
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
                    ${visibleColumns.map(col => `<th class="${headerClass(col.id)} ${allHeaders[col.id].class}" data-sort="${col.id}">${allHeaders[col.id].label} <span class="sort-indicator"></span></th>`).join('')}
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

            tableHTML += `<tr class="interactive-row">
                <td class="px-4 py-2 font-semibold line-clamp-2 employee-name-cell" data-employee-id="${item.maNV}" data-source-tab="sknv">
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
        const sortState = appState.sortState[sortStateKey] || { key: mainRevenueKey, direction: 'desc' };
        const { key, direction } = sortState;

        const sortedData = [...reportData].sort((a, b) => {
            const valA = a[key] || 0;
            const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });

        const totals = reportData.reduce((acc, item) => {
            acc[mainRevenueKey] += item[mainRevenueKey];
            acc[mainQuantityKey] += item[mainQuantityKey];
            subQuantityKeys.forEach(subKey => {
                acc[subKey] = (acc[subKey] || 0) + (item[subKey] || 0);
            });
            return acc;
        }, { [mainRevenueKey]: 0, [mainQuantityKey]: 0, ...subQuantityKeys.reduce((obj, key) => ({...obj, [key]: 0}), {}) });

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
            if (item[mainRevenueKey] > 0 || item[mainQuantityKey] > 0) {
                 tableRows.push(`
                    <tr class="interactive-row">
                        <td class="px-2 py-2 font-semibold line-clamp-2 employee-name-cell" data-employee-id="${item.maNV}" data-source-tab="sknv">
                            <a href="#">${this.getShortEmployeeName(item.hoTen, item.maNV)}</a>
                        </td>
                        <td class="px-2 py-2 text-right font-bold">${this.formatRevenue(item[mainRevenueKey])}</td>
                        <td class="px-2 py-2 text-right font-bold">${this.formatNumberOrDash(item[mainQuantityKey])}</td>
                        ${subQuantityKeys.map(subKey => `<td class="px-2 py-2 text-right">${this.formatNumberOrDash(item[subKey])}</td>`).join('')}
                    </tr>
                `);
            }
        });

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
                                <td class="px-2 py-2 text-right">${this.formatRevenue(totals[mainRevenueKey])}</td>
                                <td class="px-2 py-2 text-right">${this.formatNumberOrDash(totals[mainQuantityKey])}</td>
                                ${subQuantityKeys.map(subKey => `<td class="px-2 py-2 text-right">${this.formatNumberOrDash(totals[subKey])}</td>`).join('')}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>`;
        return html;
    },

    displayCategoryRevenueReport(reportData, containerId, sortStatePrefix) {
        const container = document.getElementById(containerId);
        if (!container) return;
    
        const hasAnyData = reportData.some(item => item.dtICT > 0 || item.dtPhuKien > 0 || item.dtGiaDung > 0 || item.dtCE > 0 || item.dtBaoHiem > 0);
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
    
    updateUsageCounter: (statsData) => {
        const visitorCountEl = document.getElementById('visitor-count');
        const actionCountEl = document.getElementById('action-count');
        const userCountEl = document.getElementById('user-count');

        if (visitorCountEl) {
            visitorCountEl.textContent = statsData.pageLoads ? uiComponents.formatNumber(statsData.pageLoads) : '0';
        }
        if (actionCountEl) {
            actionCountEl.textContent = statsData.actionsTaken ? uiComponents.formatNumber(statsData.actionsTaken) : '0';
        }
        if (userCountEl) {
            userCountEl.textContent = statsData.totalUsers ? uiComponents.formatNumber(statsData.totalUsers) : '0';
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

    // === START: UPDATED FUNCTION (V3.8) ===
    getShortEmployeeName(hoTen, maNV) {
        if (!hoTen) return maNV || '';
        const nameParts = hoTen.split(' ').filter(p => p); // Lọc bỏ các khoảng trắng thừa
        
        let displayName = hoTen; // Mặc định là tên đầy đủ
        if (nameParts.length > 2) {
            displayName = nameParts.slice(-2).join(' '); // Lấy 2 từ cuối
        }
        
        return `${displayName} - ${maNV}`;
    },
    // === END: UPDATED FUNCTION ===

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

    showHelpModal(helpId) {
        const title = `Hướng dẫn cho Tab ${helpId.charAt(0).toUpperCase() + helpId.slice(1)}`;
        const content = appState.helpContent[helpId] || "Nội dung hướng dẫn không có sẵn.";
        
        document.getElementById('help-modal-title').textContent = title;
        document.getElementById('help-modal-content').innerHTML = content.replace(/\n/g, '<br>');
        this.toggleModal('help-modal', true);
    },
    
    showComposerModal(sectionId) {
        this.toggleModal('composer-modal', true);
    },
    
    insertComposerTag(textarea, tag) {
        if (!textarea) return;
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

        listContainer.innerHTML = appState.feedbackList.map(item => {
            let userNameDisplay = 'Người dùng cũ'; 
            if (typeof item.user === 'object' && item.user !== null && item.user.uid) {
                if (item.user.isAnonymous) {
                    userNameDisplay = `Người dùng Khách #${item.user.uid.slice(-6)}`;
                } 
            } else if (typeof item.user === 'string') {
                userNameDisplay = item.user;
            }

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
            `;
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

    renderCompetitionDebugReport(debugResults) {
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

    populateCompetitionFilters() {
        if (!appState.categoryStructure || appState.categoryStructure.length === 0) return;

        const uniqueNhomHang = [...new Set(appState.categoryStructure.map(item => item.nhomHang))].sort();
        const choicesOptions = uniqueNhomHang.map(item => ({ value: item, label: item, selected: false }));

        const groupInstance = appState.choices['competition_group'];
        if (groupInstance) {
            const currentValues = groupInstance.getValue(true);
            groupInstance.clearStore();
            groupInstance.setChoices(choicesOptions, 'value', 'label', false);
            if (currentValues) groupInstance.setValue(currentValues);
        }
    },
    
    populateCompetitionBrandFilter() {
        if (!appState.brandList || appState.brandList.length === 0) return;

        const choicesOptions = appState.brandList.map(brand => ({ value: brand, label: brand, selected: false }));
        
        const instance = appState.choices['competition_brand'];
        if (instance) {
            const currentValues = instance.getValue(true);
            instance.clearStore();
            instance.setChoices(choicesOptions, 'value', 'label', false);
            if (currentValues && currentValues.length > 0) {
                const validValues = currentValues.filter(val => appState.brandList.includes(val));
                instance.setValue(validValues);
            }
        }
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