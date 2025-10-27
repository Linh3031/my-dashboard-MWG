// Version 3.7 - Fix duplicate 'activeSubTabId' identifier declaration & Add logging
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
        const activeSubTabId = activeSubTabBtn ? activeSubTabBtn.dataset.target : 'subtab-sknv'; // <<< KHAI BÁO LẦN 1 (ĐÚNG)
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

        // *** FIX: Dòng khai báo trùng lặp đã bị xóa ***
        // const activeSubTabId = document.querySelector('#employee-subtabs-nav .sub-tab-btn.active')?.dataset.target || 'subtab-sknv'; // <<< ĐÃ XÓA
        console.log(`[tab-sknv.js render] Active subtab ID (re-check): ${activeSubTabId}`); // Sử dụng lại biến đã khai báo

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
        if (activeSubTabId === 'subtab-hieu-qua-thi-dua-lk') { 
            console.log("[tab-sknv.js renderSummaryViews] Calculating competition report..."); 
            const competitionReportData = services.calculateCompetitionFocusReport( 
                filteredYCXData, 
                appState.competitionConfigs 
            );
            console.log("[tab-sknv.js renderSummaryViews] Calling ui.renderCompetitionUI..."); 
            ui.renderCompetitionUI('competition-report-container-lk', competitionReportData); 
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