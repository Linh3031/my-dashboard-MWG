// Version 1.0 - Component: Selection Modal
// Chứa mã HTML cho modal tùy chỉnh hiển thị chung.

const modalSelectionHTML = `
<div id="selection-modal" class="modal hidden">
    <div class="modal__overlay" data-close-modal></div>
    <div class="modal__container">
        <div class="modal__header">
            <h3 id="selection-modal-title" class="modal__title">Tùy chỉnh hiển thị</h3>
            <button class="modal__close-btn" data-close-modal>&times;</button>
        </div>
        <div class="modal__content">
            <input type="text" id="selection-modal-search" class="w-full p-2 border rounded-md mb-4" placeholder="Tìm kiếm mục...">
            <div id="selection-modal-list" class="space-y-2 max-h-64 overflow-y-auto">
                </div>
        </div>
        <div class="modal__footer">
            <button id="selection-modal-save-btn" class="action-btn action-btn--save">Lưu Cài Đặt</button>
        </div>
    </div>
</div>
`;

export const modalSelection = {
    render(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = modalSelectionHTML;
        }
    }
};