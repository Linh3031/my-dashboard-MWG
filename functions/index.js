// Version 1.1 - Increase memory and timeout for the function
// MODULE: FIREBASE FUNCTIONS
// Chứa logic chạy trên máy chủ để xử lý các file Excel được tải lên.

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const path = require("path");
const os = require("os");
const fs = require("fs");
const XLSX = require("xlsx");

// Khởi tạo Firebase Admin SDK
admin.initializeApp();

// --- BẮT ĐẦU: Logic được port từ client-side (config.js & services.js) ---
const COLUMN_MAPPINGS = {
    danhsachnv: {
        maKho: { required: true, displayName: 'Mã Kho', aliases: ['mã kho', 'makho', 'kho'] },
        maNV: { required: true, displayName: 'Mã Nhân Viên', aliases: ['mã nv', 'msnv', 'mã nhân viên', 'manv', 'mã số nhân viên'] },
        hoTen: { required: true, displayName: 'Họ và Tên', aliases: ['họ và tên', 'tên nhân viên', 'tên nv', 'họ tên'] },
        boPhan: { required: true, displayName: 'Bộ phận', aliases: ['bộ phận'] }
    },
    ycx: {
        ngayTao: { required: true, displayName: 'Ngày tạo', aliases: ['ngày tạo'] },
        nguoiTao: { required: true, displayName: 'Người tạo', aliases: ['người tạo'] },
        thanhTien: { required: true, displayName: 'Giá bán', aliases: ['giá bán_1', 'giá bán'] },
        soLuong: { required: true, displayName: 'Số lượng', aliases: ['sl bán', 'số lượng'] },
        nhomHang: { required: true, displayName: 'Nhóm hàng', aliases: ['nhóm hàng'] },
        hinhThucXuat: { required: true, displayName: 'Hình thức xuất', aliases: ['hình thức xuất'] },
        trangThaiThuTien: { required: true, displayName: 'Trạng thái thu tiền', aliases: ['trạng thái thu tiền'] },
        trangThaiHuy: { required: true, displayName: 'Trạng thái hủy', aliases: ['trạng thái hủy'] },
        tinhTrangTra: { required: true, displayName: 'Tình trạng trả', aliases: ['tình trạng nhập trả của sản phẩm đổi với sản phẩm chính', 'tình trạng trả'] },
        trangThaiXuat: { required: true, displayName: 'Trạng thái xuất', aliases: ['trạng thái xuất'] }
    },
    giocong: {
        maNV: { required: false, displayName: 'Mã NV', aliases: ['mã nv', 'msnv'] },
        hoTen: { required: false, displayName: 'Tên NV', aliases: ['tên nv', 'tennv'] },
        tongGioCong: { required: true, displayName: 'Tổng giờ công', aliases: ['tổng giờ công (x.nhận) total', 'tổng giờ công'] }
    },
    thuongnong: {
        maNV: { required: false, displayName: 'Mã NV', aliases: ['manv', 'mã nv'] },
        hoTen: { required: false, displayName: 'Tên NV', aliases: ['tennv', 'tên nv'] },
        diemThuong: { required: true, displayName: 'Điểm thưởng', aliases: ['diemthuong', 'điểm thưởng'] }
    }
};

function findColumnName(header, aliases) {
    for (const colName of header) {
        const processedColName = String(colName || '').trim().toLowerCase();
        if (aliases.includes(processedColName)) {
            return colName;
        }
    }
    return null;
}

function normalizeData(rawData, fileType) {
    const mapping = COLUMN_MAPPINGS[fileType];
    if (!mapping) {
        return { success: false, missingColumns: ['Unknown mapping'] };
    }
    if (!rawData || rawData.length === 0) {
        return { normalizedData: [], success: true };
    }

    const header = Object.keys(rawData[0] || {});
    const foundMapping = {};
    let allRequiredFound = true;
    const missingColumns = [];

    for (const key in mapping) {
        const { required, displayName, aliases } = mapping[key];
        const foundName = findColumnName(header, aliases);
        foundMapping[key] = foundName;
        if (required && !foundName) {
            allRequiredFound = false;
            missingColumns.push(displayName);
        }
    }

    if (!allRequiredFound) {
        return { success: false, missingColumns };
    }

    const normalizedData = rawData.map(row => {
        const newRow = {};
        for (const key in foundMapping) {
            if (foundMapping[key]) {
                newRow[key] = row[foundMapping[key]];
            }
        }
        return newRow;
    });

    return { normalizedData, success: true };
}
// --- KẾT THÚC: Logic được port từ client-side ---


// === THAY ĐỔI: Cấu hình tài nguyên cho Function ===
// Yêu cầu Firebase cấp phát 1GB RAM và cho phép chạy tối đa 300 giây.
const runtimeOpts = {
  timeoutSeconds: 300,
  memory: '1GB'
};

/**
 * Cloud Function được kích hoạt khi có file mới được tải lên Firebase Storage.
 * Chức năng: Tự động xử lý file Excel và lưu kết quả đã chuẩn hóa vào Firestore.
 */
exports.processUploadedFile = functions
    .region('asia-southeast1') // Đặt máy chủ tại Singapore
    .runWith(runtimeOpts)       // Áp dụng cấu hình tài nguyên mới
    .storage.object().onFinalize(async (object) => {
    
    const filePath = object.name;
    const contentType = object.contentType;

    if (!filePath.startsWith('uploads/') || !contentType.includes('spreadsheet')) {
        functions.logger.log('File không hợp lệ hoặc không nằm trong thư mục uploads. Bỏ qua.');
        return null;
    }

    const bucket = admin.storage().bucket(object.bucket);
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const fileId = path.basename(filePath, path.extname(filePath));
    const fileType = fileId.split('-')[0];

    try {
        await bucket.file(filePath).download({ destination: tempFilePath });
        functions.logger.log('File đã được tải xuống:', tempFilePath);

        const workbook = XLSX.readFile(tempFilePath);
        const sheetName = workbook.SheetNames[0];
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const { normalizedData, success, missingColumns } = normalizeData(rawData, fileType);

        const db = admin.firestore();
        const resultRef = db.collection('file_results').doc(fileId);

        if (success) {
            functions.logger.log(`Xử lý thành công file ${fileId} với ${normalizedData.length} dòng.`);
            await resultRef.set({
                status: 'success',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                data: normalizedData,
            });
        } else {
            functions.logger.error(`Lỗi xử lý file ${fileId}: Thiếu cột`, { missingColumns });
            await resultRef.set({
                status: 'error',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                message: `Lỗi file: Thiếu cột: ${missingColumns.join(', ')}.`,
            });
        }
    } catch (error) {
        functions.logger.error('Lỗi nghiêm trọng trong quá trình xử lý file:', error);
        const db = admin.firestore();
        const resultRef = db.collection('file_results').doc(fileId);
        await resultRef.set({
            status: 'error',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            message: error.message,
        });
    } finally {
        fs.unlinkSync(tempFilePath);
    }
    return null;
});