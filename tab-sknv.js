// Version 3.0 - Fix: Render DT NV LK detail view in the correct container
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

        const detailInfo = appState.viewingDetailFor;
        const isViewingDetail = detailInfo && (detailInfo.sourceTab === 'sknv' || detailInfo.sourceTab === 'dtnv-lk');

        if (isViewingDetail) {
            const employeeData = appState.masterReportData.sknv.find(nv => String(nv.maNV) === String(detailInfo.employeeId));
            if (activeSubTabId === 'subtab-sknv' && detailInfo.sourceTab === 'sknv') {
                ui.displaySknvReport(filteredReport, true); // Force detail view
            } else if (activeSubTabId === 'subtab-doanhthu-lk' && detailInfo.sourceTab === 'dtnv-lk') {
                const luykeDetailData = services.generateLuyKeEmployeeDetailReport(detailInfo.employeeId, filteredYCXData);
                // === START: THAY ĐỔI CỐT LÕI ===
                // Truyền vào ID của container mới để render chi tiết đúng chỗ.
                ui.renderLuykeEmployeeDetail(luykeDetailData, employeeData, 'dtnv-lk-details-container');
                // === END: THAY ĐỔI CỐT LÕI ===
            } else {
                this.renderSummaryViews(activeSubTabId, filteredReport, filteredYCXData);
            }
        } else {
            this.renderSummaryViews(activeSubTabId, filteredReport, filteredYCXData);
        }

        highlightService.populateHighlightFilters('sknv', filteredYCXData, filteredReport);
        highlightService.applyHighlights('sknv');

        const efficiencyReportContainer = document.getElementById('efficiency-report-container');
        if (efficiencyReportContainer && !isViewingDetail) {
            dragDroplisteners.initializeForContainer('efficiency-report-container');
        }
    },

    renderSummaryViews(activeSubTabId, filteredReport, filteredYCXData) {
        if (activeSubTabId === 'subtab-hieu-qua-thi-dua-lk') {
            const competitionReportData = services.calculateCompetitionFocusReport(
                filteredYCXData,
                appState.competitionConfigs
            );
            ui.renderCompetitionUI('competition-report-container-lk', competitionReportData);
        } else if (activeSubTabId === 'subtab-sknv') {
            ui.displaySknvReport(filteredReport, false); // Force summary view
        } else if (activeSubTabId === 'subtab-doanhthu-lk') {
            ui.displayEmployeeRevenueReport(filteredReport, 'revenue-report-container-lk', 'doanhthu_lk');
        } else if (activeSubTabId === 'subtab-thunhap') {
            ui.displayEmployeeIncomeReport(filteredReport);
        } else if (activeSubTabId === 'subtab-hieu-qua-khai-thac-luy-ke') {
            ui.displayEmployeeEfficiencyReport(filteredReport, 'efficiency-report-container', 'hieu_qua');
        } else if (activeSubTabId === 'subtab-doanhthu-nganhhang') {
            ui.displayCategoryRevenueReport(filteredReport, 'category-revenue-report-container', 'sknv');
        }
    }
};