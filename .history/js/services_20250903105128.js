// js/services.js
import config from './config.js';
import appState from './state.js';

const services = {
    // Lấy các khai báo từ localStorage, nếu không có thì dùng giá trị mặc định từ config
    getHinhThucXuatTinhDoanhThu: () => {
        const savedData = localStorage.getItem('declaration_ycx');
        if (savedData) return new Set(savedData.split('\n').map(l => l.trim()).filter(Boolean));
        return new Set(config.DEFAULT_DATA.HINH_THUC_XUAT_TINH_DOANH_THU);
    },
    getHinhThucXuatTraGop: () => {
        const savedData = localStorage.getItem('declaration_ycx_gop');
        if (savedData) return new Set(savedData.split('\n').map(l => l.trim()).filter(Boolean));
        return new Set(config.DEFAULT_DATA.HINH_THUC_XUAT_TRA_GOP);
    },
    getHeSoQuyDoi: () => {
        const savedData = localStorage.getItem('declaration_heso');
        const heSoMap = {};
        if (savedData) {
            savedData.split('\n').filter(l => l.trim()).forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parseFloat(parts[1].trim());
                    if (key && !isNaN(value)) heSoMap[key] = value;
                }
            });
            return Object.keys(heSoMap).length > 0 ? heSoMap : config.DEFAULT_DATA.HE_SO_QUY_DOI;
        }
        return config.DEFAULT_DATA.HE_SO_QUY_DOI;
    },

    // Tìm tên cột chính xác trong file Excel dựa trên các tên có thể có (aliases)
    findColumnName(header, aliases) {
        for (const colName of header) {
            const processedColName = String(colName || '').trim().toLowerCase();
            if (aliases.includes(processedColName)) {
                return colName;
            }
        }
        return null;
    },

    // Chuẩn hóa dữ liệu thô từ file Excel
    normalizeData(rawData, fileType) {
        const mapping = config.COLUMN_MAPPINGS[fileType];
        if (!mapping) {
            const message = `Không tìm thấy cấu hình cho loại file: ${fileType}`;
            console.error(message);
            return { normalizedData: [], success: false, message };
        }

        if (!rawData || rawData.length === 0) {
            return { normalizedData: [], success: true, message: '' };
        }

        const header = Object.keys(rawData[0] || {});
        const foundMapping = {};
        let allRequiredFound = true;

        appState.debugInfo[fileType] = { required: [], found: header, firstFiveMsnv: [] };

        for (const key in mapping) {
            const { required, displayName, aliases } = mapping[key];
            const foundName = this.findColumnName(header, aliases);
            foundMapping[key] = foundName;

            if (required) {
                appState.debugInfo[fileType].required.push({ displayName, foundName: foundName || 'Không tìm thấy', status: !!foundName });
                if (!foundName) {
                    allRequiredFound = false;
                }
            }
        }
        
        if (!allRequiredFound) {
            const dataName = document.querySelector(`#file-${fileType}`)?.dataset.name || fileType;
            return { normalizedData: [], success: false, message: `File "${dataName}" thiếu cột bắt buộc. Vui lòng kiểm tra công cụ gỡ lỗi.` };
        }

        const normalizedData = rawData.map(row => {
            const newRow = {};
            for (const key in foundMapping) {
                if (foundMapping[key]) {
                    if (key === 'maNV' || key === 'hoTen') {
                        newRow[key] = String(row[foundMapping[key]] || '').trim();
                    } else if ((key === 'ngayTao' || key === 'ngayHenGiao') && row[foundMapping[key]]) {
                        const dateValue = row[foundMapping[key]];
                        if (dateValue instanceof Date) {
                            newRow[key] = dateValue;
                        } else if (typeof dateValue === 'number') { 
                            newRow[key] = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
                        } else if (typeof dateValue === 'string') {
                            const parsedDate = new Date(dateValue.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
                            if (!isNaN(parsedDate)) newRow[key] = parsedDate;
                        }
                    } else {
                        newRow[key] = row[foundMapping[key]];
                    }
                }
            }
            return newRow;
        });
        
        if (fileType === 'giocong') {
             appState.rawGioCongData = JSON.parse(JSON.stringify(rawData));
        }

        appState.debugInfo[fileType].firstFiveMsnv = normalizedData.slice(0, 5).map(r => r.maNV).filter(Boolean);
        
        return { normalizedData, success: true, message: '' };
    },

    // Xử lý dữ liệu thưởng ERP được dán vào
    processThuongERP: (pastedText) => {
        const lines = pastedText.trim().split('\n');
        const results = [];
        const regex = /(ĐML_|TGD|ĐMM|ĐMS).*?(BP .*?)(?:Nhân Viên|Trưởng Ca)(.*?)([\d,]+)$/;
        lines.forEach(line => {
            const match = line.replace(/\s+/g, ' ').match(regex);
            if (match) results.push({ name: match[3].trim(), bonus: match[4].trim() });
        });
        return results;
    },

    // Xử lý dữ liệu lũy kế được dán vào
    parseLuyKePastedData: (text) => {
        const mainKpis = {};
        if (!text) return { mainKpis };
    
        const lines = text.split('\n').map(line => line.trim());
        const textContent = lines.join(' ');
    
        const patterns = {
            'Thực hiện DT thực': /DTLK\s+([\d,.]+)/,
            'Dự kiến DT thực': /DT Dự Kiến\s+([\d,.]+)/,
            'Thực hiện DTQĐ': /DTQĐ\s+([\d,.]+)/,
            'Dự kiến DTQĐ': /DT Dự Kiến \(QĐ\)\s+([\d,.]+)/,
            'Doanh thu trả chậm': /DT Siêu thị\s+([\d,.]+)/,
            '% Trả chậm': /Tỷ Trọng Trả Góp\s+([\d.]+%?)/,
        };
    
        for (const [key, regex] of Object.entries(patterns)) {
            const match = textContent.match(regex);
            if (match && match[1]) {
                mainKpis[key] = match[1];
            }
        }
    
        return { mainKpis };
    },
    
    // Xử lý dữ liệu thi đua từ ô dán lũy kế
    parseCompetitionDataFromLuyKe: (text) => {
        if(!text) return [];
        const lines = text.split('\n').map(l => l.trim());
        const results = [];
        const competitionTitleIndexes = [];

        lines.forEach((line, index) => {
            if (line.toLowerCase().startsWith('thi đua')) {
                competitionTitleIndexes.push({ name: line, startIndex: index });
            }
        });

        const extractNumber = (str) => {
            if (!str) return 0;
            const match = str.match(/([\d,.-]+)/);
            return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
        };

        competitionTitleIndexes.forEach((comp, index) => {
            const endIndex = (index + 1 < competitionTitleIndexes.length) ? competitionTitleIndexes[index + 1].startIndex : lines.length;
            const block = lines.slice(comp.startIndex, endIndex);

            const displayName = comp.name.replace("Thi đua doanh thu", "DT").replace("Thi đua số lượng", "SL");

            const result = {
                name: displayName,
                type: comp.name.toLowerCase().includes('doanh thu') ? 'doanhThu' : 'soLuong',
                luyKe: 0, target: 0, hoanThanh: '0%'
            };

            const findValueAfterKeyword = (keyword) => {
                const keywordIndex = block.findIndex(line => line.trim() === keyword);
                return (keywordIndex !== -1 && keywordIndex + 1 < block.length) ? block[keywordIndex + 1] : null;
            };

            let luyKeValue = result.type === 'doanhThu' ? (findValueAfterKeyword('DTLK') || findValueAfterKeyword('DTQĐ')) : findValueAfterKeyword('SLLK');
            let hoanThanhValue = findValueAfterKeyword('% HT Dự Kiến (QĐ)');

            result.luyKe = extractNumber(luyKeValue);
            result.target = extractNumber(findValueAfterKeyword('Target'));
            
            if (hoanThanhValue) {
                const match = hoanThanhValue.match(/([\d.]+%?)/);
                if (match) result.hoanThanh = match[1];
            }

            results.push(result);
        });

        appState.competitionData = results;
        return results;
    },

    // Phân loại bảo hiểm dựa trên tên sản phẩm
    classifyInsurance: (productName) => {
        if (!productName || typeof productName !== 'string') return null;
        const name = productName.trim().toLowerCase();
        if (name.includes('bảo hành mở rộng')) return 'BHMR';
        if (name.includes('1 đổi 1')) return 'BH1d1';
        if (name.includes('rơi vỡ')) return 'BHRV';
        if (name.includes('xe máy')) return 'BHXM';
        return null;
    },
    
    // Tạo báo cáo tổng hợp cho tất cả nhân viên
    generateMasterReportData: (sourceData, goalSettings, isRealtime = false) => {
        if (appState.danhSachNhanVien.length === 0) return [];

        const hinhThucXuatTinhDoanhThu = services.getHinhThucXuatTinhDoanhThu();
        const hinhThucXuatTraGop = services.getHinhThucXuatTraGop();
        const heSoQuyDoi = services.getHeSoQuyDoi();
        const PG = config.PRODUCT_GROUPS;
        
        const gioCongMap = new Map();
        appState.rawGioCongData.forEach(row => {
            const msnv = String(row['Mã NV (MSNV)'] || '').trim();
            const gioCong = parseFloat(String(row['Tổng giờ công (X.Nhận) Total'] || '0').replace(/,/g, ''));
            if (msnv && !isNaN(gioCong)) {
                gioCongMap.set(msnv, (gioCongMap.get(msnv) || 0) + gioCong);
            }
        });
        
        const thuongNongMap = new Map();
        appState.thuongNongData.forEach(row => {
            const msnv = String(row.maNV || '').trim();
            const diem = parseFloat(String(row.diemThuong || '0').replace(/,/g, ''));
            if (msnv && !isNaN(diem)) {
                thuongNongMap.set(msnv, (thuongNongMap.get(msnv) || 0) + diem);
            }
        });

        const thuongERPMap = new Map();
        appState.thuongERPData.forEach(item => {
             const employee = appState.danhSachNhanVien.find(nv => item.name.includes(nv.hoTen));
             if (employee) {
                 const bonus = parseFloat(item.bonus.replace(/,/g, ''));
                 if (!isNaN(bonus)) {
                     thuongERPMap.set(employee.maNV, (thuongERPMap.get(employee.maNV) || 0) + bonus);
                 }
             }
        });
        
        return appState.danhSachNhanVien.map((employee) => {
            const data = {
                doanhThu: 0, doanhThuQuyDoi: 0, doanhThuTraGop: 0, doanhThuChuaXuat: 0,
                dtICT: 0, dtCE: 0, dtPhuKien: 0, dtGiaDung: 0, dtMLN: 0,
                dtBaoHiem: 0, slBaoHiem: 0,
                slPhuKien: 0, slGiaDung: 0, slCE: 0, slPinSDP: 0, slCamera: 0,
                slTaiNgheBLT: 0, slNoiChien: 0, slMLN: 0, slRobotHB: 0,
                slBH1d1: 0, slBHXM: 0, slBHRV: 0, slBHMR: 0, 
                slTivi: 0, slTuLanh: 0, slMayGiat: 0, slMayLanh: 0,
                slDienThoai: 0, slLaptop: 0,
                doanhThuTheoNganhHang: {}, slSimOnline: 0, slUDDD: 0, slBaoHiemVAS: 0, 
                slSmartphone: 0, slBaoHiemDenominator: 0,
            };

            sourceData.forEach(row => {
                const msnvMatch = String(row.nguoiTao || '').match(/^(\d+)/);
                if (msnvMatch && msnvMatch[1].trim() === employee.maNV) {
                    const isDoanhThuHTX = hinhThucXuatTinhDoanhThu.has(row.hinhThucXuat);
                    const isBaseValid = (row.trangThaiThuTien || "").trim() === 'Đã thu' && (row.trangThaiHuy || "").trim() === 'Chưa hủy' && (row.tinhTrangTra || "").trim() === 'Chưa trả';
                    
                    if (isBaseValid && isDoanhThuHTX) {
                        const thanhTien = parseFloat(String(row.thanhTien || "0").replace(/,/g, '')) || 0;
                        
                        if ((row.trangThaiXuat || "").trim() === 'Chưa xuất') {
                            data.doanhThuChuaXuat += thanhTien;
                        }

                        if ((row.trangThaiXuat || "").trim() === 'Đã xuất') {
                            const soLuong = parseInt(String(row.soLuong || "0"), 10) || 0;
                            const heSo = heSoQuyDoi[row.nhomHang] || 1;
                            const nhomHangCode = String(row.nhomHang || '').match(/^\d+/)?.[0] || null;
                            const nganhHangCode = String(row.nganhHang || '').match(/^\d+/)?.[0] || null;

                            if (row.hinhThucXuat !== 'Xuất dịch vụ thu hộ bảo hiểm') { 
                                data.doanhThu += thanhTien; 
                                data.doanhThuQuyDoi += thanhTien * heSo; 
                            }
                            if (hinhThucXuatTraGop.has(row.hinhThucXuat)) { data.doanhThuTraGop += thanhTien; }

                            if (PG.ICT.includes(nhomHangCode)) data.dtICT += thanhTien;
                            if (PG.CE.includes(nhomHangCode)) { data.dtCE += thanhTien; data.slCE += soLuong; }
                            if (nhomHangCode === PG.PHU_KIEN) { data.dtPhuKien += thanhTien; data.slPhuKien += soLuong; }
                            
                            const isMLN = PG.MAY_LOC_NUOC.includes(nhomHangCode);
                            const isGiaDung = PG.GIA_DUNG.includes(nganhHangCode);

                            if (isMLN) { data.dtMLN += thanhTien; data.slMLN += soLuong; }
                            if (isGiaDung) { data.dtGiaDung += thanhTien; data.slGiaDung += soLuong; }

                            if (PG.DIEN_THOAI.includes(nhomHangCode)) data.slDienThoai += soLuong;
                            if (PG.LAPTOP.includes(nhomHangCode)) data.slLaptop += soLuong;
                            if (PG.TIVI.includes(nhomHangCode)) data.slTivi += soLuong;
                            if (PG.TU_LANH.includes(nhomHangCode)) data.slTuLanh += soLuong;
                            if (PG.MAY_GIAT.includes(nhomHangCode)) data.slMayGiat += soLuong;
                            if (PG.MAY_LANH.includes(nhomHangCode)) data.slMayLanh += soLuong;

                            const loaiBaoHiem = this.classifyInsurance(row.tenSanPham);
                            if (loaiBaoHiem) { 
                                data.dtBaoHiem += thanhTien; data.slBaoHiem += soLuong; 
                                if (loaiBaoHiem === 'BH1d1') data.slBH1d1 += soLuong;
                                if (loaiBaoHiem === 'BHXM') data.slBHXM += soLuong;
                                if (loaiBaoHiem === 'BHRV') data.slBHRV += soLuong;
                                if (loaiBaoHiem === 'BHMR') data.slBHMR += soLuong;
                            }
                            if (nhomHangCode === PG.PIN_SDP) data.slPinSDP += soLuong;
                            if (nhomHangCode === PG.CAMERA_TRONG_NHA || nhomHangCode === PG.CAMERA_NGOAI_TROI) data.slCamera += soLuong;
                            if (nhomHangCode === PG.TAI_NGHE_BLT) data.slTaiNgheBLT += soLuong;
                            if (nhomHangCode === PG.NOI_CHIEN) data.slNoiChien += soLuong;
                            if (nhomHangCode === PG.ROBOT_HB) data.slRobotHB += soLuong;
                            
                            if (PG.SIM.includes(nhomHangCode)) data.slSimOnline += soLuong;
                            if (PG.VAS.includes(nhomHangCode)) data.slUDDD += soLuong;
                            if (PG.SMARTPHONE.includes(nhomHangCode)) data.slSmartphone += soLuong;
                            if (PG.BAO_HIEM_VAS.includes(nhomHangCode)) data.slBaoHiemVAS += soLuong;
                            if (PG.BAO_HIEM_DENOMINATOR.includes(nhomHangCode)) data.slBaoHiemDenominator += soLuong;
                        }
                    }
                }
            });

            const gioCong = gioCongMap.get(employee.maNV) || 0;
            const thuongNong = thuongNongMap.get(employee.maNV) || 0;
            const thuongERP = thuongERPMap.get(employee.maNV) || 0;
            const tongThuNhap = thuongNong + thuongERP;
            const today = new Date();
            const currentDay = today.getDate();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const thuNhapDuKien = currentDay > 1 ? (tongThuNhap / (currentDay - 1)) * daysInMonth : tongThuNhap * daysInMonth;

            const hieuQuaQuyDoi = data.doanhThu > 0 ? (data.doanhThuQuyDoi / data.doanhThu) - 1 : 0;
            const tyLeTraCham = data.doanhThu > 0 ? data.doanhThuTraGop / data.doanhThu : 0;
            const pctPhuKien = data.dtICT > 0 ? data.dtPhuKien / data.dtICT : 0;
            const pctGiaDung = data.dtCE > 0 ? data.dtGiaDung / data.dtCE : 0;
            const pctMLN = data.dtCE > 0 ? data.dtMLN / data.dtCE : 0;
            const pctSim = data.slSmartphone > 0 ? data.slSimOnline / data.slSmartphone : 0;
            const pctVAS = data.slSmartphone > 0 ? data.slUDDD / data.slSmartphone : 0;
            const pctBaoHiem = data.slBaoHiemDenominator > 0 ? data.slBaoHiemVAS / data.slBaoHiemDenominator : 0;

            return { 
                ...employee, ...data, 
                gioCong, thuongNong, thuongERP, tongThuNhap, thuNhapDuKien, 
                hieuQuaQuyDoi, tyLeTraCham, pctPhuKien, pctGiaDung, pctMLN, 
                pctSim, pctVAS, pctBaoHiem, 
                mucTieu: goalSettings 
            };
        });
    },

    // Tính các chỉ số trung bình của một bộ phận
    calculateDepartmentAverages(departmentName, reportData) {
        const departmentEmployees = reportData.filter(e => e.boPhan === departmentName);
        if (departmentEmployees.length === 0) return {};

        const totals = departmentEmployees.reduce((acc, curr) => {
            Object.keys(curr).forEach(key => {
                if (typeof curr[key] === 'number') acc[key] = (acc[key] || 0) + curr[key];
            });
            return acc;
        }, {});

        const averages = {};
        for (const key in totals) {
            averages[key] = totals[key] / departmentEmployees.length;
        }
        return averages;
    },
};

export default services;
