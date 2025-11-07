// Version 1.1 - Remove capture button from footer
// Chứa mã HTML cho modal bật lên (popup) hiển thị chi tiết doanh thu chưa xuất.

const modalUnexportedDetailHTML = `
<div id="unexported-detail-modal" class="modal hidden">
    <div class="modal__overlay" data-close-modal></div>
    
    <div class="modal__container" style="max-width: 576px; max-height: 90vh;">
        <div class="modal__header">
            <h3 id="unexported-detail-modal-title" class="modal__title">Chi tiết Doanh thu Chưa xuất</h3>
            <button class="modal__close-btn" data-close-modal>&times;</button>
        </div>
        
        <div class="modal__content !p-0">
            <div id="unexported-detail-list-container" class="p-3 customer-accordion-luyke" style="max-height: calc(90vh - 180px); overflow-y: auto;">
                <p class="text-gray-500">Đang tải dữ liệu chưa xuất...</p>
            </div>
        </div>
        
        <div class="modal__footer">
            <button class="action-btn action-btn--copy" data-close-modal>
                Đóng
            </button>
        </div>
    </div>
</div>
`;

export const modalUnexportedDetail = {
    render(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = modalUnexportedDetailHTML;
        }
    }
};