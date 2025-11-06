// Version 1.0 - Initial creation from ui-components.js
// MODULE: UI HOME
// Chứa các hàm render cho tab Trang chủ.

import { appState } from './state.js';
import { formatters } from './ui-formatters.js';

/**
 * Render lịch sử cập nhật lên trang chủ.
 * (Đã di chuyển từ ui-components.js)
 */
const renderUpdateHistory = async () => {
    const container = document.getElementById('update-history-list');
    if (!container) return;
    try {
        const response = await fetch(`./changelog.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Không thể tải lịch sử cập nhật.');
        const updateHistory = await response.json();
        container.innerHTML = updateHistory.map(item => `
            <div class="bg-white rounded-xl shadow-md p-5 border border-gray-200">
                    <h4 class="font-bold text-blue-600 mb-2">Phiên bản ${item.version} (${item.date})</h4>
                    <ul class="list-disc list-inside text-gray-700 space-y-1 text-sm">
                        ${item.notes.map(note => `<li>${note}</li>`).join('')}
                </ul>
                </div>`).join('');
    } catch (error) {
        console.error("Lỗi khi render lịch sử cập nhật:", error);
        container.innerHTML = '<p class="text-red-500">Không thể tải lịch sử cập nhật.</p>';
    }
};

/**
 * Render khu vực Feedback (Soạn thảo và Danh sách) lên trang chủ.
 * (Đã di chuyển từ ui-components.js)
 */
const renderFeedbackSection = () => {
    const composerContainer = document.getElementById('feedback-composer');
    const listContainer = document.getElementById('feedback-list');
    if (!composerContainer || !listContainer) return;

    composerContainer.innerHTML = `
            <h4 class="text-lg font-semibold text-gray-800 mb-3">Gửi góp ý của bạn</h4>
        <textarea id="feedback-textarea" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3" rows="4" placeholder="Chúng tôi luôn lắng nghe ý kiến của bạn để cải thiện công cụ tốt hơn..."></textarea>
            <button id="submit-feedback-btn" class="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition">Gửi góp ý</button>
    `;

    if (!appState.feedbackList || appState.feedbackList.length === 0) {
        listContainer.innerHTML = '<p class="text-center text-gray-500 mt-4">Chưa có góp ý nào.</p>';
        return;
    }

    listContainer.innerHTML = appState.feedbackList.map(item => {
        const userNameDisplay = item.user?.email || 'Người dùng ẩn danh';
        return `
            <div class="feedback-item bg-white rounded-xl shadow-md p-5 border border-gray-200" data-id="${item.id}">
                <p class="text-gray-800">${item.content}</p>
                    <div class="text-xs text-gray-500 mt-3 flex justify-between items-center">
                        <span class="font-semibold">${userNameDisplay}</span>
                        <span>${formatters.formatTimeAgo(item.timestamp)}</span> 
                        ${appState.isAdmin ? `<button class="reply-btn text-blue-600 hover:underline">Trả lời</button>` : ''}
                </div>
                <div class="ml-6 mt-4 space-y-3">
                        ${(item.replies || []).map(reply => `
                            <div class="bg-gray-100 rounded-lg p-3">
                            <p class="text-gray-700 text-sm">${reply.content}</p>
                                <div class="text-xs text-gray-500 mt-2">
                                    <strong>Admin</strong> - ${formatters.formatTimeAgo(reply.timestamp instanceof Date ? reply.timestamp : reply.timestamp?.toDate())} 
                                </div>
                        </div>`).join('')}
                </div>
                <div class="reply-form-container hidden ml-6 mt-4">
                        <textarea class="w-full p-2 border rounded-lg text-sm" rows="2" placeholder="Viết câu trả lời..."></textarea>
                        <div class="flex justify-end gap-2 mt-2">
                        <button class="cancel-reply-btn text-sm text-gray-600 px-3 py-1 rounded-md hover:bg-gray-100">Hủy</button>
                            <button class="submit-reply-btn text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">Gửi</button>
                    </div>
                </div>
            </div>`;
    }).join('');
};

/**
 * Hàm render chính cho Trang chủ.
 * (Đã di chuyển từ ui-components.js)
 */
const renderHomePage = () => {
    renderUpdateHistory();
    renderFeedbackSection();
};

// Xuất khẩu đối tượng gộp
export const uiHome = {
    renderHomePage,
    renderUpdateHistory,
    renderFeedbackSection
};