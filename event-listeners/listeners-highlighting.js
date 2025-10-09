// Version 1.0 - Refactored from ui-listeners.js
// MODULE: LISTENERS - HIGHLIGHTING
// Chứa logic sự kiện cho tính năng tô màu (highlight).

import { appState } from '../state.js';
import { highlightService } from '../modules/highlight.service.js';

/**
 * Xử lý khi người dùng thay đổi lựa chọn trong các bộ lọc highlight.
 * @param {string} prefix - 'luyke', 'sknv', hoặc 'realtime'.
 * @param {string} type - 'nhanhang', 'nhomhang', hoặc 'employee'.
 */
function handleHighlightFilterChange(prefix, type) {
    const choicesInstance = appState.choices[`${prefix}_highlight_${type}`];
    if (!choicesInstance) return;

    const values = choicesInstance.getValue(true);
    const color = document.getElementById(`${prefix}-highlight-color`).value;
    
    appState.highlightSettings[prefix] = { type, values, color };
    localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
    
    highlightService.applyHighlights(prefix);
}

export function initializeHighlightingListeners(appController) {
    ['luyke', 'sknv', 'realtime'].forEach(prefix => {
        const nhanhangFilter = document.getElementById(`${prefix}-highlight-nhanhang`);
        if (nhanhangFilter) {
            nhanhangFilter.addEventListener('change', () => handleHighlightFilterChange(prefix, 'nhanhang'));
        }

        const nhomhangFilter = document.getElementById(`${prefix}-highlight-nhomhang`);
        if (nhomhangFilter) {
            nhomhangFilter.addEventListener('change', () => handleHighlightFilterChange(prefix, 'nhomhang'));
        }

        const employeeFilter = document.getElementById(`${prefix}-highlight-employee`);
        if (employeeFilter) {
            employeeFilter.addEventListener('change', () => handleHighlightFilterChange(prefix, 'employee'));
        }

        const colorInput = document.getElementById(`${prefix}-highlight-color`);
        if (colorInput) {
            colorInput.addEventListener('input', () => appController.handleHighlightColorChange(prefix));
        }
        
        const clearButton = document.getElementById(`${prefix}-clear-highlight`);
        if (clearButton) {
            clearButton.addEventListener('click', () => appController.handleClearHighlight(prefix));
        }
    });
}