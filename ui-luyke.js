// Version 2.19 - Add sorting to Luy Ke Efficiency table
// Version 2.18 - Remove dedicated capture button from employee detail view
// Version 2.11 - Critical Fix: Restore all missing functions and add renderLuykeEmployeeDetail
// MODULE: UI LUY KE
// Chứa các hàm render giao diện cho tab "Sức khỏe Siêu thị (Lũy kế)".

import { appState } from './state.js';
import { services } from './services.js';
import { utils } from './utils.js';
import { uiComponents } from './ui-components.js';
import { settingsService } from './modules/settings.service.js';
import { highlightService } from './modules/highlight.service.js';

export const uiLuyke = {
    // === CÁC HÀM MỞ MODAL CÀI ĐẶT CHO TỪNG BẢNG ===
    _showEfficiencySettingsModal() {
        const modal = document.getElementById('selection-modal');
        if (!modal) return;

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
    
    // === START: MODIFIED FUNCTION (TASK 1 & 3) ===
    /**
     * Render 2 biểu đồ thống kê theo ngày.
     * @param {Array} dailyStats - Dữ liệu gốc.
     * @param {number | 'all' | Array} filterParam - Số ngày, 'all', hoặc mảng dữ liệu đã lọc.
     */
    _renderDailyCharts(dailyStats, filterParam = 7) {
        if (!dailyStats || dailyStats.length === 0) return;

        let filteredData;
        if (typeof filterParam === 'number') {
            filteredData = dailyStats.slice(-filterParam); // Lọc theo số ngày 
        } else if (filterParam === 'all') {
            filteredData = dailyStats; // Lấy tất cả 
        } else if (Array.isArray(filterParam)) {
            filteredData = filterParam; // Sử dụng mảng đã lọc (cho Tùy chọn) 
        } else {
            filteredData = dailyStats.slice(-7); // Mặc định 7 ngày 
        }

        const labels = filteredData.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })); 
        const dtqdData = filteredData.map(d => d.convertedRevenue / 1000000); 
        const tlqdData = filteredData.map(d => (d.revenue > 0 ? (d.convertedRevenue / d.revenue) - 1 : 0)); 

        const chartOptions = (title) => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, 
                title: { display: false }, // Tắt tiêu đề mặc định, vì đã có tiêu đề card 
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw; 
                            if (title.includes('Tỷ lệ')) {
                                return `Tỷ lệ: ${uiComponents.formatPercentage(value)}`; 
                            }
                            return `DTQĐ: ${uiComponents.formatRevenue(value * 1000000)} Tr`; 
                        }
                    }
                },
                datalabels: {
                    anchor: 'end', 
                    align: 'end', 
                    formatter: (value) => {
                        if (title.includes('Tỷ lệ')) {
                            return uiComponents.formatPercentage(value); 
                        }
                        return uiComponents.formatRevenue(value * 1000000); 
                    },
                    color: '#4b5563', 
                    font: { weight: 'bold', size: 10 } 
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grace: '10%' // (Task 1) Thêm 10% khoảng đệm 
                }
            }
        });

        // Biểu đồ Doanh thu Quy đổi
        const dtqdCtx = document.getElementById('lk-daily-dtqd-chart')?.getContext('2d'); 
        if (dtqdCtx) {
            if (appState.charts['lk-daily-dtqd-chart']) {
                appState.charts['lk-daily-dtqd-chart'].destroy(); 
            }
            appState.charts['lk-daily-dtqd-chart'] = new Chart(dtqdCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Doanh thu QĐ', 
                        data: dtqdData, 
                        backgroundColor: '#3b82f6', 
                        borderRadius: 4, 
                    }]
                },
                options: chartOptions('Doanh thu QĐ theo ngày (Tr)'), 
                plugins: [ChartDataLabels] 
            });
        }

        // Biểu đồ Tỷ lệ Quy đổi
        const tlqdCtx = document.getElementById('lk-daily-tlqd-chart')?.getContext('2d'); 
        if (tlqdCtx) {
            if (appState.charts['lk-daily-tlqd-chart']) {
                appState.charts['lk-daily-tlqd-chart'].destroy(); 
            }
            appState.charts['lk-daily-tlqd-chart'] = new Chart(tlqdCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Tỷ lệ QĐ', 
                        data: tlqdData, 
                        backgroundColor: '#16a34a', 
                        borderRadius: 4, 
                    }]
                },
                options: chartOptions('Tỷ lệ QĐ theo ngày'), 
                plugins: [ChartDataLabels] 
            });
        }
    },
    // === END: MODIFIED FUNCTION ===

    // === START: NEW FUNCTION (TASK 3) ===
    /**
     * Render nội dung cho modal chi tiết khách hàng.
     * @param {Object} detailData - Dữ liệu chi tiết của nhân viên.
     */
    _renderCustomerDetailModalContent(detailData) {
        const { byCustomer, mucTieu } = detailData; 
        const conversionRateTarget = (mucTieu?.phanTramQD || 0) / 100; 
        const container = document.getElementById('customer-detail-list-container'); 
        if (!container) return; 

        if (!byCustomer || byCustomer.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500 mt-4 text-center">Không có đơn hàng nào.</p>'; 
            return;
        }

        const renderAccordion = (data) => data.map((customer, index) => {
            const qdClass = customer.conversionRate >= conversionRateTarget ? 'qd-above-target' : 'qd-below-target'; 
        
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

        container.innerHTML = renderAccordion(byCustomer);
    },
    // === END: NEW FUNCTION ===

    // === START: NEW FUNCTION (TASK 4) ===
    /**
     * Render nội dung cho modal chi tiết chưa xuất.
     * @param {Object} detailData - Dữ liệu chi tiết của nhân viên.
     */
    _renderUnexportedDetailModalContent(detailData) {
        const { unexportedDetails } = detailData; 
        const container = document.getElementById('unexported-detail-list-container'); 
        if (!container) return; 

        if (!unexportedDetails || unexportedDetails.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500 mt-4 text-center">Không có đơn hàng nào chưa xuất.</p>'; 
            return;
        }

        const renderAccordion = (data) => data.map((group, index) => {
            const productListHtml = group.products.map(p => `
                <tr class="border-b last:border-b-0">
                    <td class="py-1 pr-2">${p.name}</td>
                    <td class="py-1 px-2 text-right">SL: <strong>${p.sl}</strong></td> 
                    <td class="py-1 pl-2 text-right">DTQĐ: <strong>${uiComponents.formatRevenue(p.dtqd, 1)}</strong></td> 
                </tr>
            `).join('');
            
            const tableContent = `<table class="min-w-full text-xs product-list-table"><tbody>${productListHtml}</tbody></table>`; 
            
            const detailContent = group.products.length > 8
                ? `<div class="product-list-scrollable">${tableContent}</div>` 
                : tableContent; 

            return `
             <details class="bg-white rounded-lg shadow-sm border border-gray-200 mb-2">
                <summary>
                    <span class="customer-name-small">${index + 1}. ${group.name}</span> 
                    <div class="order-metrics">
                        <span>SL: <strong>${group.totalSL}</strong></span> 
                        <span>DTQĐ: <strong class="text-blue-600">${uiComponents.formatRevenue(group.totalDTQD, 1)} Tr</strong></span> 
                    </div>
                    <span class="accordion-arrow">▼</span> 
                </summary>
                <div class="border-t border-gray-200 p-3 bg-gray-50">
                    ${detailContent} 
                 </div>
            </details>
            `; 
        }).join('');

        container.innerHTML = renderAccordion(unexportedDetails);
    },
    // === END: NEW FUNCTION ===

    // === START: MODIFIED FUNCTION (v2.17) ===
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

        // === START: (Task 3) Thêm customFilteredDailyStats: null ===
        appState.currentEmployeeDetailData = { ...detailData, customFilteredDailyStats: null }; 
        // === END: (Task 3) ===

        const { summary, topProductGroups, categoryChartData, byCustomer, dailyStats, unexportedDetails } = detailData; 
        const { mucTieu } = employeeData; 
        const conversionRateTarget = (mucTieu?.phanTramQD || 0) / 100; 

        const renderKpiCards = () => {
             const conversionRateClass = summary.conversionRate >= conversionRateTarget ? 'is-positive' : 'is-negative'; 
            
             // (Task 3 & 4) Thêm ID và class cursor-pointer
            return `
            <div class="rt-infographic-summary mb-6">
                <div class="rt-infographic-summary-card"><div class="label">Tổng DT Thực</div><div class="value">${uiComponents.formatRevenue(summary.totalRealRevenue, 1)}</div></div>
                <div class="rt-infographic-summary-card"><div class="label">Tổng DTQĐ</div><div class="value">${uiComponents.formatRevenue(summary.totalConvertedRevenue, 1)}</div></div> 
                <div class="rt-infographic-summary-card"><div class="label">Tỷ lệ QĐ</div><div class="value ${conversionRateClass}">${uiComponents.formatPercentage(summary.conversionRate)}</div></div>
                
                <div id="lk-detail-unexported-trigger" class="rt-infographic-summary-card cursor-pointer hover:shadow-xl hover:bg-blue-50">
                    <div class="label">DT Chưa Xuất</div>
                    <div class="value">${uiComponents.formatRevenue(summary.unexportedRevenue, 1)}</div> 
                </div>
                
                <div id="lk-detail-customer-trigger" class="rt-infographic-summary-card cursor-pointer hover:shadow-xl hover:bg-blue-50">
                    <div class="label">Tổng Đơn Hàng</div>
                    <div class="value">${summary.totalOrders}</div> 
                </div>

                <div class="rt-infographic-summary-card"><div class="label">SL Đơn Bán Kèm</div><div class="value">${summary.bundledOrderCount}</div></div> 
            </div>
            `;
        };

        const renderTopGroupsAsProgressBars = () => {
            const top5Groups = topProductGroups.slice(0, 5); 
            if (!top5Groups || top5Groups.length === 0) return '<p class="text-sm text-gray-500">Không có doanh thu.</p>'; 
            
            const maxRevenue = top5Groups[0]?.realRevenue || 0; 
            
            return top5Groups.map(group => {
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
        
        // === START: (Task 3) Cập nhật HTML bộ lọc ngày ===
        // === START: SỬA LỖI (Loại bỏ nút chụp riêng) ===
        const headerHtml = `
            <div class="mb-4 flex justify-start items-center">
                <button class="back-to-summary-btn text-blue-600 hover:underline font-semibold">‹ Quay lại bảng tổng hợp</button>
            </div>
            <div id="dtnv-lk-capture-area" class="preset-mobile-capture-area">
                <div class="p-4 mb-6 bg-white text-gray-800 rounded-lg shadow-lg border luyke-detail-header">
                    <h3>${employeeData.hoTen} - ${employeeData.maNV}</h3> 
                </div>
                
                <div>
                    ${renderKpiCards()}
                </div>

                <div id="lk-daily-chart-filters" class="flex items-center justify-center flex-wrap gap-2 mb-4"> 
                    <span class="text-sm font-medium">Xem theo:</span> 
                    <button id="lk-daily-filter-all" class="lk-daily-filter-btn px-3 py-1 text-xs font-medium rounded-full bg-gray-200" data-days="all">Tất cả</button> 
                    <button class="lk-daily-filter-btn px-3 py-1 text-xs font-medium rounded-full bg-gray-200" data-days="3">3 ngày</button> 
                    <button class="lk-daily-filter-btn px-3 py-1 text-xs font-medium rounded-full bg-gray-200" data-days="5">5 ngày</button> 
                    <button class="lk-daily-filter-btn px-3 py-1 text-xs font-medium rounded-full bg-blue-600 text-white" data-days="7">7 ngày</button> 
                    <button class="lk-daily-filter-btn px-3 py-1 text-xs font-medium rounded-full bg-gray-200" data-days="10">10 ngày</button> 
                    <button id="lk-daily-filter-custom" class="lk-daily-filter-btn px-3 py-1 text-xs font-medium rounded-full bg-gray-200">Tùy chọn...</button> 
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"> 
                    <div class="bg-white p-4 rounded-lg shadow-md border" style="height: 300px;">
                        <h4 class="text-md font-bold text-gray-700 mb-2 text-center">Doanh thu QĐ theo ngày (Tr)</h4> 
                        <div class="relative h-full w-full" style="height: 250px;"><canvas id="lk-daily-dtqd-chart"></canvas></div> 
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow-md border" style="height: 300px;">
                        <h4 class="text-md font-bold text-gray-700 mb-2 text-center">Tỷ lệ QĐ theo ngày</h4> 
                        <div class="relative h-full w-full" style="height: 250px;"><canvas id="lk-daily-tlqd-chart"></canvas></div> 
                    </div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"> 
                    
                     <div class="bg-white p-4 rounded-lg shadow-md border">
                        <h4 class="text-md font-bold text-gray-700 border-b pb-2 mb-3">Top 5 Nhóm Hàng Doanh Thu Cao</h4> 
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
            </div>`;
        // === END: SỬA LỖI (Loại bỏ nút chụp riêng) ===

        detailContainer.innerHTML = headerHtml;

        // === START: (Task 3) Cập nhật logic gọi biểu đồ ===
        // (Task 1) Gọi hàm render biểu đồ hàng ngày, đọc từ filter
        const activeFilterBtn = document.querySelector('#lk-daily-chart-filters .lk-daily-filter-btn.bg-blue-600'); 
        let filterParam = activeFilterBtn ? activeFilterBtn.dataset.days : '7'; 
        
        // Chuyển đổi 'all' hoặc số
        if (filterParam === 'all') {
             filterParam = 'all'; 
        } else if (!isNaN(parseInt(filterParam, 10))) {
            filterParam = parseInt(filterParam, 10); 
        } else {
            // Trường hợp này là nút "Tùy chọn" đang active, dữ liệu đã được lọc sẵn
            filterParam = appState.currentEmployeeDetailData.customFilteredDailyStats || dailyStats.slice(-7); 
        }
        
        uiLuyke._renderDailyCharts(dailyStats, filterParam); 
        // === END: (Task 3) Cập nhật logic ===

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
                        // (Task 2) Thêm nhiều màu
                        backgroundColor: topData.map(() => utils.getRandomBrightColor()), 
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
                        y: { 
                            beginAtZero: true, 
                            grace: '10%' // (Task 1) Thêm 10% khoảng đệm 
                        } 
                     }
                },
                plugins: [ChartDataLabels] 
            });
        }
    },
    // === END: MODIFIED FUNCTION ===

    renderCompetitionSummaryCounter: (data) => {
        // === START: Dọn dẹp State (Task 3 & 4) ===
        appState.currentEmployeeDetailData = null; 
        // === END: Dọn dẹp State ===
        const summary = {
            total: data.length, 
            dat: data.filter(d => d.hoanThanhValue >= 100).length, 
            doanhThuCount: data.filter(d => d.type === 'doanhThu').length, 
            soLuongCount: data.filter(d => d.type === 'soLuong').length, 
        };
        
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
    
    // === START: MODIFIED FUNCTION (v2.15) ===
    displayHealthKpiTable: (pastedData, goals) => {
        // === START: Dọn dẹp State (Task 3 & 4) ===
        appState.currentEmployeeDetailData = null; 
        // === END: Dọn dẹp State ===
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
                phanTramGop: supermarketReport.doanhThu > 0 ? 
supermarketReport.doanhThuTraGop / supermarketReport.doanhThu : 0,
                dtThucDuKien: 0, // <-- SỬA LỖI (v2.15) 
                dtQdDuKien: 0,   // <-- SỬA LỖI (v2.15) 
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
    // === END: MODIFIED FUNCTION ===

    displayCompetitionResultsFromLuyKe: (text, viewType = 'summary') => {
        // === START: Dọn dẹp State (Task 3 & 4) ===
        appState.currentEmployeeDetailData = null; 
        // === END: Dọn dẹp State ===
        const container = document.getElementById('luyke-competition-infographic-container'); 
        if (!container) return; 

        if (!text || !text.trim()) {
            container.innerHTML = '<p class="text-gray-500 font-bold col-span-2">Vui lòng dán "Data lũy kế" ở tab Data để xem chi tiết.</p>'; 
            return;
        }

        appState.competitionData = services.parseCompetitionDataFromLuyKe(text); 
        
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
             summaryEl.innerHTML = uiLuyke.renderCompetitionSummaryCounter(data); 
        }
        
        container.innerHTML = uiLuyke.renderLuykeCompetitionInfographic(data, viewType); 
    },
    
    renderLuykeCompetitionInfographic(data, viewType) {
        
        const sortData = (items) => {
            return [...items].sort((a, b) => b.hoanThanhValue - a.hoanThanhValue); 
        };

        const renderRow = (items, title, titleClass) => {
            if (items.length === 0) return ''; 
    
            const today = new Date(); 
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(); 
            const daysRemaining = Math.max(daysInMonth - today.getDate(), 1); 
            
            const sortedItems = sortData(items); 

            const achievedCount = items.filter(item => item.hoanThanhValue >= 100).length; 
            const unachievedCount = items.length - achievedCount; 
            
            const achievedHtml = `<strong class="text-blue-600">${achievedCount}</strong>`; 
            const unachievedHtml = `<strong class="text-red-600">${unachievedCount}</strong>`; 
            const counterText = `<span class="text-sm font-normal text-gray-700">(Đạt: ${achievedHtml} / Cần nỗ lực: ${unachievedHtml})</span>`; 
    
            const itemsHtml = sortedItems.map(item => {
                const hoanThanhValue = item.hoanThanhValue; 
                
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
    
        if (viewType === 'summary') {
            const dataDoanhThu = data.filter(d => d.type === 'doanhThu'); 
            const dataSoLuong = data.filter(d => d.type === 'soLuong'); 
            return `
                <div class="tdv-rows-container space-y-6">
                    ${renderRow(dataDoanhThu, 'Thi Đua Doanh Thu', 'tdv-row-title--prize')} 
                    ${renderRow(dataSoLuong, 'Thi Đua Số Lượng', 'tdv-row-title--soon-prize')} 
                </div>
            `;
        } else {
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
        // === START: Dọn dẹp State (Task 3 & 4) ===
        appState.currentEmployeeDetailData = null; 
        // === END: Dọn dẹp State ===
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

    // === START: MODIFIED FUNCTION (v2.13) ===
    renderLuykeKpiCards: (luykeData, comparisonData, luotKhachData, masterReportDataLuyke, goals, competitionSummary) => {
        // === START: Dọn dẹp State (Task 3 & 4) ===
        appState.currentEmployeeDetailData = null; 
        // === END: Dọn dẹp State ===
        const { dtThucLK, dtQdLK, dtGop, phanTramQd, phanTramGop, phanTramTargetThuc, phanTramTargetQd, dtThucDuKien, dtQdDuKien } = luykeData; 

        document.getElementById('luyke-kpi-dt-thuc-main').textContent = uiComponents.formatNumber((dtThucLK || 0) / 1000000, 0); 
        document.getElementById('luyke-kpi-dt-thuc-sub1').innerHTML = `DK: <span class="font-bold">${uiComponents.formatNumber((dtThucDuKien || 0) / 1000000, 0)}</span> / Target: <span class="font-bold">${uiComponents.formatNumber(goals?.doanhThuThuc || 0)}</span>`; 

        document.getElementById('luyke-kpi-dt-qd-main').textContent = uiComponents.formatNumber((dtQdLK || 0) / 1000000, 0); 
        document.getElementById('luyke-kpi-dt-qd-sub1').innerHTML = `DK: <span class="font-bold">${uiComponents.formatNumber((dtQdDuKien || 0) / 1000000, 0)}</span> / Target: <span class="font-bold">${uiComponents.formatNumber(goals?.doanhThuQD || 0)}</span>`; 
        
        document.getElementById('luyke-kpi-ht-target-qd-main').textContent = uiComponents.formatPercentage(phanTramTargetQd || 0); 
        document.getElementById('luyke-kpi-ht-target-thuc-sub').innerHTML = `DT Thực: <span class="font-bold">${uiComponents.formatPercentage(phanTramTargetThuc || 0)}</span>`; 

        document.getElementById('luyke-kpi-tl-qd-main').textContent = uiComponents.formatPercentage(phanTramQd || 0); 
        document.getElementById('luyke-kpi-tl-qd-sub').innerHTML = `Mục tiêu: <span class="font-bold">${uiComponents.formatNumber(goals?.phanTramQD || 0)}%</span>`; 
        document.getElementById('luyke-kpi-dt-tc-main').textContent = uiComponents.formatNumber((dtGop || 0) / 1000000, 0); 
        document.getElementById('luyke-kpi-dt-tc-sub').innerHTML = `% thực trả chậm: <span class="font-bold">${uiComponents.formatPercentage(phanTramGop || 0)}</span>`; 
        
        const chuaXuatQuyDoi = masterReportDataLuyke.reduce((sum, item) => sum + (item.doanhThuQuyDoiChuaXuat || 0), 0); 
        
        // (Task 4) Thêm ID và class vào thẻ DT Chưa Xuất
        const dtqdChuaXuatCard = document.getElementById('luyke-kpi-dtqd-chua-xuat-main')?.closest('.kpi-card'); 
        if (dtqdChuaXuatCard) {
            dtqdChuaXuatCard.id = 'lk-summary-unexported-trigger'; 
            dtqdChuaXuatCard.classList.add('cursor-pointer', 'hover:shadow-xl'); 
        }
        document.getElementById('luyke-kpi-dtqd-chua-xuat-main').textContent = uiComponents.formatNumber(chuaXuatQuyDoi / 1000000, 0); 
        
        const tyLeThiDuaDat = competitionSummary.total > 0 ? competitionSummary.dat / competitionSummary.total : 0; 
        document.getElementById('luyke-kpi-thidua-main').textContent = uiComponents.formatPercentage(tyLeThiDuaDat); 
        document.getElementById('luyke-kpi-thidua-sub').innerHTML = `<span class="font-bold">${competitionSummary.dat}/${competitionSummary.total}</span> Ngành`; 

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
    // === END: MODIFIED FUNCTION ===

    renderLuykeCategoryDetailsTable: (data, numDays) => {
        // === START: Dọn dẹp State (Task 3 & 4) ===
        appState.currentEmployeeDetailData = null; 
        // === END: Dọn dẹp State ===
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
            .filter(item => visibleItems.includes(item.name)) 
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
        // === START: Dọn dẹp State (Task 3 & 4) ===
        appState.currentEmployeeDetailData = null; 
        // === END: Dọn dẹp State ===
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
        // === START: Dọn dẹp State (Task 3 & 4) ===
        appState.currentEmployeeDetailData = null; 
        // === END: Dọn dẹp State ===
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
        
        // === START: THAY ĐỔI ===
        // 1. Thêm data-table-type
        // 2. Thêm logic sortState
        // 3. Thêm hàm headerClass
        // 4. Thêm class/data-sort vào <th>
        // 5. Sắp xếp allItems
        
        const sortStateKey = 'luyke_efficiency';
        const sortState = appState.sortState[sortStateKey] || { key: 'label', direction: 'asc' };
        const { key, direction } = sortState;
        
        // Sắp xếp dữ liệu
        const sortedItems = [...allItems].sort((a, b) => {
            let valA, valB;
            
            if (key === 'label') {
                valA = a.label || '';
                valB = b.label || '';
                return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else if (key === 'value') {
                valA = a.value || 0;
                valB = b.value || 0;
            } else { // key === 'target'
                valA = (a.target || 0) / 100;
                valB = (b.target || 0) / 100;
            }
            
            return direction === 'asc' ? valA - valB : valB - valA;
        });
        
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
        
        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`; 
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm table-bordered" data-table-type="${sortStateKey}">
                    <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold"> 
                        <tr>
                             <th class="${headerClass('label')} text-left" data-sort="label">Chỉ số <span class="sort-indicator"></span></th>
                            <th class="${headerClass('value')} text-right" data-sort="value">Thực hiện <span class="sort-indicator"></span></th>
                             <th class="${headerClass('target')} text-right" data-sort="target">Mục tiêu <span class="sort-indicator"></span></th> 
                        </tr>
                     </thead>
                    <tbody>
                        ${sortedItems // Dùng sortedItems
                             .filter(item => item.visible) // Lọc theo cài đặt hiển thị 
                            .map(item => createRow(item.label, item.value, item.target)) 
                            .join('')}
                    </tbody>
                </table>
             </div>`; 
        // === END: THAY ĐỔI ===
    },

    updateLuykeSupermarketTitle: (warehouse, date) => {
        // === START: Dọn dẹp State (Task 3 & 4) ===
        appState.currentEmployeeDetailData = null; 
        // === END: Dọn dẹp State ===
        const titleEl = document.getElementById('luyke-supermarket-title'); 
        if (titleEl) titleEl.textContent = `Báo cáo lũy kế ${warehouse ? 'kho ' + warehouse : 'toàn bộ'} - Tính đến ${date.toLocaleDateString('vi-VN')}`; 
    },
};