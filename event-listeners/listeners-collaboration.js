// Version 1.0 - Refactored from ui-listeners.js
// MODULE: LISTENERS - COLLABORATION
// Chứa logic sự kiện cho các tính năng hợp tác (Góp ý, Nhận xét).

import { ui } from '../ui.js';

export function initializeCollaborationListeners(appController) {
    document.body.addEventListener('click', async (e) => {
        const target = e.target;

        // --- Feedback System ---
        if (target.id === 'submit-feedback-btn') {
            appController.handleSubmitFeedback();
        }
        const feedbackItem = target.closest('.feedback-item');
        if (feedbackItem) {
            appController.handleFeedbackReplyActions(e, feedbackItem);
        }
        
        // --- Composer System ---
        const composerTrigger = target.closest('.action-btn--composer');
        if (composerTrigger) {
            const sectionId = composerTrigger.id.split('-')[1];
            appController.prepareAndShowComposer(sectionId);
        }
        const composerModal = target.closest('#composer-modal');
        if (composerModal) {
            appController.handleComposerActions(e, composerModal);
        }
        if (target.id === 'copy-from-preview-btn') {
            ui.copyFromPreview();
        }

        // --- Admin/Declaration System ---
        if (target.id === 'save-help-content-btn') {
            appController.saveHelpContent();
        }
    });
}