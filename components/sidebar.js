// Version 1.4 - Add font-semibold to all nav links for consistency
// Version 1.3 - Optimize HTML for better icon/text alignment
// Chứa mã HTML và logic cho thanh điều hướng bên.

const sidebarHTML = `
<nav id="sidebar" class="bg-white/80 backdrop-blur-sm shadow-lg fixed top-0 left-0 h-full z-30 p-3 flex flex-col justify-between">
    <div>
         <a href="#home-section" class="nav-link flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold mb-4">
            <i data-feather="home"></i>
            <span class="menu-text">Hướng Dẫn & Góp Ý</span>
        </a>
        <ul class="space-y-2">
            <li>
                <a href="#data-section" class="nav-link flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                    <i data-feather="file-text"></i>
                    <span class="menu-text">Cập nhật dữ liệu</span>
                </a>
            </li>
            <li>
                <a href="#health-section" class="nav-link flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                    <i data-feather="activity"></i>
                    <span class="menu-text">Sức khỏe siêu thị</span>
                </a>
            </li>
            <li>
                <a href="#health-employee-section" class="nav-link flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                    <i data-feather="users"></i>
                    <span class="menu-text">Sức khỏe nhân viên</span>
                </a>
            </li>
            <li>
                <a href="#realtime-section" class="nav-link flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                    <i data-feather="trending-up"></i>
                    <span class="menu-text">Doanh thu realtime</span>
                </a>
            </li>
        </ul>
    </div>
    <div>
        <ul class="space-y-2">
            <li>
                <button id="interface-settings-btn" class="w-full flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                    <i data-feather="settings"></i>
                    <span class="menu-text">Cài đặt giao diện</span>
                </button>
            </li>
            <li>
                <button id="goal-settings-btn" class="w-full flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                    <i data-feather="target"></i>
                    <span class="menu-text">Thiết lập mục tiêu</span>
                </button>
            </li>
            <li>
                <button id="admin-access-btn" class="w-full flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                    <i data-feather="edit"></i>
                    <span class="menu-text">Khai báo</span>
                </button>
            </li>
        </ul>
    </div>
</nav>
`;

export const sidebar = {
    render(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = sidebarHTML;
        }
    }
};