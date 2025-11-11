// Version 1.2 - Refactor: Remove Special Program form (moved to admin panel)
// Chứa mã HTML cho drawer thiết lập mục tiêu.

const drawerGoalHTML = `
<div id="goal-drawer" class="settings-drawer fixed top-0 left-0 h-full bg-white shadow-2xl z-50 p-6 overflow-y-auto hidden">
    <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-800">Thiết lập mục tiêu</h3>
        <button class="close-drawer-btn text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
    </div>
    
    <div class="border-b border-gray-200 mb-4">
        <nav id="goal-drawer-tabs" class="-mb-px flex space-x-6" aria-label="Tabs" data-content-container="goal-drawer-content">
             <button class="sub-tab-btn active whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm" data-target="goal-tab-monthly">Mục tiêu Tháng (Lũy kế)</button>
             <button class="sub-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm" data-target="goal-tab-daily">Mục tiêu Ngày (Realtime)</button>
        </nav>
    </div>

    <div id="goal-drawer-content">
        <div id="goal-tab-monthly" class="sub-tab-content space-y-4">
            <div>
                <label for="luyke-goal-warehouse-select" class="block text-sm font-medium text-gray-700 mb-1">Thiết lập cho kho</label>
                <select id="luyke-goal-warehouse-select" class="p-2 border rounded-lg text-sm bg-white shadow-sm w-full"></select>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-3">
                <div>
                    <label for="luyke-goal-dtt" class="block text-sm font-medium text-gray-700">Target DT Thực</label>
                    <input type="number" id="luyke-goal-dtt" class="luyke-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="doanhThuThuc">
                </div>
                <div>
                    <label for="luyke-goal-dtqd" class="block text-sm font-medium text-gray-700">Target DT QĐ</label>
                    <input type="number" id="luyke-goal-dtqd" class="luyke-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="doanhThuQD">
                </div>
            </div>

            <details class="declaration-group border rounded-lg overflow-hidden">
                <summary class="!py-3 !px-4 !text-sm !font-bold cursor-pointer hover:bg-gray-50">Mục tiêu khai thác (%)</summary>
                <div class="declaration-content !pt-4 !pb-4 !px-4 bg-gray-50 border-t grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                        <label for="luyke-goal-ptqd" class="block text-sm font-medium text-gray-700">% Quy đổi</label>
                        <input type="number" id="luyke-goal-ptqd" class="luyke-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramQD">
                    </div>
                    <div>
                        <label for="luyke-goal-pttc" class="block text-sm font-medium text-gray-700">% Trả chậm</label>
                         <input type="number" id="luyke-goal-pttc" class="luyke-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramTC">
                    </div>
                    <div>
                        <label for="luyke-goal-giadung" class="block text-sm font-medium text-gray-700">% Gia dụng</label>
                        <input type="number" id="luyke-goal-giadung" class="luyke-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramGiaDung">
                    </div>
                    <div>
                        <label for="luyke-goal-mln" class="block text-sm font-medium text-gray-700">% MLN</label>
                        <input type="number" id="luyke-goal-mln" class="luyke-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramMLN">
                    </div>
                    <div>
                        <label for="luyke-goal-phukien" class="block text-sm font-medium text-gray-700">% Phụ kiện</label>
                        <input type="number" id="luyke-goal-phukien" class="luyke-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramPhuKien">
                    </div>
                    <div>
                        <label for="luyke-goal-baohiem" class="block text-sm font-medium text-gray-700">% Bảo hiểm</label>
                        <input type="number" id="luyke-goal-baohiem" class="luyke-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramBaoHiem">
                    </div>
                    <div>
                        <label for="luyke-goal-sim" class="block text-sm font-medium text-gray-700">% Sim</label>
                        <input type="number" id="luyke-goal-sim" class="luyke-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramSim">
                    </div>
                    <div>
                         <label for="luyke-goal-vas" class="block text-sm font-medium text-gray-700">% VAS</label>
                        <input type="number" id="luyke-goal-vas" class="luyke-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramVAS">
                    </div>
                </div>
            </details>
            </div>
        <div id="goal-tab-daily" class="sub-tab-content hidden space-y-4">
            <div>
                <label for="rt-goal-warehouse-select" class="block text-sm font-medium text-gray-700 mb-1">Thiết lập cho kho</label>
                <select id="rt-goal-warehouse-select" class="p-2 border rounded-lg text-sm bg-white shadow-sm w-full"></select>
            </div>
            <div class="grid grid-cols-2 gap-4 items-end">
                <div class="flex items-center gap-x-2">
                     <label for="rt-open-hour" class="font-medium text-gray-700 text-sm">Mở cửa:</label>
                    <input type="time" id="rt-open-hour" class="rt-setting-input p-1 border border-gray-300 rounded-md shadow-sm w-24">
                </div>
                <div class="flex items-center gap-x-2">
                    <label for="rt-close-hour" class="font-medium text-gray-700 text-sm">Đóng cửa:</label>
                    <input type="time" id="rt-close-hour" class="rt-setting-input p-1 border border-gray-300 rounded-md shadow-sm w-24">
                </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-3">
                <div>
                    <label for="rt-goal-dtt" class="block text-sm font-medium text-gray-700">DT Thực (triệu)</label>
                    <input type="number" id="rt-goal-dtt" class="rt-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="doanhThuThuc">
                </div>
                <div>
                    <label for="rt-goal-dtqd" class="block text-sm font-medium text-gray-700">DT QĐ (triệu)</label>
                    <input type="number" id="rt-goal-dtqd" class="rt-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="doanhThuQD">
                </div>
            </div>

            <details class="declaration-group border rounded-lg overflow-hidden">
                <summary class="!py-3 !px-4 !text-sm !font-bold cursor-pointer hover:bg-gray-50">Mục tiêu khai thác (%)</summary>
                <div class="declaration-content !pt-4 !pb-4 !px-4 bg-gray-50 border-t grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                        <label for="rt-goal-ptqd" class="block text-sm font-medium text-gray-700">% Quy đổi</label>
                         <input type="number" id="rt-goal-ptqd" class="rt-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramQD">
                    </div>
                    <div>
                        <label for="rt-goal-pttc" class="block text-sm font-medium text-gray-700">% Trả chậm</label>
                         <input type="number" id="rt-goal-pttc" class="rt-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramTC">
                    </div>
                    <div>
                        <label for="rt-goal-giadung" class="block text-sm font-medium text-gray-700">% Gia dụng</label>
                        <input type="number" id="rt-goal-giadung" class="rt-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramGiaDung">
                    </div>
                    <div>
                        <label for="rt-goal-mln" class="block text-sm font-medium text-gray-700">% MLN</label>
                        <input type="number" id="rt-goal-mln" class="rt-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramMLN">
                    </div>
                    <div>
                        <label for="rt-goal-phukien" class="block text-sm font-medium text-gray-700">% Phụ kiện</label>
                        <input type="number" id="rt-goal-phukien" class="rt-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramPhuKien">
                    </div>
                    <div>
                        <label for="rt-goal-sim" class="block text-sm font-medium text-gray-700">% Sim</label>
                        <input type="number" id="rt-goal-sim" class="rt-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramSim">
                    </div>
                    <div>
                         <label for="rt-goal-vas" class="block text-sm font-medium text-gray-700">% VAS</label>
                        <input type="number" id="rt-goal-vas" class="rt-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramVAS">
                    </div>
                    <div>
                        <label for="rt-goal-baohiem" class="block text-sm font-medium text-gray-700">% Bảo hiểm</label>
                        <input type="number" id="rt-goal-baohiem" class="rt-goal-input mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" data-goal="phanTramBaoHiem">
                    </div>
                </div>
            </details>
            </div>
    </div>

    <div class="border-t pt-6 mt-6">
        <div id="special-program-manager" class="space-y-4 mb-6">
            <h4 class="text-md font-bold text-gray-800 mb-3">Quản lý SP Đặc Quyền (Toàn hệ thống)</h4>
            
            <div id="special-program-list-container" class="space-y-2 mb-4">
                <p class="text-xs text-center text-gray-500 italic">Chưa có chương trình SPĐQ nào được tạo.</p>
            </div>

            </div>
        
        <div id="goal-tab-competition" class="space-y-4 border-t pt-6 mt-6">
            <h4 class="text-md font-bold text-gray-800 mb-3">Quản lý Chương trình Thi đua (Tùy chỉnh)</h4>
            <div id="competition-list-container" class="space-y-2 mb-4">
            </div>
            <form id="competition-form" class="p-4 bg-slate-50 border rounded-lg space-y-3 hidden">
                <input type="hidden" id="competition-id">
                <div>
                    <label for="competition-name" class="block text-sm font-medium text-gray-700">Tên chương trình</label>
                    <input type="text" id="competition-name" class="mt-1 block w-full p-2 border rounded-md" placeholder="VD: Thi đua TV Sony T9">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="competition-brand" class="block text-sm font-medium text-gray-700">Hãng sản xuất</label>
                        <select id="competition-brand" multiple class="mt-1 block w-full"></select>
                    </div>
                    <div>
                        <label for="competition-group" class="block text-sm font-medium text-gray-700">Nhóm hàng</label>
                        <select id="competition-group" multiple class="mt-1 block w-full"></select>
                    </div>
                </div>
                <div>
                    <label for="competition-type" class="block text-sm font-medium text-gray-700">Loại đo lường</label>
                    <select id="competition-type" class="mt-1 block w-full p-2 border rounded-md">
                         <option value="doanhthu">Theo Doanh thu</option>
                        <option value="soluong">Theo Số lượng</option>
                    </select>
                </div>
                <div id="price-segment" class="hidden grid grid-cols-2 gap-4">
                    <div>
                        <label for="competition-min-price" class="block text-sm font-medium text-gray-700">Giá từ (triệu)</label>
                        <input type="number" id="competition-min-price" class="mt-1 block w-full p-2 border rounded-md" placeholder="VD: 3 (cho 3 triệu)">
                    </div>
                     <div>
                         <label for="competition-max-price" class="block text-sm font-medium text-gray-700">Giá đến (triệu)</label>
                        <input type="number" id="competition-max-price" class="mt-1 block w-full p-2 border rounded-md" placeholder="VD: 5 (cho 5 triệu)">
                    </div>
                </div>
                <div class="flex items-center">
                     <input id="competition-exclude-apple" type="checkbox" class="h-4 w-4 rounded border-gray-300">
                    <label for="competition-exclude-apple" class="ml-2 block text-sm text-gray-900">Trừ hãng Apple khỏi dữ liệu so sánh</label>
                </div>
                <div class="flex justify-end gap-2">
                    <button type="button" id="cancel-competition-btn" class="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300">Hủy</button>
                    <button type="submit" id="save-competition-btn" class="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Lưu</button>
                </div>
            </form>
            <button id="add-competition-btn" class="mt-2 w-full text-sm py-2 px-4 border-2 border-dashed rounded-lg hover:bg-slate-50">
                + Thêm chương trình mới
            </button>
        </div>
    </div>
</div>
`;

export const drawerGoal = {
    render(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = drawerGoalHTML;
        }
    }
};