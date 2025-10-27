// Version 3.3 - Add more detailed logging in render function
// MODULE: Chịu trách nhiệm cho Tab Sức khỏe Siêu thị (Lũy kế)

import { appState } from './state.js';
import { ui } from './ui.js';
import { services } from './services.js';
import { settingsService } from './modules/settings.service.js';
import { highlightService } from './modules/highlight.service.js';

const luykeTab = {
    render() {
        console.log("[tab-luyke.js render] === Starting render ==="); // Log mới (v3.3)
        console.log(`[tab-luyke.js render] appState lengths - DSNV: ${appState.danhSachNhanVien?.length}, YCX: ${appState.ycxData?.length}`); // (v3.2)

        if (appState.danhSachNhanVien.length === 0) {
            console.log("[tab-luyke.js render] DSNV trống, hiển thị placeholder."); // (v3.2)
            ui.togglePlaceholder('health-section', true);
            return;
        }
        ui.togglePlaceholder('health-section', false);
        console.log("[tab-luyke.js render] DSNV found, proceeding."); // Log mới (v3.3)

        try {
            services.parseCompetitionDataFromLuyKe(document.getElementById('paste-luyke')?.value || '');
            console.log("[tab-luyke.js render] Parsed competition data from paste."); // Log mới (v3.3)
        } catch(e) {
            console.error("[tab-luyke.js render] Error parsing competition data:", e); // Log mới (v3.3)
        }


        const activeSubTabBtn = document.querySelector('#luyke-subtabs-nav .sub-tab-btn.active');
        const activeSubTabId = activeSubTabBtn ? activeSubTabBtn.dataset.target : 'subtab-luyke-sieu-thi';
        console.log(`[tab-luyke.js render] Active subtab: ${activeSubTabId}`); // (v3.2)

        const selectedWarehouse = document.getElementById('luyke-filter-warehouse')?.value || '';
        const selectedDept = document.getElementById('luyke-filter-department')?.value || '';
        const selectedNames = appState.choices.luyke_employee ? appState.choices.luyke_employee.getValue(true) : [];
        const selectedDates = appState.choices.luyke_date_picker ? appState.choices.luyke_date_picker.selectedDates : [];
        console.log(`[tab-luyke.js render] Filters - Warehouse: '${selectedWarehouse}', Dept: '${selectedDept}', Names: ${selectedNames.length}, Dates: ${selectedDates.length}`); // Log mới (v3.3)

        let filteredYCXData = appState.ycxData;
        if (selectedDates && selectedDates.length > 0) {
            console.log("[tab-luyke.js render] Filtering YCX data by date..."); // Log mới (v3.3)
            const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            const selectedDateSet = new Set(selectedDates.map(d => startOfDay(d)));
            filteredYCXData = appState.ycxData.filter(row => row.ngayTao instanceof Date && !isNaN(row.ngayTao) && selectedDateSet.has(startOfDay(row.ngayTao)));
        }
        console.log(`[tab-luyke.js render] Filtered YCX data length: ${filteredYCXData?.length}`); // (v3.2)

        const goals = settingsService.getLuykeGoalSettings(selectedWarehouse).goals;
        console.log("[tab-luyke.js render] Loaded goals:", goals); // Log mới (v3.3)
        try {
            appState.masterReportData.luyke = services.generateMasterReportData(filteredYCXData, goals);
            console.log(`[tab-luyke.js render] Generated masterReportData.luyke length: ${appState.masterReportData.luyke?.length}`); // (v3.2)
        } catch (e) {
            console.error("[tab-luyke.js render] Error generating master report data:", e); // Log mới (v3.3)
             ui.showNotification("Lỗi khi tính toán báo cáo tổng hợp.", "error"); // Log mới (v3.3)
             appState.masterReportData.luyke = []; // Reset để tránh lỗi tiếp theo
        }


        let filteredReport = appState.masterReportData.luyke;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedNames && selectedNames.length > 0) filteredReport = filteredReport.filter(nv => selectedNames.includes(String(nv.maNV)));
        console.log(`[tab-luyke.js render] Final filtered report length for UI: ${filteredReport?.length}`); // (v3.2)

        // --- Logic render theo Subtab ---
        try { // Thêm try...catch cho phần render UI (v3.3)
            if (activeSubTabId === 'subtab-luyke-sieu-thi') {
                console.log("[tab-luyke.js render] Rendering subtab 'Siêu thị Lũy kế'."); // (v3.2)
                if(filteredReport.length === 0 && appState.ycxData.length > 0) {
                     console.warn("[tab-luyke.js render] Filtered report is empty, but YCX data exists. Check filters or master report generation."); // (v3.2)
                }
                const supermarketReport = services.aggregateReport(filteredReport, selectedWarehouse);
                console.log("[tab-luyke.js render] Aggregated supermarket report:", JSON.stringify(supermarketReport).substring(0, 300) + "..."); // (v3.2 - Sửa đổi v3.3)
                const numDays = selectedDates.length > 0 ? selectedDates.length : new Set(appState.ycxData.map(row => row.ngayTao instanceof Date ? new Date(row.ngayTao).toDateString() : null).filter(Boolean)).size || 1;
                console.log(`[tab-luyke.js render] numDays calculated: ${numDays}`); // Log mới (v3.3)

                console.log("[tab-luyke.js render] Calling ui.updateLuykeSupermarketTitle..."); // Log mới (v3.3)
                ui.updateLuykeSupermarketTitle(selectedWarehouse, new Date());
                console.log("[tab-luyke.js render] Calling ui.renderLuykeEfficiencyTable..."); // Log mới (v3.3)
                ui.renderLuykeEfficiencyTable(supermarketReport, goals);
                console.log("[tab-luyke.js render] Calling ui.renderLuykeCategoryDetailsTable..."); // Log mới (v3.3)
                ui.renderLuykeCategoryDetailsTable(supermarketReport, numDays);
                console.log("[tab-luyke.js render] Calling ui.renderLuykeQdcTable..."); // Log mới (v3.3)
                ui.renderLuykeQdcTable(supermarketReport, numDays);

                console.log("[tab-luyke.js render] Calling services.generateLuyKeChuaXuatReport..."); // Log mới (v3.3)
                const chuaXuatReport = services.generateLuyKeChuaXuatReport(filteredYCXData);
                console.log("[tab-luyke.js render] Calling ui.renderChuaXuatTable..."); // Log mới (v3.3)
                ui.renderChuaXuatTable(chuaXuatReport);

                console.log("[tab-luyke.js render] Calling services.parseLuyKePastedData..."); // Log mới (v3.3)
                const pastedData = services.parseLuyKePastedData(document.getElementById('paste-luyke')?.value || '');
                console.log("[tab-luyke.js render] Calling ui.displayHealthKpiTable..."); // Log mới (v3.3)
                ui.displayHealthKpiTable(pastedData, goals);

            } else if (activeSubTabId === 'subtab-luyke-thi-dua') {
                 console.log("[tab-luyke.js render] Rendering subtab 'Thi đua Lũy kế'."); // (v3.2)
                const switcherPlaceholder = document.getElementById('luyke-thidua-view-selector-placeholder'); // Should be removed or updated in ui.js if still used
                const contentContainer = document.getElementById('luyke-competition-content');

                if (contentContainer) {
                     contentContainer.innerHTML = '<div id="luyke-competition-infographic-container" class="mt-4"></div>';
                } else {
                     console.error("[tab-luyke.js render] Missing #luyke-competition-content container");
                }

                const activeViewBtn = document.querySelector('#luyke-thidua-view-selector .view-switcher__btn.active');
                const viewType = activeViewBtn ? activeViewBtn.dataset.view : 'summary';
                console.log(`[tab-luyke.js render] Calling ui.displayCompetitionResultsFromLuyKe with viewType: ${viewType}`); // Log mới (v3.3)
                ui.displayCompetitionResultsFromLuyKe(document.getElementById('paste-luyke')?.value || '', viewType);

            } else if (activeSubTabId === 'subtab-luyke-thidua-vung') {
                console.log("[tab-luyke.js render] Rendering subtab 'Thi đua Vùng'."); // (v3.2)
                const controlsCard = document.querySelector('#subtab-luyke-thidua-vung .content-card');
                if (controlsCard) {
                    controlsCard.classList.remove('hidden');
                     console.log("[tab-luyke.js render] Thi đua Vùng: Ensured controlsCard is visible."); // (v3.2)
                } else {
                     console.error("[tab-luyke.js render] Thi đua Vùng: Cannot find controlsCard."); // (v3.2)
                }

                const choicesInstance = appState.choices.thiDuaVung_sieuThi;
                const selectedSupermarket = choicesInstance ? choicesInstance.getValue(true) : null;
                const hasFileData = appState.thiDuaVungChiTiet && appState.thiDuaVungChiTiet.length > 0;
                console.log("[tab-luyke.js render] Thi đua Vùng: selectedSupermarket:", selectedSupermarket, "hasFileData:", hasFileData); // (v3.2)

                if (selectedSupermarket && hasFileData) {
                    const reportData = services.generateThiDuaVungReport(selectedSupermarket);
                     console.log("[tab-luyke.js render] Thi đua Vùng: Calling ui.renderThiDuaVungInfographic with data:", reportData); // (v3.2)
                    ui.renderThiDuaVungInfographic(reportData);
                } else {
                    const container = document.getElementById('thidua-vung-infographic-container');
                    if (container) {
                        container.innerHTML = `<div class="placeholder-message">Vui lòng tải file và chọn một siêu thị để xem báo cáo.</div>`;
                          console.log("[tab-luyke.js render] Thi đua Vùng: Rendered placeholder."); // (v3.2)
                    } else {
                         console.error("[tab-luyke.js render] Thi đua Vùng: Cannot find infographic container."); // (v3.2)
                    }
                }
            } else {
                 console.warn(`[tab-luyke.js render] Unknown activeSubTabId: ${activeSubTabId}`); // Log mới (v3.3)
            }
        } catch (uiError) {
             console.error(`[tab-luyke.js render] Error during UI rendering for subtab ${activeSubTabId}:`, uiError); // Log mới (v3.3)
             ui.showNotification("Đã xảy ra lỗi khi hiển thị dữ liệu tab.", "error"); // Log mới (v3.3)
             const errorContainer = document.getElementById(activeSubTabId);
             if (errorContainer) {
                 errorContainer.innerHTML = `<div class="placeholder-message notification-error">Lỗi hiển thị dữ liệu. Vui lòng kiểm tra Console (F12) để biết chi tiết hoặc thử tải lại trang.</div>`;
             }
        }


        console.log("[tab-luyke.js render] Calling highlightService..."); // Log mới (v3.3)
        highlightService.populateHighlightFilters('luyke', filteredYCXData, filteredReport);
        highlightService.applyHighlights('luyke');
        console.log("[tab-luyke.js render] === Render complete ==="); // (v3.2 - Sửa đổi v3.3)
    },
};

export { luykeTab };