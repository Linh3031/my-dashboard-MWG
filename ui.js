// Version 2.3 - Integrate ui-competition module
// MODULE: UI FACADE (Mặt tiền Giao diện)

import { uiComponents } from './ui-components.js';
import { uiLuyke } from './ui-luyke.js';
import { uiSknv } from './ui-sknv.js';
import { uiRealtime } from './ui-realtime.js';
import { uiThiDuaVung } from './ui-thidua-vung.js';
import { uiCompetition } from './ui-competition.js'; // <<< THÊM DÒNG NÀY

// Gộp tất cả các hàm từ các module con vào một đối tượng 'ui' duy nhất.
const ui = {
    ...uiComponents,
    ...uiLuyke,
    ...uiSknv,
    ...uiRealtime,
    ...uiThiDuaVung,
    ...uiCompetition, // <<< VÀ THÊM DÒNG NÀY
};

// Xuất khẩu đối tượng 'ui' đã được hợp nhất.
export { ui };