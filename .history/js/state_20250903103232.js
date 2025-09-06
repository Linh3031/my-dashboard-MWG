// js/state.js
// File này hoạt động như một kho lưu trữ trung tâm cho tất cả dữ liệu động của ứng dụng.

const appState = {
    // Dữ liệu thô sau khi được chuẩn hóa từ các file input
    danhSachNhanVien: [],
    ycxData: [],
    rawGioCongData: [], 
    thuongNongData: [],
    thuongERPData: [],
    realtimeYCXData: [],
    
    // Dữ liệu đã được tính toán và tổng hợp thành các báo cáo
    masterReportData: {
        luyke: [], 
        sknv: [],
        realtime: [] 
    },
    competitionData: [],

    // Cài đặt và tuỳ chỉnh của người dùng được lưu lại
    luykeGoalSettings: {},
    realtimeGoalSettings: {}, 
    
    // Thông tin dùng cho việc gỡ lỗi
    debugInfo: {},

    // Các cấu trúc dữ liệu để tra cứu nhanh, tăng tốc độ xử lý
    employeeMaNVMap: new Map(),
    employeeNameToMaNVMap: new Map(),
    
    // Đối tượng quản lý các thư viện bên ngoài (VD: Choices.js, Flatpickr)
    choices: {
        luyke_employee: null, 
        luyke_date_picker: null,
        sknv_employee: null, 
        sknv_date_picker: null,
        realtime_employee: null,
    },

    // Trạng thái sắp xếp hiện tại của các bảng dữ liệu
    sortState: {
        sknv_summary: { key: 'totalAbove', direction: 'desc' },
        doanhthu_lk: { key: 'doanhThu', direction: 'desc' },
        thunhap: { key: 'tongThuNhap', direction: 'desc' },
        hieu_qua: { key: 'dtICT', direction: 'desc' },
        competition_doanhthu: { key: 'hoanThanh', direction: 'desc' },
        competition_soluong: { key: 'hoanThanh', direction: 'desc' },
    }
};

export default appState;

