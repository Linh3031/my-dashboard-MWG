// Version 1.0 - Initial extraction from ui-components
// MODULE: UI NOTIFICATIONS
// Chứa các hàm hiển thị thông báo, pop-up và cập nhật bộ đếm.

import { formatters } from './ui-formatters.js';

export const notifications = {
    /**
     * Hiển thị một thông báo pop-up ngắn.
     * @param {string} message - Nội dung thông báo.
     * @param {string} type - 'success' hoặc 'error'.
     */
    showNotification: (message, type = 'success') => {
        const notification = document.getElementById('notification');
        if (!notification) return;
        notification.textContent = message;
        notification.className = `fixed bottom-5 right-5 p-4 rounded-lg shadow-md text-white z-[1200] opacity-0 transition-opacity duration-500 transform translate-y-10 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
        void notification.offsetWidth;
        notification.classList.remove('hidden', 'opacity-0', 'translate-y-10');
        notification.classList.add('opacity-100', 'translate-y-0');

        setTimeout(() => {
             notification.classList.remove('opacity-100', 'translate-y-0');
             notification.classList.add('opacity-0', 'translate-y-10');
             setTimeout(() => notification.classList.add('hidden'), 500);
        }, 3000);
    },

    /**
     * Hiển thị thông báo cập nhật phiên bản (nếu có).
     */
    showUpdateNotification() {
        const notification = document.getElementById('update-notification');
        if (notification) {
             notification.classList.remove('hidden');
             const button = notification.querySelector('button');
             if (button && !button.onclick) {
                button.onclick = () => window.location.reload();
             }
         }
    },

    /**
     * Cập nhật các đồng hồ đếm trên trang chủ.
     * @param {object} statsData - Dữ liệu từ 'analytics/site_stats'.
     */
     updateUsageCounter: (statsData) => {
        const visitorCountEl = document.getElementById('visitor-count');
         const actionCountEl = document.getElementById('action-count');
         const userCountEl = document.getElementById('user-count');
         // Sử dụng formatters trực tiếp
         if (visitorCountEl) visitorCountEl.textContent = statsData?.pageLoads ? formatters.formatNumber(statsData.pageLoads) : '0';
         if (actionCountEl) actionCountEl.textContent = statsData?.actionsTaken ? formatters.formatNumber(statsData.actionsTaken) : '0';
         if (userCountEl) userCountEl.textContent = statsData?.totalUsers ? formatters.formatNumber(statsData.totalUsers) : '0';
     },
};