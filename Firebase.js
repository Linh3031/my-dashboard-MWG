// MODULE: FIREBASE
// Chịu trách nhiệm kết nối, thiết lập listener với Firebase.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, arrayUnion, serverTimestamp, query, orderBy, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Thêm import cho Firebase Storage
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
            const firebaseApp = initializeApp(firebaseConfig);
            appState.db = getFirestore(firebaseApp);
            // Khởi tạo Storage
            appState.storage = getStorage(firebaseApp); 
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
    },

    // --- HÀM MỚI ĐỂ TẢI FILE MẪU ---
    async getTemplateDownloadURL() {
        if (!appState.storage) {
            throw new Error("Firebase Storage chưa được khởi tạo.");
        }
        // Đường dẫn tới file mẫu trên Firebase Storage. Bạn cần tải file lên đúng đường dẫn này.
        const filePath = 'templates/danh_sach_nhan_vien_mau.xlsx';
        const storageRef = ref(appState.storage, filePath);
        
        // Ghi chú quan trọng: Để hàm này hoạt động, bạn cần cài đặt Security Rules cho Firebase Storage
        // để cho phép đọc công khai (public read) đối với đường dẫn 'templates/'. Ví dụ:
        // rules_version = '2';
        // service firebase.storage {
        //   match /b/{bucket}/o {
        //     match /templates/{allPaths=**} {
        //       allow read;
        //     }
        //   }
        // }
        
        try {
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error("Lỗi khi lấy URL tải file mẫu: ", error);
            throw error; // Ném lỗi ra để hàm gọi có thể bắt được
        }
    }
};

export { firebase };