// Version 2.9 - Adjust rendering logic to accommodate new layout in index.html
// MODULE: Chịu trách nhiệm cho Tab Sức khỏe Siêu thị (Lũy kế)

import { appState } from './state.js';
import { ui } from './ui.js';
import { services } from './services.js';
import { settingsService } from './modules/settings.service.js';
import { highlightService } from './modules/highlight.service.js';

const luykeTab = {
    render() {
        if (appState.danhSachNhanVien.length === 0) {
            ui.togglePlaceholder('health-section', true);
            return;
        }
        ui.togglePlaceholder('health-section', false);

        services.parseCompetitionDataFromLuyKe(document.getElementById('paste-luyke').value);

        const activeSubTabBtn = document.querySelector('#luyke-subtabs-nav .sub-tab-btn.active');
        const activeSubTabId = activeSubTabBtn ? activeSubTabBtn.dataset.target : 'subtab-luyke-sieu-thi';

        const selectedWarehouse = document.getElementById('luyke-filter-warehouse').value;
        const selectedDept = document.getElementById('luyke-filter-department').value;
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

        if (activeSubTabId === 'subtab-luyke-sieu-thi') {
            const supermarketReport = services.aggregateReport(filteredReport, selectedWarehouse);
            const numDays = selectedDates.length > 0 ? selectedDates.length : new Set(appState.ycxData.map(row => new Date(row.ngayTao).toDateString())).size || 1;
            
            ui.updateLuykeSupermarketTitle(selectedWarehouse, new Date());
            ui.renderLuykeEfficiencyTable(supermarketReport, goals);
            ui.renderLuykeCategoryDetailsTable(supermarketReport, numDays);
            ui.renderLuykeQdcTable(supermarketReport, numDays);
            
            const chuaXuatReport = services.generateLuyKeChuaXuatReport(filteredYCXData);
            ui.renderChuaXuatTable(chuaXuatReport);

            const pastedData = services.parseLuyKePastedData(document.getElementById('paste-luyke').value);
            ui.displayHealthKpiTable(pastedData, goals); 

        } else if (activeSubTabId === 'subtab-luyke-thi-dua') {
            // === THAY ĐỔI: Tách logic render nút và nội dung ===
            const switcherPlaceholder = document.getElementById('luyke-thidua-view-selector-placeholder');
            const contentContainer = document.getElementById('luyke-competition-content');
            
            // 1. Chèn các nút chuyển chế độ vào placeholder nếu chưa có
            if(switcherPlaceholder && !switcherPlaceholder.querySelector('#luyke-thidua-view-selector')) {
                switcherPlaceholder.innerHTML = `
                    <div id="luyke-thidua-view-selector" class="view-switcher">
                        <button data-view="summary" class="view-switcher__btn active">Theo Phân Loại</button>
                        <button data-view="completion" class="view-switcher__btn">Theo % Hoàn Thành</button>
                    </div>
                `;
            }
            
            // 2. Luôn đảm bảo container cho nội dung báo cáo tồn tại
            if (contentContainer) {
                 contentContainer.innerHTML = '<div id="luyke-competition-infographic-container" class="mt-4"></div>';
            }

            // 3. Render báo cáo vào container đã chuẩn bị
            const activeViewBtn = document.querySelector('#luyke-thidua-view-selector .view-switcher__btn.active');
            const viewType = activeViewBtn ? activeViewBtn.dataset.view : 'summary';
            ui.displayCompetitionResultsFromLuyKe(document.getElementById('paste-luyke').value, viewType);
        }
        
        highlightService.populateHighlightFilters('luyke', filteredYCXData, filteredReport);
        highlightService.applyHighlights('luyke');
    },
};

export { luykeTab };