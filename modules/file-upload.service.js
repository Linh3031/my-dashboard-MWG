// Version 1.0 - Initial Upload Service
// MODULE: FILE UPLOAD SERVICE
// Chứa logic để tải file lên Firebase Storage và lắng nghe kết quả xử lý từ Firestore.

import { appState } from '../state.js';
import { ui } from '../ui.js';
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const fileUploadService = {
    /**
     * Tải file lên Firebase Storage, sau đó lắng nghe kết quả xử lý từ Firestore.
     * @param {File} file - Đối tượng file người dùng đã chọn.
     * @param {string} fileType - Loại file (ví dụ: 'ycx', 'danhsachnv').
     * @returns {Promise<Object>} - Promise sẽ resolve với dữ liệu đã được xử lý hoặc reject với lỗi.
     */
    uploadAndProcessFile(file, fileType) {
        return new Promise((resolve, reject) => {
            if (!appState.storage || !appState.db) {
                return reject(new Error("Firebase chưa được khởi tạo."));
            }

            // 1. Tạo một ID độc nhất cho file để theo dõi
            const uniqueFileId = `${fileType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const fileName = `${uniqueFileId}${file.name.substring(file.name.lastIndexOf('.'))}`;
            const storagePath = `uploads/${fileName}`;
            const storageRef = ref(appState.storage, storagePath);

            // 2. Bắt đầu quá trình tải file lên Storage
            const uploadTask = uploadBytesResumable(storageRef, file);
            let unsubscribeSnapshot = null; // Biến để lưu hàm hủy listener

            // Tạo listener trong Firestore để chờ kết quả
            const resultDocRef = doc(appState.db, "file_results", uniqueFileId);
            unsubscribeSnapshot = onSnapshot(resultDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const result = docSnap.data();
                    // Hủy listener ngay khi nhận được kết quả để tránh rò rỉ bộ nhớ
                    if (unsubscribeSnapshot) unsubscribeSnapshot();
                    clearTimeout(timeout); // Hủy timeout

                    if (result.status === 'success') {
                        resolve(result.data); // Trả về dữ liệu đã xử lý
                    } else {
                        reject(new Error(result.message || 'Lỗi không xác định từ máy chủ.'));
                    }
                }
            });

            // Cập nhật giao diện với tiến trình tải lên
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    ui.updateFileStatus(fileType, file.name, `Đang tải lên... ${Math.round(progress)}%`);
                },
                (error) => { // Xử lý lỗi tải lên
                    if (unsubscribeSnapshot) unsubscribeSnapshot();
                    clearTimeout(timeout);
                    console.error("Lỗi khi tải file lên Storage:", error);
                    reject(new Error("Không thể tải file lên máy chủ."));
                },
                () => { // Tải lên thành công, chuyển sang chờ xử lý
                    ui.updateFileStatus(fileType, file.name, 'Tải lên hoàn tất, đang chờ máy chủ xử lý...');
                }
            );

            // 3. Đặt một khoảng thời gian chờ tối đa (ví dụ: 60 giây)
            const timeout = setTimeout(() => {
                if (unsubscribeSnapshot) unsubscribeSnapshot();
                reject(new Error("Máy chủ xử lý quá lâu, vui lòng thử lại."));
            }, 60000); // 60 giây
        });
    }
};