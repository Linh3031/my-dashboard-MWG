// Version 3.8 - Add view-switcher logic for sknv-thidua tab
// Version 3.7 - Fix duplicate 'activeSubTabId' identifier declaration & Add logging
// MODULE: TAB SKNV
// Chịu trách nhiệm render và xử lý logic cho tab "Sức khỏe nhân viên"

import { appState } from './state.js';
import { services } from './services.js';
import { ui } from './ui.js';
import { settingsService } from './modules/settings.service.js';
import { highlightService } from './modules/highlight.service.js';
import { dragDroplisteners } from './event-listeners/listeners-dragdrop.js';
import { uiSknv } from './ui-sknv.js'; // Import uiSknv để gọi hàm render mới
import { uiCompetition } from './ui-competition.js'; // Import logic render "Theo Chương Trình"

export const sknvTab = {
    render() {
        console.log("[tab-sknv.js render] === Starting render ==="); 
        console.log(`[tab-sknv.js render] Current appState lengths - DSNV: ${appState.danhSachNhanVien?.length}, YCX: ${appState.ycxData?.length}`); 

        if (!appState.danhSachNhanVien || appState.danhSachNhanVien.length === 0) { 
            console.warn("[tab-sknv.js render] DSNV is empty, showing placeholder."); 
            ui.togglePlaceholder('health-employee-section', true); 
            return; 
        }

        ui.togglePlaceholder('health-employee-section', false); 
        console.log("[tab-sknv.js render] DSNV found, proceeding."); 

        try {
            services.parseCompetitionDataFromLuyKe(document.getElementById('paste-luyke')?.value || '');
            console.log("[tab-sknv.js render] Parsed competition data from paste."); 
        } catch(e) {
             console.error("[tab-sknv.js render] Error parsing competition data:", e); 
        }

        const activeSubTabBtn = document.querySelector('#employee-subtabs-nav .sub-tab-btn.active'); 
        const activeSubTabId = activeSubTabBtn ? activeSubTabBtn.dataset.target : 'subtab-sknv';
        console.log(`[tab-sknv.js render] Active subtab ID: ${activeSubTabId}`); 

        const selectedWarehouse = document.getElementById('sknv-filter-warehouse')?.value || ''; 
        const selectedDept = document.getElementById('sknv-filter-department')?.value || ''; 
        const selectedNames = appState.choices.sknv_employee ? appState.choices.sknv_employee.getValue(true) : []; 
        const selectedDates = appState.choices.sknv_date_picker ? appState.choices.sknv_date_picker.selectedDates : []; 
        console.log(`[tab-sknv.js render] Filters - Warehouse: '${selectedWarehouse}', Dept: '${selectedDept}', Names: ${selectedNames.length}, Dates: ${selectedDates.length}`); 

        let filteredYCXData = appState.ycxData; 
        if (selectedDates && selectedDates.length > 0) { 
            console.log("[tab-sknv.js render] Filtering YCX data by date..."); 
            const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); 
            const selectedDateSet = new Set(selectedDates.map(d => startOfDay(d))); 
            filteredYCXData = appState.ycxData.filter(row => row.ngayTao instanceof Date && !isNaN(row.ngayTao) && selectedDateSet.has(startOfDay(row.ngayTao))); 
        }
        console.log(`[tab-sknv.js render] Filtered YCX data length: ${filteredYCXData?.length}`); 

        const goals = settingsService.getLuykeGoalSettings(selectedWarehouse).goals; 
        console.log("[tab-sknv.js render] Loaded goals:", goals); 
        try {
            appState.masterReportData.sknv = services.generateMasterReportData(filteredYCXData, goals, false); 
            console.log(`[tab-sknv.js render] Generated masterReportData.sknv length: ${appState.masterReportData.sknv?.length}`); 
        } catch(e) {
             console.error("[tab-sknv.js render] Error generating master report data:", e); 
             ui.showNotification("Lỗi khi tính toán báo cáo SKNV.", "error");
             appState.masterReportData.sknv = []; 
        }


        let filteredReport = appState.masterReportData.sknv; 
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse); 
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept); 
        if (selectedNames && selectedNames.length > 0) filteredReport = filteredReport.filter(nv => selectedNames.includes(String(nv.maNV))); 
        console.log(`[tab-sknv.js render] Final filtered report length for UI: ${filteredReport?.length}`); 

        console.log(`[tab-sknv.js render] Active subtab ID (re-check): ${activeSubTabId}`); 

        const detailInfo = appState.viewingDetailFor; 
        const isViewingDetail = detailInfo && (detailInfo.sourceTab === 'sknv' || detailInfo.sourceTab === 'dtnv-lk'); 
        console.log(`[tab-sknv.js render] Is viewing detail? ${isViewingDetail}. Detail Info:`, detailInfo); 

        try { 
            if (isViewingDetail) { 
                console.log(`[tab-sknv.js render] Rendering detail view for employee: ${detailInfo.employeeId}`); 
                const employeeData = appState.masterReportData.sknv.find(nv => String(nv.maNV) === String(detailInfo.employeeId)); 
                if (activeSubTabId === 'subtab-sknv' && detailInfo.sourceTab === 'sknv') { 
                     console.log("[tab-sknv.js render] Calling ui.displaySknvReport (detail mode)."); 
                     ui.displaySknvReport(filteredReport, true); 
                } else if (activeSubTabId === 'subtab-doanhthu-lk' && detailInfo.sourceTab === 'dtnv-lk') { 
                    console.log("[tab-sknv.js render] Calling services.generateLuyKeEmployeeDetailReport..."); 
                    const luykeDetailData = services.generateLuyKeEmployeeDetailReport(detailInfo.employeeId, filteredYCXData); 
                    console.log("[tab-sknv.js render] Calling ui.renderLuykeEmployeeDetail..."); 
                    ui.renderLuykeEmployeeDetail(luykeDetailData, employeeData, 'dtnv-lk-details-container'); 
                } else {
                    console.log(`[tab-sknv.js render] Viewing detail but not on the correct subtab (${activeSubTabId}), rendering summary instead.`); 
                    this.renderSummaryViews(activeSubTabId, filteredReport, filteredYCXData); 
                }
            } else {
                
                console.log("[tab-sknv.js render] Rendering summary views."); 
                this.renderSummaryViews(activeSubTabId, filteredReport, filteredYCXData); 
            }
        } catch (uiError) {
             console.error(`[tab-sknv.js render] Error during UI rendering for subtab ${activeSubTabId}:`, uiError); 
             ui.showNotification("Đã xảy ra lỗi khi hiển thị dữ liệu tab SKNV.", "error"); 
             const errorContainer = document.getElementById(activeSubTabId);
             if (errorContainer) {
                 errorContainer.innerHTML = `<div class="placeholder-message notification-error">Lỗi hiển thị dữ liệu. Vui lòng kiểm tra Console (F12) để biết chi tiết hoặc thử tải lại trang.</div>`;
             }
        }


         console.log("[tab-sknv.js render] Calling highlightService..."); 
         highlightService.populateHighlightFilters('sknv', filteredYCXData, filteredReport); 
        highlightService.applyHighlights('sknv'); 

        const efficiencyReportContainer = document.getElementById('efficiency-report-container'); 
        if (efficiencyReportContainer && !isViewingDetail) { 
            console.log("[tab-sknv.js render] Initializing drag-drop for efficiency table."); 
            dragDroplisteners.initializeForContainer('efficiency-report-container'); 
        }
        console.log("[tab-sknv.js render] === Render complete ==="); 
    },

    renderSummaryViews(activeSubTabId, filteredReport, filteredYCXData) {
        console.log(`[tab-sknv.js renderSummaryViews] Rendering summary for subtab: ${activeSubTabId}`); 
        
        // *** START: MODIFIED (v3.8) ***
        if (activeSubTabId === 'subtab-hieu-qua-thi-dua-lk') { 
            console.log("[tab-sknv.js renderSummaryViews] Rendering 'Thi đua NV LK' subtab.");
            
            const activeViewBtn = document.querySelector('#sknv-thidua-view-selector .view-switcher__btn.active');
            const viewType = activeViewBtn ? activeViewBtn.dataset.view : 'program';
            console.log(`[tab-sknv.js renderSummaryViews] View type selected: ${viewType}`);

            const programContainer = document.getElementById('competition-report-container-lk');
            const employeeContainer = document.getElementById('pasted-competition-report-container');

            if (!programContainer || !employeeContainer) {
                console.error("[tab-sknv.js renderSummaryViews] Missing competition containers!");
                return;
            }

            if (viewType === 'program') {
                console.log("[tab-sknv.js renderSummaryViews] Calculating 'program' report..."); 
                const competitionReportData = services.calculateCompetitionFocusReport( 
                    filteredYCXData, 
                    appState.competitionConfigs 
                );
                console.log("[tab-sknv.js renderSummaryViews] Calling uiCompetition.renderCompetitionUI..."); 
                uiCompetition.renderCompetitionUI('competition-report-container-lk', competitionReportData); 
                
                programContainer.classList.remove('hidden');
                employeeContainer.classList.add('hidden');

            } else { // viewType === 'employee'
                console.log("[tab-sknv.js renderSummaryViews] Calling uiSknv.renderPastedCompetitionReport..."); 
                
                // Lọc dữ liệu thi đua đã dán dựa trên bộ lọc chung (kho, bộ phận, tên)
                const visibleEmployeeMaNVs = new Set(filteredReport.map(nv => nv.maNV));
                const filteredPastedData = (appState.pastedThiDuaReportData || []).filter(item => 
                    visibleEmployeeMaNVs.has(item.maNV)
                );
                
                uiSknv.renderPastedCompetitionReport(filteredPastedData); 
                
                programContainer.classList.add('hidden');
                employeeContainer.classList.remove('hidden');
            }
        // *** END: MODIFIED (v3.8) ***
        
        } else if (activeSubTabId === 'subtab-sknv') { 
             console.log("[tab-sknv.js renderSummaryViews] Calling ui.displaySknvReport (summary mode)..."); 
            ui.displaySknvReport(filteredReport, false); 
        } else if (activeSubTabId === 'subtab-doanhthu-lk') { 
            console.log("[tab-sknv.js renderSummaryViews] Calling ui.displayEmployeeRevenueReport for luyke..."); 
            ui.displayEmployeeRevenueReport(filteredReport, 'revenue-report-container-lk', 'doanhthu_lk'); 
        } else if (activeSubTabId === 'subtab-thunhap') { 
            console.log("[tab-sknv.js renderSummaryViews] Calling ui.displayEmployeeIncomeReport..."); 
            ui.displayEmployeeIncomeReport(filteredReport); 
        } else if (activeSubTabId === 'subtab-hieu-qua-khai-thac-luy-ke') { 
            console.log("[tab-sknv.js renderSummaryViews] Calling ui.displayEmployeeEfficiencyReport..."); 
            ui.displayEmployeeEfficiencyReport(filteredReport, 'efficiency-report-container', 'hieu_qua'); 
        } else if (activeSubTabId === 'subtab-doanhthu-nganhhang') { 
            console.log("[tab-sknv.js renderSummaryViews] Calling ui.displayCategoryRevenueReport..."); 
            ui.displayCategoryRevenueReport(filteredReport, 'category-revenue-report-container', 'sknv'); 
        } else {
             console.warn(`[tab-sknv.js renderSummaryViews] No summary render defined for subtab: ${activeSubTabId}`); 
        }
    }
};