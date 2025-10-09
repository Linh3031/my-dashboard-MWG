// Version 1.0 - Component: Preview Modal
// Chứa mã HTML cho modal xem trước nội dung nhận xét.

const modalPreviewHTML = `
<div id="preview-modal" class="modal hidden">
    <div class="modal__overlay" data-close-modal></div>
    <div class="modal__container">
        <div class="modal__header">
            <h3 id="preview-modal-title" class="modal__title">Xem trước nội dung</h3>
            <button class="modal__close-btn" data-close-modal>&times;</button>
        </div>
        <div class="modal__content">
            <pre id="preview-modal-content" class="preview-content"></pre>
        </div>
        <div class="modal__footer">
            <button id="copy-from-preview-btn" class="action-btn action-btn--copy">Sao chép nội dung</button>
        </div>
    </div>
</div>
`;

export const modalPreview = {
    render(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = modalPreviewHTML;
        }
    }
};