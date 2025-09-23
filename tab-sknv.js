// Version 1.4 - Restore correct goal data flow by passing goals to the service
// MODULE: TAB SKNV
// Chịu trách nhiệm render và xử lý logic cho tab "Sức khỏe nhân viên"
import { appState } from './state.js';
import { services } from './services.js';
import { ui } from './ui.js';
import { utils } from './utils.js';

export const sknvTab = {
    render() {
        if (appState.danhSachNhanVien.length === 0) {
            ui.togglePlaceholder('health-employee-section', true);
            return;
        }
        ui.togglePlaceholder('health-employee-section', false);
        
        const luykeCompetitionData = services.parseCompetitionDataFromLuyKe(document.getElementById('paste-luyke').value);
        const pastedThiDuaText = document.getElementById('paste-thiduanv').value;
        appState.thiDuaReportData = services.processThiDuaNhanVienData(pastedThiDuaText, luykeCompetitionData);
        
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
        
        // FIX: Lấy mục tiêu và truyền nó vào hàm tính toán để đảm bảo luồng dữ liệu chính xác
        const goals = utils.getLuykeGoalSettings(selectedWarehouse).goals;
        appState.masterReportData.sknv = services.generateMasterReportData(filteredYCXData, goals, false); // false cho isRealtime
        
        let filteredReport = appState.masterReportData.sknv;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedNames && selectedNames.length > 0) filteredReport = filteredReport.filter(nv => selectedNames.includes(String(nv.maNV)));
        
        ui.displayEmployeeRevenueReport(filteredReport, 'revenue-report-container-lk', 'doanhthu_lk');
        ui.displayEmployeeIncomeReport(filteredReport);
        ui.displayEmployeeEfficiencyReport(filteredReport, 'efficiency-report-container', 'hieu_qua');
        ui.displayCategoryRevenueReport(filteredReport, 'category-revenue-report-container', 'sknv');
        ui.displaySknvReport(filteredReport);
        ui.displayCompetitionReport();

        utils.populateHighlightFilters('sknv', filteredYCXData, filteredReport);
        utils.applyHighlights('sknv');
    }
};