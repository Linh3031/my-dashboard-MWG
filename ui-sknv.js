// Version 6.2 - Fix click issue, ensure TV-DM department is on top,
// employee name/ID on one line, and add medal icons for top 3 in each department.
// MODULE: UI SKNV
// Chứa các hàm render giao diện cho tab "Sức khỏe nhân viên"

import { appState } from './state.js';
import { services } from './services.js';
import { uiComponents } from './ui-components.js';
import { utils } from './utils.js';

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
        const departmentOrder = utils.getSortedDepartmentList(reportData);
        
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
        
        // This function will now render the new card-based detail layout
        const createDetailCardHtml = (title, colorClass, icon, data) => {
            let itemsHtml = data.map(row => {
                const evaluation = uiSknv.getSknvEvaluation(row.rawValue, row.rawAverage, row.higherIsBetter);
                return `
                    <div class="sknv-detail-metric-item">
                        <span class="label">${row.label}</span>
                        <div class="values-group">
                            <span class="value ${row.valueClass || ''}">${row.value}</span>
                            <span class="average">${row.average}</span>
                            <span class="evaluation ${evaluation.class}">${evaluation.text}</span>
                        </div>
                    </div>
                `;
            }).join('');
        
            return `
                <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div class="sknv-detail-card-header ${colorClass}">
                        <i data-feather="${icon}" class="header-icon"></i>
                        <h4 class="text-lg font-bold">${title}</h4>
                    </div>
                    <div class="sknv-detail-card-body">
                        ${itemsHtml}
                    </div>
                </div>
            `;
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
        
        detailsContainer.innerHTML = `
            <div class="mb-4 flex justify-between items-center">
                 <button class="back-to-summary-btn text-blue-600 hover:underline font-semibold">‹ Quay lại bảng tổng hợp</button>
                <button id="capture-sknv-detail-btn" class="action-btn action-btn--capture" title="Chụp ảnh chi tiết">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828-.828A2 2 0 0 1 3.172 4H2z"/><path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/></svg>
                    <span>Chụp ảnh</span>
                 </button>
            </div>
            <div id="sknv-detail-capture-area">
                <div class="sknv-detail-header-card" data-capture-group="1">
                    <div class="sknv-card__avatar sknv-detail-avatar">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </div>
                    <div class="sknv-detail-info">
                        <p class="name">${employeeData.hoTen} - ${employeeData.maNV}</p>
                        <p class="department">${employeeData.boPhan}</p>
                        <p class="kpi-summary">Chỉ số trên TB: <span class="text-green-600 font-bold">${totalAbove}</span> / Tổng: <span class="font-bold">${totalCriteria}</span></p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6" data-capture-layout="grid">
                    <div class="space-y-6" data-capture-group="1">
                        ${createDetailCardHtml('Doanh thu', 'sknv-header-blue', 'trending-up', doanhThuData)}
                        ${createDetailCardHtml('Hiệu quả khai thác', 'sknv-header-orange', 'award', hieuQuaData)}
                    </div>
                    <div class="space-y-6" data-capture-group="1">
                        ${createDetailCardHtml('Năng suất', 'sknv-header-green', 'dollar-sign', nangSuatData)}
                        ${createDetailCardHtml('Đơn giá', 'sknv-header-yellow', 'tag', donGiaData)}
                    </div>
                    <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6" data-capture-layout="grid">
                         <div data-capture-group="1">${uiSknv.renderSknvQdcTable(employeeData, departmentAverages, countEvaluation, evaluationCounts)}</div>
                        <div data-capture-group="1">${uiSknv.renderSknvNganhHangTable(employeeData)}</div>
                    </div>
                </div>
            </div>`;
            feather.replace(); // Re-render feather icons after content update
    },

    displaySknvSummaryReport: (reportData) => {
        const container = document.getElementById('sknv-summary-container');
        if (!container) return;

        if (!reportData || reportData.length === 0) {
            container.innerHTML = '<p class="text-gray-500 font-bold p-4">Không có dữ liệu hiệu suất để hiển thị.</p>';
            return;
        }

        const summarizedData = reportData.map(employee => {
            const departmentAverages = services.calculateDepartmentAverages(employee.boPhan, reportData);
            const counts = {
                doanhthu: { above: 0, total: 7 },
                nangsuat: { above: 0, total: 7 },
                hieuqua: { above: 0, total: 6 },
                dongia: { above: 0, total: 7 },
                qdc: { above: 0, total: 0 }
            };

            const check = (group, value, avg, higherIsBetter = true) => {
                if (!isFinite(value) || avg === undefined || !isFinite(avg)) return;
                if (higherIsBetter ? (value >= avg) : (value <= avg)) counts[group].above++;
            };

            check('doanhthu', employee.doanhThu, departmentAverages.doanhThu);
            check('doanhthu', employee.doanhThuQuyDoi, departmentAverages.doanhThuQuyDoi);
            check('doanhthu', employee.hieuQuaQuyDoi, departmentAverages.hieuQuaQuyDoi);
            check('doanhthu', employee.dtCE, departmentAverages.dtCE);
            check('doanhthu', employee.dtICT, departmentAverages.dtICT);
            check('doanhthu', employee.doanhThuTraGop, departmentAverages.doanhThuTraGop);
            check('doanhthu', employee.tyLeTraCham, departmentAverages.tyLeTraCham);

            check('nangsuat', employee.tongThuNhap, departmentAverages.tongThuNhap);
            check('nangsuat', employee.thuNhapDuKien, departmentAverages.thuNhapDuKien);
            check('nangsuat', employee.gioCong, departmentAverages.gioCong);
            check('nangsuat', employee.gioCong > 0 ? employee.tongThuNhap / employee.gioCong : 0, departmentAverages.gioCong > 0 ? departmentAverages.tongThuNhap / departmentAverages.gioCong : 0);
            check('nangsuat', employee.gioCong > 0 ? employee.doanhThuQuyDoi / employee.gioCong : 0, departmentAverages.gioCong > 0 ? departmentAverages.doanhThuQuyDoi / departmentAverages.gioCong : 0);
            check('nangsuat', employee.thuongNong, departmentAverages.thuongNong);
            check('nangsuat', employee.thuongERP, departmentAverages.thuongERP);

            check('hieuqua', employee.pctPhuKien, departmentAverages.pctPhuKien);
            check('hieuqua', employee.pctGiaDung, departmentAverages.pctGiaDung);
            check('hieuqua', employee.pctMLN, departmentAverages.pctMLN);
            check('hieuqua', employee.pctSim, departmentAverages.pctSim);
            check('hieuqua', employee.pctVAS, departmentAverages.pctVAS);
            check('hieuqua', employee.pctBaoHiem, departmentAverages.pctBaoHiem);

            check('dongia', employee.donGiaTrungBinh, departmentAverages.donGiaTrungBinh);
            check('dongia', employee.donGiaTivi, departmentAverages.donGiaTivi);
            check('dongia', employee.donGiaTuLanh, departmentAverages.donGiaTuLanh);
            check('dongia', employee.donGiaMayGiat, departmentAverages.donGiaMayGiat);
            check('dongia', employee.donGiaMayLanh, departmentAverages.donGiaMayLanh);
            check('dongia', employee.donGiaDienThoai, departmentAverages.donGiaDienThoai);
            check('dongia', employee.donGiaLaptop, departmentAverages.donGiaLaptop);

            if(employee.qdc && departmentAverages.qdc) {
                 for (const key in employee.qdc) {
                    if(departmentAverages.qdc[key] && employee.qdc[key].dtqd > 0) {
                        counts.qdc.total++;
                        check('qdc', employee.qdc[key].dtqd, departmentAverages.qdc[key].dtqd);
                    }
                }
            }

            const totalAbove = counts.doanhthu.above + counts.nangsuat.above + counts.hieuqua.above + counts.dongia.above + counts.qdc.above;
            const totalCriteria = counts.doanhthu.total + counts.nangsuat.total + counts.hieuqua.total + counts.dongia.total + counts.qdc.total;
            
            return { ...employee, summary: counts, totalAbove, totalCriteria };
        });

        const subKpiGroups = [
            { key: 'doanhthu', label: 'Doanh Thu', icon: 'trending-up' },
            { key: 'nangsuat', label: 'Năng Suất', icon: 'dollar-sign' },
            { key: 'hieuqua', label: 'Hiệu Quả', icon: 'award' },
            { key: 'dongia', label: 'Đơn Giá', icon: 'tag' },
            { key: 'qdc', label: 'QĐC', icon: 'star' }
        ];

        // Group by department
        const groupedByDept = {};
        summarizedData.forEach(item => {
            const dept = item.boPhan;
            if (!groupedByDept[dept]) groupedByDept[dept] = [];
            groupedByDept[dept].push(item);
        });

        // Define department order - 'Tư vấn - ĐM' first
        const departmentOrder = [
            'Tư vấn - ĐM', // Prioritized department
            ...Object.keys(groupedByDept).filter(dept => dept !== 'Tư vấn - ĐM').sort() // Other departments sorted alphabetically
        ];

        let finalCardsHtml = '';

        departmentOrder.forEach(deptName => {
            if (groupedByDept[deptName] && groupedByDept[deptName].length > 0) {
                // Sort employees within each department by totalAbove
                const sortedDeptEmployees = [...groupedByDept[deptName]].sort((a, b) => (b.totalAbove || 0) - (a.totalAbove || 0));

                finalCardsHtml += `<div class="sknv-department-group">`;
                finalCardsHtml += `<h4 class="sknv-department-header ${deptName.includes('Tư vấn - ĐM') ? 'sknv-department-header--priority' : ''}">${deptName}</h4>`;
                finalCardsHtml += `<div class="sknv-summary-grid">`;

                sortedDeptEmployees.forEach((item, index) => {
                    const performancePercentage = item.totalCriteria > 0 ? (item.totalAbove / item.totalCriteria) : 0;
                    const performanceColorClass = performancePercentage >= 0.7 ? 'sknv-card-kpi-strong' : performancePercentage >= 0.4 ? 'sknv-card-kpi-medium' : 'sknv-card-kpi-weak';
                    
                    let medalIcon = '';
                    if (index === 0) medalIcon = '<i data-feather="award" class="medal-icon gold"></i>';
                    else if (index === 1) medalIcon = '<i data-feather="award" class="medal-icon silver"></i>';
                    else if (index === 2) medalIcon = '<i data-feather="award" class="medal-icon bronze"></i>';

                    const subKpisHtml = subKpiGroups.map(group => {
                        if (item.summary[group.key].total === 0) return '';
                        const subKpiPerf = item.summary[group.key].above / item.summary[group.key].total;
                        const subKpiColorClass = subKpiPerf >= 0.7 ? 'strong' : subKpiPerf >= 0.4 ? 'medium' : 'weak';
                        return `
                            <div class="sknv-card__sub-kpi-item ${subKpiColorClass}">
                                <i data-feather="${group.icon}"></i>
                                <span class="label">${group.label}</span>
                                <span class="value">${item.summary[group.key].above}/${item.summary[group.key].total}</span>
                            </div>
                        `;
                    }).join('');

                    finalCardsHtml += `
                        <div class="sknv-card interactive-row" data-employee-id="${item.maNV}" data-source-tab="sknv">
                            <div class="sknv-card__header">
                                <div class="sknv-card__avatar">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                </div>
                                <div class="sknv-card__info">
                                    <p class="name">${item.hoTen} - ${item.maNV} ${medalIcon}</p>
                                    <p class="id">${item.boPhan}</p>
                                </div>
                            </div>
                            <div class="sknv-card__main-kpi ${performanceColorClass}">
                                <span class="value">${item.totalAbove}</span>
                                <span class="total">/ ${item.totalCriteria}</span>
                                <span class="label">Chỉ số trên TB</span>
                            </div>
                            <div class="sknv-card__sub-kpi-grid">
                                ${subKpisHtml}
                            </div>
                        </div>`;
                });
                finalCardsHtml += `</div></div>`; // Close sknv-summary-grid and sknv-department-group
            }
        });
        container.innerHTML = `<div data-capture-group="1">${finalCardsHtml}</div>`;

        // IMPORTANT: Call Feather Icons replacement after rendering dynamic content
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
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

        return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><div class="sknv-detail-card-header sknv-header-purple"><i data-feather="list" class="header-icon"></i><h4 class="text-lg font-bold">Doanh thu theo Ngành hàng</h4></div><div class="overflow-x-auto" style="max-height: 400px;"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="sknv_nganhhang_chitiet">
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
            return '<div class="bg-white rounded-xl shadow-md border border-gray-200 p-4"><div class="sknv-detail-card-header sknv-header-indigo"><i data-feather="star" class="header-icon"></i><h4 class="text-lg font-bold">Nhóm hàng Quy đổi cao</h4></div><p class="p-4 text-gray-500">Không có dữ liệu.</p></div>';
        }
        
        evaluationCounts.qdc.total = sortedData.length;

        const headerClass = (sortKey) => `px-4 py-2 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><div class="sknv-detail-card-header sknv-header-indigo"><i data-feather="star" class="header-icon"></i><h4 class="text-lg font-bold">Nhóm hàng Quy đổi cao</h4></div><div class="overflow-x-auto" style="max-height: 400px;"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="sknv_qdc">
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