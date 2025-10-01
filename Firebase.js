// Version 1.4 - Update bookmark path to ZIP file
// MODULE: FIREBASE
// Chịu trách nhiệm kết nối, thiết lập listener với Firebase.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, arrayUnion, serverTimestamp, query, orderBy, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { appState } from './state.js';
import { ui } from './ui.js';

const firebase = {
    async init() {
       // For Firebase JS SDK v7.20.0 and later, measurementId is optional
        const firebaseConfig = {
          apiKey: "AIzaSyAQ3TWcpa4AnTN-32igGseYDlXrCf1BVew",
          authDomain: "qlst-9e6bd.firebaseapp.com",
          projectId: "qlst-9e6bd",
          storageBucket: "qlst-9e6bd.firebasestorage.app",
          messagingSenderId: "2316705291",
          appId: "1:2316705291:web:ebec2963816aea7585b10e",
          measurementId: "G-M0SM0XHCEK"
        };

        try {
            // SỬA LỖI: So sánh với giá trị mẫu "YOUR_API_KEY" thay vì key thật.
            if (firebaseConfig.apiKey === "YOUR_API_KEY") {
                throw new Error("Thông tin cấu hình Firebase chưa được cập nhật.");
            }
            const firebaseApp = initializeApp(firebaseConfig);
            appState.auth = getAuth(firebaseApp);
            appState.db = getFirestore(firebaseApp);
            appState.storage = getStorage(firebaseApp); 
            
            console.log("Firebase connected successfully!");
            this.setupListeners();
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            ui.showNotification(error.message || "Không thể kết nối tới cơ sở dữ liệu.", "error");
        }
    },

    setupListeners() {
        if (!appState.db) return;

        const feedbackQuery = query(collection(appState.db, "feedback"), orderBy("timestamp", "desc"));
        onSnapshot(feedbackQuery, (querySnapshot) => {
            appState.feedbackList = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                appState.feedbackList.push({ id: doc.id, ...data, timestamp: data.timestamp?.toDate() });
            });
            // Chỉ render lại nếu tab hiện tại là trang chủ
            if (document.getElementById('home-section')?.classList.contains('hidden') === false) {
                ui.renderFeedbackSection();
            }
        }, (error) => {
            console.error("Error listening to feedback collection: ", error);
            ui.showNotification("Lỗi khi tải danh sách góp ý.", "error");
        });

        const helpContentRef = collection(appState.db, "help_content");
        onSnapshot(helpContentRef, (querySnapshot) => {
            let contentUpdated = false;
            querySnapshot.forEach((doc) => {
                if (appState.helpContent.hasOwnProperty(doc.id)) {
                    appState.helpContent[doc.id] = doc.data().content;
                    contentUpdated = true;
                }
            });
            // Chỉ render lại editor nếu đang ở tab khai báo
            if (contentUpdated && appState.isAdmin && document.getElementById('declaration-section')?.classList.contains('hidden') === false) {
                ui.renderAdminHelpEditors();
            }
        }, (error) => {
            console.error("Error listening to help_content collection: ", error);
            ui.showNotification("Lỗi khi tải nội dung hướng dẫn.", "error");
        });

        const statsRef = doc(appState.db, "analytics", "site_stats");
        onSnapshot(statsRef, (docSnap) => {
            if (docSnap.exists()) {
                const statsData = docSnap.data();
                ui.updateUsageCounter(statsData);
            } else {
                console.log("Không tìm thấy document thống kê.");
            }
        });
    },

    async incrementCounter(fieldName) {
        if (!appState.db || !fieldName) return;
        const statsRef = doc(appState.db, "analytics", "site_stats");
        try {
            await setDoc(statsRef, { [fieldName]: increment(1) }, { merge: true });
        } catch (error) {
            console.error(`Lỗi khi tăng bộ đếm cho '${fieldName}':`, error);
        }
    },

    async submitFeedback(content) {
        if (!content || !appState.db || !appState.currentUser) {
             ui.showNotification("Không thể gửi góp ý: Người dùng chưa được xác thực.", "error");
            return;
        }
        try {
            await addDoc(collection(appState.db, "feedback"), {
                user: {
                    uid: appState.currentUser.uid,
                    isAnonymous: appState.currentUser.isAnonymous,
                },
                content: content,
                timestamp: serverTimestamp(),
                replies: []
            });
            ui.showNotification("Góp ý của bạn đã được gửi!", "success");
            return true;
        } catch (error) {
            console.error("Error adding feedback: ", error);
            ui.showNotification("Lỗi khi gửi góp ý.", "error");
            return false;
        }
    },

    async submitReply(docId, content) {
        if (!docId || !content || !appState.db) return false;
        try {
            const feedbackRef = doc(appState.db, "feedback", docId);
            await updateDoc(feedbackRef, {
                replies: arrayUnion({
                    content: content,
                    timestamp: new Date()
                })
            });
            return true;
        } catch (error) {
            console.error("Error submitting reply:", error);
            ui.showNotification("Lỗi khi gửi trả lời.", "error");
            return false;
        }
    },
    
    async saveHelpContent(contents) {
        if (!appState.db || !appState.isAdmin) return;
        ui.showNotification('Đang lưu nội dung hướng dẫn...', 'success');
        try {
            await Promise.all([
                setDoc(doc(appState.db, "help_content", "data"), { content: contents.data }),
                setDoc(doc(appState.db, "help_content", "luyke"), { content: contents.luyke }),
                setDoc(doc(appState.db, "help_content", "sknv"), { content: contents.sknv }),
                setDoc(doc(appState.db, "help_content", "realtime"), { content: contents.realtime })
            ]);
            ui.showNotification('Đã cập nhật nội dung hướng dẫn thành công!', 'success');
        } catch (error) {
            console.error("Error saving help content:", error);
            ui.showNotification('Lỗi khi lưu nội dung.', 'error');
        }
    },

    async getTemplateDownloadURL() {
        if (!appState.storage) {
            throw new Error("Firebase Storage chưa được khởi tạo.");
        }
        const filePath = 'templates/danh_sach_nhan_vien_mau.xlsx';
        const storageRef = ref(appState.storage, filePath);
        try {
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error("Lỗi khi lấy URL tải file mẫu: ", error);
            throw error;
        }
    },

    async getBookmarkDownloadURL() {
        if (!appState.storage) {
            throw new Error("Firebase Storage chưa được khởi tạo.");
        }
        // === START: THAY ĐỔI ĐƯỜNG DẪN ===
        const filePath = 'templates/Share_QLST.zip';
        // === END: THAY ĐỔI ĐƯỜNG DẪN ===
        const storageRef = ref(appState.storage, filePath);

        try {
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error("Lỗi khi lấy URL tải file bookmark: ", error);
            throw error;
        }
    }
};

export { firebase };
