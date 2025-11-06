// Version 1.0 - Initial extraction from ui-components
// MODULE: UI FILTERS
// Chứa các hàm liên quan đến việc điền dữ liệu (populate) vào các bộ lọc Choices.js và select.

import { appState } from './state.js';
import { settingsService } from './modules/settings.service.js';
import { utils } from './utils.js';

export const uiFilters = {
    /**
     * Điền dữ liệu vào tất cả các bộ lọc (Kho, Bộ phận, Nhân viên) trên các tab.
     * Được gọi sau khi DSNV được tải.
     */
    populateAllFilters() {
        console.log("[ui-filters.js populateAllFilters] Đang điền dữ liệu vào tất cả bộ lọc...");
        if (!appState.danhSachNhanVien || appState.danhSachNhanVien.length === 0) {
            console.warn("[ui-filters.js populateAllFilters] DSNV trống, không thể điền bộ lọc.");
            return;
        }

        try {
            const uniqueWarehouses = [...new Set(appState.danhSachNhanVien.map(nv => nv.maKho).filter(Boolean))].sort();
            const uniqueDepartments = [...new Set(appState.danhSachNhanVien.map(nv => nv.boPhan).filter(Boolean))].sort();
            const allEmployees = [...appState.danhSachNhanVien].sort((a, b) => a.hoTen.localeCompare(b.hoTen));

            const warehouseOptions = [{ value: '', label: 'Tất cả Kho', selected: true }]
                .concat(uniqueWarehouses.map(item => ({ value: item, label: item })));
            
            const departmentOptions = [{ value: '', label: 'Tất cả Bộ phận', selected: true }]
                .concat(uniqueDepartments.map(item => ({ value: item, label: item })));

            const employeeOptions = allEmployees.map(item => ({
                value: String(item.maNV),
                label: `${item.hoTen} - ${item.maNV} (${item.boPhan})`
            }));

            ['luyke', 'sknv', 'realtime'].forEach(prefix => {
                const whChoices = appState.choices[`${prefix}_warehouse`];
                if (whChoices) {
                    const currentVal = whChoices.getValue(true);
                    whChoices.clearStore();
                    whChoices.setChoices(warehouseOptions, 'value', 'label', true);
                    if (currentVal) whChoices.setValue([currentVal]);
                }
                
                const deptChoices = appState.choices[`${prefix}_department`];
                if (deptChoices) {
                    const currentVal = deptChoices.getValue(true);
                    deptChoices.clearStore();
                    deptChoices.setChoices(departmentOptions, 'value', 'label', true);
                    if (currentVal) deptChoices.setValue([currentVal]);
                }

                const empChoices = appState.choices[`${prefix}_employee`];
                if (empChoices) {
                    const currentVal = empChoices.getValue(true);
                    empChoices.clearStore();
                    empChoices.setChoices(employeeOptions, 'value', 'label', true);
                    if (currentVal) empChoices.setValue(currentVal);
                }
            });

            // === START: SỬA LỖI (v3.27) - Điền dữ liệu cho Goal Settings Drawer ===
            try {
                const goalWarehouseOptions = uniqueWarehouses.map(item => ({ value: item, label: item }));
                
                const luykeGoalSelect = document.getElementById('luyke-goal-warehouse-select');
                if (luykeGoalSelect) {
                    luykeGoalSelect.innerHTML = goalWarehouseOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
                }

                const rtGoalSelect = document.getElementById('rt-goal-warehouse-select');
                if (rtGoalSelect) {
                    rtGoalSelect.innerHTML = goalWarehouseOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
                }
                
                // Sau khi điền, gọi hàm load setting để chọn đúng kho (nếu có)
                settingsService.loadAndApplyLuykeGoalSettings();
                settingsService.loadAndApplyRealtimeGoalSettings();

            } catch (goalError) {
                console.error("[ui-filters.js populateAllFilters] Lỗi khi điền bộ lọc cho Goal Drawer:", goalError);
            }
            // === END: SỬA LỖI (v3.27) ===

            console.log("[ui-filters.js populateAllFilters] Đã điền xong bộ lọc.");
        } catch (error) {
            console.error("[ui-filters.js populateAllFilters] Lỗi nghiêm trọng khi điền bộ lọc:", error);
        }
    },

    /**
     * Cập nhật danh sách 'Hãng' dựa trên 'Ngành hàng' đã chọn trong tab Realtime.
     * @param {string} selectedCategory - Ngành hàng đã chọn.
     */
    updateBrandFilterOptions(selectedCategory) {
        const brandFilterEl = document.getElementById('realtime-brand-filter');
        const brandChoices = appState.choices['realtime_brand_filter']; 
        
        if (!brandFilterEl || !brandChoices) {
            console.warn("[updateBrandFilterOptions] Lỗi: Brand filter hoặc Choices instance chưa sẵn sàng.");
            return;
        }

        let availableBrands = [];
        if (selectedCategory) {
            // Lọc các hãng dựa trên ngành hàng đã chọn trong dữ liệu realtime
            availableBrands = [...new Set(appState.realtimeYCXData
                .filter(row => utils.cleanCategoryName(row.nganhHang) === selectedCategory)
                .map(row => row.nhaSanXuat || 'Hãng khác')
                .filter(Boolean))
            ].sort();
        } else {
            // Nếu không chọn ngành hàng, hiển thị tất cả hãng có trong dữ liệu realtime
            availableBrands = [...new Set(appState.realtimeYCXData
                .map(row => row.nhaSanXuat || 'Hãng khác')
                .filter(Boolean))
            ].sort();
        }

        // Tạo danh sách options
        let brandOptions = [{ value: '', label: 'Tất cả các hãng', selected: true }];
        brandOptions = brandOptions.concat(availableBrands.map(brand => ({ value: brand, label: brand })));
        
        // Lấy giá trị hiện tại để cố gắng bảo toàn lựa chọn
        const currentValue = brandChoices.getValue(true);
        
        // Cập nhật Choices.js
        brandChoices.clearStore();
        brandChoices.setChoices(brandOptions, 'value', 'label', true);
        
        // Cố gắng đặt lại giá trị cũ nếu nó vẫn tồn tại trong danh sách mới
        if (currentValue && availableBrands.includes(currentValue)) {
            brandChoices.setValue([currentValue]);
        } else {
             brandChoices.setValue(['']); // Reset về "Tất cả"
        }
    },

    populateCompetitionFilters() {
        // ... (Giữ nguyên)
        const groupSelectInstance = appState.choices['competition_group'];
        if (!groupSelectInstance) return;
        const uniqueGroups = [...new Set(appState.categoryStructure.map(item => utils.cleanCategoryName(item.nhomHang)).filter(Boolean))].sort();
        const groupOptions = uniqueGroups.map(group => ({ value: group, label: group }));
        groupSelectInstance.clearStore();
        groupSelectInstance.setChoices(groupOptions, 'value', 'label', true);
    },

    populateCompetitionBrandFilter() {
        // ... (Giữ nguyên)
        const brandSelectInstance = appState.choices['competition_brand'];
        if (!brandSelectInstance) return;
        const brands = appState.brandList || [];
        const brandOptions = brands.map(brand => ({ value: brand, label: brand }));
        brandSelectInstance.clearStore();
        brandSelectInstance.setChoices(brandOptions, 'value', 'label', true);
    },

    populateWarehouseSelector() {
        // ... (Giữ nguyên)
        const selector = document.getElementById('data-warehouse-selector');
        if (!selector) {
            console.error("Không tìm thấy #data-warehouse-selector");
            return;
        }

        if (!appState.danhSachNhanVien || appState.danhSachNhanVien.length === 0) {
            selector.innerHTML = '<option value="">-- Vui lòng tải Danh sách Nhân viên --</option>';
            selector.disabled = true;
            console.log("populateWarehouseSelector: DSNV trống.");
            return;
        }

        const uniqueWarehouses = [...new Set(appState.danhSachNhanVien.map(nv => String(nv.maKho).trim()).filter(Boolean))].sort();
        console.log("populateWarehouseSelector: Các kho tìm thấy (dạng chuỗi):", uniqueWarehouses);

        let optionsHTML = '<option value="">-- Chọn Kho --</option>';
        optionsHTML += uniqueWarehouses.map(kho => `<option value="${kho}">${kho}</option>`).join('');
        selector.innerHTML = optionsHTML;
        selector.disabled = false;

        let currentSelected = appState.selectedWarehouse ? String(appState.selectedWarehouse).trim() : null;
        if (!currentSelected) {
             const storedValue = localStorage.getItem('selectedWarehouse');
             currentSelected = storedValue ? String(storedValue).trim() : '';
        }
        console.log("populateWarehouseSelector: Kho đang chọn (state/local, dạng chuỗi):", currentSelected);
        if (currentSelected && uniqueWarehouses.includes(currentSelected)) {
            selector.value = currentSelected;
            if (appState.selectedWarehouse !== currentSelected) {
                 appState.selectedWarehouse = currentSelected;
                 console.log("populateWarehouseSelector: Đã cập nhật state.selectedWarehouse thành:", currentSelected);
            }
            console.log("populateWarehouseSelector: Đã chọn kho:", selector.value);
        } else {
             if (currentSelected && !uniqueWarehouses.includes(currentSelected)) {
                 console.log(`populateWarehouseSelector: Kho đã lưu '${currentSelected}' không hợp lệ (không có trong ${uniqueWarehouses.join(',')}), đang reset.`);
                 appState.selectedWarehouse = null;
                 localStorage.removeItem('selectedWarehouse');
                 selector.value = "";
                 console.log("populateWarehouseSelector: Reset state về null và selector về '-- Chọn Kho --'.");
             } else if (!currentSelected) {
                 console.log("populateWarehouseSelector: Không có kho nào được lưu.");
                 appState.selectedWarehouse = null;
                 selector.value = "";
                 console.log("populateWarehouseSelector: Reset state về null và selector về '-- Chọn Kho --'.");
             } else {
                 console.log(`populateWarehouseSelector: Kho '${currentSelected}' hợp lệ hoặc không có gì để reset.`);
             }
        }
    },
};