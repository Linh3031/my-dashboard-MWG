// Version 2.0 - Read declarations from appState instead of localStorage
// MODULE: SERVICES - DATA PROCESSING
// Chứa các hàm xử lý, chuẩn hóa, và phân tích cú pháp dữ liệu thô.

import { config } from '../config.js';
import { appState } from '../state.js';
import { utils } from '../utils.js';

export const dataProcessing = {
    /**
     * Phân tích một tập dữ liệu YCX thô để gỡ lỗi các điều kiện lọc thi đua.
     * @param {Array} rawTestData - Dữ liệu YCX thô từ file người dùng tải lên.
     * @returns {Array} - Một mảng các đối tượng, mỗi đối tượng chứa dữ liệu hàng và kết quả của từng bước kiểm tra.
     */
    debugCompetitionFiltering(rawTestData) {
        if (!rawTestData || rawTestData.length === 0) {
            return [];
        }

        const { normalizedData } = this.normalizeData(rawTestData, 'ycx');
        if (normalizedData.length === 0) {
            return [];
        }

        const hinhThucXuatTinhDoanhThu = this.getHinhThucXuatTinhDoanhThu();

        const debugResults = normalizedData.map(row => {
            const checks = {
                isDoanhThuHTX: hinhThucXuatTinhDoanhThu.has(row.hinhThucXuat),
                isThuTien: (row.trangThaiThuTien || "").trim() === 'Đã thu',
                isChuaHuy: (row.trangThaiHuy || "").trim() === 'Chưa hủy',
                isChuaTra: (row.tinhTrangTra || "").trim() === 'Chưa trả',
                isDaXuat: (row.trangThaiXuat || "").trim() === 'Đã xuất'
            };

            const isOverallValid = checks.isDoanhThuHTX && checks.isThuTien && checks.isChuaHuy && checks.isChuaTra && checks.isDaXuat;

            return {
                rowData: row,
                checks: checks,
                isOverallValid: isOverallValid
            };
        });

        return debugResults;
    },

    normalizeCategoryStructureData(rawData) {
        if (!rawData || rawData.length === 0) {
            return { success: false, error: 'File rỗng.', normalizedData: [] };
        }
        const header = Object.keys(rawData[0] || {});

        const nganhHangCol = this.findColumnName(header, ['ngành hàng', 'nganh hang']);
        const nhomHangCol = this.findColumnName(header, ['nhóm hàng', 'nhom hang']);

        if (!nganhHangCol || !nhomHangCol) {
            return { success: false, error: 'File phải có cột "Ngành hàng" và "Nhóm hàng".', normalizedData: [] };
        }

        const normalizedData = rawData
            .map(row => ({
                nganhHang: String(row[nganhHangCol] || '').trim(),
                nhomHang: String(row[nhomHangCol] || '').trim(),
            }))
            .filter(item => item.nganhHang && item.nhomHang);

        return { success: true, normalizedData };
    },

    normalizeBrandData(rawData) {
        if (!rawData || rawData.length === 0) {
            return { success: false, error: 'Sheet "Hãng" rỗng.', normalizedData: [] };
        }
        const header = Object.keys(rawData[0] || {});
        const brandCol = this.findColumnName(header, ['hãng', 'tên hãng', 'nhà sản xuất']);
        if (!brandCol) {
            return { success: false, error: 'Sheet "Hãng" phải có cột "Hãng" hoặc "Tên Hãng".', normalizedData: [] };
        }

        const normalizedData = rawData
            .map(row => String(row[brandCol] || '').trim())
            .filter(brand => brand);

        return { success: true, normalizedData: [...new Set(normalizedData)].sort() };
    },

    // === START: CẬP NHẬT LOGIC ĐỌC KHAI BÁO ===
    getHinhThucXuatTinhDoanhThu: () => {
        const declarationData = appState.declarations.hinhThucXuat;
        if (declarationData) return new Set(declarationData.split('\n').map(l => l.trim()).filter(Boolean));
        return new Set(config.DEFAULT_DATA.HINH_THUC_XUAT_TINH_DOANH_THU);
    },

    getHinhThucXuatTraGop: () => {
        const declarationData = appState.declarations.hinhThucXuatGop;
        if (declarationData) return new Set(declarationData.split('\n').map(l => l.trim()).filter(Boolean));
        return new Set(config.DEFAULT_DATA.HINH_THUC_XUAT_TRA_GOP);
    },

    getHeSoQuyDoi: () => {
        const declarationData = appState.declarations.heSoQuyDoi;
        const heSoMap = {};
        if (declarationData) {
            declarationData.split('\n').filter(l => l.trim()).forEach(line => {
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
    // === END: CẬP NHẬT LOGIC ĐỌC KHAI BÁO ===

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
            const foundName = this.findColumnName(header, aliases);
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
        if (!pastedText || !pastedText.trim()) return [];
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
        const defaults = {
            mainKpis: {},
            comparisonData: { value: 0, percentage: 'N/A' },
            luotKhachData: { value: 0, percentage: 'N/A' },
            dtDuKien: 0,
            dtqdDuKien: 0,
        };
        if (!text) return defaults;

        const allLines = text.split('\n').map(line => line.trim());
        const textContent = allLines.join(' ');

        const patterns = {
            'Thực hiện DT thực': /DTLK\s+([\d,.]+)/,
            'Thực hiện DTQĐ': /DTQĐ\s+([\d,.]+)/,
            '% HT Target Dự Kiến (QĐ)': /% HT Target Dự Kiến \(QĐ\)\s+([\d.]+%?)/,
            'Tỷ Trọng Trả Góp': /Tỷ Trọng Trả Góp\s+([\d.]+%?)/,
        };

        for (const [key, regex] of Object.entries(patterns)) {
            const match = textContent.match(regex);
            if (match && match[1]) {
                defaults.mainKpis[key] = match[1];
            }
        }

        const findValueAfterKeyword = (lines, keyword, isQd = false) => {
            let keywordRegex;
            if (isQd) {
                keywordRegex = new RegExp(keyword.replace('(', '\\(').replace(')', '\\)'));
            } else {
                keywordRegex = new RegExp(`^${keyword}$`);
            }

            const index = lines.findIndex(line => keywordRegex.test(line) && !/lượt khách/i.test(line));
            if (index !== -1 && index + 1 < lines.length) {
                return parseFloat(lines[index + 1].replace(/,/g, '')) || 0;
            }
            return 0;
        };

        defaults.dtDuKien = findValueAfterKeyword(allLines, "DT Dự Kiến");
        defaults.dtqdDuKien = findValueAfterKeyword(allLines, "DT Dự Kiến (QĐ)", true);

        const dtckIndex = allLines.findIndex(line => line.includes('DTCK Tháng'));
        if (dtckIndex !== -1 && dtckIndex + 1 < allLines.length) {
            const valueLine = allLines[dtckIndex + 1];
            const values = valueLine.split(/\s+/);
            if (values.length >= 2) {
                defaults.comparisonData = {
                    value: parseFloat(values[0].replace(/,/g, '')) || 0,
                    percentage: values[1] || 'N/A'
                };
            }
        }

        const luotKhachIndex = allLines.findIndex(line => line.includes('Lượt Khách CK Tháng'));
        if (luotKhachIndex !== -1 && luotKhachIndex + 1 < allLines.length) {
            const valueLine = allLines[luotKhachIndex + 1];
            const values = valueLine.split(/\s+/);
            if (values.length >= 2) {
                defaults.luotKhachData = {
                    value: parseFloat(values[0].replace(/,/g, '')) || 0,
                    percentage: values[1] || 'N/A'
                };
            }
        }

        return defaults;
    },

    parseCompetitionDataFromLuyKe: (text) => {
        if (!text || !text.trim()) return [];
        const lines = text.split('\n').map(l => l.trim());
        const results = [];
        let currentCompetition = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.toLowerCase().startsWith('thi đua')) {
                if (currentCompetition) results.push(currentCompetition);
                currentCompetition = {
                    name: line.replace("Thi đua doanh thu", "DT").replace("Thi đua số lượng", "SL"),
                    type: line.toLowerCase().includes('doanh thu') ? 'doanhThu' : 'soLuong',
                    luyKe: 0, target: 0, hoanThanh: '0%'
                };
            } else if (currentCompetition) {
                if (line.startsWith('DTLK') || line.startsWith('SLLK') || line.startsWith('DTQĐ')) {
                    if (i + 1 < lines.length) {
                        currentCompetition.luyKe = parseFloat(lines[i + 1].replace(/,/g, '')) || 0;
                    }
                } else if (line.startsWith('Target')) {
                    if (i + 1 < lines.length) {
                        currentCompetition.target = parseFloat(lines[i + 1].replace(/,/g, '')) || 0;
                    }
                } else if (line.startsWith('% HT Dự Kiến')) {
                    if (i + 1 < lines.length) {
                        currentCompetition.hoanThanh = lines[i + 1] || '0%';
                    }
                }
            }
        }
        if (currentCompetition) results.push(currentCompetition);

        appState.competitionData = results;
        return results;
    },

    processThiDuaNhanVienData(pastedText, luykeCompetitionData) {
        const debugInfo = { required: [], found: [], status: 'Chưa xử lý' };
        appState.debugInfo['thiduanv-pasted'] = debugInfo;

        if (!pastedText.trim() || !appState.danhSachNhanVien.length || !luykeCompetitionData.length) {
            debugInfo.status = 'Lỗi: Thiếu dữ liệu đầu vào (dán Thi đua NV, DSNV, hoặc dán Data Lũy kế).';
            return [];
        }

        const lines = pastedText.trim().split('\n').map(l => l.trim());
        const competitionCategories = [];
        const employeePastedDataMap = new Map();

        let isParsingCategories = false;
        let isParsingEmployees = false;

        for (const line of lines) {
            if (line.includes('Phòng ban')) {
                isParsingCategories = true;
                continue;
            }
            if (line.includes('Tổng')) {
                isParsingCategories = false;
                isParsingEmployees = true;
                continue;
            }
            if (isParsingCategories && line) {
                competitionCategories.push(line);
            }
            if (isParsingEmployees && line) {
                const row = line.split('\t').map(item => item.trim());
                const msnv = row[0];
                if (msnv) {
                    employeePastedDataMap.set(msnv, row.slice(2).map(val => parseFloat(val.replace(/,/g, '')) || 0));
                }
            }
        }

        debugInfo.found.push({
            name: 'Số cột thi đua đã nhận dạng',
            value: `${competitionCategories.length} cột`,
            status: competitionCategories.length > 0
        });
        debugInfo.found.push({
            name: 'Số dòng nhân viên đã nhận dạng',
            value: `${employeePastedDataMap.size} dòng`,
            status: employeePastedDataMap.size > 0
        });

        const cleanCompetitionName = (name) => name.replace(/thi đua doanh thu bán hàng|thi đua doanh thu|thi đua số lượng/gi, "").trim();

        const competitionTargets = luykeCompetitionData.map(comp => ({
            originalName: comp.name,
            cleanedName: cleanCompetitionName(comp.name),
            target: comp.target
        }));

        const totalEmployeesInSupermarket = appState.danhSachNhanVien.length;
        if (totalEmployeesInSupermarket === 0) {
            debugInfo.status = 'Lỗi: Danh sách nhân viên trống.';
            return [];
        }

        const finalReport = appState.danhSachNhanVien.map(employee => {
            const salesData = employeePastedDataMap.get(employee.maNV) || [];

            const employeeResult = {
                maNV: employee.maNV,
                hoTen: employee.hoTen,
                completedCount: 0,
                totalCompetitions: competitionCategories.length,
                competitions: []
            };

            competitionCategories.forEach((categoryName, index) => {
                const cleanedName = cleanCompetitionName(categoryName);
                const matchedTarget = competitionTargets.find(t => t.cleanedName === cleanedName);
                const groupTarget = matchedTarget ? matchedTarget.target : 0;
                const individualTarget = totalEmployeesInSupermarket > 0 ? groupTarget / totalEmployeesInSupermarket : 0;
                const actualSales = salesData[index] || 0;
                const percentExpected = individualTarget > 0 ? actualSales / individualTarget : (actualSales > 0 ? Infinity : 0);

                if (percentExpected >= 1) {
                    employeeResult.completedCount++;
                }

                employeeResult.competitions.push({
                    tenNganhHang: categoryName,
                    thucHien: actualSales,
                    mucTieu: individualTarget,
                    conLai: actualSales - individualTarget,
                    percentExpected: percentExpected,
                });
            });

            employeeResult.completionRate = employeeResult.totalCompetitions > 0 ? employeeResult.completedCount / employeeResult.totalCompetitions : 0;
            return employeeResult;
        });

        debugInfo.status = `Thành công: Đã xử lý báo cáo cho ${finalReport.length} nhân viên.`;
        return finalReport;
    },

    parsePastedThiDuaTableData(rawText) {
        if (!rawText || !rawText.trim()) {
            return { success: false, error: 'Dữ liệu đầu vào rỗng.' };
        }

        const lines = rawText.split('\n').map(line => line.trim()).filter(line => line);

        const mainHeaders = [];
        let startHeaderIndex = lines.findIndex(line => line.includes('Phòng ban'));

        if (startHeaderIndex === -1) {
            return { success: false, error: 'Không tìm thấy dòng "Phòng ban".' };
        }

        for (let i = startHeaderIndex + 1; i < lines.length; i++) {
            const currentLine = lines[i];
            if (currentLine.startsWith('SLLK') || currentLine.startsWith('DTQĐ')) {
                break;
            }
            mainHeaders.push(currentLine);
        }

        let subHeaderLine = lines
            .filter(line => line.startsWith('SLLK') || line.startsWith('DTQĐ'))
            .join('\t');
        const subHeaders = subHeaderLine.split(/\s+/).filter(Boolean);

        const dataRows = [];
        for (const line of lines) {
            const parts = line.split(/\s{2,}|\t/);
            if (parts.length > 1 && /^-?[\d,.]+$/.test(parts[1].trim())) {
                const name = parts[0];
                const values = parts.slice(1);
                dataRows.push({ name, values });
            }
        }

        if (mainHeaders.length === 0 || dataRows.length === 0) {
            return { success: false, error: 'Không thể xử lý dữ liệu. Định dạng không hợp lệ.' };
        }

        return { success: true, mainHeaders, subHeaders, dataRows };
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
            const hoTen = String(row.hoTen || '').trim().replace(/\s+/g, ' ');
            let foundMaNV = maNV || appState.employeeNameToMaNVMap.get(hoTen.toLowerCase()) || null;
            if (foundMaNV) currentMaNV = foundMaNV;

            if (currentMaNV && gioCongByMSNV[currentMaNV] === undefined) {
                gioCongByMSNV[currentMaNV] = 0;
            }

            const gioCongValue = parseFloat(String(row.tongGioCong || '0').replace(/,/g, '')) || 0;
            if (currentMaNV && gioCongValue > 0) {
                gioCongByMSNV[currentMaNV] += gioCongValue;
            }
        }
        return gioCongByMSNV;
    },

    _findHeaderAndProcess(sheet, requiredKeywords) {
        if (!sheet) return [];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
        if (rows.length === 0) return [];

        let headerRowIndex = -1;
        let foundHeaders = [];

        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const row = rows[i];
            const lowerCaseRow = row.map(cell => String(cell || '').trim().toLowerCase());

            const allKeywordsFound = requiredKeywords.every(keyword =>
                lowerCaseRow.some(cell => cell.includes(keyword))
            );

            if (allKeywordsFound) {
                headerRowIndex = i;
                foundHeaders = rows[i].map(cell => String(cell || '').trim());
                break;
            }
        }

        if (headerRowIndex === -1) {
            throw new Error(`Không tìm thấy dòng tiêu đề chứa đủ các từ khóa: ${requiredKeywords.join(', ')}.`);
        }

        const dataRows = rows.slice(headerRowIndex + 1);
        const jsonData = dataRows.map(row => {
            const obj = {};
            foundHeaders.forEach((header, index) => {
                if (header) {
                    const value = row[index];
                    const upperKey = header.toUpperCase();
                    if (upperKey.includes('KÊNH') || upperKey.includes('SIÊU THỊ') || upperKey.includes('NGÀNH HÀNG') || upperKey.includes('TỈNH') || upperKey.includes('BOSS')) {
                        obj[header] = value;
                    } else if (typeof value === 'string' && value.includes('%')) {
                        obj[header] = parseFloat(value.replace(/%|,/g, '')) / 100 || 0;
                    } else if (value !== null && value !== undefined) {
                        obj[header] = parseFloat(String(value).replace(/,/g, '')) || 0;
                    } else {
                        obj[header] = 0;
                    }
                }
            });
            return obj;
        }).filter(obj => {
            const supermarketKey = Object.keys(obj).find(k => k.toLowerCase().includes('siêu thị'));
            return supermarketKey && obj[supermarketKey];
        });

        return jsonData;
    },

    processThiDuaVungFile(workbook) {
        const sheetNames = workbook.SheetNames;
        const chiTietSheet = workbook.Sheets[sheetNames.find(name => name.toUpperCase().includes('CHITIET'))];
        const tongSheet = workbook.Sheets[sheetNames.find(name => name.toUpperCase().includes('TONG'))];

        if (!chiTietSheet || !tongSheet) {
            throw new Error('File Excel phải chứa sheet có tên chứa "CHITIET" và "TONG".');
        }

        const chiTietData = this._findHeaderAndProcess(chiTietSheet, ['siêu thị', 'ngành hàng', 'kênh']);
        const tongData = this._findHeaderAndProcess(tongSheet, ['siêu thị', 'tổng thưởng']);

        return { chiTietData, tongData };
    },
};