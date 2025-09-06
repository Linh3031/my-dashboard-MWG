// js/main.js
import config from './config.js';
import appState from './state.js';
import ui from './ui.js';
import services from './services.js';

document.addEventListener('DOMContentLoaded', function () {
    const app = {
        init() {
            this.loadDataFromStorage();
            this.setupEventListeners();
            this.applyContrastSetting();
            this.loadHighlightSettings();
            this.loadKpiCardColors();
            ui.populateAllFilters();
            this.switchTab('data-section');
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
                        appState.employeeMaNVMap.clear(); appState.employeeNameToMaNVMap.clear();
                        appState.danhSachNhanVien.forEach(nv => {
                            if (nv.maNV) appState.employeeMaNVMap.set(nv.maNV, nv);
                            if (nv.hoTen) appState.employeeNameToMaNVMap.set(nv.hoTen.toLowerCase().replace(/\s+/g, ' '), nv.maNV);
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

        // ### BẮT ĐẦU SỬA LỖI ###
        // Hàm helper mới, chuyên dùng để đọc file Excel và trả về dữ liệu JSON.
        async readExcelFile(file) {
            return new Promise((resolve, reject) => {
                if (!file) {
                    return reject(new Error("Không có file nào được cung cấp."));
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                        resolve(jsonData);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = (err) => reject(new Error("Không thể đọc file: " + err));
                reader.readAsArrayBuffer(file);
            });
        },

        // Hàm xử lý file chính được cập nhật để sử dụng hàm helper `readExcelFile`.
        async handleFileRead(file, fileType) {
             const dataName = document.querySelector(`#file-${fileType}`)?.dataset.name || fileType;
             const shouldSave = document.querySelector(`#file-${fileType}`)?.dataset.save === 'true';
             const fileNameSpan = document.getElementById(`file-name-${fileType}`);
             const fileStatusSpan = document.getElementById(`file-status-${fileType}`);

             if (!file) return;

             if (fileNameSpan) fileNameSpan.textContent = file.name;
             if (fileStatusSpan) fileStatusSpan.textContent = 'Đang xử lý...';
             ui.showProgressBar(fileType);

             try {
                 const rawData = await this.readExcelFile(file); // Gọi hàm helper
                 const result = services.normalizeData(rawData, fileType);
                 
                 if (result.success) {
                    if (fileType === 'danhsachnv') {
                        appState.danhSachNhanVien = result.normalizedData;
                        appState.employeeMaNVMap.clear(); 
                        appState.employeeNameToMaNVMap.clear();
                        appState.danhSachNhanVien.forEach(nv => {
                            if (nv.maNV) appState.employeeMaNVMap.set(nv.maNV, nv);
                            if (nv.hoTen) appState.employeeNameToMaNVMap.set(nv.hoTen.toLowerCase().replace(/\s+/g, ' '), nv.maNV);
                        });
                        ui.populateAllFilters();
                    } else if (fileType === 'giocong') {
                        appState.gioCongData = result.normalizedData;
                        appState.rawGioCongData = rawData;
                    } else if (fileType === 'thuongnong') {
                        appState.thuongNongData = result.normalizedData;
                    } else if (fileType === 'ycx') {
                        appState.ycxData = result.normalizedData;
                    }

                     if (fileStatusSpan) {
                         fileStatusSpan.textContent = `✓ Đã tải ${result.normalizedData.length} dòng.`;
                         fileStatusSpan.className = 'text-sm text-green-600';
                     }
                     ui.showNotification(`Tải thành công file "${dataName}"!`, 'success');

                     if (shouldSave) {
                         localStorage.setItem(`saved_${fileType}`, JSON.stringify(rawData));
                         document.getElementById(`${fileType}-saved-status`).textContent = `Đã lưu ${result.normalizedData.length} dòng.`;
                     }
                     
                     app.processAndRenderAllReports();
                 } else {
                     if (fileStatusSpan) {
                         fileStatusSpan.textContent = `Lỗi: ${result.message}`;
                         fileStatusSpan.className = 'text-sm text-red-500';
                     }
                     ui.showNotification(result.message, 'error');
                 }
                 ui.displayDebugInfo(fileType);
             } catch (error) {
                 console.error(`Lỗi xử lý file ${dataName}:`, error);
                 if (fileStatusSpan) {
                     fileStatusSpan.textContent = `Lỗi: ${error.message}`;
                     fileStatusSpan.className = 'text-sm text-red-500';
                 }
                 ui.showNotification(`Lỗi khi xử lý file "${dataName}".`, 'error');
             } finally {
                 ui.hideProgressBar(fileType);
             }
        },
        // ### KẾT THÚC SỬA LỖI ###

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
            const selectedNames = appState.choices.luyke_employee.getValue(true);
            const selectedDates = appState.choices.luyke_date_picker.selectedDates;
            
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

            const titleSuffix = selectedWarehouse ? `- ${selectedWarehouse}` : '- TOÀN CỤM';
            document.getElementById('luyke-kpi-title').textContent = `DOANH THU LŨY KẾ ${titleSuffix}`;
            
            const numDays = new Set(filteredYCXData.map(row => new Date(row.ngayTao).toDateString())).size;

            const pastedData = services.parseLuyKePastedData(document.getElementById('paste-luyke').value);
            
            ui.renderLuykeKpiCards(pastedData, goals, supermarketReport);
            ui.renderLuykeEfficiencyTable(supermarketReport, goals);
            ui.renderLuykeCategoryDetailsTable(supermarketReport, numDays);
            ui.renderLuykeQdcTable(supermarketReport, numDays);
            ui.displayCompetitionResultsFromLuyKe();
            app.updateDailyGoal();

            app.populateHighlightFilters('luyke', filteredYCXData, filteredReport);
            app.applyHighlights('luyke');
        },

        applySknvFiltersAndRender() {
            if (appState.danhSachNhanVien.length === 0) return;
            const selectedWarehouse = document.getElementById('sknv-filter-warehouse').value;
            const selectedDept = document.getElementById('sknv-filter-department').value;
            const selectedNames = appState.choices.sknv_employee.getValue(true);
            const selectedDates = appState.choices.sknv_date_picker.selectedDates;
            
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
            
            const allDepartmentAverages = {};
            const departments = [...new Set(appState.masterReportData.sknv.map(e => e.boPhan))];
            departments.forEach(dept => {
                allDepartmentAverages[dept] = services.calculateDepartmentAverages(dept, appState.masterReportData.sknv);
            });

            ui.displayEmployeeRevenueReport(filteredReport, 'subtab-doanhthu-lk', 'doanhthu_lk', config.DEPARTMENT_GROUPS);
            ui.displayEmployeeIncomeReport(filteredReport, config.DEPARTMENT_GROUPS);
            ui.displayEmployeeEfficiencyReport(filteredReport, 'subtab-hieu-qua-khai-thac', 'hieu_qua', config.DEPARTMENT_GROUPS);
            ui.displayCategoryRevenueReport(filteredReport, 'subtab-doanhthu-nganhhang', 'sknv');
            
            ui.displaySknvReport(filteredReport, allDepartmentAverages, config.PRODUCT_GROUPS.QDC_GROUPS);
            app.populateHighlightFilters('sknv', filteredYCXData, filteredReport);
            app.applyHighlights('sknv');
        },
        
        applyRealtimeFiltersAndRender() {
            if (appState.realtimeYCXData.length === 0) return;
            const selectedWarehouse = document.getElementById('realtime-filter-warehouse').value;
            const selectedDept = document.getElementById('realtime-filter-department').value;
            const selectedEmployees = appState.choices.realtime_employee.getValue(true);
            
            const settings = app.getRealtimeGoalSettings(selectedWarehouse);
            const titleSuffix = selectedWarehouse ? ` - ${selectedWarehouse}` : ' - TOÀN CỤM';
            
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
            
            document.getElementById('rt-main-kpi-title').textContent = `DOANH THU TẠO REALTIME${titleSuffix}`;
            document.getElementById('realtime-category-title').textContent = `NGÀNH HÀNG CHI TIẾT${titleSuffix}`;
            document.getElementById('realtime-efficiency-title').textContent = `HIỆU QUẢ KHAI THÁC${titleSuffix}`;
            document.getElementById('realtime-qdc-title').textContent = `NHÓM HÀNG QUY ĐỔI CAO${titleSuffix}`;

            ui.renderRealtimeKpiCards(supermarketReport, settings.goals);
            ui.renderRealtimeCategoryDetailsTable(supermarketReport);
            ui.renderRealtimeEfficiencyTable(supermarketReport, settings.goals);
            ui.renderRealtimeQdcTable(supermarketReport, config.PRODUCT_GROUPS.QDC_GROUPS);

            ui.displayEmployeeRevenueReport(filteredReport, 'subtab-realtime-nhan-vien', 'realtime_dt_nhanvien', config.DEPARTMENT_GROUPS);
            ui.displayEmployeeEfficiencyReport(filteredReport, 'subtab-realtime-hieu-qua', 'realtime_hieuqua_nhanvien', config.DEPARTMENT_GROUPS);
            ui.displayCategoryRevenueReport(filteredReport, 'subtab-realtime-nganh-hang', 'realtime');
            app.populateHighlightFilters('realtime', filteredRealtimeYCX, filteredReport);
            app.applyHighlights('realtime');
        },

        switchTab(targetId) {
            document.querySelectorAll('.page-section').forEach(section => section.classList.toggle('hidden', section.id !== targetId));
            document.querySelectorAll('.nav-link').forEach(link => {
                const isActive = link.getAttribute('href') === `#${targetId}`;
                link.classList.toggle('bg-gray-200', isActive);
                link.classList.toggle('font-semibold', isActive);
            });
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
                Object.keys(percentGoals).forEach(key => { if(percentCounts[key] > 0) aggregatedGoals[key] = percentGoals[key] / percentCounts[key]; });
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
            const uniqueNganhHang = [...new Set(ycxData.map(r => (String(r.nganhHang || '').split(/-(.+)/)[1] || '').trim()).filter(Boolean))].sort();
            const uniqueNhomHang = [...new Set(ycxData.map(r => r.nhomHang).filter(Boolean))].sort();
            const uniqueEmployees = [...new Set(reportData.map(r => r.hoTen).filter(Boolean))].sort();

            const createOptions = (arr) => arr.map(item => ({ value: item, label: item, selected: false }));
            
            appState.choices[`${prefix}_highlight_nhanhang`].setChoices(createOptions(uniqueNganhHang), 'value', 'label', true);
            appState.choices[`${prefix}_highlight_nhomhang`].setChoices(createOptions(uniqueNhomHang), 'value', 'label', true);
            appState.choices[`${prefix}_highlight_employee`].setChoices(createOptions(uniqueEmployees), 'value', 'label', true);
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
            const values = appState.choices[`${prefix}_highlight_${type}`].getValue(true);
            const color = document.getElementById(`${prefix}-highlight-color`).value;
            appState.highlightSettings[prefix] = { type, values, color };
            localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
            app.applyHighlights(prefix);
        },

        loadKpiCardColors() {
            try {
                const saved = localStorage.getItem('kpiCardColors');
                if (saved) {
                    appState.kpiCardColors = JSON.parse(saved);
                    app.applyKpiCardColors('luyke');
                    app.applyKpiCardColors('realtime');
                }
            } catch(e) {
                console.error("Error loading KPI card colors", e);
                appState.kpiCardColors = { luyke: {}, realtime: {} };
            }
        },
        applyKpiCardColors(prefix) {
            const colors = appState.kpiCardColors[prefix] || {};
            for (let i = 1; i <= 4; i++) {
                const color = colors[i];
                const card = document.getElementById(`${prefix}-kpi-card-${i}`);
                const colorInput = document.getElementById(`${prefix}-kpi-color-${i}`);
                if (color) {
                    if (card) card.style.backgroundColor = color;
                    if (colorInput) colorInput.value = color;
                }
            }
        },
        saveKpiCardColors(prefix) {
            const colors = {};
            for (let i = 1; i <= 4; i++) {
                colors[i] = document.getElementById(`${prefix}-kpi-color-${i}`).value;
            }
            appState.kpiCardColors[prefix] = colors;
            localStorage.setItem('kpiCardColors', JSON.stringify(appState.kpiCardColors));
            app.applyKpiCardColors(prefix);
        },

        updateDailyGoal() {
            const percentageInput = document.getElementById('daily-goal-percentage');
            const container = document.getElementById('daily-goal-content');
            if (!percentageInput || !container) return;
        
            localStorage.setItem('dailyGoalPercentage', percentageInput.value);
            const goals = app.getLuykeGoalSettings(document.getElementById('luyke-filter-warehouse').value).goals;
            const targetQd = (goals.doanhThuQD || 0) * 1000000000;
        
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
                { label: 'Mục tiêu DT QĐ', value: `${ui.formatNumberOrDash(requiredRevenue / 1000000, 2)} tr`, highlight: true },
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

        exportActiveTableToExcel(button) {
            const section = button.closest('section');
            if (!section) return;

            const activeTabContent = section.querySelector('.sub-tab-content:not(.hidden)');
            const activeTabButton = section.querySelector('.sub-tab-btn.active');
            
            if (!activeTabContent || !activeTabButton) {
                ui.showNotification('Không tìm thấy tab hoặc bảng dữ liệu đang hoạt động.', 'error');
                return;
            }

            const tables = activeTabContent.querySelectorAll('table');
            if (tables.length === 0) {
                ui.showNotification('Không có bảng dữ liệu nào trong tab này để xuất.', 'error');
                return;
            }
            
            const wb = XLSX.utils.book_new();
            tables.forEach((table, index) => {
                const sheet = XLSX.utils.table_to_sheet(table);
                const sheetName = table.closest('[data-table-type]')?.dataset.tableType || `Sheet${index + 1}`;
                XLSX.utils.book_append_sheet(wb, sheet, sheetName.slice(0, 31));
            });

            const timestamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
            const fileName = `${activeTabButton.dataset.title || 'BaoCao'}_${timestamp}.xlsx`;
            XLSX.writeFile(wb, fileName);
            ui.showNotification(`Đã xuất thành công file ${fileName}`, 'success');
        },

        setupEventListeners() {
            document.querySelectorAll('a.nav-link').forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); app.switchTab(link.getAttribute('href').substring(1)); }));
            document.getElementById('admin-access-btn').addEventListener('click', () => document.getElementById('admin-modal').classList.remove('hidden'));
            document.getElementById('admin-submit-btn').addEventListener('click', () => {
                if (document.getElementById('admin-password-input').value === config.ADMIN_PASSWORD) {
                    app.switchTab('declaration-section');
                    document.getElementById('admin-modal').classList.add('hidden');
                    document.getElementById('admin-password-input').value = '';
                    document.getElementById('admin-error-msg').classList.add('hidden');
                } else document.getElementById('admin-error-msg').classList.remove('hidden');
            });
            document.getElementById('admin-cancel-btn').addEventListener('click', () => document.getElementById('admin-modal').classList.add('hidden'));
            document.getElementById('save-declaration-btn').addEventListener('click', () => {
                localStorage.setItem('declaration_ycx', document.getElementById('declaration-ycx').value);
                localStorage.setItem('declaration_ycx_gop', document.getElementById('declaration-ycx-gop').value);
                localStorage.setItem('declaration_heso', document.getElementById('declaration-heso').value);
                ui.showNotification('Đã lưu khai báo!', 'success');
                app.processAndRenderAllReports();
            });
            
             document.querySelectorAll('.file-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    const fileType = e.target.id.replace('file-', '');
                    app.handleFileRead(file, fileType);
                });
            });

            document.getElementById('paste-luyke').addEventListener('input', (e) => {
                const pastedText = e.target.value;
                const statusSpan = document.getElementById('status-luyke');
                if (statusSpan) statusSpan.textContent = '✓ Đã nhận dữ liệu.';
                if (!pastedText.trim()) return;
                services.parseCompetitionDataFromLuyKe(pastedText);
                app.processAndRenderAllReports();
            });
            const handleErpPaste = () => {
                const combinedText = document.getElementById('paste-thuongerp-1').value + '\n' + document.getElementById('paste-thuongerp-2').value;
                appState.thuongERPData = services.processThuongERP(combinedText);
                document.getElementById('status-thuongerp').textContent = `✓ Đã xử lý ${appState.thuongERPData.length} nhân viên.`;
                app.processAndRenderAllReports();
            };
            document.getElementById('paste-thuongerp-1').addEventListener('input', handleErpPaste);
            document.getElementById('paste-thuongerp-2').addEventListener('input', handleErpPaste);
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
                document.getElementById(`${prefix}-filter-warehouse`).addEventListener('change', () => { ui.updateEmployeeFilter(prefix); applyFilter(); });
                document.getElementById(`${prefix}-filter-department`).addEventListener('change', () => { ui.updateEmployeeFilter(prefix); applyFilter(); });
                if (document.getElementById(`${prefix}-filter-name`)) document.getElementById(`${prefix}-filter-name`).addEventListener('change', applyFilter);
                
                document.getElementById(`${prefix}-highlight-nhanhang`).addEventListener('change', () => app.handleHighlightChange(prefix, 'nhanhang'));
                document.getElementById(`${prefix}-highlight-nhomhang`).addEventListener('change', () => app.handleHighlightChange(prefix, 'nhomhang'));
                document.getElementById(`${prefix}-highlight-employee`).addEventListener('change', () => app.handleHighlightChange(prefix, 'employee'));
                document.getElementById(`${prefix}-highlight-color`).addEventListener('input', () => {
                    const activeType = appState.highlightSettings[prefix]?.type;
                    if (activeType) app.handleHighlightChange(prefix, activeType);
                });
                document.getElementById(`${prefix}-clear-highlight`).addEventListener('click', () => {
                    appState.highlightSettings[prefix] = {};
                    localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
                    ['nhanhang', 'nhomhang', 'employee'].forEach(type => appState.choices[`${prefix}_highlight_${type}`].removeActiveItemsByValue(appState.choices[`${prefix}_highlight_${type}`].getValue(true)));
                    app.applyHighlights(prefix);
                });

                if(document.getElementById(`${prefix}-kpi-color-1`)) {
                    for (let i = 1; i <= 4; i++) {
                        document.getElementById(`${prefix}-kpi-color-${i}`).addEventListener('input', () => app.saveKpiCardColors(prefix));
                    }
                }
            });

            const initDatePicker = (prefix) => {
                if (!document.getElementById(`${prefix}-filter-date`)) return;
                const applyFilter = () => {
                    if (prefix === 'luyke') app.applyHealthSectionFiltersAndRender();
                    else if (prefix === 'sknv') app.applySknvFiltersAndRender();
                };
                const datePicker = flatpickr(`#${prefix}-filter-date`, {
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
                document.getElementById(`${prefix}-clear-date`).addEventListener('click', () => { datePicker.clear(); applyFilter(); });
            };
            initDatePicker('luyke'); initDatePicker('sknv');

            document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.addEventListener('click', (e) => {
                const nav = e.target.closest('nav');
                nav.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const targetId = btn.dataset.target;
                const contentContainer = nav.closest('.border-b')?.nextElementSibling;
                if (contentContainer) contentContainer.querySelectorAll('.sub-tab-content').forEach(content => content.classList.toggle('hidden', content.id !== targetId));
            }));

            document.getElementById('calculate-income-btn').addEventListener('click', app.applySknvFiltersAndRender);
            document.getElementById('toggle-debug-btn').addEventListener('click', (e) => {
                const container = document.getElementById('debug-tool-container');
                container.classList.toggle('hidden');
                e.target.textContent = container.classList.contains('hidden') ? 'Hiển thị Công cụ Gỡ lỗi' : 'Ẩn Công cụ Gỡ lỗi';
            });
            document.getElementById('sknv-employee-filter').addEventListener('change', () => app.applySknvFiltersAndRender());
            document.getElementById('daily-goal-percentage').addEventListener('input', app.updateDailyGoal);
            document.querySelectorAll('.contrast-selector').forEach(sel => sel.addEventListener('change', app.handleContrastChange));

            document.body.addEventListener('click', (e) => {
                const sortableHeader = e.target.closest('.sortable');
                if (sortableHeader) {
                    const table = sortableHeader.closest('table'), tableType = table.dataset.tableType, sortKey = sortableHeader.dataset.sort;
                    if (!table || !tableType || !sortKey || !appState.sortState[tableType]) return;
                    const currentSort = appState.sortState[tableType];
                    const newDirection = (currentSort.key === sortKey && currentSort.direction === 'desc') ? 'asc' : 'desc';
                    appState.sortState[tableType] = { key: sortKey, direction: newDirection };
                    
                    if (tableType.startsWith('realtime')) app.applyRealtimeFiltersAndRender();
                    else if (tableType.startsWith('sknv') || ['doanhthu_lk', 'thunhap', 'hieu_qua'].includes(tableType)) app.applySknvFiltersAndRender();
                    else app.applyHealthSectionFiltersAndRender();
                }
            });

            document.getElementById('toggle-luyke-goal-settings-btn').addEventListener('click', (e) => {
                document.getElementById('luyke-goal-settings-content').classList.toggle('hidden');
                document.getElementById('luyke-goal-settings-icon').classList.toggle('rotate-180');
            });
             document.getElementById('toggle-realtime-goal-settings-btn').addEventListener('click', (e) => {
                document.getElementById('realtime-goal-settings-content').classList.toggle('hidden');
                document.getElementById('realtime-goal-settings-icon').classList.toggle('rotate-180');
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
                        textSpan.textContent = isHidden ? 'Hiện bộ lọc nâng cao' : 'Ẩn bộ lọc nâng cao';
                    }
                });
            });

            // ### BẮT ĐẦU SỬA LỖI ###
            // Sửa lại trình nghe sự kiện để gọi trực tiếp hàm helper `readExcelFile`
            document.getElementById('realtime-file-input').addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                ui.showNotification('Đang xử lý file realtime...', 'success');
                try {
                     const rawData = await app.readExcelFile(file); // Gọi trực tiếp hàm helper
                     const { normalizedData, success, message } = services.normalizeData(rawData, 'ycx');
                     if(success) {
                         appState.realtimeYCXData = normalizedData;
                         app.applyRealtimeFiltersAndRender();
                         ui.showNotification('Xử lý file realtime thành công!', 'success');
                     } else {
                         ui.showNotification(message, 'error');
                     }
                } catch (err) { 
                    ui.showNotification(`Có lỗi khi đọc file: ${err.message}`, 'error'); 
                    console.error(err); 
                }
            });
            // ### KẾT THÚC SỬA LỖI ###
            
            document.getElementById('rt-goal-warehouse-select').addEventListener('change', app.loadAndApplyRealtimeGoalSettings);
            document.querySelectorAll('.rt-goal-input, .rt-setting-input').forEach(input => input.addEventListener('input', app.saveRealtimeGoalSettings));
            
            document.getElementById('luyke-goal-warehouse-select').addEventListener('change', app.loadAndApplyLuykeGoalSettings);
            document.querySelectorAll('.luyke-goal-input').forEach(input => input.addEventListener('input', app.saveLuykeGoalSettings));

            const captureAndDownload = async (element, title) => {
                if (!element) { ui.showNotification('Không tìm thấy nội dung để chụp.', 'error'); return; }
                const timestamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
                const captureContainer = document.createElement('div');
                captureContainer.style.cssText = 'position:absolute; left:-9999px; top:0;';
                const clone = element.cloneNode(true);
                captureContainer.appendChild(clone);
                document.body.appendChild(captureContainer);
                try {
                    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: '#f3f4f6' });
                    const link = document.createElement('a');
                    link.download = `${title.replace(/\s/g, '_')}_${timestamp}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                } catch (err) { console.error('Lỗi chụp màn hình:', err); ui.showNotification(`Lỗi khi chụp ảnh ${title}.`, 'error');
                } finally { document.body.removeChild(captureContainer); }
            };

            document.getElementById('capture-employee-health-btn').addEventListener('click', (e) => {
                const activeTabContent = document.querySelector('#employee-subtabs-content .sub-tab-content:not(.hidden)');
                const activeTabButton = document.querySelector('#employee-subtabs-nav .sub-tab-btn.active');
                if (activeTabContent && activeTabButton) captureAndDownload(activeTabContent, activeTabButton.dataset.title || 'BaoCaoSKNV');
            });
            document.getElementById('capture-realtime-btn').addEventListener('click', (e) => {
                const activeTabContent = document.querySelector('#realtime-subtabs-content .sub-tab-content:not(.hidden)');
                const activeTabButton = document.querySelector('#realtime-subtabs-nav .sub-tab-btn.active');
                if (activeTabContent && activeTabButton) captureAndDownload(activeTabContent, activeTabButton.dataset.title || 'BaoCaoRealtime');
            });
            document.getElementById('capture-health-btn').addEventListener('click', (e) => {
                const activeTabContent = document.querySelector('#luyke-subtabs-content .sub-tab-content:not(.hidden)');
                const activeTabButton = document.querySelector('#luyke-subtabs-nav .sub-tab-btn.active');
                if (activeTabContent && activeTabButton) captureAndDownload(activeTabContent, activeTabButton.dataset.title || 'BaoCaoLuyKe');
            });
            document.getElementById('export-health-btn').addEventListener('click', (e) => app.exportActiveTableToExcel(e.currentTarget));
            document.getElementById('export-employee-health-btn').addEventListener('click', (e) => app.exportActiveTableToExcel(e.currentTarget));
            document.getElementById('export-realtime-btn').addEventListener('click', (e) => app.exportActiveTableToExcel(e.currentTarget));
        }
    };

    app.init();
});