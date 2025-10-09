// Version 1.0 - Refactored from ui-listeners.js
// MODULE: LISTENERS - SORTING
// Chứa logic sự kiện cho việc sắp xếp các bảng.

import { appState } from '../state.js';

export function initializeSortingListeners(appController) {
    document.body.addEventListener('click', (e) => {
        const header = e.target.closest('.sortable');
        if (!header) return;

        const table = header.closest('table');
        if (!table) return;
        
        const tableType = table.dataset.tableType;
        const sortKey = header.dataset.sort;

        if (!tableType || !sortKey) return;

        const currentState = appState.sortState[tableType] || { key: sortKey, direction: 'desc' };
        
        let newDirection;
        if (currentState.key === sortKey) {
            newDirection = currentState.direction === 'desc' ? 'asc' : 'desc';
        } else {
            newDirection = 'desc';
        }
        
        appState.sortState[tableType] = { key: sortKey, direction: newDirection };

        appController.updateAndRenderCurrentTab();
    });
}