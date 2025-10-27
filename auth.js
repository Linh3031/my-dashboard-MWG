// Version 2.4 - Add detailed logging within polling interval
// MODULE: AUTH
// Chịu trách nhiệm xử lý logic định danh người dùng qua email, yêu cầu sau khi có phiên ẩn danh.

import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { appState } from './state.js';
import { ui } from './ui.js';
import { firebase } from './firebase.js';

export const auth = {
    _authInstance: null,

    async ensureAnonymousAuth() {
        if (!this._authInstance) {
            this._authInstance = getAuth();
            if (!this._authInstance) {
                 console.error("Firebase Auth chưa được khởi tạo đúng cách trong firebase.js");
                 throw new Error("Firebase Auth initialization failed.");
            }
        }
        return new Promise((resolve, reject) => {
            onAuthStateChanged(this._authInstance, async (user) => {
                if (user) {
                    console.log("Anonymous user detected or already signed in:", user.uid);
                    resolve(user);
                } else {
                    console.log("No user found, attempting anonymous sign-in...");
                    try {
                        const userCredential = await signInAnonymously(this._authInstance);
                        console.log("Anonymous sign-in successful:", userCredential.user.uid);
                        resolve(userCredential.user);
                    } catch (error) {
                        console.error("Anonymous sign-in failed:", error);
                        ui.showNotification("Lỗi xác thực. Không thể kết nối.", "error");
                        reject(error);
                    }
                }
            }, (error) => {
                console.error("Error in onAuthStateChanged listener:", error);
                reject(error);
            });
        });
    },

    initEmailIdentification(onSuccessCallback) {
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail && this._isValidEmail(savedEmail)) {
            appState.currentUser = { email: savedEmail };
            console.log("Email found in localStorage, proceeding.");
            onSuccessCallback();
        } else {
            console.log("No valid email in localStorage, showing login modal.");
            ui.toggleModal('login-modal', true);
            this._setupLoginListenerDeferred(onSuccessCallback);
        }
    },

    /**
     * @private
     * Thiết lập trình nghe sự kiện cho form đăng nhập - Phiên bản mới với polling
     * Chờ cho đến khi các element của modal xuất hiện trong DOM.
     * @param {Function} onSuccessCallback - Hàm callback để chạy sau khi đăng nhập thành công.
     */
    _setupLoginListenerDeferred(onSuccessCallback) {
        const maxWaitTime = 5000; // Chờ tối đa 5 giây
        const checkInterval = 100; // Kiểm tra mỗi 100ms
        let elapsedTime = 0;

        console.log("[auth.js] Attempting to set up login listener, waiting for elements...");

        const intervalId = setInterval(() => {
            elapsedTime += checkInterval; // Tăng thời gian đã trôi qua ở đầu mỗi lần lặp
            const submitBtn = document.getElementById('login-submit-btn');
            const emailInput = document.getElementById('login-email-input');

            // *** ADDED: Logging inside interval ***
            console.log(`[auth.js interval ${elapsedTime}ms] Checking... Button found: ${!!submitBtn}, Input found: ${!!emailInput}`);

            if (submitBtn && emailInput) {
                clearInterval(intervalId);
                console.log("[auth.js] Login elements found. Attaching listeners now.");
                this._attachLoginHandlers(submitBtn, emailInput, onSuccessCallback);
            } else if (elapsedTime >= maxWaitTime) {
                clearInterval(intervalId);
                console.error("[auth.js] CRITICAL TIMEOUT: Login button or email input not found after waiting.");
                // *** ADDED: Log current modal HTML on timeout ***
                const modalElement = document.getElementById('login-modal');
                console.error("[auth.js] Current #login-modal content on timeout:", modalElement?.innerHTML.substring(0, 300) + "...");
                ui.showNotification("Lỗi giao diện nghiêm trọng: Không thể khởi tạo form đăng nhập.", "error");
            }
            // No 'else' needed here, just continue polling if not found and not timed out
        }, checkInterval);
    },

    /**
     * @private
     * Gắn các hàm xử lý sự kiện click và keydown (tách ra để tái sử dụng).
     */
     _attachLoginHandlers(submitBtn, emailInput, onSuccessCallback) {
         if (submitBtn.dataset.listenerAttached) {
             console.warn("Login listener already attached. Skipping.");
             return;
         }
         submitBtn.dataset.listenerAttached = 'true';
         emailInput.dataset.listenerAttached = 'true';

         submitBtn.onclick = async () => {
             const currentEmailInput = document.getElementById('login-email-input');
             const currentErrorMsg = document.getElementById('login-error-msg');
             const currentSubmitBtn = document.getElementById('login-submit-btn');

             if (!currentEmailInput || !currentErrorMsg || !currentSubmitBtn) {
                 console.error("Login modal elements missing during click handler!");
                 return;
             }

             const email = currentEmailInput.value.trim();
             if (this._isValidEmail(email)) {
                 currentErrorMsg.classList.add('hidden');
                 currentSubmitBtn.disabled = true;
                 currentSubmitBtn.textContent = "Đang xử lý...";

                 localStorage.setItem('userEmail', email);
                 appState.currentUser = { email: email };

                 ui.showNotification(`Chào mừng ${email}!`, 'success');
                 await firebase.upsertUserRecord(email);

                 ui.toggleModal('login-modal', false);
                 console.log("Email submitted, calling onSuccessCallback.");
                 onSuccessCallback();
             } else {
                 currentErrorMsg.classList.remove('hidden');
                 currentSubmitBtn.disabled = false;
                 currentSubmitBtn.textContent = "Xác nhận & Tiếp tục";
             }
         };

         emailInput.onkeydown = (e) => {
             if (e.key === 'Enter') {
                 e.preventDefault();
                 const currentSubmitBtn = document.getElementById('login-submit-btn');
                 if (currentSubmitBtn && !currentSubmitBtn.disabled) {
                     currentSubmitBtn.click();
                 }
             }
         };
         console.log("Successfully attached login handlers.");
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