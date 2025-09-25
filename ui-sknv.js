// Version 2.3 - Restore competition report processing logic
// MODULE: UI SKNV
// Chứa các hàm render giao diện cho tab "Sức khỏe nhân viên".

import { appState } from './state.js';
import { config } from './config.js';
import { services } from './services.js';
import { uiComponents } from './ui-components.js';
import { utils } from './utils.js';


export const uiSknv = {
    displayEmployeeRevenueReport: (reportData, containerId, sortStateKey) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!reportData || reportData.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Không có dữ liệu doanh thu cho lựa chọn này.</p>';
            return;
        }
        let finalHTML = `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><div class="p-4 header-group-1 text-gray-800"><h3 class="text-xl font-bold uppercase">Doanh thu nhân viên</h3><p class="text-sm italic text-gray-600">(đơn vị tính: Triệu đồng)</p></div>`;
        const groupedByDept = {};
        reportData.forEach(item => {
            const dept = item.boPhan;
            if (!groupedByDept[dept]) groupedByDept[dept] = [];
            groupedByDept[dept].push(item);
        });
        
        if (config && config.DEPARTMENT_GROUPS) {
            config.DEPARTMENT_GROUPS.forEach(deptName => {
                if (groupedByDept[deptName]) {
                    finalHTML += uiSknv.renderRevenueTableForDepartment(deptName, groupedByDept[deptName], sortStateKey);
                }
            });
        }

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
        
        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        
        let tableHTML = `<div class="department-block"><h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${title}</h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}" data-capture-columns="7">
                        <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                            <tr>
                                <th class="${headerClass('hoTen')}" data-sort="hoTen">Nhân viên <span class="sort-indicator"></span></th>
                                <th class="${headerClass('doanhThu')} text-right header-group-7" data-sort="doanhThu">Doanh Thu <span class="sort-indicator"></span></th>
                                <th class="${headerClass('doanhThuQuyDoi')} text-right header-group-7" data-sort="doanhThuQuyDoi">Doanh Thu QĐ <span class="sort-indicator"></span></th>
                                <th class="${headerClass('hieuQuaQuyDoi')} text-right header-group-7" data-sort="hieuQuaQuyDoi">% QĐ <span class="sort-indicator"></span></th>
                                <th class="${headerClass('doanhThuTraGop')} text-right header-group-8" data-sort="doanhThuTraGop">DT trả chậm <span class="sort-indicator"></span></th>
                                <th class="${headerClass('tyLeTraCham')} text-right header-group-8" data-sort="tyLeTraCham">% trả chậm <span class="sort-indicator"></span></th>
                                <th class="${headerClass('doanhThuChuaXuat')} text-right header-group-9" data-sort="doanhThuChuaXuat">DT Chưa Xuất <span class="sort-indicator"></span></th>
                            </tr>
                        </thead><tbody>`;
        sortedData.forEach(item => {
            const { mucTieu } = item;
            const qdClass = item.hieuQuaQuyDoi < ((mucTieu?.phanTramQD || 0) / 100) ? 'cell-performance is-below' : '';
            const tcClass = item.tyLeTraCham < ((mucTieu?.phanTramTC || 0) / 100) ? 'cell-performance is-below' : '';
            tableHTML += `<tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-semibold line-clamp-2">${uiComponents.getShortEmployeeName(item.hoTen, item.maNV)}</td>
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
        
        if(config && config.DEPARTMENT_GROUPS) {
            config.DEPARTMENT_GROUPS.forEach(deptName => {
                if (groupedByDept[deptName]) finalHTML += uiSknv.renderIncomeTableForDepartment(deptName, groupedByDept[deptName]);
            });
        }
        
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
        let tableHTML = `<div class="department-block"><h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${title} <span class="text-sm font-normal text-gray-500">(Thu nhập DK TB: ${uiComponents.formatRevenue(averageProjectedIncome)}</span></h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="thunhap" data-capture-columns="8">
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
            tableHTML += `<tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-semibold line-clamp-2">${uiComponents.getShortEmployeeName(nv.hoTen, nv.maNV)}</td>
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
        let finalHTML = `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><div class="p-4 header-group-3 text-gray-800"><h3 class="text-xl font-bold uppercase">HIỆU QUẢ KHAI THÁC</h3><p class="text-sm italic text-gray-600">(đơn vị tính: Triệu đồng)</p></div>`;
        const groupedByDept = {};
        reportData.forEach(item => {
            const dept = item.boPhan;
            if (!groupedByDept[dept]) groupedByDept[dept] = [];
            groupedByDept[dept].push(item);
        });

        if (config && config.DEPARTMENT_GROUPS) {
            config.DEPARTMENT_GROUPS.forEach(deptName => {
                if (groupedByDept[deptName]) finalHTML += uiSknv.renderEfficiencyTableForDepartment(deptName, groupedByDept[deptName], sortStateKey);
            });
        }

        finalHTML += `</div>`;
        container.innerHTML = finalHTML;
    },

    renderEfficiencyTableForDepartment: (title, data, sortStateKey) => {
        const sortState = appState.sortState[sortStateKey] || { key: 'dtICT', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...data].sort((a, b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });

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

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        let tableHTML = `<div class="department-block"><h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${title}</h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}" data-capture-columns="11">
                    <thead class="text-xs text-slate-800 uppercase font-bold">
                        <tr>
                            <th class="${headerClass('hoTen')}" data-sort="hoTen">Tên nhân viên <span class="sort-indicator"></span></th>
                            <th class="${headerClass('dtICT')} text-right header-group-10" data-sort="dtICT">DT ICT <span class="sort-indicator"></span></th>
                            <th class="${headerClass('dtPhuKien')} text-right header-group-10" data-sort="dtPhuKien">DT Phụ kiện <span class="sort-indicator"></span></th>
                            <th class="${headerClass('pctPhuKien')} text-right header-group-10" data-sort="pctPhuKien">% Phụ kiện <span class="sort-indicator"></span></th>
                            <th class="${headerClass('dtCE')} text-right header-group-11" data-sort="dtCE">DT CE <span class="sort-indicator"></span></th>
                            <th class="${headerClass('dtGiaDung')} text-right header-group-11" data-sort="dtGiaDung">DT Gia dụng <span class="sort-indicator"></span></th>
                            <th class="${headerClass('pctGiaDung')} text-right header-group-11" data-sort="pctGiaDung">% Gia dụng <span class="sort-indicator"></span></th>
                            <th class="${headerClass('pctMLN')} text-right header-group-12" data-sort="pctMLN">% MLN <span class="sort-indicator"></span></th>
                            <th class="${headerClass('pctSim')} text-right header-group-12" data-sort="pctSim">% Sim <span class="sort-indicator"></span></th>
                            <th class="${headerClass('pctVAS')} text-right header-group-12" data-sort="pctVAS">% VAS <span class="sort-indicator"></span></th>
                            <th class="${headerClass('pctBaoHiem')} text-right header-group-12" data-sort="pctBaoHiem">% Bảo hiểm <span class="sort-indicator"></span></th>
                        </tr>
                    </thead><tbody>`;
        sortedData.forEach(item => {
            const { mucTieu } = item;
            const pkClass = item.pctPhuKien < ((mucTieu?.phanTramPhuKien || 0) / 100) ? 'cell-performance is-below' : '';
            const gdClass = item.pctGiaDung < ((mucTieu?.phanTramGiaDung || 0) / 100) ? 'cell-performance is-below' : '';
            const mlnClass = item.pctMLN < ((mucTieu?.phanTramMLN || 0) / 100) ? 'cell-performance is-below' : '';
            const simClass = item.pctSim < ((mucTieu?.phanTramSim || 0) / 100) ? 'cell-performance is-below' : '';
            const vasClass = item.pctVAS < ((mucTieu?.phanTramVAS || 0) / 100) ? 'cell-performance is-below' : '';
            const bhClass = item.pctBaoHiem < ((mucTieu?.phanTramBaoHiem || 0) / 100) ? 'cell-performance is-below' : '';

            tableHTML += `<tr class="hover:bg-gray-50">
                <td class="px-4 py-2 font-semibold line-clamp-2">${uiComponents.getShortEmployeeName(item.hoTen, item.maNV)}</td>
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.dtICT)}</td>
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.dtPhuKien)}</td>
                <td class="px-4 py-2 text-right font-bold ${pkClass}">${uiComponents.formatPercentage(item.pctPhuKien)}</td>
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.dtCE)}</td>
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.dtGiaDung)}</td>
                <td class="px-4 py-2 text-right font-bold ${gdClass}">${uiComponents.formatPercentage(item.pctGiaDung)}</td>
                <td class="px-4 py-2 text-right font-bold ${mlnClass}">${uiComponents.formatPercentage(item.pctMLN)}</td>
                <td class="px-4 py-2 text-right font-bold ${simClass}">${uiComponents.formatPercentage(item.pctSim)}</td>
                <td class="px-4 py-2 text-right font-bold ${vasClass}">${uiComponents.formatPercentage(item.pctVAS)}</td>
                <td class="px-4 py-2 text-right font-bold ${bhClass}">${uiComponents.formatPercentage(item.pctBaoHiem)}</td></tr>`;
        });
        tableHTML += `</tbody><tfoot class="table-footer font-bold">
            <tr>
                <td class="px-4 py-2">Tổng</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.dtICT)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.dtPhuKien)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatPercentage(totals.pctPhuKien)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.dtCE)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.dtGiaDung)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatPercentage(totals.pctGiaDung)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatPercentage(totals.pctMLN)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatPercentage(totals.pctSim)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatPercentage(totals.pctVAS)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatPercentage(totals.pctBaoHiem)}</td>
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

    renderCategoryTable: (title, type, data, revenueField, slField, keys, headers) => {
        const sortState = appState.sortState[type] || { key: revenueField, direction: 'desc' };
        const { key, direction } = sortState;
        const relevantData = data.filter(item => item[revenueField] > 0 || item[slField] > 0);
        if (relevantData.length === 0) return '';
        const sortedData = [...relevantData].sort((a, b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });
        const totals = relevantData.reduce((acc, item) => {
            acc[revenueField] = (acc[revenueField] || 0) + item[revenueField];
            acc[slField] = (acc[slField] || 0) + item[slField];
            keys.forEach(k => {
                acc[k] = (acc[k] || 0) + item[k];
            });
            return acc;
        }, {});

        const headerClass = (sortKey) => {
            let classes = `px-4 py-3 sortable `;
            if (sortKey === slField || sortKey === revenueField) {
                classes += 'header-highlight-special ';
            }
            if (key === sortKey) {
                classes += direction === 'asc' ? 'sorted-asc' : 'sorted-desc';
            }
            return classes;
        };
        
        const colorKey = type.split('_').pop();

        let tableHTML = `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-full flex flex-col">
            <h4 class="text-lg font-bold p-4 border-b border-gray-200 category-header-${colorKey}">${title}</h4>
            <div class="overflow-x-auto flex-grow"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${type}" data-capture-columns="${3 + keys.length}"><thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold"><tr>
                <th class="${headerClass('hoTen')}" data-sort="hoTen">Tên nhân viên <span class="sort-indicator"></span></th>
                <th class="${headerClass(slField)} text-right" data-sort="${slField}">SL <span class="sort-indicator"></span></th>
                <th class="${headerClass(revenueField)} text-right" data-sort="${revenueField}">Doanh thu thực <span class="sort-indicator"></span></th>`;
        headers.forEach((h, i) => {
            tableHTML += `<th class="${headerClass(keys[i])} text-right" data-sort="${keys[i]}">${h} <span class="sort-indicator"></span></th>`;
        });
        tableHTML += `</tr></thead><tbody>`;
        sortedData.forEach(item => {
            tableHTML += `<tr class="hover:bg-gray-50"><td class="px-4 py-2 font-semibold line-clamp-2">${uiComponents.getShortEmployeeName(item.hoTen, item.maNV)}</td>
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumberOrDash(item[slField])}</td>
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item[revenueField])}</td>`;
            keys.forEach(k => { tableHTML += `<td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumberOrDash(item[k])}</td>`; });
            tableHTML += `</tr>`;
        });
        tableHTML += `</tbody><tfoot class="table-footer font-bold">
                <tr><td class="px-4 py-2">Tổng</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatNumberOrDash(totals[slField])}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals[revenueField])}</td>`;
        keys.forEach(k => { tableHTML += `<td class="px-4 py-2 text-right">${uiComponents.formatNumberOrDash(totals[k])}</td>`; });
        tableHTML += `</tr></tfoot></table></div></div>`;
        return tableHTML;
    },

    displaySknvReport: (filteredReport) => {
        const selectedMaNV = document.getElementById('sknv-employee-filter')?.value;
        const activeViewBtn = document.querySelector('#sknv-view-selector .view-switcher__btn.active');
        const viewType = activeViewBtn ? activeViewBtn.dataset.view : 'summary';

        const summaryContainer = document.getElementById('sknv-summary-container');
        const detailsContainer = document.getElementById('sknv-details-container');

        if (!summaryContainer || !detailsContainer) return;
        
        summaryContainer.classList.toggle('hidden', viewType === 'detail');
        detailsContainer.classList.toggle('hidden', viewType === 'summary');

        if (viewType === 'summary') {
            uiSknv.displaySknvSummaryReport(filteredReport);
        } else {
            const employeeData = appState.masterReportData.sknv.find(nv => String(nv.maNV).trim() == String(selectedMaNV).trim());
            uiSknv.renderSknvDetailForEmployee(employeeData, filteredReport);
        }
    },
    
    renderSknvDetailForEmployee(employeeData, filteredReport) {
        const detailsContainer = document.getElementById('sknv-details-container');
        if (!detailsContainer) return;

        if (!employeeData) {
            detailsContainer.innerHTML = '<p class="text-red-500">Không tìm thấy dữ liệu cho nhân viên đã chọn. Vui lòng tải lại dữ liệu YCX nếu cần.</p>';
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
            { label: '% Quy đổi', value: uiComponents.formatPercentage(employeeData.hieuQuaQuyDoi), valueClass: employeeData.hieuQuaQuyDoi < ((mucTieu?.phanTramQD || 0) /100) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.hieuQuaQuyDoi), rawValue: employeeData.hieuQuaQuyDoi, rawAverage: departmentAverages.hieuQuaQuyDoi },
            { label: 'Doanh thu CE', value: uiComponents.formatRevenue(employeeData.dtCE), average: uiComponents.formatRevenue(departmentAverages.dtCE || 0), rawValue: employeeData.dtCE, rawAverage: departmentAverages.dtCE },
            { label: 'Doanh thu ICT', value: uiComponents.formatRevenue(employeeData.dtICT), average: uiComponents.formatRevenue(departmentAverages.dtICT || 0), rawValue: employeeData.dtICT, rawAverage: departmentAverages.dtICT },
            { label: 'Doanh thu trả chậm', value: uiComponents.formatRevenue(employeeData.doanhThuTraGop), average: uiComponents.formatRevenue(departmentAverages.doanhThuTraGop || 0), rawValue: employeeData.doanhThuTraGop, rawAverage: departmentAverages.doanhThuTraGop },
            { label: '% Trả chậm', value: uiComponents.formatPercentage(employeeData.tyLeTraCham), valueClass: employeeData.tyLeTraCham < ((mucTieu?.phanTramTC || 0) /100) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.tyLeTraCham), rawValue: employeeData.tyLeTraCham, rawAverage: departmentAverages.tyLeTraCham }
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
            { label: '% PK', value: uiComponents.formatPercentage(employeeData.pctPhuKien), valueClass: employeeData.pctPhuKien < ((mucTieu?.phanTramPhuKien || 0)/100) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.pctPhuKien), rawValue: employeeData.pctPhuKien, rawAverage: departmentAverages.pctPhuKien },
            { label: '% Gia dụng', value: uiComponents.formatPercentage(employeeData.pctGiaDung), valueClass: employeeData.pctGiaDung < ((mucTieu?.phanTramGiaDung || 0)/100) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.pctGiaDung), rawValue: employeeData.pctGiaDung, rawAverage: departmentAverages.pctGiaDung },
            { label: '% MLN', value: uiComponents.formatPercentage(employeeData.pctMLN), valueClass: employeeData.pctMLN < ((mucTieu?.phanTramMLN || 0)/100) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.pctMLN), rawValue: employeeData.pctMLN, rawAverage: departmentAverages.pctMLN },
            { label: '% Sim', value: uiComponents.formatPercentage(employeeData.pctSim), valueClass: employeeData.pctSim < ((mucTieu?.phanTramSim || 0)/100) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.pctSim), rawValue: employeeData.pctSim, rawAverage: departmentAverages.pctSim },
            { label: '% VAS', value: uiComponents.formatPercentage(employeeData.pctVAS), valueClass: employeeData.pctVAS < ((mucTieu?.phanTramVAS || 0)/100) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.pctVAS), rawValue: employeeData.pctVAS, rawAverage: departmentAverages.pctVAS },
            { label: '% Bảo hiểm', value: uiComponents.formatPercentage(employeeData.pctBaoHiem), valueClass: employeeData.pctBaoHiem < ((mucTieu?.phanTramBaoHiem || 0)/100) ? 'cell-performance is-below' : '', average: uiComponents.formatPercentage(departmentAverages.pctBaoHiem), rawValue: employeeData.pctBaoHiem, rawAverage: departmentAverages.pctBaoHiem },
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

        detailsContainer.innerHTML = `<div class="p-4 mb-6 bg-blue-600 text-white rounded-lg shadow-lg border border-blue-700" data-capture-group="1"><h3 class="text-2xl font-bold text-center uppercase">${titleHtml}</h3></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6" data-capture-layout="grid">
                <div class="space-y-6" data-capture-group="1">${createDetailTableHtml('Doanh thu (Triệu)', 'header-bg-blue', doanhThuData)}</div>
                <div class="space-y-6" data-capture-group="1">${createDetailTableHtml('Năng suất (Triệu)', 'header-bg-green', nangSuatData)}</div>
                <div class="space-y-6" data-capture-group="1">${createDetailTableHtml('Hiệu quả khai thác', 'header-bg-blue', hieuQuaData)}</div>
                <div class="space-y-6" data-capture-group="1">${createDetailTableHtml('Đơn giá (Triệu)', 'header-bg-yellow', donGiaData)}</div>
                <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6" data-capture-layout="grid">
                    <div data-capture-group="1">${uiSknv.renderSknvQdcTable(employeeData, departmentAverages, countEvaluation, evaluationCounts)}</div>
                    <div data-capture-group="1">${uiSknv.renderSknvNganhHangTable(employeeData)}</div>
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

        config.DEPARTMENT_GROUPS.forEach(deptName => {
            if (groupedByDept[deptName]) {
                tableHTML += `<tr class="font-bold bg-slate-100"><td colspan="12" class="px-4 py-2">${deptName}</td></tr>`;
                groupedByDept[deptName].forEach(item => {
                    tableHTML += `<tr class="hover:bg-gray-50">
                        <td class="px-2 py-2 font-semibold line-clamp-2">${uiComponents.getShortEmployeeName(item.hoTen, item.maNV)}</td>
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

    // --- HÀM ĐƯỢC CẬP NHẬT (FIX BUG 2) ---
    displayCompetitionReport() {
        const container = document.getElementById('employee-competition-container');
        if (!container) return;
    
        const data = appState.thiDuaReportData;
        const activeViewBtn = document.querySelector('#thidua-view-selector .view-switcher__btn.active');
        const viewType = activeViewBtn ? activeViewBtn.dataset.view : 'summary';
    
        // Hiển thị thông tin chẩn đoán trước
        uiComponents.displayPastedDebugInfo('thiduanv-pasted');
    
        // Kiểm tra xem có dữ liệu đã xử lý để hiển thị không
        if (!data || data.length === 0) {
            container.innerHTML = `<p class="text-gray-500">Không có dữ liệu thi đua để hiển thị. Vui lòng dán "Data lũy kế" và "Thi đua nhân viên" ở tab Cập nhật dữ liệu để xử lý báo cáo.</p>`;
            return;
        }
    
        // Dựa vào viewType để render nội dung phù hợp
        let htmlContent = '';
        if (viewType === 'summary') {
            htmlContent = this.renderCompetitionSummary(data);
        } else if (viewType === 'category') {
            htmlContent = this.renderCompetitionByCategory(data);
        } else if (viewType === 'employee') {
            const selectedMaNV = document.getElementById('thidua-employee-filter')?.value;
            const employeeData = data.find(e => String(e.maNV) === String(selectedMaNV));
            htmlContent = this.renderCompetitionByEmployee(employeeData);
        }
        
        container.innerHTML = htmlContent;
    },

    // --- HÀM NÀY GIỮ LẠI ĐỂ DỰ PHÒNG, NHƯNG KHÔNG CÒN ĐƯỢC SỬ DỤNG TRỰC TIẾP
    renderPastedThiDuaTable(data) {
        if (!data || !data.success) {
            return `<div class="p-4 bg-red-100 text-red-700 rounded-lg">
                        <p class="font-bold">Lỗi xử lý dữ liệu!</p>
                        <p>${data.error || 'Vui lòng kiểm tra lại định dạng dữ liệu đã dán.'}</p>
                    </div>`;
        }
    
        let tableHTML = '<div class="overflow-x-auto border border-slate-200 rounded-lg"><table class="min-w-full text-sm">';
        
        tableHTML += '<thead class="font-semibold text-slate-700">';
        
        if (data.mainHeaders.length > 0) {
            tableHTML += '<tr>';
            tableHTML += '<th class="p-3 text-left sticky left-0 z-10 bg-slate-200">Nhân viên / Bộ phận</th>';
            data.mainHeaders.forEach(header => {
                tableHTML += `<th class="p-3 text-center bg-slate-200">${header}</th>`;
            });
            tableHTML += '</tr>';
        }

        if (data.subHeaders.length > 0) {
            tableHTML += '<tr>';
            tableHTML += `<th class="p-3 sticky left-0 z-10 bg-slate-100"></th>`;
            data.subHeaders.forEach(subHeader => {
                tableHTML += `<th class="p-3 text-center bg-slate-100">${subHeader}</th>`;
            });
            tableHTML += '</tr>';
        }
        tableHTML += '</thead>';

        tableHTML += '<tbody class="bg-white">';
        data.dataRows.forEach(row => {
            tableHTML += '<tr class="border-t hover:bg-gray-50">';
            tableHTML += `<td class="p-3 font-semibold text-slate-800 sticky left-0 z-10 bg-white">${row.name}</td>`;
            row.values.forEach(value => {
                tableHTML += `<td class="p-3 text-right">${value}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table></div>';
    
        return tableHTML;
    },

    renderCompetitionSummary(data) {
        const sortState = appState.sortState.sknv_thidua_summary || { key: 'completedCount', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...data].sort((a,b) => direction === 'asc' ? (a[key] - b[key]) : (b[key] - a[key]));
        
        const headerClass = (sortKey) => `px-4 py-2 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        return `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="sknv_thidua_summary">
            <thead class="sknv-subtable-header">
                <tr>
                    <th class="${headerClass('hoTen')}" data-sort="hoTen">Nhân viên</th>
                    <th class="${headerClass('completedCount')} text-center" data-sort="completedCount">Số CT Đạt</th>
                    <th class="${headerClass('totalCompetitions')} text-center" data-sort="totalCompetitions">Tổng Số CT</th>
                    <th class="${headerClass('completionRate')} text-center" data-sort="completionRate">Tỷ lệ hoàn thành</th>
                </tr>
            </thead>
            <tbody>${sortedData.map(e => `
                <tr class="border-t">
                    <td class="px-4 py-2 font-semibold">${uiComponents.getShortEmployeeName(e.hoTen, e.maNV)}</td>
                    <td class="px-4 py-2 text-center font-bold text-green-600 text-lg">${e.completedCount}</td>
                    <td class="px-4 py-2 text-center font-bold">${e.totalCompetitions}</td>
                    <td class="px-4 py-2 text-center font-bold text-blue-600">${uiComponents.formatPercentage(e.completionRate)}</td>
                </tr>`).join('')}
            </tbody></table></div>`;
    },
    
    renderCompetitionByCategory(data) {
        if (!data[0] || !data[0].competitions) return '<p class="text-gray-500">Dữ liệu thi đua không hợp lệ.</p>';
        const categories = data[0].competitions.map(c => c.tenNganhHang);
        let html = '<div class="space-y-6">';

        categories.forEach(categoryName => {
            const categoryData = data.map(employee => {
                const competition = employee.competitions.find(c => c.tenNganhHang === categoryName);
                return {
                    hoTen: employee.hoTen,
                    maNV: employee.maNV,
                    thucHien: competition.thucHien,
                    mucTieu: competition.mucTieu,
                    percentExpected: competition.percentExpected,
                };
            }).filter(e => e.thucHien > 0 || e.mucTieu > 0);
            
            const sortState = appState.sortState.sknv_thidua_category || { key: 'percentExpected', direction: 'desc' };
            const { key, direction } = sortState;
            const sortedCategoryData = [...categoryData].sort((a,b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key]);
            
            const headerClass = (sortKey) => `px-4 py-2 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
            const cleanName = utils.cleanCategoryName(categoryName.replace(/thi đua doanh thu bán hàng|thi đua doanh thu|thi đua số lượng/gi, "").trim());

            html += `<div class="infographic-card"><h4 class="infographic-card__header infographic-card__header--completed">${cleanName}</h4>
                <div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered" data-table-type="sknv_thidua_category">
                <thead class="sknv-subtable-header"><tr>
                    <th class="${headerClass('hoTen')}" data-sort="hoTen">Nhân viên</th>
                    <th class="${headerClass('thucHien')} text-right" data-sort="thucHien">Thực hiện</th>
                    <th class="${headerClass('mucTieu')} text-right" data-sort="mucTieu">Mục tiêu</th>
                    <th class="${headerClass('percentExpected')} text-right" data-sort="percentExpected">% HT</th>
                </tr></thead>
                <tbody>${sortedCategoryData.map(e => `
                    <tr class="border-t">
                        <td class="px-4 py-2 font-semibold">${uiComponents.getShortEmployeeName(e.hoTen, e.maNV)}</td>
                        <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumberOrDash(e.thucHien)}</td>
                        <td class="px-4 py-2 text-right">${uiComponents.formatNumberOrDash(e.mucTieu)}</td>
                        <td class="px-4 py-2 text-right font-bold text-blue-600 ${e.percentExpected >= 1 ? 'text-green-600' : ''}">${uiComponents.formatPercentage(e.percentExpected)}</td>
                    </tr>`).join('')}
                </tbody></table></div></div>`;
        });

        html += '</div>';
        return html;
    },

    renderCompetitionByEmployee(employeeData) {
        if (!employeeData) {
            return '<p class="text-center text-gray-500 p-4">Vui lòng chọn một nhân viên để xem chi tiết.</p>';
        }

        const completed = employeeData.competitions.filter(c => c.percentExpected >= 1);
        const pending = employeeData.competitions.filter(c => c.percentExpected < 1);
        const sortState = appState.sortState.sknv_thidua_employee || { key: 'percentExpected', direction: 'desc' };
        const { key, direction } = sortState;

        const renderList = (items, title, headerClass) => {
            if (items.length === 0) return '';
            const sortedItems = [...items].sort((a,b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key]);

            return `<div class="infographic-card">
                <h4 class="infographic-card__header ${headerClass}">${title} (${items.length})</h4>
                <div class="infographic-card__body">${sortedItems.map(c => `
                    <div class="infographic-card__item">
                        <h5 class="infographic-card__title">${c.tenNganhHang}</h5>
                        <div class="infographic-card__metrics">
                            <span class="metric-label">Thực hiện:</span><span class="metric-value">${uiComponents.formatNumberOrDash(c.thucHien)}</span>
                            <span class="metric-label">Mục tiêu:</span><span class="metric-value">${uiComponents.formatNumberOrDash(c.mucTieu)}</span>
                            <span class="metric-label">Còn lại:</span><span class="metric-value ${c.conLai < 0 ? 'is-negative' : ''}">${uiComponents.formatNumberOrDash(c.conLai)}</span>
                            <span class="metric-label">% HT:</span><span class="metric-value is-positive">${uiComponents.formatPercentage(c.percentExpected)}</span>
                        </div>
                    </div>`).join('')}
                </div></div>`;
        };

        return `<div class="competition-infographic">
            ${renderList(completed, 'Các chương trình đã ĐẠT', 'infographic-card__header--completed')}
            ${renderList(pending, 'Các chương trình CHƯA ĐẠT', 'infographic-card__header--pending')}
        </div>`;
    },
};