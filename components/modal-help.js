// Version 1.0 - Component: Help Modal
// Chứa mã HTML cho modal hiển thị nội dung hướng dẫn.

const modalHelpHTML = `
<div id="help-modal" class="modal hidden">
    <div class="modal__overlay" data-close-modal></div>
    <div class="modal__container">
        <div class="modal__header">
            <h3 id="help-modal-title" class="modal__title"></h3>
            <button class="modal__close-btn" data-close-modal>&times;</button>
        </div>
        <div id="help-modal-content" class="modal__content">
        </div>
    </div>
</div>
`;

export const modalHelp = {
    render(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = modalHelpHTML;
        }
    }
};