// Version 2.6 - Fix: Remove specific exclusion for 'Xuất dịch vụ thu hộ bảo hiểm' in revenue calculation
// MODULE: SERVICES FACADE
// File này đóng vai trò điều phối, nhập khẩu các module logic con và export chúng ra ngoài.

import { config } from '../config.js';
import { appState } from './state.js';
import { ui } from './ui.js';
import { utils } from './utils.js';
import { dataProcessing } from './services/data-processing.js';

const reportGeneration = {
    calculateCompetitionFocusReport(sourceYcxData, competitionConfigs) {
        if (!sourceYcxData || sourceYcxData.length === 0 || !competitionConfigs || competitionConfigs.length === 0) {
            return [];
        }

        const hinhThucXuatTinhDoanhThu = dataProcessing.getHinhThucXuatTinhDoanhThu();

        const validSalesData = sourceYcxData.filter(row => {
            const isDoanhThuHTX = hinhThucXuatTinhDoanhThu.has(row.hinhThucXuat);
            const isBaseValid = (row.trangThaiThuTien || "").trim() === 'Đã thu' &&
                                (row.trangThaiHuy || "").trim() === 'Chưa hủy' &&
                                (row.tinhTrangTra || "").trim() === 'Chưa trả' &&
                                (row.trangThaiXuat || "").trim() === 'Đã xuất';
            return isBaseValid && isDoanhThuHTX;
        });

        const report = competitionConfigs.map(config => {
            const cleanedConfigGroups = new Set((config.groups || []).map(g => utils.cleanCategoryName(g)));

            let baseSalesData = validSalesData.filter(row => {
                const cleanNhomHangFromYCX = utils.cleanCategoryName(row.nhomHang);

                const isInGroup = cleanedConfigGroups.has(cleanNhomHangFromYCX);
                if (!isInGroup) return false;

                if (config.type === 'soluong' && (config.minPrice > 0 || config.maxPrice > 0)) {
                    const price = (parseFloat(String(row.thanhTien || "0").replace(/,/g, '')) || 0) / (parseInt(String(row.soLuong || "1"), 10) || 1);
                    const minPrice = config.minPrice || 0;
                    const maxPrice = config.maxPrice || Infinity;
                    if (price < minPrice || price > maxPrice) return false;
                }
                return true;
            });

            if (config.excludeApple) {
                baseSalesData = baseSalesData.filter(row => row.nhaSanXuat !== 'Apple');
            }

            const employeeResults = appState.danhSachNhanVien.map(employee => {
                let performanceByBrand = {};
                let totalTargetRevenue = 0;
                let totalTargetQuantity = 0;
                let baseCategoryRevenue = 0;
                let baseCategoryQuantity = 0;

                baseSalesData.forEach(row => {
                    const msnvMatch = String(row.nguoiTao || '').match(/(\d+)/);
                    if (msnvMatch && msnvMatch[1].trim() === employee.maNV) {
                        const revenueValue = (parseFloat(String(row.thanhTien || "0").replace(/,/g, '')) || 0);
                        const quantityValue = (parseInt(String(row.soLuong || "0"), 10) || 0);

                        baseCategoryRevenue += revenueValue;
                        baseCategoryQuantity += quantityValue;

                        const brand = row.nhaSanXuat;
                        if ((config.brands || []).includes(brand)) {
                            if (!performanceByBrand[brand]) {
                                performanceByBrand[brand] = { revenue: 0, quantity: 0 };
                            }
                            performanceByBrand[brand].revenue += revenueValue;
                            performanceByBrand[brand].quantity += quantityValue;

                            totalTargetRevenue += revenueValue;
                            totalTargetQuantity += quantityValue;
                        }
                    }
                });

                return {
                    maNV: employee.maNV,
                    hoTen: employee.hoTen,
                    boPhan: employee.boPhan,
                    performanceByBrand,
                    targetBrandsRevenue: totalTargetRevenue,
                    targetBrandsQuantity: totalTargetQuantity,
                    baseCategoryRevenue,
                    baseCategoryQuantity,
                    tyLeDT: baseCategoryRevenue > 0 ? (totalTargetRevenue / baseCategoryRevenue) : 0,
                    tyLeSL: baseCategoryQuantity > 0 ? (totalTargetQuantity / baseCategoryQuantity) : 0,
                };
            }).filter(e => e.baseCategoryRevenue > 0 || e.baseCategoryQuantity > 0);

            return {
                competition: config,
                employeeData: employeeResults,
            };
        }).filter(r => r.employeeData.length > 0);

        return report;
    },

    generateMasterReportData: (sourceData, goalSettings, isRealtime = false) => {
        if (appState.danhSachNhanVien.length === 0) return [];

        const hinhThucXuatTinhDoanhThu = dataProcessing.getHinhThucXuatTinhDoanhThu();
        const hinhThucXuatTraGop = dataProcessing.getHinhThucXuatTraGop();
        const heSoQuyDoi = dataProcessing.getHeSoQuyDoi();
        const PG = config.PRODUCT_GROUPS;
        const gioCongByMSNV = dataProcessing.processGioCongData();
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

        const thuongNongThangTruocByMSNV = {};
        appState.thuongNongDataThangTruoc.forEach(row => {
            const maNV = String(row.maNV || '').trim();
            const hoTen = String(row.hoTen || '').trim().replace(/\s+/g, ' ');
            let foundMaNV = maNV || appState.employeeNameToMaNVMap.get(hoTen.toLowerCase()) || null;
            if (foundMaNV) {
                const diemThuongValue = parseFloat(String(row.diemThuong || '0').replace(/,/g, '')) || 0;
                thuongNongThangTruocByMSNV[foundMaNV] = (thuongNongThangTruocByMSNV[foundMaNV] || 0) + diemThuongValue;
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
                const msnvMatch = String(row.nguoiTao || '').match(/(\d+)/);
                if (msnvMatch && msnvMatch[1].trim() === employee.maNV) {
                    const isDoanhThuHTX = hinhThucXuatTinhDoanhThu.has(row.hinhThucXuat);
                    const isBaseValid = (row.trangThaiThuTien || "").trim() === 'Đã thu' && (row.trangThaiHuy || "").trim() === 'Chưa hủy' && (row.tinhTrangTra || "").trim() === 'Chưa trả';

                    if (isBaseValid && isDoanhThuHTX) {
                        const thanhTien = parseFloat(String(row.thanhTien || "0").replace(/,/g, '')) || 0;
                        if(isNaN(thanhTien)) return;

                        const heSo = heSoQuyDoi[row.nhomHang] || 1;
                        const trangThaiXuat = (row.trangThaiXuat || "").trim();

                        const nhomHangCode = String(row.nhomHang || '').match(/^\d+/)?.[0] || null;
                        const nganhHangCode = String(row.nganhHang || '').match(/^\d+/)?.[0] || null;

                        const isICT = PG.ICT.includes(nhomHangCode);
                        const isCE = PG.CE.includes(nhomHangCode);
                        const isPhuKien = PG.PHU_KIEN.includes(nganhHangCode);
                        const isGiaDung = PG.GIA_DUNG.includes(nganhHangCode);
                        const isMLN = PG.MAY_LOC_NUOC.includes(nhomHangCode);

                        if (trangThaiXuat === 'Chưa xuất') {
                            data.doanhThuChuaXuat += thanhTien;
                            data.doanhThuQuyDoiChuaXuat += thanhTien * heSo;
                        } else if (trangThaiXuat === 'Đã xuất') {
                            const soLuong = parseInt(String(row.soLuong || "0"), 10) || 0;
                            if(isNaN(soLuong)) return;

                            const nganhHangName = utils.cleanCategoryName(row.nganhHang);

                            // ---- REMOVED EXCLUSION ----
                            // if (row.hinhThucXuat !== 'Xuất dịch vụ thu hộ bảo hiểm') {
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
                            // } // ---- END REMOVED EXCLUSION ----

                            if (hinhThucXuatTraGop.has(row.hinhThucXuat)) { data.doanhThuTraGop += thanhTien; data.doanhThuTraGopQuyDoi += thanhTien * heSo; }

                            if (nganhHangName) {
                                if (!data.doanhThuTheoNganhHang[nganhHangName]) data.doanhThuTheoNganhHang[nganhHangName] = { revenue: 0, quantity: 0, revenueQuyDoi: 0 };
                                data.doanhThuTheoNganhHang[nganhHangName].revenue += thanhTien;
                                data.doanhThuTheoNganhHang[nganhHangName].quantity += soLuong;
                                data.doanhThuTheoNganhHang[nganhHangName].revenueQuyDoi += thanhTien * heSo;
                            }

                            if (isICT) { data.dtICT += thanhTien; }
                            if (isCE) { data.dtCE += thanhTien; data.slCE += soLuong; }
                            if (isPhuKien) { data.dtPhuKien += thanhTien; data.slPhuKien += soLuong; }
                            if (isGiaDung) { data.dtGiaDung += thanhTien; data.slGiaDung += soLuong; }
                            if (isMLN) { data.dtMLN += thanhTien; data.slMLN += soLuong; }

                            if (PG.DIEN_THOAI.includes(nhomHangCode)) { data.dtDienThoai += thanhTien; data.slDienThoai += soLuong; }
                            if (PG.LAPTOP.includes(nhomHangCode)) { data.dtLaptop += thanhTien; data.slLaptop += soLuong; }
                            if (PG.TIVI.includes(nhomHangCode)) { data.dtTivi += thanhTien; data.slTivi += soLuong; }
                            if (PG.TU_LANH.includes(nhomHangCode)) { data.dtTuLanh += thanhTien; data.slTuLanh += soLuong; }
                            if (PG.MAY_GIAT.includes(nhomHangCode)) { data.dtMayGiat += thanhTien; data.slMayGiat += soLuong; }
                            if (PG.MAY_LANH.includes(nhomHangCode)) { data.dtMayLanh += thanhTien; data.slMayLanh += soLuong; }

                            const loaiBaoHiem = dataProcessing.classifyInsurance(row.tenSanPham);
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

            const thuongNongThangTruoc = thuongNongThangTruocByMSNV[employee.maNV] || 0;
            const erpEntryThangTruoc = appState.thuongERPDataThangTruoc.find(e => e.name.includes(employee.hoTen));
            const thuongERPThangTruoc = erpEntryThangTruoc ? parseFloat(erpEntryThangTruoc.bonus.replace(/,/g, '')) : 0;
            const thuNhapThangTruoc = thuongNongThangTruoc + thuongERPThangTruoc;
            const chenhLechThuNhap = thuNhapDuKien - thuNhapThangTruoc;

            const hieuQuaQuyDoi = data.doanhThu > 0 ? (data.doanhThuQuyDoi / data.doanhThu) - 1 : 0;
            const tyLeTraCham = data.doanhThu > 0 ? data.doanhThuTraGop / data.doanhThu : 0;
            const pctPhuKien = data.dtICT > 0 ? data.dtPhuKien / data.dtICT : 0;
            const pctGiaDung = data.dtCE > 0 ? data.dtGiaDung / data.dtCE : 0;
            const pctMLN = data.dtCE > 0 ? data.dtMLN / data.dtCE : 0;
            const pctSim = data.slSmartphone > 0 ? data.slSimOnline / data.slSmartphone : 0;
            const pctVAS = data.slSmartphone > 0 ? data.slUDDD / data.slSmartphone : 0;
            const pctBaoHiem = data.slBaoHiemDenominator > 0 ? data.slBaoHiemVAS / data.slBaoHiemDenominator : 0;

            data.donGiaTivi = data.slTivi > 0 ? data.dtTivi / data.slTivi : 0;
            data.donGiaTuLanh = data.slTuLanh > 0 ? data.dtTuLanh / data.slTuLanh : 0;
            data.donGiaMayGiat = data.slMayGiat > 0 ? data.dtMayGiat / data.slMayGiat : 0;
            data.donGiaMayLanh = data.slMayLanh > 0 ? data.dtMayLanh / data.slMayLanh : 0;
            data.donGiaDienThoai = data.slDienThoai > 0 ? data.dtDienThoai / data.slDienThoai : 0;
            data.donGiaLaptop = data.slLaptop > 0 ? data.dtLaptop / data.slLaptop : 0;

            const totalQuantity = Object.values(data.doanhThuTheoNganhHang).reduce((sum, category) => sum + category.quantity, 0);
            const donGiaTrungBinh = totalQuantity > 0 ? data.doanhThu / totalQuantity : 0;

            return { ...employee, ...data, gioCong, thuongNong, thuongERP, tongThuNhap, thuNhapDuKien, thuNhapThangTruoc, chenhLechThuNhap, hieuQuaQuyDoi, tyLeTraCham, pctPhuKien, pctGiaDung, pctMLN, pctSim, pctVAS, pctBaoHiem, donGiaTrungBinh, mucTieu: goalSettings };
        });
    },

    generateLuyKeChuaXuatReport(sourceYcxData) {
        if (!sourceYcxData || sourceYcxData.length === 0) return [];

        const hinhThucXuatTinhDoanhThu = dataProcessing.getHinhThucXuatTinhDoanhThu();
        const heSoQuyDoi = dataProcessing.getHeSoQuyDoi();
        const report = {};

        sourceYcxData.forEach(row => {
            const isDoanhThuHTX = hinhThucXuatTinhDoanhThu.has(row.hinhThucXuat);
            const isBaseValid = (row.trangThaiThuTien || "").trim() === 'Đã thu' &&
                                (row.trangThaiHuy || "").trim() === 'Chưa hủy' &&
                                (row.tinhTrangTra || "").trim() === 'Chưa trả' &&
                                (row.trangThaiXuat || "").trim() === 'Chưa xuất';

            if (isBaseValid && isDoanhThuHTX) {
                const thanhTien = parseFloat(String(row.thanhTien || "0").replace(/,/g, '')) || 0;
                const soLuong = parseInt(String(row.soLuong || "0"), 10) || 0;
                if (isNaN(thanhTien) || isNaN(soLuong)) return;

                const nganhHangName = utils.cleanCategoryName(row.nganhHang);
                const heSo = heSoQuyDoi[row.nhomHang] || 1;

                if (!report[nganhHangName]) {
                    report[nganhHangName] = {
                        nganhHang: nganhHangName,
                        soLuong: 0,
                        doanhThuThuc: 0,
                        doanhThuQuyDoi: 0
                    };
                }

                report[nganhHangName].soLuong += soLuong;
                report[nganhHangName].doanhThuThuc += thanhTien;
                report[nganhHangName].doanhThuQuyDoi += thanhTien * heSo;
            }
        });

        return Object.values(report);
    },

    generateRealtimeChuaXuatReport(sourceRealtimeYcxData) {
        if (!sourceRealtimeYcxData || sourceRealtimeYcxData.length === 0) return [];

        const hinhThucXuatTinhDoanhThu = dataProcessing.getHinhThucXuatTinhDoanhThu();
        const heSoQuyDoi = dataProcessing.getHeSoQuyDoi();
        const report = {};

        sourceRealtimeYcxData.forEach(row => {
            const isDoanhThuHTX = hinhThucXuatTinhDoanhThu.has(row.hinhThucXuat);
            const isBaseValid = (row.trangThaiThuTien || "").trim() === 'Đã thu' &&
                                (row.trangThaiHuy || "").trim() === 'Chưa hủy' &&
                                (row.tinhTrangTra || "").trim() === 'Chưa trả' &&
                                (row.trangThaiXuat || "").trim() === 'Chưa xuất';

            if (isBaseValid && isDoanhThuHTX) {
                const thanhTien = parseFloat(String(row.thanhTien || "0").replace(/,/g, '')) || 0;
                const soLuong = parseInt(String(row.soLuong || "0"), 10) || 0;
                if (isNaN(thanhTien) || isNaN(soLuong)) return;

                const nganhHangName = utils.cleanCategoryName(row.nganhHang);
                const heSo = heSoQuyDoi[row.nhomHang] || 1;

                if (!report[nganhHangName]) {
                    report[nganhHangName] = {
                        nganhHang: nganhHangName,
                        soLuong: 0,
                        doanhThuThuc: 0,
                        doanhThuQuyDoi: 0
                    };
                }

                report[nganhHangName].soLuong += soLuong;
                report[nganhHangName].doanhThuThuc += thanhTien;
                report[nganhHangName].doanhThuQuyDoi += thanhTien * heSo;
            }
        });

        return Object.values(report);
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

    generateRealtimeEmployeeDetailReport(employeeMaNV, realtimeYCXData) {
        if (!employeeMaNV || !realtimeYCXData || realtimeYCXData.length === 0) return null;

        const employeeData = realtimeYCXData.filter(row => {
            const msnvMatch = String(row.nguoiTao || '').match(/(\d+)/);
            return msnvMatch && msnvMatch[1].trim() === String(employeeMaNV);
        });

        if (employeeData.length === 0) return null;

        const hinhThucXuatTinhDoanhThu = dataProcessing.getHinhThucXuatTinhDoanhThu();
        const heSoQuyDoi = dataProcessing.getHeSoQuyDoi();

        const summary = {
            totalRealRevenue: 0,
            totalConvertedRevenue: 0,
            unexportedRevenue: 0
        };
        const byProductGroup = {};
        const byCustomer = {};

        employeeData.forEach(row => {
            const isDoanhThuHTX = hinhThucXuatTinhDoanhThu.has(row.hinhThucXuat);
            const isBaseValid = (row.trangThaiThuTien || "").trim() === 'Đã thu' && (row.trangThaiHuy || "").trim() === 'Chưa hủy' && (row.tinhTrangTra || "").trim() === 'Chưa trả';

            if (isDoanhThuHTX && isBaseValid) {
                const realRevenue = parseFloat(String(row.thanhTien || "0").replace(/,/g, '')) || 0;
                const quantity = parseInt(String(row.soLuong || "0"), 10) || 0;
                const heSo = heSoQuyDoi[row.nhomHang] || 1;
                const convertedRevenue = realRevenue * heSo;
                const groupName = utils.cleanCategoryName(row.nhomHang || 'Khác');
                const customerName = row.tenKhachHang || 'Khách lẻ';

                if ((row.trangThaiXuat || "").trim() === 'Đã xuất') {
                    summary.totalRealRevenue += realRevenue;
                    summary.totalConvertedRevenue += convertedRevenue;

                    if (!byProductGroup[groupName]) {
                        byProductGroup[groupName] = { name: groupName, quantity: 0, realRevenue: 0, convertedRevenue: 0 };
                    }
                    byProductGroup[groupName].quantity += quantity;
                    byProductGroup[groupName].realRevenue += realRevenue;
                    byProductGroup[groupName].convertedRevenue += convertedRevenue;

                    if (!byCustomer[customerName]) {
                        byCustomer[customerName] = { name: customerName, products: [], totalQuantity: 0 };
                    }
                    byCustomer[customerName].products.push({
                        productName: row.tenSanPham,
                        quantity: quantity,
                        realRevenue: realRevenue,
                        convertedRevenue: convertedRevenue,
                    });
                    byCustomer[customerName].totalQuantity += quantity;
                } else if ((row.trangThaiXuat || "").trim() === 'Chưa xuất') {
                    summary.unexportedRevenue += convertedRevenue;
                }
            }
        });

        summary.totalOrders = Object.keys(byCustomer).length;
        summary.bundledOrderCount = Object.values(byCustomer).filter(c => c.totalQuantity > 1).length;
        summary.conversionRate = summary.totalRealRevenue > 0 ? (summary.totalConvertedRevenue / summary.totalRealRevenue) - 1 : 0;

        return {
            summary,
            byProductGroup: Object.values(byProductGroup).sort((a, b) => b.realRevenue - a.realRevenue),
            byCustomer: Object.values(byCustomer)
        };
    },

    // === START: REFACTORED FUNCTION FOR LUY KE EMPLOYEE DETAIL (v38.0) ===
    generateLuyKeEmployeeDetailReport(employeeMaNV, luykeYCXData) {
        if (!employeeMaNV || !luykeYCXData || luykeYCXData.length === 0) {
            return null;
        }

        const employeeData = luykeYCXData.filter(row => {
            const msnvMatch = String(row.nguoiTao || '').match(/(\d+)/);
            return msnvMatch && msnvMatch[1].trim() === String(employeeMaNV);
        });

        if (employeeData.length === 0) {
            return null;
        }

        const hinhThucXuatTinhDoanhThu = dataProcessing.getHinhThucXuatTinhDoanhThu();
        const heSoQuyDoi = dataProcessing.getHeSoQuyDoi();

        const summary = {
            totalRealRevenue: 0,
            totalConvertedRevenue: 0,
            unexportedRevenue: 0, // Calculated from master data
        };
        const byProductGroup = {};
        const byCustomer = {};
        const categoryChartDataMap = {};

        const employeeMasterData = appState.masterReportData.sknv.find(e => String(e.maNV) === String(employeeMaNV));
        if (employeeMasterData) {
            summary.unexportedRevenue = employeeMasterData.doanhThuChuaXuat || 0;
        }

        employeeData.forEach(row => {
            const isDoanhThuHTX = hinhThucXuatTinhDoanhThu.has(row.hinhThucXuat);
            const isBaseValid = (row.trangThaiThuTien || "").trim() === 'Đã thu' &&
                                (row.trangThaiHuy || "").trim() === 'Chưa hủy' &&
                                (row.tinhTrangTra || "").trim() === 'Chưa trả' &&
                                (row.trangThaiXuat || "").trim() === 'Đã xuất';

            if (isDoanhThuHTX && isBaseValid) {
                const realRevenue = parseFloat(String(row.thanhTien || "0").replace(/,/g, '')) || 0;
                const quantity = parseInt(String(row.soLuong || "0"), 10) || 0;
                if(isNaN(realRevenue) || isNaN(quantity)) return;

                const heSo = heSoQuyDoi[row.nhomHang] || 1;
                const convertedRevenue = realRevenue * heSo;
                const groupName = utils.cleanCategoryName(row.nhomHang || 'Khác');
                const customerName = row.tenKhachHang || 'Khách Lẻ';
                const categoryName = utils.cleanCategoryName(row.nganhHang || 'Khác');

                // For Summary KPIs
                summary.totalRealRevenue += realRevenue;
                summary.totalConvertedRevenue += convertedRevenue;

                // For Top 8 Product Groups
                if (!byProductGroup[groupName]) {
                    byProductGroup[groupName] = { name: groupName, quantity: 0, realRevenue: 0, convertedRevenue: 0 };
                }
                byProductGroup[groupName].quantity += quantity;
                byProductGroup[groupName].realRevenue += realRevenue;
                byProductGroup[groupName].convertedRevenue += convertedRevenue;

                // For Chart Data
                if (!categoryChartDataMap[categoryName]) {
                    categoryChartDataMap[categoryName] = { name: categoryName, revenue: 0 };
                }
                categoryChartDataMap[categoryName].revenue += realRevenue;

                // For Customer Accordion
                if (!byCustomer[customerName]) {
                    byCustomer[customerName] = { name: customerName, products: [], totalQuantity: 0, totalRealRevenue: 0, totalConvertedRevenue: 0 };
                }
                byCustomer[customerName].products.push({
                    productName: row.tenSanPham,
                    quantity: quantity,
                    realRevenue: realRevenue,
                    convertedRevenue: convertedRevenue,
                });
                byCustomer[customerName].totalQuantity += quantity;
                byCustomer[customerName].totalRealRevenue += realRevenue;
                byCustomer[customerName].totalConvertedRevenue += convertedRevenue;
            }
        });

        // Final calculations for summary
        summary.totalOrders = Object.keys(byCustomer).length;
        summary.bundledOrderCount = Object.values(byCustomer).filter(c => c.products.length > 1).length;
        summary.conversionRate = summary.totalRealRevenue > 0 ? (summary.totalConvertedRevenue / summary.totalRealRevenue) - 1 : 0;

        // Final calculations for customers and product groups
        for (const customerName in byCustomer) {
            const customer = byCustomer[customerName];
            customer.conversionRate = customer.totalRealRevenue > 0 ? (customer.totalConvertedRevenue / customer.totalRealRevenue) - 1 : 0;
        }
        for (const groupName in byProductGroup) {
            const group = byProductGroup[groupName];
            group.conversionRate = group.realRevenue > 0 ? (group.convertedRevenue / group.realRevenue) - 1 : 0;
        }

        return {
            summary,
            topProductGroups: Object.values(byProductGroup)
                .sort((a, b) => b.realRevenue - a.realRevenue)
                .slice(0, 8),
            categoryChartData: Object.values(categoryChartDataMap),
            byCustomer: Object.values(byCustomer)
                .sort((a,b) => b.totalRealRevenue - a.totalRealRevenue)
        };
    },
    // === END: REFACTORED FUNCTION ===

    generateRealtimeBrandReport(realtimeYCXData, selectedCategory, selectedBrand) {
        if (!realtimeYCXData || realtimeYCXData.length === 0) return { byBrand: [], byEmployee: [] };

        const filteredData = realtimeYCXData.filter(row => {
            const categoryMatch = !selectedCategory || utils.cleanCategoryName(row.nganhHang) === selectedCategory;
            const brandMatch = !selectedBrand || (row.nhaSanXuat || 'Hãng khác') === selectedBrand;
            const isDoanhThuHTX = dataProcessing.getHinhThucXuatTinhDoanhThu().has(row.hinhThucXuat);
            const isBaseValid = (row.trangThaiThuTien || "").trim() === 'Đã thu' && (row.trangThaiHuy || "").trim() === 'Chưa hủy' && (row.tinhTrangTra || "").trim() === 'Chưa trả' && (row.trangThaiXuat || "").trim() === 'Đã xuất';

            return categoryMatch && brandMatch && isDoanhThuHTX && isBaseValid;
        });

        const byBrand = {};
        const byEmployee = {};

        filteredData.forEach(row => {
            const brand = row.nhaSanXuat || 'Hãng khác';
            const msnvMatch = String(row.nguoiTao || '').match(/(\d+)/);
            const employeeId = msnvMatch ? msnvMatch[1].trim() : 'Unknown';
            const realRevenue = parseFloat(String(row.thanhTien || "0").replace(/,/g, '')) || 0;
            const quantity = parseInt(String(row.soLuong || "0"), 10) || 0;

            if (!byBrand[brand]) {
                byBrand[brand] = { name: brand, quantity: 0, revenue: 0 };
            }
            byBrand[brand].quantity += quantity;
            byBrand[brand].revenue += realRevenue;

            if (!byEmployee[employeeId]) {
                const employeeInfo = appState.employeeMaNVMap.get(employeeId);
                byEmployee[employeeId] = { id: employeeId, name: employeeInfo ? employeeInfo.hoTen : `NV ${employeeId}`, quantity: 0, revenue: 0 };
            }
            byEmployee[employeeId].quantity += quantity;
            byEmployee[employeeId].revenue += realRevenue;
        });

        const brandArray = Object.values(byBrand).map(b => ({...b, avgPrice: b.quantity > 0 ? b.revenue / b.quantity : 0})).sort((a,b) => b.revenue - a.revenue);
        const employeeArray = Object.values(byEmployee).sort((a,b) => b.revenue - a.revenue);

        return { byBrand: brandArray, byEmployee: employeeArray };
    },
};

const composerServices = {
    getEmployeeRanking(reportData, key, direction = 'desc', count = 3, department = 'ALL') {
        if (!reportData || reportData.length === 0) return [];

        let filteredData = reportData;
        if (department !== 'ALL') {
            filteredData = reportData.filter(e => e.boPhan === department);
        }

        return [...filteredData]
            .filter(e => e[key] > 0)
            .sort((a, b) => direction === 'desc' ? (b[key] || 0) - (a[key] || 0) : (a[key] || 0) - (b[key] || 0))
            .slice(0, count);
    },

    getEmployeesBelowTarget(reportData, dataKey, goalKey, department = 'ALL') {
        if (!reportData || reportData.length === 0) return [];

        let filteredData = reportData;
        if (department !== 'ALL') {
            filteredData = reportData.filter(e => e.boPhan === department);
        }

        return filteredData.filter(employee => {
            const value = employee[dataKey] || 0;
            const target = (employee.mucTieu?.[goalKey] || 0) / 100;
            return target > 0 && value < target;
        }).sort((a, b) => (b[dataKey] || 0) - (a[dataKey] || 0));
    },

    formatEmployeeList(employeeArray, valueKey, valueType = 'number') {
        if (!Array.isArray(employeeArray) || employeeArray.length === 0) {
            return " (không có)";
        }
        return "\n" + employeeArray.map((e, index) => {
            const value = e[valueKey];
            let formattedValue = '';
            if (valueType === 'percent') {
                formattedValue = ui.formatPercentage(value);
            } else if (valueType === 'currency') {
                formattedValue = ui.formatRevenue(value) + " tr";
            } else {
                 formattedValue = ui.formatNumberOrDash(value);
            }
            return `${index + 1}. ${ui.getShortEmployeeName(e.hoTen, e.maNV)}: ${formattedValue} @${e.maNV}`;
        }).join("\n");
    },

    processComposerTemplate(template, supermarketReport, goals, rankingReportData, competitionData, sectionId) {
        if (!template || !supermarketReport || !goals) {
            return "Lỗi: Dữ liệu không đủ để tạo nhận xét.";
        }

        const tagMapping = {
            'DTQD': { key: 'doanhThuQuyDoi', format: 'currency' },
            'THUNHAP': { key: 'tongThuNhap', format: 'currency' },
            'TLQD': { key: 'hieuQuaQuyDoi', format: 'percent' },
        };

        const botTargetMapping = {
            'TLQD': { dataKey: 'hieuQuaQuyDoi', goalKey: 'phanTramQD', format: 'percent' },
            'TLTC': { dataKey: 'tyLeTraCham', goalKey: 'phanTramTC', format: 'percent' },
            'PK': { dataKey: 'pctPhuKien', goalKey: 'phanTramPhuKien', format: 'percent' },
            'GD': { dataKey: 'pctGiaDung', goalKey: 'phanTramGiaDung', format: 'percent' },
            'MLN': { dataKey: 'pctMLN', goalKey: 'phanTramMLN', format: 'percent' },
            'SIM': { dataKey: 'pctSim', goalKey: 'phanTramSim', format: 'percent' },
            'VAS': { dataKey: 'pctVAS', goalKey: 'phanTramVAS', format: 'percent' },
            'BH': { dataKey: 'pctBaoHiem', goalKey: 'phanTramBaoHiem', format: 'percent' },
        };

        return template.replace(/\[(.*?)\]/g, (match, tag) => {
            const now = new Date();
            const currentDay = now.getDate() || 1;

            let dtThuc = supermarketReport.doanhThu || 0;
            let dtQd = supermarketReport.doanhThuQuyDoi || 0;
            let phanTramHTQD = goals.doanhThuQD > 0 ? (dtQd / 1000000) / goals.doanhThuQD : 0;

            if (sectionId === 'luyke') {
                const pastedLuyKeData = dataProcessing.parseLuyKePastedData(document.getElementById('paste-luyke')?.value || '');
                if (pastedLuyKeData.mainKpis['Thực hiện DT thực']) {
                    dtThuc = parseFloat(pastedLuyKeData.mainKpis['Thực hiện DT thực'].replace(/,/g, '')) * 1000000;
                }
                if (pastedLuyKeData.mainKpis['Thực hiện DTQĐ']) {
                    dtQd = parseFloat(pastedLuyKeData.mainKpis['Thực hiện DTQĐ'].replace(/,/g, '')) * 1000000;
                }
                if (pastedLuyKeData.mainKpis['% HT Target Dự Kiến (QĐ)']) {
                    phanTramHTQD = (parseFloat(pastedLuyKeData.mainKpis['% HT Target Dự Kiến (QĐ)'].replace('%', '')) || 0) / 100;
                }
            }

            if (tag === 'NGAY') return now.toLocaleDateString('vi-VN');
            if (tag === 'GIO') return now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            if (tag === 'DT_THUC') return ui.formatNumber(dtThuc / 1000000, 0) + " tr";
            if (tag === 'DTQD') return ui.formatNumber(dtQd / 1000000, 0) + " tr";
            if (tag === '%HT_DTQD') return ui.formatPercentage(phanTramHTQD);

            if (tag === 'TLQD') {
                if (sectionId === 'luyke') {
                    const pastedLuyKeData = dataProcessing.parseLuyKePastedData(document.getElementById('paste-luyke')?.value || '');
                    if (pastedLuyKeData.mainKpis['Thực hiện DT thực'] && pastedLuyKeData.mainKpis['Thực hiện DTQĐ']) {
                        const dtThucPasted = parseFloat(String(pastedLuyKeData.mainKpis['Thực hiện DT thực']).replace(/,/g, ''));
                        const dtQdPasted = parseFloat(String(pastedLuyKeData.mainKpis['Thực hiện DTQĐ']).replace(/,/g, ''));
                        if (dtThucPasted > 0) {
                            return ui.formatPercentage((dtQdPasted / dtThucPasted) - 1);
                        }
                    }
                }
                return ui.formatPercentage(supermarketReport.hieuQuaQuyDoi || 0);
            }

            if (tag === '%HT_DTT') {
                const target = parseFloat(goals.doanhThuThuc) || 0;
                const percent = target > 0 ? (dtThuc / 1000000) / target : 0;
                return ui.formatPercentage(percent);
            }
            if (tag === 'DT_CHUAXUAT') return ui.formatRevenue(supermarketReport.doanhThuQuyDoiChuaXuat || 0) + " tr";
            if (tag === 'SS_CUNGKY') return supermarketReport.comparisonData?.percentage || 'N/A';

            if (tag.startsWith('TD_')) {
                const total = competitionData?.length || 0;
                const dat = (competitionData || []).filter(d => parseFloat(String(d.hoanThanh).replace('%','')) >= 100).length;
                if (tag === 'TD_TONG_CT') return total;
                if (tag === 'TD_CT_DAT') return dat;
                if (tag === 'TD_CT_CHUADAT') return total - dat;
                if (tag === 'TD_TYLE_DAT') return total > 0 ? ui.formatPercentage(dat / total) : '0%';
            }

            if (tag === 'TOP_QDC_INFO') {
                if (!supermarketReport.qdc) return " (không có)";
                const qdcArray = Object.values(supermarketReport.qdc).filter(item => item.sl > 0);
                const sortedQDC = qdcArray.sort((a,b) => b.dtqd - a.dtqd);
                return "\n" + sortedQDC.map(item => `  • ${item.name}: SL ${ui.formatNumber(item.sl)}, TB ${ui.formatNumber(item.sl / currentDay, 1)}/ngày`).join("\n");
            }
            if (tag === 'TOP_NGANHHANG_SL') {
                if (!supermarketReport.nganhHangChiTiet) return " (không có)";
                const nganhHangArray = Object.values(supermarketReport.nganhHangChiTiet).filter(item => item.quantity > 0);
                const topNganhHang = nganhHangArray.sort((a,b) => b.quantity - a.quantity).slice(0, 10);
                return "\n" + topNganhHang.map(item => `  • ${utils.cleanCategoryName(item.name)}: ${ui.formatNumber(item.quantity)}`).join("\n");
            }

            const rankingRegex = /^(TOP|BOT)(\d)_(\w+)_([\s\S]+)$/;
            const rankingMatch = tag.match(rankingRegex);
            if (rankingMatch && rankingReportData) {
                const [_, type, count, metric, department] = rankingMatch;
                const cleanDepartment = department.replace(/@msnv$/, '').trim();
                const direction = type === 'TOP' ? 'desc' : 'asc';
                const metricInfo = tagMapping[metric];
                if (metricInfo) {
                    let dataForRanking = rankingReportData;
                    if (metric === 'THUNHAP' && appState.masterReportData.sknv.length > 0) {
                        dataForRanking = appState.masterReportData.sknv;
                    }
                    const ranking = composerServices.getEmployeeRanking(dataForRanking, metricInfo.key, direction, parseInt(count), cleanDepartment);
                    return composerServices.formatEmployeeList(ranking, metricInfo.key, metricInfo.format);
                }
            }

            const botTargetRegex = /^BOT_TARGET_(\w+)_([\s\S]+)$/;
            const botTargetMatch = tag.match(botTargetRegex);
            if(botTargetMatch && rankingReportData) {
                let [_, metric, department] = botTargetMatch;
                department = department.replace(/@msnv$/, '').trim();
                const metricInfo = botTargetMapping[metric];
                if (metricInfo) {
                    const employeeList = composerServices.getEmployeesBelowTarget(rankingReportData, metricInfo.dataKey, metricInfo.goalKey, department);
                    return composerServices.formatEmployeeList(employeeList, metricInfo.dataKey, metricInfo.format);
                }
            }

            const qdcInfoRegex = /^QDC_INFO_(.+)$/;
            const qdcMatch = tag.match(qdcInfoRegex);
            if(qdcMatch && supermarketReport.qdc){
                const itemName = qdcMatch[1];
                const itemData = Object.values(supermarketReport.qdc).find(i => i.name === itemName);
                return itemData ? `SL ${ui.formatNumber(itemData.sl)}, TB ${ui.formatNumber(itemData.sl / currentDay, 1)}/ngày` : '(N/A)';
            }

            const nhInfoRegex = /^NH_INFO_(.+)$/;
            const nhMatch = tag.match(nhInfoRegex);
            if(nhMatch && supermarketReport.nganhHangChiTiet){
                const itemName = nhMatch[1];
                 const itemData = Object.values(supermarketReport.nganhHangChiTiet).find(i => utils.cleanCategoryName(i.name) === itemName);
                return itemData ? `SL ${ui.formatNumber(itemData.quantity)}, TB ${ui.formatNumber(itemData.quantity / currentDay, 1)}/ngày` : '(N/A)';
            }

            return match;
        });
    },

    aggregateReport(reportData, selectedWarehouse = null) {
        if (!reportData || reportData.length === 0) {
            const emptyShell = { doanhThu: 0, doanhThuQuyDoi: 0, dtCE: 0, dtICT: 0, qdc: {}, nganhHangChiTiet: {}, comparisonData: { value: 0, percentage: 'N/A' } };
            const numericKeys = ['doanhThuTraGop', 'doanhThuChuaXuat','doanhThuQuyDoiChuaXuat', 'dtGiaDung', 'dtMLN', 'dtPhuKien', 'slSmartphone', 'slSimOnline', 'slUDDD', 'slBaoHiemDenominator', 'slBaoHiemVAS'];
            numericKeys.forEach(key => emptyShell[key] = 0);
            return emptyShell;
        }

        const supermarketReport = reportData.reduce((acc, curr) => {
            for (const key in curr) {
                if (typeof curr[key] === 'number') {
                    acc[key] = (acc[key] || 0) + curr[key];
                } else if (key === 'qdc' && typeof curr.qdc === 'object') {
                    if (!acc.qdc) acc.qdc = {};
                    for (const qdcKey in curr.qdc) {
                        if (!acc.qdc[qdcKey]) acc.qdc[qdcKey] = { sl: 0, dt: 0, dtqd: 0, name: curr.qdc[qdcKey].name };
                        acc.qdc[qdcKey].sl += curr.qdc[qdcKey].sl;
                        acc.qdc[qdcKey].dt += curr.qdc[qdcKey].dt;
                        acc.qdc[qdcKey].dtqd += curr.qdc[qdcKey].dtqd;
                    }
                }
            }
            acc.maKho = selectedWarehouse || '';
            return acc;
        }, {});

        const aggregatedNganhHang = {};
        reportData.forEach(employee => {
            if (employee.doanhThuTheoNganhHang) {
                Object.entries(employee.doanhThuTheoNganhHang).forEach(([name, values]) => {
                    if (!aggregatedNganhHang[name]) aggregatedNganhHang[name] = { name: name, quantity: 0, revenue: 0, revenueQuyDoi: 0, donGia: 0 };
                    aggregatedNganhHang[name].quantity += values.quantity;
                    aggregatedNganhHang[name].revenue += values.revenue;
                    aggregatedNganhHang[name].revenueQuyDoi += values.revenueQuyDoi;
                });
            }
        });
        for (const name in aggregatedNganhHang) {
            const item = aggregatedNganhHang[name];
            item.donGia = item.quantity > 0 ? item.revenue / item.quantity : 0;
        }
        supermarketReport.nganhHangChiTiet = aggregatedNganhHang;

        supermarketReport.hieuQuaQuyDoi = supermarketReport.doanhThu > 0 ? (supermarketReport.doanhThuQuyDoi / supermarketReport.doanhThu) - 1 : 0;
        supermarketReport.tyLeTraCham = supermarketReport.doanhThu > 0 ? supermarketReport.doanhThuTraGop / supermarketReport.doanhThu : 0;
        supermarketReport.pctGiaDung = supermarketReport.dtCE > 0 ? supermarketReport.dtGiaDung / supermarketReport.dtCE : 0;
        supermarketReport.pctMLN = supermarketReport.dtCE > 0 ? supermarketReport.dtMLN / supermarketReport.dtCE : 0;
        supermarketReport.pctPhuKien = supermarketReport.dtICT > 0 ? supermarketReport.dtPhuKien / supermarketReport.dtICT : 0;
        supermarketReport.pctSim = supermarketReport.slSmartphone > 0 ? supermarketReport.slSimOnline / supermarketReport.slSmartphone : 0;
        supermarketReport.pctVAS = supermarketReport.slSmartphone > 0 ? supermarketReport.slUDDD / supermarketReport.slSmartphone : 0;
        supermarketReport.pctBaoHiem = supermarketReport.slBaoHiemDenominator > 0 ? supermarketReport.slBaoHiemVAS / supermarketReport.slBaoHiemDenominator : 0;

        const pastedLuyKeData = dataProcessing.parseLuyKePastedData(document.getElementById('paste-luyke')?.value || '');
        supermarketReport.comparisonData = pastedLuyKeData.comparisonData;

        if (supermarketReport.qdc) {
            for (const key in supermarketReport.qdc) {
                const group = supermarketReport.qdc[key];
                group.donGia = group.sl > 0 ? group.dt / group.sl : 0;
            }
        }

        return supermarketReport;
    },

    getSupermarketReportFromPastedData(pastedData) {
        const cleanValue = (str) => (typeof str === 'string' ? parseFloat(str.replace(/,|%/g, '')) : (typeof str === 'number' ? str : 0));
        return {
            doanhThu: cleanValue(pastedData.mainKpis['Thực hiện DT thực']) * 1000000,
            doanhThuQuyDoi: cleanValue(pastedData.mainKpis['Thực hiện DTQĐ']) * 1000000,
            pastedHTQD: pastedData.mainKpis['% HT Target Dự Kiến (QĐ)'] || 'N/A',
            comparisonData: pastedData.comparisonData,
        };
    },

    updateEmployeeMaps() {
        appState.employeeMaNVMap.clear();
        appState.employeeNameToMaNVMap.clear();
        appState.danhSachNhanVien.forEach(nv => {
            if (nv.maNV) appState.employeeMaNVMap.set(String(nv.maNV).trim(), nv);
            if (nv.hoTen) appState.employeeNameToMaNVMap.set(nv.hoTen.toLowerCase().replace(/\s+/g, ' '), String(nv.maNV).trim());
        });
    },

    generateThiDuaVungReport(selectedSupermarket) {
        if (!selectedSupermarket || !appState.thiDuaVungChiTiet || appState.thiDuaVungChiTiet.length === 0 || !appState.thiDuaVungTong || appState.thiDuaVungTong.length === 0) {
            return null;
        }

        const findKey = (data, keyword) => {
            if (!data || data.length === 0) return null;
            return Object.keys(data[0]).find(k => k.trim().toLowerCase().includes(keyword.toLowerCase())) || keyword;
        };
        const supermarketKeyTong = findKey(appState.thiDuaVungTong, 'siêu thị');
        const supermarketKeyChiTiet = findKey(appState.thiDuaVungChiTiet, 'siêu thị');
        const tongThuongKey = findKey(appState.thiDuaVungChiTiet, 'tổng thưởng');
        const hangVuotTroiKey = findKey(appState.thiDuaVungChiTiet, 'hạng vượt trội');
        const hangTargetKey = findKey(appState.thiDuaVungChiTiet, 'hạng % target');
        const layTopKey = findKey(appState.thiDuaVungChiTiet, 'lấy top');
        const kenhKey = findKey(appState.thiDuaVungChiTiet, 'kênh');
        const nganhHangKey = findKey(appState.thiDuaVungChiTiet, 'ngành hàng');

        if (!supermarketKeyTong || !supermarketKeyChiTiet) {
            console.error("Không thể tìm thấy cột 'siêu thị' trong dữ liệu.");
            return null;
        }

        const summary = appState.thiDuaVungTong.find(row => row[supermarketKeyTong] === selectedSupermarket);
        if (!summary) return null;

        const chiTiet = appState.thiDuaVungChiTiet.filter(row => row[supermarketKeyChiTiet] === selectedSupermarket);

        if (chiTiet.length > 0 && layTopKey) {
            summary.hangCoGiaiKenh = chiTiet[0][layTopKey];
        } else {
            summary.hangCoGiaiKenh = 'N/A';
        }

        const report = { summary, coGiai: [], sapCoGiai: [], tiemNang: [], canCoGangNhieu: [] };

        const getPotentialPrize = (kenh, nganhHang) => {
            const winningSupermarkets = appState.thiDuaVungChiTiet.filter(sm =>
                sm[kenhKey] === kenh && sm[nganhHangKey] === nganhHang && sm[tongThuongKey] > 0
            );
            if (winningSupermarkets.length === 0) return 0;
            return Math.min(...winningSupermarkets.map(s => s[tongThuongKey]));
        };

        chiTiet.forEach(nganhHang => {
            if (nganhHang[tongThuongKey] > 0) {
                report.coGiai.push(nganhHang);
            } else {
                const hangVuotTroi = nganhHang[hangVuotTroiKey] || Infinity;
                const hangTarget = nganhHang[hangTargetKey] || Infinity;
                const hangCoGiai = nganhHang[layTopKey] || 0;

                const khoangCach = Math.min(
                    (hangVuotTroi > 0 && hangVuotTroi > hangCoGiai) ? hangVuotTroi - hangCoGiai : Infinity,
                    (hangTarget > 0 && hangTarget > hangCoGiai) ? hangTarget - hangCoGiai : Infinity
                );
                nganhHang.khoangCach = khoangCach;

                if (hangCoGiai > 0 && khoangCach <= 20) {
                    nganhHang.thuongTiemNang = getPotentialPrize(nganhHang[kenhKey], nganhHang[nganhHangKey]);
                    report.sapCoGiai.push(nganhHang);
                } else if (hangCoGiai > 0 && khoangCach > 20 && khoangCach <= 40) {
                    report.tiemNang.push(nganhHang);
                } else {
                    report.canCoGangNhieu.push(nganhHang);
                }
            }
        });

        report.coGiai.sort((a, b) => b[tongThuongKey] - a[tongThuongKey]);
        report.sapCoGiai.sort((a, b) => a.khoangCach - b.khoangCach);
        report.tiemNang.sort((a, b) => a.khoangCach - b.khoangCach);

        return report;
    }
};

const services = {
    ...dataProcessing,
    ...reportGeneration,
    ...composerServices
};

export { services };