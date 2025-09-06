// Version 6.0
// MODULE 3: KỆ "DỊCH VỤ" (SERVICES)
// File này chứa tất cả các hàm xử lý logic, tính toán, và chuyển đổi dữ liệu.

import { config } from './config.js';
import { appState } from './state.js';

const services = {
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

    findColumnName(header, aliases) {
        for (const colName of header) {
            const processedColName = String(colName || '').trim().toLowerCase();
            if (aliases.includes(processedColName)) {
                return colName;
            }
        }
        return null;
    },

    normalizeData(rawData, fileType) {
        const mapping = config.COLUMN_MAPPINGS[fileType];
        if (!mapping) {
            console.error(`No column mapping found for fileType: ${fileType}`);
            return { normalizedData: [], success: false, missingColumns: ['Unknown mapping'] };
        }

        if (!rawData || rawData.length === 0) {
            return { normalizedData: [], success: true, missingColumns: [] };
        }

        const header = Object.keys(rawData[0] || {});
        const foundMapping = {};
        let allRequiredFound = true;
        const missingColumns = [];

        appState.debugInfo[fileType] = { required: [], found: header, firstFiveMsnv: [] };

        for (const key in mapping) {
            const { required, displayName, aliases } = mapping[key];
            const foundName = services.findColumnName(header, aliases);
            foundMapping[key] = foundName;

            if (required) {
                const status = !!foundName;
                appState.debugInfo[fileType].required.push({ displayName, foundName: foundName || 'Không tìm thấy', status: status });
                if (!status) {
                    allRequiredFound = false;
                    missingColumns.push(displayName);
                }
            }
        }
        
        if (fileType === 'giocong' || fileType === 'thuongnong') {
            if (!foundMapping.maNV && !foundMapping.hoTen) {
                allRequiredFound = false;
                const missingMsg = 'Mã NV hoặc Tên NV';
                missingColumns.push(missingMsg);
                if (!appState.debugInfo[fileType].required.some(r => r.displayName.includes('NV'))) {
                     appState.debugInfo[fileType].required.push({ displayName: missingMsg, foundName: 'Không tìm thấy', status: false });
                }
            }
        }

        if (!allRequiredFound) {
            return { normalizedData: [], success: false, missingColumns };
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
                    }
                    else {
                        newRow[key] = row[foundMapping[key]];
                    }
                }
            }
            return newRow;
        });
        
        if (fileType === 'giocong') {
            appState.rawGioCongData = rawData.map(row => {
                const newRow = {};
                for (const key in foundMapping) {
                     if (foundMapping[key]) newRow[key] = row[foundMapping[key]];
                }
                return newRow;
            });
        }

        appState.debugInfo[fileType].firstFiveMsnv = normalizedData.slice(0, 5).map(r => r.maNV).filter(Boolean);
        
        return { normalizedData, success: true, missingColumns: [] };
    },

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

    parseLuyKePastedData: (text) => {
        const mainKpis = {};
        if (!text) return { mainKpis };
    
        const lines = text.split('\n').map(line => line.trim());
        const textContent = lines.join(' ');
    
        const patterns = {
            'Thực hiện DT thực': /DTLK\s+([\d,.]+)/,
            'Dự kiến DT thực': /DT Dự Kiến\s+([\d,.]+)/,
            '% HT Dự kiến DT thực': /% HT Target Dự Kiến\s+([\d.]+%?)/,
            'Thực hiện DTQĐ': /DTQĐ\s+([\d,.]+)/,
            'Dự kiến DTQĐ': /DT Dự Kiến \(QĐ\)\s+([\d,.]+)/,
            '% HT Dự kiến DTQĐ': /% HT Target Dự Kiến \(QĐ\)\s+([\d.]+%?)/,
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
                luyKe: 0, target: 0, duKien: 0, hoanThanh: '0%'
            };

            const findValueAfterKeyword = (keyword) => {
                const keywordIndex = block.findIndex(line => line.trim() === keyword);
                return (keywordIndex !== -1 && keywordIndex + 1 < block.length) ? block[keywordIndex + 1] : null;
            };

            let luyKeValue = result.type === 'doanhThu' ? (findValueAfterKeyword('DTLK') || findValueAfterKeyword('DTQĐ')) : findValueAfterKeyword('SLLK');
            let duKienValue = result.type === 'doanhThu' ? (findValueAfterKeyword('DT Dự Kiến') || findValueAfterKeyword('DT Dự Kiến (QĐ)')) : findValueAfterKeyword('SL Dự Kiến');
            
            result.luyKe = extractNumber(luyKeValue);
            result.target = extractNumber(findValueAfterKeyword('Target'));
            result.duKien = extractNumber(duKienValue);
            
            const hoanThanhValue = findValueAfterKeyword('% HT Dự Kiến (QĐ)');
            if (hoanThanhValue) {
                const match = hoanThanhValue.match(/([\d.]+%?)/);
                if (match) result.hoanThanh = match[1];
            }

            results.push(result);
        });

        appState.competitionData = results;
        return results;
    },

    classifyInsurance: (productName) => {
        if (!productName || typeof productName !== 'string') return null;
        const name = productName.trim().toLowerCase();
        if (name.includes('bảo hành mở rộng')) return 'BHMR';
        if (name.includes('1 đổi 1')) return 'BH1d1';
        if (name.includes('khoản vay')) return 'BHKV';
        if (name.includes('rơi vỡ')) return 'BHRV';
        if (name.includes('samsung care+')) return 'BHSC';
        if (name.includes('ô tô') || name.includes('vật chất ô tô')) return 'BHOTO';
        if (name.includes('xe máy') || name.includes('xe moto')) return 'BHXM';
        if (name.includes('xã hội') || name.includes('y tế')) return 'BHYT';
        return null;
    },
    
    processGioCongData: () => {
        const gioCongByMSNV = {};
        let currentMaNV = null;

        if (!appState.rawGioCongData || appState.rawGioCongData.length === 0) return gioCongByMSNV;

        for (const row of appState.rawGioCongData) {
            const maNV = String(row.maNV || '').trim();
            const hoTen = String(row.hoTen || '').trim();
            const gioCongValue = parseFloat(String(row.tongGioCong || '0').replace(/,/g, '')) || 0;

            if (maNV || hoTen) {
                let foundMaNV = maNV || appState.employeeNameToMaNVMap.get(hoTen.toLowerCase().replace(/\s+/g, ' ')) || null;
                if (foundMaNV) currentMaNV = foundMaNV;
            }

            if (currentMaNV && gioCongValue > 0) {
                gioCongByMSNV[currentMaNV] = (gioCongByMSNV[currentMaNV] || 0) + gioCongValue;
            }
        }
        return gioCongByMSNV;
    },

    generateMasterReportData: (sourceData, goalSettings, isRealtime = false) => {
        if (appState.danhSachNhanVien.length === 0) return [];

        const hinhThucXuatTinhDoanhThu = services.getHinhThucXuatTinhDoanhThu();
        const hinhThucXuatTraGop = services.getHinhThucXuatTraGop();
        const heSoQuyDoi = services.getHeSoQuyDoi();
        const PG = config.PRODUCT_GROUPS;
        const gioCongByMSNV = services.processGioCongData();
        const thuongNongByMSNV = {};

        appState.thuongNongData.forEach(row => {
            const maNV = String(row.maNV || '').trim();
            const hoTen = String(row.hoTen || '').trim().replace(/\s+/g, ' ');
            let foundMaNV = maNV || appState.employeeNameToMaNVMap.get(hoTen.toLowerCase()) || null;
            if (foundMaNV) {
                const diemThuongValue = parseFloat(String(row.diemThuong || '0').replace(/,/g, '')) || 0;
                thuongNongByMSNV[foundMaNV] = (thuongNongByMSNV[foundMaNV] || 0) + diemThuongValue;
            }
        });
        
        return appState.danhSachNhanVien.map((employee) => {
            let data = {
                doanhThu: 0, doanhThuQuyDoi: 0, doanhThuTraGop: 0, doanhThuTraGopQuyDoi: 0, 
                doanhThuChuaXuat: 0, doanhThuQuyDoiChuaXuat: 0,
                doanhThuGiaoXa: 0, doanhThuQuyDoiGiaoXa: 0,
                dtICT: 0, dtCE: 0, dtPhuKien: 0, dtGiaDung: 0, dtMLN: 0,
                slICT: 0, dtBaoHiem: 0, slBaoHiem: 0,
                slPhuKien: 0, slGiaDung: 0, slCE: 0, slPinSDP: 0, slCamera: 0,
                slTaiNgheBLT: 0, slNoiChien: 0, slMLN: 0, slRobotHB: 0,
                slBH1d1: 0, slBHXM: 0, slBHRV: 0, slBHMR: 0, 
                dtTivi: 0, slTivi: 0, dtTuLanh: 0, slTuLanh: 0,
                dtMayGiat: 0, slMayGiat: 0, dtMayLanh: 0, slMayLanh: 0,
                dtDienThoai: 0, slDienThoai: 0, dtLaptop: 0, slLaptop: 0,
                doanhThuTheoNganhHang: {}, slSimOnline: 0, slUDDD: 0, slBaoHiemVAS: 0, slSmartphone: 0, slBaoHiemDenominator: 0,
                qdc: {}
            };

            for (const key in PG.QDC_GROUPS) data.qdc[key] = { sl: 0, dt: 0, dtqd: 0, name: PG.QDC_GROUPS[key].name };

            sourceData.forEach(row => {
                const msnvMatch = String(row.nguoiTao || '').match(/^(\d+)/);
                if (msnvMatch && msnvMatch[1].trim() === employee.maNV) {
                    const isDoanhThuHTX = hinhThucXuatTinhDoanhThu.has(row.hinhThucXuat);
                    const isBaseValid = (row.trangThaiThuTien || "").trim() === 'Đã thu' && (row.trangThaiHuy || "").trim() === 'Chưa hủy' && (row.tinhTrangTra || "").trim() === 'Chưa trả';
                    if (isBaseValid && isDoanhThuHTX) {
                        const thanhTien = parseFloat(String(row.thanhTien || "0").replace(/,/g, '')) || 0;
                        const heSo = heSoQuyDoi[row.nhomHang] || 1;

                        if ((row.trangThaiXuat || "").trim() === 'Chưa xuất') {
                            data.doanhThuChuaXuat += thanhTien;
                            data.doanhThuQuyDoiChuaXuat += thanhTien * heSo;
                        }

                        if ((row.trangThaiXuat || "").trim() === 'Đã xuất') {
                            const soLuong = parseInt(String(row.soLuong || "0"), 10) || 0;
                            const nhomHangCode = String(row.nhomHang || '').match(/^\d+/)?.[0] || null;
                            const nganhHangCode = String(row.nganhHang || '').match(/^\d+/)?.[0] || null;
                            const nganhHangName = (String(row.nganhHang || '').split(/-(.+)/)[1] || 'Không xác định').trim();

                            if (row.hinhThucXuat !== 'Xuất dịch vụ thu hộ bảo hiểm') { 
                                data.doanhThu += thanhTien; 
                                data.doanhThuQuyDoi += thanhTien * heSo; 

                                if (isRealtime && row.ngayTao && row.ngayHenGiao) {
                                    const diffTime = row.ngayHenGiao - row.ngayTao;
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    if (diffDays >= 2) {
                                        data.doanhThuGiaoXa += thanhTien;
                                        data.doanhThuQuyDoiGiaoXa += thanhTien * heSo;
                                    }
                                }
                            }
                            if (hinhThucXuatTraGop.has(row.hinhThucXuat)) { data.doanhThuTraGop += thanhTien; data.doanhThuTraGopQuyDoi += thanhTien * heSo; }
                            if (nganhHangName) {
                                if (!data.doanhThuTheoNganhHang[nganhHangName]) data.doanhThuTheoNganhHang[nganhHangName] = { revenue: 0, quantity: 0, revenueQuyDoi: 0 };
                                data.doanhThuTheoNganhHang[nganhHangName].revenue += thanhTien;
                                data.doanhThuTheoNganhHang[nganhHangName].quantity += soLuong;
                                data.doanhThuTheoNganhHang[nganhHangName].revenueQuyDoi += thanhTien * heSo;
                            }
                            if (PG.ICT.includes(nhomHangCode)) data.dtICT += thanhTien;
                            if (PG.CE.includes(nhomHangCode)) { data.dtCE += thanhTien; data.slCE += soLuong; }
                            if (nhomHangCode === PG.PHU_KIEN) { data.dtPhuKien += thanhTien; data.slPhuKien += soLuong; }
                            
                            const isMLN = PG.MAY_LOC_NUOC.includes(nhomHangCode);
                            const isGiaDung = PG.GIA_DUNG.includes(nganhHangCode);

                            if (isMLN) {
                                data.dtMLN += thanhTien;
                                data.slMLN += soLuong;
                                data.dtGiaDung += thanhTien;
                                data.slGiaDung += soLuong;
                            } else if (isGiaDung) {
                                data.dtGiaDung += thanhTien;
                                data.slGiaDung += soLuong;
                            }

                            if (PG.DIEN_THOAI.includes(nhomHangCode)) { data.dtDienThoai += thanhTien; data.slDienThoai += soLuong; }
                            if (PG.LAPTOP.includes(nhomHangCode)) { data.dtLaptop += thanhTien; data.slLaptop += soLuong; }
                            if (PG.TIVI.includes(nhomHangCode)) { data.dtTivi += thanhTien; data.slTivi += soLuong; }
                            if (PG.TU_LANH.includes(nhomHangCode)) { data.dtTuLanh += thanhTien; data.slTuLanh += soLuong; }
                            if (PG.MAY_GIAT.includes(nhomHangCode)) { data.dtMayGiat += thanhTien; data.slMayGiat += soLuong; }
                            if (PG.MAY_LANH.includes(nhomHangCode)) { data.dtMayLanh += thanhTien; data.slMayLanh += soLuong; }

                            const loaiBaoHiem = services.classifyInsurance(row.tenSanPham);
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

                            for (const key in PG.QDC_GROUPS) if (PG.QDC_GROUPS[key].codes.includes(nhomHangCode)) {
                                data.qdc[key].sl += soLuong; data.qdc[key].dt += thanhTien; data.qdc[key].dtqd += thanhTien * heSo;
                            }
                        }
                    }
                }
            });

            data.slICT = data.slDienThoai + data.slLaptop;
            const gioCong = gioCongByMSNV[employee.maNV] || 0;
            const thuongNong = thuongNongByMSNV[employee.maNV] || 0;
            const erpEntry = appState.thuongERPData.find(e => e.name.includes(employee.hoTen));
            const thuongERP = erpEntry ? parseFloat(erpEntry.bonus.replace(/,/g, '')) : 0;
            const tongThuNhap = thuongNong + thuongERP;
            const today = new Date();
            const currentDay = today.getDate();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            let thuNhapDuKien = 0;
            if (currentDay > 1) thuNhapDuKien = (tongThuNhap / (currentDay - 1)) * daysInMonth;
            else if (currentDay === 1) thuNhapDuKien = tongThuNhap * daysInMonth;

            const hieuQuaQuyDoi = data.doanhThu > 0 ? (data.doanhThuQuyDoi / data.doanhThu) - 1 : 0;
            const tyLeTraCham = data.doanhThu > 0 ? data.doanhThuTraGop / data.doanhThu : 0;
            const pctPhuKien = data.dtICT > 0 ? data.dtPhuKien / data.dtICT : 0;
            const pctGiaDung = data.dtCE > 0 ? data.dtGiaDung / data.dtCE : 0;
            const pctMLN = data.dtCE > 0 ? data.dtMLN / data.dtCE : 0;
            const pctSim = data.slSmartphone > 0 ? data.slSimOnline / data.slSmartphone : 0;
            const pctVAS = data.slSmartphone > 0 ? data.slUDDD / data.slSmartphone : 0;
            const pctBaoHiem = data.slBaoHiemDenominator > 0 ? data.slBaoHiemVAS / data.slBaoHiemDenominator : 0;

            return { ...employee, ...data, gioCong, thuongNong, thuongERP, tongThuNhap, thuNhapDuKien, hieuQuaQuyDoi, tyLeTraCham, pctPhuKien, pctGiaDung, pctMLN, pctSim, pctVAS, pctBaoHiem, mucTieu: goalSettings };
        });
    },
    calculateDepartmentAverages(departmentName, reportData) {
        const departmentEmployees = reportData.filter(e => e.boPhan === departmentName);
        if (departmentEmployees.length === 0) return {};

        const totals = departmentEmployees.reduce((acc, curr) => {
            Object.keys(curr).forEach(key => {
                if (typeof curr[key] === 'number') acc[key] = (acc[key] || 0) + curr[key];
                if (key === 'qdc' && typeof curr[key] === 'object') {
                    if (!acc.qdc) acc.qdc = {};
                    for (const qdcKey in curr.qdc) {
                        if (!acc.qdc[qdcKey]) acc.qdc[qdcKey] = { sl: 0, dt: 0, dtqd: 0 };
                        acc.qdc[qdcKey].sl += curr.qdc[qdcKey].sl;
                        acc.qdc[qdcKey].dt += curr.qdc[qdcKey].dt;
                        acc.qdc[qdcKey].dtqd += curr.qdc[qdcKey].dtqd;
                    }
                }
            });
            return acc;
        }, {});

        const averages = {};
        for (const key in totals) {
            if (key !== 'qdc') averages[key] = totals[key] / departmentEmployees.length;
            else {
                averages.qdc = {};
                for (const qdcKey in totals.qdc) averages.qdc[qdcKey] = {
                    sl: totals.qdc[qdcKey].sl / departmentEmployees.length,
                    dt: totals.qdc[qdcKey].dt / departmentEmployees.length,
                    dtqd: totals.qdc[qdcKey].dtqd / departmentEmployees.length
                };
            }
        }
        return averages;
    },
    calculateTimeProgress(openTimeStr, closeTimeStr) {
        if (!openTimeStr || !closeTimeStr) return 0;
        const now = new Date();
        const [openH, openM] = openTimeStr.split(':').map(Number);
        const [closeH, closeM] = closeTimeStr.split(':').map(Number);
        const openDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), openH, openM);
        const closeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), closeH, closeM);
        if (now < openDate) return 0;
        if (now > closeDate) return 1;
        const totalDuration = closeDate - openDate;
        const elapsedDuration = now - openDate;
        return totalDuration > 0 ? elapsedDuration / totalDuration : 0;
    }
};

export { services };