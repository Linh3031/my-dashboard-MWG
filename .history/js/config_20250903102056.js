// js/config.js
// File này chứa tất cả các cấu hình cố định của ứng dụng.
// Việc tách riêng các cấu hình giúp dễ dàng bảo trì và thay đổi sau này.

const config = {
    // Mật khẩu để truy cập vào tab "Khai báo"
    ADMIN_PASSWORD: "Linh3031",

    // Ánh xạ tên cột trong file Excel với các thuộc tính trong code.
    // 'aliases' cho phép các tên cột khác nhau trong Excel đều được nhận dạng.
    COLUMN_MAPPINGS: {
        danhsachnv: {
            maKho: { required: true, displayName: 'Mã Kho', aliases: ['mã kho', 'makho', 'kho'] },
            maNV: { required: true, displayName: 'Mã Nhân Viên', aliases: ['mã nv', 'msnv', 'mã nhân viên', 'manv', 'mã số nhân viên'] },
            hoTen: { required: true, displayName: 'Họ và Tên', aliases: ['họ và tên', 'tên nhân viên', 'tên nv', 'họ tên'] },
            boPhan: { required: true, displayName: 'Bộ phận', aliases: ['bộ phận'] }
        },
        ycx: { // Dùng chung cho cả YCX lũy kế và YCX realtime
            ngayTao: { required: true, displayName: 'Ngày tạo', aliases: ['ngày tạo'] },
            ngayHenGiao: { required: false, displayName: 'Ngày hẹn giao', aliases: ['ngày hẹn giao'] },
            nguoiTao: { required: true, displayName: 'Người tạo', aliases: ['người tạo'] },
            thanhTien: { required: true, displayName: 'Giá bán', aliases: ['giá bán_1', 'giá bán'] },
            soLuong: { required: true, displayName: 'Số lượng', aliases: ['sl bán', 'số lượng'] },
            nhomHang: { required: true, displayName: 'Nhóm hàng', aliases: ['nhóm hàng'] },
            tenSanPham: { required: true, displayName: 'Tên sản phẩm', aliases: ['tên sản phẩm'] },
            nganhHang: { required: true, displayName: 'Ngành hàng', aliases: ['ngành hàng'] },
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
    },

    // Các nhóm sản phẩm dùng để tính toán các chỉ số
    PRODUCT_GROUPS: {
        ICT: ['1491', '931', '42'],
        CE: ['1097', '1098', '1099', '1094', '894'],
        PHU_KIEN: '16',
        GIA_DUNG: ['484', '1214'],
        MAY_LOC_NUOC: ['4171', '4172'],
        SMARTPHONE: ['1491', '18', '13'],
        BAO_HIEM_DENOMINATOR: ['1491', '1097', '894', '1099', '1098', '42', '1094', '3859', '911', '893', '3659'],
        SIM: ['1891', '664'],
        VAS: ['164', '571'],
        BAO_HIEM_VAS: ['4479', '4499'],
    },

    // Các bộ phận được hiển thị trong báo cáo Sức khỏe nhân viên
    DEPARTMENT_GROUPS: [
        'BP Tư Vấn - ĐM',
        'BP Trang Trí kiêm Thu ngân - Sim Số - ĐM',
        'BP Kho Kiêm Hỗ Trợ Kỹ Thuật Xe Đạp - ĐM'
    ],

    // Dữ liệu mặc định khi người dùng chưa khai báo
    DEFAULT_DATA: {
        HINH_THUC_XUAT_TINH_DOANH_THU: [
            'Xuất bán hàng tại siêu thị', 'Xuất cung ứng dịch vụ',
            'Xuất bán pre-order tại siêu thị', 'Xuất SIM trắng kèm theo SIM',
            'Xuất bán ưu đãi cho nhân viên', 'Xuất bán hàng tại siêu thị (TCĐM)',
            'Xuất dịch vụ bảo hành trọn đời', 'Xuất dịch vụ bảo dưỡng trọn đời',
            'Xuất bán hàng trả góp tại siêu thị', 'Xuất bán trả góp ưu đãi cho nhân viên',
            'Xuất bán trả góp cho NV phục vụ công việc', 'Xuất bán pre-order trả góp tại siêu thị',
            'Xuất bán pre-order trả góp tại siêu thị (TCĐM)',
            'Xuất dịch vụ thu hộ bảo hiểm'
        ],
        HINH_THUC_XUAT_TRA_GOP: ['Xuất bán hàng trả góp tại siêu thị', 'Xuất bán trả góp ưu đãi cho nhân viên', 'Xuất bán trả góp cho NV phục vụ công việc', 'Xuất bán pre-order trả góp tại siêu thị', 'Xuất bán pre-order trả góp tại siêu thị (TCĐM)'],
        HE_SO_QUY_DOI: { '12 - Pin sạc dự phòng': 3.37, '16 - Thẻ Nhớ': 3.37 }
    }
};

export default config;
