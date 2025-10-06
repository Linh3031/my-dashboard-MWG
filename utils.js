// Version 21.4 - Remove obsolete loadComponent function
// MODULE: UTILITIES
// Chứa các hàm tiện ích chung không thuộc về logic hay giao diện cụ thể.
import { appState } from './state.js';
import { ui } from './ui.js';

const _injectCaptureStyles = () => {
    const styleId = 'dynamic-capture-styles';
    document.getElementById(styleId)?.remove();
    const styles = `
        .capture-container { padding: 24px; background-color: #f3f4f6; box-sizing: border-box; width: fit-content; max-width: 1440px; position: absolute; left: -9999px; top: 0; }
        .capture-layout-container { display: flex; flex-direction: column; gap: 24px; }
        .capture-title { font-size: 28px; font-weight: 700; text-align: center; color: #1f2937; margin-bottom: 24px; padding: 12px; background-color: #ffffff; border-radius: 0.75rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
        .prepare-for-kpi-capture { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 24px !important; width: 900px !important; padding: 24px !important; background-color: #f3f4f6 !important; }
        .prepare-for-kpi-capture .kpi-card p[id$="-main"] { text-shadow: 0 0 1px rgba(0,0,0,0.1); }
        .preset-mobile-portrait { width: 650px !important; margin: 0 auto !important; }
    `;
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
    return styleElement;
};


