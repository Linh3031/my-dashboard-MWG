// Version 3.3 - Make department sorting more robust
// MODULE: UTILITIES
// Chứa các hàm tiện ích chung không thuộc về logic hay giao diện cụ thể.
import { ui } from './ui.js';

export const utils = {
    getRandomBrightColor() {
        const colors = [
            '#ef4444', // red-500
            '#f97316', // orange-500
            '#eab308', // yellow-500
            '#84cc16', // lime-500
            '#22c55e', // green-500
            '#10b981', // emerald-500
            '#14b8a6', // teal-500
            '#06b6d4', // cyan-500
            '#3b82f6', // blue-500
            '#8b5cf6', // violet-500
            '#d946ef', // fuchsia-500
            '#ec4899', // pink-500
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    cleanCategoryName(name) {
        if (!name || typeof name !== 'string') return '';
        // Bỏ mã số, khoảng trắng thừa, và viết hoa chữ cái đầu mỗi từ.
        return name
            .replace(/^\d+\s*-\s*/, '')
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },

    exportTableToExcel(activeTabContent, fileName) {
        if (!activeTabContent) {
            ui.showNotification('Không tìm thấy tab đang hoạt động để xuất.', 'error');
            return;
        }
        let table = activeTabContent.querySelector('.department-block table, #sknv-summary-container table, #luyke-competition-content table, table');
        if (!table) {
            ui.showNotification('Không tìm thấy bảng dữ liệu trong tab này để xuất.', 'error');
            return;
        }
        try {
            const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
            XLSX.writeFile(wb, `${fileName}.xlsx`);
            ui.showNotification(`Đã xuất file ${fileName}.xlsx thành công!`, 'success');
        } catch (e) {
            console.error('Lỗi xuất Excel:', e);
            ui.showNotification('Có lỗi xảy ra khi xuất file Excel.', 'error');
        }
    },

    // <<< START: UPDATED FUNCTION >>>
    getSortedDepartmentList(reportData) {
        const allDepts = [...new Set(reportData.map(item => item.boPhan).filter(Boolean))];

        allDepts.sort((a, b) => {
            const aIsPriority = a.includes('Tư Vấn - ĐM');
            const bIsPriority = b.includes('Tư Vấn - ĐM');

            if (aIsPriority && !bIsPriority) {
                return -1; // a comes first
            }
            if (!aIsPriority && bIsPriority) {
                return 1; // b comes first
            }
            // If both are priority or both are not, sort alphabetically
            return a.localeCompare(b);
        });

        return allDepts;
    },
    // <<< END: UPDATED FUNCTION >>>
};