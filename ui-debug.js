// Version 1.0 - Initial extraction from ui-components
// MODULE: UI DEBUG TOOLS
// Chứa các hàm render các bảng chẩn đoán và gỡ lỗi.

import { appState } from './state.js';

export const debugTools = {
    /**
     * Hiển thị kết quả chẩn đoán cho một file đã tải lên.
     * @param {string} fileType - Loại file (ví dụ: 'ycx', 'danhsachnv').
     */
    displayDebugInfo(fileType) {
         const resultsContainer = document.getElementById('debug-results-container');
         if (!fileType) {
             if (resultsContainer) resultsContainer.innerHTML = '<p class="text-gray-500">Chưa có file nào được tải lên để kiểm tra.</p>';
             return;
         }
         if (resultsContainer && resultsContainer.innerHTML.includes('Chưa có file nào')) resultsContainer.innerHTML = '';

         const debugData = appState.debugInfo[fileType];
         if (!debugData) return;

         const fileInputEl = document.querySelector(`#file-${fileType}`);
         const fileName = fileInputEl?.dataset.name || fileType;
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
         if (existingEl) {
              existingEl.innerHTML = tableHTML;
         } else if (resultsContainer) {
             const wrapper = document.createElement('div');
             wrapper.id = `debug-table-${fileType}`;
             wrapper.innerHTML = tableHTML;
             resultsContainer.appendChild(wrapper);
         }
     },

    /**
     * Hiển thị kết quả chẩn đoán cho dữ liệu dán (paste).
     * @param {string} dataType - Loại dữ liệu (ví dụ: 'thiduanv-pasted').
     */
    displayPastedDebugInfo(dataType) {
         const container = document.getElementById('pasted-debug-results-container');
         if (!container) return;

         const debugData = appState.debugInfo[dataType];
         if (!debugData) {
             container.innerHTML = '';
             return;
         }

         let content = `<div class="p-2 border rounded-md bg-white mb-4">
            <h4 class="font-bold text-gray-800 mb-2">Chẩn đoán dữ liệu dán: ${dataType.replace('-pasted', '')}</h4>`;

         if (debugData.found && debugData.found.length > 0) {
             content += '<ul>';
             debugData.found.forEach(item => {
                 content += `<li class="text-sm ${item.status ? 'text-green-700' : 'text-red-700'}"><strong>${item.name}:</strong> ${item.value}</li>`;
             });
             content += '</ul>';
         }

         content += `<p class="text-xs italic mt-2"><strong>Trạng thái xử lý:</strong> ${debugData.status}</p></div>`;
         container.innerHTML = content;
     },

    /**
     * Hiển thị bảng gỡ lỗi cho file Thi Đua Vùng.
     */
    displayThiDuaVungDebugInfo() {
        const resultsContainer = document.getElementById('debug-results-container');
        if (!resultsContainer) return;

        const renderDebugTable = (title, data) => {
             if (!data || data.length === 0) {
                 return `<div class="p-2 border rounded-md bg-white mb-4">
                      <h4 class="font-bold text-gray-800 mb-2">${title}</h4>
                      <p class="text-gray-500">Không có dữ liệu để hiển thị.</p>
                  </div>`;
            }

             const headers = Object.keys(data[0]);
            let tableHTML = `<div class="p-2 border rounded-md bg-white mb-4">
                  <h4 class="font-bold text-gray-800 mb-2">${title}</h4>
                <div class="overflow-x-auto">
                     <table class="min-w-full text-xs">
                        <thead class="bg-gray-100">
                             <tr>${headers.map(h => `<th class="px-2 py-1 text-left font-semibold text-gray-600 whitespace-nowrap">${h}</th>`).join('')}</tr>
                        </thead>
                         <tbody>`;
            data.forEach(row => {
                tableHTML += `<tr class="border-t">`;
                headers.forEach(header => {
                    tableHTML += `<td class="px-2 py-1 font-mono">${row[header] !== undefined ? row[header] : ''}</td>`;
                });
                tableHTML += `</tr>`;
            });

            tableHTML += `</tbody></table></div></div>`;
            return tableHTML;
        };

        const tongRaw = appState.debugInfo?.thiDuaVungTongRaw?.slice(0, 10) || [];
        const chiTietRaw = appState.debugInfo?.thiDuaVungChiTietRaw?.slice(0, 10) || [];

        let finalHTML = renderDebugTable('Thi Đua Vùng - Sheet TONG (10 dòng đầu)', tongRaw);
        finalHTML += renderDebugTable('Thi Đua Vùng - Sheet CHITIET (10 dòng đầu)', chiTietRaw);

        const existingEl = document.getElementById('debug-table-thidua-vung');
        if (existingEl) {
            existingEl.innerHTML = finalHTML;
        } else {
            const wrapper = document.createElement('div');
            wrapper.id = `debug-table-thidua-vung`;
            wrapper.innerHTML = finalHTML;
            resultsContainer.appendChild(wrapper);
        }
    },

    /**
     * Hiển thị bảng gỡ lỗi cho file Thi Đua (dùng để kiểm tra logic lọc).
     * @param {Array} debugResults - Dữ liệu đã xử lý từ service.
     */
    renderCompetitionDebugReport(debugResults) {
         const container = document.getElementById('debug-competition-results');
        if (!container) return;

        if (!debugResults || debugResults.length === 0) {
             container.innerHTML = '<p class="text-gray-600">Không có dữ liệu để phân tích.</p>';
            return;
        }

        const validCount = debugResults.filter(r => r.isOverallValid).length;
        const totalCount = debugResults.length;
        const checkHeaders = ['HTX Hợp lệ', 'Đã thu', 'Chưa hủy', 'Chưa trả', 'Đã xuất'];

        let tableHTML = `
            <div class="p-4 bg-white border rounded-lg">
                <h4 class="font-bold text-lg mb-2">Kết quả Phân tích File: <span class="text-green-600">${validCount}</span> / ${totalCount} dòng hợp lệ</h4>
                 <div class="overflow-x-auto max-h-[600px]">
                     <table class="min-w-full text-xs table-bordered competition-debug-table">
                         <thead class="bg-gray-100 sticky top-0">
                             <tr>
                                <th class="p-2">Người tạo</th>
                                 <th class="p-2">Nhóm hàng</th>
                                 <th class="p-2">HT Xuất</th>
                                 <th class="p-2">TT Thu tiền</th>
                                 <th class="p-2">TT Hủy</th>
                                <th class="p-2">TT Trả</th>
                                 <th class="p-2">TT Xuất</th>
                                 ${checkHeaders.map(h => `<th class="p-2">${h}</th>`).join('')}
                                 <th class="p-2">Tổng thể</th>
                             </tr>
                         </thead>
                        <tbody>`;

        const renderCheck = (status) => `<td class="text-center font-bold text-lg">${status ? '<span class="text-green-500">✅</span>' : '<span class="text-red-500">❌</span>'}</td>`;

        debugResults.forEach(result => {
            const rowClass = result.isOverallValid ? 'bg-green-50' : 'bg-red-50';
            const { rowData, checks, isOverallValid } = result;
             tableHTML += `
                <tr class="${rowClass}">
                     <td class="p-2">${rowData.nguoiTao || ''}</td>
                     <td class="p-2">${rowData.nhomHang || ''}</td>
                     <td class="p-2">${rowData.hinhThucXuat || ''}</td>
                     <td class="p-2">${rowData.trangThaiThuTien || ''}</td>
                    <td class="p-2">${rowData.trangThaiHuy || ''}</td>
                     <td class="p-2">${rowData.tinhTrangTra || ''}</td>
                    <td class="p-2">${rowData.trangThaiXuat || ''}</td>
                    ${renderCheck(checks.isDoanhThuHTX)}
                    ${renderCheck(checks.isThuTien)}
                    ${renderCheck(checks.isChuaHuy)}
                    ${renderCheck(checks.isChuaTra)}
                    ${renderCheck(checks.isDaXuat)}
                    ${renderCheck(isOverallValid)}
                </tr>
            `;
        });

        tableHTML += '</tbody></table></div></div>';
        container.innerHTML = tableHTML;
    },
};