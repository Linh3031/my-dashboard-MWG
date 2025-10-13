// Version 2.6 - Add initializer call for drag-and-drop functionality
// MODULE: TAB SKNV
// Chịu trách nhiệm render và xử lý logic cho tab "Sức khỏe nhân viên"

import { appState } from './state.js';
import { services } from './services.js';
import { ui } from './ui.js';
import { settingsService } from './modules/settings.service.js';
import { highlightService } from './modules/highlight.service.js';
import { dragDroplisteners } from './event-listeners/listeners-dragdrop.js';

export const sknvTab = {
    render() {
        if (appState.danhSachNhanVien.length === 0) {
            ui.togglePlaceholder('health-employee-section', true);
            return;
        }
        ui.togglePlaceholder('health-employee-section', false);
        
        const selectedWarehouse = document.getElementById('sknv-filter-warehouse').value;
        const selectedDept = document.getElementById('sknv-filter-department').value;
        const selectedNames = appState.choices.sknv_employee ? appState.choices.sknv_employee.getValue(true) : [];
        const selectedDates = appState.choices.sknv_date_picker ? appState.choices.sknv_date_picker.selectedDates : [];
        
        let filteredYCXData = appState.ycxData;
        if (selectedDates && selectedDates.length > 0) {
            const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            const selectedDateSet = new Set(selectedDates.map(d => startOfDay(d)));
            filteredYCXData = appState.ycxData.filter(row => row.ngayTao instanceof Date && !isNaN(row.ngayTao) && selectedDateSet.has(startOfDay(row.ngayTao)));
        }
        
        const goals = settingsService.getLuykeGoalSettings(selectedWarehouse).goals;
        appState.masterReportData.sknv = services.generateMasterReportData(filteredYCXData, goals, false);
        
        let filteredReport = appState.masterReportData.sknv;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedNames && selectedNames.length > 0) filteredReport = filteredReport.filter(nv => selectedNames.includes(String(nv.maNV)));
        
        const activeSubTabBtn = document.querySelector('#employee-subtabs-nav .sub-tab-btn.active');
        const activeSubTabId = activeSubTabBtn ? activeSubTabBtn.dataset.target : 'subtab-sknv';

        if (activeSubTabId === 'subtab-hieu-qua-thi-dua-lk') {
            const competitionReportData = services.calculateCompetitionFocusReport(
                filteredYCXData,
                appState.competitionConfigs
            );
            
            ui.renderCompetitionUI(
                'competition-report-container-lk',
                competitionReportData
            );
        } else {
            ui.displayEmployeeRevenueReport(filteredReport, 'revenue-report-container-lk', 'doanhthu_lk');
            ui.displayEmployeeIncomeReport(filteredReport);
            ui.displayEmployeeEfficiencyReport(filteredReport, 'efficiency-report-container', 'hieu_qua');
            ui.displayCategoryRevenueReport(filteredReport, 'category-revenue-report-container', 'sknv');
            ui.displaySknvReport(filteredReport);
        }

        highlightService.populateHighlightFilters('sknv', filteredYCXData, filteredReport);
        highlightService.applyHighlights('sknv');

        // Kích hoạt lại tính năng kéo thả cho các cột hiệu quả sau khi render
        const efficiencyReportContainer = document.getElementById('efficiency-report-container');
        if (efficiencyReportContainer) {
            dragDroplisteners.initializeForContainer('efficiency-report-container');
        }
    }
};