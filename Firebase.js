// Version 1.7 - Add function to get QR code URL from Storage
// MODULE: FIREBASE
// Chịu trách nhiệm kết nối, thiết lập listener với Firebase.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, arrayUnion, serverTimestamp, query, orderBy, setDoc, increment, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

    async saveCategoryDataToFirestore(data) {
        if (!appState.db || !appState.isAdmin) return;
        ui.showNotification('Đang đồng bộ dữ liệu khai báo lên cloud...', 'success');
        try {
            const categoryRef = doc(appState.db, "declarations", "categoryStructure");
            await setDoc(categoryRef, { data: data.categories || [] });

            const brandRef = doc(appState.db, "declarations", "brandList");
            await setDoc(brandRef, { data: data.brands || [] });

            ui.showNotification('Đồng bộ dữ liệu khai báo thành công!', 'success');
        } catch (error) {
            console.error("Lỗi khi lưu dữ liệu khai báo lên Firestore:", error);
            ui.showNotification('Lỗi khi đồng bộ dữ liệu lên cloud.', 'error');
        }
    },

    async loadCategoryDataFromFirestore() {
        if (!appState.db) return { categories: [], brands: [] };
        try {
            const declarationsCollection = collection(appState.db, "declarations");
            const querySnapshot = await getDocs(declarationsCollection);

            let categories = [];
            let brands = [];

            querySnapshot.forEach((doc) => {
                if (doc.id === "categoryStructure") {
                    categories = doc.data().data || [];
                } else if (doc.id === "brandList") {
                    brands = doc.data().data || [];
                }
            });

            console.log(`Loaded ${categories.length} categories and ${brands.length} brands from Firestore.`);
            return { categories, brands };
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu khai báo từ Firestore:", error);
            ui.showNotification('Không thể tải dữ liệu ngành hàng từ cloud.', 'error');
            return { categories: [], brands: [] };
        }
    },

    // --- START: CÁC HÀM MỚI ĐỂ QUẢN LÝ DỮ LIỆU KHAI BÁO TÍNH TOÁN ---
    async loadDeclarationsFromFirestore() {
        if (!appState.db) return {};
        console.log("Loading calculation declarations from Firestore...");
        try {
            const declarationIds = ['hinhThucXuat', 'hinhThucXuatGop', 'heSoQuyDoi'];
            const declarations = {};
            for (const id of declarationIds) {
                const docRef = doc(appState.db, "declarations", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // Dữ liệu được lưu dưới dạng một chuỗi dài, phân tách bằng \n
                    declarations[id] = docSnap.data().content || '';
                } else {
                    declarations[id] = '';
                }
            }
            console.log("Successfully loaded calculation declarations.");
            return declarations;
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu khai báo tính toán từ Firestore:", error);
            ui.showNotification('Lỗi: Không thể tải các khai báo tính toán từ cloud.', 'error');
            return {};
        }
    },

    async saveDeclarationsToFirestore(declarations) {
        if (!appState.db || !appState.isAdmin) return;
        ui.showNotification('Đang đồng bộ khai báo tính toán lên cloud...', 'success');
        try {
            await Promise.all([
                setDoc(doc(appState.db, "declarations", "hinhThucXuat"), { content: declarations.ycx }),
                setDoc(doc(appState.db, "declarations", "hinhThucXuatGop"), { content: declarations.ycxGop }),
                 setDoc(doc(appState.db, "declarations", "heSoQuyDoi"), { content: declarations.heSo })
            ]);
            ui.showNotification('Đồng bộ khai báo tính toán thành công!', 'success');
        } catch (error) {
            console.error("Lỗi khi lưu dữ liệu khai báo tính toán:", error);
            ui.showNotification('Lỗi khi đồng bộ khai báo tính toán.', 'error');
        }
    },
    // --- END: CÁC HÀM MỚI ---

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
        const filePath = 'templates/Share_QLST.zip';
        const storageRef = ref(appState.storage, filePath);

        try {
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error("Lỗi khi lấy URL tải file bookmark: ", error);
            throw error;
        }
    },

    // === START: HÀM MỚI ĐỂ LẤY URL MÃ QR ===
    async getQrCodeDownloadURL() {
        if (!appState.storage) {
            throw new Error("Firebase Storage chưa được khởi tạo.");
        }
        // --- LƯU Ý: File ảnh QR của bạn PHẢI được tải lên đúng đường dẫn này ---
        const filePath = 'qrcodes/main-qr.jpg'; 
        const storageRef = ref(appState.storage, filePath);
        try {
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error("Lỗi khi lấy URL của mã QR: ", error);
            // Xử lý lỗi cụ thể khi không tìm thấy file
            if (error.code === 'storage/object-not-found') {
                throw new Error(`Không tìm thấy file mã QR tại đường dẫn '${filePath}'. Vui lòng kiểm tra lại Firebase Storage.`);
            }
            throw new Error("Không thể tải được mã QR từ server.");
        }
    }
    // === END: HÀM MỚI ===
};

export { firebase };