// js/state.js
// File này hoạt động như một kho lưu trữ trung tâm cho tất cả dữ liệu động của ứng dụng.

const appState = {
    // Dữ liệu thô sau khi được chuẩn hóa
    danhSachNhanVien: [],
    ycxData: [],
    rawGioCongData: [], 
    thuongNongData: [],
    thuongERPData: [],
    realtimeYCXData: [],
    
    // Dữ liệu đã được tính toán và tổng hợp
    masterReportData: {
        luyke: [], 
        sknv: [],
        realtime: [] 
    },
    competitionData: [],

    // Cài đặt và tuỳ chỉnh của người dùng
    luykeGoalSettings: {},
    realtimeGoalSettings: {}, 
    highlightSettings: {
        luyke: {},
        sknv: {},
        realtime: {}
    },
    kpiCardColors: {
        luyke: {},
        realtime: {}
    },

    // Thông tin gỡ lỗi
    debugInfo: {},

    // Các cấu trúc dữ liệu để tra cứu nhanh
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

    // Trạng thái sắp xếp cho các bảng
    sortState: {
        sknv_summary: { key: 'totalAbove', direction: 'desc' },
        doanhthu_lk: { key: 'doanhThu', direction: 'desc' },
        thunhap: { key: 'tongThuNhap', direction: 'desc' },
        hieu_qua: { key: 'dtICT', direction: 'desc' },
        sknv_ict: { key: 'dtICT', direction: 'desc' },
        sknv_phukien: { key: 'dtPhuKien', direction: 'desc' },
        sknv_giadung: { key: 'dtGiaDung', direction: 'desc' },
        sknv_ce: { key: 'dtCE', direction: 'desc' },
        sknv_baohiem: { key: 'dtBaoHiem', direction: 'desc' },
        competition_doanhthu: { key: 'hoanThanh', direction: 'desc' },
        competition_soluong: { key: 'hoanThanh', direction: 'desc' },
        luyke_nganhhang: { key: 'revenue', direction: 'desc' },
        luyke_qdc: { key: 'dtqd', direction: 'desc' },
        realtime_nganhhang: { key: 'revenue', direction: 'desc' },
        realtime_dt_nhanvien: { key: 'doanhThu', direction: 'desc' },
        realtime_hieuqua_nhanvien: { key: 'dtICT', direction: 'desc' },
        realtime_qdc: { key: 'dtqd', direction: 'desc' },
    }
};

export default appState;
