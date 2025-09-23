// Version 2.9 - Ensure all UI modules are correctly integrated
// MODULE: UI FACADE (Mặt tiền Giao diện)
// File này đóng vai trò "tổng đài", hợp nhất tất cả các module UI con
// để toàn bộ ứng dụng có thể truy cập chúng một cách nhất quán.

import { uiComponents } from './ui-components.js';
import { uiLuyke } from './ui-luyke.js';
import { uiSknv } from './ui-sknv.js';
import { uiRealtime } from './ui-realtime.js';

// Gộp tất cả các hàm từ các module con vào một đối tượng 'ui' duy nhất.
// Bằng cách này, bất kỳ thay đổi nào trong uiSknv hay uiRealtime
// sẽ tự động được cập nhật vào đối tượng 'ui' này.
const ui = {
    ...uiComponents,
    ...uiLuyke,
    ...uiSknv,
    ...uiRealtime,
};

// Xuất khẩu đối tượng 'ui' đã được hợp nhất để các module khác sử dụng.
export { ui };