// Version 1.1 - Add functions for Global Competition Configs (Firestore)
// MODULE: ADMIN SERVICE
// Chịu trách nhiệm xử lý logic đọc/ghi dữ liệu của Admin (Khai báo, Hướng dẫn).
import { getFirestore, collection, doc, setDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { appState } from '../state.js';
import { ui } from '../ui.js';

export const adminService = {
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

    // === START REFACTOR 2 (Bước 2b) ===
    async loadGlobalCompetitionConfigs() {
        if (!appState.db) {
            console.warn("loadGlobalCompetitionConfigs called before DB initialization.");
            return [];
        }
        console.log("Loading Global Competition Configs from Firestore...");
        try {
            const docRef = doc(appState.db, "declarations", "globalCompetitionConfigs");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                console.log("Successfully loaded Global Competition Configs.");
                return docSnap.data().configs || [];
            } else {
                console.log("No Global Competition Configs found in Firestore, returning empty array.");
                return [];
            }
        } catch (error) {
            console.error("Lỗi khi tải Cấu hình Thi Đua Chung từ Firestore:", error);
            return [];
        }
    },

    async saveGlobalCompetitionConfigs(configs) {
        if (!appState.db || !appState.isAdmin) {
            console.warn("Save Global Competition Configs skipped: Not admin or DB not initialized.");
            ui.showNotification('Lỗi: Bạn không có quyền lưu cấu hình chung.', 'error');
            return;
        }
        console.log("Saving Global Competition Configs to Firestore...");
        try {
            const docRef = doc(appState.db, "declarations", "globalCompetitionConfigs");
            await setDoc(docRef, { configs: configs });
            console.log("Successfully saved Global Competition Configs.");
            ui.showNotification('Đã lưu Cấu hình Thi Đua Chung lên cloud!', 'success');
        } catch (error) {
            console.error("Lỗi khi lưu Cấu hình Thi Đua Chung:", error);
            ui.showNotification('Lỗi khi lưu cấu hình thi đua chung lên cloud.', 'error');
        }
    },
    // === END REFACTOR 2 (Bước 2b) ===

    // ========== START: HÀM MỚI CHO SẢN PHẨM ĐẶC QUYỀN ==========
    /**
     * Tải danh sách Sản Phẩm Đặc Quyền (SPĐQ) từ Firestore.
     * @returns {Promise<Array<Object>>} Mảng các đối tượng SPĐQ.
     */
    async loadSpecialProductList() {
        if (!appState.db) {
            console.warn("loadSpecialProductList called before DB initialization.");
            return [];
        }
        console.log("Loading Special Product List from Firestore...");
        try {
            const docRef = doc(appState.db, "declarations", "specialProductList");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const products = docSnap.data().products || [];
                console.log(`Successfully loaded ${products.length} special products.`);
                return products;
            } else {
                console.log("No Special Product List found in Firestore, returning empty array.");
                return [];
            }
        } catch (error) {
            console.error("Lỗi khi tải Danh sách SP Đặc Quyền từ Firestore:", error);
            return [];
        }
    },

    /**
     * Lưu danh sách Sản Phẩm Đặc Quyền (SPĐQ) lên Firestore.
     * @param {Array<Object>} products - Mảng các đối tượng SPĐQ.
     */
    async saveSpecialProductList(products) {
        if (!appState.db || !appState.isAdmin) {
            console.warn("saveSpecialProductList skipped: Not admin or DB not initialized.");
            ui.showNotification('Lỗi: Bạn không có quyền lưu danh sách SPĐQ.', 'error');
            return;
        }
        console.log(`Saving ${products.length} special products to Firestore...`);
        try {
            const docRef = doc(appState.db, "declarations", "specialProductList");
            await setDoc(docRef, { products: products });
            console.log("Successfully saved Special Product List.");
            ui.showNotification('Đã lưu Danh sách SP Đặc Quyền lên cloud!', 'success');
        } catch (error) {
            console.error("Lỗi khi lưu Danh sách SP Đặc Quyền:", error);
            ui.showNotification('Lỗi khi lưu danh sách SPĐQ lên cloud.', 'error');
        }
    },

    /**
     * Tải Cấu hình Chương trình SP Đặc Quyền từ Firestore.
     * @returns {Promise<Array<Object>>} Mảng các đối tượng cấu hình.
     */
    async loadGlobalSpecialPrograms() {
        if (!appState.db) {
            console.warn("loadGlobalSpecialPrograms called before DB initialization.");
            return [];
        }
        console.log("Loading Global Special Programs from Firestore...");
        try {
            const docRef = doc(appState.db, "declarations", "globalSpecialPrograms");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const programs = docSnap.data().programs || [];
                console.log(`Successfully loaded ${programs.length} global special programs.`);
                return programs;
            } else {
                console.log("No Global Special Programs found in Firestore, returning empty array.");
                return [];
            }
        } catch (error) {
            console.error("Lỗi khi tải Cấu hình Chương trình SPĐQ từ Firestore:", error);
            return [];
        }
    },

    /**
     * Lưu Cấu hình Chương trình SP Đặc Quyền lên Firestore.
     * @param {Array<Object>} programs - Mảng các đối tượng cấu hình.
     */
    async saveGlobalSpecialPrograms(programs) {
        if (!appState.db || !appState.isAdmin) {
            console.warn("saveGlobalSpecialPrograms skipped: Not admin or DB not initialized.");
            ui.showNotification('Lỗi: Bạn không có quyền lưu cấu hình SPĐQ.', 'error');
            return;
        }
        console.log("Saving Global Special Programs to Firestore...");
        try {
            const docRef = doc(appState.db, "declarations", "globalSpecialPrograms");
            await setDoc(docRef, { programs: programs });
            console.log("Successfully saved Global Special Programs.");
            ui.showNotification('Đã lưu Cấu hình Chương trình SPĐQ lên cloud!', 'success');
        } catch (error) {
            console.error("Lỗi khi lưu Cấu hình Chương trình SPĐQ:", error);
            ui.showNotification('Lỗi khi lưu cấu hình SPĐQ lên cloud.', 'error');
        }
    }
    // ========== END: HÀM MỚI CHO SẢN PHẨM ĐẶC QUYỀN ==========
};