// Version 1.0 - Refactored from utils.js
// MODULE: SETTINGS SERVICE
// Chứa toàn bộ logic liên quan đến việc quản lý cài đặt (lưu/tải từ localStorage).

import { appState } from '../state.js';
import { ui } from '../ui.js';

export const settingsService = {
    loadInterfaceSettings() {
        try {
            const savedSettings = JSON.parse(localStorage.getItem('interfaceSettings')) || {};
            const defaultSettings = {
                kpiCard1Bg: '#38bdf8', kpiCard2Bg: '#34d399', kpiCard3Bg: '#fbbf24',
                kpiCard4Bg: '#2dd4bf', kpiCard5Bg: '#a78bfa', kpiCard6Bg: '#f472b6', 
                kpiCard7Bg: '#818cf8', kpiCard8Bg: '#f87171',
                kpiTitleColor: '#ffffff',
                kpiMainColor: '#ffffff',
                kpiSubColor: '#ffffff',
                globalFontSize: '14',
                kpiFontSize: '36'
            };
            const settings = { ...defaultSettings, ...savedSettings };
            
            ui.applyInterfaceSettings(settings);
            
            // Cập nhật giá trị cho các bộ chọn màu
            Object.keys(defaultSettings).forEach((key) => {
                if (key.startsWith('kpiCard')) {
                    const keyNumber = key.replace('kpiCard', '').replace('Bg', '');
                    const colorPicker = document.getElementById(`kpi-color-${keyNumber}`);
                    if (colorPicker) colorPicker.value = settings[key];
                }
            });
            
            const titleColorPicker = document.getElementById('kpi-title-color');
            if(titleColorPicker) titleColorPicker.value = settings.kpiTitleColor;
            
            const mainColorPicker = document.getElementById('kpi-main-color');
            if(mainColorPicker) mainColorPicker.value = settings.kpiMainColor;

            const subColorPicker = document.getElementById('kpi-sub-color');
            if(subColorPicker) subColorPicker.value = settings.kpiSubColor;


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
            kpiCard7Bg: document.getElementById('kpi-color-7')?.value,
            kpiCard8Bg: document.getElementById('kpi-color-8')?.value,
            kpiTitleColor: document.getElementById('kpi-title-color')?.value,
            kpiMainColor: document.getElementById('kpi-main-color')?.value,
            kpiSubColor: document.getElementById('kpi-sub-color')?.value,
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
        const warehouseSelect = document.getElementById('rt-goal-warehouse-select');
        if (!warehouseSelect) return;
        const warehouse = warehouseSelect.value;
        const settings = (warehouse && appState.realtimeGoalSettings && appState.realtimeGoalSettings[warehouse]) 
            ? appState.realtimeGoalSettings[warehouse] 
            : { goals: {}, timing: {} };

        document.querySelectorAll('.rt-goal-input').forEach(input => input.value = settings.goals?.[input.dataset.goal] || '');
        document.querySelectorAll('.rt-setting-input').forEach(input => input.value = settings.timing?.[input.id] || '');
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
        const warehouseSelect = document.getElementById('luyke-goal-warehouse-select');
        if (!warehouseSelect) return;
        const warehouse = warehouseSelect.value;
        const settings = (warehouse && appState.luykeGoalSettings && appState.luykeGoalSettings[warehouse]) 
            ? appState.luykeGoalSettings[warehouse] 
            : {};
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
};