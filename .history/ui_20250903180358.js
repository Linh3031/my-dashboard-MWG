// Version 5.0
// MODULE 4: KỆ "GIAO DIỆN" (UI)
// File này chứa tất cả các hàm chịu trách nhiệm cập nhật và hiển thị dữ liệu ra màn hình.

// Nhập khẩu các đối tượng và hàm cần thiết
import { appState } from './state.js';
import { config } from './config.js';
import { services } from './services.js';

const ui = {
    showProgressBar: (elementId) => document.getElementById(`progress-${elementId}`)?.classList.remove('hidden'),
    hideProgressBar: (elementId) => document.getElementById(`progress-${elementId}`)?.classList.add('hidden'),
    showNotification: (message, type = 'success') => {
        const notification = document.getElementById('notification');
        if (!notification) return;
        notification.textContent = message;
        notification.className = `show ${type === 'success' ? 'notification-success' : 'notification-error'}`;
        setTimeout(() => notification.classList.remove('show'), 3000);
    },
    formatNumber: (value, decimals = 0) => {
        if (isNaN(value) || value === null) return '0';
        return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
    },
    formatNumberOrDash: (value, decimals = 0) => {
        if (!isFinite(value) || value === null || value === 0) return '-';
        return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
    },
    formatPercentage: (value) => {
        if (!isFinite(value) || value === null || value === 0) return '-';
        const roundedPercent = parseFloat((value * 100).toFixed(1));
        const isWholeRounded = Number.isInteger(roundedPercent);
        return new Intl.NumberFormat('vi-VN', { style: 'percent', minimumFractionDigits: isWholeRounded ? 0 : 1, maximumFractionDigits: 1 }).format(value);
    },

    displayDebugInfo(fileType) {
        const container = document.getElementById('debug-tool-container');
        
        const resultsContainer = document.getElementById('debug-results-container');
        if (!fileType) {
            resultsContainer.innerHTML = '<p class="text-gray-500">Chưa có file nào được tải lên để kiểm tra.</p>';
            return;
        }
        if (resultsContainer.innerHTML.includes('Chưa có file nào')) resultsContainer.innerHTML = '';

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
        if (existingEl) existingEl.innerHTML = tableHTML;
        else {
            const wrapper = document.createElement('div');
            wrapper.id = `debug-table-${fileType}`;
            wrapper.innerHTML = tableHTML;
            resultsContainer.appendChild(wrapper);
        }
    },

    displayHealthKpiTable: (extractedData, goals, updateDailyGoalCallback) => {
        const container = document.getElementById('luyke-kpi-table-content').querySelector('tbody');
        if (!container) return;
    
        const targetThuc = (parseFloat(goals.doanhThuThuc) || 0) * 1000; 
        const targetQd = (parseFloat(goals.doanhThuQD) || 0) * 1000;
    
        const { mainKpis } = extractedData;
        if (!mainKpis || Object.keys(mainKpis).length === 0) {
            container.innerHTML = '<tr><td colspan="3" class="text-center p-4">Vui lòng dán "Data lũy kế" ở tab Data.</td></tr>';
            return;
        }
    
        const cleanValue = (str) => (typeof str === 'string' ? parseFloat(str.replace(/,/g, '').replace('%', '')) : (typeof str === 'number' ? str : 0));
    
        const dtThucLK = cleanValue(mainKpis['Thực hiện DT thực']);
        const dtQdLK = cleanValue(mainKpis['Thực hiện DTQĐ']);
        const dtThucDK = cleanValue(mainKpis['Dự kiến DT thực']);
        const dtQdDK = cleanValue(mainKpis['Dự kiến DTQĐ']);
        const dtGop = cleanValue(mainKpis['Doanh thu trả chậm']);
        const phanTramGopRaw = cleanValue(mainKpis['% Trả chậm']);
    
        const phanTramQd = dtThucLK > 0 ? (dtQdLK / dtThucLK) - 1 : 0;
        const phanTramGop = dtThucLK > 0 ? dtGop / dtThucLK : (phanTramGopRaw / 100);
    
        const phanTramTargetThuc = targetThuc > 0 ? dtThucDK / targetThuc : 0;
        const phanTramTargetQd = targetQd > 0 ? dtQdDK / targetQd : 0;
    
        const mucTieuQuyDoi = (parseFloat(goals.phanTramQD) || 0) / 100;
        const mucTieuTraCham = (parseFloat(goals.phanTramTC) || 0) / 100;
    
        const qdClass = phanTramQd < mucTieuQuyDoi ? 'cell-performance is-below' : '';
        const tcClass = phanTramGop < mucTieuTraCham ? 'cell-performance is-below' : '';
    
        container.innerHTML = `
            <tr class="bg-slate-50">
                <td class="px-4 py-2 font-semibold">Target</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(targetThuc / 1000000, 3)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(targetQd / 1000000, 3)}</td>
            </tr>
            <tr>
                <td class="px-4 py-2 font-semibold">Thực hiện</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(dtThucLK / 1000, 2)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(dtQdLK / 1000, 2)}</td>
            </tr>
            <tr class="bg-slate-50">
                <td class="px-4 py-2 font-semibold">Dự kiến</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(dtThucDK / 1000, 2)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(dtQdDK / 1000, 2)}</td>
            </tr>
            <tr>
                <td class="px-4 py-2 font-semibold">% Hoàn thành</td>
                <td class="px-4 py-2 text-right font-bold text-red-600">${ui.formatPercentage(phanTramTargetThuc)}</td>
                <td class="px-4 py-2 text-right font-bold text-red-600">${ui.formatPercentage(phanTramTargetQd)}</td>
            </tr>
             <tr class="bg-slate-50">
                <td class="px-4 py-2 font-semibold">Doanh thu trả chậm</td>
                <td class="px-4 py-2 text-right font-bold" colspan="2">${ui.formatNumberOrDash(dtGop / 1000, 2)}</td>
            </tr>
            <tr>
                <td class="px-4 py-2 font-semibold">% Quy đổi</td>
                <td class="px-4 py-2 text-center font-bold ${qdClass}" colspan="2">${ui.formatPercentage(phanTramQd)}</td>
            </tr>
             <tr class="bg-slate-50">
                <td class="px-4 py-2 font-semibold">% Trả chậm</td>
                <td class="px-4 py-2 text-center font-bold ${tcClass}" colspan="2">${ui.formatPercentage(phanTramGop)}</td>
            </tr>`;
    
        const today = new Date();
        const currentDay = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const timeProgress = (currentDay - 1) / daysInMonth;
    
        const filteredLuykeData = appState.masterReportData.luyke || [];
        const aggregatedLuyke = filteredLuykeData.reduce((acc, curr) => {
            acc.dtICT += curr.dtICT;
            acc.dtCE += curr.dtCE;
            return acc;
        }, { dtICT: 0, dtCE: 0 });

        ui.renderLuykeCharts(phanTramTargetQd, timeProgress, aggregatedLuyke);
        updateDailyGoalCallback();
    },
    displayCompetitionResultsFromLuyKe: () => {
        const container = document.getElementById('luyke-competition-content');
        if (!container) return;

        const data = appState.competitionData;
        const dataDoanhThu = data.filter(d => d.type === 'doanhThu');
        const dataSoLuong = data.filter(d => d.type === 'soLuong');
        
        const summary = {
            total: data.length,
            dat: data.filter(d => parseFloat(String(d.hoanThanh).replace('%','')) >= 100).length,
        };
        summary.chuaDat = summary.total - summary.dat;
        document.getElementById('luyke-competition-summary').textContent = `(Tổng: ${summary.total}, Đạt: ${summary.dat}, Chưa đạt: ${summary.chuaDat})`;

        const renderTable = (title, items, type) => {
            if(items.length === 0) return '';
            const { key, direction } = appState.sortState[`competition_${type}`];
            
            const sortedItems = [...items].sort((a, b) => {
                let valA = a[key]; let valB = b[key];
                if (key === 'hoanThanh') {
                    valA = parseFloat(String(valA).replace('%', '')) || 0;
                    valB = parseFloat(String(valB).replace('%', '')) || 0;
                }
                return direction === 'asc' ? valA - valB : valB - valA;
            });
            
            const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
            const today = new Date();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const daysRemaining = daysInMonth - today.getDate();

            const headerColorClass = type === 'doanhthu' ? 'competition-header-doanhthu' : 'competition-header-soluong';

            return `<div class="flex flex-col"><h4 class="text-lg font-bold text-gray-800 p-2 border-b-2 ${headerColorClass}">${title} <span class="text-sm font-normal text-gray-500">(${items.length} chương trình)</span></h4>
                <div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="competition_${type}">
                    <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                        <tr>
                            <th class="${headerClass('name')}" data-sort="name">Chương trình<span class="sort-indicator"></span></th>
                            <th class="${headerClass('luyKe')} text-right" data-sort="luyKe">Lũy kế<span class="sort-indicator"></span></th>
                            <th class="${headerClass('target')} text-right" data-sort="target">Target<span class="sort-indicator"></span></th>
                            <th class="${headerClass('hoanThanh')} text-right" data-sort="hoanThanh">% HT<span class="sort-indicator"></span></th>
                            <th class="${headerClass('mucTieuNgay')} text-right header-highlight-special" data-sort="mucTieuNgay" style="max-width: 100px; white-space: normal;">Mục tiêu ngày<span class="sort-indicator"></span></th>
                        </tr>
                    </thead>
                    <tbody>${sortedItems.map(item => {
                        let dailyTarget = 0;
                        if (daysRemaining > 0) {
                            dailyTarget = (item.target - item.luyKe) / daysRemaining;
                        } else { 
                            dailyTarget = item.target - item.luyKe;
                        }
                        return `<tr class="hover:bg-purple-50">
                            <td class="px-2 py-2 font-semibold">${item.name}</td>
                            <td class="px-2 py-2 text-right font-bold">${ui.formatNumberOrDash(item.luyKe, 0)}</td>
                            <td class="px-2 py-2 text-right font-bold">${ui.formatNumberOrDash(item.target, 0)}</td>
                            <td class="px-2 py-2 text-right font-bold text-blue-600">${item.hoanThanh}</td>
                            <td class="px-2 py-2 text-right font-bold text-orange-600">${ui.formatNumberOrDash(dailyTarget, 0)}</td>
                        </tr>`
                    }).join('')}</tbody></table></div></div>`;
        };

        container.innerHTML = `
            ${renderTable('Thi đua Doanh thu', dataDoanhThu, 'doanhthu')}
            ${renderTable('Thi đua Số lượng', dataSoLuong, 'soluong')}`;
        if (data.length === 0) container.innerHTML = '<p class="text-gray-500 font-bold col-span-2">Vui lòng dán "Data lũy kế" ở tab "Data".</p>';
    },

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
        config.DEPARTMENT_GROUPS.forEach(deptName => {
            if (groupedByDept[deptName]) finalHTML += ui.renderRevenueTableForDepartment(deptName, groupedByDept[deptName], sortStateKey);
        });
        finalHTML += `</div>`;
        container.innerHTML = finalHTML;
    },

    renderRevenueTableForDepartment: (title, data, sortStateKey) => {
        const { key, direction } = appState.sortState[sortStateKey];
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

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        let tableHTML = `<div class="department-block"><h4 class="text-lg font-bold text-gray-800 p-4 border-b border-gray-200">${title}</h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}">
                        <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                            <tr>
                                <th class="${headerClass('hoTen')}" data-sort="hoTen">Nhân viên <span class="sort-indicator"></span></th>
                                <th class="${headerClass('doanhThu')} text-right header-bg-blue" data-sort="doanhThu">Doanh Thu <span class="sort-indicator"></span></th>
                                <th class="${headerClass('doanhThuQuyDoi')} text-right header-bg-blue" data-sort="doanhThuQuyDoi">Doanh Thu QĐ <span class="sort-indicator"></span></th>
                                <th class="${headerClass('hieuQuaQuyDoi')} text-right header-bg-blue" data-sort="hieuQuaQuyDoi">% QĐ <span class="sort-indicator"></span></th>
                                <th class="${headerClass('doanhThuTraGop')} text-right header-bg-green" data-sort="doanhThuTraGop">DT trả chậm <span class="sort-indicator"></span></th>
                                <th class="${headerClass('tyLeTraCham')} text-right header-bg-green" data-sort="tyLeTraCham">% trả chậm <span class="sort-indicator"></span></th>
                                <th class="${headerClass('doanhThuChuaXuat')} text-right header-bg-yellow" data-sort="doanhThuChuaXuat">DT Chưa Xuất <span class="sort-indicator"></span></th>
                            </tr>
                        </thead><tbody>`;
        sortedData.forEach(item => {
            const { mucTieu } = item;
            const qdClass = item.hieuQuaQuyDoi < (mucTieu.phanTramQD / 100) ? 'cell-performance is-below' : '';
            const tcClass = item.tyLeTraCham < (mucTieu.phanTramTC / 100) ? 'cell-performance is-below' : '';
            tableHTML += `<tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-semibold">${item.hoTen}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.doanhThu / 1000000, 2)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.doanhThuQuyDoi / 1000000, 2)}</td>
                    <td class="px-4 py-2 text-right font-bold ${qdClass}">${ui.formatPercentage(item.hieuQuaQuyDoi)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.doanhThuTraGop / 1000000, 2)}</td>
                    <td class="px-4 py-2 text-right font-bold ${tcClass}">${ui.formatPercentage(item.tyLeTraCham)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.doanhThuChuaXuat / 1000000, 2)}</td></tr>`;
        });
         tableHTML += `</tbody><tfoot class="table-footer font-bold"><tr>
                    <td class="px-4 py-2">Tổng</td>
                    <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.doanhThu / 1000000, 2)}</td>
                    <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.doanhThuQuyDoi / 1000000, 2)}</td>
                    <td class="px-4 py-2 text-right">${ui.formatPercentage(totals.hieuQuaQuyDoi)}</td>
                    <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.doanhThuTraGop / 1000000, 2)}</td>
                    <td class="px-4 py-2 text-right">${ui.formatPercentage(totals.tyLeTraCham)}</td>
                    <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.doanhThuChuaXuat / 1000000, 2)}</td>
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
        config.DEPARTMENT_GROUPS.forEach(deptName => {
            if (groupedByDept[deptName]) finalHTML += ui.renderIncomeTableForDepartment(deptName, groupedByDept[deptName]);
        });
        finalHTML += `</div>`;
        container.innerHTML = finalHTML;
    },

    renderIncomeTableForDepartment: (title, data) => {
        const { key, direction } = appState.sortState.thunhap;
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
            return acc;
        }, { gioCong: 0, thuongNong: 0, thuongERP: 0, tongThuNhap: 0, thuNhapDuKien: 0 });

        const averageProjectedIncome = data.length > 0 ? totals.thuNhapDuKien / data.length : 0;
        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        let tableHTML = `<div class="department-block"><h4 class="text-lg font-bold text-gray-800 p-4 border-b border-gray-200">${title} <span class="text-sm font-normal text-gray-500">(Thu nhập DK TB: ${ui.formatNumberOrDash(averageProjectedIncome / 1000000, 2)})</span></h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="thunhap">
                        <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                            <tr>
                                <th class="${headerClass('hoTen')}" data-sort="hoTen">Họ Tên <span class="sort-indicator"></span></th>
                                <th class="${headerClass('gioCong')} text-right" data-sort="gioCong">Giờ công <span class="sort-indicator"></span></th>
                                <th class="${headerClass('thuongNong')} text-right" data-sort="thuongNong">Thưởng nóng <span class="sort-indicator"></span></th>
                                <th class="${headerClass('thuongERP')} text-right" data-sort="thuongERP">Thưởng ERP <span class="sort-indicator"></span></th>
                                <th class="${headerClass('tongThuNhap')} text-right" data-sort="tongThuNhap">Tổng thu nhập <span class="sort-indicator"></span></th>
                                <th class="${headerClass('thuNhapDuKien')} text-right" data-sort="thuNhapDuKien">Thu nhập DK <span class="sort-indicator"></span></th>
                            </tr>
                        </thead><tbody>`;
        sortedData.forEach(nv => {
            const incomeDkCellClass = nv.thuNhapDuKien < averageProjectedIncome ? 'cell-performance is-below' : '';
            tableHTML += `<tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-semibold">${nv.hoTen}</td>
                    <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(nv.gioCong, 1)}</td>
                    <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(nv.thuongNong / 1000000, 2)}</td>
                    <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(nv.thuongERP / 1000000, 2)}</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-600">${ui.formatNumberOrDash(nv.tongThuNhap / 1000000, 2)}</td>
                    <td class="px-4 py-2 text-right font-bold text-green-600 ${incomeDkCellClass}">${ui.formatNumberOrDash(nv.thuNhapDuKien / 1000000, 2)}</td></tr>`;
        });
        tableHTML += `</tbody><tfoot class="table-footer font-bold">
            <tr>
                <td class="px-4 py-2">Tổng</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.gioCong, 1)}</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.thuongNong / 1000000, 2)}</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.thuongERP / 1000000, 2)}</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.tongThuNhap / 1000000, 2)}</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.thuNhapDuKien / 1000000, 2)}</td>
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
        config.DEPARTMENT_GROUPS.forEach(deptName => {
            if (groupedByDept[deptName]) finalHTML += ui.renderEfficiencyTableForDepartment(deptName, groupedByDept[deptName], sortStateKey);
        });
        finalHTML += `</div>`;
        container.innerHTML = finalHTML;
    },

    renderEfficiencyTableForDepartment: (title, data, sortStateKey) => {
        const { key, direction } = appState.sortState[sortStateKey];
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

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        let tableHTML = `<div class="department-block"><h4 class="text-lg font-bold text-gray-800 p-4 border-b border-gray-200">${title}</h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}">
                    <thead class="text-xs text-slate-800 uppercase font-bold">
                        <tr>
                            <th class="${headerClass('hoTen')}" data-sort="hoTen">Tên nhân viên <span class="sort-indicator"></span></th>
                            <th class="${headerClass('dtICT')} text-right header-bg-yellow" data-sort="dtICT">DT ICT <span class="sort-indicator"></span></th>
                            <th class="${headerClass('dtPhuKien')} text-right header-bg-yellow" data-sort="dtPhuKien">DT Phụ kiện <span class="sort-indicator"></span></th>
                            <th class="${headerClass('pctPhuKien')} text-right header-bg-yellow" data-sort="pctPhuKien">% Phụ kiện <span class="sort-indicator"></span></th>
                            <th class="${headerClass('dtCE')} text-right header-bg-blue" data-sort="dtCE">DT CE <span class="sort-indicator"></span></th>
                            <th class="${headerClass('dtGiaDung')} text-right header-bg-blue" data-sort="dtGiaDung">DT Gia dụng <span class="sort-indicator"></span></th>
                            <th class="${headerClass('pctGiaDung')} text-right header-bg-blue" data-sort="pctGiaDung">% Gia dụng <span class="sort-indicator"></span></th>
                            <th class="${headerClass('pctMLN')} text-right header-bg-blue" data-sort="pctMLN">% MLN <span class="sort-indicator"></span></th>
                            <th class="${headerClass('pctSim')} text-right header-bg-green" data-sort="pctSim">% Sim <span class="sort-indicator"></span></th>
                            <th class="${headerClass('pctVAS')} text-right header-bg-green" data-sort="pctVAS">% VAS <span class="sort-indicator"></span></th>
                            <th class="${headerClass('pctBaoHiem')} text-right header-bg-green" data-sort="pctBaoHiem">% Bảo hiểm <span class="sort-indicator"></span></th>
                        </tr>
                    </thead><tbody>`;
        sortedData.forEach(item => {
            const { mucTieu } = item;
            const pkClass = item.pctPhuKien < (mucTieu.phanTramPhuKien / 100) ? 'cell-performance is-below' : '';
            const gdClass = item.pctGiaDung < (mucTieu.phanTramGiaDung / 100) ? 'cell-performance is-below' : '';
            const mlnClass = item.pctMLN < (mucTieu.phanTramMLN / 100) ? 'cell-performance is-below' : '';
            const simClass = item.pctSim < (mucTieu.phanTramSim / 100) ? 'cell-performance is-below' : '';
            const vasClass = item.pctVAS < (mucTieu.phanTramVAS / 100) ? 'cell-performance is-below' : '';
            const bhClass = item.pctBaoHiem < (mucTieu.phanTramBaoHiem / 100) ? 'cell-performance is-below' : '';

            tableHTML += `<tr class="hover:bg-gray-50">
                <td class="px-4 py-2 font-semibold">${item.hoTen}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.dtICT / 1000000, 2)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.dtPhuKien / 1000000, 2)}</td>
                <td class="px-4 py-2 text-right font-bold ${pkClass}">${ui.formatPercentage(item.pctPhuKien)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.dtCE / 1000000, 2)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.dtGiaDung / 1000000, 2)}</td>
                <td class="px-4 py-2 text-right font-bold ${gdClass}">${ui.formatPercentage(item.pctGiaDung)}</td>
                <td class="px-4 py-2 text-right font-bold ${mlnClass}">${ui.formatPercentage(item.pctMLN)}</td>
                <td class="px-4 py-2 text-right font-bold ${simClass}">${ui.formatPercentage(item.pctSim)}</td>
                <td class="px-4 py-2 text-right font-bold ${vasClass}">${ui.formatPercentage(item.pctVAS)}</td>
                <td class="px-4 py-2 text-right font-bold ${bhClass}">${ui.formatPercentage(item.pctBaoHiem)}</td></tr>`;
        });
        tableHTML += `</tbody><tfoot class="table-footer font-bold">
            <tr>
                <td class="px-4 py-2">Tổng</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.dtICT / 1000000, 2)}</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.dtPhuKien / 1000000, 2)}</td>
                <td class="px-4 py-2 text-right">${ui.formatPercentage(totals.pctPhuKien)}</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.dtCE / 1000000, 2)}</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.dtGiaDung / 1000000, 2)}</td>
                <td class="px-4 py-2 text-right">${ui.formatPercentage(totals.pctGiaDung)}</td>
                <td class="px-4 py-2 text-right">${ui.formatPercentage(totals.pctMLN)}</td>
                <td class="px-4 py-2 text-right">${ui.formatPercentage(totals.pctSim)}</td>
                <td class="px-4 py-2 text-right">${ui.formatPercentage(totals.pctVAS)}</td>
                <td class="px-4 py-2 text-right">${ui.formatPercentage(totals.pctBaoHiem)}</td>
            </tr>
        </tfoot></table></div></div>`;
        return tableHTML;
    },
    displayCategoryRevenueReport: (reportData, containerId, sortStatePrefix) => {
// ... The rest of the ui object
// ...
// ...
};

// Xuất khẩu đối tượng ui để module main.js có thể sử dụng
export { ui };
