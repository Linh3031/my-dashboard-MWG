// Version 9.8 - SKNV Capture & Logic Hotfix
// MODULE 4: KỆ "GIAO DIỆN" (UI)
// File này chứa tất cả các hàm chịu trách nhiệm cập nhật và hiển thị dữ liệu ra màn hình.

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
    
    togglePlaceholder: (sectionId, show) => {
        const placeholder = document.getElementById(`${sectionId}-placeholder`);
        const content = document.getElementById(`${sectionId}-content`);
        if (placeholder && content) {
            placeholder.classList.toggle('hidden', !show);
            content.classList.toggle('hidden', show);
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

    applyInterfaceSettings(settings) {
        const root = document.documentElement;
        if (settings.kpiCard1Bg) root.style.setProperty('--kpi-card-1-bg', settings.kpiCard1Bg);
        if (settings.kpiCard2Bg) root.style.setProperty('--kpi-card-2-bg', settings.kpiCard2Bg);
        if (settings.kpiCard3Bg) root.style.setProperty('--kpi-card-3-bg', settings.kpiCard3Bg);
        if (settings.kpiCard4Bg) root.style.setProperty('--kpi-card-4-bg', settings.kpiCard4Bg);
        if (settings.kpiCard5Bg) root.style.setProperty('--kpi-card-5-bg', settings.kpiCard5Bg);
        if (settings.kpiCard6Bg) root.style.setProperty('--kpi-card-6-bg', settings.kpiCard6Bg);
        if (settings.kpiTextColor) root.style.setProperty('--kpi-text-color', settings.kpiTextColor);
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
    
    displayHealthKpiTable: (pastedData, goals, updateDailyGoalCallback) => {
        updateDailyGoalCallback();
    
        const { mainKpis, comparisonData } = pastedData;
    
        if (!mainKpis || Object.keys(mainKpis).length === 0) {
            ui.renderLuykeKpiCards({}, {}, appState.masterReportData.luyke || [], goals);
            return;
        }
        
        const cleanValue = (str) => (typeof str === 'string' ? parseFloat(str.replace(/,|%/g, '')) : (typeof str === 'number' ? str : 0));
        
        const dtThucLK = cleanValue(mainKpis['Thực hiện DT thực']) * 1000000;
        const dtQdLK = cleanValue(mainKpis['Thực hiện DTQĐ']) * 1000000;
        const phanTramGopRaw = cleanValue(mainKpis['Tỷ Trọng Trả Góp']);
        const dtGop = dtThucLK * (phanTramGopRaw / 100);

        const phanTramQd = dtThucLK > 0 ? (dtQdLK / dtThucLK) - 1 : 0;
        const phanTramGop = dtThucLK > 0 ? dtGop / dtThucLK : 0;

        const targetThuc = (parseFloat(goals.doanhThuThuc) || 0);
        const phanTramTargetThuc = targetThuc > 0 ? (dtThucLK / 1000000) / targetThuc : 0;
        
        const phanTramTargetQd = (cleanValue(mainKpis['% HT Target Dự Kiến (QĐ)']) || 0) / 100;

        const luykeCardData = {
            dtThucLK, dtQdLK, dtGop, phanTramQd, phanTramGop,
            phanTramTargetThuc, phanTramTargetQd
        };
        
        ui.renderLuykeKpiCards(luykeCardData, comparisonData, appState.masterReportData.luyke || [], goals);
    },

    displayCompetitionResultsFromLuyKe: (text) => {
        const container = document.getElementById('luyke-competition-content');
        if (!container) return;

        if (!text || !text.trim()) {
            container.innerHTML = '<p class="text-gray-500 font-bold col-span-2">Vui lòng dán "Data lũy kế" ở tab Data để xem chi tiết.</p>';
            return;
        }

        appState.competitionData = services.parseCompetitionDataFromLuyKe(text);
        const data = appState.competitionData;
        if(data.length === 0) {
             container.innerHTML = '<p class="text-yellow-600 font-bold col-span-2">Không tìm thấy dữ liệu thi đua trong văn bản đã dán.</p>';
            return;
        }
        
        const dataDoanhThu = data.filter(d => d.type === 'doanhThu');
        const dataSoLuong = data.filter(d => d.type === 'soLuong');
        
        const summary = {
            total: data.length,
            dat: data.filter(d => parseFloat(String(d.hoanThanh).replace('%','')) >= 100).length,
        };
        summary.chuaDat = summary.total - summary.dat;
        
        const summaryEl = document.getElementById('luyke-competition-summary');
        if (summaryEl) summaryEl.textContent = `(Tổng: ${summary.total}, Đạt: ${summary.dat}, Chưa đạt: ${summary.chuaDat})`;

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
                        const hoanThanhValue = parseFloat(String(item.hoanThanh).replace('%', '')) || 0;
                        const rowClass = hoanThanhValue < 100 ? 'competition-row-below-100' : 'hover:bg-purple-50';
                        const formattedHoanThanh = ui.formatPercentage(hoanThanhValue / 100);

                        return `<tr class="${rowClass}">
                            <td class="px-2 py-2 font-semibold line-clamp-2">${item.name}</td>
                            <td class="px-2 py-2 text-right font-bold">${ui.formatNumberOrDash(item.luyKe)}</td>
                            <td class="px-2 py-2 text-right font-bold">${ui.formatNumberOrDash(item.target)}</td>
                            <td class="px-2 py-2 text-right font-bold text-blue-600">${formattedHoanThanh}</td>
                            <td class="px-2 py-2 text-right font-bold text-orange-600">${ui.formatNumberOrDash(dailyTarget)}</td>
                        </tr>`
                    }).join('')}</tbody></table></div></div>`;
        };

        container.innerHTML = `
            ${renderTable('Thi đua Doanh thu', dataDoanhThu, 'doanhthu')}
            ${renderTable('Thi đua Số lượng', dataSoLuong, 'soluong')}`;
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

        let titleClass = '';
        if (title.includes('Tư Vấn')) titleClass = 'department-header-tv';
        else if (title.includes('Kho')) titleClass = 'department-header-kho';
        else if (title.includes('Trang Trí')) titleClass = 'department-header-tt';

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        let tableHTML = `<div class="department-block"><h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${title}</h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}" data-capture-columns="7">
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
                    <td class="px-4 py-2 font-semibold line-clamp-2">${item.hoTen}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.doanhThu / 1000000)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.doanhThuQuyDoi / 1000000)}</td>
                    <td class="px-4 py-2 text-right font-bold ${qdClass}">${ui.formatPercentage(item.hieuQuaQuyDoi)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.doanhThuTraGop / 1000000)}</td>
                    <td class="px-4 py-2 text-right font-bold ${tcClass}">${ui.formatPercentage(item.tyLeTraCham)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.doanhThuChuaXuat / 1000000)}</td></tr>`;
        });
         tableHTML += `</tbody><tfoot class="table-footer font-bold"><tr>
                    <td class="px-4 py-2">Tổng</td>
                    <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.doanhThu / 1000000)}</td>
                    <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.doanhThuQuyDoi / 1000000)}</td>
                    <td class="px-4 py-2 text-right">${ui.formatPercentage(totals.hieuQuaQuyDoi)}</td>
                    <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.doanhThuTraGop / 1000000)}</td>
                    <td class="px-4 py-2 text-right">${ui.formatPercentage(totals.tyLeTraCham)}</td>
                    <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.doanhThuChuaXuat / 1000000)}</td>
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
        let titleClass = '';
        if (title.includes('Tư Vấn')) titleClass = 'department-header-tv';
        else if (title.includes('Kho')) titleClass = 'department-header-kho';
        else if (title.includes('Trang Trí')) titleClass = 'department-header-tt';

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        let tableHTML = `<div class="department-block"><h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${title} <span class="text-sm font-normal text-gray-500">(Thu nhập DK TB: ${ui.formatNumberOrDash(averageProjectedIncome / 1000000)})</span></h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="thunhap" data-capture-columns="6">
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
                    <td class="px-4 py-2 font-semibold line-clamp-2">${nv.hoTen}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(nv.gioCong)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(nv.thuongNong / 1000000)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(nv.thuongERP / 1000000)}</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-600">${ui.formatNumberOrDash(nv.tongThuNhap / 1000000)}</td>
                    <td class="px-4 py-2 text-right font-bold text-green-600 ${incomeDkCellClass}">${ui.formatNumberOrDash(nv.thuNhapDuKien / 1000000)}</td></tr>`;
        });
        tableHTML += `</tbody><tfoot class="table-footer font-bold">
            <tr>
                <td class="px-4 py-2">Tổng</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(totals.gioCong)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(totals.thuongNong / 1000000)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(totals.thuongERP / 1000000)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(totals.tongThuNhap / 1000000)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(totals.thuNhapDuKien / 1000000)}</td>
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
        
        let titleClass = '';
        if (title.includes('Tư Vấn')) titleClass = 'department-header-tv';
        else if (title.includes('Kho')) titleClass = 'department-header-kho';
        else if (title.includes('Trang Trí')) titleClass = 'department-header-tt';

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        let tableHTML = `<div class="department-block"><h4 class="text-lg font-bold p-4 border-b border-gray-200 ${titleClass}">${title}</h4><div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}" data-capture-columns="11">
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
                <td class="px-4 py-2 font-semibold line-clamp-2">${item.hoTen}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.dtICT / 1000000)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.dtPhuKien / 1000000)}</td>
                <td class="px-4 py-2 text-right font-bold ${pkClass}">${ui.formatPercentage(item.pctPhuKien)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.dtCE / 1000000)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.dtGiaDung / 1000000)}</td>
                <td class="px-4 py-2 text-right font-bold ${gdClass}">${ui.formatPercentage(item.pctGiaDung)}</td>
                <td class="px-4 py-2 text-right font-bold ${mlnClass}">${ui.formatPercentage(item.pctMLN)}</td>
                <td class="px-4 py-2 text-right font-bold ${simClass}">${ui.formatPercentage(item.pctSim)}</td>
                <td class="px-4 py-2 text-right font-bold ${vasClass}">${ui.formatPercentage(item.pctVAS)}</td>
                <td class="px-4 py-2 text-right font-bold ${bhClass}">${ui.formatPercentage(item.pctBaoHiem)}</td></tr>`;
        });
        tableHTML += `</tbody><tfoot class="table-footer font-bold">
            <tr>
                <td class="px-4 py-2">Tổng</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.dtICT / 1000000)}</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.dtPhuKien / 1000000)}</td>
                <td class="px-4 py-2 text-right">${ui.formatPercentage(totals.pctPhuKien)}</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.dtCE / 1000000)}</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals.dtGiaDung / 1000000)}</td>
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
                <div data-capture-group="1" data-capture-columns="6">${ui.renderCategoryTable('ICT', `${sortStatePrefix}_ict`, reportData, 'dtICT', 'slICT', ['slDienThoai', 'slLaptop'], ['SL Điện thoại', 'SL Laptop'])}</div>
                <div data-capture-group="1" data-capture-columns="6">${ui.renderCategoryTable('PHỤ KIỆN', `${sortStatePrefix}_phukien`, reportData, 'dtPhuKien', 'slPhuKien', ['slPinSDP', 'slCamera', 'slTaiNgheBLT'], ['SL Pin SDP', 'SL Camera', 'SL Tai nghe BLT'])}</div>
                <div data-capture-group="2" data-capture-columns="6">${ui.renderCategoryTable('GIA DỤNG', `${sortStatePrefix}_giadung`, reportData, 'dtGiaDung', 'slGiaDung', ['slNoiChien', 'slMLN', 'slRobotHB'], ['SL Nồi chiên', 'SL MLN', 'SL Robot HB'])}</div>
                <div data-capture-group="2" data-capture-columns="6">${ui.renderCategoryTable('CE', `${sortStatePrefix}_ce`, reportData, 'dtCE', 'slCE', ['slTivi', 'slTuLanh', 'slMayGiat', 'slMayLanh'], ['SL Tivi', 'SL Tủ lạnh', 'SL Máy giặt', 'SL Máy lạnh'])}</div>
                <div class="lg:col-span-2" data-capture-group="3" data-capture-columns="7">
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
            <div class="overflow-x-auto flex-grow"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${type}" data-capture-columns="${3 + keys.length}"><thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold"><tr>
                <th class="${headerClass('hoTen')}" data-sort="hoTen">Tên nhân viên <span class="sort-indicator"></span></th>
                <th class="${headerClass(slField)} text-right header-highlight" data-sort="${slField}">SL <span class="sort-indicator"></span></th>
                <th class="${headerClass(revenueField)} text-right header-highlight" data-sort="${revenueField}">Doanh thu thực <span class="sort-indicator"></span></th>`;
        headers.forEach((h, i) => {
            tableHTML += `<th class="${headerClass(keys[i])} text-right" data-sort="${keys[i]}">${h} <span class="sort-indicator"></span></th>`;
        });
        tableHTML += `</tr></thead><tbody>`;
        sortedData.forEach(item => {
            tableHTML += `<tr class="hover:bg-gray-50"><td class="px-4 py-2 font-semibold line-clamp-2">${item.hoTen}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item[slField])}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item[revenueField] / 1000000)}</td>`;
            keys.forEach(k => { tableHTML += `<td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item[k])}</td>`; });
            tableHTML += `</tr>`;
        });
        tableHTML += `</tbody><tfoot class="table-footer font-bold">
                <tr><td class="px-4 py-2">Tổng</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals[slField])}</td>
                <td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals[revenueField] / 1000000)}</td>`;
        keys.forEach(k => { tableHTML += `<td class="px-4 py-2 text-right">${ui.formatNumberOrDash(totals[k])}</td>`; });
        tableHTML += `</tr></tfoot></table></div></div>`;
        return tableHTML;
    },

    populateAllFilters: () => {
        const { danhSachNhanVien } = appState;
        if (danhSachNhanVien.length === 0) return;

        const uniqueWarehouses = [...new Set(danhSachNhanVien.map(nv => nv.maKho).filter(Boolean))].sort();
        const uniqueDepartments = [...new Set(danhSachNhanVien.map(nv => nv.boPhan).filter(Boolean))].sort();

        const createOptionsHTML = (items, includeAllOption = true) => {
            let html = includeAllOption ? '<option value="">Tất cả</option>' : '';
            html += items.map(item => `<option value="${item}">${item}</option>`).join('');
            return html;
        };

        const warehouseOptions = createOptionsHTML(uniqueWarehouses);
        const departmentOptions = createOptionsHTML(uniqueDepartments);

        ['luyke', 'sknv', 'realtime'].forEach(prefix => {
            document.getElementById(`${prefix}-filter-warehouse`).innerHTML = warehouseOptions;
            document.getElementById(`${prefix}-filter-department`).innerHTML = departmentOptions;
            ui.updateEmployeeFilter(prefix);
        });
        
        document.getElementById('luyke-goal-warehouse-select').innerHTML = createOptionsHTML(uniqueWarehouses, false);
        document.getElementById('rt-goal-warehouse-select').innerHTML = createOptionsHTML(uniqueWarehouses, false);

        const sknvEmployeeFilter = document.getElementById('sknv-employee-filter');
        if (sknvEmployeeFilter) {
            sknvEmployeeFilter.innerHTML = '<option value="">-- Tổng hợp --</option>' + danhSachNhanVien
                .sort((a, b) => a.hoTen.localeCompare(b.hoTen))
                .map(nv => `<option value="${nv.maNV}">${nv.hoTen} (${nv.maNV})</option>`).join('');
        }
    },

    updateEmployeeFilter: (prefix) => {
        const { danhSachNhanVien } = appState;
        const choicesInstance = appState.choices[`${prefix}_employee`];
        if (!choicesInstance) return;

        const selectedWarehouse = document.getElementById(`${prefix}-filter-warehouse`).value;
        const selectedDept = document.getElementById(`${prefix}-filter-department`).value;

        const filteredEmployees = danhSachNhanVien.filter(nv => 
            (!selectedWarehouse || nv.maKho == selectedWarehouse) &&
            (!selectedDept || nv.boPhan === selectedDept)
        );

        const employeeOptions = filteredEmployees.map(nv => ({
            value: nv.maNV,
            label: `${nv.hoTen} (${nv.maNV})`,
            selected: false
        }));
        
        choicesInstance.clearStore();
        choicesInstance.setChoices(employeeOptions, 'value', 'label', true);
    },

    displaySknvReport: (filteredReport) => {
        const detailsContainer = document.getElementById('sknv-details-container');
        const summaryContainer = document.getElementById('sknv-summary-container');
        const selectedMaNV = document.getElementById('sknv-employee-filter')?.value;
    
        if (!detailsContainer || !summaryContainer) return;
    
        if (!selectedMaNV) {
            detailsContainer.classList.add('hidden');
            summaryContainer.classList.remove('hidden');
            ui.displaySknvSummaryReport(filteredReport);
            return;
        }
    
        summaryContainer.classList.add('hidden');
        detailsContainer.classList.remove('hidden');
    
        const employeeData = appState.masterReportData.sknv.find(nv => String(nv.maNV).trim() == String(selectedMaNV).trim());
        
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
                const evaluation = ui.getSknvEvaluation(row.rawValue, row.rawAverage, row.higherIsBetter);
                return `<tr class="border-t"><td class="px-4 py-2 font-medium text-gray-700">${row.label}</td><td class="px-4 py-2 text-right font-bold text-gray-900 ${row.valueClass || ''}">${row.value}</td><td class="px-4 py-2 text-right font-medium text-gray-500">${row.average}</td><td class="px-4 py-2 text-center font-semibold ${evaluation.class}">${evaluation.text}</td></tr>`
            }).join('');
            return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><h4 class="text-lg font-bold p-3 border-b ${colorClass}">${title}</h4><table class="min-w-full text-sm table-bordered table-striped" data-capture-columns="4">
                <thead class="sknv-subtable-header"><tr><th class="px-4 py-2 text-left">Chỉ số</th><th class="px-4 py-2 text-right">Giá trị</th><th class="px-4 py-2 text-right">Giá trị TB</th><th class="px-4 py-2 text-center">Đánh giá</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
        };
        
        const { mucTieu } = employeeData;

        const doanhThuData = [
            { label: 'Doanh thu thực', value: ui.formatNumberOrDash(employeeData.doanhThu / 1000000), average: ui.formatNumberOrDash((departmentAverages.doanhThu || 0) / 1000000), rawValue: employeeData.doanhThu, rawAverage: departmentAverages.doanhThu },
            { label: 'Doanh thu quy đổi', value: ui.formatNumberOrDash(employeeData.doanhThuQuyDoi / 1000000), average: ui.formatNumberOrDash((departmentAverages.doanhThuQuyDoi || 0) / 1000000), rawValue: employeeData.doanhThuQuyDoi, rawAverage: departmentAverages.doanhThuQuyDoi },
            { label: '% Quy đổi', value: ui.formatPercentage(employeeData.hieuQuaQuyDoi), valueClass: employeeData.hieuQuaQuyDoi < (mucTieu.phanTramQD/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.hieuQuaQuyDoi), rawValue: employeeData.hieuQuaQuyDoi, rawAverage: departmentAverages.hieuQuaQuyDoi },
            { label: 'Doanh thu CE', value: ui.formatNumberOrDash(employeeData.dtCE / 1000000), average: ui.formatNumberOrDash((departmentAverages.dtCE || 0) / 1000000), rawValue: employeeData.dtCE, rawAverage: departmentAverages.dtCE },
            { label: 'Doanh thu ICT', value: ui.formatNumberOrDash(employeeData.dtICT / 1000000), average: ui.formatNumberOrDash((departmentAverages.dtICT || 0) / 1000000), rawValue: employeeData.dtICT, rawAverage: departmentAverages.dtICT },
            { label: 'Doanh thu trả chậm', value: ui.formatNumberOrDash(employeeData.doanhThuTraGop / 1000000), average: ui.formatNumberOrDash((departmentAverages.doanhThuTraGop || 0) / 1000000), rawValue: employeeData.doanhThuTraGop, rawAverage: departmentAverages.doanhThuTraGop },
            { label: '% Trả chậm', value: ui.formatPercentage(employeeData.tyLeTraCham), valueClass: employeeData.tyLeTraCham < (mucTieu.phanTramTC/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.tyLeTraCham), rawValue: employeeData.tyLeTraCham, rawAverage: departmentAverages.tyLeTraCham }
        ];
        doanhThuData.forEach(d => countEvaluation('doanhthu', d.rawValue, d.rawAverage));

        const nangSuatData = [
            { label: 'Thưởng nóng', value: ui.formatNumberOrDash(employeeData.thuongNong / 1000000), average: ui.formatNumberOrDash((departmentAverages.thuongNong || 0) / 1000000), rawValue: employeeData.thuongNong, rawAverage: departmentAverages.thuongNong },
            { label: 'Thưởng ERP', value: ui.formatNumberOrDash(employeeData.thuongERP / 1000000), average: ui.formatNumberOrDash((departmentAverages.thuongERP || 0) / 1000000), rawValue: employeeData.thuongERP, rawAverage: departmentAverages.thuongERP },
            { label: 'Thu nhập lũy kế', value: ui.formatNumberOrDash(employeeData.tongThuNhap / 1000000), average: ui.formatNumberOrDash((departmentAverages.tongThuNhap || 0) / 1000000), rawValue: employeeData.tongThuNhap, rawAverage: departmentAverages.tongThuNhap },
            { label: 'Thu nhập dự kiến', value: ui.formatNumberOrDash(employeeData.thuNhapDuKien / 1000000), average: ui.formatNumberOrDash((departmentAverages.thuNhapDuKien || 0) / 1000000), rawValue: employeeData.thuNhapDuKien, rawAverage: departmentAverages.thuNhapDuKien },
            { label: 'Giờ công', value: ui.formatNumberOrDash(employeeData.gioCong), average: ui.formatNumberOrDash(departmentAverages.gioCong), rawValue: employeeData.gioCong, rawAverage: departmentAverages.gioCong },
            { label: 'Thu nhập/GC', value: ui.formatNumberOrDash(employeeData.gioCong > 0 ? employeeData.tongThuNhap / employeeData.gioCong : 0), average: ui.formatNumberOrDash((departmentAverages.gioCong || 0) > 0 ? (departmentAverages.tongThuNhap || 0) / departmentAverages.gioCong : 0), rawValue: employeeData.gioCong > 0 ? employeeData.tongThuNhap / employeeData.gioCong : 0, rawAverage: (departmentAverages.gioCong || 0) > 0 ? (departmentAverages.tongThuNhap || 0) / departmentAverages.gioCong : 0 },
            { label: 'Doanh thu QĐ/GC', value: ui.formatNumberOrDash(employeeData.gioCong > 0 ? employeeData.doanhThuQuyDoi / employeeData.gioCong : 0), average: ui.formatNumberOrDash((departmentAverages.gioCong || 0) > 0 ? (departmentAverages.doanhThuQuyDoi || 0) / departmentAverages.gioCong : 0), rawValue: employeeData.gioCong > 0 ? employeeData.doanhThuQuyDoi / employeeData.gioCong : 0, rawAverage: (departmentAverages.gioCong || 0) > 0 ? (departmentAverages.doanhThuQuyDoi || 0) / departmentAverages.gioCong : 0 }
        ];
        nangSuatData.forEach(d => countEvaluation('nangsuat', d.rawValue, d.rawAverage));

        const hieuQuaData = [
            { label: '% PK', value: ui.formatPercentage(employeeData.pctPhuKien), valueClass: employeeData.pctPhuKien < (mucTieu.phanTramPhuKien/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.pctPhuKien), rawValue: employeeData.pctPhuKien, rawAverage: departmentAverages.pctPhuKien },
            { label: '% Gia dụng', value: ui.formatPercentage(employeeData.pctGiaDung), valueClass: employeeData.pctGiaDung < (mucTieu.phanTramGiaDung/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.pctGiaDung), rawValue: employeeData.pctGiaDung, rawAverage: departmentAverages.pctGiaDung },
            { label: '% MLN', value: ui.formatPercentage(employeeData.pctMLN), valueClass: employeeData.pctMLN < (mucTieu.phanTramMLN/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.pctMLN), rawValue: employeeData.pctMLN, rawAverage: departmentAverages.pctMLN },
            { label: '% Sim', value: ui.formatPercentage(employeeData.pctSim), valueClass: employeeData.pctSim < (mucTieu.phanTramSim/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.pctSim), rawValue: employeeData.pctSim, rawAverage: departmentAverages.pctSim },
            { label: '% VAS', value: ui.formatPercentage(employeeData.pctVAS), valueClass: employeeData.pctVAS < (mucTieu.phanTramVAS/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.pctVAS), rawValue: employeeData.pctVAS, rawAverage: departmentAverages.pctVAS },
            { label: '% Bảo hiểm', value: ui.formatPercentage(employeeData.pctBaoHiem), valueClass: employeeData.pctBaoHiem < (mucTieu.phanTramBaoHiem/100) ? 'cell-performance is-below' : '', average: ui.formatPercentage(departmentAverages.pctBaoHiem), rawValue: employeeData.pctBaoHiem, rawAverage: departmentAverages.pctBaoHiem },
        ];
        hieuQuaData.forEach(d => countEvaluation('hieuqua', d.rawValue, d.rawAverage));

        const donGiaData = [
             { label: 'Đơn giá TB', value: ui.formatNumberOrDash(employeeData.donGiaTrungBinh / 1000000), average: ui.formatNumberOrDash(departmentAverages.donGiaTrungBinh / 1000000), rawValue: employeeData.donGiaTrungBinh, rawAverage: departmentAverages.donGiaTrungBinh },
             { label: 'Đơn giá Tivi', value: ui.formatNumberOrDash(employeeData.donGiaTivi / 1000000), average: ui.formatNumberOrDash(departmentAverages.donGiaTivi / 1000000), rawValue: employeeData.donGiaTivi, rawAverage: departmentAverages.donGiaTivi },
             { label: 'Đơn giá Tủ lạnh', value: ui.formatNumberOrDash(employeeData.donGiaTuLanh / 1000000), average: ui.formatNumberOrDash(departmentAverages.donGiaTuLanh / 1000000), rawValue: employeeData.donGiaTuLanh, rawAverage: departmentAverages.donGiaTuLanh },
             { label: 'Đơn giá Máy giặt', value: ui.formatNumberOrDash(employeeData.donGiaMayGiat / 1000000), average: ui.formatNumberOrDash(departmentAverages.donGiaMayGiat / 1000000), rawValue: employeeData.donGiaMayGiat, rawAverage: departmentAverages.donGiaMayGiat },
             { label: 'Đơn giá Máy lạnh', value: ui.formatNumberOrDash(employeeData.donGiaMayLanh / 1000000), average: ui.formatNumberOrDash(departmentAverages.donGiaMayLanh / 1000000), rawValue: employeeData.donGiaMayLanh, rawAverage: departmentAverages.donGiaMayLanh },
             { label: 'Đơn giá Điện thoại', value: ui.formatNumberOrDash(employeeData.donGiaDienThoai / 1000000), average: ui.formatNumberOrDash(departmentAverages.donGiaDienThoai / 1000000), rawValue: employeeData.donGiaDienThoai, rawAverage: departmentAverages.donGiaDienThoai },
             { label: 'Đơn giá Laptop', value: ui.formatNumberOrDash(employeeData.donGiaLaptop / 1000000), average: ui.formatNumberOrDash(departmentAverages.donGiaLaptop / 1000000), rawValue: employeeData.donGiaLaptop, rawAverage: departmentAverages.donGiaLaptop },
        ];
        donGiaData.forEach(d => countEvaluation('dongia', d.rawValue, d.rawAverage));

        // [*] FIX: Calculate the number of QDC criteria BEFORE calculating the total.
        const qdcArray = Object.entries(employeeData.qdc || {}).map(([key, values]) => ({ key, ...values })).filter(item => item.sl > 0);
        evaluationCounts.qdc.total = qdcArray.length;

        const totalAbove = evaluationCounts.doanhthu.above + evaluationCounts.nangsuat.above + evaluationCounts.hieuqua.above + evaluationCounts.dongia.above + evaluationCounts.qdc.above;
        const totalBelow = evaluationCounts.doanhthu.below + evaluationCounts.nangsuat.below + evaluationCounts.hieuqua.below + evaluationCounts.dongia.below + evaluationCounts.qdc.below;
        const totalCriteria = evaluationCounts.doanhthu.total + evaluationCounts.nangsuat.total + evaluationCounts.hieuqua.total + evaluationCounts.dongia.total + evaluationCounts.qdc.total;
        const titleHtml = `CHI TIẾT - ${employeeData.hoTen} <span class="font-normal text-sm">(Trên TB: <span class="font-bold text-green-300">${totalAbove}</span>, Dưới TB: <span class="font-bold text-yellow-300">${totalBelow}</span> / Tổng: ${totalCriteria})</span>`;

        // [*] FIX: Refactored the grid structure and added a custom layout attribute for SKNV screenshots.
        detailsContainer.innerHTML = `<div class="p-4 mb-6 bg-blue-600 text-white rounded-lg shadow-lg border border-blue-700"><h3 class="text-2xl font-bold text-center uppercase">${titleHtml}</h3></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6" data-capture-layout="sknv-custom">
                <div>${createDetailTableHtml('Doanh thu', 'header-bg-blue', doanhThuData)}</div>
                <div>${createDetailTableHtml('Năng suất', 'header-bg-green', nangSuatData)}</div>
                <div>${createDetailTableHtml('Hiệu quả khai thác', 'header-bg-blue', hieuQuaData)}</div>
                <div>${createDetailTableHtml('Đơn giá (Triệu)', 'header-bg-yellow', donGiaData)}</div>
                <div>${ui.renderSknvQdcTable(employeeData, departmentAverages, countEvaluation, evaluationCounts)}</div>
                <div>${ui.renderSknvNganhHangTable(employeeData)}</div>
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
                    if(departmentAverages.qdc[key] && employee.qdc[key].sl > 0) {
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
                        <td class="px-2 py-2 font-semibold line-clamp-2">${item.hoTen}</td>
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
    
    renderRealtimeKpiCards: (data, goals) => {
        const setContent = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = value;
        };

        const targetDTThuc = (parseFloat(goals.doanhThuThuc) || 0) * 1000000;
        const targetDTQD = (parseFloat(goals.doanhThuQD) || 0) * 1000000;
        const targetPTQD = (parseFloat(goals.phanTramQD) || 0) / 100;
    
        const thucHienDTThuc = data.doanhThu || 0;
        const thucHienDTQD = data.doanhThuQuyDoi || 0;
        const phanTramThucHienThuc = targetDTThuc > 0 ? thucHienDTThuc / targetDTThuc : 0;
        const phanTramThucHienQD = targetDTQD > 0 ? thucHienDTQD / targetDTQD : 0;
        const phanTramQD = thucHienDTThuc > 0 ? (thucHienDTQD / thucHienDTThuc) - 1 : 0;
        const phanTramTC = thucHienDTThuc > 0 ? (data.doanhThuTraGop || 0) / thucHienDTThuc : 0;
    
        setContent('rt-kpi-dt-thuc-main', ui.formatNumberOrDash(thucHienDTThuc / 1000000));
        setContent('rt-kpi-dt-thuc-sub1', `% HT: <span class="kpi-percentage-value">${ui.formatPercentage(phanTramThucHienThuc)}</span> / Target: ${ui.formatNumberOrDash(targetDTThuc / 1000000)}`);
        setContent('rt-kpi-dt-thuc-sub2', `DT Chưa xuất: ${ui.formatNumberOrDash((data.doanhThuChuaXuat || 0) / 1000000)}`);
    
        setContent('rt-kpi-dt-qd-main', ui.formatNumberOrDash(thucHienDTQD / 1000000));
        setContent('rt-kpi-dt-qd-sub1', `% HT: <span class="kpi-percentage-value">${ui.formatPercentage(phanTramThucHienQD)}</span> / Target: ${ui.formatNumberOrDash(targetDTQD / 1000000)}`);
        setContent('rt-kpi-dt-qd-sub2', `DTQĐ Chưa xuất: ${ui.formatNumberOrDash((data.doanhThuQuyDoiChuaXuat || 0) / 1000000)}`);
        
        setContent('rt-kpi-tl-qd-main', `<span class="kpi-percentage-value">${ui.formatPercentage(phanTramQD)}</span>`);
        setContent('rt-kpi-tl-qd-sub', `Mục tiêu: ${ui.formatPercentage(targetPTQD)}`);
    
        setContent('rt-kpi-dt-tc-main', ui.formatNumberOrDash((data.doanhThuTraGop || 0) / 1000000));
        setContent('rt-kpi-dt-tc-sub', `% thực trả chậm: <span class="kpi-percentage-value">${ui.formatPercentage(phanTramTC)}</span>`);
    },
    
    renderLuykeKpiCards: (luykeData, comparisonData, chuaXuatData, goals) => {
        const targetDTThuc = (parseFloat(goals.doanhThuThuc) || 0);
        const targetDTQD = (parseFloat(goals.doanhThuQD) || 0);
    
        const dtThucLK = luykeData.dtThucLK || 0;
        const dtQdLK = luykeData.dtQdLK || 0;
        
        const phanTramTargetThuc = targetDTThuc > 0 ? (dtThucLK / 1000000) / targetDTThuc : 0;
        const phanTramTargetQd = luykeData.phanTramTargetQd || 0;
        const phanTramGop = luykeData.phanTramGop || 0;
        const dtGop = dtThucLK * phanTramGop;
        
        const phanTramQd = luykeData.phanTramQd || 0;
        
        const dtChuaXuatQD = Array.isArray(chuaXuatData) 
            ? chuaXuatData.reduce((sum, nv) => sum + (nv.doanhThuQuyDoiChuaXuat || 0), 0)
            : 0;
    
        const setContent = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = value;
        };
    
        setContent('luyke-kpi-dt-thuc-main', ui.formatNumberOrDash(dtThucLK / 1000000));
        setContent('luyke-kpi-dt-thuc-sub1', `% HT: <span class="kpi-percentage-value">${ui.formatPercentage(phanTramTargetThuc)}</span> / Target: ${ui.formatNumberOrDash(targetDTThuc)}`);
        
        setContent('luyke-kpi-dt-qd-main', ui.formatNumberOrDash(dtQdLK / 1000000));
        setContent('luyke-kpi-dt-qd-sub1', `% HT: <span class="kpi-percentage-value">${ui.formatPercentage(phanTramTargetQd)}</span> / Target: ${ui.formatNumberOrDash(targetDTQD)}`);
    
        setContent('luyke-kpi-tl-qd-main', `<span class="kpi-percentage-value">${ui.formatPercentage(phanTramQd)}</span>`);
        setContent('luyke-kpi-tl-qd-sub', `Mục tiêu: ${ui.formatPercentage((goals.phanTramQD || 0) / 100)}`);
        
        setContent('luyke-kpi-dt-tc-main', ui.formatNumberOrDash(dtGop / 1000000));
        setContent('luyke-kpi-dt-tc-sub', `% thực trả chậm: <span class="kpi-percentage-value">${ui.formatPercentage(phanTramGop)}</span>`);
    
        setContent('luyke-kpi-dtqd-chua-xuat-main', ui.formatNumberOrDash(dtChuaXuatQD / 1000000));
    
        const comparisonPercentageText = comparisonData.percentage || '-';
        setContent('luyke-kpi-dtck-main', comparisonPercentageText);
        setContent('luyke-kpi-dtck-sub', ui.formatNumberOrDash(comparisonData.value));
    },
    
    renderLuykeCategoryDetailsTable: (data, numDays) => {
        const container = document.getElementById('luyke-category-details-content');
        const title = document.getElementById('luyke-category-details-title');
        if (!container || !title) return;
        
        title.style.backgroundColor = '';
        title.className = 'text-xl font-bold text-gray-700 mb-4 uppercase flex items-center gap-2 bg-purple-100 text-purple-800 p-2 rounded-md';

        const categoryArray = Object.entries(data.nganhHangChiTiet || {}).map(([name, values]) => ({ name, ...values })).sort((a, b) => b.revenue - a.revenue).slice(0, 15);
        if (categoryArray.length === 0) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return; }

        const { key, direction } = appState.sortState.luyke_nganhhang;
        const sortedData = [...categoryArray].sort((a,b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });
        const headerClass = (sortKey) => `px-4 py-2 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="luyke_nganhhang">
            <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                <tr>
                    <th class="${headerClass('name')}" data-sort="name">Ngành hàng <span class="sort-indicator"></span></th>
                    <th class="${headerClass('quantity')} text-right" data-sort="quantity">SL <span class="sort-indicator"></span></th>
                    <th class="${headerClass('revenue')} text-right" data-sort="revenue">DT Thực <span class="sort-indicator"></span></th>
                    <th class="${headerClass('revenueQuyDoi')} text-right" data-sort="revenueQuyDoi">DT QĐ <span class="sort-indicator"></span></th>
                </tr>
            </thead><tbody>${sortedData.map(cat => `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-semibold">${cat.name}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(cat.quantity)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(cat.revenue / 1000000)}</td>
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(cat.revenueQuyDoi / 1000000)}</td>
                </tr>`).join('')}</tbody></table></div>`;
    },

    renderLuykeQdcTable: (data, numDays) => {
        const container = document.getElementById('luyke-qdc-content');
        const title = document.getElementById('luyke-qdc-title');
        if (!container || !title) return;

        title.style.backgroundColor = '';
        title.className = 'text-xl font-bold text-gray-700 mb-4 uppercase flex items-center gap-2 bg-indigo-100 text-indigo-800 p-2 rounded-md';

        const qdcArray = Object.entries(data.qdc || {}).map(([key, values]) => ({ key, ...values })).filter(item => item.sl > 0);
        if (qdcArray.length === 0) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return; }

        const { key, direction } = appState.sortState.luyke_qdc;
        const sortedData = [...qdcArray].sort((a,b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });
        const headerClass = (sortKey) => `px-4 py-2 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        let tableContent = '';
        const qdcTableGroups = [
            { title: 'Nhóm ICT', items: ['PIN_SDP', 'TAI_NGHE_BLT', 'DONG_HO', 'CAMERA', 'LOA'], colorClass: 'qdc-group-ict' },
            { title: 'VAS', items: ['UDDD', 'BAO_HIEM'], colorClass: 'qdc-group-vas' },
            { title: 'Gia dụng', items: ['NOI_COM', 'NOI_CHIEN', 'MAY_LOC_NUOC', 'ROBOT_HB'], colorClass: 'qdc-group-giadung' },
            { title: 'SIM', items: ['SIM_ONLINE'], colorClass: 'qdc-group-sim' }
        ];

        qdcTableGroups.forEach((group) => {
            const groupItems = sortedData.filter(item => group.items.includes(item.key));
            if (groupItems.length > 0) {
                tableContent += `<tr class="qdc-group-title ${group.colorClass}"><td colspan="3" class="px-4 py-2">${group.title}</td></tr>`;
                groupItems.forEach(item => {
                    tableContent += `<tr class="border-t">
                        <td class="px-4 py-2 font-medium text-gray-700">${item.name}</td>
                        <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.sl)}</td>
                        <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.dtqd / 1000000)}</td>
                    </tr>`;
                });
            }
        });

        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="luyke_qdc">
            <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                <tr>
                    <th class="${headerClass('name')}" data-sort="name">Nhóm hàng <span class="sort-indicator"></span></th>
                    <th class="${headerClass('sl')} text-right" data-sort="sl">Số lượng <span class="sort-indicator"></span></th>
                    <th class="${headerClass('dtqd')} text-right" data-sort="dtqd">DT QĐ <span class="sort-indicator"></span></th>
                </tr>
            </thead>
            <tbody>${tableContent}</tbody></table></div>`;
    },

    renderLuykeEfficiencyTable: (data, goals) => {
        const container = document.getElementById('luyke-efficiency-content');
        if (!container) return;
        const rows = [
            { label: '% Gia dụng', thucHien: data.pctGiaDung, mucTieu: (goals.phanTramGiaDung || 0) / 100 },
            { label: '% MLN', thucHien: data.pctMLN, mucTieu: (goals.phanTramMLN || 0) / 100 },
            { label: '% Phụ kiện', thucHien: data.pctPhuKien, mucTieu: (goals.phanTramPhuKien || 0) / 100 },
            { label: '% Sim', thucHien: data.pctSim, mucTieu: (goals.phanTramSim || 0) / 100 },
            { label: '% VAS', thucHien: data.pctVAS, mucTieu: (goals.phanTramVAS || 0) / 100 },
            { label: '% Bảo hiểm', thucHien: data.pctBaoHiem, mucTieu: (goals.phanTramBaoHiem || 0) / 100 },
        ];
        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-capture-columns="3">
            <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                <tr><th class="px-4 py-2">Tiêu chí</th><th class="px-4 py-2 text-right">Thực hiện</th><th class="px-4 py-2 text-right">Mục tiêu</th></tr>
            </thead>
            <tbody>${rows.map(row => 
                `<tr class="hover:bg-gray-50"><td class="px-4 py-2 font-semibold">${row.label}</td>
                <td class="px-4 py-2 text-right font-bold ${row.thucHien < row.mucTieu ? 'cell-performance is-below' : ''}">${ui.formatPercentage(row.thucHien)}</td>
                <td class="px-4 py-2 text-right font-bold">${ui.formatPercentage(row.mucTieu)}</td></tr>`).join('')}
            </tbody></table></div>`;
    },

    renderRealtimeCategoryDetailsTable: (data) => {
        const container = document.getElementById('realtime-category-details-content');
        if (!container) return;

        const categoryArray = Object.entries(data.nganhHangChiTiet || {}).map(([name, values]) => ({ name, ...values })).sort((a, b) => b.revenue - a.revenue).slice(0, 15);
        if (categoryArray.length === 0) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu ngành hàng chi tiết.</p>`; return; }
        
        const title = document.getElementById('realtime-category-title');
        if(title) {
            title.style.backgroundColor = '';
            title.className = 'text-xl font-bold text-gray-700 mb-4 uppercase flex items-center gap-2 bg-green-100 text-green-800 p-2 rounded-md';
        }

        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="realtime_nganhhang" data-capture-columns="5">
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
                                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(cat.revenue / 1000000)}</td>
                                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(cat.revenueQuyDoi / 1000000)}</td>
                                <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(cat.donGia / 1000000)}</td></tr>`).join('')}</tbody></table></div>`;
    },

    renderRealtimeEfficiencyTable: (data, goals) => {
        const container = document.getElementById('realtime-efficiency-content');
        if(!container) return;
        const rows = [
            { label: '% Gia dụng', thucHien: data.pctGiaDung, mucTieu: (goals.phanTramGiaDung || 0) / 100 },
            { label: '% MLN', thucHien: data.pctMLN, mucTieu: (goals.phanTramMLN || 0) / 100 },
            { label: '% Phụ kiện', thucHien: data.pctPhuKien, mucTieu: (goals.phanTramPhuKien || 0) / 100 },
            { label: '% Sim', thucHien: data.pctSim, mucTieu: (goals.phanTramSim || 0) / 100 },
            { label: '% VAS', thucHien: data.pctVAS, mucTieu: (goals.phanTramVAS || 0) / 100 },
            { label: '% Bảo hiểm', thucHien: data.pctBaoHiem, mucTieu: (goals.phanTramBaoHiem || 0) / 100 },
        ];
        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-capture-columns="3">
                    <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                        <tr><th class="px-4 py-2">Tiêu chí</th><th class="px-4 py-2 text-right">Thực hiện</th><th class="px-4 py-2 text-right">Mục tiêu</th></tr></thead><tbody>${rows.map(row => 
                            `<tr class="hover:bg-gray-50"><td class="px-4 py-2 font-semibold">${row.label}</td>
                            <td class="px-4 py-2 text-right font-bold ${row.thucHien < row.mucTieu ? 'cell-performance is-below' : ''}">${ui.formatPercentage(row.thucHien)}</td>
                            <td class="px-4 py-2 text-right font-bold">${ui.formatPercentage(row.mucTieu)}</td></tr>`).join('')}</tbody></table></div>`;
    },
    
    renderRealtimeQdcTable: (data) => {
        const container = document.getElementById('realtime-qdc-content');
        const title = document.getElementById('realtime-qdc-title');
        if(!container || !title) return;

        title.style.backgroundColor = '';
        title.className = 'text-xl font-bold text-gray-700 mb-4 uppercase flex items-center gap-2 bg-indigo-100 text-indigo-800 p-2 rounded-md';
        
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
                    <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(dtqd / 1000000)}</td></tr>`;
            }).join('');
            if (groupHasData) tableContent += `<tr class="qdc-group-title ${group.colorClass}"><td colspan="3" class="px-4 py-2">${group.title}</td></tr>` + groupRows;
        });

        if (!tableContent) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return; }

        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="realtime_qdc" data-capture-columns="3">
            <thead class="sknv-subtable-header text-xs text-slate-800 uppercase bg-slate-200 font-bold"><tr>
                <th class="px-4 py-2 text-left">Nhóm hàng</th><th class="px-4 py-2 text-right">Số lượng</th>
                <th class="px-4 py-2 text-right">DT QĐ</th></tr></thead>
            <tbody>${tableContent}</tbody></table></div>`;
    },
    updateLuykeSupermarketTitle: (warehouse, date) => {
        const titleEl = document.getElementById('luyke-supermarket-title');
        if (!titleEl) return;
        const dateString = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        titleEl.textContent = `DOANH THU LŨY KẾ - ${warehouse || 'TOÀN BỘ'} - ${dateString}`;
    },
    updateRealtimeSupermarketTitle: (warehouse, dateTime) => {
        const titleEl = document.getElementById('realtime-supermarket-title');
        if (!titleEl) return;
        const timeString = dateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const dateString = dateTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        titleEl.textContent = `DOANH THU REALTIME - ${warehouse || 'TOÀN BỘ'} - ${timeString} ${dateString}`;
    },

    renderSknvDonGiaTbTable: (employeeData, departmentAverages, countCallback) => {
        const rows = [
             { key: 'donGiaTrungBinh', label: 'Đơn giá TB' },
             { key: 'donGiaTivi', label: 'Đơn giá Tivi' },
             { key: 'donGiaTuLanh', label: 'Đơn giá Tủ lạnh' },
             { key: 'donGiaMayGiat', label: 'Đơn giá Máy giặt' },
             { key: 'donGiaMayLanh', label: 'Đơn giá Máy lạnh' },
             { key: 'donGiaDienThoai', label: 'Đơn giá Điện thoại' },
             { key: 'donGiaLaptop', label: 'Đơn giá Laptop' },
        ];
        
        let rowsHtml = rows.map(row => {
            const empValue = employeeData[row.key];
            const avgValue = departmentAverages[row.key];
            countCallback('dongia', empValue, avgValue);
            const evaluation = ui.getSknvEvaluation(empValue, avgValue);
            return `<tr class="border-t"><td class="px-4 py-2 font-medium text-gray-700">${row.label}</td><td class="px-4 py-2 text-right font-bold text-gray-900">${ui.formatNumberOrDash(empValue / 1000000)}</td><td class="px-4 py-2 text-right font-medium text-gray-500">${ui.formatNumberOrDash(avgValue / 1000000)}</td><td class="px-4 py-2 text-center font-semibold ${evaluation.class}">${evaluation.text}</td></tr>`
        }).join('');

        return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><h4 class="text-lg font-bold p-3 border-b header-bg-yellow">Đơn giá (Triệu)</h4><table class="min-w-full text-sm table-bordered table-striped" data-capture-columns="4">
            <thead class="sknv-subtable-header"><tr><th class="px-4 py-2 text-left">Chỉ số</th><th class="px-4 py-2 text-right">Giá trị</th><th class="px-4 py-2 text-right">Giá trị TB</th><th class="px-4 py-2 text-center">Đánh giá</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
    },

    renderSknvNganhHangTable(employeeData) {
        const categoryArray = Object.entries(employeeData.doanhThuTheoNganhHang || {}).map(([name, values]) => ({ name, ...values })).sort((a, b) => b.revenue - a.revenue).slice(0, 15);
        if (categoryArray.length === 0) return '';
        
        const { key, direction } = appState.sortState.sknv_nganhhang_chitiet;
        const sortedData = [...categoryArray].sort((a,b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });
        const headerClass = (sortKey) => `px-4 py-2 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><h4 class="text-lg font-bold p-3 border-b header-bg-green">Top 15 Ngành hàng chi tiết</h4>
            <div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="sknv_nganhhang_chitiet" data-capture-columns="3">
            <thead class="sknv-subtable-header"><tr>
                <th class="${headerClass('name')}" data-sort="name">Ngành hàng</th>
                <th class="${headerClass('revenue')} text-right" data-sort="revenue">Doanh thu (tr)</th>
                <th class="${headerClass('quantity')} text-right" data-sort="quantity">Số lượng</th>
            </tr></thead>
            <tbody>${sortedData.map(cat => `<tr class="border-t"><td class="px-4 py-2 font-medium text-gray-700">${cat.name}</td><td class="px-4 py-2 text-right font-bold">${this.formatNumberOrDash(cat.revenue / 1000000)}</td><td class="px-4 py-2 text-right font-bold">${this.formatNumberOrDash(cat.quantity)}</td></tr>`).join('')}</tbody>
            </table></div></div>`;
    },
    
    renderSknvQdcTable(employeeData, departmentAverages, countCallback, evaluationCounts) {
        const qdcArray = Object.entries(employeeData.qdc || {}).map(([key, values]) => ({ key, ...values })).filter(item => item.sl > 0);
        if (qdcArray.length === 0) return '';

        const { key, direction } = appState.sortState.sknv_qdc;
        const sortedData = [...qdcArray].sort((a,b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });

        let tableContent = '';
        const qdcTableGroups = [
            { title: 'Nhóm ICT', items: ['PIN_SDP', 'TAI_NGHE_BLT', 'DONG_HO', 'CAMERA', 'LOA'], colorClass: 'qdc-group-ict' },
            { title: 'VAS', items: ['UDDD', 'BAO_HIEM'], colorClass: 'qdc-group-vas' },
            { title: 'Gia dụng', items: ['NOI_COM', 'NOI_CHIEN', 'MAY_LOC_NUOC', 'ROBOT_HB'], colorClass: 'qdc-group-giadung' },
            { title: 'SIM', items: ['SIM_ONLINE'], colorClass: 'qdc-group-sim' }
        ];
        
        evaluationCounts.qdc.total = qdcArray.length;

        qdcTableGroups.forEach((group) => {
            const groupItems = sortedData.filter(item => group.items.includes(item.key));
            if (groupItems.length > 0) {
                tableContent += `<tr class="qdc-group-title ${group.colorClass}"><td colspan="4" class="px-4 py-2">${group.title}</td></tr>`;
                groupItems.forEach(item => {
                    const avgValue = departmentAverages.qdc?.[item.key]?.dtqd || 0;
                    countCallback('qdc', item.dtqd, avgValue);
                    const evaluation = ui.getSknvEvaluation(item.dtqd, avgValue);
                    tableContent += `<tr class="border-t">
                        <td class="px-4 py-2 font-medium text-gray-700">${item.name}</td>
                        <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.sl)}</td>
                        <td class="px-4 py-2 text-right font-bold">${ui.formatNumberOrDash(item.dtqd / 1000000)}</td>
                        <td class="px-4 py-2 text-center font-semibold ${evaluation.class}">${evaluation.text}</td>
                    </tr>`;
                });
            }
        });

        return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><h4 class="text-lg font-bold p-3 border-b header-bg-indigo">Nhóm hàng quy đổi cao</h4>
            <div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="sknv_qdc" data-capture-columns="4">
            <thead class="sknv-subtable-header"><tr>
                <th class="px-4 py-2 text-left">Nhóm hàng</th>
                <th class="px-4 py-2 text-right">Số lượng</th>
                <th class="px-4 py-2 text-right">DT QĐ</th>
                <th class="px-4 py-2 text-center">Đánh giá</th>
            </tr></thead>
            <tbody>${tableContent}</tbody></table></div></div>`;
    },

    getSknvEvaluation: (value, avgValue, higherIsBetter = true) => {
        const result = { text: '-', class: '' };
        if (!isFinite(value) || avgValue === undefined || !isFinite(avgValue)) return result;
        
        let isAbove = higherIsBetter ? (value >= avgValue) : (value <= avgValue);

        if (isAbove) { result.text = 'Trên TB'; result.class = 'text-green-600'; } 
        else { result.text = 'Dưới TB'; result.class = 'cell-performance is-below text-red-600'; }
        return result;
    }
};

export { ui };

