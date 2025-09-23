// Version 2.5 - Restore correct goal data flow by passing goals to the service
// MODULE: Chịu trách nhiệm cho Tab Doanh thu Realtime

import { appState } from './state.js';
import { ui } from './ui.js';
import { services } from './services.js';
import { utils } from './utils.js';

const realtimeTab = {
    render() {
        if (appState.danhSachNhanVien.length === 0) {
            ui.togglePlaceholder('realtime-section', true);
            return;
        }
        ui.togglePlaceholder('realtime-section', false);

        const selectedWarehouse = document.getElementById('realtime-filter-warehouse').value;
        ui.updateRealtimeSupermarketTitle(selectedWarehouse, new Date());
        
        if (appState.realtimeYCXData.length === 0) {
             ui.renderRealtimeKpiCards({}, { goals: {}, timing: {} });
             document.getElementById('realtime-category-details-content').innerHTML = '<p class="text-gray-500 font-bold">Vui lòng tải file realtime để xem chi tiết.</p>';
             document.getElementById('realtime-efficiency-content').innerHTML = '<p class="text-gray-500 font-bold">Vui lòng tải file realtime để xem chi tiết.</p>';
             document.getElementById('realtime-qdc-content').innerHTML = '<p class="text-gray-500 font-bold">Vui lòng tải file realtime để xem chi tiết.</p>';
             document.getElementById('realtime-unexported-revenue-content').innerHTML = '<p class="text-gray-500 font-bold">Vui lòng tải file realtime để xem chi tiết.</p>';
             document.getElementById('realtime-revenue-report-container').innerHTML = '';
             document.getElementById('realtime-employee-detail-container').innerHTML = '';
             document.getElementById('realtime-brand-report-container').innerHTML = '<p class="text-gray-500">Vui lòng tải file realtime và chọn bộ lọc để xem dữ liệu.</p>';
             return;
        };

        const selectedDept = document.getElementById('realtime-filter-department').value;
        const selectedEmployees = appState.choices.realtime_employee ? appState.choices.realtime_employee.getValue(true) : [];
        
        const settings = utils.getRealtimeGoalSettings(selectedWarehouse);
        
        // FIX: Lấy mục tiêu và truyền nó vào hàm tính toán để đảm bảo luồng dữ liệu chính xác
        appState.masterReportData.realtime = services.generateMasterReportData(appState.realtimeYCXData, settings.goals, true);
        
        let filteredReport = appState.masterReportData.realtime;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedEmployees && selectedEmployees.length > 0) filteredReport = filteredReport.filter(nv => selectedEmployees.includes(String(nv.maNV)));

        const visibleEmployees = new Set(filteredReport.map(nv => String(nv.maNV)));
        const filteredRealtimeYCX = appState.realtimeYCXData.filter(row => {
            const msnvMatch = String(row.nguoiTao || '').match(/^(\d+)/);
            return msnvMatch && visibleEmployees.has(msnvMatch[1].trim());
        });
        
        const supermarketReport = services.aggregateReport(filteredReport, selectedWarehouse);
        
        ui.renderRealtimeKpiCards(supermarketReport, settings);
        ui.renderRealtimeCategoryDetailsTable(supermarketReport);
        ui.renderRealtimeEfficiencyTable(supermarketReport, settings.goals);
        ui.renderRealtimeQdcTable(supermarketReport);
        
        const realtimeChuaXuatReport = services.generateRealtimeChuaXuatReport(filteredRealtimeYCX);
        ui.renderRealtimeChuaXuatTable(realtimeChuaXuatReport);

        const activeDtnvViewBtn = document.querySelector('#dtnv-realtime-view-selector .view-switcher__btn.active');
        const dtnvViewType = activeDtnvViewBtn ? activeDtnvViewBtn.dataset.view : 'summary';
        
        const employeeSelectorContainer = document.getElementById('dtnv-realtime-employee-selector-container');
        employeeSelectorContainer.classList.toggle('hidden', dtnvViewType !== 'infographic');

        if (dtnvViewType === 'infographic') {
            this.handleEmployeeDetailChange();
        } else {
            document.getElementById('realtime-revenue-report-container').classList.remove('hidden');
            document.getElementById('realtime-employee-detail-container').classList.add('hidden');
            ui.displayRealtimeEmployeeRevenueReport(filteredReport, 'realtime-revenue-report-container', 'realtime_dt_nhanvien');
        }

        ui.displayEmployeeEfficiencyReport(filteredReport, 'realtime-efficiency-report-container', 'realtime_hieuqua_nhanvien');
        ui.displayCategoryRevenueReport(filteredReport, 'realtime-category-revenue-report-container', 'realtime');
        
        this.handleBrandFilterChange();
        
        utils.populateHighlightFilters('realtime', filteredRealtimeYCX, filteredReport);
        utils.applyHighlights('realtime');
    },

    handleEmployeeDetailChange() {
        const filterEl = document.getElementById('realtime-employee-detail-filter');
        const revenueContainer = document.getElementById('realtime-revenue-report-container');
        const detailContainer = document.getElementById('realtime-employee-detail-container');
        
        if (!filterEl || !revenueContainer || !detailContainer) return;
        
        const activeDtnvViewBtn = document.querySelector('#dtnv-realtime-view-selector .view-switcher__btn.active');
        const dtnvViewType = activeDtnvViewBtn ? activeDtnvViewBtn.dataset.view : 'summary';
        
        if (dtnvViewType === 'summary') {
            revenueContainer.classList.remove('hidden');
            detailContainer.classList.add('hidden');
            return;
        }

        const employeeId = filterEl.value;
        revenueContainer.classList.add('hidden');
        detailContainer.classList.remove('hidden');

        if (!employeeId) {
            detailContainer.innerHTML = '<div class="rt-infographic-container"><p class="text-center text-gray-500 font-semibold">Vui lòng chọn một nhân viên để xem chi tiết.</p></div>';
        } else {
            const employeeName = filterEl.options[filterEl.selectedIndex].text;
            const detailData = services.generateRealtimeEmployeeDetailReport(employeeId, appState.realtimeYCXData);
            ui.renderRealtimeEmployeeDetail(detailData, employeeName);
        }
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

export { realtimeTab };