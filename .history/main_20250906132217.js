// Version 7.5 - Final Polishing
// MODULE 5: BỘ ĐIỀU KHIỂN TRUNG TÂM (MAIN)
// File này đóng vai trò điều phối, nhập khẩu các module khác và khởi chạy ứng dụng.

import { config } from './config.js';
import { appState } from './state.js';
import { services } from './services.js';
import { ui } from './ui.js';

const app = {
    init() {
        this.loadDataFromStorage();
        this.loadInterfaceSettings();
        this.setupEventListeners();
        this.applyContrastSetting();
        this.loadHighlightSettings();
        ui.populateAllFilters();
        this.switchTab('data-section');
    },

    loadInterfaceSettings() {
        try {
            const savedSettings = localStorage.getItem('interfaceSettings');
            const defaultSettings = {
                kpiCard1Bg: '#38bdf8', kpiCard2Bg: '#34d399', kpiCard3Bg: '#fbbf24',
                kpiCard4Bg: '#2dd4bf', kpiCard5Bg: '#a78bfa', kpiTextColor: '#ffffff'
            };
            const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
            ui.applyInterfaceSettings(settings);

            document.getElementById('kpi-color-1')?.setAttribute('value', settings.kpiCard1Bg || defaultSettings.kpiCard1Bg);
            document.getElementById('kpi-color-2')?.setAttribute('value', settings.kpiCard2Bg || defaultSettings.kpiCard2Bg);
            document.getElementById('kpi-color-3')?.setAttribute('value', settings.kpiCard3Bg || defaultSettings.kpiCard3Bg);
            document.getElementById('kpi-color-4')?.setAttribute('value', settings.kpiCard4Bg || defaultSettings.kpiCard4Bg);
            document.getElementById('kpi-color-5')?.setAttribute('value', settings.kpiCard5Bg || defaultSettings.kpiCard5Bg);
            document.getElementById('kpi-text-color')?.setAttribute('value', settings.kpiTextColor || defaultSettings.kpiTextColor);
        } catch (e) {
            console.error("Lỗi khi tải cài đặt giao diện:", e);
        }
    },
    
    saveInterfaceSettings() {
        const settings = {
            kpiCard1Bg: document.getElementById('kpi-color-1')?.value,
            kpiCard2Bg: document.getElementById('kpi-color-2')?.value,
            kpiCard3Bg: document.getElementById('kpi-color-3')?.value,
            kpiCard4Bg: document.getElementById('kpi-color-4')?.value,
            kpiCard5Bg: document.getElementById('kpi-color-5')?.value,
            kpiTextColor: document.getElementById('kpi-text-color')?.value,
        };
        localStorage.setItem('interfaceSettings', JSON.stringify(settings));
        ui.applyInterfaceSettings(settings);
        ui.showNotification('Đã cập nhật màu giao diện!', 'success');
    },
    
    loadDataFromStorage() {
        document.getElementById('declaration-ycx').value = localStorage.getItem('declaration_ycx') || config.DEFAULT_DATA.HINH_THUC_XUAT_TINH_DOANH_THU.join('\n');
        document.getElementById('declaration-ycx-gop').value = localStorage.getItem('declaration_ycx_gop') || config.DEFAULT_DATA.HINH_THUC_XUAT_TRA_GOP.join('\n');
        document.getElementById('declaration-heso').value = localStorage.getItem('declaration_heso') || Object.entries(config.DEFAULT_DATA.HE_SO_QUY_DOI).map(([k, v]) => `${k},${v}`).join('\n');

        const savedNvData = localStorage.getItem('saved_danhsachnv');
        if (savedNvData) {
            try {
                const rawData = JSON.parse(savedNvData);
                const { normalizedData, success } = services.normalizeData(rawData, 'danhsachnv');
                if (success) {
                    appState.danhSachNhanVien = normalizedData;
                    appState.danhSachNhanVien.forEach(nv => {
                        if (nv.maNV) appState.employeeMaNVMap.set(String(nv.maNV).trim(), nv);
                        if (nv.hoTen) appState.employeeNameToMaNVMap.set(nv.hoTen.toLowerCase().replace(/\s+/g, ' '), String(nv.maNV).trim());
                    });
                    document.getElementById('danhsachnv-saved-status').textContent = `Đã lưu ${appState.danhSachNhanVien.length} nhân viên.`;
                }
            } catch (e) { console.error("Lỗi đọc DSNV từ localStorage:", e); localStorage.removeItem('saved_danhsachnv'); }
        }
        try {
            const savedLuykeGoals = localStorage.getItem('luykeGoalSettings');
            if(savedLuykeGoals) appState.luykeGoalSettings = JSON.parse(savedLuykeGoals);
        } catch (e) { console.error("Lỗi đọc luykeGoalSettings từ localStorage:", e); localStorage.removeItem('luykeGoalSettings'); appState.luykeGoalSettings = {}; }
        
        try {
            const savedRealtimeGoals = localStorage.getItem('realtimeGoalSettings');
            if (savedRealtimeGoals) appState.realtimeGoalSettings = JSON.parse(savedRealtimeGoals);
        } catch(e) { console.error("Lỗi đọc realtimeGoalSettings từ localStorage:", e); localStorage.removeItem('realtimeGoalSettings'); appState.realtimeGoalSettings = {}; }
        
        this.loadAndApplyLuykeGoalSettings();
    },

    handleFileRead(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error("No file provided."));
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                    resolve(jsonData);
                } catch (err) { reject(err); }
            };
            reader.onerror = (err) => reject(new Error("Could not read the file: " + err));
            reader.readAsArrayBuffer(file);
        });
    },

    processAndRenderAllReports() {
        if (appState.danhSachNhanVien.length === 0) return;
        app.applyHealthSectionFiltersAndRender();
        app.applySknvFiltersAndRender();
        app.applyRealtimeFiltersAndRender();
    },

    applyHealthSectionFiltersAndRender() {
        if (appState.danhSachNhanVien.length === 0) return;
        const selectedWarehouse = document.getElementById('luyke-filter-warehouse').value;
        const selectedDept = document.getElementById('luyke-filter-department').value;
        const selectedNames = appState.choices.luyke_employee ? appState.choices.luyke_employee.getValue(true) : [];
        const selectedDates = appState.choices.luyke_date_picker ? appState.choices.luyke_date_picker.selectedDates : [];
        
        let filteredYCXData = appState.ycxData;
        if (selectedDates && selectedDates.length > 0) {
            const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            const selectedDateSet = new Set(selectedDates.map(d => startOfDay(d)));
            filteredYCXData = appState.ycxData.filter(row => row.ngayTao instanceof Date && !isNaN(row.ngayTao) && selectedDateSet.has(startOfDay(row.ngayTao)));
        }
        
        const goals = app.getLuykeGoalSettings(selectedWarehouse).goals;
        appState.masterReportData.luyke = services.generateMasterReportData(filteredYCXData, goals);
        
        let filteredReport = appState.masterReportData.luyke;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedNames && selectedNames.length > 0) filteredReport = filteredReport.filter(nv => selectedNames.includes(String(nv.maNV)));

        const supermarketReport = filteredReport.reduce((acc, curr) => {
            for (const key in curr) { 
                if (typeof curr[key] === 'number') acc[key] = (acc[key] || 0) + curr[key];
                else if (key === 'qdc') {
                    if(!acc.qdc) acc.qdc = {};
                    for (const qdcKey in curr.qdc) {
                        if(!acc.qdc[qdcKey]) acc.qdc[qdcKey] = { sl: 0, dt: 0, dtqd: 0, name: curr.qdc[qdcKey].name };
                        acc.qdc[qdcKey].sl += curr.qdc[qdcKey].sl;
                        acc.qdc[qdcKey].dt += curr.qdc[qdcKey].dt;
                        acc.qdc[qdcKey].dtqd += curr.qdc[qdcKey].dtqd;
                    }
                }
            }
            acc.maKho = selectedWarehouse || '';
            return acc;
        }, {});

        const aggregatedNganhHang = {};
        filteredReport.forEach(employee => {
            Object.entries(employee.doanhThuTheoNganhHang).forEach(([name, values]) => {
                if (!aggregatedNganhHang[name]) aggregatedNganhHang[name] = { quantity: 0, revenue: 0, revenueQuyDoi: 0, donGia: 0 };
                aggregatedNganhHang[name].quantity += values.quantity;
                aggregatedNganhHang[name].revenue += values.revenue;
                aggregatedNganhHang[name].revenueQuyDoi += values.revenueQuyDoi;
            });
        });
        for(const name in aggregatedNganhHang) {
            const item = aggregatedNganhHang[name];
            item.donGia = item.quantity > 0 ? item.revenue / item.quantity : 0;
        }
        supermarketReport.nganhHangChiTiet = aggregatedNganhHang;
        
        supermarketReport.pctGiaDung = supermarketReport.dtCE > 0 ? supermarketReport.dtGiaDung / supermarketReport.dtCE : 0;
        supermarketReport.pctMLN = supermarketReport.dtCE > 0 ? supermarketReport.dtMLN / supermarketReport.dtCE : 0;
        supermarketReport.pctPhuKien = supermarketReport.dtICT > 0 ? supermarketReport.dtPhuKien / supermarketReport.dtICT : 0;
        supermarketReport.pctSim = supermarketReport.slSmartphone > 0 ? supermarketReport.slSimOnline / supermarketReport.slSmartphone : 0;
        supermarketReport.pctVAS = supermarketReport.slSmartphone > 0 ? supermarketReport.slUDDD / supermarketReport.slSmartphone : 0;
        supermarketReport.pctBaoHiem = supermarketReport.slBaoHiemDenominator > 0 ? supermarketReport.slBaoHiemVAS / supermarketReport.slBaoHiemDenominator : 0;
        
        const numDays = new Set(filteredYCXData.map(row => new Date(row.ngayTao).toDateString())).size;
        
        ui.updateLuykeSupermarketTitle(selectedWarehouse, new Date());
        ui.renderLuykeEfficiencyTable(supermarketReport, goals);
        ui.renderLuykeCategoryDetailsTable(supermarketReport, numDays);
        ui.renderLuykeQdcTable(supermarketReport, numDays);

        const pastedData = services.parseLuyKePastedData(document.getElementById('paste-luyke').value);
        ui.displayHealthKpiTable(pastedData, goals, app.updateDailyGoal); 
        ui.displayCompetitionResultsFromLuyKe(document.getElementById('paste-luyke').value);
        app.populateHighlightFilters('luyke', filteredYCXData, filteredReport);
        app.applyHighlights('luyke');
    },

    applySknvFiltersAndRender() {
        if (appState.danhSachNhanVien.length === 0) return;
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
        
        const goals = app.getLuykeGoalSettings(selectedWarehouse).goals;
        appState.masterReportData.sknv = services.generateMasterReportData(filteredYCXData, goals);
        
        let filteredReport = appState.masterReportData.sknv;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedNames && selectedNames.length > 0) filteredReport = filteredReport.filter(nv => selectedNames.includes(String(nv.maNV)));
        
        ui.displayEmployeeRevenueReport(filteredReport, 'subtab-doanhthu-lk', 'doanhthu_lk');
        ui.displayEmployeeIncomeReport(filteredReport);
        ui.displayEmployeeEfficiencyReport(filteredReport, 'subtab-hieu-qua-khai-thac', 'hieu_qua');
        ui.displayCategoryRevenueReport(filteredReport, 'subtab-doanhthu-nganhhang', 'sknv');
        ui.displaySknvReport(filteredReport);
        app.populateHighlightFilters('sknv', filteredYCXData, filteredReport);
        app.applyHighlights('sknv');
    },
    
    applyRealtimeFiltersAndRender() {
        ui.updateRealtimeSupermarketTitle(document.getElementById('realtime-filter-warehouse').value, new Date());
        if (appState.realtimeYCXData.length === 0) {
             ui.renderRealtimeKpiCards({}, {});
             return;
        };
        const selectedWarehouse = document.getElementById('realtime-filter-warehouse').value;
        const selectedDept = document.getElementById('realtime-filter-department').value;
        const selectedEmployees = appState.choices.realtime_employee ? appState.choices.realtime_employee.getValue(true) : [];
        
        const settings = app.getRealtimeGoalSettings(selectedWarehouse);
        
        let filteredRealtimeYCX = appState.realtimeYCXData;
        if (selectedWarehouse || selectedDept || (selectedEmployees && selectedEmployees.length > 0)) {
            const visibleEmployees = appState.danhSachNhanVien.filter(nv => 
                (!selectedWarehouse || nv.maKho == selectedWarehouse) &&
                (!selectedDept || nv.boPhan === selectedDept) &&
                (!selectedEmployees || selectedEmployees.length === 0 || selectedEmployees.includes(String(nv.maNV)))
            ).map(nv => String(nv.maNV));
            filteredRealtimeYCX = appState.realtimeYCXData.filter(row => {
                const msnvMatch = String(row.nguoiTao || '').match(/^(\d+)/);
                return msnvMatch && visibleEmployees.includes(msnvMatch[1].trim());
            });
        }
        
        appState.masterReportData.realtime = services.generateMasterReportData(filteredRealtimeYCX, settings.goals, true);
         let filteredReport = appState.masterReportData.realtime;
         if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
         if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
         if (selectedEmployees && selectedEmployees.length > 0) filteredReport = filteredReport.filter(nv => selectedEmployees.includes(String(nv.maNV)));

        const supermarketReport = filteredReport.reduce((acc, curr) => {
             for (const key in curr) { 
                if (typeof curr[key] === 'number') acc[key] = (acc[key] || 0) + curr[key];
                else if (key === 'qdc') {
                    if(!acc.qdc) acc.qdc = {};
                    for (const qdcKey in curr.qdc) {
                        if(!acc.qdc[qdcKey]) acc.qdc[qdcKey] = { sl: 0, dt: 0, dtqd: 0, name: curr.qdc[qdcKey].name };
                        acc.qdc[qdcKey].sl += curr.qdc[qdcKey].sl;
                        acc.qdc[qdcKey].dt += curr.qdc[qdcKey].dt;
                        acc.qdc[qdcKey].dtqd += curr.qdc[qdcKey].dtqd;
                    }
                }
            }
            return acc;
        }, {
            doanhThu: 0, doanhThuQuyDoi: 0, dtICT: 0, dtCE: 0, qdc: {}
        });

        const aggregatedNganhHang = {};
        filteredReport.forEach(employee => {
            Object.entries(employee.doanhThuTheoNganhHang).forEach(([name, values]) => {
                if (!aggregatedNganhHang[name]) aggregatedNganhHang[name] = { quantity: 0, revenue: 0, revenueQuyDoi: 0, donGia: 0 };
                aggregatedNganhHang[name].quantity += values.quantity;
                aggregatedNganhHang[name].revenue += values.revenue;
                aggregatedNganhHang[name].revenueQuyDoi += values.revenueQuyDoi;
            });
        });
        for(const name in aggregatedNganhHang) {
            const item = aggregatedNganhHang[name];
            item.donGia = item.quantity > 0 ? item.revenue / item.quantity : 0;
        }
        supermarketReport.nganhHangChiTiet = aggregatedNganhHang;

        supermarketReport.pctGiaDung = supermarketReport.dtCE > 0 ? supermarketReport.dtGiaDung / supermarketReport.dtCE : 0;
        supermarketReport.pctMLN = supermarketReport.dtCE > 0 ? supermarketReport.dtMLN / supermarketReport.dtCE : 0;
        supermarketReport.pctPhuKien = supermarketReport.dtICT > 0 ? supermarketReport.dtPhuKien / supermarketReport.dtICT : 0;
        supermarketReport.pctSim = supermarketReport.slSmartphone > 0 ? supermarketReport.slSimOnline / supermarketReport.slSmartphone : 0;
        supermarketReport.pctVAS = supermarketReport.slSmartphone > 0 ? supermarketReport.slUDDD / supermarketReport.slSmartphone : 0;
        supermarketReport.pctBaoHiem = supermarketReport.slBaoHiemDenominator > 0 ? supermarketReport.slBaoHiemVAS / supermarketReport.slBaoHiemDenominator : 0;
        
        ui.renderRealtimeKpiCards(supermarketReport, settings.goals);
        ui.renderRealtimeCategoryDetailsTable(supermarketReport);
        ui.renderRealtimeEfficiencyTable(supermarketReport, settings.goals);
        ui.renderRealtimeQdcTable(supermarketReport);

        ui.displayEmployeeRevenueReport(filteredReport, 'subtab-realtime-nhan-vien', 'realtime_dt_nhanvien');
        ui.displayEmployeeEfficiencyReport(filteredReport, 'subtab-realtime-hieu-qua', 'realtime_hieuqua_nhanvien');
        ui.displayCategoryRevenueReport(filteredReport, 'subtab-realtime-nganh-hang', 'realtime');
        app.populateHighlightFilters('realtime', filteredRealtimeYCX, filteredReport);
        app.applyHighlights('realtime');
    },

    switchTab(targetId) {
        document.querySelectorAll('.page-section').forEach(section => section.classList.toggle('hidden', section.id !== targetId));
    },

    saveRealtimeGoalSettings() {
        const warehouse = document.getElementById('rt-goal-warehouse-select').value;
        if (!warehouse) { return; }
        const settings = { goals: {}, timing: {} };
        document.querySelectorAll('.rt-goal-input').forEach(input => settings.goals[input.dataset.goal] = input.value);
        document.querySelectorAll('.rt-setting-input').forEach(input => settings.timing[input.id] = input.value);
        if (!appState.realtimeGoalSettings) appState.realtimeGoalSettings = {};
        appState.realtimeGoalSettings[warehouse] = settings;
        localStorage.setItem('realtimeGoalSettings', JSON.stringify(appState.realtimeGoalSettings));
        ui.showNotification(`Đã lưu cài đặt Realtime cho kho ${warehouse}!`, 'success');
        app.applyRealtimeFiltersAndRender();
    },

    loadAndApplyRealtimeGoalSettings() {
        const warehouse = document.getElementById('rt-goal-warehouse-select').value;
        const settings = appState.realtimeGoalSettings ? appState.realtimeGoalSettings[warehouse] : null;
        if (settings) {
            document.querySelectorAll('.rt-goal-input').forEach(input => input.value = settings.goals?.[input.dataset.goal] || '');
            document.querySelectorAll('.rt-setting-input').forEach(input => input.value = settings.timing?.[input.id] || '');
        } else {
            document.querySelectorAll('.rt-goal-input, .rt-setting-input').forEach(input => input.value = '');
        }
    },

    saveLuykeGoalSettings() {
        const warehouse = document.getElementById('luyke-goal-warehouse-select').value;
        if (!warehouse) { return; }
        const settings = {};
        document.querySelectorAll('.luyke-goal-input').forEach(input => {
            settings[input.dataset.goal] = input.value;
        });
        if(!appState.luykeGoalSettings) appState.luykeGoalSettings = {};
        appState.luykeGoalSettings[warehouse] = settings;
        localStorage.setItem('luykeGoalSettings', JSON.stringify(appState.luykeGoalSettings));
        ui.showNotification(`Đã lưu cài đặt mục tiêu Lũy kế cho kho ${warehouse}!`, 'success');
        app.processAndRenderAllReports();
    },

    loadAndApplyLuykeGoalSettings() {
        const warehouse = document.getElementById('luyke-goal-warehouse-select').value;
        const settings = (appState.luykeGoalSettings && appState.luykeGoalSettings[warehouse]) ? appState.luykeGoalSettings[warehouse] : {};
         document.querySelectorAll('.luyke-goal-input').forEach(input => {
            input.value = settings[input.dataset.goal] || '';
        });
        const savedPercentage = localStorage.getItem('dailyGoalPercentage');
        if(savedPercentage) document.getElementById('daily-goal-percentage').value = savedPercentage;
    },

    getLuykeGoalSettings(selectedWarehouse = null) {
        const settings = { goals: {} };
        const goalKeys = ['doanhThuThuc', 'doanhThuQD', 'phanTramQD', 'phanTramTC', 'phanTramGiaDung', 'phanTramMLN', 'phanTramPhuKien', 'phanTramBaoHiem', 'phanTramSim', 'phanTramVAS'];

        if (selectedWarehouse && appState.luykeGoalSettings[selectedWarehouse]) {
             const source = appState.luykeGoalSettings[selectedWarehouse];
             goalKeys.forEach(key => settings.goals[key] = parseFloat(source[key]) || 0);
        } else if (!selectedWarehouse) {
            const allSettings = appState.luykeGoalSettings || {};
            const warehouseKeys = Object.keys(allSettings);
            const percentCounts = {};
            
            goalKeys.forEach(key => settings.goals[key] = 0);

            warehouseKeys.forEach(whKey => {
                const source = allSettings[whKey];
                goalKeys.forEach(key => {
                    const value = parseFloat(source[key]) || 0;
                    if (key.startsWith('phanTram')) {
                        settings.goals[key] += value;
                        percentCounts[key] = (percentCounts[key] || 0) + 1;
                    } else {
                        settings.goals[key] += value;
                    }
                });
            });
            
            Object.keys(percentCounts).forEach(key => {
                if (percentCounts[key] > 0) {
                    settings.goals[key] /= percentCounts[key];
                }
            });
        }
        return settings;
    },

    getRealtimeGoalSettings(selectedWarehouse = null) {
        if (selectedWarehouse && appState.realtimeGoalSettings && appState.realtimeGoalSettings[selectedWarehouse]) {
            return appState.realtimeGoalSettings[selectedWarehouse];
        }
        if (!selectedWarehouse) {
            const allSettings = appState.realtimeGoalSettings || {};
            const validWarehouseSettings = Object.values(allSettings).filter(s => s.goals && Object.keys(s.goals).length > 0);
            if(validWarehouseSettings.length === 0) return { goals: {}, timing: {} };
            const aggregatedGoals = { doanhThuThuc: 0, doanhThuQD: 0 };
            const percentGoals = {}; const percentCounts = {};
            validWarehouseSettings.forEach(ws => {
                aggregatedGoals.doanhThuThuc += parseFloat(ws.goals.doanhThuThuc || 0);
                aggregatedGoals.doanhThuQD += parseFloat(ws.goals.doanhThuQD || 0);
                Object.entries(ws.goals).forEach(([key, value]) => {
                    if (key.startsWith('phanTram')) {
                        if (!percentGoals[key]) { percentGoals[key] = 0; percentCounts[key] = 0; }
                        const numValue = parseFloat(value);
                        if(!isNaN(numValue)) { percentGoals[key] += numValue; percentCounts[key]++; }
                    }
                });
            });
            Object.keys(percentCounts).forEach(key => { if(percentCounts[key] > 0) aggregatedGoals[key] = percentGoals[key] / percentCounts[key]; });
            const representativeTiming = validWarehouseSettings.length > 0 ? (validWarehouseSettings[0].timing || {}) : {};
            return { goals: aggregatedGoals, timing: representativeTiming };
        }
        return { goals: {}, timing: {} };
    },

    applyContrastSetting() {
        const savedLevel = localStorage.getItem('contrastLevel') || '1';
        document.body.dataset.contrast = savedLevel;
        document.querySelectorAll('.contrast-selector').forEach(sel => sel.value = savedLevel);
    },

    handleContrastChange(event) {
        const level = event.target.value;
        localStorage.setItem('contrastLevel', level);
        document.body.dataset.contrast = level;
        document.querySelectorAll('.contrast-selector').forEach(sel => {
            if (sel !== event.target) sel.value = level;
        });
    },

    loadHighlightSettings() {
        try {
            const saved = localStorage.getItem('highlightSettings');
            if (saved) appState.highlightSettings = JSON.parse(saved);
        } catch(e) {
            console.error("Error loading highlight settings", e);
            appState.highlightSettings = { luyke: {}, sknv: {}, realtime: {} };
        }
    },

    populateHighlightFilters(prefix, ycxData, reportData) {
        if (!appState.choices[`${prefix}_highlight_nhanhang`]) return; 
        const uniqueNganhHang = [...new Set(ycxData.map(r => (String(r.nganhHang || '').split(/-(.+)/)[1] || '').trim()).filter(Boolean))].sort();
        const uniqueNhomHang = [...new Set(ycxData.map(r => r.nhomHang).filter(Boolean))].sort();
        const uniqueEmployees = [...new Set(reportData.map(r => r.hoTen).filter(Boolean))].sort();

        const createOptions = (arr) => arr.map(item => ({ value: item, label: item, selected: false }));
        
        appState.choices[`${prefix}_highlight_nhanhang`]?.setChoices(createOptions(uniqueNganhHang), 'value', 'label', true);
        appState.choices[`${prefix}_highlight_nhomhang`]?.setChoices(createOptions(uniqueNhomHang), 'value', 'label', true);
        appState.choices[`${prefix}_highlight_employee`]?.setChoices(createOptions(uniqueEmployees), 'value', 'label', true);
    },

    applyHighlights(prefix) {
        const settings = appState.highlightSettings[prefix] || {};
        const tableContainer = document.getElementById(`${prefix === 'luyke' ? 'health' : (prefix === 'sknv' ? 'health-employee' : 'realtime')}-section`);
        if (!tableContainer) return;
        
        tableContainer.querySelectorAll('tbody tr').forEach(row => {
             row.classList.remove('highlighted-row');
             row.style.backgroundColor = '';
        });

        if (settings.values && settings.values.length > 0) {
            tableContainer.querySelectorAll('tbody tr').forEach(row => {
                const cellText = row.cells[0] ? row.cells[0].textContent : '';
                if (settings.values.includes(cellText)) {
                    row.classList.add('highlighted-row');
                    row.style.backgroundColor = settings.color;
                }
            });
        }
    },

    handleHighlightChange(prefix, type) {
        const choicesInstance = appState.choices[`${prefix}_highlight_${type}`];
        if (!choicesInstance) return;
        const values = choicesInstance.getValue(true);
        const color = document.getElementById(`${prefix}-highlight-color`).value;
        appState.highlightSettings[prefix] = { type, values, color };
        localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
        app.applyHighlights(prefix);
    },

    updateDailyGoal() {
        const percentageInput = document.getElementById('daily-goal-percentage');
        const container = document.getElementById('daily-goal-content');
        if (!percentageInput || !container) return;
    
        localStorage.setItem('dailyGoalPercentage', percentageInput.value);
        const goals = app.getLuykeGoalSettings(document.getElementById('luyke-filter-warehouse').value).goals;
        const targetQd = (goals.doanhThuQD || 0) * 1000;
    
        const pastedData = services.parseLuyKePastedData(document.getElementById('paste-luyke').value);
        const thucHienQd = parseFloat(pastedData.mainKpis['Thực hiện DTQĐ']?.replace(/,/g, '')) || 0;
        const targetPercentage = parseFloat(percentageInput.value) / 100 || 0;
    
        if (targetPercentage === 0) {
            container.innerHTML = '<p class="text-gray-500 font-bold p-4 text-center">Nhập % mục tiêu để tính toán.</p>';
            return;
        }
    
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysRemaining = daysInMonth - today.getDate();
    
        let requiredRevenue = 0;
        if (daysRemaining > 0) {
            requiredRevenue = ((targetQd * targetPercentage) - thucHienQd) / daysRemaining;
        } else {
            requiredRevenue = (targetQd * targetPercentage) - thucHienQd;
        }
    
        const rows = [
            { label: 'Mục tiêu DT QĐ', value: `${ui.formatNumberOrDash(requiredRevenue, 2)} tr`, highlight: true },
            { label: '% Quy đổi', value: ui.formatPercentage((goals.phanTramQD || 0) / 100) },
            { label: '% Gia dụng', value: ui.formatPercentage((goals.phanTramGiaDung || 0) / 100) },
            { label: '% MLN', value: ui.formatPercentage((goals.phanTramMLN || 0) / 100) },
            { label: '% Phụ kiện', value: ui.formatPercentage((goals.phanTramPhuKien || 0) / 100) },
            { label: '% Sim', value: ui.formatPercentage((goals.phanTramSim || 0) / 100) },
            { label: '% VAS', value: ui.formatPercentage((goals.phanTramVAS || 0) / 100) },
            { label: '% Bảo hiểm', value: ui.formatPercentage((goals.phanTramBaoHiem || 0) / 100) }
        ];
    
        container.innerHTML = `<div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered"><tbody>${rows.map(row =>
            `<tr class="border-b last:border-b-0">
                <td class="py-2 px-3 font-semibold text-gray-600">${row.label}</td>
                <td class="py-2 px-3 text-right font-bold ${row.highlight ? 'text-red-600' : 'text-gray-800'}">${row.value}</td>
            </tr>`
        ).join('')}</tbody></table></div>`;
    },

    exportTableToExcel(activeTabContent, fileName) {
        if (!activeTabContent) {
            ui.showNotification('Không tìm thấy tab đang hoạt động để xuất.', 'error');
            return;
        }
    
        let table = activeTabContent.querySelector('.department-block table, #sknv-summary-container table, #luyke-competition-content table, table');
    
        if (!table) {
            ui.showNotification('Không tìm thấy bảng dữ liệu trong tab này để xuất.', 'error');
            return;
        }
    
        try {
            const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
            XLSX.writeFile(wb, `${fileName}.xlsx`);
            ui.showNotification(`Đã xuất file ${fileName}.xlsx thành công!`, 'success');
        } catch (e) {
            console.error('Lỗi xuất Excel:', e);
            ui.showNotification('Có lỗi xảy ra khi xuất file Excel.', 'error');
        }
    },

    setupEventListeners() {
        document.querySelectorAll('a.nav-link').forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); app.switchTab(link.getAttribute('href').substring(1)); }));
        document.getElementById('admin-access-btn')?.addEventListener('click', () => document.getElementById('admin-modal').classList.remove('hidden'));
        document.getElementById('admin-submit-btn')?.addEventListener('click', () => {
            if (document.getElementById('admin-password-input').value === config.ADMIN_PASSWORD) {
                app.switchTab('declaration-section');
                document.getElementById('admin-modal').classList.add('hidden');
                document.getElementById('admin-password-input').value = '';
                document.getElementById('admin-error-msg').classList.add('hidden');
            } else document.getElementById('admin-error-msg').classList.remove('hidden');
        });
        document.getElementById('admin-cancel-btn')?.addEventListener('click', () => document.getElementById('admin-modal').classList.add('hidden'));
        document.getElementById('save-declaration-btn')?.addEventListener('click', () => {
            localStorage.setItem('declaration_ycx', document.getElementById('declaration-ycx').value);
            localStorage.setItem('declaration_ycx_gop', document.getElementById('declaration-ycx-gop').value);
            localStorage.setItem('declaration_heso', document.getElementById('declaration-heso').value);
            ui.showNotification('Đã lưu khai báo!', 'success');
            app.processAndRenderAllReports();
        });
        
        document.getElementById('interface-settings-btn')?.addEventListener('click', () => ui.toggleDrawer('interface-drawer', true));
        document.getElementById('goal-settings-btn')?.addEventListener('click', () => ui.toggleDrawer('goal-drawer', true));
        document.querySelectorAll('.close-drawer-btn, #drawer-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                const drawer = e.target.closest('.settings-drawer');
                if (drawer) {
                    ui.toggleDrawer(drawer.id, false);
                } else { 
                    ui.toggleDrawer('interface-drawer', false);
                    ui.toggleDrawer('goal-drawer', false);
                }
            });
        });
        
        document.querySelectorAll('.kpi-color-input').forEach(picker => {
            picker.addEventListener('input', app.saveInterfaceSettings);
        });

        document.querySelectorAll('.file-input').forEach(input => input.addEventListener('change', async (e) => {
            const fileInput = e.target, file = fileInput.files[0], fileType = fileInput.id.replace('file-', '');
            const dataName = fileInput.dataset.name || fileType, shouldSave = fileInput.dataset.save === 'true';
            const fileNameSpan = document.getElementById(`file-name-${fileType}`), fileStatusSpan = document.getElementById(`file-status-${fileType}`);
            if (!file) return;
            if (fileNameSpan) fileNameSpan.textContent = file.name;
            if (fileStatusSpan) { fileStatusSpan.textContent = 'Đang xử lý...'; fileStatusSpan.className = 'text-sm text-gray-500'; }
            ui.showProgressBar(fileType);
            try {
                const rawData = await app.handleFileRead(file);
                const { normalizedData, success, missingColumns } = services.normalizeData(rawData, fileType);
                
                ui.displayDebugInfo(fileType);

                if (success) {
                    if (fileType === 'danhsachnv') {
                        appState.danhSachNhanVien = normalizedData;
                        appState.employeeMaNVMap.clear(); appState.employeeNameToMaNVMap.clear();
                        appState.danhSachNhanVien.forEach(nv => {
                            if (nv.maNV) appState.employeeMaNVMap.set(String(nv.maNV).trim(), nv);
                            if (nv.hoTen) appState.employeeNameToMaNVMap.set(nv.hoTen.toLowerCase().replace(/\s+/g, ' '), String(nv.maNV).trim());
                        });
                    } else if (fileType === 'giocong') appState.gioCongData = normalizedData;
                    else if (fileType === 'thuongnong') appState.thuongNongData = normalizedData;
                    else if (fileType === 'ycx') appState.ycxData = normalizedData;
                    if (fileStatusSpan) { fileStatusSpan.textContent = `✓ Đã tải ${normalizedData.length} dòng.`; fileStatusSpan.className = 'text-sm text-green-600'; }
                    ui.showNotification(`Tải thành công file "${dataName}"!`, 'success');
                    if (shouldSave) {
                        localStorage.setItem(`saved_${fileType}`, JSON.stringify(rawData));
                        document.getElementById(`${fileType}-saved-status`).textContent = `Đã lưu ${normalizedData.length} dòng.`;
                    }
                    if (fileType === 'danhsachnv') {
                        if (normalizedData.length > 0) {
                            ui.populateAllFilters();
                            app.processAndRenderAllReports();
                        } else {
                            ui.showNotification('DSNV trống, không thể tính toán các báo cáo khác.', 'error');
                        }
                    } else {
                        app.processAndRenderAllReports();
                    }
                } else { 
                    const errorMessage = `Lỗi file "${dataName}": Thiếu cột: ${missingColumns.join(', ')}.`;
                    if (fileStatusSpan) { fileStatusSpan.textContent = `Lỗi: Thiếu cột dữ liệu.`; fileStatusSpan.className = 'text-sm text-red-500'; }
                    ui.showNotification(errorMessage, 'error');
                    
                    const debugContainer = document.getElementById('debug-tool-container');
                    if (debugContainer?.classList.contains('hidden')) {
                         document.getElementById('toggle-debug-btn')?.click();
                    }
                }
            } catch (error) {
                console.error(`Lỗi xử lý file ${dataName}:`, error);
                if (fileStatusSpan) { fileStatusSpan.textContent = `Lỗi: ${error.message}`; fileStatusSpan.className = 'text-sm text-red-500'; }
                ui.showNotification(`Lỗi khi xử lý file "${dataName}".`, 'error');
            } finally { ui.hideProgressBar(fileType); }
        }));
        
        document.getElementById('paste-luyke')?.addEventListener('input', () => {
            const statusSpan = document.getElementById('status-luyke');
            if (statusSpan) statusSpan.textContent = '✓ Đã nhận dữ liệu.';
            app.processAndRenderAllReports();
        });

        const handleErpPaste = () => {
            const combinedText = (document.getElementById('paste-thuongerp-1')?.value || '') + '\n' + (document.getElementById('paste-thuongerp-2')?.value || '');
            appState.thuongERPData = services.processThuongERP(combinedText);
            const statusEl = document.getElementById('status-thuongerp');
            if(statusEl) statusEl.textContent = `✓ Đã xử lý ${appState.thuongERPData.length} nhân viên.`;
            app.processAndRenderAllReports();
        };
        document.getElementById('paste-thuongerp-1')?.addEventListener('input', handleErpPaste);
        document.getElementById('paste-thuongerp-2')?.addEventListener('input', handleErpPaste);

        document.querySelectorAll('.paste-btn').forEach(button => button.addEventListener('click', (e) => {
            localStorage.setItem(`saved_${e.target.dataset.name.replace(/\s/g, '').toLowerCase()}`, document.getElementById(e.target.dataset.target).value);
            ui.showNotification(`Đã lưu thành công "${e.target.dataset.name}"!`, 'success');
        }));
        
        ['luyke', 'sknv', 'realtime'].forEach(prefix => {
            const applyFilter = () => {
                if (prefix === 'luyke') app.applyHealthSectionFiltersAndRender();
                else if (prefix === 'sknv') app.applySknvFiltersAndRender();
                else if (prefix === 'realtime') app.applyRealtimeFiltersAndRender();
            };
            document.getElementById(`${prefix}-filter-warehouse`)?.addEventListener('change', () => { ui.updateEmployeeFilter(prefix); applyFilter(); });
            document.getElementById(`${prefix}-filter-department`)?.addEventListener('change', () => { ui.updateEmployeeFilter(prefix); applyFilter(); });
            document.getElementById(`${prefix}-filter-name`)?.addEventListener('change', applyFilter);
            
            document.getElementById(`${prefix}-highlight-nhanhang`)?.addEventListener('change', () => app.handleHighlightChange(prefix, 'nhanhang'));
            document.getElementById(`${prefix}-highlight-nhomhang`)?.addEventListener('change', () => app.handleHighlightChange(prefix, 'nhomhang'));
            document.getElementById(`${prefix}-highlight-employee`)?.addEventListener('change', () => app.handleHighlightChange(prefix, 'employee'));
            document.getElementById(`${prefix}-highlight-color`)?.addEventListener('input', () => {
                const activeType = appState.highlightSettings[prefix]?.type;
                if (activeType) app.handleHighlightChange(prefix, activeType);
            });
            document.getElementById(`${prefix}-clear-highlight`)?.addEventListener('click', () => {
                appState.highlightSettings[prefix] = {};
                localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
                ['nhanhang', 'nhomhang', 'employee'].forEach(type => {
                     const choicesInstance = appState.choices[`${prefix}_highlight_${type}`];
                     if (choicesInstance) {
                        choicesInstance.removeActiveItemsByValue(choicesInstance.getValue(true))
                     }
                });
                app.applyHighlights(prefix);
            });
        });

        const initDatePicker = (prefix) => {
            const datePickerEl = document.getElementById(`${prefix}-filter-date`);
            if (!datePickerEl) return;
            const applyFilter = () => {
                if (prefix === 'luyke') app.applyHealthSectionFiltersAndRender();
                else if (prefix === 'sknv') app.applySknvFiltersAndRender();
            };
            const datePicker = flatpickr(datePickerEl, {
                mode: "multiple", dateFormat: "d/m", maxDate: "today",
                onClose: function(selectedDates, dateStr, instance) {
                    if (selectedDates.length === 2) {
                        const [start, end] = selectedDates.sort((a,b) => a - b);
                        const dateRange = Array.from({length: (end - start) / 86400000 + 1}, (_, i) => new Date(start.getTime() + i * 86400000));
                        instance.setDate(dateRange, false); selectedDates = instance.selectedDates;
                    }
                    const summaryEl = document.getElementById(`${prefix}-date-summary`);
                    if (summaryEl) {
                        if (selectedDates.length > 1) summaryEl.textContent = `Đang chọn ${selectedDates.length} ngày: ${instance.formatDate(selectedDates.sort((a,b)=>a-b)[0], "d/m")} - ${instance.formatDate(selectedDates[selectedDates.length - 1], "d/m")}`;
                        else if (selectedDates.length === 1) summaryEl.textContent = `Đang chọn 1 ngày`; else summaryEl.textContent = '';
                    }
                    applyFilter();
                }
            });
            appState.choices[`${prefix}_date_picker`] = datePicker;
            document.getElementById(`${prefix}-clear-date`)?.addEventListener('click', () => { datePicker.clear(); applyFilter(); });
        };
        initDatePicker('luyke'); initDatePicker('sknv');
        
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const button = e.currentTarget;
            const nav = button.closest('nav');
            if (!nav) return;
            const targetId = button.dataset.target;
            const contentContainerId = nav.dataset.contentContainer;
            const contentContainer = document.getElementById(contentContainerId);
            
            if (!contentContainer) return;

            nav.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
            button.classList.add('active');

            contentContainer.querySelectorAll('.sub-tab-content').forEach(content => {
                content.classList.toggle('hidden', content.id !== targetId);
            });
        }));

        document.getElementById('calculate-income-btn')?.addEventListener('click', app.applySknvFiltersAndRender);
        document.getElementById('toggle-debug-btn')?.addEventListener('click', (e) => {
            const container = document.getElementById('debug-tool-container');
            if(container) container.classList.toggle('hidden');
            e.target.textContent = container.classList.contains('hidden') ? 'Hiển thị Công cụ Gỡ lỗi' : 'Ẩn Công cụ Gỡ lỗi';
        });
        document.getElementById('sknv-employee-filter')?.addEventListener('change', () => app.applySknvFiltersAndRender());
        document.getElementById('daily-goal-percentage')?.addEventListener('input', app.updateDailyGoal);
        document.querySelectorAll('.contrast-selector').forEach(sel => sel.addEventListener('change', app.handleContrastChange));

        document.body.addEventListener('click', (e) => {
            const sortableHeader = e.target.closest('.sortable');
            if (sortableHeader) {
                const table = sortableHeader.closest('table');
                if (!table) return;
                const tableType = table.dataset.tableType, sortKey = sortableHeader.dataset.sort;
                if (!tableType || !sortKey || !appState.sortState[tableType]) return;
                const currentSort = appState.sortState[tableType];
                const newDirection = (currentSort.key === sortKey && currentSort.direction === 'desc') ? 'asc' : 'desc';
                appState.sortState[tableType] = { key: sortKey, direction: newDirection };
                
                if (tableType.startsWith('realtime')) app.applyRealtimeFiltersAndRender();
                else if (tableType.startsWith('sknv') || ['doanhthu_lk', 'thunhap', 'hieu_qua'].includes(tableType)) app.applySknvFiltersAndRender();
                else app.applyHealthSectionFiltersAndRender();
            }

            const highlightIcon = e.target.closest('.highlight-trigger');
            if(highlightIcon) {
                const section = highlightIcon.dataset.target;
                const filterBtn = document.querySelector(`.toggle-filters-btn[data-target="${section}-filter-container"]`);
                if(filterBtn) {
                    filterBtn.click();
                }
            }
        });
        
        document.querySelectorAll('.toggle-filters-btn').forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                const targetContainer = document.getElementById(targetId);
                const textSpan = button.querySelector('.text');
                
                if (targetContainer) {
                    targetContainer.classList.toggle('hidden');
                    const isHidden = targetContainer.classList.contains('hidden');
                    button.classList.toggle('active', !isHidden);
                    if(textSpan) textSpan.textContent = isHidden ? 'Hiện bộ lọc nâng cao' : 'Ẩn bộ lọc nâng cao';
                }
            });
        });

        document.getElementById('realtime-file-input')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            ui.showNotification('Đang xử lý file realtime...', 'success');
            appState.realtimeYCXData = []; 
            e.target.value = '';

            try {
                const rawData = await app.handleFileRead(file);
                const { normalizedData, success, missingColumns } = services.normalizeData(rawData, 'ycx'); 
                ui.displayDebugInfo('ycx');

                if (success) {
                    appState.realtimeYCXData = normalizedData;
                    ui.showNotification(`Tải thành công ${normalizedData.length} dòng realtime!`, 'success');
                    app.applyRealtimeFiltersAndRender();
                } else {
                     ui.showNotification(`File realtime lỗi: Thiếu cột ${missingColumns.join(', ')}.`, 'error');
                     const debugContainer = document.getElementById('debug-tool-container');
                     if (debugContainer?.classList.contains('hidden')) {
                         document.getElementById('toggle-debug-btn')?.click();
                     }
                }
            } catch (err) { 
                ui.showNotification(`Có lỗi khi đọc file: ${err.message}`, 'error'); 
                console.error(err); 
            }
        });
        
        document.getElementById('rt-goal-warehouse-select')?.addEventListener('change', app.loadAndApplyRealtimeGoalSettings);
        document.querySelectorAll('.rt-goal-input, .rt-setting-input').forEach(input => input.addEventListener('input', app.saveRealtimeGoalSettings));
        
        document.getElementById('luyke-goal-warehouse-select')?.addEventListener('change', app.loadAndApplyLuykeGoalSettings);
        document.querySelectorAll('.luyke-goal-input').forEach(input => input.addEventListener('input', app.saveLuykeGoalSettings));

        const captureAndDownload = async (element, title) => {
            if (!element) { ui.showNotification('Không tìm thấy nội dung để chụp.', 'error'); return; }
            
            const captureArea = document.createElement('div');
            captureArea.style.padding = '1rem';
            captureArea.style.backgroundColor = '#f3f4f6';

            const titleEl = document.getElementById(`${element.id.split('-')[1]}-supermarket-title`);
            if (titleEl) {
                captureArea.appendChild(titleEl.cloneNode(true));
            }
        
            captureArea.appendChild(element.cloneNode(true));
            
            document.body.appendChild(captureArea);
            
            try {
                const canvas = await html2canvas(captureArea, { scale: 2, useCORS: true, backgroundColor: '#f3f4f6' });
                const timestamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
                const link = document.createElement('a');
                link.download = `${title.replace(/\s/g, '_')}_${timestamp}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (err) {
                console.error('Lỗi chụp màn hình:', err);
                ui.showNotification(`Lỗi khi chụp ảnh ${title}.`, 'error');
            } finally {
                document.body.removeChild(captureArea);
            }
        };

        const setupActionButtons = (prefix) => {
            document.getElementById(`capture-${prefix}-btn`)?.addEventListener('click', () => {
                const activeTabContent = document.querySelector(`#${prefix}-subtabs-content .sub-tab-content:not(.hidden)`);
                const activeTabButton = document.querySelector(`#${prefix}-subtabs-nav .sub-tab-btn.active`);
                if (activeTabContent && activeTabButton) {
                    captureAndDownload(activeTabContent, activeTabButton.dataset.title || 'BaoCao');
                }
            });
            document.getElementById(`export-${prefix}-btn`)?.addEventListener('click', () => {
                const activeTabContent = document.querySelector(`#${prefix}-subtabs-content .sub-tab-content:not(.hidden)`);
                const activeTabButton = document.querySelector(`#${prefix}-subtabs-nav .sub-tab-btn.active`);
                if (activeTabContent && activeTabButton) {
                    const title = activeTabButton.dataset.title || 'BaoCao';
                    const timestamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
                    app.exportTableToExcel(activeTabContent, `${title}_${timestamp}`);
                }
            });
        };
        setupActionButtons('luyke');
        setupActionButtons('sknv');
        setupActionButtons('realtime');
    }
};

app.init();