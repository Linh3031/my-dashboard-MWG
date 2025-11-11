// Version 3.2 - Fix: renderCompetitionUI now accepts an HTML Element as containerId
// Version 3.1 - Refactor: Gỡ bỏ grid wrapper khỏi renderCompetitionUI
// Version 2.9 - Simplify multi-brand competition table header
// MODULE: UI COMPETITION
// Chứa các hàm render giao diện cho báo cáo thi đua đa hãng, đa năng.

import { appState } from './state.js';
import { uiComponents } from './ui-components.js';
import { config } from './config.js';

const uiCompetition = {
    /**
     * Render toàn bộ giao diện báo cáo hiệu quả thi đua mới.
     * @param {string|HTMLElement} containerId - ID của container hoặc chính phần tử container để render báo cáo.
     * @param {Array} reportData - Dữ liệu đã được xử lý từ services.calculateCompetitionFocusReport.
     */
    renderCompetitionUI(containerId, reportData) {
        // === START: SỬA LỖI (v3.2) ===
        // Sửa lỗi: Chấp nhận cả chuỗi ID hoặc một đối tượng HTML Element
        const container = typeof containerId === 'string' 
            ? document.getElementById(containerId) 
            : containerId;
        // === END: SỬA LỖI (v3.2) ===

        if (!container) {
            console.error("[ui-competition.js] Lỗi: Container không hợp lệ. Đầu vào là:", containerId);
            return;
        }

        if (!reportData || reportData.length === 0) {
            const isLk = container.id ? container.id.includes('-lk') : containerId.includes('-lk'); // Phải kiểm tra cả containerId (string) dự phòng
            
            // === START REFACTOR 2 (Bước 2e) ===
            // Đọc từ global configs (Firestore) + local configs (LocalStorage)
            const allConfigs = [ ...appState.globalCompetitionConfigs, ...appState.localCompetitionConfigs ];
            // === END REFACTOR 2 ===

            const ycxData = isLk ? appState.ycxData : appState.realtimeYCXData;
            
            let errorMessage = '';
            // === START REFACTOR 2 (Bước 2e) ===
            if (allConfigs.length === 0) {
            // === END REFACTOR 2 ===
                errorMessage = 'Chưa có chương trình thi đua nào được khai báo trong "Thiết lập mục tiêu".';
            } else if (ycxData.length === 0) {
                // === START REFACTOR 2 (Bước 2e) ===
                errorMessage = `Đã có ${allConfigs.length} chương trình thi đua, nhưng bạn chưa tải file dữ liệu bán hàng (${isLk ? 'YCX Lũy kế' : 'Realtime'}) tương ứng để tính toán.`;
                // === END REFACTOR 2 ===
            } else {
                // === START REFACTOR 2 (Bước 2e) ===
                // *** SỬA LỖI (v3.2): Thông báo này là LỖI LOGIC GỐC. Chúng ta sẽ thay thế nó ***
                // errorMessage = `Đã tìm thấy ${allConfigs.length} chương trình thi đua, nhưng không có doanh thu/số lượng nào khớp...`;
                errorMessage = `Không có dữ liệu thi đua cho bộ lọc hiện tại.`;
                // *** END SỬA LỖI (v3.2) ***
            }
            container.innerHTML = `<div class="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg italic">${errorMessage}</div>`;
            return;
        }

        // === START: THAY ĐỔI V4.8 (Gỡ bỏ grid wrapper) ===
        let finalHTML = ''; // Bắt đầu bằng chuỗi rỗng
        reportData.forEach((competitionResult, index) => {
            if (competitionResult.employeeData.length === 0) return;
            finalHTML += this._renderFocusCompetitionTable(competitionResult, index);
        });
        // finalHTML += `</div>`; // Xóa thẻ đóng
        container.innerHTML = finalHTML; // Render trực tiếp HTML của các thẻ
        // === END: THAY ĐỔI V4.8 ===
    },

    /**
     * @private
     * Render bảng kết quả chi tiết cho một chương trình thi đua (phiên bản mới, hỗ trợ đa hãng).
     */
    _renderFocusCompetitionTable(competitionResult, index) {
        const { competition, employeeData } = competitionResult;
        const sortStateKey = `focus_competition_${competition.type}_${index}`;
        const sortState = appState.sortState[sortStateKey] || { key: 'tyLeDT', direction: 'desc' };
        const { key, direction } = sortState;

        const targetValue = parseFloat(competition.target) / 100 || 0;
        const brands = competition.brands || [];

        const sortedData = [...employeeData].sort((a, b) => {
            const valA = a[key] || 0;
            const valB = b[key] || 0;
            return direction === 'asc' ? valA - valB : valB - a[key];
        });

        // Tính toán tổng cộng, bao gồm cả chi tiết cho từng hãng
        const totals = employeeData.reduce((acc, item) => {
            acc.baseCategoryQuantity += item.baseCategoryQuantity;
            acc.baseCategoryRevenue += item.baseCategoryRevenue;
            acc.targetBrandsQuantity += item.targetBrandsQuantity;
            acc.targetBrandsRevenue += item.targetBrandsRevenue;

            for (const brandName of brands) {
                if (!acc.performanceByBrand[brandName]) {
                    acc.performanceByBrand[brandName] = { quantity: 0, revenue: 0 };
                }
                const brandPerf = item.performanceByBrand[brandName];
                if (brandPerf) {
                    acc.performanceByBrand[brandName].quantity += brandPerf.quantity;
                    acc.performanceByBrand[brandName].revenue += brandPerf.revenue;
                }
            }
            return acc;
        }, { 
            baseCategoryQuantity: 0, 
            baseCategoryRevenue: 0,
            targetBrandsQuantity: 0,
            targetBrandsRevenue: 0,
            performanceByBrand: {}
        });

        totals.tyLeSL = totals.baseCategoryQuantity > 0 ? (totals.targetBrandsQuantity / totals.baseCategoryQuantity) : 0;
        totals.tyLeDT = totals.baseCategoryRevenue > 0 ? (totals.targetBrandsRevenue / totals.baseCategoryRevenue) : 0;
        
        const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
        
        let tableHTML = `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col" data-capture-group="competition-${competition.id}">
                <div class="p-4 bg-gray-50 border-b-2 border-indigo-200">
                    <h3 class="text-lg font-bold text-indigo-800 uppercase">${competition.name}</h3>
                    <div class="mt-2 flex items-center gap-2">
                        <label for="target-input-${competition.id}" class="text-sm font-medium text-gray-700 flex-shrink-0">Mục tiêu khai thác (%):</label>
                        <input type="number" id="target-input-${competition.id}" 
                               class="competition-target-input w-24 p-1 border rounded-md text-sm" 
                               placeholder="VD: 50"
                               value="${competition.target || ''}"
                               data-competition-id="${competition.id}">
                    </div>
                </div>
                <div class="overflow-x-auto flex-grow">
                    <table class="min-w-full text-sm text-left text-gray-600 table-bordered table-striped" data-table-type="${sortStateKey}">
                        <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                            <tr>
                                <th rowspan="2" class="${headerClass('hoTen')}" data-sort="hoTen">Nhân viên <span class="sort-indicator"></span></th>
                                ${brands.map(brand => `<th colspan="2" class="px-4 py-2 text-center header-group-5">${brand}</th>`).join('')}
                                <th colspan="2" class="px-4 py-2 text-center header-group-10">Tổng Nhóm hàng</th>
                                <th colspan="2" class="px-4 py-2 text-center header-group-6">Tỷ lệ khai thác</th>
                            </tr>
                            <tr>
                                ${brands.map(() => `<th class="px-2 py-2 text-right">SL</th><th class="px-2 py-2 text-right">DT</th>`).join('')}
                                <th class="${headerClass('baseCategoryQuantity')} text-right" data-sort="baseCategoryQuantity">SL <span class="sort-indicator"></span></th>
                                <th class="${headerClass('baseCategoryRevenue')} text-right" data-sort="baseCategoryRevenue">DT <span class="sort-indicator"></span></th>
                                <th class="${headerClass('tyLeSL')} text-right header-highlight" data-sort="tyLeSL">% SL <span class="sort-indicator"></span></th>
                                <th class="${headerClass('tyLeDT')} text-right header-highlight" data-sort="tyLeDT">% DT <span class="sort-indicator"></span></th>
                            </tr>
                        </thead>
                        <tbody>`;

        sortedData.forEach(item => {
            const tyLeSLClass = targetValue > 0 && item.tyLeSL < targetValue ? 'cell-performance is-below' : '';
            const tyLeDTClass = targetValue > 0 && item.tyLeDT < targetValue ? 'cell-performance is-below' : '';

            tableHTML += `<tr class="hover:bg-gray-50">
                <td class="px-4 py-2 font-semibold line-clamp-2">${uiComponents.getShortEmployeeName(item.hoTen, item.maNV)}</td>
                ${brands.map(brandName => {
                    const brandPerf = item.performanceByBrand[brandName] || { quantity: 0, revenue: 0 };
                    return `<td class="px-2 py-2 text-right font-bold">${uiComponents.formatNumberOrDash(brandPerf.quantity)}</td>
                            <td class="px-2 py-2 text-right font-bold">${uiComponents.formatRevenue(brandPerf.revenue)}</td>`;
                }).join('')}
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatNumberOrDash(item.baseCategoryQuantity)}</td>
                <td class="px-4 py-2 text-right font-bold">${uiComponents.formatRevenue(item.baseCategoryRevenue)}</td>
                <td class="px-4 py-2 text-right font-bold ${tyLeSLClass}">${uiComponents.formatPercentage(item.tyLeSL)}</td>
                <td class="px-4 py-2 text-right font-bold ${tyLeDTClass}">${uiComponents.formatPercentage(item.tyLeDT)}</td>
            </tr>`;
        });

        tableHTML += `
                        </tbody>
                        <tfoot class="table-footer font-bold">
                            <tr>
                                <td class="px-4 py-2">Tổng</td>
                                ${brands.map(brandName => {
                                    const brandTotals = totals.performanceByBrand[brandName] || { quantity: 0, revenue: 0 };
                                    return `<td class="px-2 py-2 text-right">${uiComponents.formatNumberOrDash(brandTotals.quantity)}</td>
                                            <td class="px-2 py-2 text-right">${uiComponents.formatRevenue(brandTotals.revenue)}</td>`;
                                }).join('')}
                                <td class="px-4 py-2 text-right">${uiComponents.formatNumberOrDash(totals.baseCategoryQuantity)}</td>
                                <td class="px-4 py-2 text-right">${uiComponents.formatRevenue(totals.baseCategoryRevenue)}</td>
                                <td class="px-4 py-2 text-right">${uiComponents.formatPercentage(totals.tyLeSL)}</td>
                                <td class="px-4 py-2 text-right">${uiComponents.formatPercentage(totals.tyLeDT)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>`;
        return tableHTML;
    }
};

export { uiCompetition };