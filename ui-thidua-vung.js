// Version 1.2 - Fix progress bar width and add total soon prize
// MODULE: UI THI ĐUA VÙNG
// Chứa các hàm render giao diện cho tab "Thi đua vùng".

import { uiComponents } from './ui-components.js';

export const uiThiDuaVung = {
    renderThiDuaVungInfographic(reportData) {
        const container = document.getElementById('thidua-vung-infographic-container');
        if (!container) return;
        if (!reportData) {
            container.innerHTML = `<div class="placeholder-message">Không tìm thấy dữ liệu cho siêu thị đã chọn.</div>`;
            return;
        }

        const { summary, coGiai, sapCoGiai, tiemNang, canCoGangNhieu } = reportData;

        // --- Helper function to find correct key regardless of case ---
        const findKey = (item, keyword) => {
            if (!item) return keyword;
            return Object.keys(item).find(k => k.trim().toLowerCase().includes(keyword.toLowerCase())) || keyword;
        };
        
        const firstItem = coGiai[0] || sapCoGiai[0] || tiemNang[0] || canCoGangNhieu[0];
        const keyMap = {
            sieuThi: findKey(summary, 'siêu thị'),
            tongThuongTamTinh: findKey(summary, 'tổng thưởng tạm tỉnh'),
            slThiDua: findKey(summary, 'sl nh thi đua'),
            slDat: findKey(summary, 'sl nh >100%'),
            tyLeDat: findKey(summary, 'tỷ lệ nh đạt >100%'),
            slCoGiai: findKey(summary, 'sl nh dự kiến đạt giải'),
            nganhHang: findKey(firstItem, 'ngành hàng'),
            phanTramDuKien: findKey(firstItem, '% dự kiến'),
            duKienVuot: findKey(firstItem, 'dự kiến d.thu'),
            hangVuotTroi: findKey(firstItem, 'hạng vượt trội'),
            hangTarget: findKey(firstItem, 'hạng % target'),
            tongThuong: findKey(firstItem, 'tổng thưởng'),
        };

        const renderCoGiaiItem = (item) => `
            <div class="tdv-item-card">
                <p class="tdv-item-card__title">${item[keyMap.nganhHang]}</p>
                <div class="tdv-progress-bar-container">
                    <div class="tdv-progress-bar tdv-progress-bar--blue" style="width: ${Math.min(item[keyMap.phanTramDuKien] * 100, 100)}%;"></div>
                    <span class="tdv-progress-bar__text">${uiComponents.formatPercentage(item[keyMap.phanTramDuKien])}</span>
                </div>
                <div class="tdv-item-card__details">
                    <span>Vượt: <strong>${uiComponents.formatNumber(item[keyMap.duKienVuot])}</strong></span>
                    <span>Hạng ĐT/SL: <strong>${item[keyMap.hangVuotTroi]}</strong></span>
                    <span>Hạng %: <strong>${item[keyMap.hangTarget]}</strong></span>
                    <span class="tdv-item-card__prize">Thưởng: <strong>${uiComponents.formatNumber(item[keyMap.tongThuong])}</strong></span>
                </div>
            </div>
        `;

        const renderSapCoGiaiItem = (item) => `
            <div class="tdv-item-card">
                <p class="tdv-item-card__title">${item[keyMap.nganhHang]}</p>
                <div class="tdv-progress-bar-container">
                    <div class="tdv-progress-bar tdv-progress-bar--yellow" style="width: ${Math.min(item[keyMap.phanTramDuKien] * 100, 100)}%;"></div>
                    <span class="tdv-progress-bar__text">${uiComponents.formatPercentage(item[keyMap.phanTramDuKien])}</span>
                </div>
                <div class="tdv-item-card__details">
                    <span>Cách giải: <strong>${item.khoangCach} hạng</strong></span>
                    <span>Hạng ĐT/SL: <strong>${item[keyMap.hangVuotTroi]}</strong></span>
                    <span>Hạng %: <strong>${item[keyMap.hangTarget]}</strong></span>
                    <span class="tdv-item-card__prize">Thưởng DK: <strong>${uiComponents.formatNumber(item.thuongTiemNang)}</strong></span>
                </div>
            </div>
        `;

        const renderNeedsEffortColumn = (potentialItems, majorItems) => {
            let html = `<h3 class="tdv-column-title tdv-column-title--effort">Cần cố gắng thêm (${potentialItems.length + majorItems.length})</h3><div class="tdv-column-body">`;
            
            if (potentialItems.length > 0) {
                html += `<div class="tdv-effort-subgroup">
                    <h4 class="tdv-effort-subgroup__title tdv-effort-subgroup__title--potential">Tiềm năng (cách 21-40 hạng)</h4>
                    <div class="tdv-effort-list">${potentialItems.map(item => `<div class="tdv-effort-item">${item[keyMap.nganhHang]} (cách ${item.khoangCach})</div>`).join('')}</div>
                </div>`;
            }

            if (majorItems.length > 0) {
                 html += `<div class="tdv-effort-subgroup">
                    <h4 class="tdv-effort-subgroup__title tdv-effort-subgroup__title--major">Cần cố gắng nhiều</h4>
                    <div class="tdv-effort-list">${majorItems.map(item => `<div class="tdv-effort-item">${item[keyMap.nganhHang]}</div>`).join('')}</div>
                </div>`;
            }

            if (potentialItems.length === 0 && majorItems.length === 0) {
                html += '<p class="text-xs text-gray-500">Không có.</p>';
            }

            html += `</div>`;
            return html;
        };
        
        const totalSoonPrize = sapCoGiai.reduce((sum, item) => sum + (item.thuongTiemNang || 0), 0);
        const soonPrizeTitleText = totalSoonPrize > 0 ? ` - DK: ${uiComponents.formatNumber(totalSoonPrize)}đ` : '';

        const html = `
            <div class="tdv-infographic-card">
                <div class="tdv-header">
                    <h2 class="tdv-supermarket-name">${summary[keyMap.sieuThi]}</h2>
                    <div class="tdv-total-prize-container">
                        <span class="tdv-total-prize-label">Tổng thưởng tạm tính:</span>
                        <span class="tdv-total-prize-value">${uiComponents.formatNumber(summary[keyMap.tongThuongTamTinh])}đ</span>
                    </div>
                </div>

                <div class="tdv-summary-grid">
                    <div class="tdv-summary-item">
                        <span class="tdv-summary-value">${uiComponents.formatNumber(summary[keyMap.slThiDua])}</span>
                        <span class="tdv-summary-label">Ngành thi đua</span>
                    </div>
                    <div class="tdv-summary-item">
                        <span class="tdv-summary-value">${uiComponents.formatNumber(summary[keyMap.slDat])}</span>
                        <span class="tdv-summary-label">Ngành >100%</span>
                    </div>
                    <div class="tdv-summary-item">
                        <span class="tdv-summary-value">${uiComponents.formatPercentage(summary[keyMap.tyLeDat])}</span>
                        <span class="tdv-summary-label">Tỷ lệ đạt</span>
                    </div>
                     <div class="tdv-summary-item">
                        <span class="tdv-summary-value">${uiComponents.formatNumber(summary[keyMap.slCoGiai])}</span>
                        <span class="tdv-summary-label">Ngành dự kiến có giải</span>
                    </div>
                </div>

                <div class="tdv-columns-container">
                    <div class="tdv-column">
                        <h3 class="tdv-column-title tdv-column-title--prize">Ngành hàng có giải (${coGiai.length})</h3>
                        <div class="tdv-column-body">${coGiai.map(renderCoGiaiItem).join('') || '<p class="text-xs text-gray-500">Không có.</p>'}</div>
                    </div>
                    <div class="tdv-column">
                        <h3 class="tdv-column-title tdv-column-title--soon-prize">Sắp có giải (${sapCoGiai.length})<span class="tdv-column-subtitle">${soonPrizeTitleText}</span></h3>
                        <div class="tdv-column-body">${sapCoGiai.map(renderSapCoGiaiItem).join('') || '<p class="text-xs text-gray-500">Không có.</p>'}</div>
                    </div>
                    <div class="tdv-column">
                        ${renderNeedsEffortColumn(tiemNang, canCoGangNhieu)}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }
};