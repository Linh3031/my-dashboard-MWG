// Version 2.0 - Final Merge: Implement Email-based identification flow
// MODULE: AUTH
// Chịu trách nhiệm xử lý logic định danh người dùng qua email.

import { appState } from './state.js';
import { ui } from './ui.js';
import { firebase } from './firebase.js';

export const auth = {
    /**
     * Khởi tạo module xác thực.
     * Kiểm tra email trong localStorage. Nếu không có, hiển thị modal đăng nhập.
     * Nếu có, tiến hành xác thực và chạy callback khi thành công.
     * @param {Function} onSuccessCallback - Hàm sẽ được gọi sau khi định danh người dùng thành công.
     */
    init(onSuccessCallback) {
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail && this._isValidEmail(savedEmail)) {
            appState.currentUser = { email: savedEmail };
            // Cập nhật thầm lặng số lần đăng nhập và thời gian trên server
            firebase.upsertUserRecord(savedEmail);
            // Tiếp tục khởi tạo ứng dụng
            onSuccessCallback();
        } else {
            // Hiển thị modal và chờ người dùng nhập email
            ui.toggleModal('login-modal', true);
            this._setupLoginListener(onSuccessCallback);
        }
    },

    /**
     * @private
     * Thiết lập trình nghe sự kiện cho form đăng nhập.
     * @param {Function} onSuccessCallback - Hàm callback để chạy sau khi đăng nhập thành công.
     */
    _setupLoginListener(onSuccessCallback) {
        const submitBtn = document.getElementById('login-submit-btn');
        const emailInput = document.getElementById('login-email-input');
        const errorMsg = document.getElementById('login-error-msg');

        if (!submitBtn || !emailInput || !errorMsg) {
            console.error("Không tìm thấy các thành phần của modal đăng nhập. Đã render modal-login.js chưa?");
            return;
        }

        // Xử lý sự kiện click
        submitBtn.onclick = async () => {
            const email = emailInput.value.trim();
            if (this._isValidEmail(email)) {
                errorMsg.classList.add('hidden');
                submitBtn.disabled = true;
                submitBtn.textContent = "Đang xử lý...";
                
                localStorage.setItem('userEmail', email);
                appState.currentUser = { email: email };

                ui.showNotification(`Chào mừng ${email}!`, 'success');
                await firebase.upsertUserRecord(email);

                ui.toggleModal('login-modal', false);
                onSuccessCallback(); // Chạy phần còn lại của quá trình khởi tạo ứng dụng
            } else {
                errorMsg.classList.remove('hidden');
            }
        };

        // Xử lý sự kiện nhấn Enter
        emailInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitBtn.click();
            }
        };
    },

    /**
     * @private
     * Kiểm tra định dạng email đơn giản.
     * @param {string} email
     * @returns {boolean}
     */
    _isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email && emailRegex.test(email);
    }
};