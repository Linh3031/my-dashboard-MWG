// Version 4.9 - Critical Fix: Remove circular dependency by importing from utils.js
// MODULE: UI SKNV
// Chứa các hàm render giao diện cho tab "Sức khỏe nhân viên"

import { appState } from './state.js';
import { services } from './services.js';
import { uiComponents } from './ui-components.js';
import { utils } from './utils.js'; // <<< FIX: IMPORT UTILS

export const uiSknv = {
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
        const departmentOrder = utils.getSortedDepartmentList(reportData); // <<< FIX: USE UTILS
        
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
        const departmentOrder = utils.getSortedDepartmentList(summaryData); // <<< FIX: USE UTILS

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