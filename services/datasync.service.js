// Version 1.0 - Initial service extraction
// MODULE: DATA SYNC SERVICE
// Chịu trách nhiệm xử lý logic đồng bộ dữ liệu kho (Metadata và Pasted Content) lên Firestore.
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { appState } from '../state.js';
import { ui } from '../ui.js';

export const datasyncService = {
    async saveMetadataToFirestore(kho, dataType, metadata) {
        if (!appState.db || !kho || !dataType || !metadata) {
            console.error("[DataSyncService.saveMetadataToFirestore] Invalid input parameters.");
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
            console.log(`[DataSyncService.saveMetadataToFirestore] Attempting to save metadata for ${dataType} (v${metadata.version}, t${metadata.timestamp}) for kho ${kho}.`);
            await setDoc(khoRef, dataToSave, { merge: true });
            console.log(`[DataSyncService.saveMetadataToFirestore] Successfully saved metadata for ${dataType} (v${metadata.version}).`);
        } catch (error) {
            console.error(`%c[DataSyncService.saveMetadataToFirestore] LỖI KHI LƯU METADATA KHO ${kho} (${dataType}, v${metadata.version}):`, "color: red; font-weight: bold;", error);
            console.error("[DataSyncService.saveMetadataToFirestore] Error details:", error.code, error.message);
            let userMessage = `Lỗi nghiêm trọng khi lưu thông tin đồng bộ ${dataType}.`;
            ui.showNotification(userMessage, 'error');
            throw error;
        }
    },

    async savePastedDataToFirestore(kho, dataType, content, versionInfo) {
        if (!appState.db || !kho || !dataType || !content || !versionInfo) {
            console.error("[DataSyncService.savePastedDataToFirestore] Invalid input parameters.");
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
            console.log(`[DataSyncService.savePastedDataToFirestore] Attempting to save pasted data for ${dataType} (v${versionInfo.version}, t${versionInfo.timestamp}) for kho ${kho}.`);
            await setDoc(khoRef, dataToSave, { merge: true });
            console.log(`[DataSyncService.savePastedDataToFirestore] Successfully saved pasted data for ${dataType} (v${versionInfo.version}).`);
        } catch (error) {
            console.error(`%c[DataSyncService.savePastedDataToFirestore] LỖI KHI LƯU DỮ LIỆU DÁN KHO ${kho} (${dataType}, v${versionInfo.version}):`, "color: red; font-weight: bold;", error);
            let userMessage = `Lỗi nghiêm trọng khi lưu dữ liệu dán ${dataType}.`;
            ui.showNotification(userMessage, 'error');
            throw error;
        }
    },
};