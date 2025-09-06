// Version 5.1
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
                ${ui.renderCategoryTable('ICT', `${sortStatePrefix}_ict`, reportData, 'dtICT', 'slICT', ['slDienThoai', 'slLaptop'], ['SL Điện thoại', 'SL Laptop'])}
                ${ui.renderCategoryTable('PHỤ KIỆN', `${sortStatePrefix}_phukien`, reportData, 'dtPhuKien', 'slPhuKien', ['slPinSDP', 'slCamera', 'slTaiNgheBLT'], ['SL Pin SDP', 'SL Camera', 'SL Tai nghe BLT'])}
                ${ui.renderCategoryTable('GIA DỤNG', `${sortStatePrefix}_giadung`, reportData, 'dtGiaDung', 'slGiaDung', ['slNoiChien', 'slMLN', 'slRobotHB'], ['SL Nồi chiên', 'SL MLN', 'SL Robot HB'])}
                ${ui.renderCategoryTable('CE', `${sortStatePrefix}_ce`, reportData, 'dtCE', 'slCE', ['slTivi', 'slTuLanh', 'slMayGiat', 'slMayLanh'], ['SL Tivi', 'SL Tủ lạnh', 'SL Máy giặt', 'SL Máy lạnh'])}
                <div class="lg:col-span-2">
                    ${ui.renderCategoryTable('BẢO HIỂM', `${sortStatePrefix}_baohiem`, reportData, 'dtBaoHiem', 'slBaoHiem', ['slBH1d1', 'slBHXM', 'slBHRV', 'slBHMR'], ['BH 1-1', 'BHXM', 'BHRV', 'BHMR'])}
                </div></div>`;
        container.innerHTML = finalHTML;
    },

    renderCategoryTable: (title, type, data, revenueField, slField, keys, headers) => {
        const { key, direction } = appState.sortState[type] || { key: revenueField, direction: 'desc' };
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

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        const colorKey = type.split('_').pop();

        let tableHTML = `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-full flex flex-col">
            <h4 class="text-lg font-bold p-4 border-b border-gray-200 category-header-${colorKey}">${title}</h4>
            <div class="overflow-x-auto flex-grow"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${type}"><thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold"><tr>
                <th class="${headerClass('hoTen')}" data-sort="hoTen">Tên nhân viên <span class="sort-indicator"></span></th>
                <th class="${headerClass(slField)} text-right header-highlight" data-sort="${slField}">SL <span class="sort-indicator"></span></th>
                <th class="${headerClass(revenueField)} text-right header-highlight" data-sort="${revenueField}">Doanh thu thực <span class="sort-indicator"></span></th>`;
        headers.forEach((h, i) => {
            tableHTML += `<th class="${headerClass(keys[i])} text-right" data-sort="${keys[i]}">${h} <span class="sort-indicator"></span></th>`;
        });
        tableHTML += `</tr></thead><tbody>`;
        sortedData.forEach(item => {
            tableHTML += `<tr class="hover:bg-gray-50"><td class="px-4 py-2 font-semibold">${item.hoTen}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item[slField])}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item[revenueField] / 1000000, 2)}</td>`;
            keys.forEach(k => { tableHTML += `<td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item[k])}</td>`; });
            tableHTML += `</tr>`;
        });
        tableHTML += `</tbody><tfoot class="table-footer font-bold">
                <tr><td class="px-4 py-2">Tổng</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals[slField])}</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals[revenueField] / 1000000, 2)}</td>`;
        keys.forEach(k => { tableHTML += `<td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals[k])}</td>`; });
        tableHTML += `</tr></tfoot></table></div></div>`;
        return tableHTML;
    },

    populateAllFilters: () => {
        const warehouses = [...new Set(appState.danhSachNhanVien.map(nv => nv.maKho).filter(Boolean))];
        const departments = [...new Set(appState.danhSachNhanVien.map(nv => nv.boPhan).filter(Boolean))];
        const warehouseOptions = '<option value="">Tất cả kho</option>' + warehouses.map(d => `<option value="${d}">${d}</option>`).join('');
        const departmentOptions = '<option value="">Tất cả bộ phận</option>' + departments.map(d => `<option value="${d}">${d}</option>`).join('');

        ['luyke', 'sknv', 'realtime'].forEach(prefix => {
            document.getElementById(`${prefix}-filter-warehouse`).innerHTML = warehouseOptions;
            document.getElementById(`${prefix}-filter-department`).innerHTML = departmentOptions;
            
            if (appState.choices[`${prefix}_employee`]) appState.choices[`${prefix}_employee`].destroy();
            appState.choices[`${prefix}_employee`] = new Choices(`#${prefix}-filter-name`, { removeItemButton: true, placeholder: true, placeholderValue: 'Tìm & chọn nhân viên...' });

            if (appState.choices[`${prefix}_highlight_nhanhang`]) appState.choices[`${prefix}_highlight_nhanhang`].destroy();
            appState.choices[`${prefix}_highlight_nhanhang`] = new Choices(`#${prefix}-highlight-nhanhang`, { removeItemButton: true, placeholder: true, placeholderValue: 'Tìm & chọn ngành hàng...' });
            
            if (appState.choices[`${prefix}_highlight_nhomhang`]) appState.choices[`${prefix}_highlight_nhomhang`].destroy();
             appState.choices[`${prefix}_highlight_nhomhang`] = new Choices(`#${prefix}-highlight-nhomhang`, { removeItemButton: true, placeholder: true, placeholderValue: 'Tìm & chọn nhóm hàng...' });

            if (appState.choices[`${prefix}_highlight_employee`]) appState.choices[`${prefix}_highlight_employee`].destroy();
            appState.choices[`${prefix}_highlight_employee`] = new Choices(`#${prefix}-highlight-employee`, { removeItemButton: true, placeholder: true, placeholderValue: 'Tìm & chọn nhân viên...' });
        });
        
        document.getElementById('rt-goal-warehouse-select').innerHTML = '<option value="">-- Chọn kho để cài đặt --</option>' + warehouses.map(w => `<option value="${w}">${w}</option>`).join('');
        document.getElementById('luyke-goal-warehouse-select').innerHTML = '<option value="">-- Chọn kho để cài đặt --</option>' + warehouses.map(w => `<option value="${w}">${w}</option>`).join('');

        ui.updateEmployeeFilter('luyke');
        ui.updateEmployeeFilter('sknv');
        ui.updateEmployeeFilter('realtime');
    },
    updateEmployeeFilter: (prefix) => {
        const selectedWarehouse = document.getElementById(`${prefix}-filter-warehouse`).value;
        const selectedDept = document.getElementById(`${prefix}-filter-department`).value;
        const employeeChoices = appState.choices[`${prefix}_employee`];
        if (!employeeChoices) return;
        
        let employees = appState.danhSachNhanVien;
        if (selectedWarehouse) employees = employees.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) employees = employees.filter(nv => nv.boPhan === selectedDept);

        const employeeOptions = employees.map(nv => ({ value: String(nv.maNV).trim(), label: nv.hoTen, selected: false }));
        employeeChoices.clearStore();
        employeeChoices.setChoices(employeeOptions, 'value', 'label', false);
        
        if (prefix === 'sknv') {
            document.getElementById('sknv-employee-filter').innerHTML = '<option value="">-- Chọn nhân viên --</option>' + employees.map(nv => `<option value="${String(nv.maNV).trim()}">${nv.hoTen}</option>`).join('');
        }
    },

    displaySknvReport: (filteredReport) => {
        const detailsContainer = document.getElementById('sknv-details-container');
        const summaryContainer = document.getElementById('sknv-summary-container');
        const selectedMaNV = document.getElementById('sknv-employee-filter').value;
        
        if (!detailsContainer || !summaryContainer) return;
        
        if (!selectedMaNV) {
            detailsContainer.innerHTML = '<p class="text-gray-500">Vui lòng chọn một nhân viên để xem chi tiết.</p>';
            summaryContainer.classList.remove('hidden');
            ui.displaySknvSummaryReport(filteredReport);
            return;
        }
        
        summaryContainer.classList.add('hidden');

        const employeeData = filteredReport.find(nv => String(nv.maNV).trim() == String(selectedMaNV).trim());
        if (!employeeData) {
            detailsContainer.innerHTML = '<p class="text-red-500">Không tìm thấy dữ liệu cho nhân viên đã chọn.</p>'; return;
        }

        const departmentAverages = services.calculateDepartmentAverages(employeeData.boPhan, appState.masterReportData.sknv);
        
        const createDetailTableHtml = (title, colorClass, rows) => {
            let rowsHtml = rows.map(row => {
                const evaluation = getEvaluation(row.rawValue, row.rawAverage);
                return `<tr class="border-t"><td class="px-4 py-2 font-medium text-gray-700">${row.label}</td><td class="px-4 py-2 text-right font-bold text-gray-900 ${row.valueClass || ''}">${row.value}</td><td class="px-4 py-2 text-right font-medium text-gray-500">${row.average}</td><td class="px-4 py-2 text-center font-semibold ${evaluation.class}">${evaluation.text}</td></tr>`
            }).join('');
            return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><h4 class="text-lg font-bold p-3 border-b ${colorClass}">${title}</h4><table class="min-w-full text-sm table-bordered table-striped">
                <thead class="sknv-subtable-header"><tr><th class="px-4 py-2 text-left">Chỉ số</th><th class="px-4 py-2 text-right">Giá trị</th><th class="px-4 py-2 text-right">Giá trị TB</th><th class="px-4 py-2 text-center">Đánh giá</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
        };

        const createDoanhThuChiTietTableHtml = (title, colorClass, data) => {
            const rows = Object.entries(data).sort(([, a], [, b]) => b.revenue - a.revenue).map(([nganhHang, values]) => `
                    <tr class="border-t"><td class="px-4 py-2 font-medium text-gray-700">${nganhHang}</td><td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(values.quantity)}</td><td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(values.revenue / 1000000, 2)}</td></tr>`).join('');
            if (!rows) return '';
            return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><h4 class="text-lg font-bold p-3 border-b ${colorClass}">${title}</h4><table class="min-w-full text-sm table-bordered table-striped">
                    <thead class="sknv-subtable-header"><tr><th class="px-4 py-2 text-left">Nhóm hàng</th><th class="px-4 py-2 text-right">Số lượng</th><th class="px-4 py-2 text-right">Doanh thu</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        };
        
        const createQdcTableHtml = (title, colorClass, qdcGroups, employeeData, departmentAverages) => {
            let tableContent = '';
            qdcGroups.forEach((group) => {
                let groupHasData = false;
                const groupRows = group.items.map(itemKey => {
                    const empQdcData = employeeData.qdc[itemKey];
                    const avgQdcData = departmentAverages.qdc ? (departmentAverages.qdc[itemKey] || { dtqd: 0 }) : { dtqd: 0 };
                    const evaluation = getEvaluation(empQdcData.dtqd, avgQdcData.dtqd);
                    if (empQdcData.sl > 0) {
                        groupHasData = true;
                        return `<tr class="border-t"><td class="px-4 py-2 font-medium text-gray-700">${empQdcData.name}</td><td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(empQdcData.sl)}</td><td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(empQdcData.dt / 1000000, 2)}</td><td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(empQdcData.dtqd / 1000000, 2)}</td><td class="px-4 py-2 text-center font-semibold ${evaluation.class}">${evaluation.text}</td></tr>`;
                    }
                    return '';
                }).join('');
                if (groupHasData) tableContent += `<tr class="qdc-group-title ${group.colorClass}"><td colspan="5" class="px-4 py-2">${group.title}</td></tr>` + groupRows;
            });
            if (!tableContent) return '';
            return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><h4 class="text-lg font-bold p-3 border-b ${colorClass}">${title}</h4><table class="min-w-full text-sm table-bordered table-striped">
                    <thead class="sknv-subtable-header"><tr><th class="px-4 py-2 text-left">Nhóm hàng</th><th class="px-4 py-2 text-right">Số lượng</th><th class="px-4 py-2 text-right">DT Thực</th><th class="px-4 py-2 text-right">DT QĐ</th><th class="px-4 py-2 text-center">Đánh giá</th></tr></thead><tbody>${tableContent}</tbody></table></div>`;
        };
        
        let evaluationCounts = { above: 0, below: 0, total: 0 };
        const getEvaluation = (value, avgValue) => {
            const result = { text: '-', class: '' };
            if (!isFinite(value) || avgValue === undefined || !isFinite(avgValue) || avgValue === 0) return result;
            evaluationCounts.total++;
            if (value >= avgValue) { result.text = 'Trên TB'; result.class = 'text-green-600'; evaluationCounts.above++; } 
            else { result.text = 'Dưới TB'; result.class = 'cell-performance is-below text-red-600'; evaluationCounts.below++; }
            return result;
        };
        
        const { mucTieu } = employeeData;
        const doanhThuData = [
            { label: 'Doanh thu thực', value: ui.formatNumberOrDash(employeeData.doanhThu / 1000000, 2), average: ui.formatNumberOrDash((departmentAverages.doanhThu || 0) / 1000000, 2), rawValue: employeeData.doanhThu, rawAverage: departmentAverages.doanhThu },
            { label: 'Doanh thu quy đổi', value: ui.formatNumberOrDash(employeeData.doanhThuQuyDoi / 1000000, 2), average: ui.formatNumberOrDash((departmentAverages.doanhThuQuyDoi || 0) / 1000000, 2), rawValue: employeeData.doanhThuQuyDoi, rawAverage: departmentAverages.doanhThuQuyDoi },
            { label: '% Quy đổi', value: ui.formatPercentage(employeeData.hieuQuaQuyDoi), valueClass: employeeData.hieuQuaQuyDoi < (mucTieu.phanTramQD/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.hieuQuaQuyDoi), rawValue: employeeData.hieuQuaQuyDoi, rawAverage: departmentAverages.hieuQuaQuyDoi },
            { label: 'Doanh thu CE', value: ui.formatNumberOrDash(employeeData.dtCE / 1000000, 2), average: ui.formatNumberOrDash((departmentAverages.dtCE || 0) / 1000000, 2), rawValue: employeeData.dtCE, rawAverage: departmentAverages.dtCE },
            { label: 'Doanh thu ICT', value: ui.formatNumberOrDash(employeeData.dtICT / 1000000, 2), average: ui.formatNumberOrDash((departmentAverages.dtICT || 0) / 1000000, 2), rawValue: employeeData.dtICT, rawAverage: departmentAverages.dtICT },
            { label: 'Doanh thu trả chậm', value: ui.formatNumberOrDash(employeeData.doanhThuTraGop / 1000000, 2), average: ui.formatNumberOrDash((departmentAverages.doanhThuTraGop || 0) / 1000000, 2), rawValue: employeeData.doanhThuTraGop, rawAverage: departmentAverages.doanhThuTraGop },
            { label: '% Trả chậm', value: ui.formatPercentage(employeeData.tyLeTraCham), valueClass: employeeData.tyLeTraCham < (mucTieu.phanTramTC/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.tyLeTraCham), rawValue: employeeData.tyLeTraCham, rawAverage: departmentAverages.tyLeTraCham }
        ];
        const nangSuatData = [
            { label: 'Thưởng nóng', value: ui.formatNumberOrDash(employeeData.thuongNong / 1000000, 2), average: ui.formatNumberOrDash((departmentAverages.thuongNong || 0) / 1000000, 2), rawValue: employeeData.thuongNong, rawAverage: departmentAverages.thuongNong },
            { label: 'Thưởng ERP', value: ui.formatNumberOrDash(employeeData.thuongERP / 1000000, 2), average: ui.formatNumberOrDash((departmentAverages.thuongERP || 0) / 1000000, 2), rawValue: employeeData.thuongERP, rawAverage: departmentAverages.thuongERP },
            { label: 'Thu nhập lũy kế', value: ui.formatNumberOrDash(employeeData.tongThuNhap / 1000000, 2), average: ui.formatNumberOrDash((departmentAverages.tongThuNhap || 0) / 1000000, 2), rawValue: employeeData.tongThuNhap, rawAverage: departmentAverages.tongThuNhap },
            { label: 'Thu nhập dự kiến', value: ui.formatNumberOrDash(employeeData.thuNhapDuKien / 1000000, 2), average: ui.formatNumberOrDash((departmentAverages.thuNhapDuKien || 0) / 1000000, 2), rawValue: employeeData.thuNhapDuKien, rawAverage: departmentAverages.thuNhapDuKien },
            { label: 'Giờ công', value: ui.formatNumberOrDash(employeeData.gioCong, 1), average: ui.formatNumberOrDash(departmentAverages.gioCong, 1), rawValue: employeeData.gioCong, rawAverage: departmentAverages.gioCong },
            { label: 'Thu nhập/GC', value: ui.formatNumberOrDash(employeeData.gioCong > 0 ? employeeData.tongThuNhap / employeeData.gioCong : 0, 0), average: ui.formatNumberOrDash((departmentAverages.gioCong || 0) > 0 ? (departmentAverages.tongThuNhap || 0) / departmentAverages.gioCong : 0, 0), rawValue: employeeData.gioCong > 0 ? employeeData.tongThuNhap / employeeData.gioCong : 0, rawAverage: (departmentAverages.gioCong || 0) > 0 ? (departmentAverages.tongThuNhap || 0) / departmentAverages.gioCong : 0 },
            { label: 'Doanh thu QĐ/GC', value: ui.formatNumberOrDash(employeeData.gioCong > 0 ? employeeData.doanhThuQuyDoi / employeeData.gioCong : 0, 0), average: ui.formatNumberOrDash((departmentAverages.gioCong || 0) > 0 ? (departmentAverages.doanhThuQuyDoi || 0) / departmentAverages.gioCong : 0, 0), rawValue: employeeData.gioCong > 0 ? employeeData.doanhThuQuyDoi / employeeData.gioCong : 0, rawAverage: (departmentAverages.gioCong || 0) > 0 ? (departmentAverages.doanhThuQuyDoi || 0) / departmentAverages.gioCong : 0 }
        ];
        const hieuQuaData = [
            { label: '% PK', value: ui.formatPercentage(employeeData.pctPhuKien), valueClass: employeeData.pctPhuKien < (mucTieu.phanTramPhuKien/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.pctPhuKien), rawValue: employeeData.pctPhuKien, rawAverage: departmentAverages.pctPhuKien },
            { label: '% Gia dụng', value: ui.formatPercentage(employeeData.pctGiaDung), valueClass: employeeData.pctGiaDung < (mucTieu.phanTramGiaDung/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.pctGiaDung), rawValue: employeeData.pctGiaDung, rawAverage: departmentAverages.pctGiaDung },
            { label: '% MLN', value: ui.formatPercentage(employeeData.pctMLN), valueClass: employeeData.pctMLN < (mucTieu.phanTramMLN/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.pctMLN), rawValue: employeeData.pctMLN, rawAverage: departmentAverages.pctMLN },
            { label: '% Sim', value: ui.formatPercentage(employeeData.pctSim), valueClass: employeeData.pctSim < (mucTieu.phanTramSim/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.pctSim), rawValue: employeeData.pctSim, rawAverage: departmentAverages.pctSim },
            { label: '% VAS', value: ui.formatPercentage(employeeData.pctVAS), valueClass: employeeData.pctVAS < (mucTieu.phanTramVAS/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.pctVAS), rawValue: employeeData.pctVAS, rawAverage: departmentAverages.pctVAS },
            { label: '% Bảo hiểm', value: ui.formatPercentage(employeeData.pctBaoHiem), valueClass: employeeData.pctBaoHiem < (mucTieu.phanTramBaoHiem/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.pctBaoHiem), rawValue: employeeData.pctBaoHiem, rawAverage: departmentAverages.pctBaoHiem },
        ];

        const qdcTableGroups = [
            { title: 'Nhóm ICT', items: ['PIN_SDP', 'TAI_NGHE_BLT', 'DONG_HO', 'CAMERA', 'LOA'], colorClass: 'qdc-group-ict' },
            { title: 'VAS', items: ['UDDD', 'BAO_HIEM'], colorClass: 'qdc-group-vas' },
            { title: 'Gia dụng', items: ['NOI_COM', 'NOI_CHIEN', 'MAY_LOC_NUOC', 'ROBOT_HB'], colorClass: 'qdc-group-giadung' },
            { title: 'SIM', items: ['SIM_ONLINE'], colorClass: 'qdc-group-sim' }
        ];
        
        const doanhthuHtml = createDetailTableHtml('Doanh thu', 'header-bg-blue', doanhThuData);
        const nangsuatHtml = createDetailTableHtml('Năng suất', 'header-bg-green', nangSuatData);
        const hieuquaHtml = createDetailTableHtml('Hiệu quả khai thác', 'header-bg-yellow', hieuQuaData);
        const qdcHtml = createQdcTableHtml('Nhóm hàng quy đổi cao', 'header-bg-teal', qdcTableGroups, employeeData, departmentAverages);
        const dtctHtml = createDoanhThuChiTietTableHtml('Doanh thu chi tiết', 'header-bg-red', employeeData.doanhThuTheoNganhHang);

        const titleHtml = `CHI TIẾT - ${employeeData.hoTen} <span class="font-normal text-sm">(Trên TB: <span class="font-bold text-green-300">${evaluationCounts.above}</span>, Dưới TB: <span class="font-bold text-yellow-300">${evaluationCounts.below}</span> / Tổng: ${evaluationCounts.total})</span>`;

        detailsContainer.innerHTML = `<div class="p-4 mb-6 bg-blue-600 text-white rounded-lg shadow-lg border border-blue-700"><h3 class="text-2xl font-bold text-center uppercase">${titleHtml}</h3></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-6">
                    ${doanhthuHtml}
                    ${dtctHtml}
                </div>
                <div class="space-y-6">
                    ${nangsuatHtml}
                    ${hieuquaHtml}
                    ${qdcHtml}
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
                qdc: { above: 0, below: 0, total: 0 }
            };

            const check = (value, avg) => (value >= avg ? 'above' : 'below');

            counts.doanhthu[check(employee.doanhThu, departmentAverages.doanhThu)]++;
            counts.doanhthu[check(employee.doanhThuQuyDoi, departmentAverages.doanhThuQuyDoi)]++;
            counts.doanhthu[check(employee.hieuQuaQuyDoi, departmentAverages.hieuQuaQuyDoi)]++;
            counts.doanhthu[check(employee.dtCE, departmentAverages.dtCE)]++;
            counts.doanhthu[check(employee.dtICT, departmentAverages.dtICT)]++;
            counts.doanhthu[check(employee.doanhThuTraGop, departmentAverages.doanhThuTraGop)]++;
            counts.doanhthu[check(employee.tyLeTraCham, departmentAverages.tyLeTraCham)]++;

            counts.nangsuat[check(employee.thuongNong, departmentAverages.thuongNong)]++;
            counts.nangsuat[check(employee.thuongERP, departmentAverages.thuongERP)]++;
            counts.nangsuat[check(employee.tongThuNhap, departmentAverages.tongThuNhap)]++;
            counts.nangsuat[check(employee.thuNhapDuKien, departmentAverages.thuNhapDuKien)]++;
            counts.nangsuat[check(employee.gioCong, departmentAverages.gioCong)]++;
            counts.nangsuat[check(employee.gioCong > 0 ? employee.tongThuNhap / employee.gioCong : 0, departmentAverages.gioCong > 0 ? departmentAverages.tongThuNhap / departmentAverages.gioCong : 0)]++;
            counts.nangsuat[check(employee.gioCong > 0 ? employee.doanhThuQuyDoi / employee.gioCong : 0, departmentAverages.gioCong > 0 ? departmentAverages.doanhThuQuyDoi / departmentAverages.gioCong : 0)]++;
            
            counts.hieuqua[check(employee.pctPhuKien, departmentAverages.pctPhuKien)]++;
            counts.hieuqua[check(employee.pctGiaDung, departmentAverages.pctGiaDung)]++;
            counts.hieuqua[check(employee.pctMLN, departmentAverages.pctMLN)]++;
            counts.hieuqua[check(employee.pctSim, departmentAverages.pctSim)]++;
            counts.hieuqua[check(employee.pctVAS, departmentAverages.pctVAS)]++;
            counts.hieuqua[check(employee.pctBaoHiem, departmentAverages.pctBaoHiem)]++;

            for (const key in employee.qdc) {
                if (employee.qdc[key].sl > 0) {
                    counts.qdc.total++;
                    const avgQdc = departmentAverages.qdc ? (departmentAverages.qdc[key] || { dtqd: 0 }) : { dtqd: 0 };
                    counts.qdc[check(employee.qdc[key].dtqd, avgQdc.dtqd)]++;
                }
            }
            
            const totalAbove = counts.doanhthu.above + counts.nangsuat.above + counts.hieuqua.above + counts.qdc.above;
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
                    <th colspan="2">Nhóm QĐC</th>
                </tr>
                <tr>
                    <th class="${headerClass('doanhthuAbove')}" data-sort="doanhthuAbove">Trên TB</th><th class="${headerClass('doanhthuBelow')}" data-sort="doanhthuBelow">Dưới TB</th>
                    <th class="${headerClass('nangsuatAbove')}" data-sort="nangsuatAbove">Trên TB</th><th class="${headerClass('nangsuatBelow')}" data-sort="nangsuatBelow">Dưới TB</th>
                    <th class="${headerClass('hieuquaAbove')}" data-sort="hieuquaAbove">Trên TB</th><th class="${headerClass('hieuquaBelow')}" data-sort="hieuquaBelow">Dưới TB</th>
                    <th class="${headerClass('qdcAbove')}" data-sort="qdcAbove">Trên TB</th><th class="${headerClass('qdcBelow')}" data-sort="qdcBelow">Dưới TB</th>
                </tr>
            </thead><tbody>`;
        
        const groupedByDept = {};
        summaryData.forEach(item => {
            if (!groupedByDept[item.boPhan]) groupedByDept[item.boPhan] = [];
            groupedByDept[item.boPhan].push(item);
        });

        config.DEPARTMENT_GROUPS.forEach(deptName => {
            if (groupedByDept[deptName]) {
                tableHTML += `<tr class="font-bold bg-slate-100"><td colspan="11" class="px-4 py-2">${deptName}</td></tr>`;
                groupedByDept[deptName].forEach(item => {
                    tableHTML += `<tr class="hover:bg-gray-50">
                        <td class="px-2 py-2 font-semibold">${item.hoTen}</td>
                        <td class="px-2 py-2 text-center font-bold text-lg text-blue-600">${item.totalAbove}</td>
                        <td class="px-2 py-2 text-center text-green-600 font-semibold">${item.summary.doanhthu.above}/${item.summary.doanhthu.total}</td><td class="px-2 py-2 text-center text-red-600">${item.summary.doanhthu.below}/${item.summary.doanhthu.total}</td>
                        <td class="px-2 py-2 text-center text-green-600 font-semibold">${item.summary.nangsuat.above}/${item.summary.nangsuat.total}</td><td class="px-2 py-2 text-center text-red-600">${item.summary.nangsuat.below}/${item.summary.nangsuat.total}</td>
                        <td class="px-2 py-2 text-center text-green-600 font-semibold">${item.summary.hieuqua.above}/${item.summary.hieuqua.total}</td><td class="px-2 py-2 text-center text-red-600">${item.summary.hieuqua.below}/${item.summary.hieuqua.total}</td>
                        <td class="px-2 py-2 text-center text-green-600 font-semibold">${item.summary.qdc.above}/${item.summary.qdc.total}</td><td class="px-2 py-2 text-center text-red-600">${item.summary.qdc.below}/${item.summary.qdc.total}</td>
                    </tr>`;
                });
            }
        });

        tableHTML += `</tbody></table></div></div>`;
        container.innerHTML = tableHTML;
    },
    
    renderRealtimeKpiCards: (data, goals) => {
        const targetDTThuc = (parseFloat(goals.doanhThuThuc) || 0) * 1000000;
        const targetDTQD = (parseFloat(goals.doanhThuQD) || 0) * 1000000;
        const targetPTQD = (parseFloat(goals.phanTramQD) || 0) / 100;
    
        const thucHienDTThuc = data.doanhThu;
        const thucHienDTQD = data.doanhThuQuyDoi;
        const phanTramThucHienThuc = targetDTThuc > 0 ? thucHienDTThuc / targetDTThuc : 0;
        const phanTramThucHienQD = targetDTQD > 0 ? thucHienDTQD / targetDTQD : 0;
        const phanTramQD = thucHienDTThuc > 0 ? (thucHienDTQD / thucHienDTThuc) - 1 : 0;
        const phanTramTC = thucHienDTThuc > 0 ? data.doanhThuTraGop / thucHienDTThuc : 0;
    
        document.getElementById('rt-kpi-dt-thuc-main').textContent = ui.formatNumberOrDash(thucHienDTThuc / 1000000, 2);
        document.getElementById('rt-kpi-dt-thuc-sub1').textContent = `% HT: ${ui.formatPercentage(phanTramThucHienThuc)} / Target: ${ui.formatNumberOrDash(targetDTThuc / 1000000, 2)}`;
        document.getElementById('rt-kpi-dt-thuc-sub2').textContent = `DT Giao xa: ${ui.formatNumberOrDash(data.doanhThuGiaoXa / 1000000, 2)}`;
    
        document.getElementById('rt-kpi-dt-qd-main').textContent = ui.formatNumberOrDash(thucHienDTQD / 1000000, 2);
        document.getElementById('rt-kpi-dt-qd-sub1').textContent = `% HT: ${ui.formatPercentage(phanTramThucHienQD)} / Target: ${ui.formatNumberOrDash(targetDTQD / 1000000, 2)}`;
        document.getElementById('rt-kpi-dt-qd-sub2').textContent = `DT Giao xa: ${ui.formatNumberOrDash(data.doanhThuQuyDoiGiaoXa / 1000000, 2)}`;
        
        document.getElementById('rt-kpi-tl-qd-main').textContent = ui.formatPercentage(phanTramQD);
        document.getElementById('rt-kpi-tl-qd-sub').textContent = `Mục tiêu: ${ui.formatPercentage(targetPTQD)}`;
    
        document.getElementById('rt-kpi-dt-tc-main').textContent = ui.formatNumberOrDash(data.doanhThuTraGop / 1000000, 2);
        document.getElementById('rt-kpi-dt-tc-sub').textContent = `% thực trả chậm: ${ui.formatPercentage(phanTramTC)}`;
    },

    renderLuykeCharts: (completionPercent, timeProgress, categoryData = { dtICT: 0, dtCE: 0 }) => {
        if (!document.getElementById('luyke-completion-chart')) return;
        const completionTextEl = document.getElementById('luyke-completion-chart-text').firstElementChild;
        const timeProgressTextEl = document.getElementById('luyke-completion-chart-text').lastElementChild;
        completionTextEl.textContent = ui.formatPercentage(completionPercent);
        timeProgressTextEl.textContent = `Tiến độ TG: ${ui.formatPercentage(timeProgress)}`;

        if (appState.charts.luyke_completion) appState.charts.luyke_completion.destroy();
        const ctxCompletion = document.getElementById('luyke-completion-chart').getContext('2d');
        appState.charts.luyke_completion = new Chart(ctxCompletion, {
            type: 'doughnut',
            data: { labels: ['Hoàn thành', 'Còn lại'], datasets: [{ data: [completionPercent * 100, (1 - completionPercent) > 0 ? (1 - completionPercent) * 100 : 0], backgroundColor: ['#10B981', '#E5E7EB'], borderColor: '#ffffff', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 0 } }
        });

        const totalRevenue = categoryData.dtICT + categoryData.dtCE;
        if (appState.charts.luyke_categoryMix) appState.charts.luyke_categoryMix.destroy();
        const ctxCategory = document.getElementById('luyke-category-mix-chart').getContext('2d');
        appState.charts.luyke_categoryMix = new Chart(ctxCategory, {
            type: 'doughnut',
            data: { labels: ['ICT', 'CE'], datasets: [{ data: [categoryData.dtICT, categoryData.dtCE], backgroundColor: ['#3B82F6', '#F59E0B'], borderColor: '#ffffff', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => `${c.label}: ${ui.formatNumberOrDash(c.parsed/1000000,2)} tr (${totalRevenue > 0 ? (c.parsed/totalRevenue*100).toFixed(1) : 0}%)` } }, datalabels: { formatter: (v, c) => { let s = c.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); return s === 0 ? '0%' : (v * 100 / s).toFixed(1) + "%"; }, color: '#fff' } }, animation: { duration: 0 } },
            plugins: [ChartDataLabels]
        });
    },

    renderLuykeCategoryDetailsTable: (data, numDays) => {
        const container = document.getElementById('luyke-category-details-content');
        const titleContainer = document.getElementById('luyke-category-details-title');
        if (!container || !titleContainer) return;

        titleContainer.className = 'text-xl font-bold text-gray-700 mb-4 uppercase header-bg-green p-2 rounded-md';
        if (data.maKho) titleContainer.textContent = `NGÀNH HÀNG LŨY KẾ - ${data.maKho}`;
        else titleContainer.textContent = `NGÀNH HÀNG LŨY KẾ`;

        const categoryArray = Object.entries(data.nganhHangChiTiet).map(([name, values]) => ({ name, ...values })).sort((a, b) => b.revenue - a.revenue).slice(0, 15);
        if (categoryArray.length === 0) {
            container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu ngành hàng chi tiết.</p>`; return;
        }
        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="luyke_nganhhang">
                    <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                        <tr>
                            <th class="px-4 py-2 sortable" data-sort="name">Ngành hàng <span class="sort-indicator"></span></th>
                            <th class="px-4 py-2 text-right sortable" data-sort="quantity">Số lượng <span class="sort-indicator"></span></th>
                            <th class="px-4 py-2 text-right sortable" data-sort="revenue">DT Thực <span class="sort-indicator"></span></th>
                            <th class="px-4 py-2 text-right header-highlight-special">TB SL/Ngày</th>
                            <th class="px-4 py-2 text-right header-highlight-special">TB DT/Ngày</th>
                        </tr>
                    </thead><tbody>${categoryArray.map(cat => `
                            <tr class="hover:bg-gray-50"><td class="px-4 py-2 font-semibold">${cat.name}</td>
                                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(cat.quantity)}</td>
                                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(cat.revenue / 1000000, 2)}</td>
                                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(numDays > 0 ? cat.quantity / numDays : 0, 1)}</td>
                                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(numDays > 0 ? (cat.revenue / numDays) / 1000000 : 0, 2)}</td>
                            </tr>`).join('')}</tbody></table></div>`;
    },

    renderLuykeQdcTable: (data, numDays) => {
        const container = document.getElementById('luyke-qdc-content');
        const titleContainer = document.getElementById('luyke-qdc-title');
        if(!container || !titleContainer || !data.qdc || Object.keys(data.qdc).length === 0) {
            if (container) container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return;
        }
        titleContainer.className = 'text-xl font-bold text-gray-700 mb-4 uppercase header-bg-teal p-2 rounded-md';
         if (data.maKho) titleContainer.textContent = `NHÓM HÀNG QUY ĐỔI CAO - ${data.maKho}`;
        else titleContainer.textContent = `NHÓM HÀNG QUY ĐỔI CAO`;

        let tableContent = '';
        const qdcTableGroups = [
            { title: 'Nhóm ICT', items: ['PIN_SDP', 'TAI_NGHE_BLT', 'DONG_HO', 'CAMERA', 'LOA'], colorClass: 'qdc-group-ict' },
            { title: 'VAS', items: ['UDDD', 'BAO_HIEM'], colorClass: 'qdc-group-vas' },
            { title: 'Gia dụng', items: ['NOI_COM', 'NOI_CHIEN', 'MAY_LOC_NUOC', 'ROBOT_HB'], colorClass: 'qdc-group-giadung' },
            { title: 'SIM', items: ['SIM_ONLINE'], colorClass: 'qdc-group-sim' }
        ];
        
        qdcTableGroups.forEach((group) => {
            const groupRows = group.items.map(itemKey => {
                const itemData = data.qdc[itemKey];
                if (itemData && itemData.sl > 0) return `<tr class="border-t"><td class="px-4 py-2 font-medium text-gray-700">${itemData.name}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(itemData.sl)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(itemData.dtqd / 1000000, 2)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(numDays > 0 ? itemData.sl / numDays : 0, 1)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(numDays > 0 ? (itemData.dtqd / numDays) / 1000000 : 0, 2)}</td></tr>`;
                return '';
            }).join('');
            if (groupRows) tableContent += `<tr class="qdc-group-title ${group.colorClass}"><td colspan="5" class="px-4 py-2">${group.title}</td></tr>` + groupRows;
        });

        if (!tableContent) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return; }

        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="luyke_qdc">
            <thead class="sknv-subtable-header text-xs text-slate-800 uppercase bg-slate-200 font-bold"><tr>
                <th class="px-4 py-2 text-left">Nhóm hàng</th><th class="px-4 py-2 text-right">Số lượng</th>
                <th class="px-4 py-2 text-right">DT QĐ</th><th class="px-4 py-2 text-right header-highlight-special">TB SL/Ngày</th>
                <th class="px-4 py-2 text-right header-highlight-special">TB DTQĐ/Ngày</th></tr></thead>
            <tbody>${tableContent}</tbody></table></div>`;
    },

    renderLuykeEfficiencyTable: (data, goals) => {
        const container = document.getElementById('luyke-efficiency-content');
        const titleContainer = document.getElementById('luyke-efficiency-title');
        if(!container || !titleContainer) return;
         if (data.maKho) {
            titleContainer.textContent = `HIỆU QUẢ KHAI THÁC LŨY KẾ - ${data.maKho}`;
        } else {
            titleContainer.textContent = `HIỆU QUẢ KHAI THÁC LŨY KẾ`;
        }

        const rows = [
            { label: '% Gia dụng', thucHien: data.pctGiaDung, mucTieu: (goals.phanTramGiaDung || 0) / 100 },
            { label: '% MLN', thucHien: data.pctMLN, mucTieu: (goals.phanTramMLN || 0) / 100 },
            { label: '% Phụ kiện', thucHien: data.pctPhuKien, mucTieu: (goals.phanTramPhuKien || 0) / 100 },
            { label: '% Bảo hiểm', thucHien: data.pctBaoHiem, mucTieu: (goals.phanTramBaoHiem || 0) / 100 },
            { label: '% Sim', thucHien: data.pctSim, mucTieu: (goals.phanTramSim || 0) / 100 },
            { label: '% VAS', thucHien: data.pctVAS, mucTieu: (goals.phanTramVAS || 0) / 100 },
        ];
        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped">
                    <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                        <tr><th class="px-4 py-2">Tiêu chí</th><th class="px-4 py-2 text-right">Thực hiện</th><th class="px-4 py-2 text-right">Mục tiêu</th></tr></thead><tbody>${rows.map(row => 
                            `<tr class="hover:bg-gray-50"><td class="px-4 py-2 font-semibold">${row.label}</td>
                            <td class="px-4 py-2 text-right font-bold ${row.mucTieu > 0 && row.thucHien < row.mucTieu ? 'cell-performance is-below' : ''}">${ui.formatPercentage(row.thucHien)}</td>
                            <td class="px-4 py-2 text-right font-bold">${ui.formatPercentage(row.mucTieu)}</td></tr>`).join('')}</tbody></table></div>`;
    },
    
    renderRealtimeCategoryDetailsTable: (data) => {
        const container = document.getElementById('realtime-category-details-content');
        const categoryArray = Object.entries(data.nganhHangChiTiet).map(([name, values]) => ({ name, ...values })).sort((a, b) => b.revenue - a.revenue).slice(0, 15);
        if (categoryArray.length === 0) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu ngành hàng chi tiết.</p>`; return; }
        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="realtime_nganhhang">
                    <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                        <tr>
                            <th class="px-4 py-2 sortable" data-sort="name">Ngành hàng <span class="sort-indicator"></span></th>
                            <th class="px-4 py-2 text-right sortable" data-sort="quantity">Số lượng <span class="sort-indicator"></span></th>
                            <th class="px-4 py-2 text-right sortable" data-sort="revenue">DT Thực <span class="sort-indicator"></span></th>
                            <th class="px-4 py-2 text-right sortable" data-sort="revenueQuyDoi">DT QĐ <span class="sort-indicator"></span></th>
                            <th class="px-4 py-2 text-right sortable" data-sort="donGia">Đơn giá <span class="sort-indicator"></span></th>
                        </tr>
                    </thead><tbody>${categoryArray.map(cat => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-4 py-2 font-semibold">${cat.name}</td>
                                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(cat.quantity)}</td>
                                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(cat.revenue / 1000000, 2)}</td>
                                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(cat.revenueQuyDoi / 1000000, 2)}</td>
                                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(cat.donGia / 1000000, 2)}</td></tr>`).join('')}</tbody></table></div>`;
    },

    renderRealtimeEfficiencyTable: (data, goals) => {
        const container = document.getElementById('realtime-efficiency-content');
        const rows = [
            { label: '% Gia dụng', thucHien: data.pctGiaDung, mucTieu: (goals.phanTramGiaDung || 0) / 100 },
            { label: '% MLN', thucHien: data.pctMLN, mucTieu: (goals.phanTramMLN || 0) / 100 },
            { label: '% Phụ kiện', thucHien: data.pctPhuKien, mucTieu: (goals.phanTramPhuKien || 0) / 100 },
            { label: '% Sim', thucHien: data.pctSim, mucTieu: (goals.phanTramSim || 0) / 100 },
            { label: '% VAS', thucHien: data.pctVAS, mucTieu: (goals.phanTramVAS || 0) / 100 },
            { label: '% Bảo hiểm', thucHien: data.pctBaoHiem, mucTieu: (goals.phanTramBaoHiem || 0) / 100 },
        ];
        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped">
                    <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                        <tr><th class="px-4 py-2">Tiêu chí</th><th class="px-4 py-2 text-right">Thực hiện</th><th class="px-4 py-2 text-right">Mục tiêu</th></tr></thead><tbody>${rows.map(row => 
                            `<tr class="hover:bg-gray-50"><td class="px-4 py-2 font-semibold">${row.label}</td>
                            <td class="px-4 py-2 text-right font-bold ${row.thucHien < row.mucTieu ? 'cell-performance is-below' : ''}">${ui.formatPercentage(row.thucHien)}</td>
                            <td class="px-4 py-2 text-right font-bold">${ui.formatPercentage(row.mucTieu)}</td></tr>`).join('')}</tbody></table></div>`;
    },
    
    renderRealtimeQdcTable: (data) => {
        const container = document.getElementById('realtime-qdc-content');
        if(!container) return;
        
        let tableContent = '';
        const qdcTableGroups = [
            { title: 'Nhóm ICT', items: ['PIN_SDP', 'TAI_NGHE_BLT', 'DONG_HO', 'CAMERA', 'LOA'], colorClass: 'qdc-group-ict' },
            { title: 'VAS', items: ['UDDD', 'BAO_HIEM'], colorClass: 'qdc-group-vas' },
            { title: 'Gia dụng', items: ['NOI_COM', 'NOI_CHIEN', 'MAY_LOC_NUOC', 'ROBOT_HB'], colorClass: 'qdc-group-giadung' },
            { title: 'SIM', items: ['SIM_ONLINE'], colorClass: 'qdc-group-sim' }
        ];
        
        qdcTableGroups.forEach((group) => {
            let groupHasData = false;
            const groupRows = group.items.map(itemKey => {
                const itemData = data.qdc ? data.qdc[itemKey] : null;
                const sl = itemData?.sl || 0;
                const dtqd = itemData?.dtqd || 0;
                const name = config.PRODUCT_GROUPS.QDC_GROUPS[itemKey].name;
                if(sl > 0) groupHasData = true;
                return `<tr class="border-t"><td class="px-4 py-2 font-medium text-gray-700">${name}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(sl)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(dtqd / 1000000, 2)}</td></tr>`;
            }).join('');
            if (groupHasData) tableContent += `<tr class="qdc-group-title ${group.colorClass}"><td colspan="3" class="px-4 py-2">${group.title}</td></tr>` + groupRows;
        });

        if (!tableContent) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return; }

        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="realtime_qdc">
            <thead class="sknv-subtable-header text-xs text-slate-800 uppercase bg-slate-200 font-bold"><tr>
                <th class="px-4 py-2 text-left">Nhóm hàng</th><th class="px-4 py-2 text-right">Số lượng</th>
                <th class="px-4 py-2 text-right">DT QĐ</th></tr></thead>
            <tbody>${tableContent}</tbody></table></div>`;
    },
};

export { ui };