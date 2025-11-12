// Kịch bản Node.js chuyên dụng để tạo snapshot toàn diện cho dự án
// Phiên bản 1.4 - Thêm hỗ trợ file .svelte
// Phiên bản 1.3 - Cập nhật sang cú pháp ES Module (import) để tương thích với Vite

import fs from 'fs';
import path from 'path';

// --- CẤU HÌNH ---
const config = {
    // Thư mục gốc để bắt đầu quét
    rootDirectory: '.', 
    // Tên file output
    outputFile: 'project_snapshot.txt',
    // Các đuôi file cần lấy nội dung
    includeExtensions: [
        '.js', 
        '.html', 
        '.css', 
        '.txt', 
        '.json', 
        '.svg', 
        '.md', 
        '.svelte' // <-- ĐÃ THÊM ĐUÔI FILE MỚI
    ],
    // Các thư mục cần bỏ qua
    excludeDirectories: ['node_modules', '.git', '.history', 'dist'], // Thêm 'dist' (thư mục build của Vite)
    
    // Các file cụ thể cần bỏ qua (sử dụng đường dẫn tương đối)
    excludeFiles: [
        'project_snapshot.txt',   // Loại bỏ chính file snapshot
        'create_snapshot.js',     // Loại bỏ file script này
        'changelog.json',         // Loại bỏ file lịch sử
        'cors-config.json',       // Loại bỏ file cấu hình CORS
        'version.json',           // Loại bỏ file phiên bản
        '.vscode/settings.json'   // Loại bỏ file cài đặt VSCode
    ]
};

// --- LOGIC CHÍNH ---

// Hàm đệ quy để duyệt qua các thư mục
function walkDirectory(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);

        // Chuẩn hóa đường dẫn để so sánh (vd: 'folder/file.js')
        const normalizedPath = path.normalize(filepath).replace(/\\/g, '/');

        // Bỏ qua nếu file nằm trong danh sách loại trừ file
        if (config.excludeFiles.includes(normalizedPath)) {
            return; 
        }

        // Nếu là thư mục và không nằm trong danh sách loại trừ -> tiếp tục duyệt
        if (stat.isDirectory() && !config.excludeDirectories.includes(file)) {
            filelist = walkDirectory(filepath, filelist);
        } 
        // Nếu là file và có đuôi file nằm trong danh sách cho phép -> thêm vào danh sách
        else if (stat.isFile() && config.includeExtensions.includes(path.extname(file))) {
            filelist.push(filepath);
        }
    });
    return filelist;
}

// Hàm chính để chạy kịch bản
function createSnapshot() {
    console.log('Bắt đầu quá trình tạo snapshot (phiên bản ESM)...');
    
    const allFiles = walkDirectory(config.rootDirectory);

    if (fs.existsSync(config.outputFile)) {
        fs.unlinkSync(config.outputFile);
    }

    allFiles.forEach(filepath => {
        try {
            const content = fs.readFileSync(filepath, 'utf8');
            // Chuẩn hóa đường dẫn để luôn dùng dấu gạch chéo '/'
            const normalizedPath = path.normalize(filepath).replace(/\\/g, '/');
            const fileHeader = `--- START FILE: ./${normalizedPath} ---\n`;
            const fileFooter = `\n--- END FILE: ./${normalizedPath} ---\n\n`;
            
            fs.appendFileSync(config.outputFile, fileHeader);
            fs.appendFileSync(config.outputFile, content);
            fs.appendFileSync(config.outputFile, fileFooter);
        } catch (err) {
            console.error(`Lỗi khi đọc file ${filepath}:`, err);
        }
    });

    console.log(`\x1b[32m%s\x1b[0m`, `✅ Đã tạo thành công file '${config.outputFile}' với ${allFiles.length} file.`);
}

// Chạy hàm chính
createSnapshot();