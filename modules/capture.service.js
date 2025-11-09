// Version 1.9 - Add fixed width to preset-mobile-portrait for better mobile viewing
// Version 1.8 - Fix: Apply presetClass to contentClone instead of wrapper
// Version 1.1 - Fix blank charts by disabling Chart.js animations and adding 500ms delay during capture
// Version 1.0 - Refactored from utils.js
// MODULE: CAPTURE SERVICE
// Chứa toàn bộ logic liên quan đến việc chụp ảnh màn hình các thành phần UI.

import { ui } from '../ui.js';
import { analyticsService } from '../services/analytics.service.js';
import { appState } from '../state.js'; // <<< THÊM MỚI (Kế hoạch A)

// --- HELPER for Screenshot CSS Injection ---
const _injectCaptureStyles = () => {
    const styleId = 'dynamic-capture-styles';
    document.getElementById(styleId)?.remove();

    const styles = `
        .capture-container { 
            padding: 24px; 
            background-color: #f3f4f6; 
            box-sizing: border-box; 
            width: fit-content; 
            position: absolute;
            left: -9999px;
            top: 0;
            z-index: -1;
        }
        .capture-layout-container { 
            display: flex; 
            flex-direction: column; 
            gap: 24px; 
        }
        .capture-title { 
            font-size: 28px; 
            font-weight: 700; 
            text-align: center; 
            color: #1f2937; 
            margin-bottom: 24px; 
            padding: 12px; 
            background-color: #ffffff; 
            border-radius: 0.75rem; 
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); 
        }
        /* --- VIRTUAL STAGES / PRESETS --- */
        .prepare-for-kpi-capture {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 24px !important;
            width: 900px !important;
        }
        .preset-mobile-portrait {
            /* width: 750px !important; <-- ĐÃ XÓA (v1.4) */
            width: 550px !important; /* (Req 3) Co chiều ngang cho ảnh chụp mobile */
        }
        .preset-landscape-table {
            width: fit-content !important;
        }
        .preset-landscape-table table {
            table-layout: fixed !important;
        }
        .preset-landscape-table th, 
        .preset-landscape-table td {
            width: 95px !important;
            word-wrap: break-word;
        }
        .preset-landscape-table th:first-child,
        .preset-landscape-table td:first-child {
            width: 180px !important;
        }
        .preset-large-font-report {
            width: 800px !important;
        }
        .preset-large-font-report table th {
            white-space: normal !important;
            vertical-align: middle;
        }
        .preset-large-font-report table td {
            font-size: 22px !important;
            vertical-align: middle;
        }
        .preset-infographic-wide {
            width: 1100px !important;
        }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
    return styleElement;
};

// === START: HÀM HỖ TRỢ MỚI (Kế hoạch A) ===
/**
 * Tìm và thay thế tất cả <canvas> của Chart.js bằng <img> tĩnh.
 * @param {HTMLElement} element - Vùng DOM (clone) sắp được chụp.
 */
const _swapCanvasToImage = (element) => {
    console.log("[Capture Service] Swapping canvas to image...");
    const canvasElements = element.querySelectorAll('canvas');
    let replacedCount = 0;
    
    canvasElements.forEach(canvas => {
        const chartId = canvas.id;
        if (chartId && appState.charts[chartId]) {
            try {
                const chart = appState.charts[chartId];
                const base64Image = chart.toBase64Image(); // Lấy ảnh tĩnh
                
                if (base64Image) {
                    const img = document.createElement('img');
                    img.src = base64Image;
                    // Giữ nguyên kích thước để tránh vỡ layout
                    img.style.width = canvas.style.width || `${canvas.width}px`;
                    img.style.height = canvas.style.height || `${canvas.height}px`;
                    img.style.display = 'block';
                    
                    // Thay thế canvas bằng img
                    canvas.parentNode.replaceChild(img, canvas);
                    replacedCount++;
                }
            } catch (e) {
                console.error(`[Capture Service] Lỗi khi hoán đổi canvas '${chartId}':`, e);
            }
        }
    });
    console.log(`[Capture Service] Đã hoán đổi ${replacedCount} biểu đồ.`);
};
// === END: HÀM HỖ TRỢ MỚI ===

export const captureService = {
    async captureAndDownload(elementToCapture, title, presetClass = '') {
        const date = new Date();
        const timeString = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const dateString = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        const finalTitle = `${title.replace(/_/g, ' ')} - ${timeString} ${dateString}`;
    
        const captureWrapper = document.createElement('div');
        captureWrapper.className = 'capture-container';
    
        // *** SỬA LỖI (v1.8) ***
        // Xóa: if (presetClass) { captureWrapper.classList.add(presetClass); }

        const titleEl = document.createElement('h2');
        titleEl.className = 'capture-title';
        titleEl.textContent = finalTitle;
        captureWrapper.appendChild(titleEl);
        
        const contentClone = elementToCapture.cloneNode(true);
        
        // *** SỬA LỖI (v1.8) ***
        // Bỏ chú thích và gán class cho contentClone
        if (presetClass) { contentClone.classList.add(presetClass); }

        captureWrapper.appendChild(contentClone);
        document.body.appendChild(captureWrapper);
    
        // === START: THAY THẾ LOGIC 500ms (Kế hoạch A) ===
        // Tắt animation (vẫn giữ để phòng hờ)
        if (window.Chart) {
            Chart.defaults.animation = false;
        }
        
        // **THAY THẾ CANVAS BẰNG IMG**
        _swapCanvasToImage(contentClone);

        // Thêm một độ trễ ngắn (100ms) để img kịp render, an toàn hơn 500ms
        await new Promise(resolve => setTimeout(resolve, 100));
        // === END: THAY THẾ LOGIC 500ms ===

        // === START: DEBUG LOG (v1.5) - ĐÃ BỊ XÓA ===
        // console.group(...)
        // debugger;
        // console.groupEnd();
        // === END: DEBUG LOG (v1.5) - ĐÃ BỊ XÓA ===

        try {
            const canvas = await html2canvas(captureWrapper, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#f3f4f6'
            });
    
            const link = document.createElement('a');
            link.download = `${title}_${dateString.replace(/\//g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            ui.showNotification('Đã chụp và tải xuống hình ảnh!', 'success');
        } catch (err) {
            console.error('Lỗi chụp màn hình:', err);
            ui.showNotification(`Lỗi khi chụp ảnh: ${err.message}.`, 'error');
        } finally {
            if (document.body.contains(captureWrapper)) {
                document.body.removeChild(captureWrapper);
            }
            // Bật lại animation
            if (window.Chart) {
                Chart.defaults.animation = {};
            }
        }
    },
    
    async captureDashboardInParts(contentContainer, baseTitle) {
        if (!contentContainer) {
            ui.showNotification('Không tìm thấy vùng nội dung để chụp.', 'error');
            return;
        }

        // === START: SỬA LỖI (v1.7) ===
        // Thay thế firebase.incrementCounter bằng analyticsService.incrementCounter
        analyticsService.incrementCounter('actionsTaken', appState.currentUser?.email);
        // === END: SỬA LỖI (v1.7) ===
        
        ui.showNotification(`Bắt đầu chụp báo cáo ${baseTitle}...`, 'success');
    
        const captureGroups = new Map();
        contentContainer.querySelectorAll('[data-capture-group]').forEach(el => {
            if (el.offsetParent !== null) {
                const group = el.dataset.captureGroup;
                if (!captureGroups.has(group)) {
                    captureGroups.set(group, []);
                }
                captureGroups.get(group).push(el);
            }
        });
        
        const styleElement = _injectCaptureStyles();
        
        // === START: THAY THẾ LOGIC 500ms (Kế hoạch A) ===
        // Tắt animation (vẫn giữ để phòng hờ)
        if (window.Chart) {
            Chart.defaults.animation = false;
        }
        // Thêm độ trễ ngắn (100ms) thay vì 500ms
        await new Promise(resolve => setTimeout(resolve, 100));
        // === END: THAY THẾ LOGIC 500ms ===
        
        try {
            if (captureGroups.size === 0) {
                if (contentContainer.offsetParent !== null) {
                    const preset = contentContainer.dataset.capturePreset;
                    const presetClass = preset ? `preset-${preset}` : '';
                    
                    // **GỌI HÀM ĐÃ SỬA (chứa logic hoán đổi canvas)**
                    await this.captureAndDownload(contentContainer, baseTitle, presetClass);
                } else {
                     ui.showNotification('Không tìm thấy đối tượng hiển thị để chụp.', 'error');
                }
                return;
            }

            for (const [group, elements] of captureGroups.entries()) {
                const captureTitle = captureGroups.size > 1 ? `${baseTitle}_Nhom_${group}` : baseTitle;
                
                const targetElement = elements[0];
                const preset = targetElement.dataset.capturePreset;
                const isKpiGroup = group === 'kpi';
                
                let elementToCapture;
                let presetClass = '';

                if (isKpiGroup) {
                    presetClass = 'prepare-for-kpi-capture';
                } else if (preset) {
                    presetClass = `preset-${preset}`;
                }

                if (elements.length > 1 && !isKpiGroup) {
                    const tempContainer = document.createElement('div');
                    tempContainer.className = 'capture-layout-container';
                    elements.forEach(el => tempContainer.appendChild(el.cloneNode(true)));
                    elementToCapture = tempContainer;
                } else {
                    elementToCapture = targetElement;
                }
    
                // **GỌI HÀM ĐÃ SỬA (chứa logic hoán đổi canvas)**
                await this.captureAndDownload(elementToCapture, captureTitle, presetClass);
                await new Promise(resolve => setTimeout(resolve, 150)); // Giữ độ trễ giữa các lần chụp
            }
        } finally {
            styleElement.remove();
            // Bật lại animation
            if (window.Chart) {
                Chart.defaults.animation = {};
            }
        }

        ui.showNotification(`Đã hoàn tất chụp ảnh báo cáo ${baseTitle}!`, 'success');
    },
};