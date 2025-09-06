// Version 5.0
// MODULE 1: TỦ CẤU HÌNH (CONFIG)
// File này chứa tất cả các cấu hình tĩnh của ứng dụng.

const config = {
    ADMIN_PASSWORD: "Linh3031",
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
    PRODUCT_GROUPS: {
        ICT: ['1491', '931', '42'],
        CE: ['1097', '1098', '1099', '1094', '894'],
        PHU_KIEN: '16',
        GIA_DUNG: ['484', '1214'], // Mã ngành hàng Gia Dụng
        MAY_LOC_NUOC: ['4171', '4172'], // Mã nhóm hàng Máy Lọc Nước
        PIN_SDP: '12',
        CAMERA_TRONG_NHA: '6479',
        CAMERA_NGOAI_TROI: '4219',
        TAI_NGHE_BLT: '4540',
        NOI_CHIEN: '4099',
        ROBOT_HB: '4439',
        TIVI: '1094',
        TU_LANH: '1097',
        MAY_GIAT: '1099',
        MAY_LANH: '1098',
        DIEN_THOAI: ['13', '1491', '18'],
        LAPTOP: '42',
        SIM: ['1891', '664'],
        VAS: ['164', '571'],
        BAO_HIEM_VAS: ['4479', '4499'],
        SMARTPHONE: ['1491', '18', '13'],
        BAO_HIEM_DENOMINATOR: ['1491', '1097', '894', '1099', '1098', '42', '1094', '3859', '911', '893', '3659'],
        QDC_GROUPS: {
            PIN_SDP: { codes: ['12'], name: 'Pin SDP' },
            TAI_NGHE_BLT: { codes: ['3346', '4540'], name: 'Tai nghe BLT' },
            DONG_HO: { codes: ['4059', '4060', '4061', '4062', '4063', '4064', '4070'], name: 'Đồng hồ' },
            CAMERA: { codes: ['4219', '6479'], name: 'Camera' },
            LOA: { codes: ['1031', '1351', '4779'], name: 'Loa' },
            UDDD: { codes: ['571', '611'], name: 'UDDĐ' },
            BAO_HIEM: { codes: ['4479', '4499'], name: 'Bảo hiểm' },
            NOI_COM: { codes: ['4157', '4158'], name: 'Nồi cơm điện tử + cao tần' },
            NOI_CHIEN: { codes: ['4099'], name: 'Nồi chiên' },
            MAY_LOC_NUOC: { codes: ['4171', '4172'], name: 'Máy lọc nước' },
            ROBOT_HB: { codes: ['4439'], name: 'Robot hút bụi' },
            SIM_ONLINE: { codes: ['1891'], name: 'SIM' }
        }
    },
    DEPARTMENT_GROUPS: [
        'BP Tư Vấn - ĐM',
        'BP Trang Trí kiêm Thu ngân - Sim Số - ĐM',
        'BP Kho Kiêm Hỗ Trợ Kỹ Thuật Xe Đạp - ĐM'
    ],
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
        HE_SO_QUY_DOI: { '1098 - Máy lạnh (IMEI)': 1, '2011 - Khuyến mãi - SP Ảo': 1, '2511 - Nạp tiền AirTime M_Service': 1, '2151 - Phiếu mua hàng/Pre Order': 1, '971 - Thẻ cào điện tử': 1, '431 - Ốp Lưng - Flip Cover': 3.37, '2571 - Thu hộ cước Viettel': 1, '4519 - Thu Hộ Tiền Trả Góp': 1, '2513 - Thu hộ Payoo': 1, '4302 - Nón bảo hiểm các loại': 1.92, '2291 - Sim trắng (Seri)': 1, '18 - Điện Thoại Di Động': 1, '4599 - Thu Hộ Tiền Mặt': 1, '12 - Pin sạc dự phòng': 3.37, '571 - UDDĐ': 1, '58 - Miếng dán mặt sau': 3.37, '1231 - Miếng dán mặt trước': 3.37, '1491 - Smartphone': 1, '1891 - Sim Online': 5.45, '4479 - Dịch Vụ Bảo Hiểm': 4.18, '3359 - Phụ kiện đồng hồ': 3, '2391 - Smartwatch': 3, '911 - Máy nước nóng': 1, '4499 - Thu Hộ Phí Bảo Hiểm': 4.18, '4142 - Bình đun siêu tốc': 1.85, '4153 - Xay Sinh tố': 1.85, '15 - Tai nghe dây': 3.37, '1412 - Dịch vụ bảo trì': 1, '3345 - Cáp': 3.37, '2312 - Mã nạp thẻ game': 1, '4900 - Bàn phím': 3.37, '4141 - Bàn ủi khô': 1.85, '4156 - Nồi cơm nắp gài/nắp rời': 1.85, '14 - Sạc/ Adapter': 3.37, '42 - Laptop': 1.2, '751 - Khuyến mãi ba lô, túi xách': 1, '1031 - Loa di động': 3.37, '4199 - Miếng Dán Kính': 3.37, '3346 - Tai Nghe Bluetooth': 3.37, '931 - Máy tính bảng': 1.2, '19 - Khuyến mãi ĐTDĐ': 1, '10 - Chuột': 3.37, '4060 - Đồng hồ Nam Dây da': 3, '880 - Loa Karaoke': 1.29, '851 - Khuyến mãi Điện Tử': 1, '4169 - Lõi lọc': 1.85, '4540 - Tai Nghe Bluetooth - imei': 3.37, '4062 - Đồng hồ Nữ Dây kim loại': 3, '2831 - Phụ kiện Apple': 3.37, '2691 - Bộ Sạc/Cáp/Adaptor (Giá Rẻ)': 3.37, '1351 - Loa vi tính (imei)': 3.37, '1094 - Tivi LED (IMEI)': 1, '4324 - Khung treo, giá đỡ': 3.37, '1099 - Máy giặt (IMEI)': 1, '1097 - Tủ lạnh (IMEI)': 1, '4099 - Nồi chiên': 1.85, '4070 - Đồng hồ Trẻ em': 3, '967 - Sấy tóc': 1.85, '957 - Lò nướng': 1.85, '958 - Lò vi sóng': 1.85, '4158 - Nồi cơm điện tử': 1.85, '3241 - Dao/Kéo/Thớt': 1.92, '3240 - Hộp/Hũ': 1.92, '3265 - Nồi': 1.92, '4139 - Đèn bàn/Đèn Sạc/Đèn bắt muỗi': 1.85, '73 - Phụ kiện điện máy': 3.37, '4171 - Lọc nước dạng tủ đứng': 1.85, '3384 - Đồ nghề sử dụng điện': 1, '4147 - Bếp điện đơn': 1.85, '4063 - Đồng hồ Nữ Dây da': 3, '3263 - Chảo': 1.92, '3185 - Vệ sinh nhà cửa': 1.92, '4143 - Bàn ủi hơi nước đứng': 1.85, '4146 - Bếp gas đôi': 1.85, '1052 - Khuyến mãi Điện Lạnh': 1, '3799 - Quạt điều hòa': 1.85, '1951 - Software (số Lượng)': 1, '6000 - Máy ép trái cây': 1.85, '4059 - Đồng hồ Nam Dây kim loại': 3, '4160 - Quạt bàn/hộp/sạc': 1.85, '4162 - Bình/Ca đựng nước': 1.92, '4660 - Quạt lửng': 1.85, '17 - Phụ kiện IT khác': 3.37, '4145 - Bếp gas đơn': 1.85, '875 - Dàn máy': 1, '1071 - Phụ kiện điện tử': 3.37, '891 - Micro': 1, '4152 - Ổ cắm điện/vợt muỗi': 1.85, '4154 - Xay ép/Khác': 1.85, '5975 - Balo Túi Chống Sốc': 3.37, '893 - Tủ đông': 1, '2531 - Thu hộ Mservice': 1, '4019 - Sim trắng điện tử': 1, '4320 - Đồng hồ - Khuyến mãi mua': 1, '3187 - Bình/Ly/Ca giữ nhiệt': 1.92, '4159 - Quạt đứng': 1.85, '4157 - Nồi cơm cao tần': 1.85, '16 - Thẻ Nhớ': 3.37, '4140 - Bàn ủi hơi nước': 1.85, '4150 - Máy nước nóng lạnh': 1.85, '591 - Thay sim': 1, '2999 - Dụng cụ nhà bếp khác': 1.92, '4779 - Loa di động - imei': 3.37, '4440 - Gói Cước Và Dịch Vụ GTGT': 1, '4121 - Máy Bơm Nước': 1, '4161 - Quạt treo': 1.85, '4961 - Quần bó & legging nữ Thể Thao': 1, '4151 - Áp suất/lẩu/chiên/nướng': 1.85, '4144 - Bếp gas âm': 1.85, '871 - USB': 3.37, '6479 - Camera IP Trong nhà': 3.37, '4219 - Camera IP Ngoài trời': 3.37, '4659 - Phụ kiện tiện ích Apple': 3.37, '531 - Pin, 4095 - Cáp (Giá Rẻ)': 3.37, '2791 - Kinh doanh mùa vụ': 3.37, '2771 - Giá treo màn hình máy tính': 3.37, '80 - Khuyến mãi Khác': 1, '1131 - Máy in, Fax': 2, '4125 - Smartband': 3, '743 - Quạt sưởi': 1.85, '4659 - Phụ kiện Apple - Imei': 3.37, '4064 - Đồng hồ Nữ Dây khác': 3, '956 - Hút bụi': 1.85, '4172 - Lọc nước âm tủ/trên bàn': 1.85, '3779 - Bếp điện âm': 1.85, '4061 - Đồng hồ Nam Dây khác': 3, '4067 - Đồng hồ Unisex Dây khác': 3, '1411 - Dịch vụ lắp đặt': 1, '4149 - Bình thủy điện': 1.85, '4148 - Bếp điện đôi': 1.85, '955 - Hút mùi/ hút khói': 1.85, '4699 - Gia dụng không điện khác': 1.92, '4859 - Xe đạp đường phố cổ điển': 1, '4759 - Phụ Kiện Xe Đạp': 1, '2471 - Thu hộ cước VinaPhone': 1, '3719 - Quần dài nữ Thể Thao': 1, '1051 - Khuyến mãi Điện gia dụng': 1, '3721 - Quần ngắn & váy nữ Thể Thao': 1, '410 - Phụ kiện TT khác': 3.37, '4155 - Hút bụi cây': 1.85, '3563 - Máy tính nguyên bộ': 1, '894 - Tủ mát': 1, '3639 - Máy lọc không khí': 1.85, '611 - Ứng dụng PC & Laptop': 1, '4089 - Đồng hồ Unisex Dây kim loại': 3, '4439 - Hút Bụi Robot': 1.85, '3740 - Áo T-shirt nam Thể Thao': 1, '4339 - Ổn Áp': 1, '4459 - Quạt Trần': 1.85, '2351 - Router - Imei': 3.37, '3159 - DV Internet và Truyền hình thu tiền': 1, '3659 - Máy sấy lồng ngang': 1, '3519 - Áo Bra Thể Thao': 1, '3479 - Thiết bị mạng khác': 3.37, '3859 - Máy rửa chén': 1 }
        }
    };

// Dòng cuối cùng này rất quan trọng. Nó "xuất khẩu" đối tượng config 
// để các file JavaScript khác có thể "nhập khẩu" và sử dụng.
export { config };
