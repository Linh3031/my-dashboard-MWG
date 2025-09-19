// Version 1.1 - Add dedicated employee revenue report
// MODULE: UI REALTIME
// Chứa các hàm render giao diện cho tab "Doanh thu Realtime".

import { appState } from './state.js';
import { services } from './services.js';
import { utils } from './utils.js';
import { uiComponents } from './ui-components.js';

export const uiRealtime = {
    // =================================================================
    // HÀM MỚI: Dành riêng cho việc render bảng DTNV trong tab Realtime
    // =================================================================
    displayRealtimeEmployeeRevenueReport: (reportData, containerId, sortStateKey) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!reportData || reportData.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Không có dữ liệu doanh thu cho lựa chọn này.</p>';
            return;
        }

        const sortState = appState.sortState[sortStateKey] || { key: 'doanhThu', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...reportData].sort((a, b) => {
            const valA = a[key] || 0; const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });

        const totals = reportData.reduce((acc, item) => {
            acc.doanhThu += item.doanhThu;
            acc.doanhThuQuyDoi += item.doanhThuQuyDoi;
            acc.doanhThuTraGop += item.doanhThuTraGop;
            acc.doanhThuChuaXuat += item.doanhThuChuaXuat;
            return acc;
        }, { doanhThu: 0, doanhThuQuyDoi: 0, doanhThuTraGop: 0, doanhThuChuaXuat: 0 });

        totals.hieuQuaQuyDoi = totals.doanhThu > 0 ? (totals.doanhThuQuyDoi / totals.doanhThu) - 1 : 0;
        totals.tyLeTraCham = totals.doanhThu > 0 ? totals.doanhThuTraGop / totals.doanhThu : 0;

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        
        let tableHTML = `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div class="p-4 header-group-1 text-gray-800">
                <h3 class="text-xl font-bold uppercase">Doanh thu nhân viên Realtime</h3>
                <p class="text-sm italic text-gray-600">(đơn vị tính: Triệu đồng)</p>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}" data-capture-columns="7">
                    <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                        <tr>
                            <th class="${headerClass('hoTen')}" data-sort="hoTen">Nhân viên <span class="sort-indicator"></span></th>
                            <th class="${headerClass('doanhThu')} text-right header-group-4" data-sort="doanhThu">Doanh Thu <span class="sort-indicator"></span></th>
                            <th class="${headerClass('doanhThuQuyDoi')} text-right header-group-4" data-sort="doanhThuQuyDoi">Doanh Thu QĐ <span class="sort-indicator"></span></th>
                            <th class="${headerClass('hieuQuaQuyDoi')} text-right header-group-4" data-sort="hieuQuaQuyDoi">% QĐ <span class="sort-indicator"></span></th>
                            <th class="${headerClass('doanhThuTraGop')} text-right header-group-5" data-sort="doanhThuTraGop">DT trả chậm <span class="sort-indicator"></span></th>
                            <th class="${headerClass('tyLeTraCham')} text-right header-group-5" data-sort="tyLeTraCham">% trả chậm <span class="sort-indicator"></span></th>
                            <th class="${headerClass('doanhThuChuaXuat')} text-right header-group-6" data-sort="doanhThuChuaXuat">DT Chưa Xuất <span class="sort-indicator"></span></th>
                        </tr>
                    </thead>
                    <tbody>`;
        sortedData.forEach(item => {
            const { mucTieu } = item;
            const qdClass = item.hieuQuaQuyDoi < (mucTieu.phanTramQD / 100) ? 'cell-performance is-below' : '';
            const tcClass = item.tyLeTraCham < (mucTieu.phanTramTC / 100) ? 'cell-performance is-below' : '';
            tableHTML += `<tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-semibold line-clamp-2">${uiComponents.getShortEmployeeName(item.hoTen, item.maNV)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.doanhThu)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.doanhThuQuyDoi)}</td>
                    <td class="px-4 py-2 text-right font-bold ${qdClass}">${uiComponents.formatPercentage(item.hieuQuaQuyDoi)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.doanhThuTraGop)}</td>
                    <td class="px-4 py-2 text-right font-bold ${tcClass}">${uiComponents.formatPercentage(item.tyLeTraCham)}</td>
                    <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.doanhThuChuaXuat)}</td></tr>`;
        });
         tableHTML += `</tbody><tfoot class="table-footer font-bold"><tr>
                    <td class="px-4 py-2">Tổng</td>
                    <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.doanhThu)}</td>
                    <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.doanhThuQuyDoi)}</td>
                    <td class="px-4 py-2 text-right">${uiComponents.formatPercentage(totals.hieuQuaQuyDoi)}</td>
                    <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.doanhThuTraGop)}</td>
                    <td class="px-4 py-2 text-right">${uiComponents.formatPercentage(totals.tyLeTraCham)}</td>
                    <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.doanhThuChuaXuat)}</td>
                </tr></tfoot></table></div></div>`;
        container.innerHTML = tableHTML;
    },
    // =================================================================
    // CÁC HÀM CŨ VẪN GIỮ NGUYÊN
    // =================================================================
    renderRealtimeKpiCards: (data, goals) => {
        const { doanhThu, doanhThuQuyDoi, doanhThuChuaXuat, doanhThuQuyDoiChuaXuat, doanhThuTraGop, hieuQuaQuyDoi, tyLeTraCham } = data;
        const { goals: rtGoals, timing } = goals;
        const timeProgress = services.calculateTimeProgress(timing?.['rt-open-hour'], timing?.['rt-close-hour']);
        
        const expectedDTT = (rtGoals?.doanhThuThuc || 0) * timeProgress;
        const expectedDTQD = (rtGoals?.doanhThuQD || 0) * timeProgress;

        document.getElementById('rt-kpi-dt-thuc-main').textContent = uiComponents.formatNumber((doanhThu || 0) / 1000000, 1);
        document.getElementById('rt-kpi-dt-thuc-sub1').innerHTML = `% HT: <span class="kpi-percentage-value">${uiComponents.formatPercentage(expectedDTT > 0 ? ((doanhThu || 0) / 1000000) / expectedDTT : 0)}</span> / Target ngày: ${uiComponents.formatNumber(rtGoals?.doanhThuThuc || 0)}`;
        document.getElementById('rt-kpi-dt-thuc-sub2').textContent = `DT Chưa xuất: ${uiComponents.formatNumber((doanhThuChuaXuat || 0) / 1000000, 1)}`;

        document.getElementById('rt-kpi-dt-qd-main').textContent = uiComponents.formatNumber((doanhThuQuyDoi || 0) / 1000000, 1);
        document.getElementById('rt-kpi-dt-qd-sub1').innerHTML = `% HT: <span class="kpi-percentage-value">${uiComponents.formatPercentage(expectedDTQD > 0 ? ((doanhThuQuyDoi || 0) / 1000000) / expectedDTQD : 0)}</span> / Target ngày: ${uiComponents.formatNumber(rtGoals?.doanhThuQD || 0)}`;
        document.getElementById('rt-kpi-dt-qd-sub2').textContent = `DTQĐ Chưa xuất: ${uiComponents.formatNumber((doanhThuQuyDoiChuaXuat || 0) / 1000000, 1)}`;
        
        document.getElementById('rt-kpi-tl-qd-main').textContent = uiComponents.formatPercentage(hieuQuaQuyDoi);
        document.getElementById('rt-kpi-tl-qd-sub').textContent = `Mục tiêu: ${uiComponents.formatNumber(rtGoals?.phanTramQD || 0)}%`;
        
        document.getElementById('rt-kpi-dt-tc-main').textContent = uiComponents.formatNumber((doanhThuTraGop || 0) / 1000000, 1);
        document.getElementById('rt-kpi-dt-tc-sub').innerHTML = `% thực trả chậm: <span class="kpi-percentage-value">${uiComponents.formatPercentage(tyLeTraCham)}</span>`;
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
        const titleElement = document.getElementById('realtime-category-title');
        if (!container || !titleElement ||!data || !data.nganhHangChiTiet) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return; }
        
        titleElement.className = 'text-xl font-bold uppercase mb-4 p-2 rounded-md header-bg-bright-2';

        const { nganhHangChiTiet } = data;
        if (Object.keys(nganhHangChiTiet).length === 0) {
            container.innerHTML = '<p class="text-gray-500 font-bold">Không có dữ liệu.</p>'; return;
        }
        
        const sortState = appState.sortState.realtime_nganhhang || { key: 'revenue', direction: 'desc' };
        const { key, direction } = sortState;
        
        const sortedData = Object.entries(nganhHangChiTiet)
            .map(([name, values]) => ({ name, ...values }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 15)
            .sort((a, b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key]);

        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="realtime_nganhhang">
            <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold"><tr>
                <th class="${headerClass('name')}" data-sort="name">Ngành hàng</th>
                <th class="${headerClass('quantity')} text-right" data-sort="quantity">SL</th>
                <th class="${headerClass('revenue')} text-right" data-sort="revenue">Doanh thu thực</th>
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
    
    renderRealtimeQdcTable: (data) => {
        const container = document.getElementById('realtime-qdc-content');
        const titleElement = document.getElementById('realtime-qdc-title');
        if (!container || !titleElement || !data || !data.qdc) { container.innerHTML = `<p class="text-gray-500 font-bold">Không có dữ liệu.</p>`; return; }
        
        titleElement.className = 'text-xl font-bold uppercase mb-4 p-2 rounded-md header-bg-bright-1';

        const qdcData = Object.entries(data.qdc).map(([key, value]) => ({ id: key, ...value }));
        const sortState = appState.sortState.realtime_qdc || { key: 'dtqd', direction: 'desc' };
        const { key, direction } = sortState;
        const sortedData = [...qdcData].sort((a,b) => direction === 'asc' ? a[key] - b[key] : b[key] - a[key]);

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

        const { summary, byProductGroup, byCustomer } = detailData;
        const totalRevenue = byProductGroup.reduce((sum, g) => sum + g.realRevenue, 0);

        const renderProductGroupProgress = () => byProductGroup.slice(0, 5).map(group => {
            const percentage = totalRevenue > 0 ? (group.realRevenue / totalRevenue) * 100 : 0;
            return `<div class="rt-progress-bar-item">
                <div class="rt-progress-bar-label"><span>${group.name}</span><span>${uiComponents.formatNumber(group.realRevenue)}</span></div>
                <div class="rt-progress-bar-container"><div class="rt-progress-bar" style="width: ${percentage}%;"></div></div>
            </div>`;
        }).join('');

        const renderCustomerAccordion = () => byCustomer.map((customer, index) => `
            <div class="rt-customer-group">
                <details>
                    <summary class="rt-customer-header">
                        <span>${index + 1}. ${customer.name}</span><span class="arrow">▼</span>
                    </summary>
                    <div class="rt-customer-details">
                        <table class="w-full">
                            ${customer.products.map(p => `<tr><td>${p.productName}</td><td class="text-right font-semibold">${uiComponents.formatNumber(p.realRevenue)}</td></tr>`).join('')}
                        </table>
                    </div>
                </details>
            </div>`).join('');
        
        container.innerHTML = `
            <div class="rt-infographic-container" data-capture-group="dtnv-infographic">
                <div class="rt-infographic-header text-center">
                    <h3 class="employee-name">${employeeName}</h3>
                    <p class="employee-title">Chi tiết doanh thu trong ngày</p>
                </div>
                <div class="rt-infographic-summary">
                    <div class="rt-infographic-summary-card"><div class="label">Tổng DT Thực</div><div class="value">${uiComponents.formatNumber(summary.totalRealRevenue)}</div></div>
                    <div class="rt-infographic-summary-card"><div class="label">Tổng DTQĐ</div><div class="value">${uiComponents.formatNumber(summary.totalConvertedRevenue)}</div></div>
                    <div class="rt-infographic-summary-card"><div class="label">Tổng đơn hàng</div><div class="value">${summary.totalOrders}</div></div>
                </div>
                <div class="rt-infographic-grid">
                    <div class="rt-infographic-section"><h4>Top 5 Nhóm hàng đóng góp cao nhất</h4>${renderProductGroupProgress()}</div>
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

