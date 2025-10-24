// Version 3.8 - Final Merge: Add renderAdminPage
// MODULE: UI FACADE (Mặt tiền Giao diện)

import { uiComponents } from './ui-components.js';
import { uiLuyke } from './ui-luyke.js';
import { uiSknv } from './ui-sknv.js';
import { uiRealtime } from './ui-realtime.js';
import { uiThiDuaVung } from './ui-thidua-vung.js';
import { uiCompetition } from './ui-competition.js';
import { appState } from './state.js'; // <<< GĐ 4: Đã thêm
import { firebase } from './firebase.js'; // <<< GĐ 4: Đã thêm

// Gộp tất cả các hàm từ các module con vào một đối tượng 'ui' duy nhất.
const ui = {
    ...uiComponents,
    ...uiLuyke, 
    ...uiSknv,
    ...uiRealtime,
    ...uiThiDuaVung,
    ...uiCompetition,

    // === START: GIAI ĐOẠN 4 ===
    async renderAdminPage() {
        if (!appState.isAdmin) return;
        
        // Render bảng thống kê người dùng
        const users = await firebase.getAllUsers();
        this.renderUserStatsTable(users); // Hàm này nằm trong ui-components
        
        // Render các trình chỉnh sửa hướng dẫn (hàm cũ)
        this.renderAdminHelpEditors(); // Hàm này nằm trong ui-components
    }
    // === END: GIAI ĐOẠN 4 ===
};

// Xuất khẩu đối tượng 'ui' đã được hợp nhất.
export { ui };