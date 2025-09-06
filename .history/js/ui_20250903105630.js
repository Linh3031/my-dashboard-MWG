// js/ui.js
import appState from './state.js';
import config from './config.js';

const ui = {
    // Hiển thị và ẩn thanh tiến trình
    showProgressBar: (elementId) => document.getElementById(`progress-${elementId}`)?.classList.remove('hidden'),
    hideProgressBar: (elementId) => document.getElementById(`progress-${elementId}`)?.classList.add('hidden'),

    // Hiển thị thông báo (thành công hoặc lỗi)
    showNotification: (message, type = 'success') => {
        const notification = document.getElementById('notification');
        if (!notification) return;
        notification.textContent = message;
        notification.className = `show ${type === 'success' ? 'notification-success' : 'notification-error'}`;
        setTimeout(() => notification.classList.remove('show'), 3000);
    },

    // Các hàm tiện ích để định dạng số và phần trăm
    formatNumber: (value, decimals = 0) => {
        if (isNaN(value) || value === null) return '0';
        return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
    },
    formatNumberOrDash: (value, decimals = 0) => {
        if (!isFinite(value) || value === null || value === 0) return '-';
        return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
    },
    formatPercentage: (value) => {
        if (!isFinite(value) || value === null || value === 0) return '-';
        const roundedPercent = parseFloat((value * 100).toFixed(1));
        const isWholeRounded = Number.isInteger(roundedPercent);
        return new Intl.NumberFormat('vi-VN', { style: 'percent', minimumFractionDigits: isWholeRounded ? 0 : 1, maximumFractionDigits: 1 }).format(value);
    },

    // Hiển thị thông tin gỡ lỗi
    displayDebugInfo(fileType) {
        const container = document.getElementById('debug-tool-container');
        if (!container || container.classList.contains('hidden')) return;
        
        const resultsContainer = document.getElementById('debug-results-container');
        if (!fileType) {
            resultsContainer.innerHTML = '<p class="text-gray-500">Chưa có file nào được tải lên để kiểm tra.</p>';
            return;
        }
        if (resultsContainer.innerHTML.includes('Chưa có file nào')) resultsContainer.innerHTML = '';

        const debugData = appState.debugInfo[fileType];
        if (!debugData) return;

        const fileName = document.querySelector(`#file-${fileType}`)?.dataset.name || fileType;
        let tableHTML = `<div class="p-2 border rounded-md bg-white mb-4"><h4 class="font-bold text-gray-800 mb-2">${fileName}</h4><table class="min-w-full text-sm">
            <thead class="bg-gray-100"><tr><th class="px-2 py-1 text-left font-semibold text-gray-600">Yêu cầu</th><th class="px-2 py-1 text-left font-semibold text-gray-600">Cột tìm thấy</th><th class="px-2 py-1 text-center font-semibold text-gray-600">Trạng thái</th></tr></thead><tbody>`;
        (debugData.required || []).forEach(res => {
            const statusClass = res.status ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
            tableHTML += `<tr class="border-t"><td class="px-2 py-1 font-medium">${res.displayName}</td><td class="px-2 py-1 font-mono">${res.foundName}</td><td class="px-2 py-1 text-center font-bold ${statusClass}">${res.status ? 'OK' : 'LỖI'}</td></tr>`;
        });
        tableHTML += `</tbody></table>`;
        if (debugData.firstFiveMsnv && debugData.firstFiveMsnv.length > 0) {
            tableHTML += `<div class="mt-2 p-2 bg-gray-50 rounded"><p class="text-xs font-semibold">5 MSNV đầu tiên đọc được:</p><ul class="text-xs font-mono list-disc list-inside">${debugData.firstFiveMsnv.map(msnv => `<li>"${msnv}"</li>`).join('')}</ul></div>`;
        }
        tableHTML += `</div>`;

        const existingEl = document.getElementById(`debug-table-${fileType}`);
        if (existingEl) existingEl.innerHTML = tableHTML;
        else {
            const wrapper = document.createElement('div');
            wrapper.id = `debug-table-${fileType}`;
            wrapper.innerHTML = tableHTML;
            resultsContainer.appendChild(wrapper);
        }
    },

    // Hiển thị kết quả thi đua từ dữ liệu dán
    displayCompetitionResultsFromLuyKe: () => {
        const container = document.getElementById('luyke-competition-content');
        if (!container) return;

        const data = appState.competitionData;
        const dataDoanhThu = data.filter(d => d.type === 'doanhThu');
        const dataSoLuong = data.filter(d => d.type === 'soLuong');
        
        const summary = {
            total: data.length,
            dat: data.filter(d => parseFloat(String(d.hoanThanh).replace('%','')) >= 100).length,
        };
        summary.chuaDat = summary.total - summary.dat;
        document.getElementById('luyke-competition-summary').textContent = `(Tổng: ${summary.total}, Đạt: ${summary.dat}, Chưa đạt: ${summary.chuaDat})`;

        const renderTable = (title, items, type) => {
            if(items.length === 0) return '';
            const { key, direction } = appState.sortState[`competition_${type}`];
            
            const sortedItems = [...items].sort((a, b) => {
                let valA = a[key]; let valB = b[key];
                if (key === 'hoanThanh') {
                    valA = parseFloat(String(valA).replace('%', '')) || 0;
                    valB = parseFloat(String(valB).replace('%', '')) || 0;
                }
                return direction === 'asc' ? valA - valB : valB - valA;
            });
            
            const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;
            const today = new Date();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const daysRemaining = daysInMonth - today.getDate();

            const headerColorClass = type === 'doanhthu' ? 'competition-header-doanhthu' : 'competition-header-soluong';

            return `<div class="flex flex-col"><h4 class="text-lg font-bold text-gray-800 p-2 border-b-2 ${headerColorClass}">${title} <span class="text-sm font-normal text-gray-500">(${items.length} chương trình)</span></h4>
                <div class="overflow-x-auto"><table class="min-w-full text-sm table-bordered table-striped" data-table-type="competition_${type}">
                    <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold">
                        <tr>
                            <th class="${headerClass('name')}" data-sort="name">Chương trình<span class="sort-indicator"></span></th>
                            <th class="${headerClass('luyKe')} text-right" data-sort="luyKe">Lũy kế<span class="sort-indicator"></span></th>
                            <th class="${headerClass('target')} text-right" data-sort="target">Target<span class="sort-indicator"></span></th>
                            <th class="${headerClass('hoanThanh')} text-right" data-sort="hoanThanh">% HT<span class="sort-indicator"></span></th>
                            <th class="${headerClass('mucTieuNgay')} text-right header-highlight-special" data-sort="mucTieuNgay" style="max-width: 100px; white-space: normal;">Mục tiêu ngày<span class="sort-indicator"></span></th>
                        </tr>
                    </thead>
                    <tbody>${sortedItems.map(item => {
                        const dailyTarget = daysRemaining > 0 ? (item.target - item.luyKe) / daysRemaining : item.target - item.luyKe;
                        return `<tr class="hover:bg-purple-50">
                            <td class="px-2 py-2 font-semibold">${item.name}</td>
                            <td class="px-2 py-2 text-right font-bold">${this.formatNumberOrDash(item.luyKe, 0)}</td>
                            <td class="px-2 py-2 text-right font-bold">${this.formatNumberOrDash(item.target, 0)}</td>
                            <td class="px-2 py-2 text-right font-bold text-blue-600">${item.hoanThanh}</td>
                            <td class="px-2 py-2 text-right font-bold text-orange-600">${this.formatNumberOrDash(dailyTarget, 0)}</td>
                        </tr>`
                    }).join('')}</tbody></table></div></div>`;
        };

        container.innerHTML = `${renderTable('Thi đua Doanh thu', dataDoanhThu, 'doanhthu')} ${renderTable('Thi đua Số lượng', dataSoLuong, 'soluong')}`;
        if (data.length === 0) container.innerHTML = '<p class="text-gray-500 font-bold col-span-2">Vui lòng dán "Data lũy kế" ở tab "Data".</p>';
    },

    // Đổ dữ liệu các bộ lọc (kho, bộ phận, nhân viên)
    populateAllFilters: () => {
        const warehouses = [...new Set(appState.danhSachNhanVien.map(nv => nv.maKho).filter(Boolean))];
        const departments = [...new Set(appState.danhSachNhanVien.map(nv => nv.boPhan).filter(Boolean))];
        const warehouseOptions = '<option value="">Tất cả kho</option>' + warehouses.map(d => `<option value="${d}">${d}</option>`).join('');
        const departmentOptions = '<option value="">Tất cả bộ phận</option>' + departments.map(d => `<option value="${d}">${d}</option>`).join('');

        ['luyke', 'sknv', 'realtime'].forEach(prefix => {
            document.getElementById(`${prefix}-filter-warehouse`).innerHTML = warehouseOptions;
            document.getElementById(`${prefix}-filter-department`).innerHTML = departmentOptions;
            
            if (appState.choices[`${prefix}_employee`]) appState.choices[`${prefix}_employee`].destroy();
            appState.choices[`${prefix}_employee`] = new Choices(`#${prefix}-filter-name`, { removeItemButton: true, placeholder: true, placeholderValue: 'Tìm & chọn nhân viên...' });
            
            if (appState.choices[`${prefix}_highlight_employee`]) appState.choices[`${prefix}_highlight_employee`].destroy();
            appState.choices[`${prefix}_highlight_employee`] = new Choices(`#${prefix}-highlight-employee`, { removeItemButton: true, placeholder: true, placeholderValue: 'Tìm & chọn nhân viên...' });
        });
        
        document.getElementById('luyke-goal-warehouse-select').innerHTML = '<option value="">-- Chọn kho để cài đặt --</option>' + warehouses.map(w => `<option value="${w}">${w}</option>`).join('');
        this.updateEmployeeFilter('luyke');
        this.updateEmployeeFilter('sknv');
        this.updateEmployeeFilter('realtime');
    },
    // Cập nhật danh sách nhân viên trong bộ lọc khi kho hoặc bộ phận thay đổi
    updateEmployeeFilter: (prefix) => {
        const selectedWarehouse = document.getElementById(`${prefix}-filter-warehouse`).value;
        const selectedDept = document.getElementById(`${prefix}-filter-department`).value;
        const employeeChoices = appState.choices[`${prefix}_employee`];
        if (!employeeChoices) return;
        
        let employees = appState.danhSachNhanVien;
        if (selectedWarehouse) employees = employees.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) employees = employees.filter(nv => nv.boPhan === selectedDept);

        const employeeOptions = employees.map(nv => ({ value: String(nv.maNV).trim(), label: nv.hoTen, selected: false }));
        employeeChoices.clearStore();
        employeeChoices.setChoices(employeeOptions, 'value', 'label', false);
        
        if (prefix === 'sknv') {
            document.getElementById('sknv-employee-filter').innerHTML = '<option value="">-- Chọn nhân viên --</option>' + employees.map(nv => `<option value="${String(nv.maNV).trim()}">${nv.hoTen}</option>`).join('');
        }
    },

    // Hiển thị báo cáo chi tiết của một nhân viên
    displaySknvDetailReport: (employeeData, allDepartmentAverages) => {
        const detailsContainer = document.getElementById('sknv-details-container');
        if (!detailsContainer) return;

        const departmentAverages = allDepartmentAverages[employeeData.boPhan] || {};
        
        const createDetailTableHtml = (title, colorClass, rows) => {
            let rowsHtml = rows.map(row => {
                const evaluation = getEvaluation(row.rawValue, row.rawAverage);
                return `<tr class="border-t"><td class="px-4 py-2 font-medium text-gray-700">${row.label}</td><td class="px-4 py-2 text-right font-bold text-gray-900 ${row.valueClass || ''}">${row.value}</td><td class="px-4 py-2 text-right font-medium text-gray-500">${row.average}</td><td class="px-4 py-2 text-center font-semibold ${evaluation.class}">${evaluation.text}</td></tr>`
            }).join('');
            return `<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"><h4 class="text-lg font-bold p-3 border-b ${colorClass}">${title}</h4><table class="min-w-full text-sm table-bordered table-striped">
                <thead class="sknv-subtable-header"><tr><th class="px-4 py-2 text-left">Chỉ số</th><th class="px-4 py-2 text-right">Giá trị</th><th class="px-4 py-2 text-right">Giá trị TB</th><th class="px-4 py-2 text-center">Đánh giá</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
        };
        
        let evaluationCounts = { above: 0, below: 0, total: 0 };
        const getEvaluation = (value, avgValue) => {
            const result = { text: '-', class: '' };
            if (!isFinite(value) || avgValue === undefined || !isFinite(avgValue) || avgValue === 0) return result;
            evaluationCounts.total++;
            if (value >= avgValue) { result.text = 'Trên TB'; result.class = 'text-green-600'; evaluationCounts.above++; } 
            else { result.text = 'Dưới TB'; result.class = 'cell-performance is-below text-red-600'; evaluationCounts.below++; }
            return result;
        };
        
        const { mucTieu } = employeeData;
        const doanhThuData = [
            { label: 'Doanh thu thực', value: this.formatNumberOrDash(employeeData.doanhThu / 1000000, 2), average: this.formatNumberOrDash((departmentAverages.doanhThu || 0) / 1000000, 2), rawValue: employeeData.doanhThu, rawAverage: departmentAverages.doanhThu },
            { label: 'Doanh thu quy đổi', value: this.formatNumberOrDash(employeeData.doanhThuQuyDoi / 1000000, 2), average: this.formatNumberOrDash((departmentAverages.doanhThuQuyDoi || 0) / 1000000, 2), rawValue: employeeData.doanhThuQuyDoi, rawAverage: departmentAverages.doanhThuQuyDoi },
            { label: '% Quy đổi', value: this.formatPercentage(employeeData.hieuQuaQuyDoi), valueClass: employeeData.hieuQuaQuyDoi < (mucTieu.phanTramQD/100) ? 'cell-performance is-below' : '', average: this.formatPercentage(departmentAverages.hieuQuaQuyDoi), rawValue: employeeData.hieuQuaQuyDoi, rawAverage: departmentAverages.hieuQuaQuyDoi },
            { label: '% Trả chậm', value: this.formatPercentage(employeeData.tyLeTraCham), valueClass: employeeData.tyLeTraCham < (mucTieu.phanTramTC/100) ? 'cell-performance is-below' : '', average: this.formatPercentage(departmentAverages.tyLeTraCham), rawValue: employeeData.tyLeTraCham, rawAverage: departmentAverages.tyLeTraCham }
        ];
        const nangSuatData = [
            { label: 'Thưởng nóng', value: this.formatNumberOrDash(employeeData.thuongNong / 1000000, 2), average: this.formatNumberOrDash((departmentAverages.thuongNong || 0) / 1000000, 2), rawValue: employeeData.thuongNong, rawAverage: departmentAverages.thuongNong },
            { label: 'Thưởng ERP', value: this.formatNumberOrDash(employeeData.thuongERP / 1000000, 2), average: this.formatNumberOrDash((departmentAverages.thuongERP || 0) / 1000000, 2), rawValue: employeeData.thuongERP, rawAverage: departmentAverages.thuongERP },
            { label: 'Thu nhập dự kiến', value: this.formatNumberOrDash(employeeData.thuNhapDuKien / 1000000, 2), average: this.formatNumberOrDash((departmentAverages.thuNhapDuKien || 0) / 1000000, 2), rawValue: employeeData.thuNhapDuKien, rawAverage: departmentAverages.thuNhapDuKien },
            { label: 'Doanh thu QĐ/GC', value: this.formatNumberOrDash(employeeData.gioCong > 0 ? employeeData.doanhThuQuyDoi / employeeData.gioCong : 0, 0), average: this.formatNumberOrDash((departmentAverages.gioCong || 0) > 0 ? (departmentAverages.doanhThuQuyDoi || 0) / departmentAverages.gioCong : 0, 0), rawValue: employeeData.gioCong > 0 ? employeeData.doanhThuQuyDoi / employeeData.gioCong : 0, rawAverage: (departmentAverages.gioCong || 0) > 0 ? (departmentAverages.doanhThuQuyDoi || 0) / departmentAverages.gioCong : 0 }
        ];
        
        const doanhthuHtml = createDetailTableHtml('Doanh thu & Hiệu quả', 'header-bg-blue', doanhThuData);
        const nangsuatHtml = createDetailTableHtml('Năng suất & Thu nhập', 'header-bg-green', nangSuatData);

        const titleHtml = `CHI TIẾT - ${employeeData.hoTen} <span class="font-normal text-sm">(Trên TB: <span class="font-bold text-green-300">${evaluationCounts.above}</span>, Dưới TB: <span class="font-bold text-yellow-300">${evaluationCounts.below}</span> / Tổng: ${evaluationCounts.total})</span>`;

        detailsContainer.innerHTML = `<div class="p-4 mb-6 bg-blue-600 text-white rounded-lg shadow-lg border border-blue-700"><h3 class="text-2xl font-bold text-center uppercase">${titleHtml}</h3></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${doanhthuHtml}
                ${nangsuatHtml}
            </div>`;
    },
};

export default ui;
