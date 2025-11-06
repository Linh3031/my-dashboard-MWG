// Version 1.0 - Initial extraction from ui-components
// MODULE: UI MODAL MANAGER
// Chứa các hàm thuần túy để quản lý trạng thái hiển thị của Modals và Drawers.

export const modalManager = {
    /**
     * Bật hoặc tắt một modal.
     * @param {string} modalId - ID của modal (ví dụ: 'login-modal').
     * @param {boolean} show - True để hiện, false để ẩn.
     */
    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.toggle('hidden', !show);
    },

    /**
     * Bật hoặc tắt một drawer (thanh cài đặt bên).
     * @param {string} drawerId - ID của drawer (ví dụ: 'interface-drawer').
     * @param {boolean} show - True để hiện, false để ẩn.
     */
    toggleDrawer(drawerId, show) {
        const drawer = document.getElementById(drawerId);
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('drawer-overlay');

        if (!drawer || !sidebar || !overlay) return;
        if (show) {
            drawer.classList.remove('hidden');
            setTimeout(() => {
                 drawer.classList.add('open');
                 sidebar.classList.add('menu-locked');
                 overlay.classList.remove('hidden');
            }, 10);
        } else {
            drawer.classList.remove('open');
            sidebar.classList.remove('menu-locked');
            overlay.classList.add('hidden');
            setTimeout(() => {
                 if (!drawer.classList.contains('open')) {
                     drawer.classList.add('hidden');
                 }
             }, 300);
        }
    },

    /**
     * Đóng tất cả các drawer đang mở.
     */
    closeAllDrawers() {
        // Chúng ta gọi hàm `toggleDrawer` nội bộ
        this.toggleDrawer('interface-drawer', false);
        this.toggleDrawer('goal-drawer', false);
    },
};