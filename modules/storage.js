// Version 1.1 - Add logging for debugging
// MODULE: STORAGE
// Quản lý tất cả các tương tác với IndexedDB để lưu trữ dữ liệu cục bộ.

export const storage = {
    db: null,
    dbName: 'AppStorageDB',
    storeName: 'fileStore',

    openDB() {
        console.log("[storage.js openDB] Opening IndexedDB..."); // Log mới
        return new Promise((resolve, reject) => {
            if (this.db) {
                console.log("[storage.js openDB] DB already open."); // Log mới
                return resolve(this.db);
            }
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (event) => {
                console.log("[storage.js openDB] onupgradeneeded triggered."); // Log mới
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    console.log(`[storage.js openDB] Creating object store: ${this.storeName}`); // Log mới
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
            request.onsuccess = (event) => {
                console.log("[storage.js openDB] Success!"); // Log mới
                this.db = event.target.result;
                resolve(this.db);
            };
            request.onerror = (event) => {
                console.error("[storage.js openDB] IndexedDB error:", event.target.errorCode, event.target.error); // Log chi tiết lỗi
                reject(event.target.error);
            };
        });
    },

    async setItem(id, value) {
        console.log(`[storage.js setItem] Attempting to save item with id: ${id}`); // Log mới
        try {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.put({ id, value });
                request.onsuccess = () => {
                    console.log(`[storage.js setItem] Successfully saved item with id: ${id}`); // Log mới
                    resolve();
                };
                request.onerror = (event) => {
                    console.error(`[storage.js setItem] Error saving item with id ${id}:`, event.target.error); // Log chi tiết lỗi
                    reject(event.target.error);
                };
                 transaction.onerror = (event) => { // Log lỗi transaction
                     console.error(`[storage.js setItem] Transaction error saving item with id ${id}:`, event.target.error);
                     reject(event.target.error);
                 };
            });
        } catch (error) {
            console.error(`[storage.js setItem] Error opening DB to save item ${id}:`, error); // Log lỗi mở DB
            throw error; // Re-throw để main.js có thể bắt
        }
    },

    async getItem(id) {
        console.log(`[storage.js getItem] Attempting to get item with id: ${id}`); // Log mới
        try {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(id);
                request.onsuccess = (event) => {
                    const result = event.target.result;
                    console.log(`[storage.js getItem] Successfully retrieved item for id ${id}. Found: ${!!result}`); // Log mới
                    resolve(result ? result.value : null);
                };
                request.onerror = (event) => {
                    console.error(`[storage.js getItem] Error getting item with id ${id}:`, event.target.error); // Log chi tiết lỗi
                    reject(event.target.error);
                };
                 transaction.onerror = (event) => { // Log lỗi transaction
                     console.error(`[storage.js getItem] Transaction error getting item with id ${id}:`, event.target.error);
                     reject(event.target.error);
                 };
            });
        } catch (error) {
             console.error(`[storage.js getItem] Error opening DB to get item ${id}:`, error); // Log lỗi mở DB
             throw error; // Re-throw
        }
    }
};