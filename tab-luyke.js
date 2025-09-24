// Version 2.1 - Add render logic for Thi Đua Vùng sub-tab
// MODULE: Chịu trách nhiệm cho Tab Sức khỏe Siêu thị (Lũy kế)

import { appState } from './state.js';
import { ui } from './ui.js';
import { services } from './services.js';
import { utils } from './utils.js';

const luykeTab = {
    render() {
        if (appState.danhSachNhanVien.length === 0) {
            ui.togglePlaceholder('health-section', true);
            return;
        }
        ui.togglePlaceholder('health-section', false);

        const activeSubTabBtn = document.querySelector('#luyke-subtabs-nav .sub-tab-btn.active');
        const activeSubTabId = activeSubTabBtn ? activeSubTabBtn.dataset.target : 'subtab-luyke-sieu-thi';

        // Tab "Thi đua vùng" có luồng dữ liệu riêng và không phụ thuộc vào YCX Lũy kế.
        // Logic của nó sẽ được xử lý bằng các event listener riêng.
        // Vì vậy, chúng ta chỉ cần thoát sớm để không chạy logic của các tab khác.
        if (activeSubTabId === 'subtab-luyke-thidua-vung') {
            return;
        }

        // --- Logic chung cho các tab còn lại (dựa trên YCX Lũy kế) ---
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
        
        const goals = utils.getLuykeGoalSettings(selectedWarehouse).goals;
        appState.masterReportData.luyke = services.generateMasterReportData(filteredYCXData, goals);
        
        let filteredReport = appState.masterReportData.luyke;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedNames && selectedNames.length > 0) filteredReport = filteredReport.filter(nv => selectedNames.includes(String(nv.maNV)));

        // --- Render giao diện dựa trên sub-tab đang hoạt động ---
        if (activeSubTabId === 'subtab-luyke-sieu-thi') {
            const supermarketReport = services.aggregateReport(filteredReport, selectedWarehouse);
            const numDays = selectedDates.length > 0 ? selectedDates.length : new Set(appState.ycxData.map(row => new Date(row.ngayTao).toDateString())).size || 1;
            
            ui.updateLuykeSupermarketTitle(selectedWarehouse, new Date());
            ui.renderLuykeEfficiencyTable(supermarketReport, goals);
            ui.renderLuykeCategoryDetailsTable(supermarketReport, numDays);
            ui.renderLuykeQdcTable(supermarketReport, numDays);
            
            const chuaXuatReport = services.generateChuaXuatReport(filteredYCXData);
            ui.renderChuaXuatTable(chuaXuatReport);

            const pastedData = services.parseLuyKePastedData(document.getElementById('paste-luyke').value);
            ui.displayHealthKpiTable(pastedData, goals); 

        } else if (activeSubTabId === 'subtab-luyke-thi-dua') {
            const activeViewBtn = document.querySelector('#luyke-thidua-view-selector .view-switcher__btn.active');
            const viewType = activeViewBtn ? activeViewBtn.dataset.view : 'summary';
            ui.displayCompetitionResultsFromLuyKe(document.getElementById('paste-luyke').value, viewType);
        }
        
        utils.populateHighlightFilters('luyke', filteredYCXData, filteredReport);
        utils.applyHighlights('luyke');
    },
};

export { luykeTab };