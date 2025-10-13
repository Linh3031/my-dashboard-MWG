// Version 1.1 - Fix incorrect import paths for modules
// MODULE: HIGHLIGHT SERVICE
// Chứa logic để quản lý và áp dụng tính năng tô màu (highlight) trên các bảng.

import { appState } from '../state.js';
import { utils } from '../utils.js';

export const highlightService = {
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
};