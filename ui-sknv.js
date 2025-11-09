// Version 6.39 - Fix KPI color logic (use is-positive/is-negative classes)
// Version 6.38 - Redesign pasted detail view to "Multi-lane" layout & Fix KPI color logic
// Version 6.37 - Redesign pasted competition detail view to 3-column infographic
// Version 6.36 - Add sorting and fix z-index for pasted competition detail table
// Version 6.35 - Redesign pasted competition detail view; Add cell coloring; Fix drag-drop tag
// MODULE: UI SKNV
// Chứa các hàm render giao diện cho tab "Sức khỏe nhân viên"

import { appState } from './state.js';
import { services } from './services.js';
import { uiComponents } from './ui-components.js';
import { utils } from './utils.js';
import { settingsService } from './modules/settings.service.js'; // *** NEW (v6.23) ***

export const uiSknv = {
    // === START: YÊU CẦU 4 (Lưu trữ TBT) ===
    _lastPastedAverages: {}, // Biến tạm để lưu TBT bộ phận cho view chi tiết
    // === END: YÊU CẦU 4 ===

    displayEmployeeIncomeReport: (reportData) => {
        console.log("[ui-sknv.js displayEmployeeIncomeReport] === Starting render ==="); // Log mới
        const container = document.getElementById('income-report-container');
        const placeholder = document.getElementById('income-report-placeholder');
        if (!container || !placeholder) {
           console.error("[ui-sknv.js displayEmployeeIncomeReport] Container or placeholder not found."); // Log mới
            return;
        }
        const hasIncomeData = reportData.some(item => (item.tongThuNhap || 0) > 0 || (item.gioCong || 0) > 0);
        console.log(`[ui-sknv.js displayEmployeeIncomeReport] Input reportData length: ${reportData?.length}, hasIncomeData: ${hasIncomeData}`); // Log mới

        if (!reportData || reportData.length === 0 || !hasIncomeData) {
            console.warn("[ui-sknv.js displayEmployeeIncomeReport] No valid income data, showing placeholder."); // Log mới
            placeholder.classList.remove('hidden'); container.innerHTML = ''; return;
        }
        placeholder.classList.add('hidden');

        // *** START: SỬA LỖI (v6.31) - Xóa 'overflow-hidden' ***
        let finalHTML = `<div class="bg-white rounded-xl shadow-md border border-gray-200"><div class="p-4 header-group-2 text-gray-800"><h3 class="text-xl font-bold uppercase">Thu nhập nhân viên</h3><p class="text-sm italic text-gray-600">(đơn vị tính: Triệu đồng)</p></div>`;
        // *** END: SỬA LỖI (v6.31) ***

        const groupedByDept = {};
        reportData.forEach(item => {
             const dept = item.boPhan;
            if (!groupedByDept[dept]) groupedByDept[dept] = [];
            groupedByDept[dept].push(item);
        });
        const departmentOrder = utils.getSortedDepartmentList(reportData);
        console.log("[ui-sknv.js displayEmployeeIncomeReport] Department order:", departmentOrder); // Log mới

        departmentOrder.forEach(deptName => {
            if (groupedByDept[deptName]) {
                 console.log(`[ui-sknv.js displayEmployeeIncomeReport] Rendering table for department: ${deptName}`); // Log mới
                 finalHTML += uiSknv.renderIncomeTableForDepartment(deptName, groupedByDept[deptName]);
            }
        });

        finalHTML += `</div>`;
        container.innerHTML = finalHTML;
        console.log("[ui-sknv.js displayEmployeeIncomeReport] === Render complete ==="); // Log mới
    },

    renderIncomeTableForDepartment: (title, data) => {
        console.log(`[ui-sknv.js renderIncomeTableForDepartment] Rendering for: ${title}, Data length: ${data?.length}`); // Log mới
        const sortState = appState.sortState.thunhap || { key: 'tongThuNhap', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...data].sort((a, b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });

        const totals = data.reduce((acc, item) => {
            acc.gioCong += item.gioCong || 0; // Ensure NaN safety
             acc.thuongNong += item.thuongNong || 0;
            acc.thuongERP += item.thuongERP || 0;
            acc.tongThuNhap += item.tongThuNhap || 0;
            acc.thuNhapDuKien += item.thuNhapDuKien || 0;
            acc.thuNhapThangTruoc += item.thuNhapThangTruoc || 0;
            acc.chenhLechThuNhap += item.chenhLechThuNhap || 0;
            return acc;
        }, { gioCong: 0, thuongNong: 0, thuongERP: 0, tongThuNhap: 0, thuNhapDuKien: 0, thuNhapThangTruoc: 0, chenhLechThuNhap: 0 });
        console.log(`[ui-sknv.js renderIncomeTableForDepartment] Calculated totals for ${title}:`, totals); // Log mới

        const averageProjectedIncome = data.length > 0 ? totals.thuNhapDuKien / data.length : 0;
        let titleClass = '';
        if (title.includes('Tư Vấn')) titleClass = 'department-header-tv';
        else if (title.includes('Kho')) titleClass = 'department-header-kho';
        else if (title.includes('Trang Trí')) titleClass = 'department-header-tt';

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        
        // *** YÊU CẦU 3 (v6.28): Thêm 'w-full' để bảng co giãn 100% ***
        // *** START: SỬA LỖI (v6.31) - Thêm data-capture-group="report-part" ***
        let tableHTML = `<div class="department-block" data-capture-group="report-part"><h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${title} <span class="text-sm font-normal text-gray-500">(Thu nhập DK TB: ${uiComponents.formatRevenue(averageProjectedIncome)})</span></h4><div class="overflow-x-auto"><table class="w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="thunhap" data-capture-columns="6">
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
             const incomeDiffClass = (nv.chenhLechThuNhap || 0) < 0 ? 'income-negative' : 'income-positive'; // Handle undefined/NaN

            tableHTML += `<tr class="interactive-row" data-employee-id="${nv.maNV}" data-source-tab="sknv">
                    <td class="px-4 py-2 font-semibold line-clamp-2 employee-name-cell">
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
        // === START: DEBUG (v6.16) ===
        console.log(`%c[DEBUG displaySknvReport] === Bắt đầu render ===`, "color: blue; font-weight: bold;");
        console.log(`[DEBUG displaySknvReport] Force detail: ${forceDetail}`);
        // === END: DEBUG ===
        const summaryContainer = document.getElementById('sknv-summary-container');
        const detailsContainer = document.getElementById('sknv-details-container');
        if (!summaryContainer || !detailsContainer) {
            console.error("[ui-sknv.js displaySknvReport] Summary or details container not found."); // Log mới
            return;
        }

        const isViewingDetail = appState.viewingDetailFor && appState.viewingDetailFor.sourceTab === 'sknv';
        const shouldShowDetail = forceDetail || isViewingDetail;
        // === START: DEBUG (v6.16) ===
        console.log(`[DEBUG displaySknvReport] isViewingDetail (từ appState): ${isViewingDetail}`);
        console.log(`[DEBUG displaySknvReport] shouldShowDetail (kết quả): ${shouldShowDetail}`);
        // === END: DEBUG ===

        summaryContainer.classList.toggle('hidden', shouldShowDetail);
        detailsContainer.classList.toggle('hidden', !shouldShowDetail);

        if (shouldShowDetail) {
            const employeeId = appState.viewingDetailFor.employeeId;
            console.log(`[DEBUG displaySknvReport] Đang tìm data cho NV ID: ${employeeId}`); // Log mới
            const employeeData = appState.masterReportData.sknv.find(nv => String(nv.maNV).trim() === String(employeeId).trim());
            if(employeeData) {
                 console.log(`[DEBUG displaySknvReport] Đã tìm thấy data NV. Gọi renderSknvDetailForEmployee.`); // Log mới
                uiSknv.renderSknvDetailForEmployee(employeeData, filteredReport);
            } else {
                 console.warn(`[DEBUG displaySknvReport] KHÔNG TÌM THẤY data cho NV ID: ${employeeId}`); // Log mới
                 detailsContainer.innerHTML = `
                    <div class="mb-4">
                        <button class="back-to-summary-btn text-blue-600 hover:underline font-semibold">‹ Quay lại bảng tổng hợp</button>
                     </div>
                    <p class="text-red-500">Không tìm thấy dữ liệu chi tiết cho nhân viên đã chọn.</p>`;
            }
        } else {
            console.log("[DEBUG displaySknvReport] Gọi displaySknvSummaryReport."); // Log mới
            uiSknv.displaySknvSummaryReport(filteredReport);
        }
        console.log("%c[DEBUG displaySknvReport] === Render kết thúc ===", "color: blue; font-weight: bold;"); // Log mới
    },
    
    _createDetailMetricGrid(title, colorClass, icon, data) {
        // === START: THAY ĐỔI ===
        const sortStateKey = `sknv_detail_${title.toLowerCase().replace(/[^a-z]/g, '')}`;
        const sortState = appState.sortState[sortStateKey] || { key: 'label', direction: 'asc' };
        const { key, direction } = sortState;

        const sortedData = [...data].sort((a, b) => {
            let valA, valB;
            if (key === 'label') {
                valA = a.label || '';
                valB = b.label || '';
                return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else if (key === 'value') {
                valA = a.rawValue;
                valB = b.rawValue;
            } else { // key === 'average'
                valA = a.rawAverage;
                valB = b.rawAverage;
            }
            return direction === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
        });

        const headerClass = (sortKey) => `px-2 py-1 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        let itemsHtml = `
            <table class="w-full text-sm sknv-detail-metric-table" data-table-type="${sortStateKey}">
                <thead>
                    <tr class="border-b border-gray-300">
                        <th class="${headerClass('label')} text-left" data-sort="label">Chỉ số <span class="sort-indicator"></span></th>
                        <th class="${headerClass('value')} text-right" data-sort="value">Thực hiện <span class="sort-indicator"></span></th>
                        <th class="${headerClass('average')} text-right" data-sort="average">Trung bình <span class="sort-indicator"></span></th>
                        <th class="px-2 py-1 text-right">Đánh giá</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        sortedData.forEach(row => {
            const evaluation = uiSknv.getSknvEvaluation(row.rawValue, row.rawAverage, row.higherIsBetter);
            itemsHtml += `
                <tr classclass="border-t border-gray-100">
                    <td class="px-2 py-2 font-semibold text-gray-700 text-left">${row.label}</td>
                    <td class="px-2 py-2 font-bold text-gray-900 text-right ${row.valueClass || ''}">${row.value}</td>
                    <td class="px-2 py-2 text-gray-600 text-right">${row.average}</td>
                    <td class="px-2 py-2 text-right">
                        <span class="evaluation-badge ${evaluation.class}">${evaluation.text}</span>
                    </td>
                </tr>
            `;
        });

        itemsHtml += `</tbody></table>`;
        // === END: THAY ĐỔI ===
    
        return `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div class="sknv-detail-card-header ${colorClass}">
                    <i data-feather="${icon}" class="header-icon"></i>
                    <h4 class="text-lg font-bold">${title}</h4>
                </div>
                <div class="overflow-x-auto">
                    ${itemsHtml}
                </div>
            </div>
        `;
    },

    
    renderSknvDetailForEmployee(employeeData, filteredReport) {
        console.log("[ui-sknv.js renderSknvDetailForEmployee] === Starting render ==="); // Log mới
        const detailsContainer = document.getElementById('sknv-details-container');
        if (!detailsContainer) {
            console.error("[ui-sknv.js renderSknvDetailForEmployee] Details container not found."); // Log mới
            return;
        }

        if (!employeeData) {
            console.warn("[ui-sknv.js renderSknvDetailForEmployee] No employee data provided."); // Log mới
            detailsContainer.innerHTML = `
                <div class="mb-4">
                    <button class="back-to-summary-btn text-blue-600 hover:underline font-semibold">‹ Quay lại bảng tổng hợp</button>
                </div>
                <p class="text-red-500">Không tìm thấy dữ liệu cho nhân viên đã chọn.</p>`;
            return;
        }
        console.log("[ui-sknv.js renderSknvDetailForEmployee] Employee data:", employeeData); // Log mới

        const departmentAverages = services.calculateDepartmentAverages(employeeData.boPhan, filteredReport);
        console.log("[ui-sknv.js renderSknvDetailForEmployee] Department averages:", departmentAverages); // Log mới

        const evaluationCounts = {
            doanhthu: { above: 0, total: 7 },
            nangsuat: { above: 0, total: 7 },
            hieuqua: { above: 0, total: 6 },
            dongia: { above: 0, total: 7 },
            qdc: { above: 0, total: 0 } // *** YÊU CẦU 3 (v6.26): Vô hiệu hóa QĐC ***
        };

        const countEvaluation = (group, value, avgValue, higherIsBetter = true) => {
            // *** YÊU CẦU 3 (v6.26): Ngăn QĐC đếm điểm ***
            if (group === 'qdc') return; 
            
            if (!isFinite(value) || avgValue === undefined || !isFinite(avgValue)) return;
            let isAbove = higherIsBetter ? (value >= avgValue) : (value <= avgValue);
            if (isAbove) { evaluationCounts[group].above++; }
        };
        
        const { mucTieu } = employeeData;

        // --- Tạo dữ liệu cho các grid (Giữ nguyên logic tạo mảng doanhThuData, nangSuatData, hieuQuaData, donGiaData) ---
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
        
        // *** YÊU CẦU 3 (v6.26): Bỏ QĐC khỏi tổng ***
        const totalAbove = evaluationCounts.doanhthu.above + evaluationCounts.nangsuat.above + evaluationCounts.hieuqua.above + evaluationCounts.dongia.above; // + evaluationCounts.qdc.above;
        const totalCriteria = evaluationCounts.doanhthu.total + evaluationCounts.nangsuat.total + evaluationCounts.hieuqua.total + evaluationCounts.dongia.total; // + evaluationCounts.qdc.total;
        console.log(`[ui-sknv.js renderSknvDetail] Evaluation Counts (QDC BỎ QUA):`, evaluationCounts, `Total Above: ${totalAbove}, Total Criteria: ${totalCriteria}`); // Log mới
      
        console.log("[ui-sknv.js renderSknvDetail] Generating HTML..."); // Log mới
        detailsContainer.innerHTML = `
            <div class="mb-4 flex justify-between items-center">
                <button class="back-to-summary-btn text-blue-600 hover:underline font-semibold">‹ Quay lại bảng tổng hợp</button>
                <button id="capture-sknv-detail-btn" class="action-btn action-btn--capture" title="Chụp ảnh chi tiết">
                    <i data-feather="camera"></i>
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
                         ${this._createDetailMetricGrid('Doanh thu', 'sknv-header-blue', 'trending-up', doanhThuData)}
                        ${this._createDetailMetricGrid('Hiệu quả khai thác', 'sknv-header-orange', 'award', hieuQuaData)}
                    </div>
                    <div class="space-y-6" data-capture-group="1">
                        ${this._createDetailMetricGrid('Năng suất', 'sknv-header-green', 'dollar-sign', nangSuatData)}
                        ${this._createDetailMetricGrid('Đơn giá', 'sknv-header-yellow', 'tag', donGiaData)}
                     </div>
                    <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6" data-capture-layout="grid">
                        <div data-capture-group="1" class="overflow-x-auto">${uiSknv.renderSknvQdcTable(employeeData, departmentAverages)}</div>
                        <div data-capture-group="1" class="overflow-x-auto">${uiSknv.renderSknvNganhHangTable(employeeData)}</div>
                    </div>
                     </div>
            </div>`;
            feather.replace();
        console.log("[ui-sknv.js renderSknvDetail] === Render complete ==="); // Log mới
    },
    
    displaySknvSummaryReport: (reportData) => {
        console.log("[ui-sknv.js displaySknvSummaryReport] === Starting render ==="); // Log mới
        const container = document.getElementById('sknv-summary-container');
        if (!container) {
            console.error("[ui-sknv.js displaySknvSummaryReport] Summary container not found."); // Log mới
            return;
        }

        if (!reportData || reportData.length === 0) {
            console.warn("[ui-sknv.js displaySknvSummaryReport] No report data provided."); // Log mới
            container.innerHTML = '<p class="text-gray-500 font-bold p-4">Không có dữ liệu hiệu suất để hiển thị.</p>';
            return;
        }
        console.log(`[ui-sknv.js displaySknvSummaryReport] Input reportData length: ${reportData.length}`); // Log mới

        
        const summarizedData = reportData.map(employee => {
            const departmentAverages = services.calculateDepartmentAverages(employee.boPhan, reportData);
            const counts = {
                doanhthu: { above: 0, total: 7 },
                nangsuat: { above: 0, total: 7 },
                hieuqua: { above: 0, total: 6 },
                dongia: { above: 0, total: 7 },
                qdc: { above: 0, total: 0 } // *** YÊU CẦU 3 (v6.26): Vô hiệu hóa QĐC ***
            };
            const check = (group, value, avg, higherIsBetter = true) => {
                // *** YÊU CẦU 3 (v6.26): Ngăn QĐC đếm điểm ***
                if (group === 'qdc') return; 

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
            
            // Logic QĐC cũ vẫn chạy nhưng hàm check() ở trên sẽ chặn nó đếm điểm
            if(employee.qdc && departmentAverages.qdc) {
                for (const key in employee.qdc) {
                    if(departmentAverages.qdc[key] && employee.qdc[key].dtqd > 0) {
                        counts.qdc.total++; // Vẫn đếm total để logic cũ không lỗi, nhưng điểm above luôn là 0
                        check('qdc', employee.qdc[key].dtqd, departmentAverages.qdc[key].dtqd);
                    }
                }
            }
            // *** YÊU CẦU 3 (v6.26): Bỏ QĐC khỏi tổng ***
            const totalAbove = counts.doanhthu.above + counts.nangsuat.above + counts.hieuqua.above + counts.dongia.above; // + counts.qdc.above;
            const totalCriteria = counts.doanhthu.total + counts.nangsuat.total + counts.hieuqua.total + counts.dongia.total; // + counts.qdc.total;
            return { ...employee, summary: counts, totalAbove, totalCriteria };
        });
        console.log(`[ui-sknv.js displaySknvSummaryReport] Summarized data generated. First item:`, summarizedData[0]); // Log mới

        const subKpiGroups = [ 
            { key: 'doanhthu', label: 'Doanh Thu', icon: 'trending-up' },
            { key: 'nangsuat', label: 'Năng Suất', icon: 'dollar-sign' },
            { key: 'hieuqua', label: 'Hiệu Quả', icon: 'award' },
            { key: 'dongia', label: 'Đơn Giá', icon: 'tag' },
            // { key: 'qdc', label: 'QĐC', icon: 'star' } // *** YÊU CẦU 3 (v6.26): Bỏ QĐC khỏi thẻ ***
        ];
        
        const groupedByDept = {}; 
        summarizedData.forEach(item => { 
            const dept = item.boPhan; 
            if (!groupedByDept[dept]) groupedByDept[dept] = []; 
            groupedByDept[dept].push(item); 
        });

        const departmentOrder = utils.getSortedDepartmentList(reportData); 
        console.log("[ui-sknv.js displaySknvSummaryReport] Department order:", departmentOrder); // Log mới

        let finalCardsHtml = ''; 
        const gold_medal_svg = `<span class="medal-container"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gold-grad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#FFDF00;stop-opacity:1" /><stop offset="100%" style="stop-color:#FFB800;stop-opacity:1" /></linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dx="2" dy="2" result="offsetblur"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M 20 75 L 35 95 L 35 75 L 50 90 L 65 75 L 65 95 L 80 75 L 50 85 Z" fill="#E53935"/><circle cx="50" cy="45" r="38" fill="#BDBDBD"/><circle cx="50" cy="45" r="35" fill="url(#gold-grad)"/><circle cx="50" cy="45" r="28" fill="#FFC107" stroke="#FFFFFF" stroke-width="2"/><text x="50" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">1</text><path d="M 68 25 l 3 -6 l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 Z" fill="white" opacity="0.8"/><path d="M 30 55 l 2 -4 l 2 4 l 4 2 l -4 2 l -2 4 l -2 -4 l -4 -2 Z" fill="white" opacity="0.5"/></svg></span>`;
        const silver_medal_svg = `<span class="medal-container"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="silver-grad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#F5F5F5;stop-opacity:1" /><stop offset="100%" style="stop-color:#B0BEC5;stop-opacity:1" /></linearGradient></defs><path d="M 20 75 L 35 95 L 35 75 L 50 90 L 65 75 L 65 95 L 80 75 L 50 85 Z" fill="#E53935"/><circle cx="50" cy="45" r="38" fill="#78909C"/><circle cx="50" cy="45" r="35" fill="url(#silver-grad)"/><circle cx="50" cy="45" r="28" fill="#B0BEC5" stroke="#FFFFFF" stroke-width="2"/><text x="50" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">2</text><path d="M 68 25 l 3 -6 l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 Z" fill="white" opacity="0.8"/></svg></span>`;
        const bronze_medal_svg = `<span class="medal-container"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bronze-grad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#FFCC80;stop-opacity:1" /><stop offset="100%" style="stop-color:#D84315;stop-opacity:1" /></linearGradient></defs><path d="M 20 75 L 35 95 L 35 75 L 50 90 L 65 75 L 65 95 L 80 75 L 50 85 Z" fill="#E53935"/><circle cx="50" cy="45" r="38" fill="#A1887F"/><circle cx="50" cy="45" r="35" fill="url(#bronze-grad)"/><circle cx="50" cy="45" r="28" fill="#D84315" stroke="#FFFFFF" stroke-width="2"/><text x="50" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">3</text><path d="M 68 25 l 3 -6 l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 Z" fill="white" opacity="0.8"/></svg></span>`;
        
        departmentOrder.forEach(deptName => { 
            if (groupedByDept[deptName] && groupedByDept[deptName].length > 0) { 
                console.log(`[ui-sknv.js displaySknvSummaryReport] Rendering department group: ${deptName}`); 
                const sortedDeptEmployees = [...groupedByDept[deptName]].sort((a, b) => (b.totalAbove || 0) - (a.totalAbove || 0)); 

                // *** START: SỬA LỖI (v6.31) - Thêm data-capture-group="report-part" ***
                finalCardsHtml += `<div class="sknv-department-group" data-capture-group="report-part">`; 
                // *** END: SỬA LỖI (v6.31) ***
                
                // *** YÊU CẦU 1 (v6.28): Bỏ icon cờ ***
                finalCardsHtml += `<h4 class="sknv-department-header ${deptName.includes('Tư Vấn - ĐM') ? 'sknv-department-header--priority' : ''}">${deptName}</h4>`; 
                finalCardsHtml += `<div class="sknv-summary-grid">`; 

                sortedDeptEmployees.forEach((item, index) => { 
                    const performancePercentage = item.totalCriteria > 0 ? (item.totalAbove / item.totalCriteria) : 0; 
                    const performanceColorClass = performancePercentage >= 0.7 ? 'sknv-card-kpi-strong' : performancePercentage >= 0.4 ? 'sknv-card-kpi-medium' : 'sknv-card-kpi-weak'; 

                    // *** YÊU CẦU 2 (v6.30): Logic mới cho Huy chương / Vòng tròn xám ***
                    let medalHtml = '';
                    let avatarClass = 'sknv-card__avatar'; // Class mặc định
                    const avatarContent = `<span class="sknv-card__avatar-rank">${index + 1}</span>`; // Số luôn luôn có

                    if (index === 0) {
                        medalHtml = gold_medal_svg;
                    } else if (index === 1) {
                        medalHtml = silver_medal_svg;
                    } else if (index === 2) {
                        medalHtml = bronze_medal_svg;
                    } else {
                        // Hạng 4+
                        avatarClass += ' sknv-card__avatar--standard'; // Thêm class để CSS đổi thành vòng xám
                    }
                    // *** Hết Logic v6.30 ***

                    const subKpisHtml = subKpiGroups.map(group => { 
                        if (!item.summary || !item.summary[group.key] || item.summary[group.key].total === 0) return ''; 
                        const subKpiPerf = item.summary[group.key].total > 0 ? item.summary[group.key].above / item.summary[group.key].total : 0; 
                        const subKpiColorClass = subKpiPerf >= 0.7 ? 'strong' : subKpiPerf >= 0.4 ? 'medium' : 'weak'; 
                        const valueColorClass = subKpiPerf >= 0.5 ? 'text-blue-600' : 'text-red-600'; 

                        return `
                            <div class="sknv-card__sub-kpi-item ${subKpiColorClass}">
                                <div class="sknv-card__sub-kpi-header">
                                    <i data-feather="${group.icon}"></i>
                                    <span class="label">${group.label}</span>
                                </div>
                                <span class="value ${valueColorClass}">${item.summary[group.key].above}/${item.summary[group.key].total}</span>
                             </div>
                        `; 
                    }).join(''); 
                    

                    finalCardsHtml += `
                        <div class="sknv-card interactive-row" data-employee-id="${item.maNV}" data-source-tab="sknv">
                            ${medalHtml}
                            <div class="sknv-card__header">
                                 <div class="${avatarClass}">
                                    ${avatarContent}
                                </div>
                                <div class="sknv-card__info">
                                     <p class="name">${uiComponents.getShortEmployeeName(item.hoTen, item.maNV)}</p>
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
                finalCardsHtml += `</div></div>`; 
            }
        });
        
        // *** START: SỬA LỖI (v6.31) - Xóa 'data-capture-group="1"' ***
        container.innerHTML = finalCardsHtml;
        // *** END: SỬA LỖI (v6.31) ***

        if (typeof feather !== 'undefined') { 
            feather.replace(); 
        }
        console.log("[ui-sknv.js displaySknvSummaryReport] === Render complete ==="); 
    },
    
    getSknvEvaluation: (value, avgValue, higherIsBetter = true) => {
        if (!isFinite(value) || avgValue === undefined || !isFinite(avgValue)) return { text: '-', class: '' };
        const isAbove = higherIsBetter ? (value >= avgValue) : (value <= avgValue);
        return {
            text: isAbove ? 'Trên TB' : 'Dưới TB',
            // *** YÊU CẦU 2 (v6.26): Sửa class màu vàng bị lỗi ***
            class: isAbove ? 'text-green-600' : 'text-yellow-600' // Sửa từ 'text-yellow-6Doanhthu'
        };
    },
    
    renderSknvNganhHangTable(employeeData) {
        console.log("[ui-sknv.js renderSknvNganhHangTable] Starting render..."); 
        const { doanhThuTheoNganhHang } = employeeData;
        const sortState = appState.sortState.sknv_nganhhang_chitiet || { key: 'revenue', direction: 'desc' };
        const { key, direction } = sortState;
        
        const dataArray = Object.entries(doanhThuTheoNganhHang || {}) 
             .map(([name, values]) => ({ name, ...values }))
            .filter(item => (item.revenue || 0) > 0); 
        console.log(`[ui-sknv.js renderSknvNganhHangTable] Data array length: ${dataArray.length}`); 

        if (dataArray.length === 0) return '<div class="bg-white rounded-xl shadow-md border border-gray-200 p-4"><div class="sknv-detail-card-header sknv-header-purple"><i data-feather="list" class="header-icon"></i><h4 class="text-lg font-bold">Doanh thu theo Ngành hàng</h4></div><p class="p-4 text-gray-500">Không có dữ liệu.</p></div>';

        const sortedData = [...dataArray].sort((a,b) => direction === 'asc' ? (a[key] || 0) - (b[key] || 0) : (b[key] || 0) - (a[key] || 0)); 
        const headerClass = (sortKey) => `px-4 py-2 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        // *** YÊU CẦU 4 (v6.26): Thêm w-full vào table ***
        return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><div class="sknv-detail-card-header sknv-header-purple"><i data-feather="list" class="header-icon"></i><h4 class="text-lg font-bold">Doanh thu theo Ngành hàng</h4></div><div class="overflow-x-auto" style="max-height: 400px;"><table class="w-full text-sm table-bordered table-striped" data-table-type="sknv_nganhhang_chitiet">
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
        console.log("[ui-sknv.js renderSknvQdcTable] Starting render..."); 
        const qdcData = employeeData.qdc;
        const avgQdcData = departmentAverages.qdc;

        if (!qdcData) { 
             console.warn("[ui-sknv.js renderSknvQdcTable] Employee QDC data is missing.");
             // evaluationCounts.qdc.total = 0; // Đã vô hiệu hóa ở hàm gọi
             return '<div class="bg-white rounded-xl shadow-md border border-gray-200 p-4"><div class="sknv-detail-card-header sknv-header-indigo"><i data-feather="star" class="header-icon"></i><h4 class="text-lg font-bold">Nhóm hàng Quy đổi cao</h4></div><p class="p-4 text-gray-500">Không có dữ liệu.</p></div>';
        }

        const sortState = appState.sortState.sknv_qdc || { key: 'dtqd', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = Object.entries(qdcData)
            .map(([id, values]) => ({ id, ...values }))
             .filter(item => (item.sl || 0) > 0) 
            .sort((a,b) => direction === 'asc' ? (a[key] || 0) - (b[key] || 0) : (b[key] || 0) - (a[key] || 0)); 
        console.log(`[ui-sknv.js renderSknvQdcTable] Sorted QDC data length: ${sortedData.length}`); 

        if (sortedData.length === 0) {
            // evaluationCounts.qdc.total = 0; // Đã vô hiệu hóa ở hàm gọi
            return '<div class="bg-white rounded-xl shadow-md border border-gray-200 p-4"><div class="sknv-detail-card-header sknv-header-indigo"><i data-feather="star" class="header-icon"></i><h4 class="text-lg font-bold">Nhóm hàng Quy đổi cao</h4></div><p class="p-4 text-gray-500">Không có dữ liệu.</p></div>';
        }

        // evaluationCounts.qdc.total = sortedData.length; // Đã vô hiệu hóa ở hàm gọi

        const headerClass = (sortKey) => `px-4 py-2 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        // *** YÊU CẦU 4 (v6.26): Thêm w-full vào table ***
        // *** YÊU CẦU 2 (v6.26): Bỏ cột "Đánh giá" ***
        return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><div class="sknv-detail-card-header sknv-header-indigo"><i data-feather="star" class="header-icon"></i><h4 class="text-lg font-bold">Nhóm hàng Quy đổi cao</h4></div><div class="overflow-x-auto" style="max-height: 400px;"><table class="w-full text-sm table-bordered table-striped" data-table-type="sknv_qdc">
             <thead class="sknv-subtable-header"><tr>
                <th class="${headerClass('name')}" data-sort="name">Nhóm hàng</th>
                <th class="${headerClass('sl')} text-right" data-sort="sl">SL</th>
                <th class="${headerClass('dtqd')} text-right" data-sort="dtqd">DTQĐ (Tr)</th>
            </tr></thead>
            <tbody>${sortedData.map(item => {
                // const avgValue = avgQdcData?.[item.id]?.dtqd;
                // const evaluation = uiSknv.getSknvEvaluation(item.dtqd, avgValue);
                // countCallback('qdc', item.dtqd, avgValue); // Đã vô hiệu hóa ở hàm gọi
                return `<tr class="border-t">
                    <td class="px-4 py-2 font-medium">${item.name}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumberOrDash(item.sl)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.dtqd)}</td>
                </tr>`}).join('')}
            </tbody></table></div></div>`;
    },

    // *** START: MODIFIED FUNCTION (v6.36) ***
    renderPastedCompetitionReport(reportData) {
        console.log(`%c[DEBUG renderPastedCompetitionReport] === Bắt đầu render (v6.36) ===`, "color: blue; font-weight: bold;");
        
        const container = document.getElementById('pasted-competition-report-container');
        if (!container) {
            console.error("[ui-sknv.js] Container '#pasted-competition-report-container' not found.");
            return;
        }

        const columnSettings = settingsService.loadPastedCompetitionViewSettings();
        const dragIconSVG = `<svg class="drag-handle-icon mr-2 cursor-grab" width="12" height="12" viewBox="0 0 10 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 2a1 1 0 10-2 0 1 1 0 002 0zM2 9a1 1 0 110-2 1 1 0 010 2zm0 5a1 1 0 110-2 1 1 0 010 2zm5-12a1 1 0 10-2 0 1 1 0 002 0zM7 9a1 1 0 110-2 1 1 0 010 2zm0 5a1 1 0 110-2 1 1 0 010 2z" fill="currentColor"></path></svg>`;

        if (!reportData || reportData.length === 0) {
            const placeholderToggles = columnSettings.length > 0 
                ? columnSettings.map(col => `
                    <div 
                        class="column-toggle-btn draggable-tag pasted-comp-toggle-btn ${col.visible ? 'active' : ''}" 
                        data-column-ten-goc="${col.tenGoc}" 
                        title="${col.tenGoc} (${col.loaiSoLieu})">
                        ${dragIconSVG} <span>${col.label}</span>
                    </div>
                    `).join('')
                : '<span class="text-sm text-gray-500">Dán dữ liệu để thấy các cột...</span>';
                
            container.innerHTML = `
                <div id="pasted-competition-column-toggles">
                    <span class="non-draggable">HIỂN THỊ CỘT:</span>
                    ${placeholderToggles}
                </div>
                <div data-capture-group="pasted-competition">
                    <p class="text-gray-500 p-4">Không có dữ liệu thi đua nhân viên. Vui lòng dán dữ liệu ở tab "Cập nhật dữ liệu" và đảm bảo bộ lọc không quá hẹp.</p>
                </div>`;
            return;
        }
        
        const visibleColumns = columnSettings.filter(col => col.visible);
        
        let togglesHTML = `<div id="pasted-competition-column-toggles">
            <span class="non-draggable">HIỂN THỊ CỘT:</span>
            ${columnSettings.map(col => `
                <div 
                    class="column-toggle-btn draggable-tag pasted-comp-toggle-btn ${col.visible ? 'active' : ''}" 
                    data-column-ten-goc="${col.tenGoc}" 
                    title="${col.tenGoc} (${col.loaiSoLieu})">
                    ${dragIconSVG} <span>${col.label}</span>
                </div>
            `).join('')}
        </div>`;
        
        let finalHTML = ``; 

        const groupedByDept = {};
        reportData.forEach(item => {
            const dept = item.boPhan || 'Chưa phân loại';
            if (!groupedByDept[dept]) groupedByDept[dept] = [];
            groupedByDept[dept].push(item);
        });

        const departmentOrder = utils.getSortedDepartmentList(reportData);
        const sortStateKey = 'sknv_thidua_pasted';
        
        const deptAverages = {}; 
        departmentOrder.forEach(deptName => {
            const deptData = groupedByDept[deptName];
            const deptAvg = {};
            columnSettings.forEach(col => {
                let total = 0;
                let count = 0;
                deptData.forEach(emp => {
                    const compData = emp.competitions.find(c => c.tenGoc === col.tenGoc);
                    const giaTri = compData?.giaTri || 0;
                    if (giaTri > 0) { 
                        total += giaTri;
                        count++;
                    }
                });
                deptAvg[col.tenGoc] = count > 0 ? total / count : 0;
            });
            deptAverages[deptName] = deptAvg;
        });
        
        uiSknv._lastPastedAverages = deptAverages;
        
        departmentOrder.forEach(deptName => {
            if (groupedByDept[deptName]) {
                const deptData = groupedByDept[deptName];
                
                const sortState = appState.sortState[sortStateKey] || { key: 'hoTen', direction: 'asc' };
                const { key, direction } = sortState;
                
                const sortedData = [...deptData].sort((a, b) => {
                    let valA, valB;
                    if (key.startsWith('comp_')) {
                        const sortCol = columnSettings.find(c => c.id === key);
                        if (!sortCol) return 0; 
                        valA = a.competitions.find(c => c.tenGoc === sortCol.tenGoc)?.giaTri || 0;
                        valB = b.competitions.find(c => c.tenGoc === sortCol.tenGoc)?.giaTri || 0;
                        return direction === 'asc' ? valA - valB : valB - valA;
                        
                    } else if (key === 'totalScore') {
                        const avgScores = deptAverages[deptName];
                        let scoreA = 0;
                        a.competitions.forEach(comp => {
                            if (avgScores[comp.tenGoc] > 0 && comp.giaTri >= avgScores[comp.tenGoc]) {
                                scoreA++;
                            }
                        });
                        let scoreB = 0;
                        b.competitions.forEach(comp => {
                            if (avgScores[comp.tenGoc] > 0 && comp.giaTri >= avgScores[comp.tenGoc]) {
                                scoreB++;
                            }
                        });
                        valA = scoreA;
                        valB = scoreB;
                        return direction === 'asc' ? valA - valB : valB - valA;
                        
                    } else { // Sắp xếp theo 'hoTen'
                        valA = a[key] || ''; 
                        valB = b[key] || '';
                        return direction === 'asc' 
                            ? valA.localeCompare(valB) 
                            : valB.localeCompare(valA);
                    }
                });

                let titleClass = '';
                 if (deptName.includes('Tư Vấn')) titleClass = 'department-header-tv';
                else if (deptName.includes('Kho')) titleClass = 'department-header-kho';
                else if (deptName.includes('Trang Trí')) titleClass = 'department-header-tt';

                const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

                finalHTML += `<div class="department-block">
                    <h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${deptName}</h4>
                    <div class="overflow-x-auto sknv-pasted-competition-scroller"> 
                    
                    <table class="text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}" data-capture-columns="${2 + visibleColumns.length}">
                         <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                            <tr>
                                <th class="${headerClass('hoTen')} sticky-col sticky-col-1" data-sort="hoTen" style="min-width: 150px; white-space: nowrap;">Nhân viên <span class="sort-indicator"></span></th>
                                <th class="${headerClass('totalScore')} sticky-col sticky-col-2 text-center" data-sort="totalScore" style="min-width: 80px;">Tổng đạt <span class="sort-indicator"></span></th>
                                ${visibleColumns.map((header, index) => `
                                     <th class="${headerClass(header.id)} text-center header-group-${index % 12 + 1}" 
                                         data-sort="${header.id}" 
                                         title="${header.tenGoc} (${header.loaiSoLieu})">
                                        ${header.label}
                                        <span class="sort-indicator"></span>
                                    </th>
                                `).join('')}
                                </tr>
                            </thead>
                        <tbody>`;

                const deptTotals = new Map();
                const validEmployeeCount = new Map();
                visibleColumns.forEach(col => {
                    deptTotals.set(col.tenGoc, 0);
                    validEmployeeCount.set(col.tenGoc, 0);
                });

                sortedData.forEach(item => {
                    let totalScore = 0;
                    const deptAvg = deptAverages[item.boPhan] || {};
                    item.competitions.forEach(comp => {
                        const avg = deptAvg[comp.tenGoc];
                        if (avg > 0 && comp.giaTri >= avg) {
                            totalScore++;
                        }
                    });
                
                    finalHTML += `<tr class="interactive-row hover:bg-gray-50" data-employee-id="${item.maNV}" data-source-tab="sknv-thidua-pasted">
                        <td class="px-4 py-2 font-semibold whitespace-nowrap sticky-col sticky-col-1 employee-name-cell">
                            <a href="#">${uiComponents.getShortEmployeeName(item.hoTen, item.maNV)}</a>
                        </td>
                        <td class="px-2 py-2 text-center font-bold text-green-600 sticky-col sticky-col-2">${totalScore}</td>
                        ${visibleColumns.map(col => {
                             const compData = item.competitions.find(c => c.tenGoc === col.tenGoc);
                             const giaTri = compData?.giaTri || 0;
                             let formattedValue = '-';
                            
                            if (giaTri !== 0) {
                                formattedValue = uiComponents.formatNumber(giaTri, 0);
                                deptTotals.set(col.tenGoc, deptTotals.get(col.tenGoc) + giaTri);
                                validEmployeeCount.set(col.tenGoc, validEmployeeCount.get(col.tenGoc) + 1);
                            }
                 
                            const avg = deptAverages[item.boPhan]?.[col.tenGoc] || 0;
                            let cellClass = (col.loaiSoLieu === 'SLLK') ? 'text-right font-bold' : 'text-right font-bold text-blue-600';
                            if (avg > 0 && giaTri < avg) {
                                cellClass += ' cell-performance is-below';
                            }
                            return `<td class="${cellClass} px-2 py-2">${formattedValue}</td>`;
                        }).join('')}
                    </tr>`;
                });

                finalHTML += `</tbody>
                     <tfoot class="table-footer font-bold">
                        <tr class="bg-gray-100">
                            <td class="px-4 py-2 text-left sticky-col sticky-col-1">Tổng</td>
                            <td class="px-2 py-2 sticky-col sticky-col-2"></td> ${visibleColumns.map(col => {
                                const total = deptTotals.get(col.tenGoc) || 0;
                                const formattedTotal = total === 0 ? '-' : uiComponents.formatNumber(total, 0);
                                return `<td class="px-2 py-2 text-right">${formattedTotal}</td>`;
                            }).join('')}
                        </tr>
                         <tr class="bg-gray-100">
                            <td class="px-4 py-2 text-left sticky-col sticky-col-1">Trung Bình</td>
                            <td class="px-2 py-2 sticky-col sticky-col-2"></td> ${visibleColumns.map(col => {
                                const total = deptTotals.get(col.tenGoc) || 0;
                                const count = validEmployeeCount.get(col.tenGoc) || 0;
                                const avg = count > 0 ? total / count : 0;
                                const formattedAvg = avg === 0 ? '-' : uiComponents.formatNumber(avg, 0);
                                return `<td class="px-2 py-2 text-right">${formattedAvg}</td>`;
                            }).join('')}
                        </tr>
                    </tfoot>
                </table></div></div>`; 
            }
        });

        container.innerHTML = `
            ${togglesHTML} 
            <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden" data-capture-group="pasted-competition">
                ${finalHTML}
            </div>`;
        
        setTimeout(() => {
            const tableEl = container.querySelector('table');
            const tableContainer = container.querySelector('.sknv-pasted-competition-scroller');
            const parentContainer = document.getElementById('pasted-competition-report-container');
            const mainContentEl = document.getElementById('main-content');

            if (tableEl && tableContainer && parentContainer && mainContentEl) {
                console.log(`%c[DEBUG renderPastedCompetitionReport] Kích thước sau render (v6.25):`, "color: #00008B; font-weight: bold;");
                console.log(`  > 1. Bảng (<table>): scrollWidth: ${tableEl.scrollWidth}px`);
                console.log(`  > 2. Container Cuộn (.sknv-pasted-competition-scroller): clientWidth: ${tableContainer.clientWidth}px`);
                console.log(`  > 3. Container Báo Cáo (#pasted-competition-report-container): clientWidth: ${parentContainer.clientWidth}px`);
                console.log(`  > 4. Main Content (#main-content): clientWidth: ${mainContentEl.clientWidth}px`);
                console.log(`%c[DEBUG renderPastedCompetitionReport] CHẨN ĐOÁN (v6.25):`, "color: #00008B; font-weight: bold;");
                if (tableEl.scrollWidth > tableContainer.clientWidth) {
                    console.log(`%c  > TỐT: Bảng (1) rộng hơn Container Cuộn (2). Thanh trượt NÊN xuất hiện.`, "color: green;");
                } else {
                    console.log(`%c  > LỖI: Bảng (1) KHÔNG rộng hơn Container Cuộn (2). Thanh trượt sẽ KHÔNG xuất hiện.`, "color: red; font-weight: bold;");
                }
                if (tableContainer.clientWidth >= mainContentEl.clientWidth) {
                     console.log(`%c  > LỖI: Container Cuộn (2) đang rộng bằng hoặc hơn Main Content (4).`, "color: red; font-weight: bold;");
                } else {
                     console.log(`%c  > TỐT: Container Cuộn (2) hẹp hơn Main Content (4).`, "color: green;");
                }
            } else {
                console.error("[DEBUG] Không tìm thấy một trong các phần tử chẩn đoán.");
            }
        }, 0);
    },
    // *** END: MODIFIED FUNCTION (v6.36) ***

    // === START: PHIÊN BẢN MỚI v6.39 (Thay thế v6.38) ===
    /**
     * Render giao diện chi tiết (infographic) cho một nhân viên trong tab "Thi đua NV LK".
     * @param {Object} employeeData - Đối tượng dữ liệu của nhân viên từ appState.pastedThiDuaReportData.
     * @param {Object} allDeptAverages - Đối tượng chứa TBT của tất cả bộ phận (uiSknv._lastPastedAverages).
     */
    renderPastedCompetitionDetail(employeeData, allDeptAverages) {
        const container = document.getElementById('pasted-competition-detail-container');
        if (!container) {
            console.error("[ui-sknv.js] Container '#pasted-competition-detail-container' not found.");
            return;
        }

        if (!employeeData || !allDeptAverages) {
            container.innerHTML = `
                <div class="mb-4">
                    <button class="back-to-summary-btn text-blue-600 hover:underline font-semibold">‹ Quay lại bảng tổng hợp</button>
                </div>
                <p class="text-red-500">Không tìm thấy dữ liệu chi tiết cho nhân viên hoặc dữ liệu TBT bộ phận.</p>`;
            return;
        }

        const employeeInfo = appState.employeeMaNVMap.get(String(employeeData.maNV));
        const hoTen = employeeInfo?.hoTen || employeeData.hoTen;
        const boPhan = employeeInfo?.boPhan || employeeData.boPhan;
        const deptAvg = allDeptAverages[boPhan] || {};

        const nhomDat = [];
        const nhomGanDat = [];
        const nhomCanCoGang = [];
        let totalCriteria = 0; // Chỉ đếm các ngành hàng có TBT > 0

        employeeData.competitions.forEach(comp => {
            const avg = deptAvg[comp.tenGoc] || 0;
            const giaTri = comp.giaTri || 0;
            const chenhLech = giaTri - avg;
            const percentOfAvg = (avg > 0) ? (giaTri / avg) : (giaTri > 0 ? Infinity : 0);

            const cardData = {
                name: comp.tenNganhHang,
                originalName: comp.tenGoc,
                value: giaTri,
                average: avg,
                diff: chenhLech,
                // Tính % thanh tiến độ: nếu đạt thì 100%, nếu chưa đạt thì (giaTri / avg * 100)
                progressPercent: (avg > 0) ? Math.min((giaTri / avg) * 100, 100) : (giaTri > 0 ? 100 : 0)
            };

            if (avg > 0) {
                totalCriteria++; // Chỉ đếm nếu có mục tiêu (TB > 0)
                if (percentOfAvg >= 1.0) {
                    nhomDat.push(cardData);
                } else if (percentOfAvg >= 0.7) {
                    nhomGanDat.push(cardData);
                } else {
                    nhomCanCoGang.push(cardData);
                }
            } else if (giaTri > 0) {
                // Không có TBT, nhưng có bán -> coi như "Đạt" (Ghi nhận)
                cardData.progressPercent = 100; // Thanh đầy
                nhomDat.push(cardData);
            } else {
                // Không TBT, không bán -> Nhóm "Cần cố gắng"
                nhomCanCoGang.push(cardData);
            }
        });

        // Sắp xếp nội bộ các nhóm theo chênh lệch (cao -> thấp)
        const sortInternal = (a, b) => b.diff - a.diff;
        nhomDat.sort(sortInternal);
        nhomGanDat.sort(sortInternal);
        nhomCanCoGang.sort(sortInternal);

        const totalDat = nhomDat.length;
        const totalGanDat = nhomGanDat.length;
        const totalCanCoGang = nhomCanCoGang.length;
        
        // Tỷ lệ đạt chỉ tính trên các ngành có TBT > 0
        const tyLeDat = totalCriteria > 0 ? (nhomDat.filter(item => item.average > 0).length / totalCriteria) : 0;
        
        // === START: THAY ĐỔI (v6.39) - Yêu cầu 2 ===
        // Sửa logic gán class màu. Dùng is-positive/is-negative thay vì tailwind class
        // và sửa logic thành > 0.5 (trên 50%)
        const tyLeDatClass = tyLeDat > 0.5 ? 'is-positive' : 'is-negative';
        // === END: THAY ĐỔI (v6.39) ===

        // Render các thẻ KPI tóm tắt
        const kpiHtml = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6" data-capture-group="1">
                <div class="rt-infographic-summary-card text-center">
                    <div class="label">Ngành hàng Đạt</div>
                    <div class="value text-green-600">
                        ${totalDat} <span class="text-2xl text-gray-400">/ ${employeeData.competitions.length}</span>
                    </div>
                </div>
                <div class="rt-infographic-summary-card text-center">
                    <div class="label">Ngành hàng Gần Đạt (>=70%)</div>
                    <div class="value text-yellow-600">${totalGanDat}</div>
                </div>
                <div class="rt-infographic-summary-card text-center">
                    <div class="label">Tỷ lệ đạt (trên nhóm có TB)</div>
                    <div class="value ${tyLeDatClass}">
                        ${uiComponents.formatPercentage(tyLeDat)}
                    </div>
                </div>
            </div>
        `;

        // === START: THAY ĐỔI (v6.38) - Yêu cầu 3 ===
        // Render 3 "Làn đường" (hàng) riêng biệt
        const columnsHtml = `
            <div class="mt-6 space-y-6" data-capture-group="2">
                
                <div class="sknv-thidua-lane bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div class="sknv-thidua-column-header header-blue">
                        <i data-feather="check-circle"></i>
                        <h4>Nhóm Đạt (${totalDat})</h4>
                    </div>
                    <div class="sknv-thidua-horizontal-content">
                        ${nhomDat.length > 0 ? nhomDat.map(item => this._renderThiduaItemCard(item, 'bg-blue-500')).join('') : '<p class="empty-col-msg">Không có ngành hàng nào.</p>'}
                    </div>
                </div>

                <div class="sknv-thidua-lane bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div class="sknv-thidua-column-header header-yellow">
                        <i data-feather="alert-triangle"></i>
                        <h4>Nhóm Gần Đạt (${totalGanDat})</h4>
                    </div>
                    <div class="sknv-thidua-horizontal-content">
                        ${nhomGanDat.length > 0 ? nhomGanDat.map(item => this._renderThiduaItemCard(item, 'bg-yellow-500')).join('') : '<p class="empty-col-msg">Không có ngành hàng nào.</p>'}
                    </div>
                </div>

                <div class="sknv-thidua-lane bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div class="sknv-thidua-column-header header-red">
                        <i data-feather="x-circle"></i>
                        <h4>Nhóm Cần Cố Gắng (${totalCanCoGang})</h4>
                    </div>
                    <div class="sknv-thidua-horizontal-content">
                        ${nhomCanCoGang.length > 0 ? nhomCanCoGang.map(item => this._renderThiduaItemCard(item, 'bg-red-500')).join('') : '<p class="empty-col-msg">Không có ngành hàng nào.</p>'}
                    </div>
                </div>

            </div>
        `;
        // === END: THAY ĐỔI (v6.38) ===

        // Render toàn bộ
        container.innerHTML = `
            <div class="mb-4 flex justify-between items-center">
                <button class="back-to-summary-btn text-blue-600 hover:underline font-semibold">‹ Quay lại bảng tổng hợp</button>
            </div>
            
            <div id="sknv-thidua-detail-capture-area" class="max-w-7xl mx-auto"> 
                
                <div class="sknv-detail-header-card bg-purple-50 border-purple-200 border-t-purple-500" data-capture-group="1">
                    <div class="sknv-card__avatar sknv-detail-avatar bg-purple-200">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="text-purple-800"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </div>
                    <div class="sknv-detail-info">
                         <p class="name text-purple-800">${hoTen} - ${employeeData.maNV}</p>
                        <p class="department text-gray-700">${boPhan}</p>
                    </div>
                </div>

                ${kpiHtml}

                ${columnsHtml}
                
            </div>
        `;
        
        feather.replace();
    },
    // === END: PHIÊN BẢN MỚI v6.39 ===

    // === START: HÀM HELPER MỚI (v6.37) ===
    /**
     * @private
     * Render một thẻ ngành hàng cho giao diện infographic chi tiết.
     * @param {Object} item - Dữ liệu của một ngành hàng.
     * @param {string} colorClass - Class màu cho thanh tiến độ (ví dụ: 'bg-blue-500').
     */
    _renderThiduaItemCard(item, colorClass) {
        const diffClass = item.diff > 0 ? 'text-green-600' : (item.diff < 0 ? 'text-red-600' : 'text-gray-500');
        const diffSign = item.diff > 0 ? '+' : '';
        
        // Chỉ hiển thị chênh lệch nếu có TB
        let diffText = (item.average > 0) 
            ? `${diffSign}${uiComponents.formatNumberOrDash(item.diff, 1)}` 
            : '-';
        
        // Trường hợp đặc biệt: Ghi nhận (Có bán nhưng không có TB)
        if (item.average === 0 && item.value > 0) {
            diffText = 'Ghi nhận';
        }

        return `
        <div class="sknv-thidua-item-card">
            <p class="item-card-title" title="${item.originalName}">${item.name}</p>
            <div class="item-card-progress-bar-container">
                <div class="item-card-progress-bar ${colorClass}" style="width: ${item.progressPercent}%;"></div>
            </div>
            <div class="item-card-metrics">
                <span>Thực hiện: <strong>${uiComponents.formatNumberOrDash(item.value, 1)}</strong></span>
                <span>TB Bộ phận: <strong>${uiComponents.formatNumberOrDash(item.average, 1)}</strong></span>
                <span class="${diffClass}">Chênh lệch: <strong>${diffText}</strong></span>
            </div>
        </div>
        `;
    }
    // === END: HÀM HELPER MỚI (v6.37) ===
};