// Version 2.9 - Filter efficiency table to show only percentages and rename title
// MODULE: UI LUY KE
// Chứa các hàm render giao diện cho tab "Sức khỏe Siêu thị (Lũy kế)".

import { appState } from './state.js';
import { services } from './services.js';
import { utils } from './utils.js';
import { uiComponents } from './ui-components.js';
import { settingsService } from './modules/settings.service.js';
import { highlightService } from './modules/highlight.service.js';

export const uiLuyke = {
    // === CÁC HÀM MỞ MODAL CÀI ĐẶT CHO TỪNG BẢNG (Giữ nguyên) ===
    _showEfficiencySettingsModal() {
        const modal = document.getElementById('selection-modal');
        if (!modal) return;

        // Lấy danh sách đầy đủ các mục từ settings service
        const allItemsConfig = settingsService.loadEfficiencyViewSettings();
        
        const listContainer = document.getElementById('selection-modal-list');
        listContainer.innerHTML = allItemsConfig.map(item => `
            <div class="selection-item">
                <input type="checkbox" id="select-item-lk-eff-${item.id}" value="${item.id}" ${item.visible ? 'checked' : ''}>
                <label for="select-item-lk-eff-${item.id}">${item.label}</label>
            </div>
        `).join('');

        document.getElementById('selection-modal-title').textContent = 'Tùy chỉnh hiển thị Hiệu quả khai thác';
        modal.dataset.settingType = 'efficiencyView';
        const searchInput = document.getElementById('selection-modal-search');
        if (searchInput) searchInput.value = '';
        
        uiComponents.toggleModal('selection-modal', true);
    },

    _showQdcSettingsModal(supermarketReport) {
        const modal = document.getElementById('selection-modal');
        if (!modal || !supermarketReport || !supermarketReport.qdc) return;

        const allItems = Object.values(supermarketReport.qdc).map(item => item.name).sort();
        const savedSettings = settingsService.loadQdcViewSettings(allItems);
        
        const listContainer = document.getElementById('selection-modal-list');
        listContainer.innerHTML = allItems.map(item => `
            <div class="selection-item">
                <input type="checkbox" id="select-item-lk-qdc-${item.replace(/[^a-zA-Z0-9]/g, '')}" value="${item}" ${savedSettings.includes(item) ? 'checked' : ''}>
                <label for="select-item-lk-qdc-${item.replace(/[^a-zA-Z0-9]/g, '')}">${item}</label>
            </div>
        `).join('');

        document.getElementById('selection-modal-title').textContent = 'Tùy chỉnh hiển thị Nhóm hàng QĐC';
        modal.dataset.settingType = 'qdcView';
        const searchInput = document.getElementById('selection-modal-search');
        if (searchInput) searchInput.value = '';
        
        uiComponents.toggleModal('selection-modal', true);
    },

    _showCategorySettingsModal(supermarketReport) {
        const modal = document.getElementById('selection-modal');
        if (!modal || !supermarketReport || !supermarketReport.nganhHangChiTiet) return;

        const allItems = Object.keys(supermarketReport.nganhHangChiTiet).sort();
        const savedSettings = settingsService.loadCategoryViewSettings(allItems);
        
        const listContainer = document.getElementById('selection-modal-list');
        listContainer.innerHTML = allItems.map(item => `
            <div class="selection-item">
                <input type="checkbox" id="select-item-lk-cat-${item.replace(/[^a-zA-Z0-9]/g, '')}" value="${item}" ${savedSettings.includes(item) ? 'checked' : ''}>
                <label for="select-item-lk-cat-${item.replace(/[^a-zA-Z0-9]/g, '')}">${item}</label>
            </div>
        `).join('');

        document.getElementById('selection-modal-title').textContent = 'Tùy chỉnh hiển thị Ngành hàng chi tiết';
        modal.dataset.settingType = 'categoryView';
        const searchInput = document.getElementById('selection-modal-search');
        if (searchInput) searchInput.value = '';
        
        uiComponents.toggleModal('selection-modal', true);
    },

    // === START: HÀM RENDER CHÍNH (FIXES) ===
    renderCompetitionSummaryCounter: (data) => {
        const summary = {
            total: data.length,
            dat: data.filter(d => d.hoanThanhValue >= 100).length,
            doanhThuCount: data.filter(d => d.type === 'doanhThu').length,
            soLuongCount: data.filter(d => d.type === 'soLuong').length,
        };
        
        // Sử dụng các lớp CSS đã định nghĩa trong dashboard.css để tăng size và màu sắc
        const totalHtml = `<strong class="text-blue-600">${summary.total}</strong>`;
        const datHtml = `<strong class="text-blue-600">${summary.dat}</strong>`;
        const chuaDatHtml = `<strong class="text-red-600">${summary.total - summary.dat}</strong>`;
        const dtHtml = `<strong class="text-blue-600">${summary.doanhThuCount}</strong>`;
        const slHtml = `<strong class="text-blue-600">${summary.soLuongCount}</strong>`;

        return `(<span class="font-normal text-gray-500">Tổng:</span> ${totalHtml}, 
                <span class="font-normal text-gray-500">Đạt:</span> ${datHtml}, 
                <span class="font-normal text-gray-500">Chưa đạt:</span> ${chuaDatHtml}, 
                <span class="font-normal text-gray-500">DT:</span> ${dtHtml}, 
                <span class="font-normal text-gray-500">SL:</span> ${slHtml})`;
    },
    
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

    // === HÀM ĐƯỢC NÂNG CẤP (v2.4) ===
    displayCompetitionResultsFromLuyKe: (text, viewType = 'summary') => {
        const container = document.getElementById('luyke-competition-infographic-container');
        if (!container) return;

        if (!text || !text.trim()) {
            container.innerHTML = '<p class="text-gray-500 font-bold col-span-2">Vui lòng dán "Data lũy kế" ở tab Data để xem chi tiết.</p>';
            return;
        }

        appState.competitionData = services.parseCompetitionDataFromLuyKe(text);
        
        // Thêm trường hoanThanhValue để dễ dàng sắp xếp
        const data = appState.competitionData.map(item => {
            const hoanThanhValue = (parseFloat(String(item.hoanThanh).replace('%', '')) || 0);
            return { ...item, hoanThanhValue: hoanThanhValue };
        });

        if (data.length === 0) {
            container.innerHTML = '<p class="text-yellow-600 font-bold col-span-2">Không tìm thấy dữ liệu thi đua trong văn bản đã dán.</p>';
            return;
        }
        
        const summaryEl = document.getElementById('luyke-competition-summary');
        if (summaryEl) {
             // Cập nhật bộ đếm tổng thể bằng hàm mới
             summaryEl.innerHTML = uiLuyke.renderCompetitionSummaryCounter(data);
        }
        
        container.innerHTML = uiLuyke.renderLuykeCompetitionInfographic(data, viewType);
    },
    
    // === HÀM RENDER INFOGRAPHIC (v2.4) ===
    renderLuykeCompetitionInfographic(data, viewType) {
        
        const sortData = (items) => {
            // Fix #2: Sắp xếp giảm dần theo tỷ lệ hoàn thành
            return [...items].sort((a, b) => b.hoanThanhValue - a.hoanThanhValue);
        };

        const renderRow = (items, title, titleClass) => {
            if (items.length === 0) return '';
    
            const today = new Date();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const daysRemaining = Math.max(daysInMonth - today.getDate(), 1); // Tránh chia cho 0
            
            const sortedItems = sortData(items);

            // Fix #5: Tính toán bộ đếm cho tiêu đề nhóm
            const achievedCount = items.filter(item => item.hoanThanhValue >= 100).length;
            const unachievedCount = items.length - achievedCount;
            
            // Fix #5 & #7: Áp dụng CSS class cho bộ đếm nhóm
            const achievedHtml = `<strong class="text-blue-600">${achievedCount}</strong>`;
            const unachievedHtml = `<strong class="text-red-600">${unachievedCount}</strong>`;
            const counterText = `<span class="text-sm font-normal text-gray-700">(Đạt: ${achievedHtml} / Cần nỗ lực: ${unachievedHtml})</span>`;
    
            const itemsHtml = sortedItems.map(item => {
                const hoanThanhValue = item.hoanThanhValue;
                
                // Fix #3: Cải tiến logic mục tiêu ngày
                let dailyTarget = 0;
                const targetRemaining = item.target - item.luyKe;
                
                if (item.target > 0 && targetRemaining > 0 && daysRemaining > 0) {
                    dailyTarget = targetRemaining / daysRemaining;
                }
                
                const targetClass = dailyTarget > 0 ? 'text-red-600' : 'text-green-600';
    
                return `
                    <div class="tdv-item-card">
                        <p class="tdv-item-card__title">${item.name}</p>
                        <div class="tdv-progress-bar-container">
                            <div class="tdv-progress-bar ${hoanThanhValue >= 100 ? 'tdv-progress-bar--blue' : 'tdv-progress-bar--yellow'}" style="width: ${Math.min(hoanThanhValue, 100)}%;"></div>
                            <span class="tdv-progress-bar__text">${uiComponents.formatPercentage(hoanThanhValue / 100)}</span>
                        </div>
                        <div class="tdv-item-card__details">
                            <span>Lũy kế: <strong>${uiComponents.formatNumberOrDash(item.luyKe)}</strong></span>
                            <span>Target: <strong>${uiComponents.formatNumberOrDash(item.target)}</strong></span>
                            <span class="font-bold ${targetClass}">Mục tiêu/ngày: <strong>${uiComponents.formatNumberOrDash(dailyTarget)}</strong></span>
                        </div>
                    </div>
                `;
            }).join('');
    
            return `
                <div class="tdv-row" data-capture-group="comp-row-${title.replace(/\s/g, '-')}" data-capture-columns="2">
                    <h3 class="tdv-row-title ${titleClass}">${title} ${counterText}</h3>
                    <div class="tdv-row-body grid grid-cols-2 gap-4">${itemsHtml}</div>
                </div>
            `;
        };
    
        if (viewType === 'summary') { // Chế độ xem theo Phân Loại (Mặc định)
            const dataDoanhThu = data.filter(d => d.type === 'doanhThu');
            const dataSoLuong = data.filter(d => d.type === 'soLuong');
            return `
                <div class="tdv-rows-container space-y-6">
                    ${renderRow(dataDoanhThu, 'Thi Đua Doanh Thu', 'tdv-row-title--prize')}
                    ${renderRow(dataSoLuong, 'Thi Đua Số Lượng', 'tdv-row-title--soon-prize')}
                </div>
            `;
        } else { // Chế độ xem theo Tỷ Lệ Hoàn Thành (completion)
            const completed = data.filter(d => d.hoanThanhValue >= 100);
            const pending = data.filter(d => d.hoanThanhValue < 100);
            return `
                <div class="tdv-rows-container space-y-6">
                    ${renderRow(completed, 'Các Chương Trình Đã Đạt Mục Tiêu', 'tdv-row-title--prize')}
                    ${renderRow(pending, 'Các Chương Trình Cần Nỗ Lực Thêm', 'tdv-row-title--effort')}
                </div>
            `;
        }
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
            return direction === 'asc' ? valA - valB : valB - valA;
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

        // --- THẺ 8: Tăng/giảm cùng kỳ ---
        const formatComparisonPercentage = (percentageString) => {
            if (!percentageString || typeof percentageString !== 'string') return 'N/A';
            const numericValue = parseFloat(percentageString.replace('%', ''));
            if (isNaN(numericValue)) return 'N/A';
            return Math.round(numericValue) + '%';
        };
        const formattedDtPercentage = formatComparisonPercentage(comparisonData.percentage);
        const formattedLkPercentage = formatComparisonPercentage(luotKhachData.percentage);

        document.getElementById('luyke-kpi-dtck-main').textContent = formattedDtPercentage;
        document.getElementById('luyke-kpi-dtck-sub').innerHTML = `Doanh thu: <span class="font-bold">${uiComponents.formatNumber(comparisonData.value || 0)} | ${formattedDtPercentage}</span>`;
        document.getElementById('luyke-kpi-lkck-sub').innerHTML = `Lượt khách: <span class="font-bold">${uiComponents.formatNumber(luotKhachData.value || 0)} | ${formattedLkPercentage}</span>`;
    },

    renderLuykeCategoryDetailsTable: (data, numDays) => {
        const container = document.getElementById('luyke-category-details-content');
        const cardHeader = container.previousElementSibling;
        if (!container || !cardHeader || !data || !data.nganhHangChiTiet) { container.innerHTML = '<p class="text-gray-500 font-bold">Không có dữ liệu.</p>'; return; }
        
        const allItems = Object.keys(data.nganhHangChiTiet).sort();
        const visibleItems = settingsService.loadCategoryViewSettings(allItems);
        
        if (Object.keys(data.nganhHangChiTiet).length === 0) {
            container.innerHTML = '<p class="text-gray-500 font-bold">Không có dữ liệu.</p>'; return;
        }

        const sortState = appState.sortState.luyke_nganhhang || { key: 'revenue', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = Object.entries(data.nganhHangChiTiet)
            .map(([name, values]) => ({ name, ...values }))
            .filter(item => visibleItems.includes(item.name)) // Lọc theo cài đặt
            .sort((a, b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key]);

        const totals = sortedData.reduce((acc, item) => {
            acc.quantity += item.quantity;
            acc.revenue += item.revenue;
            return acc;
        }, { quantity: 0, revenue: 0 });

        if (!cardHeader.querySelector('.settings-trigger-btn')) {
            cardHeader.classList.add('flex', 'items-center', 'justify-between');
            cardHeader.innerHTML = `<span>NGÀNH HÀNG CHI TIẾT</span>` + uiComponents.renderSettingsButton('lk-cat');
            setTimeout(() => {
                document.getElementById('settings-btn-lk-cat').addEventListener('click', () => {
                    uiLuyke._showCategorySettingsModal(data);
                });
            }, 0);
        }

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
        const cardHeader = container.previousElementSibling;
        if (!container || !cardHeader || !data || !data.qdc) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return; }
        
        const qdcData = Object.entries(data.qdc).map(([key, value]) => ({ id: key, ...value }));
        const allItems = qdcData.map(item => item.name);
        const visibleItems = settingsService.loadQdcViewSettings(allItems);

        const sortState = appState.sortState.luyke_qdc || { key: 'dtqd', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...qdcData]
            .filter(item => visibleItems.includes(item.name))
            .sort((a,b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key]);
        
        if (!cardHeader.querySelector('.settings-trigger-btn')) {
            cardHeader.classList.add('flex', 'items-center', 'justify-between');
            cardHeader.innerHTML = `<span>NHÓM HÀNG QUY ĐỔI CAO</span>` + uiComponents.renderSettingsButton('lk-qdc');
            setTimeout(() => {
                document.getElementById('settings-btn-lk-qdc').addEventListener('click', () => {
                    uiLuyke._showQdcSettingsModal(data);
                });
            }, 0);
        }

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
        const cardHeader = container.previousElementSibling;

        if (!container || !cardHeader || !data || !goals) { 
            if(container) container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; 
            return; 
        }
        
        const allItemsConfig = settingsService.loadEfficiencyViewSettings();
        
        const goalKeyMap = {
            pctPhuKien: 'phanTramPhuKien',
            pctGiaDung: 'phanTramGiaDung',
            pctMLN: 'phanTramMLN',
            pctSim: 'phanTramSim',
            pctVAS: 'phanTramVAS',
            pctBaoHiem: 'phanTramBaoHiem'
        };

        const allItems = allItemsConfig
            .filter(item => item.id.startsWith('pct'))
            .map(config => ({
                ...config,
                value: data[config.id],
                target: goals[goalKeyMap[config.id]]
            }));
        
        const createRow = (label, value, target) => {
            const isBelow = value < ((target || 0) / 100); 
            
            return `<tr class="border-t">
                <td class="px-4 py-2 font-semibold text-gray-800">${label}</td>
                <td class="px-4 py-2 text-right font-bold text-lg ${isBelow ? 'cell-performance is-below' : 'text-green-600'}">${uiComponents.formatPercentage(value || 0)}</td>
                <td class="px-4 py-2 text-right text-gray-600">${target || 0}%</td>
            </tr>`;
        };
        
        if (!cardHeader.querySelector('.settings-trigger-btn')) {
            cardHeader.classList.add('flex', 'items-center', 'justify-between');
            cardHeader.innerHTML = `<span>HIỆU QUẢ KHAI THÁC SIÊU THỊ</span>` + uiComponents.renderSettingsButton('lk-eff');
            
            setTimeout(() => {
                document.getElementById('settings-btn-lk-eff').addEventListener('click', () => {
                    uiLuyke._showEfficiencySettingsModal();
                });
            }, 0);
        }
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm table-bordered">
                    <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                        <tr>
                            <th class="px-4 py-3 text-left">Chỉ số</th>
                            <th class="px-4 py-3 text-right">Thực hiện</th>
                            <th class="px-4 py-3 text-right">Mục tiêu</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allItems
                            .filter(item => item.visible) // Lọc theo cài đặt hiển thị
                            .map(item => createRow(item.label, item.value, item.target))
                            .join('')}
                    </tbody>
                </table>
            </div>`;
    },

    updateLuykeSupermarketTitle: (warehouse, date) => {
        const titleEl = document.getElementById('luyke-supermarket-title');
        if (titleEl) titleEl.textContent = `Báo cáo lũy kế ${warehouse ? 'kho ' + warehouse : 'toàn bộ'} - Tính đến ${date.toLocaleDateString('vi-VN')}`;
    },
};