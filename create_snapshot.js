// Kịch bản Node.js chuyên dụng để tạo snapshot toàn diện cho dự án
// Phiên bản 1.1 - Mở rộng các loại file được hỗ trợ

const fs = require('fs');
const path = require('path');

// --- CẤU HÌNH ---
const config = {
    // Thư mục gốc để bắt đầu quét
    rootDirectory: '.', 
    // Tên file output
    outputFile: 'project_snapshot.txt',
    // ====> THAY ĐỔI QUAN TRỌNG <====
    // Các đuôi file cần lấy nội dung. Đã bổ sung .json, .svg, .md
    includeExtensions: ['.js', '.html', '.css', '.txt', '.json', '.svg', '.md'],
    // Các thư mục cần bỏ qua
    excludeDirectories: ['node_modules', '.git', '.history'] 
};

// --- LOGIC CHÍNH ---

// Hàm đệ quy để duyệt qua các thư mục
function walkDirectory(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);

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
    console.log('Bắt đầu quá trình tạo snapshot (phiên bản nâng cao)...');
    
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