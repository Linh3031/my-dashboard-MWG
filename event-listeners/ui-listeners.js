// Version 3.41 - Add listeners for Special Program Edit/Delete buttons
// Version 3.34 - Refactor: Hoàn tất di dời 2 listener (Template, Debug) sang data.service.js
// ... (các phiên bản trước giữ nguyên)
// MODULE: EVENT LISTENERS INITIALIZER
// File này đóng vai trò là điểm khởi đầu, import và khởi chạy tất cả các module listener con.

import { appState } from '../state.js';
import { ui } from '../ui.js';
import { services } from '../services.js';
import { luykeTab } from '../tab-luyke.js';
import { sknvTab } from '../tab-sknv.js';
import { uiRealtime } from '../ui-realtime.js';
import { initializeActionListeners } from './listeners-actions.js';
import { initializeCollaborationListeners } from './listeners-collaboration.js';
import { initializeCompetitionListeners } from './listeners-competition.js';
import { initializeHighlightingListeners } from './listeners-highlighting.js';
import { initializeSettingsListeners } from './listeners-settings.js';
import { initializeSortingListeners } from './listeners-sorting.js';
import { dragDroplisteners } from './listeners-dragdrop.js';
import { captureService } from '../modules/capture.service.js';
import { firebase } from '../firebase.js';
import { uiComponents } from '../ui-components.js';
import { dataService } from '../services/data.service.js';

let appController = null;

// --- CONSTANTS ---
// (Đã xóa LOCAL_DATA_VERSIONS_KEY)

// --- HELPERS / HANDLERS ---

// (ĐÃ XÓA TOÀN BỘ HÀM handleFileInputChange)

function handleFilterChange(prefix) {
    appState.viewingDetailFor = null;
    uiComponents.updateEmployeeFilter(prefix);
    appController.updateAndRenderCurrentTab();
}

// --- MAIN INITIALIZER ---

