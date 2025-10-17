// Version 4.1 - Rework Luy Ke employee detail view with new layout, KPIs, chart, and progress bars
// MODULE: UI SKNV
// Chứa các hàm render giao diện cho tab "Sức khỏe nhân viên"

import { appState } from './state.js';
import { config } from './config.js';
import { services } from './services.js';
import { uiComponents } from './ui-components.js';
import { settingsService } from './modules/settings.service.js';
import { ui } from './ui.js';
import { dragDroplisteners } from './event-listeners/listeners-dragdrop.js';

export const uiSknv = {
    _getSortedDepartmentList(reportData) {
        const allDepts = [...new Set(reportData.map(item => item.boPhan).filter(Boolean))];
        const priorityDept = 'BP Tư Vấn - ĐM';

        allDepts.sort((a, b) => {
            if (a === priorityDept) return -1;
            if (b === priorityDept) return 1;
            return a.localeCompare(b);
        });

        return allDepts;
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
            detailContainerId = 'sknv-details-container'; // Fallback
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
        
        const departmentOrder = uiSknv._getSortedDepartmentList(reportData);
        departmentOrder.forEach(deptName => {
            if (groupedByDept[deptName]) {
                finalHTML += uiSknv.renderRevenueTableForDepartment(deptName, groupedByDept[deptName], sortStateKey);
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

    displayEmployeeIncomeReport: (reportData) => {
        const container = document.getElementById('income-report-container');
        const placeholder = document.getElementById('income-report-placeholder');
        if (!container || !placeholder) return;
        const hasIncomeData = reportData.some(item => item.tongThuNhap > 0 || item.gioCong > 0);
        if (!reportData || reportData.length === 0 || !hasIncomeData) {
            placeholder.classList.remove('hidden'); container.innerHTML = ''; return;
        }
        placeholder.classList.add('hidden');
        let finalHTML = `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><div class="p-4 header-group-2 text-gray-800"><h3 class="text-xl font-bold uppercase">Thu nhập nhân viên</h3><p class="text-sm italic text-gray-600">(đơn vị tính: Triệu đồng)</p></div>`;
        
        const groupedByDept = {};
        reportData.forEach(item => {
            const dept = item.boPhan;
            if (!groupedByDept[dept]) groupedByDept[dept] = [];
            groupedByDept[dept].push(item);
        });
        const departmentOrder = uiSknv._getSortedDepartmentList(reportData);
        
        departmentOrder.forEach(deptName => {
            if (groupedByDept[deptName]) finalHTML += uiSknv.renderIncomeTableForDepartment(deptName, groupedByDept[deptName]);
        });
        
        finalHTML += `</div>`;
        container.innerHTML = finalHTML;
    },

    renderIncomeTableForDepartment: (title, data) => {
        const sortState = appState.sortState.thunhap || { key: 'tongThuNhap', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...data].sort((a, b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });
        
        const totals = data.reduce((acc, item) => {
            acc.gioCong += item.gioCong;
            acc.thuongNong += item.thuongNong;
            acc.thuongERP += item.thuongERP;
            acc.tongThuNhap += item.tongThuNhap;
            acc.thuNhapDuKien += item.thuNhapDuKien;
            acc.thuNhapThangTruoc += item.thuNhapThangTruoc;
            acc.chenhLechThuNhap += item.chenhLechThuNhap;
            return acc;
        }, { gioCong: 0, thuongNong: 0, thuongERP: 0, tongThuNhap: 0, thuNhapDuKien: 0, thuNhapThangTruoc: 0, chenhLechThuNhap: 0 });

        const averageProjectedIncome = data.length > 0 ? totals.thuNhapDuKien / data.length : 0;
        let titleClass = '';
        if (title.includes('Tư Vấn')) titleClass = 'department-header-tv';
        else if (title.includes('Kho')) titleClass = 'department-header-kho';
        else if (title.includes('Trang Trí')) titleClass = 'department-header-tt';

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        let tableHTML = `<div class="department-block"><h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${title} <span class="text-sm font-normal text-gray-500">(Thu nhập DK TB: ${uiComponents.formatRevenue(averageProjectedIncome)})</span></h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="thunhap" data-capture-columns="8">
            <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                <tr>
                                <th class="${headerClass('hoTen')}" data-sort="hoTen">Họ Tên <span class="sort-indicator"></span></th>
                                <th class="${headerClass('gioCong')} text-right" data-sort="gioCong">Giờ công <span class="sort-indicator"></span></th>
                                <th class="${headerClass('tongThuNhap')} text-right" data-sort="tongThuNhap">Tổng thu nhập <span class="sort-indicator"></span></th>
                                <th class="${headerClass('thuNhapDuKien')} text-right" data-sort="thuNhapDuKien">Thu nhập DK <span class="sort-indicator"></span></th>
                                <th class="${headerClass('thuNhapThangTruoc')} text-right" data-sort="thuNhapThangTruoc">Tháng trước <span class="sort-indicator"></span></th>
                                <th class="${headerClass('chenhLechThuNhap')} text-right" data-sort="chenhLechThuNhap">+/- Tháng trước <span class="sort-indicator"></span></th>
                            </tr>
                        </thead><tbody>`;
        sortedData.forEach(nv => {
            const incomeDkCellClass = nv.thuNhapDuKien < averageProjectedIncome ? 'cell-performance is-below' : '';
            const incomeDiffClass = nv.chenhLechThuNhap < 0 ? 'income-negative' : 'income-positive';
            tableHTML += `<tr class="interactive-row">
                    <td class="px-4 py-2 font-semibold line-clamp-2 employee-name-cell" data-employee-id="${nv.maNV}" data-source-tab="sknv">
                        <a href="#">${uiComponents.getShortEmployeeName(nv.hoTen, nv.maNV)}</a>
                    </td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumberOrDash(nv.gioCong)}</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-600">${uiComponents.formatRevenue(nv.tongThuNhap)}</td>
                    <td class="px-4 py-2 text-right font-bold text-green-600 ${incomeDkCellClass}">${uiComponents.formatRevenue(nv.thuNhapDuKien)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(nv.thuNhapThangTruoc)}</td>
                    <td class="px-4 py-2 text-right font-bold ${incomeDiffClass}">${uiComponents.formatRevenue(nv.chenhLechThuNhap)}</td>
                </tr>`;
        });
        tableHTML += `</tbody><tfoot class="table-footer font-bold">
            <tr>
                <td class="px-4 py-2">Tổng</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatNumberOrDash(totals.gioCong)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.tongThuNhap)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.thuNhapDuKien)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.thuNhapThangTruoc)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.chenhLechThuNhap)}</td>
            </tr>
        </tfoot></table></div></div>`;
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

        const departmentOrder = uiSknv._getSortedDepartmentList(reportData);

        departmentOrder.forEach(deptName => {
            if (groupedByDept[deptName]) {
                finalHTML += uiSknv.renderEfficiencyTableForDepartment(deptName, groupedByDept[deptName], sortStateKey, visibleColumns);
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

    displayCategoryRevenueReport: (reportData, containerId, sortStatePrefix) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!reportData || reportData.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Không có dữ liệu ngành hàng.</p>'; return;
        }
        const hasAnyData = reportData.some(item => item.dtICT > 0 || item.dtPhuKien > 0 || item.dtGiaDung > 0 || item.dtCE > 0 || item.dtBaoHiem > 0);
        if (!hasAnyData) {
             container.innerHTML = '<p class="text-yellow-600 font-semibold">Không tìm thấy doanh thu cho các ngành hàng chính.</p>'; return;
        }
        let finalHTML = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div data-capture-group="1" data-capture-columns="6">${uiSknv.renderCategoryTable('ICT', `${sortStatePrefix}_ict`, reportData, 'dtICT', 'slICT', ['slDienThoai', 'slLaptop'], ['SL Điện thoại', 'SL Laptop'])}</div>
                <div data-capture-group="1" data-capture-columns="6">${uiSknv.renderCategoryTable('PHỤ KIỆN', `${sortStatePrefix}_phukien`, reportData, 'dtPhuKien', 'slPhuKien', ['slPinSDP', 'slCamera', 'slTaiNgheBLT'], ['SL Pin SDP', 'SL Camera', 'SL Tai nghe BLT'])}</div>
                <div data-capture-group="2" data-capture-columns="6">${uiSknv.renderCategoryTable('GIA DỤNG', `${sortStatePrefix}_giadung`, reportData, 'dtGiaDung', 'slGiaDung', ['slNoiChien', 'slMLN', 'slRobotHB'], ['SL Nồi chiên', 'SL MLN', 'SL Robot HB'])}</div>
                <div data-capture-group="2" data-capture-columns="6">${uiSknv.renderCategoryTable('CE', `${sortStatePrefix}_ce`, reportData, 'dtCE', 'slCE', ['slTivi', 'slTuLanh', 'slMayGiat', 'slMayLanh'], ['SL Tivi', 'SL Tủ lạnh', 'SL Máy giặt', 'SL Máy lạnh'])}</div>
                <div class="lg:col-span-2" data-capture-group="3" data-capture-columns="7">
                    ${uiSknv.renderCategoryTable('BẢO HIỂM', `${sortStatePrefix}_baohiem`, reportData, 'dtBaoHiem', 'slBaoHiem', ['slBH1d1', 'slBHXM', 'slBHRV', 'slBHMR'], ['BH 1-1', 'BHXM', 'BHRV', 'BHMR'])}
                </div></div>`;
        container.innerHTML = finalHTML;
    },

    displaySknvReport: (filteredReport, forceDetail = false) => {
        const summaryContainer = document.getElementById('sknv-summary-container');
        const detailsContainer = document.getElementById('sknv-details-container');
        if (!summaryContainer || !detailsContainer) return;
    
        const isViewingDetail = appState.viewingDetailFor && appState.viewingDetailFor.sourceTab === 'sknv';
    
        const shouldShowDetail = forceDetail || isViewingDetail;
    
        summaryContainer.classList.toggle('hidden', shouldShowDetail);
        detailsContainer.classList.toggle('hidden', !shouldShowDetail);
    
        if (shouldShowDetail) {
            const employeeId = appState.viewingDetailFor.employeeId;
            const employeeData = appState.masterReportData.sknv.find(nv => String(nv.maNV).trim() === String(employeeId).trim());
            uiSknv.renderSknvDetailForEmployee(employeeData, filteredReport);
        } else {
            uiSknv.displaySknvSummaryReport(filteredReport);
        }
    },
    
    // === START: REWORKED FUNCTION (v4.1) ===
    renderLuykeEmployeeDetail(detailData, employeeData, detailContainerId) {
        const summaryContainer = document.getElementById('revenue-report-container-lk');
        const detailContainer = document.getElementById(detailContainerId);

        if (!summaryContainer || !detailContainer) return;

        summaryContainer.classList.add('hidden');
        detailContainer.classList.remove('hidden');
        
        if (!detailData || !employeeData) {
            detailContainer.innerHTML = `
                <div class="mb-4">
                    <button class="back-to-summary-btn text-blue-600 hover:underline font-semibold">‹ Quay lại bảng tổng hợp</button>
                </div>
                <p class="text-red-500">Không tìm thấy dữ liệu chi tiết cho nhân viên đã chọn.</p>
            `;
            return;
        }

        const { summary, topProductGroups, categoryChartData, byCustomer } = detailData;
        const { mucTieu } = employeeData;
        const conversionRateTarget = (mucTieu?.phanTramQD || 0) / 100;

        const renderKpiCards = () => {
            const conversionRateClass = summary.conversionRate >= conversionRateTarget ? 'is-positive' : 'is-negative';
            return `
            <div class="rt-infographic-summary mb-6">
                <div class="rt-infographic-summary-card"><div class="label">Tổng DT Thực</div><div class="value">${uiComponents.formatRevenue(summary.totalRealRevenue, 1)}</div></div>
                <div class="rt-infographic-summary-card"><div class="label">Tổng DTQĐ</div><div class="value">${uiComponents.formatRevenue(summary.totalConvertedRevenue, 1)}</div></div>
                <div class="rt-infographic-summary-card"><div class="label">Tỷ lệ QĐ</div><div class="value ${conversionRateClass}">${uiComponents.formatPercentage(summary.conversionRate)}</div></div>
                <div class="rt-infographic-summary-card"><div class="label">DT Chưa Xuất</div><div class="value">${uiComponents.formatRevenue(summary.unexportedRevenue, 1)}</div></div>
                <div class="rt-infographic-summary-card"><div class="label">Tổng Đơn Hàng</div><div class="value">${summary.totalOrders}</div></div>
                <div class="rt-infographic-summary-card"><div class="label">SL Đơn Bán Kèm</div><div class="value">${summary.bundledOrderCount}</div></div>
            </div>
            `;
        };

        const renderTopGroupsAsProgressBars = () => {
            if (!topProductGroups || topProductGroups.length === 0) return '<p class="text-sm text-gray-500">Không có doanh thu.</p>';
            
            const maxRevenue = topProductGroups[0]?.realRevenue || 0;
            
            return topProductGroups.map(group => {
                const percentage = maxRevenue > 0 ? (group.realRevenue / maxRevenue) * 100 : 0;
                return `
                <div class="luyke-detail-progress-item">
                    <div class="luyke-detail-progress-label">
                        <span class="font-semibold">${group.name}</span>
                        <span class="text-xs">SL: ${uiComponents.formatNumber(group.quantity)} | %QĐ: ${uiComponents.formatPercentage(group.conversionRate)}</span>
                    </div>
                    <div class="rt-progress-bar-container">
                        <div class="rt-progress-bar" style="width: ${percentage}%;"></div>
                    </div>
                    <div class="luyke-detail-progress-values">
                        <span>DT Thực: <strong>${uiComponents.formatRevenue(group.realRevenue)}</strong></span>
                        <span>DTQĐ: <strong>${uiComponents.formatRevenue(group.convertedRevenue)}</strong></span>
                    </div>
                </div>
                `;
            }).join('');
        };

        const renderCustomerAccordion = () => {
            if (!byCustomer || byCustomer.length === 0) return '<p class="text-sm text-gray-500 mt-4">Không có đơn hàng nào.</p>';
            
            return byCustomer.map((customer, index) => {
                const qdClass = customer.conversionRate >= conversionRateTarget ? 'is-positive' : 'is-negative';
                
                const productListHtml = customer.products.map(p => `
                    <tr class="border-b last:border-b-0">
                        <td class="py-1 pr-2">${p.productName}</td>
                        <td class="py-1 px-2 text-right">SL: <strong>${p.quantity}</strong></td>
                        <td class="py-1 px-2 text-right">DT: <strong>${uiComponents.formatRevenue(p.realRevenue, 1)}</strong></td>
                        <td class="py-1 pl-2 text-right">DTQĐ: <strong>${uiComponents.formatRevenue(p.convertedRevenue, 1)}</strong></td>
                    </tr>
                `).join('');
                
                const tableContent = `<table class="min-w-full text-xs product-list-table"><tbody>${productListHtml}</tbody></table>`;
                
                const detailContent = customer.products.length > 8
                    ? `<div class="product-list-scrollable">${tableContent}</div>`
                    : tableContent;

                return `
                <details class="bg-white rounded-lg shadow-sm border border-gray-200 mb-2">
                    <summary>
                        <span class="customer-name-small">${index + 1}. ${customer.name}</span>
                        <div class="order-metrics">
                            <span>SL: <strong>${customer.totalQuantity}</strong></span>
                            <span>DT Thực: <strong class="text-gray-900">${uiComponents.formatRevenue(customer.totalRealRevenue, 1)} Tr</strong></span>
                            <span>DTQĐ: <strong class="text-blue-600">${uiComponents.formatRevenue(customer.totalConvertedRevenue, 1)} Tr</strong></span>
                            <span>%QĐ: <strong class="${qdClass}">${uiComponents.formatPercentage(customer.conversionRate)}</strong></span>
                        </div>
                        <span class="accordion-arrow">▼</span>
                    </summary>
                    <div class="border-t border-gray-200 p-3 bg-gray-50">
                        ${detailContent}
                    </div>
                </details>
                `;
            }).join('');
        };
        
        const headerHtml = `
            <div class="mb-4 flex justify-between items-center">
                <button class="back-to-summary-btn text-blue-600 hover:underline font-semibold">‹ Quay lại bảng tổng hợp</button>
                <button id="capture-dtnv-lk-detail-btn" class="action-btn action-btn--capture" title="Chụp ảnh chi tiết">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828-.828A2 2 0 0 1 3.172 4H2z"/><path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/></svg>
                    <span>Chụp ảnh</span>
                </button>
            </div>
            <div id="dtnv-lk-capture-area">
                <div class="p-4 mb-6 bg-white text-gray-800 rounded-lg shadow-lg border luyke-detail-header">
                    <h3>${employeeData.hoTen} - ${employeeData.maNV}</h3>
                </div>
                
                ${renderKpiCards()}

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div class="bg-white p-4 rounded-lg shadow-md border">
                        <h4 class="text-md font-bold text-gray-700 border-b pb-2 mb-3">Top 8 Nhóm Hàng Doanh Thu Cao</h4>
                        <div class="space-y-3">
                            ${renderTopGroupsAsProgressBars()}
                        </div>
                    </div>
                    
                    <div class="bg-white p-4 rounded-lg shadow-md border">
                        <h4 class="text-md font-bold text-gray-700 mb-2">Tỷ Trọng Doanh Thu Ngành Hàng</h4>
                        <div class="luyke-detail-chart-container">
                             <canvas id="luyke-employee-chart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="customer-accordion-luyke">
                    <h4 class="text-lg font-bold text-gray-800 mb-3">Chi Tiết Theo Khách Hàng</h4>
                    ${renderCustomerAccordion()}
                </div>
            </div>`;

        detailContainer.innerHTML = headerHtml;

        const ctx = document.getElementById('luyke-employee-chart')?.getContext('2d');
        if (ctx && categoryChartData && categoryChartData.length > 0) {
            if (appState.charts['luyke-employee-chart']) {
                appState.charts['luyke-employee-chart'].destroy();
            }
            const sortedChartData = [...categoryChartData].sort((a,b) => b.revenue - a.revenue);
            const topData = sortedChartData.slice(0, 10);
            
            appState.charts['luyke-employee-chart'] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: topData.map(d => d.name),
                    datasets: [{
                        label: 'Doanh thu',
                        data: topData.map(d => d.revenue / 1000000),
                        backgroundColor: '#3b82f6',
                        borderRadius: 4,
                    }]
                },
                options: {
                    indexAxis: 'x',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: context => `${context.label}: ${uiComponents.formatRevenue(context.raw * 1000000)} Tr`
                            }
                        },
                        datalabels: {
                            anchor: 'end',
                            align: 'end',
                            formatter: (value) => uiComponents.formatRevenue(value * 1000000),
                            color: '#4b5563',
                            font: { weight: 'bold', size: 10 }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                },
                plugins: [ChartDataLabels]
            });
        }
    },
    // === END: REWORKED FUNCTION ===
    
    renderSknvDetailForEmployee(employeeData, filteredReport) {
        const detailsContainer = document.getElementById('sknv-details-container');
        if (!detailsContainer) return;

        if (!employeeData) {
            detailsContainer.innerHTML = `
                <div class="mb-4">
                    <button class="back-to-summary-btn text-blue-600 hover:underline font-semibold">‹ Quay lại bảng tổng hợp</button>
                </div>
                <p class="text-red-500">Không tìm thấy dữ liệu cho nhân viên đã chọn. Vui lòng tải lại dữ liệu YCX nếu cần.</p>
            `;
            return;
        }
    
        const departmentAverages = services.calculateDepartmentAverages(employeeData.boPhan, filteredReport);
        
        const evaluationCounts = {
            doanhthu: { above: 0, below: 0, total: 7 },
            nangsuat: { above: 0, below: 0, total: 7 },
            hieuqua: { above: 0, below: 0, total: 6 },
            dongia: { above: 0, below: 0, total: 7 },
            qdc: { above: 0, below: 0, total: 0 }
        };

        const countEvaluation = (group, value, avgValue, higherIsBetter = true) => {
            if (!isFinite(value) || avgValue === undefined || !isFinite(avgValue)) return;
            let isAbove = higherIsBetter ? (value >= avgValue) : (value <= avgValue);
            if (isAbove) { evaluationCounts[group].above++; } else { evaluationCounts[group].below++; }
        };
        
        const createDetailTableHtml = (title, colorClass, rows) => {
            let rowsHtml = rows.map(row => {
                const evaluation = uiSknv.getSknvEvaluation(row.rawValue, row.rawAverage, row.higherIsBetter);
                return `<tr class="border-t"><td class="px-4 py-2 font-medium text-gray-700">${row.label}</td><td class="px-4 py-2 text-right font-bold text-gray-900 ${row.valueClass || ''}">${row.value}</td><td class="px-4 py-2 text-right font-medium text-gray-500">${row.average}</td><td class="px-4 py-2 text-center font-semibold ${evaluation.class}">${evaluation.text}</td></tr>`
            }).join('');
            return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><h4 class="text-lg font-bold p-3 border-b ${colorClass}">${title}</h4><table class="min-w-full text-sm table-bordered table-striped" data-capture-columns="4">
                <thead class="sknv-subtable-header"><tr><th class="px-4 py-2 text-left">Chỉ số</th><th class="px-4 py-2 text-right">Giá trị</th><th class="px-4 py-2 text-right">Giá trị TB</th><th class="px-4 py-2 text-center">Đánh giá</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
        };
        
        const { mucTieu } = employeeData;

        const doanhThuData = [
            { label: 'Doanh thu thực', value: uiComponents.formatRevenue(employeeData.doanhThu), average: uiComponents.formatRevenue(departmentAverages.doanhThu || 0), rawValue: employeeData.doanhThu, rawAverage: departmentAverages.doanhThu },
            { label: 'Doanh thu quy đổi', value: uiComponents.formatRevenue(employeeData.doanhThuQuyDoi), average: uiComponents.formatRevenue(departmentAverages.doanhThuQuyDoi || 0), rawValue: employeeData.doanhThuQuyDoi, rawAverage: departmentAverages.doanhThuQuyDoi },
            { label: '% Quy đổi', value: uiComponents.formatPercentage(employeeData.hieuQuaQuyDoi), valueClass: (mucTieu && employeeData.hieuQuaQuyDoi < (mucTieu.phanTramQD / 100)) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.hieuQuaQuyDoi), rawValue: employeeData.hieuQuaQuyDoi, rawAverage: departmentAverages.hieuQuaQuyDoi },
            { label: 'Doanh thu CE', value: uiComponents.formatRevenue(employeeData.dtCE), average: uiComponents.formatRevenue(departmentAverages.dtCE || 0), rawValue: employeeData.dtCE, rawAverage: departmentAverages.dtCE },
            { label: 'Doanh thu ICT', value: uiComponents.formatRevenue(employeeData.dtICT), average: uiComponents.formatRevenue(departmentAverages.dtICT || 0), rawValue: employeeData.dtICT, rawAverage: departmentAverages.dtICT },
            { label: 'Doanh thu trả chậm', value: uiComponents.formatRevenue(employeeData.doanhThuTraGop), average: uiComponents.formatRevenue(departmentAverages.doanhThuTraGop || 0), rawValue: employeeData.doanhThuTraGop, rawAverage: departmentAverages.doanhThuTraGop },
            { label: '% Trả chậm', value: uiComponents.formatPercentage(employeeData.tyLeTraCham), valueClass: (mucTieu && employeeData.tyLeTraCham < (mucTieu.phanTramTC / 100)) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.tyLeTraCham), rawValue: employeeData.tyLeTraCham, rawAverage: departmentAverages.tyLeTraCham }
        ];
        doanhThuData.forEach(d => countEvaluation('doanhthu', d.rawValue, d.rawAverage));

        const nangSuatData = [
            { label: 'Thưởng nóng', value: uiComponents.formatRevenue(employeeData.thuongNong), average: uiComponents.formatRevenue(departmentAverages.thuongNong || 0), rawValue: employeeData.thuongNong, rawAverage: departmentAverages.thuongNong },
            { label: 'Thưởng ERP', value: uiComponents.formatRevenue(employeeData.thuongERP), average: uiComponents.formatRevenue(departmentAverages.thuongERP || 0), rawValue: employeeData.thuongERP, rawAverage: departmentAverages.thuongERP },
            { label: 'Thu nhập lũy kế', value: uiComponents.formatRevenue(employeeData.tongThuNhap), average: uiComponents.formatRevenue(departmentAverages.tongThuNhap || 0), rawValue: employeeData.tongThuNhap, rawAverage: departmentAverages.tongThuNhap },
            { label: 'Thu nhập dự kiến', value: uiComponents.formatRevenue(employeeData.thuNhapDuKien), average: uiComponents.formatRevenue(departmentAverages.thuNhapDuKien || 0), rawValue: employeeData.thuNhapDuKien, rawAverage: departmentAverages.thuNhapDuKien },
            { label: 'Giờ công', value: uiComponents.formatNumberOrDash(employeeData.gioCong), average: uiComponents.formatNumberOrDash(departmentAverages.gioCong), rawValue: employeeData.gioCong, rawAverage: departmentAverages.gioCong },
            { label: 'Thu nhập/GC', value: uiComponents.formatNumberOrDash(employeeData.gioCong > 0 ? employeeData.tongThuNhap / employeeData.gioCong : 0), average: uiComponents.formatNumberOrDash((departmentAverages.gioCong || 0) > 0 ? (departmentAverages.tongThuNhap || 0) / departmentAverages.gioCong : 0), rawValue: employeeData.gioCong > 0 ? employeeData.tongThuNhap / employeeData.gioCong : 0, rawAverage: (departmentAverages.gioCong || 0) > 0 ? (departmentAverages.tongThuNhap || 0) / departmentAverages.gioCong : 0 },
            { label: 'Doanh thu QĐ/GC', value: uiComponents.formatRevenue(employeeData.gioCong > 0 ? employeeData.doanhThuQuyDoi / employeeData.gioCong : 0), average: uiComponents.formatRevenue((departmentAverages.gioCong || 0) > 0 ? (departmentAverages.doanhThuQuyDoi || 0) / departmentAverages.gioCong : 0), rawValue: employeeData.gioCong > 0 ? employeeData.doanhThuQuyDoi / employeeData.gioCong : 0, rawAverage: (departmentAverages.gioCong || 0) > 0 ? (departmentAverages.doanhThuQuyDoi || 0) / departmentAverages.gioCong : 0 }
        ];
        nangSuatData.forEach(d => countEvaluation('nangsuat', d.rawValue, d.rawAverage));

        const hieuQuaData = [
            { label: '% PK', value: uiComponents.formatPercentage(employeeData.pctPhuKien), valueClass: (mucTieu && employeeData.pctPhuKien < (mucTieu.phanTramPhuKien / 100)) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.pctPhuKien), rawValue: employeeData.pctPhuKien, rawAverage: departmentAverages.pctPhuKien },
            { label: '% Gia dụng', value: uiComponents.formatPercentage(employeeData.pctGiaDung), valueClass: (mucTieu && employeeData.pctGiaDung < (mucTieu.phanTramGiaDung / 100)) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.pctGiaDung), rawValue: employeeData.pctGiaDung, rawAverage: departmentAverages.pctGiaDung },
            { label: '% MLN', value: uiComponents.formatPercentage(employeeData.pctMLN), valueClass: (mucTieu && employeeData.pctMLN < (mucTieu.phanTramMLN / 100)) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.pctMLN), rawValue: employeeData.pctMLN, rawAverage: departmentAverages.pctMLN },
            { label: '% Sim', value: uiComponents.formatPercentage(employeeData.pctSim), valueClass: (mucTieu && employeeData.pctSim < (mucTieu.phanTramSim / 100)) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.pctSim), rawValue: employeeData.pctSim, rawAverage: departmentAverages.pctSim },
            { label: '% VAS', value: uiComponents.formatPercentage(employeeData.pctVAS), valueClass: (mucTieu && employeeData.pctVAS < (mucTieu.phanTramVAS / 100)) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.pctVAS), rawValue: employeeData.pctVAS, rawAverage: departmentAverages.pctVAS },
            { label: '% Bảo hiểm', value: uiComponents.formatPercentage(employeeData.pctBaoHiem), valueClass: (mucTieu && employeeData.pctBaoHiem < (mucTieu.phanTramBaoHiem / 100)) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.pctBaoHiem), rawValue: employeeData.pctBaoHiem, rawAverage: departmentAverages.pctBaoHiem },
        ];
        hieuQuaData.forEach(d => countEvaluation('hieuqua', d.rawValue, d.rawAverage));

        const donGiaData = [
             { label: 'Đơn giá TB', value: uiComponents.formatRevenue(employeeData.donGiaTrungBinh), average: uiComponents.formatRevenue(departmentAverages.donGiaTrungBinh), rawValue: employeeData.donGiaTrungBinh, rawAverage: departmentAverages.donGiaTrungBinh },
             { label: 'Đơn giá Tivi', value: uiComponents.formatRevenue(employeeData.donGiaTivi), average: uiComponents.formatRevenue(departmentAverages.donGiaTivi), rawValue: employeeData.donGiaTivi, rawAverage: departmentAverages.donGiaTivi },
             { label: 'Đơn giá Tủ lạnh', value: uiComponents.formatRevenue(employeeData.donGiaTuLanh), average: uiComponents.formatRevenue(departmentAverages.donGiaTuLanh), rawValue: employeeData.donGiaTuLanh, rawAverage: departmentAverages.donGiaTuLanh },
             { label: 'Đơn giá Máy giặt', value: uiComponents.formatRevenue(employeeData.donGiaMayGiat), average: uiComponents.formatRevenue(departmentAverages.donGiaMayGiat), rawValue: employeeData.donGiaMayGiat, rawAverage: departmentAverages.donGiaMayGiat },
             { label: 'Đơn giá Máy lạnh', value: uiComponents.formatRevenue(employeeData.donGiaMayLanh), average: uiComponents.formatRevenue(departmentAverages.donGiaMayLanh), rawValue: employeeData.donGiaMayLanh, rawAverage: departmentAverages.donGiaMayLanh },
             { label: 'Đơn giá Điện thoại', value: uiComponents.formatRevenue(employeeData.donGiaDienThoai), average: uiComponents.formatRevenue(departmentAverages.donGiaDienThoai), rawValue: employeeData.donGiaDienThoai, rawAverage: departmentAverages.donGiaDienThoai },
             { label: 'Đơn giá Laptop', value: uiComponents.formatRevenue(employeeData.donGiaLaptop), average: uiComponents.formatRevenue(departmentAverages.donGiaLaptop), rawValue: employeeData.donGiaLaptop, rawAverage: departmentAverages.donGiaLaptop },
        ];
        donGiaData.forEach(d => countEvaluation('dongia', d.rawValue, d.rawAverage));

        const totalAbove = evaluationCounts.doanhthu.above + evaluationCounts.nangsuat.above + evaluationCounts.hieuqua.above + evaluationCounts.dongia.above + evaluationCounts.qdc.above;
        const totalBelow = evaluationCounts.doanhthu.below + evaluationCounts.nangsuat.below + evaluationCounts.hieuqua.below + evaluationCounts.dongia.below + evaluationCounts.qdc.below;
        const totalCriteria = evaluationCounts.doanhthu.total + evaluationCounts.nangsuat.total + evaluationCounts.hieuqua.total + evaluationCounts.dongia.total + evaluationCounts.qdc.total;
        const titleHtml = `CHI TIẾT - ${uiComponents.getShortEmployeeName(employeeData.hoTen, employeeData.maNV)} <span class="font-normal text-sm">(Trên TB: <span class="font-bold text-green-300">${totalAbove}</span>, Dưới TB: <span class="font-bold text-yellow-300">${totalBelow}</span> / Tổng: ${totalCriteria})</span>`;

        detailsContainer.innerHTML = `
            <div class="mb-4 flex justify-between items-center">
                <button class="back-to-summary-btn text-blue-600 hover:underline font-semibold">‹ Quay lại bảng tổng hợp</button>
                <button id="capture-sknv-detail-btn" class="action-btn action-btn--capture" title="Chụp ảnh chi tiết">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828-.828A2 2 0 0 1 3.172 4H2z"/><path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/></svg>
                    <span>Chụp ảnh</span>
                </button>
            </div>
            <div id="sknv-detail-capture-area">
                <div class="p-4 mb-6 bg-blue-600 text-white rounded-lg shadow-lg border border-blue-700" data-capture-group="1"><h3 class="text-2xl font-bold text-center uppercase">${titleHtml}</h3></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6" data-capture-layout="grid">
                    <div class="space-y-6" data-capture-group="1">${createDetailTableHtml('Doanh thu (Triệu)', 'header-bg-blue', doanhThuData)}</div>
                    <div class="space-y-6" data-capture-group="1">${createDetailTableHtml('Năng suất (Triệu)', 'header-bg-green', nangSuatData)}</div>
                    <div class="space-y-6" data-capture-group="1">${createDetailTableHtml('Hiệu quả khai thác', 'header-bg-blue', hieuQuaData)}</div>
                    <div class="space-y-6" data-capture-group="1">${createDetailTableHtml('Đơn giá (Triệu)', 'header-bg-yellow', donGiaData)}</div>
                    <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6" data-capture-layout="grid">
                        <div data-capture-group="1">${uiSknv.renderSknvQdcTable(employeeData, departmentAverages, countEvaluation, evaluationCounts)}</div>
                        <div data-capture-group="1">${uiSknv.renderSknvNganhHangTable(employeeData)}</div>
                    </div>
                </div>
            </div>`;
    },

    displaySknvSummaryReport: (reportData) => {
        const container = document.getElementById('sknv-summary-container');
        if (!container) return;

        if (!reportData || reportData.length === 0) {
             container.innerHTML = ''; return;
        }

        const summaryData = reportData.map(employee => {
            const departmentAverages = services.calculateDepartmentAverages(employee.boPhan, reportData);
            const counts = {
                doanhthu: { above: 0, below: 0, total: 7 },
                nangsuat: { above: 0, below: 0, total: 7 },
                hieuqua: { above: 0, below: 0, total: 6 },
                dongia: { above: 0, below: 0, total: 7 },
                qdc: { above: 0, below: 0, total: 0 }
            };

            const checkAndCount = (group, value, avg, higherIsBetter = true) => {
                if (!isFinite(value) || avg === undefined || !isFinite(avg)) return;
                const isAbove = higherIsBetter ? (value >= avg) : (value <= avg);
                if (isAbove) counts[group].above++; else counts[group].below++;
            };
        
            
            checkAndCount('doanhthu', employee.doanhThu, departmentAverages.doanhThu);
            checkAndCount('doanhthu', employee.doanhThuQuyDoi, departmentAverages.doanhThuQuyDoi);
            checkAndCount('doanhthu', employee.hieuQuaQuyDoi, departmentAverages.hieuQuaQuyDoi);
            checkAndCount('doanhthu', employee.dtCE, departmentAverages.dtCE);
            checkAndCount('doanhthu', employee.dtICT, departmentAverages.dtICT);
            checkAndCount('doanhthu', employee.doanhThuTraGop, departmentAverages.doanhThuTraGop);
            checkAndCount('doanhthu', employee.tyLeTraCham, departmentAverages.tyLeTraCham);

            checkAndCount('nangsuat', employee.thuongNong, departmentAverages.thuongNong);
            checkAndCount('nangsuat', employee.thuongERP, departmentAverages.thuongERP);
            checkAndCount('nangsuat', employee.tongThuNhap, departmentAverages.tongThuNhap);
            checkAndCount('nangsuat', employee.thuNhapDuKien, departmentAverages.thuNhapDuKien);
            checkAndCount('nangsuat', employee.gioCong, departmentAverages.gioCong);
            checkAndCount('nangsuat', employee.gioCong > 0 ? employee.tongThuNhap / employee.gioCong : 0, departmentAverages.gioCong > 0 ? departmentAverages.tongThuNhap / departmentAverages.gioCong : 0);
            checkAndCount('nangsuat', employee.gioCong > 0 ? employee.doanhThuQuyDoi / employee.gioCong : 0, departmentAverages.gioCong > 0 ? departmentAverages.doanhThuQuyDoi / departmentAverages.gioCong : 0);
            
            checkAndCount('hieuqua', employee.pctPhuKien, departmentAverages.pctPhuKien);
            checkAndCount('hieuqua', employee.pctGiaDung, departmentAverages.pctGiaDung);
            checkAndCount('hieuqua', employee.pctMLN, departmentAverages.pctMLN);
            checkAndCount('hieuqua', employee.pctSim, departmentAverages.pctSim);
            checkAndCount('hieuqua', employee.pctVAS, departmentAverages.pctVAS);
            checkAndCount('hieuqua', employee.pctBaoHiem, departmentAverages.pctBaoHiem);

            checkAndCount('dongia', employee.donGiaTrungBinh, departmentAverages.donGiaTrungBinh);
            checkAndCount('dongia', employee.donGiaTivi, departmentAverages.donGiaTivi);
            checkAndCount('dongia', employee.donGiaTuLanh, departmentAverages.donGiaTuLanh);
            checkAndCount('dongia', employee.donGiaMayGiat, departmentAverages.donGiaMayGiat);
            checkAndCount('dongia', employee.donGiaMayLanh, departmentAverages.donGiaMayLanh);
            checkAndCount('dongia', employee.donGiaDienThoai, departmentAverages.donGiaDienThoai);
            checkAndCount('dongia', employee.donGiaLaptop, departmentAverages.donGiaLaptop);

            if(employee.qdc && departmentAverages.qdc) {
                for (const key in employee.qdc) {
                    if(departmentAverages.qdc[key]) {
                        counts.qdc.total++;
                        checkAndCount('qdc', employee.qdc[key].dtqd, departmentAverages.qdc[key].dtqd);
                    }
                }
            }

            const totalAbove = counts.doanhthu.above + counts.nangsuat.above + counts.hieuqua.above + counts.dongia.above + counts.qdc.above;
            return { ...employee, summary: counts, totalAbove };
        });

        const { key, direction } = appState.sortState.sknv_summary;
        summaryData.sort((a, b) => {
            let valA, valB;
            if (key === 'totalAbove') { valA = a.totalAbove; valB = b.totalAbove; }
            else if (key.endsWith('Above')) { const group = key.replace('Above',''); valA = a.summary[group].above; valB = b.summary[group].above; }
            else if (key.endsWith('Below')) { const group = key.replace('Below',''); valA = a.summary[group].below; valB = b.summary[group].below; }
            else { valA = a[key]; valB = b[key]; }

            if (typeof valA === 'string') return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            return direction === 'asc' ? valA - valB : valB - valA;
        });
        
        const headerClass = (sortKey) => `px-2 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
       
        let tableHTML = `<div class="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-200"><h3 class="text-xl font-bold text-gray-800 mb-4 uppercase">Bảng tổng hợp hiệu suất nhân viên</h3><div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered" data-table-type="sknv_summary">
            <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                <tr>
                    <th rowspan="2" class="${headerClass('hoTen')}" data-sort="hoTen">Nhân viên</th>
                    <th rowspan="2" class="${headerClass('totalAbove')}" data-sort="totalAbove">Tổng trên TB</th>
                    <th colspan="2">Doanh thu</th>
                    <th colspan="2">Năng suất</th>
                    <th colspan="2">Hiệu quả</th>
                    <th colspan="2">Đơn giá</th>
                    <th colspan="2">Nhóm Hàng QĐC</th>
                </tr>
                <tr>
                    <th class="${headerClass('doanhthuAbove')}" data-sort="doanhthuAbove">Trên</th><th class="${headerClass('doanhthuBelow')}" data-sort="doanhthuBelow">Dưới</th>
                    <th class="${headerClass('nangsuatAbove')}" data-sort="nangsuatAbove">Trên</th><th class="${headerClass('nangsuatBelow')}" data-sort="nangsuatBelow">Dưới</th>
                    <th class="${headerClass('hieuquaAbove')}" data-sort="hieuquaAbove">Trên</th><th class="${headerClass('hieuquaBelow')}" data-sort="hieuquaBelow">Dưới</th>
                    <th class="${headerClass('dongiaAbove')}" data-sort="dongiaAbove">Trên</th><th class="${headerClass('dongiaBelow')}" data-sort="dongiaBelow">Dưới</th>
                    <th class="${headerClass('qdcAbove')}" data-sort="qdcAbove">Trên</th><th class="${headerClass('qdcBelow')}" data-sort="qdcBelow">Dưới</th>
                </tr>
            </thead><tbody>`;
        
        const groupedByDept = {};
        summaryData.forEach(item => {
            if (!groupedByDept[item.boPhan]) groupedByDept[item.boPhan] = [];
            groupedByDept[item.boPhan].push(item);
        });

        const departmentOrder = uiSknv._getSortedDepartmentList(summaryData);

        departmentOrder.forEach(deptName => {
            if (groupedByDept[deptName]) {
                tableHTML += `<tr class="font-bold bg-slate-100"><td colspan="12" class="px-4 py-2">${deptName}</td></tr>`;
                groupedByDept[deptName].forEach(item => {
                    tableHTML += `<tr class="interactive-row">
                        <td class="px-2 py-2 font-semibold line-clamp-2 employee-name-cell" data-employee-id="${item.maNV}" data-source-tab="sknv">
                            <a href="#">${uiComponents.getShortEmployeeName(item.hoTen, item.maNV)}</a>
                        </td>
                        <td class="px-2 py-2 text-center font-bold text-lg text-blue-600">${item.totalAbove}</td>
                        <td class="px-2 py-2 text-center text-green-600 font-semibold">${item.summary.doanhthu.above}/${item.summary.doanhthu.total}</td><td class="px-2 py-2 text-center text-red-600">${item.summary.doanhthu.below}/${item.summary.doanhthu.total}</td>
                        <td class="px-2 py-2 text-center text-green-600 font-semibold">${item.summary.nangsuat.above}/${item.summary.nangsuat.total}</td><td class="px-2 py-2 text-center text-red-600">${item.summary.nangsuat.below}/${item.summary.nangsuat.total}</td>
                        <td class="px-2 py-2 text-center text-green-600 font-semibold">${item.summary.hieuqua.above}/${item.summary.hieuqua.total}</td><td class="px-2 py-2 text-center text-red-600">${item.summary.hieuqua.below}/${item.summary.hieuqua.total}</td>
                        <td class="px-2 py-2 text-center text-green-600 font-semibold">${item.summary.dongia.above}/${item.summary.dongia.total}</td><td class="px-2 py-2 text-center text-red-600">${item.summary.dongia.below}/${item.summary.dongia.total}</td>
                        <td class="px-2 py-2 text-center text-green-600 font-semibold">${item.summary.qdc.above}/${item.summary.qdc.total}</td><td class="px-2 py-2 text-center text-red-600">${item.summary.qdc.below}/${item.summary.qdc.total}</td>
                    </tr>`;
                });
            }
        });

        tableHTML += `</tbody></table></div></div>`;
        container.innerHTML = tableHTML;
    },
    
    getSknvEvaluation: (value, avgValue, higherIsBetter = true) => {
        if (!isFinite(value) || avgValue === undefined || !isFinite(avgValue)) return { text: '-', class: '' };
        const isAbove = higherIsBetter ? (value >= avgValue) : (value <= avgValue);
        return {
            text: isAbove ? 'Trên TB' : 'Dưới TB',
            class: isAbove ? 'text-green-600' : 'text-yellow-600'
        };
    },
    
    renderSknvNganhHangTable(employeeData) {
        const { doanhThuTheoNganhHang } = employeeData;
        const sortState = appState.sortState.sknv_nganhhang_chitiet || { key: 'revenue', direction: 'desc' };
        const { key, direction } = sortState;
        
        const dataArray = Object.entries(doanhThuTheoNganhHang)
            .map(([name, values]) => ({ name, ...values }))
            .filter(item => item.revenue > 0);

        if (dataArray.length === 0) return '<div class="bg-white rounded-xl shadow-md border border-gray-200 p-4"><h4 class="text-lg font-bold p-3 border-b header-bg-purple">Doanh thu theo Ngành hàng</h4><p class="p-4 text-gray-500">Không có dữ liệu.</p></div>';

        const sortedData = [...dataArray].sort((a,b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key]);
        const headerClass = (sortKey) => `px-4 py-2 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><h4 class="text-lg font-bold p-3 border-b header-bg-purple">Doanh thu theo Ngành hàng</h4><div class="overflow-x-auto" style="max-height: 400px;"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="sknv_nganhhang_chitiet">
            <thead class="sknv-subtable-header"><tr>
                <th class="${headerClass('name')}" data-sort="name">Ngành hàng</th>
                <th class="${headerClass('quantity')} text-right" data-sort="quantity">SL</th>
                <th class="${headerClass('revenue')} text-right" data-sort="revenue">Doanh thu</th>
                <th class="${headerClass('revenueQuyDoi')} text-right" data-sort="revenueQuyDoi">DTQĐ</th>
            </tr></thead>
            <tbody>${sortedData.map(item => `
                <tr class="border-t">
                    <td class="px-4 py-2 font-medium">${item.name}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumberOrDash(item.quantity)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.revenue, 0)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.revenueQuyDoi, 0)}</td>
                </tr>`).join('')}
            </tbody></table></div></div>`;
    },

    renderSknvQdcTable(employeeData, departmentAverages, countCallback, evaluationCounts) {
        const qdcData = employeeData.qdc;
        const avgQdcData = departmentAverages.qdc;

        const sortState = appState.sortState.sknv_qdc || { key: 'dtqd', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = Object.entries(qdcData)
            .map(([id, values]) => ({ id, ...values }))
            .filter(item => item.sl > 0)
            .sort((a,b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key]);

        if (sortedData.length === 0) {
            evaluationCounts.qdc.total = 0;
            return '<div class="bg-white rounded-xl shadow-md border border-gray-200 p-4"><h4 class="text-lg font-bold p-3 border-b header-bg-indigo">Nhóm hàng Quy đổi cao</h4><p class="p-4 text-gray-500">Không có dữ liệu.</p></div>';
        }
        
        evaluationCounts.qdc.total = sortedData.length;

        const headerClass = (sortKey) => `px-4 py-2 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><h4 class="text-lg font-bold p-3 border-b header-bg-indigo">Nhóm hàng Quy đổi cao</h4><div class="overflow-x-auto" style="max-height: 400px;"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="sknv_qdc">
            <thead class="sknv-subtable-header"><tr>
                <th class="${headerClass('name')}" data-sort="name">Nhóm hàng</th>
                <th class="${headerClass('sl')} text-right" data-sort="sl">SL</th>
                <th class="${headerClass('dtqd')} text-right" data-sort="dtqd">DTQĐ (Tr)</th>
                <th class="px-4 py-2 text-center">Đánh giá</th>
            </tr></thead>
            <tbody>${sortedData.map(item => {
                const avgValue = avgQdcData?.[item.id]?.dtqd;
                const evaluation = uiSknv.getSknvEvaluation(item.dtqd, avgValue);
                countCallback('qdc', item.dtqd, avgValue);
                return `<tr class="border-t">
                    <td class="px-4 py-2 font-medium">${item.name}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumberOrDash(item.sl)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.dtqd)}</td>
                    <td class="px-4 py-2 text-center font-semibold ${evaluation.class}">${evaluation.text}</td>
                </tr>`}).join('')}
            </tbody></table></div></div>`;
    },
};