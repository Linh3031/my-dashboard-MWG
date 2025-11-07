// Version 1.0 - Initial service extraction
// MODULE: ANALYTICS SERVICE
// Chịu trách nhiệm xử lý logic thống kê, người dùng và phân tích.
import { getFirestore, collection, doc, setDoc, increment, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { appState } from '../state.js';
import { ui } from '../ui.js';

export const analyticsService = {
    /**
     * Tăng giá trị một trường số trong Firestore.
     * Nếu fieldName là 'actionsTaken' và có email, tăng bộ đếm cho user đó.
     * Ngược lại, tăng bộ đếm global trong 'analytics/site_stats'.
     * @param {string} fieldName Tên trường cần tăng (vd: 'pageLoads', 'actionsTaken').
     * @param {string} [email=null] Email của người dùng (chỉ dùng cho actionsTaken).
     */
    async incrementCounter(fieldName, email = null) {
        if (!appState.db || !fieldName) return;

        let docRef;
        const dataToUpdate = { [fieldName]: increment(1) };

        // ** Logic: Kiểm tra nếu là actionsTaken và có email **
        if (fieldName === 'actionsTaken' && email) {
            docRef = doc(appState.db, "users", email);
            console.log(`Incrementing actionsTaken for user: ${email}`);
        } else if (fieldName === 'actionsTaken' && !email) {
            // Nếu là actionsTaken nhưng không có email (dự phòng), vẫn tăng global
            docRef = doc(appState.db, "analytics", "site_stats");
            console.log("Incrementing global actionsTaken (email not provided).");
        } else {
            // Các trường hợp khác (vd: pageLoads) tăng global
            docRef = doc(appState.db, "analytics", "site_stats");
            console.log(`Incrementing global counter: ${fieldName}`);
        }

        try {
            await setDoc(docRef, dataToUpdate, { merge: true });
        } catch (error) {
            console.error(`Lỗi khi tăng bộ đếm cho '${fieldName}' tại ${docRef.path}:`, error);
        }
    },

    async upsertUserRecord(email) {
        if (!appState.db || !email) return;
        if (!appState.auth?.currentUser) { console.warn("Attempted to upsert user record before auth is ready."); return; }
        const userRef = doc(appState.db, "users", email);
        try {
            // Chỉ tăng loginCount, không reset actionsTaken ở đây
            await setDoc(userRef, {
                email: email,
                lastLogin: serverTimestamp(),
                loginCount: increment(1)
            }, { merge: true });
            console.log(`User record for ${email} updated successfully (loginCount incremented).`);
        } catch (error) { console.error("Error upserting user record:", error); }
    },

    /**
     * Lấy danh sách tất cả người dùng và thông tin của họ từ Firestore.
     * Bao gồm cả trường 'actionsTaken'.
     * @returns {Promise<Array<Object>>} Mảng các đối tượng người dùng.
     */
    async getAllUsers() {
        if (!appState.db || !appState.isAdmin) {
            ui.showNotification("Bạn không có quyền truy cập chức năng này.", "error");
            return [];
        }
        try {
            const usersCollection = collection(appState.db, "users");
            const querySnapshot = await getDocs(usersCollection);
            const users = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                users.push({
                    email: data.email,
                    loginCount: data.loginCount || 0,
                    lastLogin: data.lastLogin?.toDate(),
                    actionsTaken: data.actionsTaken || 0 // Lấy thêm actionsTaken
                });
            });
            console.log(`Loaded ${users.length} users from Firestore.`);
            return users;
        } catch (error) {
            console.error("Lỗi khi lấy danh sách người dùng:", error);
            ui.showNotification("Không thể tải danh sách người dùng.", "error");
            return [];
        }
    }
};