// Version 1.0 - Component: Force Update Modal
// Chứa mã HTML cho modal yêu cầu người dùng cập nhật phiên bản.

const modalForceUpdateHTML = `
<div id="force-update-modal" class="modal hidden">
    <div class="modal__overlay" style="cursor: not-allowed;"></div>
    <div class="modal__container" style="max-width: 450px;">
        <div class="modal__header">
            <h3 class="modal__title">📢 Đã có phiên bản mới!</h3>
        </div>
        <div class="modal__content text-center">
            <p class="text-gray-600 mb-4">Một phiên bản mới với các bản sửa lỗi và cải tiến đã sẵn sàng. Vui lòng tải lại trang để tiếp tục.(Xem chi tiết nội dung cập nhật ở tab "Hướng Dẫn & Góp Ý")</p>
            <button id="force-reload-btn" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition text-lg">
                Cập nhật ngay
            </button>
        </div>
    </div>
</div>
`;

export const modalForceUpdate = {
    render(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = modalForceUpdateHTML;
        }
    }
};