const utils = {
    cleanCategoryName(name) {
        if (!name || typeof name !== 'string') return '';
        return name.replace(/^\d+\s*-\s*/, '').trim().toLowerCase();
    },

    // ... (Toàn bộ các hàm còn lại giữ nguyên)
    loadInterfaceSettings() {
        try {
            const savedSettings = JSON.parse(localStorage.getItem('interfaceSettings')) || {};
            const defaultSettings = {
                kpiCard1Bg: '#38bdf8', kpiCard2Bg: '#34d399', kpiCard3Bg: '#fbbf24',
                kpiCard4Bg: '#2dd4bf', kpiCard5Bg: '#a78bfa', kpiCard6Bg: '#f472b6', 
                kpiTextColor: '#ffffff',
                globalFontSize: '14',
                kpiFontSize: '36'
            };
            const settings = { ...defaultSettings, ...savedSettings };
            
            ui.applyInterfaceSettings(settings);
            Object.keys(defaultSettings).forEach((key) => {
                if (key.startsWith('kpiCard')) {
                    const colorPicker = document.getElementById(key.replace('kpiCard', 'kpi-color-'));
                    if (colorPicker) colorPicker.value = settings[key];
                } else if (key === 'kpiTextColor') {
                    const colorPicker = document.getElementById('kpi-text-color');
                    if (colorPicker) colorPicker.value = settings[key];
                }
            });

            const globalSlider = document.getElementById('global-font-size-slider');
            const kpiSlider = document.getElementById('kpi-font-size-slider');
            if(globalSlider) globalSlider.value = settings.globalFontSize;
            if(kpiSlider) kpiSlider.value = settings.kpiFontSize;
            
            this.handleFontSizeChange({ target: globalSlider }, 'global');
            this.handleFontSizeChange({ target: kpiSlider }, 'kpi');
            
        } catch (e) { console.error("Lỗi khi tải cài đặt giao diện:", e); }
    },
    
    saveInterfaceSettings() {
        const settings = {
            kpiCard1Bg: document.getElementById('kpi-color-1')?.value,
            kpiCard2Bg: document.getElementById('kpi-color-2')?.value,
            kpiCard3Bg: document.getElementById('kpi-color-3')?.value,
            kpiCard4Bg: document.getElementById('kpi-color-4')?.value,
            kpiCard5Bg: document.getElementById('kpi-color-5')?.value,
            kpiCard6Bg: document.getElementById('kpi-color-6')?.value,
            kpiTextColor: document.getElementById('kpi-text-color')?.value,
            globalFontSize: document.getElementById('global-font-size-slider')?.value,
            kpiFontSize: document.getElementById('kpi-font-size-slider')?.value,
        };
        localStorage.setItem('interfaceSettings', JSON.stringify(settings));
        ui.applyInterfaceSettings(settings);
        this.applyFontSettings();
    },

    applyFontSettings() {
        const settings = JSON.parse(localStorage.getItem('interfaceSettings')) || {};
        const globalSize = settings.globalFontSize || '14';
        const kpiSize = settings.kpiFontSize || '36';
        
        document.documentElement.style.setProperty('--global-font-size', `${globalSize}px`);
        document.documentElement.style.setProperty('--kpi-main-font-size', `${kpiSize}px`);
    },

    handleFontSizeChange(event, type) {
        if (!event || !event.target) return;
        const value = event.target.value;
        const valueDisplayId = type === 'global' ? 'global-font-size-value' : 'kpi-font-size-value';
        const valueDisplayElement = document.getElementById(valueDisplayId);

        if (valueDisplayElement) {
            valueDisplayElement.textContent = `${value}px`;
        }
        
        this.saveInterfaceSettings();
    },

    saveRealtimeGoalSettings() {
        const warehouse = document.getElementById('rt-goal-warehouse-select').value;
        if (!warehouse) return;
        const settings = { goals: {}, timing: {} };
        document.querySelectorAll('.rt-goal-input').forEach(input => settings.goals[input.dataset.goal] = input.value);
        document.querySelectorAll('.rt-setting-input').forEach(input => settings.timing[input.id] = input.value);
        if (!appState.realtimeGoalSettings) appState.realtimeGoalSettings = {};
        appState.realtimeGoalSettings[warehouse] = settings;
        localStorage.setItem('realtimeGoalSettings', JSON.stringify(appState.realtimeGoalSettings));
        ui.showNotification(`Đã lưu cài đặt Realtime cho kho ${warehouse}!`, 'success');
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
        if (!warehouse) return;
        const settings = {};
        document.querySelectorAll('.luyke-goal-input').forEach(input => settings[input.dataset.goal] = input.value);
        if(!appState.luykeGoalSettings) appState.luykeGoalSettings = {};
        appState.luykeGoalSettings[warehouse] = settings;
        localStorage.setItem('luykeGoalSettings', JSON.stringify(appState.luykeGoalSettings));
        ui.showNotification(`Đã lưu cài đặt mục tiêu Lũy kế cho kho ${warehouse}!`, 'success');
    },

    loadAndApplyLuykeGoalSettings() {
        const warehouse = document.getElementById('luyke-goal-warehouse-select').value;
        const settings = (appState.luykeGoalSettings && appState.luykeGoalSettings[warehouse]) ? appState.luykeGoalSettings[warehouse] : {};
         document.querySelectorAll('.luyke-goal-input').forEach(input => input.value = settings[input.dataset.goal] || '');
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
                if (percentCounts[key] > 0) settings.goals[key] /= percentCounts[key];
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
        const savedLevel = localStorage.getItem('contrastLevel') || '3';
        document.documentElement.dataset.contrast = savedLevel;
        document.querySelectorAll('.contrast-selector').forEach(sel => sel.value = savedLevel);
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
        const uniqueNganhHang = [...new Set(ycxData.map(r => utils.cleanCategoryName(r.nganhHang)).filter(Boolean))].sort();
        const uniqueNhomHang = [...new Set(ycxData.map(r => utils.cleanCategoryName(r.nhomHang)).filter(Boolean))].sort();
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

    async captureAndDownload(elementToCapture, title) {
        const date = new Date();
        const timeString = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const dateString = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        const finalTitle = `${title.replace(/_/g, ' ')} - ${timeString} ${dateString}`;
    
        const captureWrapper = document.createElement('div');
        captureWrapper.className = 'capture-container';
    
        const titleEl = document.createElement('h2');
        titleEl.className = 'capture-title';
        titleEl.textContent = finalTitle;
        captureWrapper.appendChild(titleEl);
    
        captureWrapper.appendChild(elementToCapture.cloneNode(true));
        document.body.appendChild(captureWrapper);
    
        try {
            const canvas = await html2canvas(captureWrapper, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#f3f4f6'
            });
    
            const link = document.createElement('a');
            link.download = `${title}_${dateString.replace(/\//g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            ui.showNotification('Đã chụp và tải xuống hình ảnh!', 'success');
        } catch (err) {
            console.error('Lỗi chụp màn hình:', err);
            ui.showNotification(`Lỗi khi chụp ảnh: ${err.message}.`, 'error');
        } finally {
            if (document.body.contains(captureWrapper)) {
                document.body.removeChild(captureWrapper);
            }
        }
    },
    
    async captureDashboardInParts(contentContainer, baseTitle) {
        if (!contentContainer) {
            ui.showNotification('Không tìm thấy vùng nội dung để chụp.', 'error');
            return;
        }
        ui.showNotification(`Bắt đầu chụp báo cáo ${baseTitle}...`, 'success');
    
        const captureGroups = new Map();
        contentContainer.querySelectorAll('[data-capture-group]').forEach(el => {
            const group = el.dataset.captureGroup;
            if (!captureGroups.has(group)) {
                captureGroups.set(group, []);
            }
            captureGroups.get(group).push(el);
        });
    
        if (captureGroups.size === 0) {
            const preset = contentContainer.dataset.capturePreset;
            const styleElement = _injectCaptureStyles();
            if (preset) contentContainer.classList.add(`preset-${preset}`);
            
            try {
                await utils.captureAndDownload(contentContainer, baseTitle);
            } finally {
                if (preset) contentContainer.classList.remove(`preset-${preset}`);
                styleElement.remove();
            }
            return;
        }
        
        const styleElement = _injectCaptureStyles();
        try {
            for (const [group, elements] of captureGroups.entries()) {
                const captureTitle = captureGroups.size > 1 ? `${baseTitle}_Nhom_${group}` : baseTitle;
                
                const targetElement = elements[0];
                const preset = targetElement.dataset.capturePreset;
                const isKpiGroup = group === 'kpi';
                
                if (isKpiGroup) targetElement.classList.add('prepare-for-kpi-capture');
                if (preset) targetElement.classList.add(`preset-${preset}`);

                try {
                    await new Promise(resolve => setTimeout(resolve, 150));
        
                    let elementToCapture;
                    if (elements.length > 1 && !isKpiGroup) {
                        const tempContainer = document.createElement('div');
                        tempContainer.className = 'capture-layout-container';
                        if (preset) tempContainer.classList.add(`preset-${preset}`);
                        elements.forEach(el => tempContainer.appendChild(el.cloneNode(true)));
                        elementToCapture = tempContainer;
                    } else {
                        elementToCapture = targetElement;
                    }
        
                    await utils.captureAndDownload(elementToCapture, captureTitle);
                } finally {
                    if (isKpiGroup) targetElement.classList.remove('prepare-for-kpi-capture');
                    if (preset) targetElement.classList.remove(`preset-${preset}`);
                }
            }
        } finally {
            styleElement.remove();
        }

        ui.showNotification(`Đã hoàn tất chụp ảnh báo cáo ${baseTitle}!`, 'success');
    },
};

export { utils };