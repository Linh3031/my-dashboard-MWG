// Version 1.0 - Component: Composer Modal
// Chứa mã HTML cho modal Trình tạo Nhận xét.

const modalComposerHTML = `
<div id="composer-modal" class="modal hidden">
    <div class="modal__overlay" data-close-modal></div>
    <div class="modal__container modal__container--large">
        <div class="modal__header">
            <h3 id="composer-modal-title" class="modal__title">Trình tạo Nhận xét</h3>
            <button class="modal__close-btn" data-close-modal>&times;</button>
        </div>
        <div id="composer-modal-content" class="modal__content">
            <div class="composer">
                <div class="composer__editor">
                    <label class="composer__label">Nội dung nhận xét</label>
                    <nav id="composer-context-tabs" class="composer__nav mb-2"></nav>
                    <div id="composer-context-content">
                        </div>
                </div>
                <div class="composer__tags">
                    <div class="composer__nav">
                        <button class="composer__tab-btn active" data-tab="tab-general">Chung & Icons</button>
                        <button class="composer__tab-btn" data-tab="tab-kpi">KPIs Siêu Thị</button>
                        <button class="composer__tab-btn" data-tab="tab-ranking">Xếp Hạng NV</button>
                        <button class="composer__tab-btn" data-tab="tab-details">Thi Đua & Chi Tiết</button>
                    </div>

                    <div class="composer__content">
                        <div class="composer__tab-pane active" id="tab-general">
                            <div class="composer__tag-group">
                                <h5 class="composer__tag-group-title">Chung</h5>
                                <button class="composer__tag-btn" data-tag="[NGAY]">Ngày</button>
                                <button class="composer__tag-btn" data-tag="[GIO]">Giờ</button>
                            </div>
                            <div class="composer__tag-group">
                                <h5 class="composer__tag-group-title">Biểu tượng (Icons)</h5>
                                <button class="composer__icon-btn">📊</button>
                                <button class="composer__icon-btn">💰</button>
                                <button class="composer__icon-btn">💥</button>
                                <button class="composer__icon-btn">🎯</button>
                                <button class="composer__icon-btn">📈</button>
                                <button class="composer__icon-btn">📦</button>
                                <button class="composer__icon-btn">⚠️</button>
                                <button class="composer__icon-btn">🔥</button>
                                <button class="composer__icon-btn">✅</button>
                            </div>
                        </div>

                        <div class="composer__tab-pane" id="tab-kpi">
                            <div class="composer__tag-group">
                                <h5 class="composer__tag-group-title">KPIs Chính</h5>
                                <button class="composer__tag-btn" data-tag="[DT_THUC]">DT Thực</button>
                                <button class="composer__tag-btn" data-tag="[DTQD]">DT Quy đổi</button>
                                <button class="composer__tag-btn" data-tag="[%HT_DTT]">%HT DT Thực</button>
                                <button class="composer__tag-btn" data-tag="[%HT_DTQD]">%HT DT QĐ</button>
                                <button class="composer__tag-btn" data-tag="[TLQD]">Tỷ lệ Quy đổi</button>
                                <button class="composer__tag-btn" data-tag="[DT_CHUAXUAT]">DTQĐ Chưa Xuất</button>
                                <button class="composer__tag-btn" data-tag="[SS_CUNGKY]">Tăng/giảm Cùng kỳ</button>
                            </div>
                        </div>

                        <div class="composer__tab-pane" id="tab-ranking">
                            <div class="composer__filter-group">
                                <label for="composer-dept-filter" class="composer__label">Lọc theo bộ phận:</label>
                                <select id="composer-dept-filter" class="composer__select">
                                    <option value="ALL">Toàn siêu thị</option>
                                </select>
                            </div>
                            <div class="composer__tag-group">
                                <h5 class="composer__tag-group-title">Xếp hạng DT Quy Đổi</h5>
                                <button class="composer__tag-btn" data-tag-template="[TOP3_DTQD_{dept}@msnv]">Top 3</button>
                                <button class="composer__tag-btn" data-tag-template="[BOT3_DTQD_{dept}@msnv]">Bot 3</button>
                            </div>
                            <div class="composer__tag-group">
                                <h5 class="composer__tag-group-title">Xếp hạng Thu Nhập</h5>
                                <button class="composer__tag-btn" data-tag-template="[TOP3_THUNHAP_{dept}@msnv]">Top 3</button>
                                <button class="composer__tag-btn" data-tag-template="[BOT3_THUNHAP_{dept}@msnv]">Bot 3</button>
                            </div>
                             <div class="composer__tag-group">
                                <h5 class="composer__tag-group-title">Xếp hạng Tỷ lệ Quy đổi</h5>
                                <button class="composer__tag-btn" data-tag-template="[TOP3_TLQD_{dept}@msnv]">Top 3</button>
                                <button class="composer__tag-btn" data-tag-template="[BOT3_TLQD_{dept}@msnv]">Bot 3</button>
                            </div>
                            <div class="composer__tag-group">
                                <h5 class="composer__tag-group-title">NV Dưới Mục Tiêu Khai Báo</h5>
                                <button class="composer__tag-btn" data-tag-template="[BOT_TARGET_TLQD_{dept}@msnv]">% Quy đổi</button>
                                <button class="composer__tag-btn" data-tag-template="[BOT_TARGET_TLTC_{dept}@msnv]">% Trả chậm</button>
                                <button class="composer__tag-btn" data-tag-template="[BOT_TARGET_PK_{dept}@msnv]">% Phụ kiện</button>
                                <button class="composer__tag-btn" data-tag-template="[BOT_TARGET_GD_{dept}@msnv]">% Gia dụng</button>
                                <button class="composer__tag-btn" data-tag-template="[BOT_TARGET_MLN_{dept}@msnv]">% MLN</button>
                                <button class="composer__tag-btn" data-tag-template="[BOT_TARGET_SIM_{dept}@msnv]">% Sim</button>
                                <button class="composer__tag-btn" data-tag-template="[BOT_TARGET_VAS_{dept}@msnv]">% VAS</button>
                                <button class="composer__tag-btn" data-tag-template="[BOT_TARGET_BH_{dept}@msnv]">% Bảo hiểm</button>
                            </div>
                            </div>
                        
                        <div class="composer__tab-pane" id="tab-details">
                            <div class="composer__sub-nav">
                                <button class="composer__sub-tab-btn active" data-sub-tab="sub-tab-thidua">Thi Đua</button>
                                <button class="composer__sub-tab-btn" data-sub-tab="sub-tab-qdc">Nhóm QĐC</button>
                                <button class="composer__sub-tab-btn" data-sub-tab="sub-tab-nganhhang">Ngành Hàng</button>
                            </div>
                            <div class="composer__sub-content">
                                <div class="composer__sub-tab-pane active" id="sub-tab-thidua">
                                    <div class="composer__tag-group">
                                        <h5 class="composer__tag-group-title">Thi Đua Ngành Hàng</h5>
                                        <button class="composer__tag-btn" data-tag="[TD_TONG_CT]">Tổng CT</button>
                                        <button class="composer__tag-btn" data-tag="[TD_CT_DAT]">>100%</button>
                                        <button class="composer__tag-btn" data-tag="[TD_CT_CHUADAT]"><100%</button>
                                        <button class="composer__tag-btn" data-tag="[TD_TYLE_DAT]">% Đạt</button>
                                    </div>
                                </div>
                                <div class="composer__sub-tab-pane" id="sub-tab-qdc">
                                    <div id="composer-qdc-tags-container" class="composer__tag-group">
                                        <h5 class="composer__tag-group-title">Chọn Nhóm Hàng QĐC</h5>
                                    </div>
                                </div>
                                <div class="composer__sub-tab-pane" id="sub-tab-nganhhang">
                                    <div id="composer-nganhhang-tags-container" class="composer__tag-group">
                                        <h5 class="composer__tag-group-title">Chọn Ngành Hàng Chi Tiết</h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal__footer">
            <button id="save-composer-template-btn" class="action-btn action-btn--save">Lưu mẫu</button>
            <button id="copy-composed-notification-btn" class="action-btn action-btn--copy">Xem trước & Sao chép</button>
        </div>
    </div>
</div>
`;

export const modalComposer = {
    render(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = modalComposerHTML;
        }
    }
};