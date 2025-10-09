// Version 1.0 - Component: Chart Modal
// Chứa mã HTML cho modal hiển thị biểu đồ chi tiết.

const modalChartHTML = `
<div id="chart-modal" class="modal hidden">
    <div class="modal__overlay" data-close-modal></div>
    <div class="modal__container modal__container--large">
         <div class="modal__header">
            <h3 id="chart-modal-title" class="modal__title"></h3>
            <button class="modal__close-btn" data-close-modal>&times;</button>
        </div>
        <div class="modal__content">
            <canvas id="top10-chart"></canvas>
        </div>
    </div>
</div>
`;

export const modalChart = {
    render(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = modalChartHTML;
        }
    }
};