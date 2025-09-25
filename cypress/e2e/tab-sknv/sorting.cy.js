// describe định nghĩa một "Nhóm các bài kiểm thử" cho một chức năng lớn.
describe('Kiểm tra Tab Sức khỏe Nhân viên (SKNV)', () => {

  // it định nghĩa một "Trường hợp kiểm thử" cụ thể.
  it('Nên sắp xếp chính xác bảng Doanh thu nhân viên khi bấm vào tiêu đề cột', () => {
    
    // --- GIAI ĐOẠN 1: SETUP ---
    // 1. Mở trang web của ứng dụng. Dấu '/' nghĩa là trang chủ.
    cy.visit('/');

    // 2. Tìm link điều hướng có chữ "Sức khỏe NV" và bấm vào nó.
    cy.get('a.nav-link[href="#health-employee-section"]').click();

    // 3. Chờ cho bảng doanh thu xuất hiện, tối đa 15 giây.
    // Điều này quan trọng vì dữ liệu cần thời gian để tải và tính toán.
    cy.get('#revenue-report-container table[data-table-type="doanhthu"]', { timeout: 15000 })
      .should('be.visible');

      
    // --- GIAI ĐOẠN 2: HÀNH ĐỘNG VÀ KIỂM TRA (SẮP XẾP GIẢM DẦN) ---
    // 4. Tìm tiêu đề cột (th) có chứa chữ "Doanh Thu" và bấm vào nó.
    cy.contains('th', 'Doanh Thu').click();

    // 5. Đợi một chút để DOM cập nhật sau khi sắp xếp.
    cy.wait(500);

    // 6. Lấy tất cả giá trị doanh thu từ cột thứ hai của bảng.
    const revenuesDesc = [];
    cy.get('#revenue-report-container table[data-table-type="doanhthu"] tbody tr')
      .each(($row) => {
        // Lấy text từ ô thứ 2 (chỉ số là 1), loại bỏ ký tự và chuyển thành số.
        const revenueText = $row.find('td').eq(1).text();
        if (revenueText && revenueText !== '-') {
           revenuesDesc.push(parseFloat(revenueText.replace(/\./g, '').replace(',', '.')));
        }
      })
      .then(() => {
        // 7. KIỂM TRA: Mảng doanh thu vừa lấy có được sắp xếp giảm dần không.
        for (let i = 0; i < revenuesDesc.length - 1; i++) {
          expect(revenuesDesc[i]).to.be.gte(revenuesDesc[i + 1]);
        }
      });


    // --- GIAI ĐOẠN 3: HÀNH ĐỘNG VÀ KIỂM TRA (SẮP XẾP TĂNG DẦN) ---
    // 8. Bấm vào cột "Doanh Thu" một lần nữa để đảo chiều sắp xếp.
    cy.contains('th', 'Doanh Thu').click();
    cy.wait(500);

    // 9. Lấy lại tất cả giá trị doanh thu.
    const revenuesAsc = [];
    cy.get('#revenue-report-container table[data-table-type="doanhthu"] tbody tr')
      .each(($row) => {
        const revenueText = $row.find('td').eq(1).text();
        if (revenueText && revenueText !== '-') {
           revenuesAsc.push(parseFloat(revenueText.replace(/\./g, '').replace(',', '.')));
        }
      })
      .then(() => {
        // 10. KIỂM TRA: Mảng doanh thu lần này có được sắp xếp tăng dần không.
        for (let i = 0; i < revenuesAsc.length - 1; i++) {
          expect(revenuesAsc[i]).to.be.lte(revenuesAsc[i + 1]);
        }
      });
  });
});