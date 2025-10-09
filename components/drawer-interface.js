// Version 1.0 - Component: Interface Drawer
// Chứa mã HTML cho drawer cài đặt giao diện.

const drawerInterfaceHTML = `
<div id="interface-drawer" class="settings-drawer fixed top-0 left-0 h-full bg-white shadow-2xl z-50 p-6 overflow-y-auto hidden">
    <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-800">Cài đặt giao diện</h3>
        <button class="close-drawer-btn text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
    </div>
    <div class="space-y-6">
        <div>
            <label for="contrast-selector-drawer" class="block text-sm font-medium text-gray-700 mb-2">Độ tương phản</label>
            <select id="contrast-selector-drawer" class="contrast-selector w-full p-2 border rounded-lg text-sm bg-white shadow-sm">
                <option value="1">Rất nhẹ</option>
                <option value="2">Nhẹ</option>
                <option value="3" selected>Bình thường</option>
                <option value="4">Cao</option>
                <option value="5">Rất cao</option>
                <option value="6">Cao nhất</option>
            </select>
        </div>
        <div>
            <label for="global-font-size-slider" class="flex justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Cỡ chữ toàn trang</span>
                <span id="global-font-size-value" class="font-bold text-blue-600">14px</span>
            </label>
            <input type="range" id="global-font-size-slider" min="12" max="18" step="1" value="14" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
        </div>
        <div>
             <label for="kpi-font-size-slider" class="flex justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Cỡ chữ thẻ KPI</span>
                <span id="kpi-font-size-value" class="font-bold text-blue-600">36px</span>
            </label>
            <input type="range" id="kpi-font-size-slider" min="24" max="48" step="2" value="36" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
        </div>
        <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Màu sắc thẻ KPI</h4>
            <div class="grid grid-cols-2 gap-4">
                <div class="flex items-center gap-2">
                    <input type="color" id="kpi-color-1" class="kpi-color-input p-1 h-10 w-14 block bg-white border border-gray-300 cursor-pointer rounded-lg" value="#38bdf8">
                    <label for="kpi-color-1" class="text-sm">Thẻ 1</label>
                </div>
                <div class="flex items-center gap-2">
                    <input type="color" id="kpi-color-2" class="kpi-color-input p-1 h-10 w-14 block bg-white border border-gray-300 cursor-pointer rounded-lg" value="#34d399">
                    <label for="kpi-color-2" class="text-sm">Thẻ 2</label>
                </div>
                <div class="flex items-center gap-2">
                    <input type="color" id="kpi-color-3" class="kpi-color-input p-1 h-10 w-14 block bg-white border border-gray-300 cursor-pointer rounded-lg" value="#fbbf24">
                    <label for="kpi-color-3" class="text-sm">Thẻ 3</label>
                </div>
                <div class="flex items-center gap-2">
                    <input type="color" id="kpi-color-4" class="kpi-color-input p-1 h-10 w-14 block bg-white border border-gray-300 cursor-pointer rounded-lg" value="#2dd4bf">
                    <label for="kpi-color-4" class="text-sm">Thẻ 4</label>
                </div>
                <div class="flex items-center gap-2">
                    <input type="color" id="kpi-color-5" class="kpi-color-input p-1 h-10 w-14 block bg-white border border-gray-300 cursor-pointer rounded-lg" value="#a78bfa">
                    <label for="kpi-color-5" class="text-sm">Thẻ 5</label>
                </div>
                <div class="flex items-center gap-2">
                    <input type="color" id="kpi-color-6" class="kpi-color-input p-1 h-10 w-14 block bg-white border border-gray-300 cursor-pointer rounded-lg" value="#f472b6">
                    <label for="kpi-color-6" class="text-sm">Thẻ 6</label>
                </div>
                <div class="flex items-center gap-2">
                    <input type="color" id="kpi-color-7" class="kpi-color-input p-1 h-10 w-14 block bg-white border border-gray-300 cursor-pointer rounded-lg" value="#818cf8">
                    <label for="kpi-color-7" class="text-sm">Thẻ 7</label>
                </div>
                <div class="flex items-center gap-2">
                    <input type="color" id="kpi-color-8" class="kpi-color-input p-1 h-10 w-14 block bg-white border border-gray-300 cursor-pointer rounded-lg" value="#f87171">
                    <label for="kpi-color-8" class="text-sm">Thẻ 8</label>
                </div>
            </div>
        </div>
         <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Màu chữ thẻ KPI</h4>
             <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <input type="color" id="kpi-title-color" class="kpi-color-input p-1 h-10 w-14 block bg-white border border-gray-300 cursor-pointer rounded-lg" value="#ffffff">
                    <label for="kpi-title-color" class="text-sm">Tiêu đề thẻ</label>
                </div>
                <div class="flex items-center gap-2">
                    <input type="color" id="kpi-main-color" class="kpi-color-input p-1 h-10 w-14 block bg-white border border-gray-300 cursor-pointer rounded-lg" value="#ffffff">
                    <label for="kpi-main-color" class="text-sm">Giá trị chính</label>
                </div>
                <div class="flex items-center gap-2">
                    <input type="color" id="kpi-sub-color" class="kpi-color-input p-1 h-10 w-14 block bg-white border border-gray-300 cursor-pointer rounded-lg" value="#ffffff">
                    <label for="kpi-sub-color" class="text-sm">Giá trị phụ</label>
                </div>
            </div>
        </div>
    </div>
</div>
`;

export const drawerInterface = {
    render(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = drawerInterfaceHTML;
        }
    }
};