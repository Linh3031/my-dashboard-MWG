// Version 1.0 - Initial service extraction
// MODULE: STORAGE SERVICE
// Chịu trách nhiệm xử lý logic giao tiếp với Firebase Storage (Upload/Download).
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { appState } from '../state.js';
import { ui } from '../ui.js';

export const storageService = {
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
                    console.error(`%c[StorageService.uploadFileToStorage] LỖI KHI UPLOAD file ${storagePath}:`, "color: red; font-weight: bold;", error);
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
                    console.log(`[StorageService.uploadFileToStorage] File ${storagePath} uploaded successfully.`);
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log('[StorageService.uploadFileToStorage] File available at', downloadURL);
                        resolve(downloadURL);
                    } catch (getUrlError) {
                        console.error(`%c[StorageService.uploadFileToStorage] LỖI KHI LẤY DOWNLOAD URL cho ${storagePath}:`, "color: red; font-weight: bold;", getUrlError);
                        ui.showNotification(`Lỗi lấy link file sau khi upload (${getUrlError.code || 'UNKNOWN'}).`, 'error');
                        reject(getUrlError);
                    }
                }
            );
        });
    },
};