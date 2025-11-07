// Version 3.4 - Refactor: Extract action functions into separate services
// MODULE: FIREBASE (CORE)
// Chịu trách nhiệm kết nối, thiết lập listener với Firebase.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { appState } from './state.js';
import { ui } from './ui.js';

const firebase = {
    async initCore() {
        const firebaseConfig = {
          apiKey: "AIzaSyAQ3TWcpa4AnTN-32igGseYDlXrCf1BVew", // Replace with your actual config if needed
          authDomain: "qlst-9e6bd.firebaseapp.com",
          projectId: "qlst-9e6bd",
          storageBucket: "qlst-9e6bd.firebasestorage.app",
          messagingSenderId: "2316705291",
          appId: "1:2316705291:web:ebec2963816aea7585b10e",
          measurementId: "G-M0SM0XHCEK"
        };
        try {
            const firebaseApp = initializeApp(firebaseConfig);
            appState.auth = getAuth(firebaseApp);
            appState.db = getFirestore(firebaseApp);
            appState.storage = getStorage(firebaseApp);
            console.log("Firebase core services initialized successfully!");
        } catch (error) {
            console.error("Firebase core initialization failed:", error);
            ui.showNotification(error.message || "Không thể khởi tạo kết nối Firebase.", "error");
            throw error;
        }
    },

    setupListeners() {
        console.log("Setting up Firebase listeners...");
        if (!appState.db) {
            console.error("Firestore DB instance not available for setting up listeners.");
            return;
        }
        if (!appState.auth?.currentUser) {
             console.warn("Attempting to set up listeners before authentication is complete. This might lead to permission errors initially.");
        }

        const feedbackQuery = query(collection(appState.db, "feedback"), orderBy("timestamp", "desc"));
        onSnapshot(feedbackQuery, (querySnapshot) => {
            console.log("Feedback listener received data.");
            appState.feedbackList = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                appState.feedbackList.push({ id: doc.id, ...data, timestamp: data.timestamp?.toDate() });
            });
            // Chỉ render nếu đang ở trang chủ
            if (document.getElementById('home-section')?.classList.contains('hidden') === false) {
                 ui.renderFeedbackSection(); // Giả sử hàm này nằm trong ui object
            }
        }, (error) => {
            console.error("Error listening to feedback collection: ", error);
            if (error.code !== 'permission-denied') {
                 ui.showNotification("Lỗi khi tải danh sách góp ý.", "error");
            }
        });

        const helpContentRef = collection(appState.db, "help_content");
        onSnapshot(helpContentRef, (querySnapshot) => {
            console.log("Help content listener received data.");
            let contentUpdated = false;
            querySnapshot.forEach((doc) => {
                if (appState.helpContent.hasOwnProperty(doc.id)) {
                    appState.helpContent[doc.id] = doc.data().content;
                    contentUpdated = true;
                }
            });
            // Chỉ render nếu admin đang ở trang khai báo
            if (contentUpdated && appState.isAdmin && document.getElementById('declaration-section')?.classList.contains('hidden') === false) {
                 ui.renderAdminHelpEditors(); // Giả sử hàm này nằm trong ui object
            }
        }, (error) => {
            console.error("Error listening to help_content collection: ", error);
            if (error.code !== 'permission-denied') {
                ui.showNotification("Lỗi khi tải nội dung hướng dẫn.", "error");
            }
        });

        const statsRef = doc(appState.db, "analytics", "site_stats");
        onSnapshot(statsRef, (docSnap) => {
            if (docSnap.exists()) {
               console.log("Stats listener received data.");
               const statsData = docSnap.data();
                ui.updateUsageCounter(statsData); // Giả sử hàm này nằm trong ui object
            } else {
                console.log("Không tìm thấy document thống kê.");
            }
        }, (error) => {
             console.error("Error listening to site_stats document: ", error);
             if (error.code !== 'permission-denied') {
                 ui.showNotification("Lỗi khi tải số liệu thống kê.", "error");
            }
        });

        console.log("Firebase listeners setup initiated.");
    },

    listenForDataChanges(kho, callback) {
        if (!appState.db || !kho || typeof callback !== 'function') return null;
        if (!appState.auth?.currentUser) {
             console.warn(`Cannot listen for data changes for kho ${kho} before auth is ready.`);
             return null;
        }
        const khoRef = doc(appState.db, "warehouseData", kho);
        console.log(`Bắt đầu lắng nghe thay đổi dữ liệu cho kho: ${kho}`);
        const unsubscribe = onSnapshot(khoRef, (docSnap) => {
            if (docSnap.exists()) {
                console.log(`Phát hiện dữ liệu/metadata mới cho kho ${kho}.`);
                const allData = docSnap.data();
                callback(allData);
            } else {
                console.log(`Chưa có dữ liệu/metadata nào trên cloud cho kho ${kho}.`);
                callback({});
            }
        }, (error) => {
            console.error(`Lỗi khi lắng nghe dữ liệu kho ${kho}:`, error);
            if (error.code !== 'permission-denied') {
                 ui.showNotification("Mất kết nối đồng bộ dữ liệu.", "error");
            } else {
                 console.warn(`Permission denied while listening for data changes on kho ${kho}. Check Firestore rules.`);
            }
        });
        return unsubscribe;
    }
};

export { firebase };