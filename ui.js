// Version 3.13 - Fix circular dependency by removing uiRealtime from facade
// Version 3.12 - Refactor: Import and merge ui-home.js
// Version 3.11 - Refactor: Move admin functions to ui-admin.js, import ui-filters.js
// MODULE: UI FACADE (Mặt tiền Giao diện)

import { uiComponents } from './ui-components.js';
import { uiLuyke } from './ui-luyke.js';
import { uiSknv } from './ui-sknv.js';
// import { uiRealtime } from './ui-realtime.js'; // <- ĐÃ XÓA IMPORT NÀY
import { uiThiDuaVung } from './ui-thidua-vung.js';
import { uiCompetition } from './ui-competition.js';
import { uiReports } from './ui-reports.js';
import { uiFilters } from './ui-filters.js'; 
import { uiAdmin } from './ui-admin.js';
import { uiHome } from './ui-home.js'; // <<< THÊM MỚI (Từ Bước 1 dọn dẹp cuối)

// Gộp tất cả các hàm từ các module con vào một đối tượng 'ui' duy nhất.
const ui = {
    ...uiComponents,
    ...uiLuyke, 
    ...uiSknv,
    // ...uiRealtime, // <-- ĐÃ XÓA DÒNG NÀY ĐỂ PHÁ VỠ VÒNG LẶP
    ...uiThiDuaVung,
    ...uiCompetition,
    ...uiReports,
    ...uiFilters, 
    ...uiAdmin,  
    ...uiHome, // <<< THÊM MỚI
};

// Xuất khẩu đối tượng 'ui' đã được hợp nhất.
export { ui };