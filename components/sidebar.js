// Version 1.1 - Update icons for Data and Declaration sections
// Chứa mã HTML và logic cho thanh điều hướng bên.

const sidebarHTML = `
<nav id="sidebar" class="bg-white/80 backdrop-blur-sm shadow-lg fixed top-0 left-0 h-full z-30 p-3 flex flex-col justify-between">
    <div>
         <a href="#home-section" class="nav-link flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 flex-shrink-0"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span class="menu-text ml-4">Hướng Dẫn & Góp Ý</span>
        </a>
        <ul class="space-y-2">
            <li>
                <a href="#data-section" class="nav-link flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 flex-shrink-0">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span class="menu-text ml-4">Cập nhật dữ liệu</span>
                </a>
            </li>
            <li>
                <a href="#health-section" class="nav-link flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 flex-shrink-0"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                    <span class="menu-text ml-4">Sức khỏe siêu thị</span>
                </a>
            </li>
            <li>
                <a href="#health-employee-section" class="nav-link flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 flex-shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    <span class="menu-text ml-4">Sức khỏe nhân viên</span>
                </a>
            </li>
            <li>
                <a href="#realtime-section" class="nav-link flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 flex-shrink-0"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    <span class="menu-text ml-4">Doanh thu realtime</span>
                </a>
            </li>
        </ul>
    </div>
    <div>
        <ul class="space-y-2">
            <li>
                <button id="interface-settings-btn" class="w-full flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 flex-shrink-0"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    <span class="menu-text ml-4">Cài đặt giao diện</span>
                </button>
            </li>
             <li>
                <button id="goal-settings-btn" class="w-full flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 flex-shrink-0"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                    <span class="menu-text ml-4">Thiết lập mục tiêu</span>
                </button>
            </li>
            <li>
                <button id="admin-access-btn" class="w-full flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 flex-shrink-0">
                        <path d="M8 17.929H6c-1.105 0-2-.895-2-2V5c0-1.105.895-2 2-2h8c1.105 0 2 .895 2 2v5.828"></path>
                        <polyline points="14 3 14 8 19 8"></polyline>
                        <path d="M10.42 16.22a2.121 2.121 0 102.122 2.121"></path>
                        <path d="M16 12.016v4.414m-3.003.015 9.008 2.502-2.502-9.008-3.5 3.504-3-3-3.504 3.5"></path>
                    </svg>
                    <span class="menu-text ml-4">Khai báo</span>
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