// MODULE: FIREBASE
// Chịu trách nhiệm kết nối, thiết lập listener với Firebase.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, arrayUnion, serverTimestamp, query, orderBy, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { appState } from './state.js';
import { ui } from './ui.js';

const firebase = {
    async init() {
        const firebaseConfig = {
            // IMPORTANT: Replace with your actual Firebase config
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_STORAGE_BUCKET",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
        };

        try {
            const firebaseApp = initializeApp(firebaseConfig);
            appState.db = getFirestore(firebaseApp);
            console.log("Firebase connected successfully!");
            this.setupListeners();
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            ui.showNotification("Không thể kết nối tới cơ sở dữ liệu.", "error");
        }
    },

    setupListeners() {
        if (!appState.db) return;

        // Listener for feedback
        const feedbackQuery = query(collection(appState.db, "feedback"), orderBy("timestamp", "desc"));
        onSnapshot(feedbackQuery, (querySnapshot) => {
            appState.feedbackList = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                appState.feedbackList.push({ id: doc.id, ...data, timestamp: data.timestamp?.toDate() });
            });
            ui.renderFeedbackSection();
        });

        // Listener for help content
        const helpContentRef = collection(appState.db, "help_content");
        onSnapshot(helpContentRef, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                if (appState.helpContent.hasOwnProperty(doc.id)) {
                    appState.helpContent[doc.id] = doc.data().content;
                }
            });
            if (appState.isAdmin) {
                ui.renderAdminHelpEditors();
            }
        });
    },

    async submitFeedback(content) {
        if (!content || !appState.db) return;
        try {
            await addDoc(collection(appState.db, "feedback"), {
                user: "Người dùng ẩn danh",
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
        if (!docId || !content || !appState.db) return;
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
            await setDoc(doc(appState.db, "help_content", "data"), { content: contents.data });
            await setDoc(doc(appState.db, "help_content", "luyke"), { content: contents.luyke });
            await setDoc(doc(appState.db, "help_content", "sknv"), { content: contents.sknv });
            await setDoc(doc(appState.db, "help_content", "realtime"), { content: contents.realtime });
            ui.showNotification('Đã cập nhật nội dung hướng dẫn thành công!', 'success');
        } catch (error) {
            console.error("Error saving help content:", error);
            ui.showNotification('Lỗi khi lưu nội dung.', 'error');
        }
    }
};

export { firebase };
