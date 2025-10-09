// Version 1.0 - Component: Admin Modal
// Chứa mã HTML cho modal yêu cầu mật khẩu admin.

const modalAdminHTML = `
<div id="admin-modal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4">
        <h3 class="text-lg font-bold mb-4">Truy cập khu vực Admin</h3>
        <p class="text-sm text-gray-600 mb-4">Vui lòng nhập mật khẩu để xem và chỉnh sửa phần Khai báo.</p>
        <input type="password" id="admin-password-input" class="w-full p-2 border rounded-lg mb-2" placeholder="Mật khẩu...">
        <p id="admin-error-msg" class="text-red-500 text-sm mb-4 hidden">Mật khẩu không đúng. Vui lòng thử lại.</p>
        <div class="flex justify-end space-x-3">
            <button id="admin-cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Hủy</button>
            <button id="admin-submit-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Xác nhận</button>
        </div>
    </div>
</div>
`;

export const modalAdmin = {
    render(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = modalAdminHTML;
        }
    }
};