// Version 2.2 - Integrate ui-thidua-vung module
// MODULE: UI FACADE (Mặt tiền Giao diện)

import { uiComponents } from './ui-components.js';
import { uiLuyke } from './ui-luyke.js';
import { uiSknv } from './ui-sknv.js';
import { uiRealtime } from './ui-realtime.js';
import { uiThiDuaVung } from './ui-thidua-vung.js';

// Gộp tất cả các hàm từ các module con vào một đối tượng 'ui' duy nhất.
const ui = {
    ...uiComponents,
    ...uiLuyke,
    ...uiSknv,
    ...uiRealtime,
    ...uiThiDuaVung,
};

// Xuất khẩu đối tượng 'ui' đã được hợp nhất.
export { ui };