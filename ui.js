// Version 2.0 - Add new realtime employee report function
// MODULE: UI FACADE (Mặt tiền Giao diện)

import { uiComponents } from './ui-components.js';
import { uiLuyke } from './ui-luyke.js';
import { uiSknv } from './ui-sknv.js';
import { uiRealtime } from './ui-realtime.js';

// Gộp tất cả các hàm từ các module con vào một đối tượng 'ui' duy nhất.
const ui = {
    ...uiComponents,
    ...uiLuyke,
    ...uiSknv,
    ...uiRealtime,
};

// Xuất khẩu đối tượng 'ui' đã được hợp nhất.
export { ui };

