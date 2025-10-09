// Version 1.5 - Add 'Completed' and 'Not Completed' counters to competition titles
// MODULE: UI LUY KE
// Chứa các hàm render giao diện cho tab "Sức khỏe Siêu thị (Lũy kế)".

import { appState } from './state.js';
import { services } from './services.js';
import { utils } from './utils.js';
import { uiComponents } from './ui-components.js';

export const uiLuyke = {
    displayHealthKpiTable: (pastedData, goals) => {
        const { mainKpis, comparisonData, dtDuKien, dtqdDuKien, luotKhachData } = pastedData;
        
        const competitionSummary = { dat: 0, total: 0 };
        if (appState.competitionData && appState.competitionData.length > 0) {
            competitionSummary.total = appState.competitionData.length;
            competitionSummary.dat = appState.competitionData.filter(d => (parseFloat(String(d.hoanThanh).replace('%','')) || 0) >= 100).length;
        }

        if (!mainKpis || Object.keys(mainKpis).length === 0) {
            const supermarketReport = services.aggregateReport(appState.masterReportData.luyke);
            const cardData = {
                dtThucLK: supermarketReport.doanhThu,
                dtQdLK: supermarketReport.doanhThuQuyDoi,
                phanTramQd: supermarketReport.doanhThu > 0 ? (supermarketReport.doanhThuQuyDoi / supermarketReport.doanhThu) - 1 : 0,
                dtGop: supermarketReport.doanhThuTraGop,
                phanTramGop: supermarketReport.doanhThu > 0 ? supermarketReport.doanhThuTraGop / supermarketReport.doanhThu : 0,
                dtThucDuKien: 0,
                dtQdDuKien: 0,
                phanTramTargetQd: 0,
                phanTramTargetThuc: 0,
            };
            uiLuyke.renderLuykeKpiCards(cardData, comparisonData, luotKhachData, appState.masterReportData.luyke, goals, competitionSummary);
            return;
        }
        
        const cleanValue = (str) => (typeof str === 'string' ? parseFloat(str.replace(/,|%/g, '')) : (typeof str === 'number' ? str : 0));
        
        const dtThucLK = cleanValue(mainKpis['Thực hiện DT thực']) * 1000000;
        const dtQdLK = cleanValue(mainKpis['Thực hiện DTQĐ']) * 1000000;
        const phanTramGopRaw = cleanValue(mainKpis['Tỷ Trọng Trả Góp']);
        const dtGop = dtThucLK * (phanTramGopRaw / 100);
        const phanTramQd = dtThucLK > 0 ? (dtQdLK / dtThucLK) - 1 : 0;
        const phanTramGop = dtThucLK > 0 ? dtGop / dtThucLK : 0;
        
        const targetThuc = (parseFloat(goals.doanhThuThuc) || 0) * 1000000;
        const phanTramTargetThuc = targetThuc > 0 ? (dtDuKien * 1000000) / targetThuc : 0;
        const phanTramTargetQd = (cleanValue(mainKpis['% HT Target Dự Kiến (QĐ)']) || 0) / 100;

        const luykeCardData = { 
            dtThucLK, dtQdLK, dtGop, phanTramQd, phanTramGop, 
            phanTramTargetThuc, phanTramTargetQd,
            dtThucDuKien: dtDuKien * 1000000,
            dtQdDuKien: dtqdDuKien * 1000000,
        };
        
        uiLuyke.renderLuykeKpiCards(luykeCardData, comparisonData, luotKhachData, appState.masterReportData.luyke, goals, competitionSummary);
    },

    displayCompetitionResultsFromLuyKe: (text, viewType = 'summary') => {
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
        
        const summary = {
            total: data.length,
            dat: data.filter(d => parseFloat(String(d.hoanThanh).replace('%','')) >= 100).length,
        };
        summary.chuaDat = summary.total - summary.dat;
        
        const summaryEl = document.getElementById('luyke-competition-summary');
        if (summaryEl) summaryEl.textContent = `(Tổng: ${summary.total}, Đạt: ${summary.dat}, Chưa đạt: ${summary.chuaDat})`;

        if (viewType === 'summary') {
            container.innerHTML = uiLuyke.renderLuykeCompetitionSummary(data);
        } else {
            container.innerHTML = uiLuyke.renderLuykeCompetitionByCategory(data);
        }
    },
    
    renderLuykeCompetitionSummary(data) {
        const dataDoanhThu = data.filter(d => d.type === 'doanhThu');
        const dataSoLuong = data.filter(d => d.type === 'soLuong');
        const renderTable = (title, items, type) => {
            if(items.length === 0) return '';
            const sortState = appState.sortState[`luyke_competition_${type}`] || { key: 'hoanThanh', direction: 'desc' };
            const { key, direction } = sortState;
            
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

            const total = items.length;
            const dat = items.filter(item => (parseFloat(String(item.hoanThanh).replace('%','')) || 0) >= 100).length;
            const chuaDat = total - dat;
            const summaryText = `(Tổng: ${total}, Đạt: ${dat}, Chưa đạt: ${chuaDat})`;

            return `<div class="flex flex-col"><h4 class="text-lg font-bold text-gray-800 p-2 border-b-2 ${headerColorClass}">${title} <span class="text-sm font-normal text-gray-500">${summaryText}</span></h4>
                <div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="luyke_competition_${type}">
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
                        const formattedHoanThanh = uiComponents.formatPercentage(hoanThanhValue / 100);

                        return `<tr class="${rowClass}">
                            <td class="px-2 py-2 font-semibold line-clamp-2">${item.name}</td>
                            <td class="px-2 py-2 text-right font-bold">${uiComponents.formatNumberOrDash(item.luyKe)}</td>
                            <td class="px-2 py-2 text-right font-bold">${uiComponents.formatNumberOrDash(item.target)}</td>
                            <td class="px-2 py-2 text-right font-bold text-blue-600">${formattedHoanThanh}</td>
                            <td class="px-2 py-2 text-right font-bold text-orange-600">${uiComponents.formatNumberOrDash(dailyTarget)}</td>
                        </tr>`
                    }).join('')}</tbody></table></div></div>`;
        };
        return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            ${renderTable('Thi đua Doanh thu', dataDoanhThu, 'doanhthu')}
            ${renderTable('Thi đua Số lượng', dataSoLuong, 'soluong')}
        </div>`;
    },
    
    renderLuykeCompetitionByCategory(data) {
        return '<p class="text-gray-500 font-bold col-span-2">Chế độ xem theo ngành hàng cho Thi đua Lũy kế sẽ được phát triển sau.</p>';
    },

    renderChuaXuatTable: (reportData) => {
        const container = document.getElementById('luyke-unexported-revenue-content');
        if (!container) return;
        if (!reportData || reportData.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center font-bold">Không có đơn hàng nào chưa xuất.</p>';
            return;
        }

        const sortState = appState.sortState.luyke_chuaxuat || { key: 'doanhThuQuyDoi', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...reportData].sort((a, b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - a[key];
        });

        const totals = reportData.reduce((acc, item) => {
            acc.soLuong += item.soLuong;
            acc.doanhThuThuc += item.doanhThuThuc;
            acc.doanhThuQuyDoi += item.doanhThuQuyDoi;
            return acc;
        }, { soLuong: 0, doanhThuThuc: 0, doanhThuQuyDoi: 0 });

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        
        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="luyke_chuaxuat">
            <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold"><tr>
                <th class="${headerClass('nganhHang')}" data-sort="nganhHang">Ngành hàng</th>
                <th class="${headerClass('soLuong')} text-right" data-sort="soLuong">Số lượng</th>
                <th class="${headerClass('doanhThuThuc')} text-right" data-sort="doanhThuThuc">Doanh thu thực</th>
                <th class="${headerClass('doanhThuQuyDoi')} text-right" data-sort="doanhThuQuyDoi">Doanh thu QĐ</th></tr>
            </thead>
            <tbody>${sortedData.map(item => `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-semibold">${item.nganhHang}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumber(item.soLuong)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.doanhThuThuc)}</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-600">${uiComponents.formatRevenue(item.doanhThuQuyDoi)}</td>
                </tr>`).join('')}
            </tbody>
            <tfoot class="table-footer font-bold"><tr>
                <td class="px-4 py-2">Tổng</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatNumber(totals.soLuong)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.doanhThuThuc)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.doanhThuQuyDoi)}</td>
            </tr></tfoot></table></div>`;
    },

    renderLuykeKpiCards: (luykeData, comparisonData, luotKhachData, masterReportDataLuyke, goals, competitionSummary) => {
        const { dtThucLK, dtQdLK, dtGop, phanTramQd, phanTramGop, phanTramTargetThuc, phanTramTargetQd, dtThucDuKien, dtQdDuKien } = luykeData;

        // --- Thẻ 1: Doanh thu thực ---
        document.getElementById('luyke-kpi-dt-thuc-main').textContent = uiComponents.formatNumber((dtThucLK || 0) / 1000000, 0);
        document.getElementById('luyke-kpi-dt-thuc-sub1').innerHTML = `DK: <span class="font-bold">${uiComponents.formatNumber((dtThucDuKien || 0) / 1000000, 0)}</span> / Target: <span class="font-bold">${uiComponents.formatNumber(goals?.doanhThuThuc || 0)}</span>`;

        // --- Thẻ 2: Doanh thu Quy đổi ---
        document.getElementById('luyke-kpi-dt-qd-main').textContent = uiComponents.formatNumber((dtQdLK || 0) / 1000000, 0);
        document.getElementById('luyke-kpi-dt-qd-sub1').innerHTML = `DK: <span class="font-bold">${uiComponents.formatNumber((dtQdDuKien || 0) / 1000000, 0)}</span> / Target: <span class="font-bold">${uiComponents.formatNumber(goals?.doanhThuQD || 0)}</span>`;
        
        // --- Thẻ 3: Tỷ lệ HT Target ---
        document.getElementById('luyke-kpi-ht-target-qd-main').textContent = uiComponents.formatPercentage(phanTramTargetQd || 0);
        document.getElementById('luyke-kpi-ht-target-thuc-sub').innerHTML = `DT Thực: <span class="font-bold">${uiComponents.formatPercentage(phanTramTargetThuc || 0)}</span>`;

        // --- Thẻ 4: Tỷ lệ quy đổi ---
        document.getElementById('luyke-kpi-tl-qd-main').textContent = uiComponents.formatPercentage(phanTramQd || 0);
        document.getElementById('luyke-kpi-tl-qd-sub').innerHTML = `Mục tiêu: <span class="font-bold">${uiComponents.formatNumber(goals?.phanTramQD || 0)}%</span>`;
        
        // --- Thẻ 5: Doanh thu trả chậm ---
        document.getElementById('luyke-kpi-dt-tc-main').textContent = uiComponents.formatNumber((dtGop || 0) / 1000000, 0);
        document.getElementById('luyke-kpi-dt-tc-sub').innerHTML = `% thực trả chậm: <span class="font-bold">${uiComponents.formatPercentage(phanTramGop || 0)}</span>`;
        
        // --- Thẻ 6: DTQĐ Chưa xuất ---
        const chuaXuatQuyDoi = masterReportDataLuyke.reduce((sum, item) => sum + (item.doanhThuQuyDoiChuaXuat || 0), 0);
        document.getElementById('luyke-kpi-dtqd-chua-xuat-main').textContent = uiComponents.formatNumber(chuaXuatQuyDoi / 1000000, 0);
        
        // --- Thẻ 7: Thi đua ngành hàng ---
        const tyLeThiDuaDat = competitionSummary.total > 0 ? competitionSummary.dat / competitionSummary.total : 0;
        document.getElementById('luyke-kpi-thidua-main').textContent = uiComponents.formatPercentage(tyLeThiDuaDat);
        document.getElementById('luyke-kpi-thidua-sub').innerHTML = `<span class="font-bold">${competitionSummary.dat}/${competitionSummary.total}</span> Ngành`;

        // --- Thẻ 8: Tăng/giảm cùng kỳ ---
        document.getElementById('luyke-kpi-dtck-main').textContent = comparisonData.percentage || 'N/A';
        document.getElementById('luyke-kpi-dtck-sub').innerHTML = `Doanh thu: <span class="font-bold">${uiComponents.formatNumber(comparisonData.value || 0)} | ${comparisonData.percentage || '0%'}</span>`;
        document.getElementById('luyke-kpi-lkck-sub').innerHTML = `Lượt khách: <span class="font-bold">${uiComponents.formatNumber(luotKhachData.value || 0)} | ${luotKhachData.percentage || '0%'}</span>`;
    },

    renderLuykeCategoryDetailsTable: (data, numDays) => {
        const container = document.getElementById('luyke-category-details-content');
        if (!container || !data || !data.nganhHangChiTiet) { container.innerHTML = '<p class="text-gray-500 font-bold">Không có dữ liệu.</p>'; return; }
        const { nganhHangChiTiet } = data;
        if (Object.keys(nganhHangChiTiet).length === 0) {
            container.innerHTML = '<p class="text-gray-500 font-bold">Không có dữ liệu.</p>'; return;
        }

        const sortState = appState.sortState.luyke_nganhhang || { key: 'revenue', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = Object.entries(nganhHangChiTiet)
            .map(([name, values]) => ({ name, ...values }))
            .sort((a, b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key]);

        const totals = sortedData.reduce((acc, item) => {
            acc.quantity += item.quantity;
            acc.revenue += item.revenue;
            return acc;
        }, { quantity: 0, revenue: 0 });

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="luyke_nganhhang">
            <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold"><tr>
                <th class="${headerClass('name')}" data-sort="name">Ngành hàng</th>
                <th class="${headerClass('quantity')} text-right" data-sort="quantity">Số lượng</th>
                <th class="${headerClass('revenue')} text-right" data-sort="revenue">Doanh thu</th>
                <th class="${headerClass('avgQuantity')} text-right" data-sort="avgQuantity">SL TB/ngày</th>
                <th class="${headerClass('avgPrice')} text-right" data-sort="avgPrice">Đơn giá TB</th></tr>
            </thead>
            <tbody>${sortedData.map(item => `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-semibold">${item.name}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumber(item.quantity)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.revenue)}</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-600">${uiComponents.formatNumberOrDash(item.quantity / numDays, 1)}</td>
                    <td class="px-4 py-2 text-right font-bold text-green-600">${uiComponents.formatRevenue(item.donGia)}</td>
                </tr>`).join('')}
            </tbody>
            <tfoot class="table-footer font-bold"><tr>
                <td class="px-4 py-2">Tổng</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatNumber(totals.quantity)}</td>
                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.revenue)}</td>
                <td colspan="2"></td>
            </tr></tfoot></table></div>`;
    },

    renderLuykeQdcTable: (data, numDays) => {
        const container = document.getElementById('luyke-qdc-content');
        if (!container || !data || !data.qdc) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return; }
        
        const qdcData = Object.entries(data.qdc).map(([key, value]) => ({ id: key, ...value }));
        const sortState = appState.sortState.luyke_qdc || { key: 'dtqd', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...qdcData].sort((a,b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key]);

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="luyke_qdc">
            <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold"><tr>
                <th class="${headerClass('name')}" data-sort="name">Nhóm hàng</th>
                <th class="${headerClass('sl')} text-right" data-sort="sl">SL</th>
                <th class="${headerClass('dtqd')} text-right" data-sort="dtqd">DTQĐ</th>
                <th class="${headerClass('avgSl')} text-right" data-sort="avgSl">SL TB/Ngày</th></tr>
            </thead>
            <tbody>${sortedData.map(item => `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-semibold">${item.name}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumber(item.sl)}</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-600">${uiComponents.formatRevenue(item.dtqd)}</td>
                    <td class="px-4 py-2 text-right font-bold text-green-600">${uiComponents.formatNumber(item.sl / numDays, 1)}</td></tr>`
                ).join('')}
            </tbody></table></div>`;
    },

    renderLuykeEfficiencyTable: (data, goals) => {
        const container = document.getElementById('luyke-efficiency-content');
        if (!container || !data || !goals) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return; }
        const { pctPhuKien, pctGiaDung, pctMLN, pctSim, pctVAS, pctBaoHiem } = data;
        const createRow = (label, value, target) => {
            const isBelow = value < (target / 100);
            return `<tr class="border-t">
                <td class="px-4 py-2 font-semibold text-gray-800">${label}</td>
                <td class="px-4 py-2 text-right font-bold text-lg ${isBelow ? 'cell-performance is-below' : 'text-green-600'}">${uiComponents.formatPercentage(value || 0)}</td>
                <td class="px-4 py-2 text-right text-gray-600">${target || 0}%</td>
            </tr>`;
        };
        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered">
            <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold"><tr>
                <th class="px-4 py-3 text-left">Chỉ số</th><th class="px-4 py-3 text-right">Thực hiện</th><th class="px-4 py-3 text-right">Mục tiêu</th></tr>
            </thead>
            <tbody>
                ${createRow('% Phụ kiện', pctPhuKien, goals.phanTramPhuKien)}
                ${createRow('% Gia dụng', pctGiaDung, goals.phanTramGiaDung)}
                ${createRow('% MLN', pctMLN, goals.phanTramMLN)}
                ${createRow('% Sim', pctSim, goals.phanTramSim)}
                ${createRow('% VAS', pctVAS, goals.phanTramVAS)}
                ${createRow('% Bảo hiểm', pctBaoHiem, goals.phanTramBaoHiem)}
            </tbody></table></div>`;
    },

    updateLuykeSupermarketTitle: (warehouse, date) => {
        const titleEl = document.getElementById('luyke-supermarket-title');
        if (titleEl) titleEl.textContent = `Báo cáo lũy kế ${warehouse ? 'kho ' + warehouse : 'toàn bộ'} - Tính đến ${date.toLocaleDateString('vi-VN')}`;
    },
};