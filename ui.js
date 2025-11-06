// Version 3.11 - Refactor: Move admin functions to ui-admin.js, import ui-filters.js
// MODULE: UI FACADE (Mặt tiền Giao diện)

import { uiComponents } from './ui-components.js';
import { uiLuyke } from './ui-luyke.js';
import { uiSknv } from './ui-sknv.js';
import { uiRealtime } from './ui-realtime.js';
import { uiThiDuaVung } from './ui-thidua-vung.js';
import { uiCompetition } from './ui-competition.js';
import { uiReports } from './ui-reports.js';
import { uiFilters } from './ui-filters.js'; // <<< THÊM MỚI (Từ Kế hoạch)
import { uiAdmin } from './ui-admin.js'; // <<< THÊM MỚI (Từ Bước 1)
// Xóa import appState và firebase (không còn cần thiết ở đây)

// Gộp tất cả các hàm từ các module con vào một đối tượng 'ui' duy nhất.
const ui = {
    ...uiComponents,
    ...uiLuyke, 
    ...uiSknv,
    ...uiRealtime,
    ...uiThiDuaVung,
    ...uiCompetition,
    ...uiReports,
    ...uiFilters, // <<< THÊM MỚI
    ...uiAdmin,  // <<< THÊM MỚI

    // Hàm renderAdminPage đã được di chuyển sang ui-admin.js
};

// Xuất khẩu đối tượng 'ui' đã được hợp nhất.
export { ui };