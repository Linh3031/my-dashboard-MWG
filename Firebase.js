// Version 3.3 - Add cloud functions for competitionNameMappings
// Version 3.2 - Modify incrementCounter to support user-specific actionsTaken
// Version 3.1 - Add savePastedDataToFirestore for text content sync
// Version 3.0 - Implement Cloud Storage upload & save metadata to Firestore
// Version 2.5 - Add detailed try...catch for setDoc in saveDataByWarehouse
// Version 2.4 - Fix syntax error in initCore()
// Version 2.3 - Add version and timestamp fields for data synchronization
// MODULE: FIREBASE
// Chịu trách nhiệm kết nối, thiết lập listener với Firebase.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, arrayUnion, serverTimestamp, query, orderBy, setDoc, increment, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
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

    // *** MODIFIED FUNCTION (v3.2) ***
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

        // ** Logic mới: Kiểm tra nếu là actionsTaken và có email **
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
    // *** END MODIFIED FUNCTION ***

    async submitFeedback(content) {
        if (!content || !appState.db || !appState.currentUser) {
             ui.showNotification("Không thể gửi góp ý: Người dùng chưa được xác thực.", "error");
            return;
        }
        try {
            await addDoc(collection(appState.db, "feedback"), {
                user: { email: appState.currentUser.email },
                content: content, timestamp: serverTimestamp(), replies: []
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
            await updateDoc(feedbackRef, { replies: arrayUnion({ content: content, timestamp: new Date() }) });
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
        if (!appState.db) {
             console.warn("loadCategoryDataFromFirestore called before DB initialization.");
             return { categories: [], brands: [] };
        }
        try {
            const declarationsCollection = collection(appState.db, "declarations");
            const querySnapshot = await getDocs(declarationsCollection);
            let categories = []; let brands = [];
            querySnapshot.forEach((doc) => {
                if (doc.id === "categoryStructure") categories = doc.data().data || [];
                else if (doc.id === "brandList") brands = doc.data().data || [];
            });
            console.log(`Loaded ${categories.length} categories and ${brands.length} brands from Firestore.`);
            return { categories, brands };
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu khai báo từ Firestore:", error);
            return { categories: [], brands: [] };
        }
    },

    async loadDeclarationsFromFirestore() {
        if (!appState.db) {
            console.warn("loadDeclarationsFromFirestore called before DB initialization.");
            return {};
        }
        console.log("Loading calculation declarations from Firestore...");
        try {
            const declarationIds = ['hinhThucXuat', 'hinhThucXuatGop', 'heSoQuyDoi'];
            const declarations = {};
            await Promise.all(declarationIds.map(async (id) => {
                const docRef = doc(appState.db, "declarations", id);
                const docSnap = await getDoc(docRef);
                declarations[id] = docSnap.exists() ? (docSnap.data().content || '') : '';
            }));
            console.log("Successfully loaded calculation declarations.");
            return declarations;
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu khai báo tính toán từ Firestore:", error);
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

    // *** START: NEW FUNCTIONS (v3.3) ***
    async loadCompetitionNameMappings() {
        if (!appState.db) {
            console.warn("loadCompetitionNameMappings called before DB initialization.");
            return {};
        }
        console.log("Loading competition name mappings from Firestore...");
        try {
            const docRef = doc(appState.db, "declarations", "competitionNameMappings");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                console.log("Successfully loaded competition name mappings.");
                return docSnap.data().mappings || {};
            } else {
                console.log("No competition name mappings found in Firestore, returning empty object.");
                return {};
            }
        } catch (error) {
            console.error("Lỗi khi tải Bảng Ánh Xạ Tên Thi Đua từ Firestore:", error);
            return {};
        }
    },

    async saveCompetitionNameMappings(mappings) {
        if (!appState.db || !appState.isAdmin) {
            console.warn("Save competition name mappings skipped: Not admin or DB not initialized.");
            return;
        }
        console.log("Saving competition name mappings to Firestore...");
        try {
            const docRef = doc(appState.db, "declarations", "competitionNameMappings");
            await setDoc(docRef, { mappings: mappings });
            console.log("Successfully saved competition name mappings.");
        } catch (error) {
            console.error("Lỗi khi lưu Bảng Ánh Xạ Tên Thi Đua:", error);
            ui.showNotification('Lỗi khi lưu tên rút gọn lên cloud.', 'error');
        }
    },
    // *** END: NEW FUNCTIONS (v3.3) ***

    async getTemplateDownloadURL() {
        if (!appState.storage) throw new Error("Firebase Storage chưa được khởi tạo.");
        const filePath = 'templates/danh_sach_nhan_vien_mau.xlsx';
        const storageRef = ref(appState.storage, filePath);
        try { return await getDownloadURL(storageRef); }
        catch (error) { console.error("Lỗi khi lấy URL tải file mẫu: ", error); throw error; }
    },

    async getBookmarkDownloadURL() {
        if (!appState.storage) throw new Error("Firebase Storage chưa được khởi tạo.");
        const filePath = 'templates/Share_QLST.zip';
        const storageRef = ref(appState.storage, filePath);
        try { return await getDownloadURL(storageRef); }
        catch (error) { console.error("Lỗi khi lấy URL tải file bookmark: ", error); throw error; }
    },

    async getQrCodeDownloadURL() {
        if (!appState.storage) throw new Error("Firebase Storage chưa được khởi tạo.");
        const filePath = 'qrcodes/main-qr.jpg';
        const storageRef = ref(appState.storage, filePath);
        try { return await getDownloadURL(storageRef); }
        catch (error) {
            console.error("Lỗi khi lấy URL của mã QR: ", error);
            if (error.code === 'storage/object-not-found') throw new Error(`Không tìm thấy file mã QR tại đường dẫn '${filePath}'. Vui lòng kiểm tra lại Firebase Storage.`);
            throw new Error("Không thể tải được mã QR từ server.");
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

    async uploadFileToStorage(file, storagePath, onProgress) {
        if (!appState.storage) {
            throw new Error("Firebase Storage is not initialized.");
        }
        if (!file || !storagePath) {
            throw new Error("File or storage path is missing for upload.");
        }

        const storageRef = ref(appState.storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload ${storagePath} is ${progress}% done`);
                    if (onProgress && typeof onProgress === 'function') {
                        onProgress(progress);
                    }
                },
                (error) => {
                    console.error(`%c[Firebase.uploadFileToStorage] LỖI KHI UPLOAD file ${storagePath}:`, "color: red; font-weight: bold;", error);
                    let userMessage = `Lỗi upload file lên cloud (${error.code || 'UNKNOWN'}).`;
                    switch (error.code) {
                        case 'storage/unauthorized':
                            userMessage = "Lỗi upload: Bạn không có quyền tải file lên.";
                            break;
                        case 'storage/canceled':
                            userMessage = "Lỗi upload: Quá trình tải file đã bị hủy.";
                            break;
                        case 'storage/unknown':
                            userMessage = "Lỗi upload: Đã xảy ra lỗi không xác định trên server.";
                            break;
                    }
                    ui.showNotification(userMessage, 'error');
                    reject(error);
                },
                async () => {
                    console.log(`[Firebase.uploadFileToStorage] File ${storagePath} uploaded successfully.`);
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log('[Firebase.uploadFileToStorage] File available at', downloadURL);
                        resolve(downloadURL);
                    } catch (getUrlError) {
                        console.error(`%c[Firebase.uploadFileToStorage] LỖI KHI LẤY DOWNLOAD URL cho ${storagePath}:`, "color: red; font-weight: bold;", getUrlError);
                        ui.showNotification(`Lỗi lấy link file sau khi upload (${getUrlError.code || 'UNKNOWN'}).`, 'error');
                        reject(getUrlError);
                    }
                }
            );
        });
    },

    async saveMetadataToFirestore(kho, dataType, metadata) {
        if (!appState.db || !kho || !dataType || !metadata) {
            console.error("[saveMetadataToFirestore] Invalid input parameters.");
            throw new Error("Invalid parameters for saving metadata.");
        }
        if (!appState.currentUser?.email) {
            throw new Error("Không thể lưu metadata khi chưa định danh email.");
        }

        const khoRef = doc(appState.db, "warehouseData", kho);
        const dataToSave = {
            [dataType]: {
                ...metadata,
                updatedAt: serverTimestamp(),
                updatedBy: appState.currentUser.email
            }
        };

        try {
            console.log(`[Firebase.saveMetadataToFirestore] Attempting to save metadata for ${dataType} (v${metadata.version}, t${metadata.timestamp}) for kho ${kho}.`);
            await setDoc(khoRef, dataToSave, { merge: true });
            console.log(`[Firebase.saveMetadataToFirestore] Successfully saved metadata for ${dataType} (v${metadata.version}).`);
        } catch (error) {
            console.error(`%c[Firebase.saveMetadataToFirestore] LỖI KHI LƯU METADATA KHO ${kho} (${dataType}, v${metadata.version}):`, "color: red; font-weight: bold;", error);
            console.error("[Firebase.saveMetadataToFirestore] Error details:", error.code, error.message);
            let userMessage = `Lỗi nghiêm trọng khi lưu thông tin đồng bộ ${dataType}.`;
            ui.showNotification(userMessage, 'error');
            throw error;
        }
    },

    async savePastedDataToFirestore(kho, dataType, content, versionInfo) {
        if (!appState.db || !kho || !dataType || !content || !versionInfo) {
            console.error("[savePastedDataToFirestore] Invalid input parameters.");
            throw new Error("Invalid parameters for saving pasted data.");
        }
        if (!appState.currentUser?.email) {
            throw new Error("Không thể lưu dữ liệu dán khi chưa định danh email.");
        }

        const khoRef = doc(appState.db, "warehouseData", kho);
        const metadata = {
            content: content,
            version: versionInfo.version,
            timestamp: versionInfo.timestamp,
            updatedAt: serverTimestamp(),
            updatedBy: appState.currentUser.email
        };
        const dataToSave = { [dataType]: metadata };

        try {
            console.log(`[Firebase.savePastedDataToFirestore] Attempting to save pasted data for ${dataType} (v${versionInfo.version}, t${versionInfo.timestamp}) for kho ${kho}.`);
            await setDoc(khoRef, dataToSave, { merge: true });
            console.log(`[Firebase.savePastedDataToFirestore] Successfully saved pasted data for ${dataType} (v${versionInfo.version}).`);
        } catch (error) {
            console.error(`%c[Firebase.savePastedDataToFirestore] LỖI KHI LƯU DỮ LIỆU DÁN KHO ${kho} (${dataType}, v${versionInfo.version}):`, "color: red; font-weight: bold;", error);
            let userMessage = `Lỗi nghiêm trọng khi lưu dữ liệu dán ${dataType}.`;
            ui.showNotification(userMessage, 'error');
            throw error;
        }
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
    },

    // *** MODIFIED FUNCTION (v3.2) ***
    /**
     * Lấy danh sách tất cả người dùng và thông tin của họ từ Firestore.
     * Bao gồm cả trường 'actionsTaken' mới.
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
    // *** END MODIFIED FUNCTION ***
};

export { firebase };