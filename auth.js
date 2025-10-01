// Version 1.1 - Add totalUsers counter on new user creation
// MODULE: AUTH
// Chịu trách nhiệm xử lý tất cả logic liên quan đến xác thực người dùng.

import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// === START: THÊM IMPORT MỚI ===
import { doc, setDoc, serverTimestamp, getDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// === END: THÊM IMPORT MỚI ===
import { appState } from './state.js';

export const auth = {
    /**
     * Khởi tạo module xác thực.
     * Thiết lập một listener để theo dõi trạng thái đăng nhập và tự động đăng nhập ẩn danh nếu cần.
     */
    init() {
        const authInstance = getAuth();
        
        onAuthStateChanged(authInstance, (user) => {
            if (user) {
                appState.currentUser = user;
                console.log("Người dùng đã xác thực với UID:", user.uid);
                
                // Tạo một bản ghi trong Firestore cho người dùng này nếu chưa có
                this.createUserRecord(user);
            } else {
                console.log("Chưa có người dùng, đang tiến hành đăng nhập ẩn danh...");
                signInAnonymously(authInstance).catch((error) => {
                    console.error("Lỗi đăng nhập ẩn danh:", error);
                });
            }
        });
    },

    /**
     * Tạo một bản ghi trong collection 'users' VÀ tăng bộ đếm người dùng.
     * Chỉ thực hiện nếu bản ghi người dùng chưa tồn tại.
     * @param {object} user - Đối tượng user trả về từ Firebase Auth.
     */
    async createUserRecord(user) {
        if (!appState.db || !user) return;

        const userRef = doc(appState.db, "users", user.uid);

        try {
            const userDoc = await getDoc(userRef);

            // === START: LOGIC MỚI - CHỈ THỰC HIỆN KHI LÀ NGƯỜI DÙNG MỚI ===
            if (!userDoc.exists()) {
                console.log(`Phát hiện người dùng mới (${user.uid}). Đang tạo hồ sơ và cập nhật bộ đếm...`);
                
                // 1. Tạo hồ sơ người dùng
                const userData = {
                    uid: user.uid,
                    email: user.email || null,
                    createdAt: serverTimestamp(),
                    role: 'free_user'
                };
                await setDoc(userRef, userData);

                // 2. Tăng bộ đếm tổng số người dùng
                const statsRef = doc(appState.db, "analytics", "site_stats");
                await setDoc(statsRef, {
                    totalUsers: increment(1)
                }, { merge: true });
                
                console.log("-> Đã tăng bộ đếm totalUsers.");
            }
            // === END: LOGIC MỚI ===
        } catch (error) {
            console.error("Lỗi khi kiểm tra hoặc tạo bản ghi người dùng:", error);
        }
    }
};