export function initializeEventListeners(mainAppController) {
    appController = mainAppController;

    // Khởi tạo Choices.js và Flatpickr (Giữ nguyên)
    try {
        const multiSelectConfig = { removeItemButton: true, placeholder: true, placeholderValue: 'Chọn hoặc gõ để tìm...', searchPlaceholderValue: 'Tìm kiếm...' };
        const competitionMultiSelectConfig = { ...multiSelectConfig };

        ['luyke', 'sknv', 'realtime'].forEach(prefix => {
            const employeeEl = document.getElementById(`${prefix}-filter-name`);
            if (employeeEl) appState.choices[`${prefix}_employee`] = new Choices(employeeEl, multiSelectConfig);
            ['warehouse', 'department'].forEach(type => {
                 const el = document.getElementById(`${prefix}-filter-${type}`);
                if(el) appState.choices[`${prefix}_${type}`] = new Choices(el, { searchEnabled: true, removeItemButton: false, itemSelectText: 'Chọn' });
            });
            ['nhanhang', 'nhomhang', 'employee'].forEach(type => {
                const highlightEl = document.getElementById(`${prefix}-highlight-${type}`);
                if (highlightEl) appState.choices[`${prefix}_highlight_${type}`] = new Choices(highlightEl, multiSelectConfig);
            });
        });
        const competitionBrandEl = document.getElementById('competition-brand');
        if (competitionBrandEl) appState.choices['competition_brand'] = new Choices(competitionBrandEl, competitionMultiSelectConfig);
        const competitionGroupEl = document.getElementById('competition-group');
        if (competitionGroupEl) appState.choices['competition_group'] = new Choices(competitionGroupEl, competitionMultiSelectConfig);
        
        // ========== START: THÊM MỚI (SP ĐẶC QUYỀN) ==========
        // Thêm select box mới cho chương trình SPĐQ
        const specialProgramGroupEl = document.getElementById('special-program-group');
        if (specialProgramGroupEl) appState.choices['special_program_group'] = new Choices(specialProgramGroupEl, competitionMultiSelectConfig);
        // ========== END: THÊM MỚI ==========

        const singleSelectConfig = { searchEnabled: true, removeItemButton: false, itemSelectText: 'Chọn', searchPlaceholderValue: 'Tìm kiếm...' };
        
        const singleSelects = {
             'thidua-employee-filter': 'thidua_employee_detail',
            'thidua-vung-filter-supermarket': 'thiDuaVung_sieuThi',
            'realtime-brand-category-filter': 'realtime_brand_category_filter',
            'realtime-brand-filter': 'realtime_brand_filter',
        };

        for (const [id, key] of Object.entries(singleSelects)) {
             const el = document.getElementById(id);
             if (el) appState.choices[key] = new Choices(el, singleSelectConfig);
        }
    } catch (error) { console.error("Lỗi khi khởi tạo Choices.js:", error); }

    try {
        const initDatePicker = (prefix, renderFunc) => {
            const datePickerEl = document.getElementById(`${prefix}-filter-date`);
            if (!datePickerEl) return;
            const datePicker = flatpickr(datePickerEl, {
                mode: "multiple", dateFormat: "d/m", maxDate: "today",
                onClose: (selectedDates, dateStr, instance) => {
                    if (selectedDates.length === 2) {
                         const [start, end] = selectedDates.sort((a,b) => a - b);
                        const dateRange = Array.from({length: (end - start) / 86400000 + 1}, (_, i) => new Date(start.getTime() + i * 86400000));
                         instance.setDate(dateRange, false);
                    }
                    uiComponents.updateDateSummary(document.getElementById(`${prefix}-date-summary`), instance);
                    appState.viewingDetailFor = null;
                    renderFunc();
                }
            });
            appState.choices[`${prefix}_date_picker`] = datePicker;
            document.getElementById(`${prefix}-clear-date`)?.addEventListener('click', () => { datePicker.clear(); renderFunc(); });
        };
        initDatePicker('luyke', luykeTab.render);
        initDatePicker('sknv', sknvTab.render);
    } catch (error) { console.error("Lỗi khi khởi tạo Flatpickr:", error); }


    // Gọi các hàm khởi tạo listener con
    initializeSettingsListeners(appController);
    initializeHighlightingListeners(appController);
    initializeActionListeners();
    initializeCollaborationListeners(appController);
    initializeSortingListeners(appController);
    initializeCompetitionListeners(appController);
    dragDroplisteners.init(appController);

    // General UI Listeners (Giữ nguyên)
    document.getElementById('force-reload-btn')?.addEventListener('click', () => window.location.reload());
    document.querySelectorAll('a.nav-link').forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); appController.switchTab(link.getAttribute('href').substring(1)); }));
    document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.addEventListener('click', (e) => {
        ui.handleSubTabClick(e.currentTarget);
        appState.viewingDetailFor = null;
        const mainTabId = e.currentTarget.closest('.page-section')?.id || e.currentTarget.closest('.settings-drawer')?.id;
        if (mainTabId === 'health-section') luykeTab.render();
        else if (mainTabId === 'health-employee-section') sknvTab.render();
        else if (mainTabId === 'realtime-section') uiRealtime.render();
    }));
    document.querySelectorAll('.toggle-filters-btn').forEach(button =>
        button.addEventListener('click', () => ui.toggleFilterSection(button.dataset.target)));

    // --- BẮT ĐẦU TÁI CẤU TRÚC (v3.32 -> v3.34) ---
    // File input listeners - Trỏ đến dataService
    document.querySelectorAll('.file-input').forEach(input => {
        if (input.id !== 'file-thidua-vung' && input.id !== 'file-category-structure' && input.id !== 'realtime-file-input' && input.id !== 'debug-competition-file-input' && input.id !== 'file-special-products') { // <-- THÊM MỚI: Loại trừ file SPĐQ
            input.addEventListener('change', (e) => dataService.handleFileUpload(e));
        }
    });
    // Gán các handler đặc biệt - Trỏ đến dataService
    document.getElementById('file-category-structure')?.addEventListener('change', (e) => dataService.handleCategoryFile(e));
    
    // ========== START: THÊM MỚI (SP ĐẶC QUYỀN) ==========
    // Thêm listener cho file SPĐQ
    document.getElementById('file-special-products')?.addEventListener('change', (e) => dataService.handleSpecialProductFileUpload(e));
    // Thêm listener cho form submit SPĐQ
    document.getElementById('special-program-form')?.addEventListener('submit', (e) => appController._handleSpecialProgramFormSubmit(e));
    // ========== END: THÊM MỚI ==========

    document.getElementById('paste-luyke')?.addEventListener('input', () => dataService.handleLuykePaste());
    document.getElementById('paste-thiduanv')?.addEventListener('input', () => dataService.handleThiduaNVPaste());
    document.getElementById('paste-thuongerp')?.addEventListener('input', () => dataService.handleErpPaste());
    document.getElementById('paste-thuongerp-thangtruoc')?.addEventListener('input', (e) => dataService.handleErpThangTruocPaste(e));
    document.getElementById('realtime-file-input')?.addEventListener('change', (e) => dataService.handleRealtimeFileInput(e));
    document.getElementById('file-thidua-vung')?.addEventListener('change', (e) => dataService.handleThiDuaVungFileInput(e));
    
    // <<< CẬP NHẬT (v3.34) >>>
    document.getElementById('download-danhsachnv-template-btn')?.addEventListener('click', () => dataService.handleTemplateDownload());
    document.getElementById('thidua-vung-filter-supermarket')?.addEventListener('change', () => appController.handleThiDuaVungFilterChange()); // (Giữ nguyên)
    document.getElementById('debug-competition-file-input')?.addEventListener('change', (e) => dataService.handleCompetitionDebugFile(e)); 
    // --- KẾT THÚC TÁI CẤU TRÚC ---

    // Filter change listeners (Giữ nguyên)
    ['luyke', 'sknv', 'realtime'].forEach(prefix => {
        document.getElementById(`${prefix}-filter-warehouse`)?.addEventListener('change', () => handleFilterChange(prefix));
        document.getElementById(`${prefix}-filter-department`)?.addEventListener('change', () => handleFilterChange(prefix));
         document.getElementById(`${prefix}-filter-name`)?.addEventListener('change', () => handleFilterChange(prefix));
    });

    // Warehouse selector listener (Giữ nguyên logic, nhưng thay đổi hàm callback)
    document.getElementById('data-warehouse-selector')?.addEventListener('change', (e) => {
        const selectedKho = e.target.value;
        console.log("[DEBUG] Kho selection changed. Selected:", selectedKho);
        if (selectedKho) {
            appState.selectedWarehouse = selectedKho;
            localStorage.setItem('selectedWarehouse', selectedKho);
            ui.showNotification(`Đã chuyển sang làm việc với kho ${selectedKho}.`, 'success');
             if(appController.unsubscribeDataListener) {
                console.log("[DEBUG] Unsubscribing from previous warehouse listener.");
                appController.unsubscribeDataListener();
            }
            appController.unsubscribeDataListener = firebase.listenForDataChanges(selectedKho, (cloudData) => {
                dataService.handleCloudDataUpdate(cloudData); 
            });
            ['ycx', 'giocong', 'thuongnong'].forEach(ft => {
                const versionInfo = appController._localDataVersions?.[selectedKho]?.[ft];
                if (!versionInfo || !versionInfo.version ||
                    versionInfo.version === 0) {
                     uiComponents.updateFileStatus(ft, 'Cloud', `Đang chờ đồng bộ từ kho ${selectedKho}...`, 'default');
                }
            });
        } else {
            appState.selectedWarehouse = null;
            localStorage.removeItem('selectedWarehouse');
            ui.showNotification(`Đã bỏ chọn kho. Đồng bộ cloud tạm dừng.`, 'success');
            if(appController.unsubscribeDataListener) {
                 console.log("[DEBUG] Unsubscribing warehouse listener (no warehouse selected).");
                appController.unsubscribeDataListener();
                appController.unsubscribeDataListener = null;
            }
             ['ycx', 'giocong', 'thuongnong'].forEach(ft => uiComponents.updateFileStatus(ft, '', 'Chọn kho để đồng bộ...', 'default'));
        }
        appController.updateAndRenderCurrentTab();
    });

    // Other specific listeners (Giữ nguyên)
    document.getElementById('sknv-view-selector')?.addEventListener('click', (e) => appController.handleSknvViewChange(e));
    document.getElementById('sknv-employee-filter')?.addEventListener('change', () => sknvTab.render());

    // Body click listener (Giữ nguyên logic, nhưng thay đổi hàm callback)
    document.body.addEventListener('click', (e) => {
        
        // ========== START: THÊM MỚI (SP ĐẶC QUYỀN) ==========
        // Các nút trong form SP Đặc Quyền
        const addSpecialBtn = e.target.closest('#add-special-program-btn');
        const cancelSpecialBtn = e.target.closest('#cancel-special-program-btn');
        
        if (addSpecialBtn) {
            e.preventDefault();
            appController._handleSpecialProgramFormShow(true); // Cần tạo hàm này trong main.js
            return;
        }
        if (cancelSpecialBtn) {
            e.preventDefault();
            appController._handleSpecialProgramFormShow(false); // Cần tạo hàm này trong main.js
            return;
        }
        
        // === START: SỬA LỖI (Bug 2 - Thêm listener cho Sửa/Xóa) ===
        const editSpecialBtn = e.target.closest('.edit-special-program-btn');
        const deleteSpecialBtn = e.target.closest('.delete-special-program-btn');

        if (editSpecialBtn) {
            e.preventDefault();
            const index = parseInt(editSpecialBtn.dataset.index, 10);
            appController._handleSpecialProgramFormEdit(index); // Sẽ thêm ở main.js
            return;
        }
        if (deleteSpecialBtn) {
            e.preventDefault();
            const index = parseInt(deleteSpecialBtn.dataset.index, 10);
            if (confirm('Bạn có chắc chắn muốn xóa chương trình SP Đặc Quyền này?')) {
                appController._handleSpecialProgramDelete(index); // Sẽ thêm ở main.js
            }
            return;
        }
        // === END: SỬA LỖI (Bug 2) ===

        // (Listeners cho Sửa/Xóa sẽ được thêm sau khi UI render list)
        // ========== END: THÊM MỚI ==========

        const interactiveRow = e.target.closest('.interactive-row');
        if (interactiveRow && interactiveRow.dataset.employeeId) {
            e.preventDefault();
            if (appState.viewingDetailFor && appState.viewingDetailFor.employeeId === interactiveRow.dataset.employeeId) return;
            appState.viewingDetailFor = { employeeId: interactiveRow.dataset.employeeId, sourceTab: interactiveRow.dataset.sourceTab };
            appController.updateAndRenderCurrentTab();
            return;
        }
        const backButton = e.target.closest('.back-to-summary-btn');
        if (backButton) {
            e.preventDefault();
            appState.viewingDetailFor = null;
            appController.updateAndRenderCurrentTab();
            return;
        }
        
        // *** START: SỬA LỖI (Loại bỏ nút chi tiết LK) ***
        // Sửa lỗi 1 (chia mảnh) và 2 (biểu đồ trắng)
        const captureDetailBtn = e.target.closest('#capture-sknv-detail-btn, #capture-dtnv-rt-detail-btn');
        if (captureDetailBtn) {
            e.preventDefault();
            const areaToCapture = captureDetailBtn.closest('.sub-tab-content')?.querySelector('[id$="-capture-area"]');
            const title = appState.viewingDetailFor?.employeeId || 'ChiTietNV';
            
            if (areaToCapture) {
                // Luôn gọi captureAndDownload (sửa lỗi chia mảnh)
                // và dùng preset 'preset-mobile-portrait' (sửa lỗi biểu đồ trắng + đồng bộ kích thước)
                
                // Áp dụng preset di động cho chi tiết SKNV
                if (captureDetailBtn.id === 'capture-sknv-detail-btn') {
                    captureService.captureAndDownload(areaToCapture, title, 'preset-mobile-portrait');
                } else {
                    // Chi tiết DTNV Realtime
                    captureService.captureAndDownload(areaToCapture, title, 'preset-mobile-portrait');
                }
            }
            // *** END: SỬA LỖI (Loại bỏ nút chi tiết LK) ***
            return;
        }
        
        const luykeViewSwitcherBtn = e.target.closest('#luyke-thidua-view-selector .view-switcher__btn');
        if (luykeViewSwitcherBtn) {
            e.preventDefault();
            appController.handleLuykeThiDuaViewChange(e);
            return;
        }

        // *** NEW (v3.29) ***
        const sknvThiDuaViewSwitcherBtn = e.target.closest('#sknv-thidua-view-selector .view-switcher__btn');
        if (sknvThiDuaViewSwitcherBtn) {
            e.preventDefault();
            // Xử lý chuyển đổi view trực tiếp
            const viewSelector = sknvThiDuaViewSwitcherBtn.closest('#sknv-thidua-view-selector');
            if (viewSelector) {
                 viewSelector.querySelectorAll('.view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            }
            sknvThiDuaViewSwitcherBtn.classList.add('active');
            
            // Render lại tab SKNV (nó sẽ đọc nút active này)
            appController.updateAndRenderCurrentTab(); 
            return;
        }
        // *** END NEW ***

        const thiDuaViewSwitcherBtn = e.target.closest('#thidua-view-selector .view-switcher__btn');
        if (thiDuaViewSwitcherBtn) {
            e.preventDefault();
            appController.handleThiDuaViewChange(e);
            return;
        }
        const dtHangViewSwitcherBtn = e.target.closest('#dthang-realtime-view-selector .view-switcher__btn');
        if (dtHangViewSwitcherBtn) {
            e.preventDefault();
            appController.handleDthangRealtimeViewChange(e);
            return;
        }

        const downloadBtn = e.target.closest('.download-data-btn');
        if (downloadBtn) {
            e.preventDefault();
            const dataType = downloadBtn.dataset.type;
            const warehouse = downloadBtn.dataset.warehouse;
            if (dataType && warehouse && appController) {
                console.log(`[Body Click Listener] Download button clicked for ${dataType} @ ${warehouse}`);
                dataService.handleDownloadAndProcessData(dataType, warehouse); 
            } else {
                console.error("Download button clicked but missing data-type or data-warehouse.", downloadBtn);
            }
            return;
        }

        // === START: MODIFIED (v3.39) - Nâng cấp bộ lọc ngày ===
        
        // (Task 1) Listener cho các nút lọc ngày (TRỪ nút Tùy chọn)
        const dailyChartFilterBtn = e.target.closest('.lk-daily-filter-btn:not(#lk-daily-filter-custom)');
        if (dailyChartFilterBtn) {
            e.preventDefault();
            
            // Xóa trạng thái lọc tùy chỉnh (nếu có)
            if(appState.currentEmployeeDetailData) appState.currentEmployeeDetailData.customFilteredDailyStats = null;

            const filterValue = dailyChartFilterBtn.dataset.days; // "3", "5", "7", "10", "all"
            
            // Cập nhật UI nút
            document.querySelectorAll('.lk-daily-filter-btn').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-200');
            });
            dailyChartFilterBtn.classList.add('bg-blue-600', 'text-white');
            dailyChartFilterBtn.classList.remove('bg-gray-200');

            const detailData = appState.currentEmployeeDetailData;
            if (detailData && detailData.dailyStats) {
                let dataForChart;
                if (filterValue === 'all') {
                    dataForChart = detailData.dailyStats; // Lấy tất cả
                } else {
                    const days = parseInt(filterValue, 10);
                    dataForChart = detailData.dailyStats.slice(-days); // Lấy X ngày cuối
                }
                
                // Gọi trực tiếp hàm render biểu đồ (nhanh hơn là render lại toàn bộ tab)
                ui._renderDailyCharts(detailData.dailyStats, dataForChart); // Pass mảng đã lọc
            } else {
                console.warn("Không tìm thấy appState.currentEmployeeDetailData.dailyStats, không thể vẽ lại biểu đồ.");
            }
            return;
        }

        // (Task 3) Listener cho nút "Tùy chọn..."
        const customDateFilterBtn = e.target.closest('#lk-daily-filter-custom');
        if (customDateFilterBtn) {
            e.preventDefault();
            
            const detailData = appState.currentEmployeeDetailData;
            if (!detailData || !detailData.dailyStats) {
                ui.showNotification("Lỗi: Không tìm thấy dữ liệu ngày để lọc.", "error");
                return;
            }

            // Cập nhật UI nút (làm cho nó active)
            document.querySelectorAll('.lk-daily-filter-btn').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-200');
            });
            customDateFilterBtn.classList.add('bg-blue-600', 'text-white');
            customDateFilterBtn.classList.remove('bg-gray-200');

            // Mở Flatpickr
            flatpickr(customDateFilterBtn, {
                mode: "range",
                dateFormat: "Y-m-d", // Dùng định dạng chuẩn để lọc
                maxDate: "today",
                defaultDate: [],
                onClose: (selectedDates) => {
                    if (selectedDates.length === 2) {
                        const [start, end] = selectedDates;
                        const startTime = start.getTime();
                        // Set end time to end of day
                        const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).getTime();

                        const filteredStats = detailData.dailyStats.filter(stat => {
                            const statTime = new Date(stat.date).getTime();
                            return statTime >= startTime && statTime <= endTime;
                        });

                        // Lưu kết quả lọc tùy chỉnh vào state
                        appState.currentEmployeeDetailData.customFilteredDailyStats = filteredStats;
                        
                        // Vẽ lại biểu đồ với dữ liệu đã lọc
                        ui._renderDailyCharts(detailData.dailyStats, filteredStats);
                    } else {
                        // Nếu không chọn range, reset
                        if(appState.currentEmployeeDetailData) appState.currentEmployeeDetailData.customFilteredDailyStats = null;
                        // Kích hoạt nút 7 ngày làm mặc định
                        const sevenDayBtn = document.querySelector('.lk-daily-filter-btn[data-days="7"]');
                        if (sevenDayBtn) sevenDayBtn.click();
                    }
                }
            }).open(); // Mở lịch ngay lập tức
            return;
        }

        // (Task 3) Listener cho thẻ KPI "Tổng đơn hàng" (Chi tiết LK)
        const customerTrigger = e.target.closest('#lk-detail-customer-trigger');
        if (customerTrigger) {
            e.preventDefault();
            const detailData = appState.currentEmployeeDetailData;
            const employeeData = appState.masterReportData.sknv.find(nv => String(nv.maNV) === String(appState.viewingDetailFor?.employeeId));
            
            if (detailData && employeeData) {
                // Sửa lỗi (Task 1): Thêm tên NV vào tiêu đề
                const modalTitle = document.getElementById('customer-detail-modal-title');
                if (modalTitle) modalTitle.textContent = `Chi tiết Khách hàng - ${employeeData.hoTen}`;
                
                // Đổ dữ liệu vào modal
                ui._renderCustomerDetailModalContent({ // Sửa lỗi path
                    byCustomer: detailData.byCustomer, 
                    mucTieu: employeeData.mucTieu 
                });
                // Mở modal
                ui.toggleModal('customer-detail-modal', true);
            }
            return;
        }

        // (Task 4) Listener cho thẻ KPI "DT Chưa Xuất" (Chi tiết LK hoặc Tóm tắt)
        const unexportedTrigger = e.target.closest('#lk-detail-unexported-trigger, #lk-summary-unexported-trigger');
        if (unexportedTrigger) {
            e.preventDefault();
            const detailData = appState.currentEmployeeDetailData; // Dữ liệu chi tiết (nếu có)
            const employeeData = appState.masterReportData.sknv.find(nv => String(nv.maNV) === String(appState.viewingDetailFor?.employeeId));
            const modalTitle = document.getElementById('unexported-detail-modal-title');

            if (detailData && employeeData) {
                // Case 1: Đang xem chi tiết nhân viên
                if (modalTitle) modalTitle.textContent = `Chi tiết Chưa xuất - ${employeeData.hoTen}`;
                ui._renderUnexportedDetailModalContent({ // Sửa lỗi path
                    unexportedDetails: detailData.unexportedDetails
                });
                ui.toggleModal('unexported-detail-modal', true);
            } else if (unexportedTrigger.id === 'lk-summary-unexported-trigger') {
                // Case 2: Đang xem tóm tắt siêu thị
                // (Chức năng này chưa được yêu cầu, nhưng có thể mở rộng ở đây)
                ui.showNotification('Chi tiết chưa xuất toàn siêu thị đang được phát triển.', 'success');
            }
            return;
        }

        // (Task 3) Listener cho các nút điều khiển bên trong Modal Khách hàng
        const customerModalControls = e.target.closest('#customer-detail-controls button[data-sort]');
        if (customerModalControls) {
            e.preventDefault();
            
            // Sửa lỗi (Task 3): Logic sắp xếp
            const sortKey = customerModalControls.dataset.sort;
            let direction = customerModalControls.dataset.direction || 'desc';
            
            // Chuyển hướng
            direction = direction === 'desc' ? 'asc' : 'desc';
            customerModalControls.dataset.direction = direction;
            
            // Cập nhật UI nút
            document.querySelectorAll('#customer-detail-controls button[data-sort]').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-200');
                if (btn !== customerModalControls) btn.dataset.direction = 'desc'; // Reset nút khác
            });
            customerModalControls.classList.add('bg-blue-600', 'text-white');
            customerModalControls.classList.remove('bg-gray-200');
            // Cập nhật text nút
            const sortText = sortKey === 'totalRealRevenue' ? 'Doanh thu' : '% Quy đổi';
            const dirText = direction === 'desc' ? 'Cao > Thấp' : 'Thấp > Cao';
            customerModalControls.textContent = `${sortText} (${dirText})`;

            // Sắp xếp lại dữ liệu và render
            const detailData = appState.currentEmployeeDetailData;
            const employeeData = appState.masterReportData.sknv.find(nv => String(nv.maNV) === String(appState.viewingDetailFor?.employeeId));
            
            if (detailData && employeeData) {
                detailData.byCustomer.sort((a, b) => {
                    const valA = a[sortKey] || 0;
                    const valB = b[sortKey] || 0;
                    return direction === 'desc' ? valB - valA : valA - valB;
                });
                
                ui._renderCustomerDetailModalContent({ 
                    byCustomer: detailData.byCustomer, 
                    mucTieu: employeeData.mucTieu 
                });
            }
            return;
        }
        
        const captureCustomerBtn = e.target.closest('#capture-customer-detail-btn');
        if (captureCustomerBtn) {
            e.preventDefault();
            // Sửa lỗi (Task 2): Chụp nội dung và dùng preset
            const modalContent = document.getElementById('customer-detail-list-container');
            if (modalContent) {
                captureService.captureAndDownload(modalContent, 'ChiTietKhachHang', 'preset-mobile-portrait');
            }
            return;
        }
        
        // (Task 4) Listener cho nút chụp ảnh Modal Chưa Xuất
        const captureUnexportedBtn = e.target.closest('#capture-unexported-detail-btn');
        if (captureUnexportedBtn) {
            e.preventDefault();
            // Sửa lỗi (Task 2): Chụp nội dung và dùng preset
            const modalContent = document.getElementById('unexported-detail-list-container');
            if (modalContent) {
                captureService.captureAndDownload(modalContent, 'ChiTietChuaXuat', 'preset-mobile-portrait');
            }
            return;
        }
        // === END: SỬA LỖI (v3.37) / MODIFIED (v3.39) ===
    });

    // Specific filter listeners (Giữ nguyên)
    document.getElementById('thidua-employee-filter')?.addEventListener('change', () => ui.displayCompetitionReport('employee'));
    document.getElementById('realtime-brand-category-filter')?.addEventListener('change', () => uiRealtime.handleBrandFilterChange());
    document.getElementById('realtime-brand-filter')?.addEventListener('change', () => uiRealtime.handleBrandFilterChange());
}