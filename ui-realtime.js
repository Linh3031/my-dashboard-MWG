// Version 3.5 - Fix dependency error by importing uiSknv
// MODULE: UI REALTIME
// Chứa các hàm render giao diện cho tab "Doanh thu Realtime".

import { appState } from './state.js';
import { services } from './services.js';
import { utils } from './utils.js';
import { uiComponents } from './ui-components.js';
import { settingsService } from './modules/settings.service.js';
import { uiSknv } from './ui-sknv.js'; // <<< THÊM DÒNG NÀY ĐỂ SỬA LỖI

export const uiRealtime = {
    _showEfficiencySettingsModal() {
        const modal = document.getElementById('selection-modal');
        if (!modal) return;

        // Lấy danh sách đầy đủ các mục từ settings service
        const allItemsConfig = settingsService.loadEfficiencyViewSettings();
        
        const listContainer = document.getElementById('selection-modal-list');
        listContainer.innerHTML = allItemsConfig.map(item => `
            <div class="selection-item">
                <input type="checkbox" id="select-item-rt-eff-${item.id}" value="${item.id}" ${item.visible ? 'checked' : ''}>
                <label for="select-item-rt-eff-${item.id}">${item.label}</label>
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
                <input type="checkbox" id="select-item-rt-qdc-${item.replace(/[^a-zA-Z0-9]/g, '')}" value="${item}" ${savedSettings.includes(item) ? 'checked' : ''}>
                <label for="select-item-rt-qdc-${item.replace(/[^a-zA-Z0-9]/g, '')}">${item}</label>
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
                <input type="checkbox" id="select-item-rt-cat-${item.replace(/[^a-zA-Z0-9]/g, '')}" value="${item}" ${savedSettings.includes(item) ? 'checked' : ''}>
                <label for="select-item-rt-cat-${item.replace(/[^a-zA-Z0-9]/g, '')}">${item}</label>
            </div>
        `).join('');

        document.getElementById('selection-modal-title').textContent = 'Tùy chỉnh hiển thị Ngành hàng chi tiết';
        modal.dataset.settingType = 'categoryView';
        const searchInput = document.getElementById('selection-modal-search');
        if (searchInput) searchInput.value = '';
        
        uiComponents.toggleModal('selection-modal', true);
    },

    displayRealtimeEmployeeRevenueReport: (reportData, containerId, sortStateKey) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!reportData || reportData.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Không có dữ liệu doanh thu cho lựa chọn này.</p>';
            return;
        }
        let finalHTML = `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden" data-capture-group="1">
            <div class="p-4 header-group-1 text-gray-800">
                <h3 class="text-xl font-bold uppercase">Doanh thu nhân viên Realtime</h3>
                <p class="text-sm italic text-gray-600">(đơn vị tính: Triệu đồng)</p>
            </div>`;

        const groupedByDept = {};
        reportData.forEach(item => {
            const dept = item.boPhan;
            if (!groupedByDept[dept]) groupedByDept[dept] = [];
            groupedByDept[dept].push(item);
        });

        const departmentOrder = uiSknv._getSortedDepartmentList(reportData);

        departmentOrder.forEach(deptName => {
            if (groupedByDept[deptName]) {
                finalHTML += uiSknv.renderRevenueTableForDepartment(deptName, groupedByDept[deptName], sortStateKey);
            }
        });

        finalHTML += `</div>`;
        container.innerHTML = finalHTML;
    },

    renderRealtimeKpiCards: (data, settings) => {
        const { doanhThu, doanhThuQuyDoi, doanhThuChuaXuat, doanhThuQuyDoiChuaXuat, doanhThuTraGop, hieuQuaQuyDoi, tyLeTraCham } = data;
        const { goals: rtGoals } = settings;

        const targetDTT = parseFloat(rtGoals?.doanhThuThuc) || 0;
        const targetDTQD = parseFloat(rtGoals?.doanhThuQD) || 0;

        document.getElementById('rt-kpi-dt-thuc-main').textContent = uiComponents.formatNumber((doanhThu || 0) / 1000000, 1);
        document.getElementById('rt-kpi-dt-thuc-sub1').innerHTML = `% HT: <span class="font-bold">${uiComponents.formatPercentage(targetDTT > 0 ? ((doanhThu || 0) / 1000000) / targetDTT : 0)}</span> / Target ngày: <span class="font-bold">${uiComponents.formatNumber(targetDTT || 0)}</span>`;
        document.getElementById('rt-kpi-dt-thuc-sub2').innerHTML = `DT Chưa xuất: <span class="font-bold">${uiComponents.formatNumber((doanhThuChuaXuat || 0) / 1000000, 1)}</span>`;

        document.getElementById('rt-kpi-dt-qd-main').textContent = uiComponents.formatNumber((doanhThuQuyDoi || 0) / 1000000, 1);
        document.getElementById('rt-kpi-dt-qd-sub1').innerHTML = `% HT: <span class="font-bold">${uiComponents.formatPercentage(targetDTQD > 0 ? ((doanhThuQuyDoi || 0) / 1000000) / targetDTQD : 0)}</span> / Target ngày: <span class="font-bold">${uiComponents.formatNumber(targetDTQD || 0)}</span>`;
        document.getElementById('rt-kpi-dt-qd-sub2').innerHTML = `DTQĐ Chưa xuất: <span class="font-bold">${uiComponents.formatNumber((doanhThuQuyDoiChuaXuat || 0) / 1000000, 1)}</span>`;

        document.getElementById('rt-kpi-tl-qd-main').textContent = uiComponents.formatPercentage(hieuQuaQuyDoi);
        document.getElementById('rt-kpi-tl-qd-sub').innerHTML = `Mục tiêu: <span class="font-bold">${uiComponents.formatNumber(rtGoals?.phanTramQD || 0)}%</span>`;

        document.getElementById('rt-kpi-dt-tc-main').textContent = uiComponents.formatNumber((doanhThuTraGop || 0) / 1000000, 1);
        document.getElementById('rt-kpi-dt-tc-sub').innerHTML = `% thực trả chậm: <span class="font-bold">${uiComponents.formatPercentage(tyLeTraCham)}</span>`;
    },

    renderRealtimeChuaXuatTable: (reportData) => {
        const container = document.getElementById('realtime-unexported-revenue-content');
        if (!container) return;
        if (!reportData || reportData.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center font-bold">Không có đơn hàng nào chưa xuất trong ngày.</p>';
            return;
        }

        const sortState = appState.sortState.realtime_chuaxuat || { key: 'doanhThuQuyDoi', direction: 'desc' };
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

        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="realtime_chuaxuat">
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

    renderRealtimeCategoryDetailsTable: (data) => {
        const container = document.getElementById('realtime-category-details-content');
        const cardHeader = document.getElementById('realtime-category-title');
        if (!container || !cardHeader ||!data || !data.nganhHangChiTiet) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return; }
        
        const { nganhHangChiTiet } = data;
        const allItems = Object.keys(nganhHangChiTiet).sort();
        const visibleItems = settingsService.loadCategoryViewSettings(allItems);

        if (Object.keys(nganhHangChiTiet).length === 0) {
            container.innerHTML = '<p class="text-gray-500 font-bold">Không có dữ liệu.</p>'; return;
        }

        const sortState = appState.sortState.realtime_nganhhang || { key: 'revenue', direction: 'desc' };
        const { key, direction } = sortState;

        const sortedData = Object.entries(nganhHangChiTiet)
            .map(([name, values]) => ({ name, ...values }))
            .filter(item => visibleItems.includes(item.name)) // Lọc theo cài đặt
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 15)
            .sort((a, b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key]);

        if (!cardHeader.querySelector('.settings-trigger-btn')) {
            cardHeader.classList.add('flex', 'items-center', 'justify-between');
            cardHeader.innerHTML = `<span>NGÀNH HÀNG CHI TIẾT</span>` + uiComponents.renderSettingsButton('rt-cat');
            setTimeout(() => {
                document.getElementById('settings-btn-rt-cat').addEventListener('click', () => {
                    uiRealtime._showCategorySettingsModal(data);
                });
            }, 0);
        }

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="realtime_nganhhang">
            <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold"><tr>
                <th class="${headerClass('name')}" data-sort="name">Ngành hàng</th>
                <th class="${headerClass('quantity')} text-right header-highlight" data-sort="quantity">SL</th>
                <th class="${headerClass('revenue')} text-right header-highlight" data-sort="revenue">Doanh thu thực</th>
                <th class="${headerClass('revenueQuyDoi')} text-right" data-sort="revenueQuyDoi">Doanh thu QĐ</th>
                <th class="${headerClass('avgPrice')} text-right" data-sort="avgPrice">Đơn giá TB</th></tr>
            </thead>
            <tbody>${sortedData.map(item => `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-semibold">${item.name}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumber(item.quantity)}</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-600">${uiComponents.formatRevenue(item.revenue)}</td>
                    <td class="px-4 py-2 text-right font-bold text-purple-600">${uiComponents.formatRevenue(item.revenueQuyDoi)}</td>
                    <td class="px-4 py-2 text-right font-bold text-green-600">${uiComponents.formatRevenue(item.donGia)}</td>
                </tr>`).join('')}
            </tbody></table></div>`;
    },
    
    renderRealtimeEfficiencyTable: (data, goals) => {
        const container = document.getElementById('realtime-efficiency-content');
        const cardHeader = document.getElementById('realtime-efficiency-title');

        if (!container || !cardHeader || !data || !goals) {
            if (container) container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`;
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

        const allItems = allItemsConfig.map(config => ({
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
            cardHeader.innerHTML = `<span>HIỆU QUẢ KHAI THÁC</span>` + uiComponents.renderSettingsButton('rt-eff');
            
            setTimeout(() => {
                document.getElementById('settings-btn-rt-eff').addEventListener('click', () => {
                    uiRealtime._showEfficiencySettingsModal();
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
                            .filter(item => item.visible)
                            .map(item => createRow(item.label, item.value, item.target))
                            .join('')}
                    </tbody>
                </table>
            </div>`;
    },

    renderRealtimeQdcTable: (data) => {
        const container = document.getElementById('realtime-qdc-content');
        const cardHeader = document.getElementById('realtime-qdc-title');
        if (!container || !cardHeader || !data || !data.qdc) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return; }
        
        const qdcData = Object.entries(data.qdc).map(([key, value]) => ({ id: key, ...value }));
        const allItems = qdcData.map(item => item.name);
        const visibleItems = settingsService.loadQdcViewSettings(allItems);
        
        const sortState = appState.sortState.realtime_qdc || { key: 'dtqd', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...qdcData]
            .filter(item => visibleItems.includes(item.name)) // Lọc theo cài đặt
            .sort((a,b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key]);

        if (!cardHeader.querySelector('.settings-trigger-btn')) {
            cardHeader.classList.add('flex', 'items-center', 'justify-between');
            cardHeader.innerHTML = `<span>NHÓM HÀNG QUY ĐỔI CAO</span>` + uiComponents.renderSettingsButton('rt-qdc');
            setTimeout(() => {
                document.getElementById('settings-btn-rt-qdc').addEventListener('click', () => {
                    uiRealtime._showQdcSettingsModal(data);
                });
            }, 0);
        }

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="realtime_qdc">
            <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                <tr><th class="${headerClass('name')}" data-sort="name">Nhóm hàng</th>
                <th class="${headerClass('sl')} text-right" data-sort="sl">Số lượng</th>
                <th class="${headerClass('dtqd')} text-right" data-sort="dtqd">DTQĐ (Tr)</th>
                <th class="${headerClass('donGia')} text-right" data-sort="donGia">Đơn giá (Tr)</th>
                </tr>
            </thead>
            <tbody>${sortedData.map(item => `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-semibold">${item.name}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumber(item.sl)}</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-600">${uiComponents.formatRevenue(item.dtqd)}</td>
                    <td class="px-4 py-2 text-right font-bold text-green-600">${uiComponents.formatRevenue(item.donGia)}</td>
                </tr>`).join('')}
            </tbody></table></div>`;
    },

    updateRealtimeSupermarketTitle: (warehouse, dateTime) => {
        const titleEl = document.getElementById('realtime-supermarket-title');
        if(titleEl) titleEl.textContent = `Báo cáo Realtime ${warehouse ? 'kho ' + warehouse : 'toàn bộ'} - ${dateTime.toLocaleTimeString('vi-VN')} ${dateTime.toLocaleDateString('vi-VN')}`;
    },

    renderRealtimeEmployeeDetail: (detailData, employeeName) => {
        const container = document.getElementById('realtime-employee-detail-container');
        if (!container) return;
        if (!detailData) {
            container.innerHTML = `<div class="rt-infographic-container"><p class="text-center text-gray-500">Không có dữ liệu doanh thu cho nhân viên ${employeeName} trong file realtime.</p></div>`;
            return;
        }

        const selectedWarehouse = document.getElementById('realtime-filter-warehouse').value;
        const { goals } = settingsService.getRealtimeGoalSettings(selectedWarehouse);
        const { summary, byProductGroup, byCustomer } = detailData;
        const totalRevenue = byProductGroup.reduce((sum, g) => sum + g.realRevenue, 0);

        const renderProductGroupProgress = () => byProductGroup.map(group => {
            const percentage = totalRevenue > 0 ? (group.realRevenue / totalRevenue) * 100 : 0;
            return `<div class="rt-progress-bar-item">
                <div class="rt-progress-bar-label"><span>${group.name}</span><span>${uiComponents.formatRevenue(group.realRevenue, 0)}</span></div>
                <div class="rt-progress-bar-container"><div class="rt-progress-bar" style="width: ${percentage}%;"></div></div>
            </div>`;
        }).join('');

        const renderCustomerAccordion = () => byCustomer.map((customer, index) => `
            <div class="rt-customer-group">
                <details>
                    <summary class="rt-customer-header">
                        <span>${index + 1}. ${customer.name} (<span class="product-count">${customer.totalQuantity} sản phẩm</span>)</span><span class="arrow">▼</span>
                    </summary>
                    <div class="rt-customer-details">
                        <table class="w-full">
                            ${customer.products.map(p => `<tr><td>${p.productName}</td><td class="text-right font-semibold">${uiComponents.formatNumber(p.realRevenue)}</td></tr>`).join('')}
                        </table>
                    </div>
                </details>
            </div>`).join('');

        const conversionRateTarget = (goals?.phanTramQD || 0) / 100;
        const conversionRateClass = summary.conversionRate >= conversionRateTarget ? 'is-positive' : 'is-negative';

        container.innerHTML = `
            <div class="rt-infographic-container" data-capture-group="dtnv-infographic">
                <div class="rt-infographic-header text-center">
                    <h3 class="employee-name">${employeeName}</h3>
                    <p class="employee-title">Chi tiết doanh thu trong ngày</p>
                </div>
                <div class="rt-infographic-summary">
                    <div class="rt-infographic-summary-card"><div class="label">Tổng DT Thực</div><div class="value">${uiComponents.formatRevenue(summary.totalRealRevenue, 1)}</div></div>
                    <div class="rt-infographic-summary-card"><div class="label">Tổng DTQĐ</div><div class="value">${uiComponents.formatRevenue(summary.totalConvertedRevenue, 1)}</div></div>
                    <div class="rt-infographic-summary-card"><div class="label">Tỷ lệ QĐ</div><div class="value ${conversionRateClass}">${uiComponents.formatPercentage(summary.conversionRate)}</div></div>
                    <div class="rt-infographic-summary-card"><div class="label">DT Chưa Xuất</div><div class="value">${uiComponents.formatRevenue(summary.unexportedRevenue, 1)}</div></div>
                    <div class="rt-infographic-summary-card"><div class="label">Tổng Đơn Hàng</div><div class="value">${summary.totalOrders}</div></div>
                    <div class="rt-infographic-summary-card"><div class="label">SL Đơn Bán Kèm</div><div class="value">${summary.bundledOrderCount}</div></div>
                </div>
                <div class="rt-infographic-grid">
                    <div class="rt-infographic-section"><h4>Nhóm hàng</h4>${renderProductGroupProgress()}</div>
                    <div class="rt-infographic-section"><h4>Chi tiết theo khách hàng</h4><div class="rt-customer-accordion">${renderCustomerAccordion()}</div></div>
                </div>
            </div>`;
    },

    renderRealtimeBrandReport: (data, viewType = 'brand') => {
        const container = document.getElementById('realtime-brand-report-container');
        if (!container) return;
        const { byBrand, byEmployee } = data;

        if (byBrand.length === 0 && byEmployee.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Không có dữ liệu cho bộ lọc này.</p>';
            return;
        }

        const renderTable = (title, items, headers, rowRenderer, sortStateKey) => {
            const sortState = appState.sortState[sortStateKey] || { key: 'revenue', direction: 'desc' };
            const { key, direction } = sortState;
            const sortedItems = [...items].sort((a,b) => direction === 'asc' ? (a[key] - b[key]) : (b[key] - a[key]));

            const headerClass = (sortKey) => `px-4 py-2 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
            return `<div class="overflow-x-auto"><h4 class="text-lg font-semibold text-gray-700 mb-2">${title}</h4>
                <table class="min-w-full text-sm table-bordered table-striped" data-table-type="${sortStateKey}">
                    <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                        <tr>${headers.map(h => `<th class="${headerClass(h.key)}" data-sort="${h.key}">${h.label}<span class="sort-indicator"></span></th>`).join('')}</tr>
                    </thead>
                    <tbody>${sortedItems.map(rowRenderer).join('')}</tbody>
                </table></div>`;
        };

        const brandTable = renderTable('Thống kê theo hãng', byBrand,
            [{label: 'Hãng', key: 'name'}, {label: 'Số lượng', key: 'quantity'}, {label: 'Doanh thu', key: 'revenue'}, {label: 'Đơn giá TB', key: 'avgPrice'}],
            item => `<tr class="border-t">
                <td class="px-4 py-2 font-medium">${item.name}</td>
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumber(item.quantity)}</td>
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.revenue)}</td>
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.avgPrice)}</td>
            </tr>`, 'realtime_brand'
        );

        const employeeTable = renderTable('Thống kê theo nhân viên', byEmployee,
            [{label: 'Nhân viên', key: 'name'}, {label: 'Số lượng', key: 'quantity'}, {label: 'Doanh thu', key: 'revenue'}],
            item => `<tr class="border-t">
                <td class="px-4 py-2 font-medium">${item.name}</td>
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumber(item.quantity)}</td>
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.revenue)}</td>
            </tr>`, 'realtime_brand_employee'
        );

        const brandTableHtml = `<div id="realtime-brand-table-container" class="${viewType !== 'brand' ? 'hidden' : ''}">${brandTable}</div>`;
        const employeeTableHtml = `<div id="realtime-employee-table-container" class="${viewType !== 'employee' ? 'hidden' : ''}">${employeeTable}</div>`;

        container.innerHTML = brandTableHtml + employeeTableHtml;
    }
};