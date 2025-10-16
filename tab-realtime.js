// Version 3.4 - Refactor: Render detail/summary view based on appState.viewingDetailFor
// MODULE: Chịu trách nhiệm cho Tab Doanh thu Realtime

import { appState } from './state.js';
import { ui } from './ui.js';
import { services } from './services.js';
import { settingsService } from './modules/settings.service.js';
import { highlightService } from './modules/highlight.service.js';
import { dragDroplisteners } from './event-listeners/listeners-dragdrop.js';

export const realtimeTab = {
    render() {
        if (appState.danhSachNhanVien.length === 0) {
            ui.togglePlaceholder('realtime-section', true);
            return;
        }
        ui.togglePlaceholder('realtime-section', false);

        const selectedWarehouse = document.getElementById('realtime-filter-warehouse').value;
        ui.updateRealtimeSupermarketTitle(selectedWarehouse, new Date());
        
        const activeSubTabBtn = document.querySelector('#realtime-subtabs-nav .sub-tab-btn.active');
        const activeSubTabId = activeSubTabBtn ? activeSubTabBtn.dataset.target : 'subtab-realtime-sieu-thi';

        if (appState.realtimeYCXData.length === 0) {
             ui.renderRealtimeKpiCards({}, { goals: {}, timing: {} });
             document.getElementById('realtime-category-details-content').innerHTML = '<p class="text-gray-500 font-bold">Vui lòng tải file realtime để xem chi tiết.</p>';
             document.getElementById('realtime-efficiency-content').innerHTML = '<p class="text-gray-500 font-bold">Vui lòng tải file realtime để xem chi tiết.</p>';
             document.getElementById('realtime-qdc-content').innerHTML = '<p class="text-gray-500 font-bold">Vui lòng tải file realtime để xem chi tiết.</p>';
             document.getElementById('realtime-unexported-revenue-content').innerHTML = '<p class="text-gray-500 font-bold">Vui lòng tải file realtime để xem chi tiết.</p>';
             document.getElementById('realtime-revenue-report-container').innerHTML = '';
             document.getElementById('realtime-employee-detail-container').innerHTML = '';
             document.getElementById('realtime-brand-report-container').innerHTML = '<p class="text-gray-500">Vui lòng tải file realtime và chọn bộ lọc để xem dữ liệu.</p>';
             document.getElementById('competition-report-container-rt').innerHTML = '<p class="text-gray-500">Vui lòng tải file realtime để xem chi tiết.</p>';
             return;
        };

        const selectedDept = document.getElementById('realtime-filter-department').value;
        const selectedEmployees = appState.choices.realtime_employee ? appState.choices.realtime_employee.getValue(true) : [];
        
        const settings = settingsService.getRealtimeGoalSettings(selectedWarehouse);
        
        appState.masterReportData.realtime = services.generateMasterReportData(appState.realtimeYCXData, settings.goals, true);
        
        let filteredReport = appState.masterReportData.realtime;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedEmployees && selectedEmployees.length > 0) filteredReport = filteredReport.filter(nv => selectedEmployees.includes(String(nv.maNV)));

        const visibleEmployees = new Set(filteredReport.map(nv => String(nv.maNV)));
        const filteredRealtimeYCX = appState.realtimeYCXData.filter(row => {
            const msnvMatch = String(row.nguoiTao || '').match(/(\d+)/);
            return msnvMatch && visibleEmployees.has(msnvMatch[1].trim());
        });
        
        const detailInfo = appState.viewingDetailFor;
        const isViewingDetail = detailInfo && detailInfo.sourceTab === 'dtnv-rt';
        
        // Render tab DT NV Realtime first if it's the active one
        if (activeSubTabId === 'subtab-realtime-nhan-vien') {
            if (isViewingDetail) {
                this.handleEmployeeDetailChange(detailInfo.employeeId);
            } else {
                ui.displayRealtimeEmployeeRevenueReport(filteredReport, 'realtime-revenue-report-container', 'realtime_dt_nhanvien');
                this.handleEmployeeDetailChange(null); // Clear detail view
            }
        }

        // Render other tabs
        const supermarketReport = services.aggregateReport(filteredReport, selectedWarehouse);
        ui.renderRealtimeKpiCards(supermarketReport, settings);
        ui.renderRealtimeCategoryDetailsTable(supermarketReport);
        ui.renderRealtimeEfficiencyTable(supermarketReport, settings.goals);
        ui.renderRealtimeQdcTable(supermarketReport);
        const realtimeChuaXuatReport = services.generateRealtimeChuaXuatReport(filteredRealtimeYCX);
        ui.renderRealtimeChuaXuatTable(realtimeChuaXuatReport);
        ui.displayEmployeeEfficiencyReport(filteredReport, 'realtime-efficiency-report-container', 'realtime_hieuqua_nhanvien');
        ui.displayCategoryRevenueReport(filteredReport, 'realtime-category-revenue-report-container', 'realtime');
        this.handleBrandFilterChange();
        
        const competitionReportData = services.calculateCompetitionFocusReport(
            appState.realtimeYCXData,
            appState.competitionConfigs
        );
        ui.renderCompetitionUI('competition-report-container-rt', competitionReportData);
        
        highlightService.populateHighlightFilters('realtime', filteredRealtimeYCX, filteredReport);
        highlightService.applyHighlights('realtime');
        
        if (!isViewingDetail) {
            const efficiencyReportContainer = document.getElementById('realtime-efficiency-report-container');
            if (efficiencyReportContainer) {
                dragDroplisteners.initializeForContainer('realtime-efficiency-report-container');
            }
        }
    },

    handleEmployeeDetailChange(employeeId) {
        const revenueContainer = document.getElementById('realtime-revenue-report-container');
        const detailContainer = document.getElementById('realtime-employee-detail-container');
        
        if (!revenueContainer || !detailContainer) return;
        
        if (!employeeId) {
            revenueContainer.classList.remove('hidden');
            detailContainer.classList.add('hidden');
            detailContainer.innerHTML = '';
            return;
        }

        revenueContainer.classList.add('hidden');
        detailContainer.classList.remove('hidden');

        const employeeInfo = appState.employeeMaNVMap.get(String(employeeId));
        const employeeName = employeeInfo ? ui.getShortEmployeeName(employeeInfo.hoTen, employeeInfo.maNV) : `NV ${employeeId}`;
        const detailData = services.generateRealtimeEmployeeDetailReport(employeeId, appState.realtimeYCXData);
        
        ui.renderRealtimeEmployeeDetail(detailData, employeeName);
    },

    handleBrandFilterChange() {
        const categoryFilter = document.getElementById('realtime-brand-category-filter');
        const brandFilter = document.getElementById('realtime-brand-filter');
        const activeDthangViewBtn = document.querySelector('#dthang-realtime-view-selector .view-switcher__btn.active');
        const dthangViewType = activeDthangViewBtn ? activeDthangViewBtn.dataset.view : 'brand';

        if (!categoryFilter || !brandFilter) return;

        const selectedCategory = categoryFilter.value;
        
        ui.updateBrandFilterOptions(selectedCategory);

        const selectedBrand = brandFilter.value;
        const reportData = services.generateRealtimeBrandReport(appState.realtimeYCXData, selectedCategory, selectedBrand);
        ui.renderRealtimeBrandReport(reportData, dthangViewType);
    }
};