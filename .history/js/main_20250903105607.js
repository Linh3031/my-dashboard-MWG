// js/main.js
import config from './config.js';
import appState from './state.js';
import ui from './ui.js';
import services from './services.js';

document.addEventListener('DOMContentLoaded', function () {
    const app = {
        // Khởi tạo ứng dụng
        init() {
            this.loadDataFromStorage();
            this.setupEventListeners();
            this.switchTab('data-section'); // Mở tab Data đầu tiên
        },

        // Tải dữ liệu đã lưu từ localStorage
        loadDataFromStorage() {
            // Tải các khai báo
            document.getElementById('declaration-ycx').value = localStorage.getItem('declaration_ycx') || config.DEFAULT_DATA.HINH_THUC_XUAT_TINH_DOANH_THU.join('\n');
            document.getElementById('declaration-ycx-gop').value = localStorage.getItem('declaration_ycx_gop') || config.DEFAULT_DATA.HINH_THUC_XUAT_TRA_GOP.join('\n');
            document.getElementById('declaration-heso').value = localStorage.getItem('declaration_heso') || Object.entries(config.DEFAULT_DATA.HE_SO_QUY_DOI).map(([k, v]) => `${k},${v}`).join('\n');

            // Tải danh sách nhân viên đã lưu
            const savedNvData = localStorage.getItem('saved_danhsachnv');
            if (savedNvData) {
                try {
                    const rawData = JSON.parse(savedNvData);
                    const { normalizedData, success } = services.normalizeData(rawData, 'danhsachnv');
                    if (success) {
                        appState.danhSachNhanVien = normalizedData;
                        appState.employeeMaNVMap.clear();
                        appState.employeeNameToMaNVMap.clear();
                        appState.danhSachNhanVien.forEach(nv => {
                            if (nv.maNV) appState.employeeMaNVMap.set(nv.maNV, nv);
                            if (nv.hoTen) appState.employeeNameToMaNVMap.set(nv.hoTen.toLowerCase().replace(/\s+/g, ' '), nv.maNV);
                        });
                        document.getElementById('danhsachnv-saved-status').textContent = `Đã lưu ${appState.danhSachNhanVien.length} nhân viên.`;
                        ui.populateAllFilters();
                    }
                } catch (e) {
                    console.error("Lỗi đọc DSNV từ localStorage:", e);
                    localStorage.removeItem('saved_danhsachnv');
                }
            }
            // Tải các mục tiêu đã lưu
            try {
                const savedLuykeGoals = localStorage.getItem('luykeGoalSettings');
                if(savedLuykeGoals) appState.luykeGoalSettings = JSON.parse(savedLuykeGoals);
            } catch (e) {
                console.error("Lỗi đọc luykeGoalSettings từ localStorage:", e);
            }
        },

        // Hàm helper đọc file Excel
        async readExcelFile(file) {
            return new Promise((resolve, reject) => {
                if (!file) return reject(new Error("Không có file."));
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                        resolve(jsonData);
                    } catch (err) { reject(err); }
                };
                reader.onerror = (err) => reject(new Error("Không thể đọc file: " + err));
                reader.readAsArrayBuffer(file);
            });
        },

        // Xử lý chung cho việc đọc file
        async handleFileRead(file, fileType) {
            const dataName = document.querySelector(`#file-${fileType}`)?.dataset.name || fileType;
            const shouldSave = document.querySelector(`#file-${fileType}`)?.dataset.save === 'true';
            const fileNameSpan = document.getElementById(`file-name-${fileType}`);
            const fileStatusSpan = document.getElementById(`file-status-${fileType}`);

            if (!file) return;

            if (fileNameSpan) fileNameSpan.textContent = file.name;
            if (fileStatusSpan) fileStatusSpan.textContent = 'Đang xử lý...';
            ui.showProgressBar(fileType);

            try {
                const rawData = await this.readExcelFile(file);
                const result = services.normalizeData(rawData, fileType);
                
                if (result.success) {
                    // Cập nhật state tương ứng
                    const stateKeyMap = {
                        'danhsachnv': 'danhSachNhanVien',
                        'ycx': 'ycxData',
                        'giocong': 'gioCongData',
                        'thuongnong': 'thuongNongData',
                    };
                    if (stateKeyMap[fileType]) {
                        appState[stateKeyMap[fileType]] = result.normalizedData;
                    }
                    
                    if (fileType === 'danhsachnv') {
                        appState.employeeMaNVMap.clear(); 
                        appState.employeeNameToMaNVMap.clear();
                        appState.danhSachNhanVien.forEach(nv => {
                            if (nv.maNV) appState.employeeMaNVMap.set(nv.maNV, nv);
                            if (nv.hoTen) appState.employeeNameToMaNVMap.set(nv.hoTen.toLowerCase().replace(/\s+/g, ' '), nv.maNV);
                        });
                        ui.populateAllFilters();
                    }

                    if (fileStatusSpan) {
                        fileStatusSpan.textContent = `✓ Đã tải ${result.normalizedData.length} dòng.`;
                        fileStatusSpan.className = 'text-sm text-green-600';
                    }
                    ui.showNotification(`Tải thành công file "${dataName}"!`, 'success');

                    if (shouldSave) {
                        localStorage.setItem(`saved_${fileType}`, JSON.stringify(rawData));
                        const savedStatusEl = document.getElementById(`${fileType}-saved-status`);
                        if(savedStatusEl) savedStatusEl.textContent = `Đã lưu ${result.normalizedData.length} dòng.`;
                    }
                    
                    this.processAndRenderAllReports();
                } else {
                    if (fileStatusSpan) {
                        fileStatusSpan.textContent = `Lỗi: ${result.message}`;
                        fileStatusSpan.className = 'text-sm text-red-500';
                    }
                    ui.showNotification(result.message, 'error');
                }
                ui.displayDebugInfo(fileType);
            } catch (error) {
                console.error(`Lỗi xử lý file ${dataName}:`, error);
                if (fileStatusSpan) {
                    fileStatusSpan.textContent = `Lỗi: ${error.message}`;
                    fileStatusSpan.className = 'text-sm text-red-500';
                }
                ui.showNotification(`Lỗi khi xử lý file "${dataName}".`, 'error');
            } finally {
                ui.hideProgressBar(fileType);
            }
        },

        // Chạy lại tất cả các báo cáo
        processAndRenderAllReports() {
            if (appState.danhSachNhanVien.length === 0) return;
            this.applyHealthSectionFiltersAndRender();
            this.applySknvFiltersAndRender();
            this.applyRealtimeFiltersAndRender();
        },

        // Lọc và render tab Sức khỏe Siêu thị
        applyHealthSectionFiltersAndRender() {
            // ... (Logic sẽ được thêm vào sau)
        },
        
        // Lọc và render tab Sức khỏe Nhân viên
        applySknvFiltersAndRender() {
            // ... (Logic sẽ được thêm vào sau)
        },
        
        // Lọc và render tab Realtime
        applyRealtimeFiltersAndRender() {
            // ... (Logic sẽ được thêm vào sau)
        },

        // Chuyển tab
        switchTab(targetId) {
            document.querySelectorAll('.page-section').forEach(section => section.classList.toggle('hidden', section.id !== targetId));
            document.querySelectorAll('.nav-link').forEach(link => {
                const isActive = link.getAttribute('href') === `#${targetId}`;
                link.classList.toggle('bg-gray-200', isActive);
            });
        },
        
        // Gán tất cả sự kiện cho các element
        setupEventListeners() {
            // Navigation
            document.querySelectorAll('a.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchTab(link.getAttribute('href').substring(1));
                });
            });

            // Admin Modal
            document.getElementById('admin-access-btn').addEventListener('click', () => {
                document.getElementById('admin-modal').classList.remove('hidden');
            });
            document.getElementById('admin-submit-btn').addEventListener('click', () => {
                if (document.getElementById('admin-password-input').value === config.ADMIN_PASSWORD) {
                    this.switchTab('declaration-section');
                    document.getElementById('admin-modal').classList.add('hidden');
                    document.getElementById('admin-password-input').value = '';
                    document.getElementById('admin-error-msg').classList.add('hidden');
                } else {
                    document.getElementById('admin-error-msg').classList.remove('hidden');
                }
            });
            document.getElementById('admin-cancel-btn').addEventListener('click', () => {
                document.getElementById('admin-modal').classList.add('hidden');
            });

            // File Inputs
            document.querySelectorAll('.file-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    const fileType = e.target.id.replace('file-', '');
                    this.handleFileRead(file, fileType);
                });
            });

            // Paste Textareas
            const handleErpPaste = () => {
                const combinedText = document.getElementById('paste-thuongerp-1').value + '\n' + document.getElementById('paste-thuongerp-2').value;
                appState.thuongERPData = services.processThuongERP(combinedText);
                document.getElementById('status-thuongerp').textContent = `✓ Đã xử lý ${appState.thuongERPData.length} nhân viên.`;
                this.processAndRenderAllReports();
            };
            document.getElementById('paste-thuongerp-1').addEventListener('input', handleErpPaste);
            document.getElementById('paste-thuongerp-2').addEventListener('input', handleErpPaste);

            document.getElementById('paste-luyke').addEventListener('input', (e) => {
                const pastedText = e.target.value;
                document.getElementById('status-luyke').textContent = '✓ Đã nhận dữ liệu.';
                if (!pastedText.trim()) return;
                services.parseCompetitionDataFromLuyKe(pastedText);
                this.processAndRenderAllReports();
            });

            // Save Declarations
            document.getElementById('save-declaration-btn').addEventListener('click', () => {
                localStorage.setItem('declaration_ycx', document.getElementById('declaration-ycx').value);
                localStorage.setItem('declaration_ycx_gop', document.getElementById('declaration-ycx-gop').value);
                localStorage.setItem('declaration_heso', document.getElementById('declaration-heso').value);
                ui.showNotification('Đã lưu khai báo!', 'success');
                this.processAndRenderAllReports(); // Chạy lại báo cáo sau khi lưu
            });

            // Sub-tabs
            document.querySelectorAll('.sub-tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const nav = e.target.closest('nav');
                    nav.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const targetId = btn.dataset.target;
                    const contentContainer = nav.closest('.border-b')?.nextElementSibling;
                    if (contentContainer) {
                        contentContainer.querySelectorAll('.sub-tab-content').forEach(content => {
                            content.classList.toggle('hidden', content.id !== targetId);
                        });
                    }
                });
            });
        }
    };

    app.init();
});
