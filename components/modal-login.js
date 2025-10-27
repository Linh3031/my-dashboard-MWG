// Version 1.2 - Add logging to render function
// Chứa mã HTML cho modal yêu cầu email người dùng khi truy cập lần đầu.

const modalLoginHTML = `
<div id="login-modal" class="modal hidden">
    <div class="modal__overlay" style="cursor: not-allowed;"></div>
    <div class="modal__container" style="max-width: 420px;">
        <div class="modal__header">
            <h3 class="modal__title">Chào mừng đến với Công cụ Phân tích</h3>
        </div>
        <div class="modal__content">
            <p class="text-gray-600 mb-4">Vui lòng nhập email của bạn để bắt đầu sử dụng. Email này sẽ được dùng để định danh và đồng bộ dữ liệu trong tương lai.</p>
            <div class="space-y-4">
                <div>
                    <label for="login-email-input" class="block text-sm font-medium text-gray-700 mb-1">Email của bạn</label>
                    <input type="email" id="login-email-input" class="w-full p-2 border rounded-lg" placeholder="your.email@example.com">
                    <p id="login-error-msg" class="text-red-500 text-sm mt-1 hidden">Vui lòng nhập một địa chỉ email hợp lệ.</p>
                </div>
                <button id="login-submit-btn" class="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition text-base">
                    Xác nhận & Tiếp tục
                </button>
            </div>
        </div>
    </div>
</div>
`;

export const modalLogin = {
    async render(containerSelector) {
        console.log(`[modalLogin.render] Attempting to render into: ${containerSelector}`); // Log mới
        const container = document.querySelector(containerSelector);
        if (container) {
            console.log(`[modalLogin.render] Container found. Setting innerHTML.`); // Log mới
            container.innerHTML = modalLoginHTML;
            console.log(`[modalLogin.render] innerHTML set. Waiting for next tick.`); // Log mới
            // Return a promise that resolves after the next tick, ensuring DOM update
            return new Promise(resolve => setTimeout(() => {
                console.log(`[modalLogin.render] Next tick resolved.`); // Log mới
                resolve();
            }, 0));
        } else {
            console.error(`[modalLogin.render] Container ${containerSelector} NOT FOUND.`); // Log lỗi mới
        }
        // Return a resolved promise if container not found to avoid breaking await
        return Promise.resolve();
    }
};