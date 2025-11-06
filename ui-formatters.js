// Version 1.0 - Initial extraction from ui-components
// MODULE: UI FORMATTERS
// Chứa các hàm thuần túy để định dạng dữ liệu (tách ra từ ui-components.js)
// Những hàm này không phụ thuộc vào DOM hoặc appState.

export const formatters = {
    /**
     * Định dạng số theo chuẩn Việt Nam.
     * @param {number} value - Giá trị số.
     * @param {number} decimals - Số chữ số thập phân.
     * @returns {string} - Chuỗi đã định dạng.
     */
    formatNumber: (value, decimals = 0) => {
        if (isNaN(value) || value === null) return '0';
        return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
    },

    /**
     * Định dạng doanh thu (chia cho 1 triệu) và trả về chuỗi.
     * @param {number} value - Giá trị doanh thu.
     * @param {number} decimals - Số chữ số thập phân.
     * @returns {string} - Chuỗi đã định dạng (ví dụ: '1.5' hoặc '-')
     */
    formatRevenue(value, decimals = 1) {
         if (!isFinite(value) || value === null || value === 0) return '-';
         const millions = value / 1000000;
         const roundedValue = parseFloat(millions.toFixed(decimals));
         if (roundedValue === 0 && millions !== 0) {
              return millions > 0 ? '> 0' : '< 0';
         }
         return new Intl.NumberFormat('vi-VN', {
             minimumFractionDigits: 0,
             maximumFractionDigits: decimals
         }).format(roundedValue);
     },

     /**
      * Định dạng số, trả về '-' nếu là 0.
      * @param {number} value - Giá trị số.
      * @param {number} decimals - Số chữ số thập phân.
      * @returns {string} - Chuỗi đã định dạng (ví dụ: '1.5' hoặc '-')
      */
     formatNumberOrDash: (value, decimals = 1) => {
         if (!isFinite(value) || value === null || value === 0) return '-';
          const roundedValue = parseFloat(value.toFixed(decimals));
          if (roundedValue === 0 && value !== 0) {
               return value > 0 ? '> 0' : '< 0';
          }
           if (roundedValue === 0) return '-';
          return new Intl.NumberFormat('vi-VN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: decimals
          }).format(roundedValue);
      },

      /**
       * Định dạng số thành phần trăm (nhân 100).
       * @param {number} value - Giá trị (ví dụ: 0.25).
       * @param {number} decimals - Số chữ số thập phân.
       * @returns {string} - Chuỗi đã định dạng (ví dụ: '25%')
       */
     formatPercentage: (value, decimals = 0) => {
         if (!isFinite(value) || value === null) return '-';
          if (value === 0) return '-';
          const percentageValue = value * 100;
          const roundedValue = parseFloat(percentageValue.toFixed(decimals));
          if (roundedValue === 0 && percentageValue !== 0) {
             return percentageValue > 0 ? '> 0%' : '< 0%';
          }
         return new Intl.NumberFormat('vi-VN', {
             minimumFractionDigits: decimals,
              maximumFractionDigits: decimals
          }).format(roundedValue) + '%';
      },

    /**
     * Chuyển đổi đối tượng Date thành chuỗi "X [phút/giờ/ngày] trước".
     * @param {Date} date - Đối tượng Date.
     * @returns {string} - Chuỗi thời gian tương đối.
     */
    formatTimeAgo(date) {
         if (!date || !(date instanceof Date) || isNaN(date)) return '';
         const seconds = Math.floor((new Date() - date) / 1000);
         let interval = seconds / 31536000;
         if (interval > 1) return Math.floor(interval) + " năm trước";
         interval = seconds / 2592000;
         if (interval > 1) return Math.floor(interval) + " tháng trước";
         interval = seconds / 86400;
         if (interval > 1) return Math.floor(interval) + " ngày trước";
         interval = seconds / 3600;
         if (interval > 1) return Math.floor(interval) + " giờ trước";
         interval = seconds / 60;
         if (interval > 1) return Math.floor(interval) + " phút trước";
         return "vài giây trước";
     },

    /**
     * Lấy tên rút gọn của nhân viên (Tên cuối + MSNV).
     * @param {string} hoTen - Họ và tên đầy đủ.
     * @param {string} maNV - Mã nhân viên.
     * @returns {string} - Tên rút gọn (ví dụ: "Văn A - 12345")
     */
    getShortEmployeeName(hoTen, maNV) {
        if (!hoTen) return maNV || '';
        const nameParts = hoTen.split(' ').filter(p => p);
        let displayName = hoTen;
        if (nameParts.length > 2) {
            displayName = nameParts.slice(-2).join(' ');
        }
        return `${displayName} - ${maNV}`;
    },
};