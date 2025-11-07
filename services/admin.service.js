// Version 1.0 - Initial service extraction
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
    }
};