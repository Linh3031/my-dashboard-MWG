// js/state.js
const appState = {
    danhSachNhanVien: [],
    ycxData: [],
    rawGioCongData: [], // Lưu dữ liệu thô để xử lý đặc biệt
    thuongNongData: [],
    thuongERPData: [],
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
    kpiCardColors: {
        luyke: {},
        realtime: {}
    },
    debugInfo: {},
    employeeMaNVMap: new Map(),
    employeeNameToMaNVMap: new Map(),
    choices: {
        luyke_employee: null, luyke_date_picker: null, luyke_highlight_nhanhang: null, luyke_highlight_nhomhang: null, luyke_highlight_employee: null,
        sknv_employee: null, sknv_date_picker: null, sknv_highlight_nhanhang: null, sknv_highlight_nhomhang: null, sknv_highlight_employee: null,
        realtime_employee: null, realtime_highlight_nhanhang: null, realtime_highlight_nhomhang: null, realtime_highlight_employee: null,
    },
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
        realtime_ict: { key: 'dtICT', direction: 'desc' },
        realtime_phukien: { key: 'dtPhuKien', direction: 'desc' },
        realtime_giadung: { key: 'dtGiaDung', direction: 'desc' },
        realtime_ce: { key: 'dtCE', direction: 'desc' },
        realtime_baohiem: { key: 'dtBaoHiem', direction: 'desc' },
        realtime_qdc: { key: 'dtqd', direction: 'desc' },
    }
};

export default appState;