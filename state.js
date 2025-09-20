// Version 2.0 - Bug Fixes & Stability Improvements
// MODULE 2: TỦ TRẠNG THÁI (APPSTATE)
// File này chứa đối tượng trạng thái chung của ứng dụng, hoạt động như một "bộ nhớ".

const appState = {
    // --- Collaboration & Dynamic Content ---
    db: null, 
    isAdmin: false, 
    feedbackList: [], 
    helpContent: { 
        data: 'Đang tải hướng dẫn...',
        luyke: 'Đang tải hướng dẫn...',
        sknv: 'Đang tải hướng dẫn...',
        realtime: 'Đang tải hướng dẫn...'
    },
    composerTemplates: { 
        luyke: '',
        sknv: '',
        realtime: ''
    },

    // --- Dữ liệu & Trạng thái ---
    danhSachNhanVien: [],
    
    // Dữ liệu cập nhật hàng ngày
    ycxData: [],
    rawGioCongData: [],
    thuongNongData: [],
    thuongERPData: [],
    thiDuaNhanVienData: [], // Dữ liệu thi đua nhân viên

    thiDuaReportData: [],

    // Dữ liệu cập nhật tháng trước
    ycxDataThangTruoc: [], 
    thuongNongDataThangTruoc: [],
    thuongERPDataThangTruoc: [],

    masterReportData: {
        luyke: [], 
        sknv: [],
        realtime: [] 
    },
    competitionData: [],
    realtimeYCXData: [],
    luykeGoalSettings: {},
    realtimeGoalSettings: {}, 
    highlightSettings: {
        luyke: {},
        sknv: {},
        realtime: {}
    },
    debugInfo: {},
    employeeMaNVMap: new Map(),
    employeeNameToMaNVMap: new Map(),
    charts: {},
    choices: {
        luyke_employee: null, luyke_date_picker: null, luyke_highlight_nhanhang: null, luyke_highlight_nhomhang: null, luyke_highlight_employee: null,
        sknv_employee: null, sknv_date_picker: null, sknv_highlight_nhanhang: null, sknv_highlight_nhomhang: null, sknv_highlight_employee: null,
        realtime_employee: null, realtime_highlight_nhanhang: null, realtime_highlight_nhomhang: null, realtime_highlight_employee: null,
    },
    sortState: {
        luyke_chuaxuat: { key: 'doanhThuQuyDoi', direction: 'desc' },
        sknv_summary: { key: 'totalAbove', direction: 'desc' },
        doanhthu_lk: { key: 'doanhThu', direction: 'desc' },
        thunhap: { key: 'tongThuNhap', direction: 'desc' },
        hieu_qua: { key: 'dtICT', direction: 'desc' },
        sknv_ict: { key: 'dtICT', direction: 'desc' },
        sknv_phukien: { key: 'dtPhuKien', direction: 'desc' },
        sknv_giadung: { key: 'dtGiaDung', direction: 'desc' },
        sknv_ce: { key: 'dtCE', direction: 'desc' },
        sknv_baohiem: { key: 'dtBaoHiem', direction: 'desc' },
        sknv_nganhhang_chitiet: { key: 'revenue', direction: 'desc' },
        sknv_qdc: { key: 'dtqd', direction: 'desc' },
        sknv_thidua_summary: { key: 'completedCount', direction: 'desc'},
        sknv_thidua_category: { key: 'percentExpected', direction: 'desc'},
        sknv_thidua_employee: { key: 'percentExpected', direction: 'desc'},
        luyke_competition_doanhthu: { key: 'hoanThanh', direction: 'desc' },
        luyke_competition_soluong: { key: 'hoanThanh', direction: 'desc' },
        luyke_nganhhang: { key: 'revenue', direction: 'desc' },
        luyke_qdc: { key: 'dtqd', direction: 'desc' },
        realtime_nganhhang: { key: 'revenue', direction: 'desc' },
        realtime_dt_nhanvien: { key: 'doanhThu', direction: 'desc' },
        realtime_hieuqua_nhanvien: { key: 'dtICT', direction: 'desc' },
        realtime_ict: { key: 'dtICT', direction: 'desc' },
        realtime_phukien: { key: 'dtPhuKien', direction: 'desc' },
        realtime_giadung: { key: 'dtGiaDung', direction: 'desc' },
        realtime_ce: { key: 'dtCE', direction: 'desc' },
        realtime_baohiem: { key: 'dtBaoHiem', direction: 'desc' },
        realtime_qdc: { key: 'dtqd', direction: 'desc' },
        realtime_brand: { key: 'revenue', direction: 'desc' },
        realtime_brand_employee: { key: 'revenue', direction: 'desc' }
    }
};

// Xuất khẩu appState để các module khác có thể sử dụng
export { appState };

