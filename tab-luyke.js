// Version 3.1 - Add console.log for Thi đua Vùng debugging
// MODULE: Chịu trách nhiệm cho Tab Sức khỏe Siêu thị (Lũy kế)

import { appState } from './state.js';
import { ui } from './ui.js';
import { services } from './services.js';
import { settingsService } from './modules/settings.service.js';
import { highlightService } from './modules/highlight.service.js';

const luykeTab = {
    render() {
        // *** DEBUG LOG START ***
        console.log("[DEBUG] Bắt đầu render() trong tab-luyke.js");
        // *** DEBUG LOG END ***

        if (appState.danhSachNhanVien.length === 0) {
            ui.togglePlaceholder('health-section', true); // Sử dụng ui thay vì uiComponents
            return;
        }
        ui.togglePlaceholder('health-section', false); // Sử dụng ui thay vì uiComponents

        // Phân tích dữ liệu thi đua từ text dán vào (nếu có) để lấy target
        services.parseCompetitionDataFromLuyKe(document.getElementById('paste-luyke')?.value || '');

        const activeSubTabBtn = document.querySelector('#luyke-subtabs-nav .sub-tab-btn.active');
        const activeSubTabId = activeSubTabBtn ? activeSubTabBtn.dataset.target : 'subtab-luyke-sieu-thi';
        // *** DEBUG LOG START ***
        console.log("[DEBUG] activeSubTabId:", activeSubTabId);
        // *** DEBUG LOG END ***

        const selectedWarehouse = document.getElementById('luyke-filter-warehouse')?.value || ''; // Thêm ? và || ''
        const selectedDept = document.getElementById('luyke-filter-department')?.value || ''; // Thêm ? và || ''
        const selectedNames = appState.choices.luyke_employee ? appState.choices.luyke_employee.getValue(true) : [];
        const selectedDates = appState.choices.luyke_date_picker ? appState.choices.luyke_date_picker.selectedDates : [];

        let filteredYCXData = appState.ycxData;
        if (selectedDates && selectedDates.length > 0) {
            const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            const selectedDateSet = new Set(selectedDates.map(d => startOfDay(d)));
            filteredYCXData = appState.ycxData.filter(row => row.ngayTao instanceof Date && !isNaN(row.ngayTao) && selectedDateSet.has(startOfDay(row.ngayTao)));
        }

        const goals = settingsService.getLuykeGoalSettings(selectedWarehouse).goals;
        appState.masterReportData.luyke = services.generateMasterReportData(filteredYCXData, goals);

        let filteredReport = appState.masterReportData.luyke;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedNames && selectedNames.length > 0) filteredReport = filteredReport.filter(nv => selectedNames.includes(String(nv.maNV)));

        // --- Logic render theo Subtab ---
        if (activeSubTabId === 'subtab-luyke-sieu-thi') {
            // *** DEBUG LOG START ***
            console.log("[DEBUG] Đang render subtab Siêu thị Lũy kế.");
            // *** DEBUG LOG END ***
            const supermarketReport = services.aggregateReport(filteredReport, selectedWarehouse);
            const numDays = selectedDates.length > 0 ? selectedDates.length : new Set(appState.ycxData.map(row => row.ngayTao instanceof Date ? new Date(row.ngayTao).toDateString() : null).filter(Boolean)).size || 1; // Thêm kiểm tra Date

            ui.updateLuykeSupermarketTitle(selectedWarehouse, new Date());
            ui.renderLuykeEfficiencyTable(supermarketReport, goals);
            ui.renderLuykeCategoryDetailsTable(supermarketReport, numDays);
            ui.renderLuykeQdcTable(supermarketReport, numDays);

            const chuaXuatReport = services.generateLuyKeChuaXuatReport(filteredYCXData);
            ui.renderChuaXuatTable(chuaXuatReport); // Sử dụng ui thay vì uiLuyke

            const pastedData = services.parseLuyKePastedData(document.getElementById('paste-luyke')?.value || ''); // Thêm ?
            ui.displayHealthKpiTable(pastedData, goals); // Sử dụng ui thay vì uiLuyke

        } else if (activeSubTabId === 'subtab-luyke-thi-dua') {
             // *** DEBUG LOG START ***
             console.log("[DEBUG] Đang render subtab Thi đua Lũy kế.");
             // *** DEBUG LOG END ***
            const switcherPlaceholder = document.getElementById('luyke-thidua-view-selector-placeholder');
            const contentContainer = document.getElementById('luyke-competition-content');

            if(switcherPlaceholder && !switcherPlaceholder.querySelector('#luyke-thidua-view-selector')) {
                switcherPlaceholder.innerHTML = `
                    <div id="luyke-thidua-view-selector" class="view-switcher">
                        <button data-view="summary" class="view-switcher__btn active">Theo Phân Loại</button>
                        <button data-view="completion" class="view-switcher__btn">Theo % Hoàn Thành</button>
                     </div>
                `;
            }

            if (contentContainer) {
                 contentContainer.innerHTML = '<div id="luyke-competition-infographic-container" class="mt-4"></div>';
            }

            const activeViewBtn = document.querySelector('#luyke-thidua-view-selector .view-switcher__btn.active');
            const viewType = activeViewBtn ? activeViewBtn.dataset.view : 'summary';
            ui.displayCompetitionResultsFromLuyKe(document.getElementById('paste-luyke')?.value || '', viewType); // Sử dụng ui thay vì uiLuyke

        // *** START: SỬA LỖI HIỂN THỊ THI ĐUA VÙNG ***
        } else if (activeSubTabId === 'subtab-luyke-thidua-vung') {
            // *** DEBUG LOG START ***
            console.log("[DEBUG] Đang render subtab Thi đua Vùng.");
            // *** DEBUG LOG END ***
            // 1. Đảm bảo các controls trong content-card hiển thị
            const controlsCard = document.querySelector('#subtab-luyke-thidua-vung .content-card');
            if (controlsCard) {
                // Thường thì nó sẽ hiển thị vì là con trực tiếp của sub-tab-content đang active
                // Nếu có logic CSS/JS nào ẩn nó đi, bạn cần gỡ bỏ logic đó.
                // Ví dụ đơn giản là đảm bảo nó không có class 'hidden':
                controlsCard.classList.remove('hidden');
                 // *** DEBUG LOG START ***
                 console.log("[DEBUG] Thi đua Vùng: Đã đảm bảo controlsCard không có class 'hidden'.");
                 // *** DEBUG LOG END ***
            } else {
                 // *** DEBUG LOG START ***
                 console.error("[DEBUG] Thi đua Vùng: Không tìm thấy controlsCard.");
                 // *** DEBUG LOG END ***
            }

            // 2. Render infographic hoặc placeholder dựa trên dữ liệu hiện có
            const choicesInstance = appState.choices.thiDuaVung_sieuThi;
            const selectedSupermarket = choicesInstance ? choicesInstance.getValue(true) : null;
            const hasFileData = appState.thiDuaVungChiTiet && appState.thiDuaVungChiTiet.length > 0;
            // *** DEBUG LOG START ***
            console.log("[DEBUG] Thi đua Vùng: selectedSupermarket:", selectedSupermarket, "hasFileData:", hasFileData);
            // *** DEBUG LOG END ***

            if (selectedSupermarket && hasFileData) {
                const reportData = services.generateThiDuaVungReport(selectedSupermarket);
                 // *** DEBUG LOG START ***
                 console.log("[DEBUG] Thi đua Vùng: Đang gọi ui.renderThiDuaVungInfographic với dữ liệu:", reportData);
                 // *** DEBUG LOG END ***
                ui.renderThiDuaVungInfographic(reportData); // Gọi hàm render chính
            } else {
                // Hiển thị placeholder nếu chưa chọn file hoặc siêu thị
                const container = document.getElementById('thidua-vung-infographic-container');
                if (container) {
                     container.innerHTML = `<div class="placeholder-message">Vui lòng tải file và chọn một siêu thị để xem báo cáo.</div>`;
                      // *** DEBUG LOG START ***
                      console.log("[DEBUG] Thi đua Vùng: Đã render placeholder.");
                      // *** DEBUG LOG END ***
                } else {
                     // *** DEBUG LOG START ***
                     console.error("[DEBUG] Thi đua Vùng: Không tìm thấy infographic container.");
                     // *** DEBUG LOG END ***
                }
            }
        // *** END: SỬA LỖI HIỂN THỊ THI ĐUA VÙNG ***
        }

        highlightService.populateHighlightFilters('luyke', filteredYCXData, filteredReport);
        highlightService.applyHighlights('luyke');
    },
};

export { luykeTab };