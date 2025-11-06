// Version 1.1 - Refactor: Moved renderCompetitionConfigUI from ui-components.js
// MODULE: UI ADMIN
// Chứa các hàm render cho trang Quản trị (Khai báo).

import { appState } from './state.js';
import { firebase } from './firebase.js';
import { formatters } from './ui-formatters.js';

/**
 * Render bảng thống kê người dùng trong Trang Quản trị.
 * (Đã di chuyển từ ui-components.js)
 */
const renderUserStatsTable = (users) => {
    const container = document.getElementById('user-stats-container');
    if (!container) return;

    if (!users || users.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Không có dữ liệu người dùng.</p>';
        return;
    }

    const sortState = appState.sortState.user_stats || { key: 'lastLogin', direction: 'desc' };
    const { key, direction } = sortState;

    const sortedUsers = [...users].sort((a, b) => {
        let valA = a[key];
            let valB = b[key];

        if (key === 'lastLogin') {
            valA = valA instanceof Date ? valA.getTime() : 0;
            valB = valB instanceof Date ? valB.getTime() : 0;
        }
        else if (key === 'loginCount' || key === 'actionsTaken') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const headerClass = (sortKey) => `px-4 py-3 sortable ${key === sortKey ? (direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`;

    let tableHTML = `
        <div class="overflow-x-auto max-h-[600px]">
            <table class="min-w-full text-sm table-bordered table-striped" data-table-type="user_stats">
                    <thead class="text-xs text-slate-800 uppercase bg-slate-200 font-bold sticky top-0">
                    <tr>
                        <th class="${headerClass('email')}" data-sort="email">Email <span class="sort-indicator"></span></th>
                        <th class="${headerClass('loginCount')} text-right" data-sort="loginCount">Lượt truy cập <span class="sort-indicator"></span></th>
                        <th class="${headerClass('actionsTaken')} text-right" data-sort="actionsTaken">Lượt sử dụng <span class="sort-indicator"></span></th>
                            <th class="${headerClass('lastLogin')} text-right" data-sort="lastLogin">Lần cuối truy cập <span class="sort-indicator"></span></th>
                    </tr>
                </thead>
                <tbody>
    `;

    sortedUsers.forEach(user => {
        const lastLoginDate = user.lastLogin instanceof Date ? user.lastLogin : null;
        const formattedLastLogin = lastLoginDate
            ? `${lastLoginDate.toLocaleDateString('vi-VN')} ${lastLoginDate.toLocaleTimeString('vi-VN')}`
                : 'Chưa rõ';

        tableHTML += `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-2 font-medium text-gray-900">${user.email}</td>
                <td class="px-4 py-2 text-right font-bold">${formatters.formatNumber(user.loginCount || 0)}</td>
                <td class="px-4 py-2 text-right font-bold">${formatters.formatNumber(user.actionsTaken || 0)}</td>
                    <td class="px-4 py-2 text-right">${formattedLastLogin}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table></div>`;
    container.innerHTML = tableHTML;
};

/**
 * Render bảng ánh xạ tên thi đua trong Tab Khai báo.
 * (Đã di chuyển từ ui-components.js)
 */
const renderCompetitionNameMappingTable = () => {
    const container = document.getElementById('competition-name-mapping-container');
    if (!container) return;

    const mappings = appState.competitionNameMappings || {};
    const mappingEntries = Object.entries(mappings);

    if (mappingEntries.length === 0) {
            container.innerHTML = '<p class="text-gray-500 italic">Vui lòng dán dữ liệu "Thi đua nhân viên" ở tab "Cập nhật dữ liệu" để hệ thống tự động trích xuất tên...</p>';
        return;
    }

    let tableHTML = `
        <table class="min-w-full text-sm table-bordered bg-white">
            <thead class="text-xs text-slate-800 uppercase bg-slate-100 font-bold">
                <tr>
                    <th class="px-4 py-2 text-left w-1/2">Tên Gốc (Từ dữ liệu dán)</th>
                        <th class="px-4 py-2 text-left w-1/2">Tên Rút Gọn (Nhập để thay thế)</th>
                </tr>
            </thead>
            <tbody>
    `;

    mappingEntries.forEach(([originalName, shortName]) => {
        tableHTML += `
            <tr class="border-t hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-600 align-top text-xs">
                        ${originalName}
                </td>
                <td class="px-4 py-2 align-top">
                    <input 
                        type="text" 
                        class="competition-name-input w-full p-1 border rounded-md text-sm" 
                            value="${shortName || ''}" 
                        data-original-name="${originalName}"
                        placeholder="Nhập tên rút gọn..."
                    >
                </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
};

/**
 * Điền nội dung vào các trình chỉnh sửa Hướng dẫn trong Trang Quản trị.
 * (Đã di chuyển từ ui-components.js)
 */
const renderAdminHelpEditors = () => {
        if (appState.isAdmin) {
        const dataEl = document.getElementById('edit-help-data');
        if (dataEl) dataEl.value = appState.helpContent.data || '';
        const luykeEl = document.getElementById('edit-help-luyke');
        if (luykeEl) luykeEl.value = appState.helpContent.luyke || '';
        const sknvEl = document.getElementById('edit-help-sknv');
        if (sknvEl) sknvEl.value = appState.helpContent.sknv || '';
        const realtimeEl = document.getElementById('edit-help-realtime');
        if (realtimeEl) realtimeEl.value = appState.helpContent.realtime || '';
    }
};

/**
 * Render nội dung chính của Trang Quản trị (Khai báo).
 * (Đã di chuyển từ ui.js)
 */
const renderAdminPage = async () => {
    if (!appState.isAdmin) return;
    
    // Render bảng thống kê người dùng
    const users = await firebase.getAllUsers();
    renderUserStatsTable(users); // Gọi hàm nội bộ
    
    // Render các trình chỉnh sửa hướng dẫn
    renderAdminHelpEditors(); // Gọi hàm nội bộ

    // Render bảng ánh xạ tên thi đua
    renderCompetitionNameMappingTable(); // Gọi hàm nội bộ
};

/**
 * Render danh sách các chương trình thi đua đã tạo (trong tab Khai báo).
 * (Đã di chuyển từ ui-components.js v3.31)
 */
const renderCompetitionConfigUI = () => {
    const container = document.getElementById(`competition-list-container`);
    if (!container) return;
    const configs = appState.competitionConfigs || [];

    if (configs.length === 0) {
        container.innerHTML = '<p class="text-xs text-center text-gray-500 italic">Chưa có chương trình nào được tạo.</p>';
        return;
    }

    container.innerHTML = configs.map((config, index) => {
            return `
                <div class="p-3 border rounded-lg bg-white flex justify-between items-center shadow-sm">
                    <div>
                        <div class="flex items-center gap-x-2">
                            <p class="font-bold text-gray-800">${config.name}</p>
                        </div>
                        <div class="text-xs text-gray-500 mt-1 space-y-1">
                            <p><strong>Hãng:</strong> <span class="font-semibold text-blue-600">${(config.brands || []).join(', ')}</span></p>
                            <p><strong>Nhóm hàng:</strong> <span class="font-semibold">${(config.groups || []).length > 0 ? (config.groups || []).join(', ') : 'Tất cả'}</span></p>
                        </div>
                    </div>
                    <div class="flex items-center gap-x-2 flex-shrink-0">
                        <button class="edit-competition-btn p-2 rounded-md hover:bg-gray-200 text-gray-600" data-index="${index}" title="Sửa chương trình">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="delete-competition-btn p-2 rounded-md hover:bg-red-100 text-red-600" data-index="${index}" title="Xóa chương trình">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            `;
    }).join('');
};

// Xuất khẩu đối tượng gộp
export const uiAdmin = {
    renderUserStatsTable,
    renderCompetitionNameMappingTable,
    renderAdminHelpEditors,
    renderAdminPage,
    renderCompetitionConfigUI // <<< THÊM MỚI (v1.1)
};