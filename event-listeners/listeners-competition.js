// Version 1.1 - Refactor: Update target input listener to use globalCompetitionConfigs
// MODULE: LISTENERS - COMPETITION
// Chứa logic sự kiện cho việc quản lý các chương trình thi đua.

import { appState } from '../state.js';

export function initializeCompetitionListeners(appController) {
    const goalDrawer = document.getElementById('goal-drawer');
    if (!goalDrawer) return;

    // Sử dụng event delegation cho các nút trong danh sách
    goalDrawer.addEventListener('click', (e) => {
        const addBtn = e.target.closest('#add-competition-btn');
        const cancelBtn = e.target.closest('#cancel-competition-btn');
        const editBtn = e.target.closest('.edit-competition-btn');
        const deleteBtn = e.target.closest('.delete-competition-btn');

        if (addBtn) appController._handleCompetitionFormShow(true);
        if (cancelBtn) appController._handleCompetitionFormShow(false);
        if (editBtn) {
            const index = parseInt(editBtn.dataset.index, 10);
            appController._handleCompetitionFormEdit(index);
        }
        if (deleteBtn) {
            const index = parseInt(deleteBtn.dataset.index, 10);
            if (confirm('Bạn có chắc chắn muốn xóa chương trình này?')) {
                appController._handleCompetitionDelete(index);
            }
        }
    });

    // Gắn sự kiện cho form
    const form = document.getElementById('competition-form');
    form?.addEventListener('submit', (e) => appController._handleCompetitionFormSubmit(e));
    
    // Gắn sự kiện cho select loại thi đua
    const competitionTypeSelect = document.getElementById('competition-type');
    competitionTypeSelect?.addEventListener('change', (e) => {
        const priceSegment = document.getElementById('price-segment');
        if(priceSegment) {
            priceSegment.classList.toggle('hidden', e.target.value !== 'soluong');
        }
    });

    // Sử dụng event delegation trên body cho các input target được tạo động
    document.body.addEventListener('change', (e) => {
        if (e.target.classList.contains('competition-target-input')) {
            const competitionId = e.target.dataset.competitionId;
            
            // === START REFACTOR 2 (Bước 2d) ===
            // Sửa logic để cập nhật vào global configs
            const config = appState.globalCompetitionConfigs.find(c => c.id === competitionId);
            // === END REFACTOR 2 ===

            if (config) {
                config.target = e.target.value; 
            }
            appController.updateAndRenderCurrentTab(); 
        }
    });
}