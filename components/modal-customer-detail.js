// Version 1.0 - Component: Customer Detail Modal
// Chứa mã HTML cho modal bật lên (popup) hiển thị chi tiết khách hàng.

const modalCustomerDetailHTML = `
<div id="customer-detail-modal" class="modal hidden">
    <div class="modal__overlay" data-close-modal></div>
    
    <div class="modal__container" style="max-width: 640px; max-height: 90vh;">
        <div class="modal__header">
            <h3 id="customer-detail-modal-title" class="modal__title">Chi tiết Đơn hàng theo Khách hàng</h3>
            <button class="modal__close-btn" data-close-modal>&times;</button>
        </div>
        
        <div class="modal__content !p-0">
            <div id="customer-detail-controls" class="p-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                <span class="text-sm font-semibold mr-2">Sắp xếp theo:</span>
                <button class="px-3 py-1 text-xs font-medium rounded-full bg-gray-200" data-sort="totalRealRevenue" data-direction="desc">
                    Doanh thu (Cao &gt; Thấp)
                </button>
                <button class="px-3 py-1 text-xs font-medium rounded-full bg-gray-200 ml-2" data-sort="conversionRate" data-direction="desc">
                    % Quy đổi (Cao &gt; Thấp)
                </button>
            </div>
            
            <div id="customer-detail-list-container" class="p-3" style="max-height: calc(90vh - 180px); overflow-y: auto;">
                <p class="text-gray-500">Đang tải dữ liệu khách hàng...</p>
            </div>
        </div>
        
        <div class="modal__footer">
            <button id="capture-customer-detail-btn" class="action-btn action-btn--capture">
                <i data-feather="camera"></i>
                <span>Chụp ảnh Modal</span>
            </button>
            <button class="action-btn action-btn--copy" data-close-modal>
                Đóng
            </button>
        </div>
    </div>
</div>
`;

export const modalCustomerDetail = {
    render(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = modalCustomerDetailHTML;
        }
    }
};