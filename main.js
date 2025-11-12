// Version 4.62 - Fix: Match 'onConfirm' prop name; Cleanup console.log clutter
// Version 4.61 - Fix: Use Svelte 5 'mount' function WITH event props (Fixes $on error)
// MODULE 5: BỘ ĐIỀU KHIỂN TRUNG TÂM (MAIN)
// File này đóng vai trò điều phối, nhập khẩu các module khác và khởi chạy ứng dụng.

// Import CSS của thư viện
import 'choices.js/public/assets/styles/choices.min.css';
import 'flatpickr/dist/flatpickr.min.css';

// Import CSS CỦA BẠN (Rất quan trọng)
import './styles/dashboard.css';

// Import các thư viện JS
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import Choices from 'choices.js';
import flatpickr from 'flatpickr';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Sortable from 'sortablejs';
import feather from 'feather-icons';
import { mount } from 'svelte'; // Dùng hàm mount của Svelte 5

// Gán chúng vào `window` để code cũ của bạn không bị lỗi
// (Vì code cũ của bạn đang gọi thẳng tên thư viện)
window.XLSX = XLSX;
window.html2canvas = html2canvas;
window.Choices = Choices;
window.flatpickr = flatpickr;
Chart.register(...registerables, ChartDataLabels);
window.Chart = Chart;
window.ChartDataLabels = ChartDataLabels;
window.Sortable = Sortable;
window.feather = feather;

// <--- THAY ĐỔI 1: Khai báo biến modal ở đây
let adminModal; 

// --- Code main.js cũ của bạn bắt đầu từ đây ---
import { config } from './config.js';
import { appState } from './state.js';
import { services } from './services.js';
import { ui } from './ui.js';
import { firebase } from './firebase.js'; // Giữ lại cho Core, Listeners
import { auth } from './auth.js';
import { luykeTab } from './tab-luyke.js';
import { sknvTab } from './tab-sknv.js';
import { uiRealtime } from './ui-realtime.js';
import { initializeEventListeners } from './event-listeners/ui-listeners.js';
import { sidebar } from './components/sidebar.js';
import { storage } from './modules/storage.js';
import { drawerInterface } from './components/drawer-interface.js';
import { drawerGoal } from './components/drawer-goal.js';
import { modalForceUpdate } from './components/modal-force-update.js';
// <--- THAY ĐỔI 2: Sửa lại cách import file Svelte (không có dấu {})
import ModalAdmin from './components/ModalAdmin.svelte';
import { modalLogin } from './components/modal-login.js';
import { modalHelp } from './components/modal-help.js';
import { modalChart } from './components/modal-chart.js';
import { modalComposer } from './components/modal-composer.js';
import { modalPreview } from './components/modal-preview.js';
import { modalSelection } from './components/modal-selection.js';
import { modalCustomerDetail } from './components/modal-customer-detail.js';
import { modalUnexportedDetail } from './components/modal-unexported-detail.js';
import { settingsService } from './modules/settings.service.js';
import { highlightService } from './modules/highlight.service.js';
import { dataService } from './services/data.service.js';

// === START: TÁI CẤU TRÚC (RE-WIRING) IMPORTS ===
import { analyticsService } from './services/analytics.service.js';
import { adminService } from './services/admin.service.js';
import { storageService } from './services/storage.service.js';
import { collaborationService } from './services/collaboration.service.js';
// === END: TÁI CẤU TRÚC (RE-WIRING) IMPORTS ===

const LOCAL_DATA_VERSIONS_KEY = '_localDataVersions';
const LOCAL_METADATA_PREFIX = '_localMetadata_';
const LOCAL_DSNV_FILENAME_KEY = '_localDsnvFilename';
const RAW_PASTE_THIDUANV_KEY = 'raw_paste_thiduanv';

const app = {
    // === START: FIX LỖI ===
    // Di chuyển ALL_DATA_MAPPING từ bên ngoài vào bên trong đối tượng 'app'
    ALL_DATA_MAPPING: {
        // Daily Files
        'ycx': { stateKey: 'ycxData', saveKey: 'saved_ycx', isPasted: false, uiId: 'ycx', firestoreKey: 'ycx' },
        'giocong': { stateKey: 'rawGioCongData', saveKey: 'saved_giocong', isPasted: false, uiId: 'giocong', firestoreKey: 'giocong' },
        'thuongnong': { stateKey: 'thuongNongData', saveKey: 'saved_thuongnong', isPasted: false, uiId: 'thuongnong', firestoreKey: 'thuongnong' },
        // Daily Pasted
        'pastedLuykeBI': { stateKey: null, saveKey: 'daily_paste_luyke', isPasted: true, uiId: 'status-luyke', firestoreKey: 'pastedLuykeBI' },
        'pastedThuongERP': { stateKey: 'thuongERPData', saveKey: 'daily_paste_thuongerp', isPasted: true, uiId: 'status-thuongerp', firestoreKey: 'pastedThuongERP', processFunc: services.processThuongERP },
        'pastedThiduaNVBI': { stateKey: 'pastedThiDuaReportData', saveKey: 'daily_paste_thiduanv', isPasted: true, uiId: 'status-thiduanv', firestoreKey: 'pastedThiduaNVBI' }, // *** MODIFIED (v4.40) ***
        // Previous Month Files
        'ycx-thangtruoc': { stateKey: 'ycxDataThangTruoc', saveKey: 'saved_ycx_thangtruoc', isPasted: false, uiId: 'ycx-thangtruoc', firestoreKey: 'ycx_thangtruoc' },
        'thuongnong-thangtruoc': { stateKey: 'thuongNongDataThangTruoc', saveKey: 'saved_thuongnong_thangtruoc', isPasted: false, uiId: 'thuongnong-thangtruoc', firestoreKey: 'thuongnong_thangtruoc' },
        // Previous Month Pasted
        'pastedThuongERPThangTruoc': { stateKey: 'thuongERPDataThangTruoc', saveKey: 'saved_thuongerp_thangtruoc', isPasted: true, uiId: 'status-thuongerp-thangtruoc', firestoreKey: 'pastedThuongERPThangTruoc', processFunc: services.processThuongERP }
    },
    // === END: FIX LỖI ===

    currentVersion: '4.2', // Giữ nguyên version này, bạn có thể tự cập nhật sau khi tích hợp xong
    storage: storage,
    unsubscribeDataListener: null,
    _isInitialized: false,
    _localDataVersions: {},

    async init() {
        try {
            await firebase.initCore();
            sidebar.render('#sidebar-container');
            drawerInterface.render('#interface-drawer-container');
            drawerGoal.render('#goal-drawer-container');
            modalForceUpdate.render('#modal-force-update-container');
            // <--- THAY ĐỔI 3: Xóa dòng modalAdmin.render(...) ở đây
            await modalLogin.render('#modal-login-container');
            modalHelp.render('#modal-help-container');
            modalChart.render('#modal-chart-container');
            modalComposer.render('#modal-composer-container');
            modalPreview.render('#modal-preview-container');
            modalSelection.render('#modal-selection-container');
            // === START: RENDER MODALS MỚI (TASK 3 & 4) ===
            modalCustomerDetail.render('#modal-customer-detail-container');
            modalUnexportedDetail.render('#modal-unexported-detail-container');
            // === END: RENDER MODALS MỚI ===
            feather.replace();

            const user = await auth.ensureAnonymousAuth();

            if (user && !this._isInitialized) {
                this._isInitialized = true;
                firebase.setupListeners();
                auth.initEmailIdentification(this.continueInit.bind(this));
            }

        } catch (error) {
            console.error("Lỗi nghiêm trọng trong quá trình khởi tạo ứng dụng:", error);
            ui.showNotification("Lỗi khởi tạo. Vui lòng thử tải lại trang.", "error");
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                    mainContent.innerHTML = '<div class="placeholder-message notification-error">Lỗi nghiêm trọng, không thể khởi động ứng dụng. Vui lòng kiểm tra kết nối mạng, cài đặt Firebase Rules và thử lại.</div>';
            }
        }
    },

    async continueInit() {
        if (!appState.currentUser || !appState.currentUser.email) {
                console.error("continueInit called without user email in appState.");
                ui.showNotification("Lỗi: Không tìm thấy thông tin người dùng.", "error");
                return;
        }

        // *** >>> SỬA LỖI ĐẾM LƯỢT TRUY CẬP: GỌI HÀM ĐẾM Ở ĐÂY <<< ***
        // === START: TÁI CẤU TRÚC (RE-WIRING) ===
        analyticsService.upsertUserRecord(appState.currentUser.email);
        // === END: TÁI CẤU TRÚC (RE-WIRING) ===
        // *** >>> KẾT THÚC SỬA LỖI <<< ***

        // === START REFACTOR 2 (Bước 2a) ===
        // Khởi tạo các mảng config
        appState.localCompetitionConfigs = []; // Từ LocalStorage
        appState.globalCompetitionConfigs = []; // Từ Firestore
        // === END REFACTOR 2 ===

        // ========== START: THÊM MỚI (Khởi tạo State SPĐQ) ==========
        appState.specialProductList = []; // Danh sách SPĐQ (Từ Firestore)
        appState.globalSpecialPrograms = []; // Cấu hình CT SPĐQ (Từ Firestore)
        
        // ========== END: THÊM MỚI ==========

        appState.viewingDetailFor = null;

        try {
            const storedVersions = localStorage.getItem(LOCAL_DATA_VERSIONS_KEY);
            if (storedVersions) {
                this._localDataVersions = JSON.parse(storedVersions);
            } else {
                this._localDataVersions = {};
            }
        } catch (e) {
             console.error("%cError loading _localDataVersions from localStorage:", "color: red;", e);
            this._localDataVersions = {};
        }

        this.loadAndApplyBookmarkLink();
        this.loadAndDisplayQrCode();
        this.setupMarquee();
        await this.storage.openDB();
        try {
            // === START: TÁI CẤU TRÚC (RE-WIRING) ===
            const { categories, brands } = await adminService.loadCategoryDataFromFirestore();
            // === END: TÁI CẤU TRÚC (RE-WIRING) ===
            appState.categoryStructure = categories;
            appState.brandList = brands;
            
            // === FIX 1a (Thêm) ===
            // Cập nhật trạng thái UI sau khi tải từ cloud, thay vì để trống
            ui.updateFileStatus('category-structure', 'Tải từ Cloud', `✓ Đã tải ${categories.length} nhóm & ${brands.length} hãng.`, 'success', false); // <<< SỬA (v4.47)
            // === END FIX ===

        } catch (error) {
                console.error("Error loading category data after auth:", error);
                ui.showNotification("Không thể tải cấu trúc ngành hàng từ cloud.", "error");
}

        try {
            // === START: TÁI CẤU TRÚC (RE-WIRING) ===
            const declarations = await adminService.loadDeclarationsFromFirestore();
            // === END: TÁI CẤU TRÚC (RE-WIRING) ===
            appState.declarations = declarations;
            const decYcxEl = document.getElementById('declaration-ycx');
            if (decYcxEl) decYcxEl.value = declarations.hinhThucXuat || config.DEFAULT_DATA.HINH_THUC_XUAT_TINH_DOANH_THU.join('\n');
            const decYcxGopEl = document.getElementById('declaration-ycx-gop');
            if (decYcxGopEl) decYcxGopEl.value = declarations.hinhThucXuatGop || config.DEFAULT_DATA.HINH_THUC_XUAT_TRA_GOP.join('\n');
            const decHeSoEl = document.getElementById('declaration-heso');
            if (decHeSoEl) decHeSoEl.value = declarations.heSoQuyDoi || Object.entries(config.DEFAULT_DATA.HE_SO_QUY_DOI).map(([k, v]) => `${k},${v}`).join('\n');
        } catch (error) {
             console.error("Error loading declarations after auth:", error);
                ui.showNotification("Không thể tải khai báo tính toán từ cloud.", "error");
        }
        
        // *** NEW (v4.41): Load competition name mappings from Firestore ***
        try {
            // === START: TÁI CẤU TRÚC (RE-WIRING) ===
            appState.competitionNameMappings = await adminService.loadCompetitionNameMappings();
            // === END: TÁI CẤU TRÚC (RE-WIRING) ===
        } catch (error) {
                console.error("Error loading competition name mappings:", error);
                ui.showNotification("Không thể tải tên rút gọn (thi đua) từ cloud.", "error");
                appState.competitionNameMappings = {}; // Ensure it's an object on failure
        }
        // *** END NEW ***

        // === START REFACTOR 2 (Bước 2c) ===
        try {
            appState.globalCompetitionConfigs = await adminService.loadGlobalCompetitionConfigs();
        } catch (error) {
            console.error("Error loading Global Competition Configs:", error);
            ui.showNotification("Không thể tải cấu hình thi đua chung từ cloud.", "error");
            appState.globalCompetitionConfigs = []; // Ensure it's an array on failure
        }
        // === END REFACTOR 2 ===

        // ========== START: THÊM MỚI (Tải SP Đặc Quyền & Cấu hình SPĐQ) ==========
        try {
            appState.specialProductList = await adminService.loadSpecialProductList();
            const productCount = appState.specialProductList.length; // Lấy số lượng
            
            // === START: THÊM MỚI (VÁ LỖI UI) v4.58 ===
            // Cập nhật trạng thái UI sau khi tải từ cloud (giống như logic của Danh mục Ngành hàng)
            if (productCount > 0) {
                ui.updateFileStatus('special-products', 'Tải từ Cloud', `✓ Đã tải ${productCount} sản phẩm.`, 'success', false);
            }
            // === END: THÊM MỚI (VÁ LỖI UI) v4.58 ===

        } catch (error) {
            console.error("Error loading Special Product List:", error);
            ui.showNotification("Không thể tải danh sách SP Đặc Quyền từ cloud.", "error");
            appState.specialProductList = []; // Ensure it's an array on failure
        }

        try {
            appState.globalSpecialPrograms = await adminService.loadGlobalSpecialPrograms();
        } catch (error) {
            console.error("Error loading Global Special Programs:", error);
            ui.showNotification("Không thể tải cấu hình SP Đặc Quyền từ cloud.", "error");
            appState.globalSpecialPrograms = []; // Ensure it's an array on failure
        }
        // ========== END: THÊM MỚI ==========

        initializeEventListeners(this);
        
        dataService.init(this); // <<< THÊM MỚI (v4.48): Khởi động data service
        await this.loadDataFromStorage();

        const savedWarehouse = localStorage.getItem('selectedWarehouse');
        if (savedWarehouse) {
            appState.selectedWarehouse = savedWarehouse;
            if(this.unsubscribeDataListener) this.unsubscribeDataListener();
            
            // <<< CẬP NHẬT (v4.48): Trỏ callback đến dataService >>>
            // (HÀM NÀY VẪN GỌI firebase. VÌ NÓ LÀ HÀM LÕI)
            this.unsubscribeDataListener = firebase.listenForDataChanges(savedWarehouse, (cloudData) => {
                dataService.handleCloudDataUpdate(cloudData);
            });

            const fileDataTypes = Object.keys(this.ALL_DATA_MAPPING).filter(k => !this.ALL_DATA_MAPPING[k].isPasted);

            fileDataTypes.forEach(fileTypeKey => {
                const mappingInfo = this.ALL_DATA_MAPPING[fileTypeKey];
                if (!mappingInfo) return;

                const { firestoreKey, uiId } = mappingInfo;
                
                // <<< CẬP NHẬT (v4.48): Gọi hàm helper từ dataService >>>
                const metadata = dataService._getSavedMetadata(savedWarehouse, firestoreKey); 
                const localVersionInfo = this._localDataVersions?.[savedWarehouse]?.[firestoreKey] || { version: 0, timestamp: 0 };

                const fileStatusSpan = document.getElementById(`file-status-${uiId}`);
                // === FIX 2b.1 (Sửa) ===
                // Thay đổi cách kiểm tra 'cache', vì chúng ta sẽ hiển thị số dòng
                const currentStatusIsCache = fileStatusSpan?.textContent?.includes('Đã tải');

                if (currentStatusIsCache) {
                        if (metadata && metadata.version > localVersionInfo.version) {
                         ui.updateFileStatus(uiId, metadata.fileName || 'Cloud', '', 'default', true, metadata, firestoreKey, savedWarehouse); // <<< SỬA (v4.47)
                        }
                } else if (metadata) {
                        if (metadata.version > localVersionInfo.version) {
                        ui.updateFileStatus(uiId, metadata.fileName || 'Cloud', '', 'default', true, metadata, firestoreKey, savedWarehouse); // <<< SỬA (v4.47)
                    } else {
                            ui.updateFileStatus(uiId, metadata.fileName || 'Cloud', '', 'default', true, metadata, firestoreKey, savedWarehouse); // <<< SỬA (v4.47)
                    }
                } else {
                     ui.updateFileStatus(uiId, '', `Đang chờ đồng bộ từ kho ${savedWarehouse}...`, 'default'); // <<< SỬA (v4.47)
                }
            });

        } else {
                Object.keys(this.ALL_DATA_MAPPING).filter(k => !this.ALL_DATA_MAPPING[k].isPasted).forEach(fileTypeKey => {
                   ui.updateFileStatus(this.ALL_DATA_MAPPING[fileTypeKey].uiId, '', 'Chọn kho để đồng bộ...', 'default'); // <<< SỬA (v4.47)
                });
                const dsnvFilename = localStorage.getItem(LOCAL_DSNV_FILENAME_KEY);
                if (!dsnvFilename) {
                    ui.updateFileStatus('danhsachnv', '', 'Chưa thêm file', 'default'); // <<< SỬA (v4.47)
                }
        }

        if (appState.danhSachNhanVien.length > 0) {
            ui.populateWarehouseSelector(); // <<< SỬA (v4.47)
         } else {
                console.error("[main.js continueInit] CRITICAL: appState.danhSachNhanVien is empty! Warehouse selector cannot be populated.");
                const selector = document.getElementById('data-warehouse-selector');
                if (selector) {
                    selector.innerHTML = '<option value="">-- Vui lòng tải Danh sách Nhân viên --</option>';
                    selector.disabled = true;
                }
        }

        settingsService.loadInterfaceSettings();
        settingsService.applyContrastSetting();
        settingsService.loadHighlightSettings();
        ui.populateAllFilters();
        settingsService.loadAndApplyLuykeGoalSettings();
        settingsService.loadAndApplyRealtimeGoalSettings();
        this.loadPastedDataFromStorage();
        this.switchTab('data-section');
        this.checkForUpdates();
        
        // <--- === START SVELTE 5 FIX === --->
        // Khởi tạo Modal Admin Svelte
        try {
          adminModal = mount(ModalAdmin, {
            target: document.getElementById('modal-admin-container'),
            props: {
              isVisible: false, // Ban đầu ẩn
              
              // Truyền hàm xử lý qua props
              onConfirm: () => {
                this.handleAdminLogin(); // Gọi hàm đăng nhập
              },
              onClose: () => {
                adminModal.$set({ isVisible: false }); // Ẩn modal
              }
            }
          });
        } catch (svelteError) {
          console.error("FATAL SVELTE ERROR:", svelteError);
          ui.showNotification("Lỗi nghiêm trọng khi khởi tạo component Svelte.", "error");
        }
        // <--- === END SVELTE 5 FIX === --->

        setInterval(() => this.checkForUpdates(), 15 * 60 * 1000);
    },

    async setupMarquee() {
        // ... (Giữ nguyên)
        const marqueeContainer = document.getElementById('version-marquee-container');
        const marqueeText = marqueeContainer?.querySelector('.marquee-text');
        if (!marqueeContainer || !marqueeText) return;
        try {
             const versionRes = await fetch(`./version.json?v=${new Date().getTime()}`);
            const versionInfo = await versionRes.json();
            const currentVersion = versionInfo.version || this.currentVersion;
            marqueeText.textContent = `🔥 Chi tiết bản cập nhật - Phiên bản ${currentVersion}`;
            marqueeContainer.addEventListener('click', async () => {
                    try {
                    const changelogRes = await fetch(`./changelog.json?v=${new Date().getTime()}`);
                    const changelogData = await changelogRes.json();
                    const modalTitle = document.getElementById('help-modal-title');
                    const modalContent = document.getElementById('help-modal-content');
                    if (modalTitle) modalTitle.textContent = "Lịch Sử Cập Nhật";
                    if (modalContent) modalContent.innerHTML = this._formatChangelogForModal(changelogData);
                    ui.toggleModal('help-modal', true);
                } catch (error) {
                    console.error("Lỗi khi tải hoặc hiển thị changelog:", error);
                    ui.showNotification("Không thể tải chi tiết cập nhật.", "error");
                }
            });
        } catch (error) {
            console.error("Lỗi khi thiết lập marquee:", error);
            marqueeText.textContent = "Không thể tải thông tin phiên bản.";
        }
    },

    // === START: MODIFIED FUNCTION (v4.51) ===
    _formatChangelogForModal(changelogData) {
        if (!changelogData || changelogData.length === 0) return '<p>Không có lịch sử cập nhật.</p>';
        
        return changelogData.map(item => {
             const notesHtml = item.notes.map(note => {
                // Yêu cầu mới: Kiểm tra xem 'note' là string hay object
                if (typeof note === 'object' && note !== null && note.title && Array.isArray(note.items)) {
                    // Đây là một mục lồng cấp
                    const subItemsHtml = note.items.map(subItem => 
                         // Sử dụng style 'list-style-type: "- "'
                        `<li class="ml-4" style="list-style-type: '- ';">${subItem}</li>`
                    ).join('');
                    
                    return `
                        <li class="mt-2 font-semibold text-gray-800">${note.title}
                            <ul class="font-normal text-gray-700 space-y-1 mt-1">
                                ${subItemsHtml}
                            </ul>
                        </li>
                    `;
                } else {
                    // Đây là một string bình thường
                    return `<li class="text-gray-700">${note}</li>`;
                }
            }).join('');

            return `
                <div class="mb-4 pb-4 border-b last:border-b-0">
                    <h4 class="font-bold text-blue-600 mb-2">Phiên bản ${item.version} (${item.date})</h4>
                     <ul class="list-disc list-inside space-y-1 text-sm">
                        ${notesHtml}
                    </ul>
                </div>
            `;
        }).join('');
    },
    // === END: MODIFIED FUNCTION ===

    async checkForUpdates() {
        // ... (Giữ nguyên)
        try {
            const response = await fetch(`./version.json?v=${new Date().getTime()}`);
            if (!response.ok) return;
            const serverConfig = await response.json();
            if (serverConfig.version && serverConfig.version !== this.currentVersion) {
                const changelogRes = await fetch(`./changelog.json?v=${new Date().getTime()}`);
                const changelogData = await changelogRes.json();
                const newVersionDetails = changelogData.find(log => log.version === serverConfig.version);
                const titleEl = document.getElementById('force-update-title');
                const notesContainer = document.getElementById('update-notes-container');
                if (titleEl) titleEl.textContent = `📢 Đã có phiên bản mới ${serverConfig.version}!`;
                if (notesContainer && newVersionDetails && newVersionDetails.notes) {
                    // Sử dụng cùng logic render của _formatChangelogForModal để hỗ trợ nested lists
                    const notesHtml = newVersionDetails.notes.map(note => {
                        if (typeof note === 'object' && note !== null && note.title && Array.isArray(note.items)) {
                            const subItemsHtml = note.items.map(subItem => 
                                `<li class="ml-4" style="list-style-type: '- ';">${subItem}</li>`
                             ).join('');
                            return `
                                <li class="mt-2 font-semibold text-gray-800">${note.title}
                                    <ul class="font-normal text-gray-700 space-y-1 mt-1">
                                         ${subItemsHtml}
                                    </ul>
                                </li>
                            `;
                        } else {
                             return `<li class="text-gray-700">${note}</li>`;
                        }
                    }).join('');
                    
                    notesContainer.innerHTML = `
                        <p class="text-sm font-semibold text-gray-700 mb-2">Nội dung cập nhật:</p>
                        <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
                             ${notesHtml}
                        </ul>
                    `;
                } else if (notesContainer) {
                    notesContainer.innerHTML = '<p class="text-sm text-gray-500">Không thể tải chi tiết cập nhật.</p>';
                }
                ui.toggleModal('force-update-modal', true);
            }
        } catch (error) {
                console.error('Không thể kiểm tra phiên bản mới:', error);
        }
    },

    async loadDataFromStorage() {
        // ... (Gi̟ữ nguyên)
    
        let dsnvLoadSuccess = false;
        const loadSavedFile = async (saveKey, stateKey, fileType, uiId) => {
            let savedData = null;
            try {
                savedData = await this.storage.getItem(saveKey);
            } catch (indexedDbError) {
                    console.error(`[main.js loadDataFromStorage] CRITICAL Error reading ${saveKey} from IndexedDB:`, indexedDbError);
                    ui.updateFileStatus(uiId, '', `Lỗi đọc cache IndexedDB!`, 'error'); // <<< SỬA (v4.47)
                    if (saveKey === 'saved_danhsachnv') {
                        const selector = document.getElementById('data-warehouse-selector');
                        if (selector) {
                            selector.innerHTML = '<option value="">Lỗi tải DSNV từ cache!</option>';
                            selector.disabled = true;
                        }
                    }
                 return;
            }

            if (!savedData) {
                return;
            }

            try {
                if (saveKey === 'saved_category_structure') {
                        if (appState.categoryStructure.length > 0 || appState.brandList.length > 0) {
                            // Đã được xử lý bởi logic Fix 1a, không cần làm gì ở đây
                    }
                    return;
                }
                const normalizedData = savedData;
                if (normalizedData && Array.isArray(normalizedData) && normalizedData.length > 0) {
                    appState[stateKey] = normalizedData;

                    let fileNameToShow = `Cache (${normalizedData.length} dòng)`;
                    // === FIX 2b.1 (Sửa) ===
                    let statusText = `✓ Đã tải ${normalizedData.length} dòng`;
                    let statusType = 'success';
                    let metadata = null;

                    const mappingEntry = Object.values(this.ALL_DATA_MAPPING).find(m => m.saveKey === saveKey);
                    const firestoreKey = mappingEntry ? mappingEntry.firestoreKey : null;

                    if (saveKey === 'saved_danhsachnv') {
                         dsnvLoadSuccess = true;
                            fileNameToShow = localStorage.getItem(LOCAL_DSNV_FILENAME_KEY) || fileNameToShow;
                    } else if (firestoreKey && !mappingEntry.isPasted) {
                            const currentWarehouse = localStorage.getItem('selectedWarehouse');
                            if (currentWarehouse) {
                                // <<< CẬP NHẬT (v4.48): Gọi hàm helper từ dataService >>>
                                metadata = dataService._getSavedMetadata(currentWarehouse, firestoreKey);
                                if (metadata) {
                                     fileNameToShow = metadata.fileName || fileNameToShow;
                                }
                            }
                    }

                    ui.updateFileStatus(uiId, fileNameToShow, statusText, statusType, false, metadata); // <<< SỬA (v4.47)

                    if (stateKey === 'danhSachNhanVien') {
                         services.updateEmployeeMaps();
                    }
                } else {
                        console.error(`[main.js loadDataFromStorage] Invalid or empty data array found in cache for ${saveKey}.`);
                        ui.updateFileStatus(uiId, '', `Lỗi dữ liệu cache.`, 'error'); // <<< SỬA (v4.47)
                        try {
                            await this.storage.setItem(saveKey, null);
                        } catch(clearError) {
                            console.error(`[main.js loadDataFromStorage] Failed to clear corrupted cache for ${saveKey}:`, clearError);
                        }
                }
                } catch (e) {
                console.error(`[main.js loadDataFromStorage] Lỗi xử lý ${saveKey} từ IndexedDB:`, e);
                ui.updateFileStatus(uiId, '', `Lỗi xử lý cache.`, 'error'); // <<< SỬA (v4.47)
             }
        };

        await loadSavedFile('saved_danhsachnv', 'danhSachNhanVien', 'danhsachnv', 'danhsachnv');
        if (!dsnvLoadSuccess) {
                console.error("[main.js loadDataFromStorage] CRITICAL: Failed to load 'saved_danhsachnv' from IndexedDB. App state might be incorrect.");
            const selector = document.getElementById('data-warehouse-selector');
                if (selector) {
                    selector.innerHTML = '<option value="">Lỗi tải DSNV từ cache!</option>';
                    selector.disabled = true;
                }
        }

        await loadSavedFile('saved_ycx_thangtruoc', 'ycxDataThangTruoc', 'ycx', 'ycx-thangtruoc');
        await loadSavedFile('saved_thuongnong_thangtruoc', 'thuongNongDataThangTruoc', 'thuongnong', 'thuongnong-thangtruoc');
        await loadSavedFile('saved_ycx', 'ycxData', 'ycx', 'ycx');
        await loadSavedFile('saved_giocong', 'rawGioCongData', 'giocong', 'giocong');
        await loadSavedFile('saved_thuongnong', 'thuongNongData', 'thuongnong', 'thuongnong');

        try {
                const savedLuykeGoals = localStorage.getItem('luykeGoalSettings');
            if(savedLuykeGoals) appState.luykeGoalSettings = JSON.parse(savedLuykeGoals);
            const savedRealtimeGoals = localStorage.getItem('realtimeGoalSettings');
            if (savedRealtimeGoals) appState.realtimeGoalSettings = JSON.parse(savedRealtimeGoals);
            const savedTemplates = localStorage.getItem('composerTemplates');
            if (savedTemplates) {
                let parsedTemplates = JSON.parse(savedTemplates);
                for (const key in parsedTemplates) {
                    if (typeof parsedTemplates[key] === 'string') {
                        const oldString = parsedTemplates[key];
                        parsedTemplates[key] = {};
                        if (key === 'luyke') parsedTemplates[key]['subtab-luyke-sieu-thi'] = oldString;
                        else if (key === 'sknv') parsedTemplates[key]['subtab-sknv'] = oldString;
                        else if (key === 'realtime') parsedTemplates[key]['subtab-realtime-sieu-thi'] = oldString;
                    }
                }
                appState.composerTemplates = parsedTemplates;
            } else {
                appState.composerTemplates = { luyke: {}, sknv: {}, realtime: {} };
            }

            // === START REFACTOR 2 (Bước 2d) ===
            // Đổi appState.competitionConfigs -> appState.localCompetitionConfigs
            const savedCompetition = localStorage.getItem('competitionConfigs');
            if (savedCompetition) appState.localCompetitionConfigs = JSON.parse(savedCompetition);
            // === END REFACTOR 2 ===
            
            // *** MODIFIED (v4.41): REMOVED localStorage load for competitionNameMappings ***
            // (Nó sẽ được tải từ Firestore trong continueInit)
            
            const savedPastedThiDua = localStorage.getItem('daily_paste_thiduanv');
            if (savedPastedThiDua) {
                try {
                    // Lưu ý: Chúng ta lưu mảng ĐÃ XỬ LÝ, không phải text thô
                     appState.pastedThiDuaReportData = JSON.parse(savedPastedThiDua); 
                } catch (e) {
                    console.error("Lỗi đọc daily_paste_thiduanv từ localStorage:", e);
                    appState.pastedThiDuaReportData = [];
                }
            }
            // *** END MODIFIED ***

        } catch (e) { console.error("Lỗi đọc cài đặt từ localStorage:", e); }
    },

    loadPastedDataFromStorage() {
        const loadPasted = (saveKey, stateKey, uiId, processFunc) => {
            const pastedText = localStorage.getItem(saveKey); // Đây là text thô (ngoại trừ daily_paste_thiduanv)
            
            if (pastedText) {
                    const el = document.getElementById(uiId.replace('status-', 'paste-'));
                    
                    // === FIX 2a.2 (Sửa) ===
                    // Không điền text thô cho ô thi đua NV, vì chúng ta lưu *dữ liệu đã xử lý* vào key đó
                     if (el && saveKey !== 'daily_paste_thiduanv') {
                    el.value = pastedText;
                    }
                    // === END FIX ===

                    let processedCount = 0;
                
                // === FIX 2a.2 (Sửa) ===
                if (saveKey === 'daily_paste_thiduanv') {
                     // Dữ liệu đã được tải vào appState.pastedThiDuaReportData trong loadDataFromStorage
                    processedCount = appState.pastedThiDuaReportData.length;
                } 
                // === END FIX ===
                else if (stateKey && processFunc) {
                    const processedData = processFunc(pastedText);
                    appState[stateKey] = processedData;
                    processedCount = processedData?.length || 0;
                } else if (uiId === 'status-luyke') {
                    // === FIX 2a.3 (Thêm) ===
                    // Xử lý ngay dữ liệu Lũy kế dán vào để appState.competitionData sẵn sàng
                    try {
                        services.parseCompetitionDataFromLuyKe(pastedText);
                    } catch(e) {
                         // (Bỏ log)
                    }
                    // === END FIX ===
                }


                const kho = localStorage.getItem('selectedWarehouse');
                const mappingInfo = Object.values(this.ALL_DATA_MAPPING).find(m => m.saveKey === saveKey);
                let metadata = null;
                if (kho && mappingInfo) {
                    // <<< CẬP NHẬT (v4.48): Gọi hàm helper từ dataService >>>
                     metadata = dataService._getSavedMetadata(kho, mappingInfo.firestoreKey);
                    if (metadata) {
                            ui.updatePasteStatus(uiId, '', 'success', metadata, processedCount); // <<< SỬA (v4.47)
                    } else {
                            // === FIX 2b.2 (Sửa) ===
                            let countMsg = processedCount > 0 ? `(${processedCount} NV)` : '';
                            if (uiId === 'status-luyke') countMsg = ''; // Lũy kế không đếm
                            ui.updatePasteStatus(uiId, `✓ Đã tải ${countMsg} (chưa đồng bộ)`, 'success', null, processedCount); // <<< SỬA (v4.47)
                    }
                } else if (pastedText) {
                        // === FIX 2b.2 (Sửa) ===
                         let countMsg = processedCount > 0 ? `(${processedCount} NV)` : '';
                        if (uiId === 'status-luyke') countMsg = '';
                        ui.updatePasteStatus(uiId, `✓ Đã tải ${countMsg} (chưa chọn kho)`, 'success', null, processedCount); // <<< SỬA (v4.47)
                }
            }
        };

        loadPasted('saved_thuongerp_thangtruoc', 'thuongERPDataThangTruoc', 'status-thuongerp-thangtruoc', services.processThuongERP);
        loadPasted('daily_paste_luyke', null, 'status-luyke', null);
        loadPasted('daily_paste_thiduanv', 'pastedThiDuaReportData', 'status-thiduanv', null); // *** MODIFIED (v4.40) ***
        loadPasted('daily_paste_thuongerp', 'thuongERPData', 'status-thuongerp', services.processThuongERP);

        // === FIX 2a.2 (Thêm) - Xử lý tải lại raw text cho Thi đua NV ===
        const rawThiDuaPaste = localStorage.getItem(RAW_PASTE_THIDUANV_KEY);
        if (rawThiDuaPaste) {
            const el = document.getElementById('paste-thiduanv');
            if (el) el.value = rawThiDuaPaste;
        }
        // === END FIX ===
    },

    updateAndRenderCurrentTab() {
        // ... (Giữ nguyên)
        ui.renderCompetitionConfigUI(); // <<< SỬA (v4.47)
        ui.renderSpecialProgramConfigUI(); // <<< THÊM MỚI (v4.55)
        const activeTab = document.querySelector('.page-section:not(.hidden)');
        if (!activeTab) {
            return;
        }
        switch (activeTab.id) {
            case 'health-section': luykeTab.render(); break;
            case 'health-employee-section': sknvTab.render(); break;
            case 'realtime-section': uiRealtime.render(); break;
        }
        feather.replace();
    },

    switchTab(targetId) {
            // ... (Giữ nguyên)
        document.querySelectorAll('.page-section').forEach(section => section.classList.toggle('hidden', section.id !== targetId));
        document.querySelectorAll('.nav-link').forEach(link => {
                 const isActive = link.getAttribute('href') === `#${targetId}`;
                link.classList.toggle('bg-blue-100', isActive);
            link.classList.toggle('text-blue-700', isActive);
        });
        if (targetId === 'home-section') ui.renderHomePage();
        else if (targetId === 'health-section') luykeTab.render();
        else if (targetId === 'health-employee-section') sknvTab.render();
        else if (targetId === 'realtime-section') uiRealtime.render();
        else if (targetId === 'declaration-section' && appState.isAdmin) ui.renderAdminPage();
        feather.replace();
    },

    async loadAndApplyBookmarkLink() {
        // ... (Giữ nguyên)
            try {
                // === START: TÁI CẤU TRÚC (RE-WIRING) ===
                const bookmarkUrl = await storageService.getBookmarkDownloadURL();
                // === END: TÁI CẤU TRÚC (RE-WIRING) ===
            const linkElement = document.getElementById('download-bookmark-link');
            if (linkElement) linkElement.href = bookmarkUrl;
        } catch (error) {
                console.error("Không thể tải link bookmark:", error);
            const linkElement = document.getElementById('download-bookmark-link');
            if (linkElement) linkElement.style.display = 'none';
        }
    },

    handleThiDuaVungFilterChange() {
        // ... (Giữ nguyên)
        const choicesInstance = appState.choices.thiDuaVung_sieuThi;
        if (!choicesInstance) return;
        const selectedValue = choicesInstance.getValue(true);
        if (selectedValue) {
             const reportData = services.generateThiDuaVungReport(selectedValue);
            ui.renderThiDuaVungInfographic(reportData);
        } else {
            const container = document.getElementById('thidua-vung-infographic-container');
            if(container) container.innerHTML = `<div class="placeholder-message">Vui lòng chọn một siêu thị để xem báo cáo.</div>`;
        }
    },

    handleDthangRealtimeViewChange(e) {
        // ... (Giğ nguyên)
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#dthang-realtime-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            uiRealtime.render();
        }
    },

    handleLuykeThiDuaViewChange(e) {
        // ... (Giữ nguyên)
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#luyke-thidua-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            luykeTab.render();
        }
    },

    handleThiDuaViewChange(e) {
        // ... (Giữ nguyên)
            const button = e.target.closest('.view-switcher__btn');
        if (button) {
                document.querySelectorAll('#thidua-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const view = button.dataset.view;
            const thiduaEmployeeSelectorEl = document.getElementById('thidua-employee-selector-container');
            if(thiduaEmployeeSelectorEl) thiduaEmployeeSelectorEl.classList.toggle('hidden', view !== 'employee');
            ui.displayCompetitionReport(view);
        }
    },

    _handleCompetitionFormShow(show = true, isEdit = false) {
        // ... (Giữ nguyên)
        const form = document.getElementById('competition-form');
        const addBtn = document.getElementById('add-competition-btn');
        if (!form || !addBtn) return;
        if (show) {
            ui.populateCompetitionFilters(); // <<< SỬA (v4.47)
            ui.populateCompetitionBrandFilter(); // <<< SỬA (v4.47)
        }
        form.classList.toggle('hidden', !show);
        addBtn.classList.toggle('hidden', show);
        if (show && !isEdit) {
                form.reset();
            document.getElementById('competition-id').value = '';
            appState.choices['competition_group']?.removeActiveItems();
            appState.choices['competition_brand']?.removeActiveItems();
            const priceSegmentEl = document.getElementById('price-segment');
            if(priceSegmentEl) priceSegmentEl.classList.add('hidden');
        }
    },

    _handleCompetitionFormEdit(index) {
        // ... (Giữ nguyên)
        // === START REFACTOR 2 (Bước 2d) ===
        // Sửa appState.competitionConfigs -> appState.globalCompetitionConfigs
        const config = appState.globalCompetitionConfigs[index];
        // === END REFACTOR 2 ===
        if (!config) return;
        this._handleCompetitionFormShow(true, true);
        document.getElementById('competition-id').value = index;
        document.getElementById('competition-name').value = config.name;
        const brandChoices = appState.choices['competition_brand'];
        if(brandChoices) {
            brandChoices.removeActiveItems();
            brandChoices.setChoiceByValue(config.brands || []);
        }
        const compTypeEl = document.getElementById('competition-type');
        if(compTypeEl) compTypeEl.value = config.type;
        const compExcludeEl = document.getElementById('competition-exclude-apple');
        if(compExcludeEl) compExcludeEl.checked = config.excludeApple;
        const priceSegment = document.getElementById('price-segment');
        if(priceSegment) priceSegment.classList.toggle('hidden', config.type !== 'soluong');
        const minPriceEl = document.getElementById('competition-min-price');
        if(minPriceEl) minPriceEl.value = config.minPrice ? config.minPrice / 1000000 : '';
        const maxPriceEl = document.getElementById('competition-max-price');
        if(maxPriceEl) maxPriceEl.value = config.maxPrice ? config.maxPrice / 1000000 : '';
        const groupChoices = appState.choices['competition_group'];
        if (groupChoices) {
             groupChoices.removeActiveItems();
            groupChoices.setChoiceByValue(config.groups);
        }
    },

    _handleCompetitionDelete(index) {
        // ... (Giữ nguyên)
        // === START REFACTOR 2 (Bước 2d) ===
        // Sửa logic để xóa khỏi global configs và lưu vào Firestore
        appState.globalCompetitionConfigs.splice(index, 1);
        adminService.saveGlobalCompetitionConfigs(appState.globalCompetitionConfigs);
        // === END REFACTOR 2 ===
        this.updateAndRenderCurrentTab();
        ui.showNotification('Đã xóa chương trình thi đua.', 'success');
    },

    _handleCompetitionFormSubmit(e) {
        // ... (Giữ nguyên)
        e.preventDefault();
        const id = document.getElementById('competition-id').value;
        const name = document.getElementById('competition-name').value.trim();
        if (!name) { ui.showNotification('Tên chương trình không được để trống.', 'error'); return; }
        const groupChoices = appState.choices['competition_group'];
        const groups = groupChoices ? groupChoices.getValue(true) : [];
        const brandChoices = appState.choices['competition_brand'];
        const brands = brandChoices ? brandChoices.getValue(true) : [];
        if (brands.length === 0) { ui.showNotification('Lỗi: Vui lòng chọn ít nhất một hãng sản xuất.', 'error'); return; }
        const compTypeEl = document.getElementById('competition-type');
        const minPriceEl = document.getElementById('competition-min-price');
        const maxPriceEl = document.getElementById('competition-max-price');
        const excludeAppleEl = document.getElementById('competition-exclude-apple');
        
        // === START REFACTOR 2 (Bước 2d) ===
        // Sửa logic để lưu vào global configs và Firestore
        const newConfig = {
            id: id ? appState.globalCompetitionConfigs[parseInt(id, 10)].id : `comp_${new Date().getTime()}`,
             name: name,
            brands: brands,
            groups: groups,
            type: compTypeEl ? compTypeEl.value : 'doanhthu',
            minPrice: (parseFloat(minPriceEl?.value) || 0) * 1000000,
            maxPrice: (parseFloat(maxPriceEl?.value) || 0) * 1000000,
            excludeApple: excludeAppleEl ? excludeAppleEl.checked : false,
        };
        if (id !== '') { appState.globalCompetitionConfigs[parseInt(id, 10)] = newConfig; }
        else { appState.globalCompetitionConfigs.push(newConfig); }
        adminService.saveGlobalCompetitionConfigs(appState.globalCompetitionConfigs);
// === END REFACTOR 2 ===
        
        this._handleCompetitionFormShow(false);
        this.updateAndRenderCurrentTab();
        ui.showNotification('Đã lưu chương trình thi đua thành công!', 'success');
    },


    _saveCompetitionConfigs() {
        // ... (Giữ nguyên)
        // === START REFACTOR 2 (Bước 2d) ===
        // Lưu config CÁ NHÂN (local) vào localStorage
        localStorage.setItem('competitionConfigs', JSON.stringify(appState.localCompetitionConfigs));
        // === END REFACTOR 2 ===
    },

    // ========== START: HÀM MỚI (SỬA LỖI) ==========
    _handleSpecialProgramFormShow(show = true, isEdit = false) {
        const form = document.getElementById('special-program-form');
        const addBtn = document.getElementById('add-special-program-btn');
        if (!form || !addBtn) return;

        if (show) {
            // Cần điền dữ liệu cho 'special-program-group'
            const groupSelectInstance = appState.choices['special_program_group'];
            if (groupSelectInstance) {
                // Lấy nhóm hàng từ danh sách SPĐQ đã tải
                const uniqueGroups = [...new Set(appState.specialProductList.map(item => String(item.nhomHang).trim()).filter(Boolean))].sort();
                const groupOptions = uniqueGroups.map(group => ({ value: group, label: group }));
                groupSelectInstance.clearStore();
                groupSelectInstance.setChoices(groupOptions, 'value', 'label', true);
            }
        }

        form.classList.toggle('hidden', !show);
        addBtn.classList.toggle('hidden', show);

        if (show && !isEdit) {
             form.reset();
            document.getElementById('special-program-id').value = '';
            appState.choices['special_program_group']?.removeActiveItems();
        }
    },

    // === START: SỬA LỖI (Bug 2) - Thêm hàm Sửa ===
    _handleSpecialProgramFormEdit(index) {
        const config = appState.globalSpecialPrograms[index];
        if (!config) {
            ui.showNotification('Lỗi: Không tìm thấy chương trình để sửa.', 'error');
            return;
        }

        // 1. Hiển thị form ở chế độ "Edit"
        this._handleSpecialProgramFormShow(true, true);

        // 2. Điền dữ liệu cũ vào form
        document.getElementById('special-program-id').value = index;
        document.getElementById('special-program-name').value = config.name;
        
        const groupChoices = appState.choices['special_program_group'];
        if (groupChoices) {
            groupChoices.removeActiveItems();
// Đảm bảo các lựa chọn (choices) có sẵn trước khi set giá trị
            const uniqueGroups = [...new Set(appState.specialProductList.map(item => String(item.nhomHang).trim()).filter(Boolean))].sort();
            const groupOptions = uniqueGroups.map(group => ({ value: group, label: group }));
            groupChoices.setChoices(groupOptions, 'value', 'label', true);
            // Set giá trị
            groupChoices.setChoiceByValue(config.groups || []);
        }
    },
    // === END: SỬA LỖI (Bug 2) ===

    _handleSpecialProgramFormSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('special-program-id').value;
        const name = document.getElementById('special-program-name').value.trim();
        if (!name) { 
            ui.showNotification('Tên chương trình không được để trống.', 'error'); 
            return; 
        }

        // === START: THÊM KIỂM TRA TRÙNG LẶP (v4.56) ===
        const newNameLower = name.trim().toLowerCase();
        // Kiểm tra xem có chương trình nào khác (không phải chính nó) có tên này không
        const existingProgram = appState.globalSpecialPrograms.find((p, index) => {
            const isDifferentProgram = id === '' || parseInt(id, 10) !== index;
            return isDifferentProgram && p.name.trim().toLowerCase() === newNameLower;
        });

        if (existingProgram) {
            ui.showNotification('Lỗi: Tên chương trình này đã tồn tại.', 'error');
            return;
        }
        // === END: THÊM KIỂM TRA TRÙNG LẶP ===
        
        const groupChoices = appState.choices['special_program_group'];
        const groups = groupChoices ? groupChoices.getValue(true) : [];
        
        if (groups.length === 0) { 
            ui.showNotification('Lỗi: Vui lòng chọn ít nhất một Nhóm hàng.', 'error'); 
            return; 
        }

        const newProgram = {
            id: id ? appState.globalSpecialPrograms[parseInt(id, 10)].id : `sp_${new Date().getTime()}`,
            name: name,
            groups: groups,
        };

        if (id !== '') { 
             appState.globalSpecialPrograms[parseInt(id, 10)] = newProgram; 
        } else { 
            appState.globalSpecialPrograms.push(newProgram); 
        }
        
        // Lưu lên Firestore
        adminService.saveGlobalSpecialPrograms(appState.globalSpecialPrograms);
        
        this._handleSpecialProgramFormShow(false);
        this.updateAndRenderCurrentTab();
        ui.showNotification('Đã lưu chương trình SP Đặc Quyền thành công!', 'success');
    },
    
    // === START: SỬA LỖI (Bug 2) - Thêm hàm Xóa ===
    _handleSpecialProgramDelete(index) {
        const config = appState.globalSpecialPrograms[index];
        if (!config) {
            ui.showNotification('Lỗi: Không tìm thấy chương trình để xóa.', 'error');
            return;
        }

        // 1. Xóa khỏi mảng state
        appState.globalSpecialPrograms.splice(index, 1);
        
        // 2. Lưu mảng mới lên Firestore
        adminService.saveGlobalSpecialPrograms(appState.globalSpecialPrograms);
        
        // 3. Render lại UI (drawer sẽ tự cập nhật)
        this.updateAndRenderCurrentTab();
        ui.showNotification(`Đã xóa chương trình "${config.name}".`, 'success');
    },
    // === END: SỬS LỖI (Bug 2) ===
    // ========== END: HÀM MỚI ==========

    // <--- === START SVELTE 5 FIX === --->
    // Thay thế hàm cũ bằng hàm logic mới
    handleAdminLogin() {
        // Logic kiểm tra mật khẩu đã được Svelte (ModalAdmin.svelte) xử lý xong.
        // Hàm này chỉ được gọi KHI MẬT KHẨU ĐÃ ĐÚNG.

        appState.isAdmin = true;
        ui.renderFeedbackSection(); // Cập nhật giao diện Góp ý
        ui.renderAdminHelpEditors(); // Tải nội dung Hướng dẫn (nếu có)
        this.switchTab('declaration-section'); // Quan trọng: Chuyển sang tab Khai báo

        // Đóng modal Svelte
        if (adminModal) {
            adminModal.$set({ isVisible: false });
        }
    },
    // <--- === END SVELTE 5 FIX === --->

    handleContrastChange(e) {
        // ... (Giữ nguyên)
            const level = e.target.value;
            localStorage.setItem('contrastLevel', level);
            document.documentElement.dataset.contrast = level;
    },

    handleHighlightColorChange(prefix) {
        // ... (Giữ nguyên)
        const activeType = appState.highlightSettings[prefix]?.type;
        if (activeType) {
                const choicesInstance = appState.choices[`${prefix}_highlight_${activeType}`];
                if(choicesInstance) {
                const values = choicesInstance.getValue(true);
                const colorEl = document.getElementById(`${prefix}-highlight-color`);
                const color = colorEl ? colorEl.value : '#ffff00';
                appState.highlightSettings[prefix] = { type: activeType, values, color };
                localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
                highlightService.applyHighlights(prefix);
                }
        }
    },

    handleClearHighlight(prefix) {
        // ... (Giữ nguyên)
        appState.highlightSettings[prefix] = {};
        localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
        ['nhanhang', 'nhomhang', 'employee'].forEach(type => {
            appState.choices[`${prefix}_highlight_${type}`]?.removeActiveItemsByValue(appState.choices[`${prefix}_highlight_${type}`]?.getValue(true) || []);
        });
        highlightService.applyHighlights(prefix);
    },

        async saveDeclarations() {
        // ... (Giữ nguyên)
        const ycxEl = document.getElementById('declaration-ycx');
        const ycxGopEl = document.getElementById('declaration-ycx-gop');
        const heSoEl = document.getElementById('declaration-heso');
        const declarationsToSave = {
            ycx: ycxEl ? ycxEl.value : '',
            ycxGop: ycxGopEl ? ycxGopEl.value : '',
             heSo: heSoEl ? heSoEl.value : ''
        };
        // === START: TÁI CẤU TRÚC (RE-WIRING) ===
        await adminService.saveDeclarationsToFirestore(declarationsToSave);
        // === END: TÁI CẤU TRÚC (RE-WIRING) ===
        appState.declarations.hinhThucXuat = declarationsToSave.ycx;
        appState.declarations.hinhThucXuatGop = declarationsToSave.ycxGop;
        appState.declarations.heSoQuyDoi = declarationsToSave.heSo;
        this.updateAndRenderCurrentTab();
    },

    saveHelpContent() {
        // ... (Giữ nguyên)
        const dataEl = document.getElementById('edit-help-data');
        const luykeEl = document.getElementById('edit-help-luyke');
        const sknvEl = document.getElementById('edit-help-sknv');
        const realtimeEl = document.getElementById('edit-help-realtime');
        const contents = {
                data: dataEl ? dataEl.value : '',
                 luyke: luykeEl ? luykeEl.value : '',
                sknv: sknvEl ? sknvEl.value : '',
                realtime: realtimeEl ? realtimeEl.value : ''
        };
        // === START: TÁI CẤU TRÚC (RE-WIRING) ===
        adminService.saveHelpContent(contents);
        // === END: TÁI CẤU TRÚC (RE-WIRING) ===
    },

    async handleSubmitFeedback() {
        // ... (Giữ nguyên)
        const textarea = document.getElementById('feedback-textarea');
        if(textarea){
            // === START: TÁI CẤU TRÚC (RE-WIRING) ===
            const success = await collaborationService.submitFeedback(textarea.value.trim());
            // === END: TÁI CẤU TRÚC (RE-WIRING) ===
            if (success) textarea.value = '';
        }
    },

    async handleFeedbackReplyActions(e, feedbackItem) {
        // ... (Giữ nguyên)
        const docId = feedbackItem.dataset.id;
        const replyForm = feedbackItem.querySelector('.reply-form-container');
        if (!replyForm) return;
        if (e.target.classList.contains('reply-btn')) { replyForm.classList.remove('hidden'); }
            if (e.target.classList.contains('cancel-reply-btn')) { replyForm.classList.add('hidden'); }
        if (e.target.classList.contains('submit-reply-btn')) {
                const textarea = replyForm.querySelector('textarea');
if(textarea){
                    // === START: TÁI CẤU TRÚC (RE-WIRING) ===
                    const success = await collaborationService.submitReply(docId, textarea.value.trim());
                    // === END: TÁI CẤU TRÚC (RE-WIRING) ===
                if (success) { textarea.value = ''; replyForm.classList.add('hidden'); }
                }
        }
    },

    _getFilteredReportData(sectionId) {
        // ... (Giữ nguyên)
        const masterData = appState.masterReportData[sectionId] || [];
        if (masterData.length === 0) return [];
        const warehouseEl = document.getElementById(`${sectionId}-filter-warehouse`);
        const deptEl = document.getElementById(`${sectionId}-filter-department`);
        const selectedWarehouse = warehouseEl ? warehouseEl.value : '';
        const selectedDept = deptEl ? deptEl.value : '';
        const selectedNames = appState.choices[`${sectionId}_employee`] ? appState.choices[`${sectionId}_employee`].getValue(true) : [];
        let filteredReport = masterData;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedNames && selectedNames.length > 0) filteredReport = filteredReport.filter(nv => selectedNames.includes(String(nv.maNV)));
        return filteredReport;
    },

    async prepareAndShowComposer(sectionId) {
        // ... (Giữ nguyên)
        const modal = document.getElementById('composer-modal');
        if (!modal) return;
        modal.dataset.sectionId = sectionId;
        const deptFilter = document.getElementById('composer-dept-filter');
        if (deptFilter) {
            const uniqueDepartments = [...new Set(appState.danhSachNhanVien.map(nv => nv.boPhan).filter(Boolean))].sort();
            deptFilter.innerHTML = '<option value="ALL">Toàn siêu thị</option>' + uniqueDepartments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
        }
        const navIdMap = { luyke: 'luyke-subtabs-nav', sknv: 'employee-subtabs-nav', realtime: 'realtime-subtabs-nav' };
        const mainViewNav = document.getElementById(navIdMap[sectionId]);
        const contextTabsContainer = document.getElementById('composer-context-tabs');
        const contextContentContainer = document.getElementById('composer-context-content');
        if(contextTabsContainer) contextTabsContainer.innerHTML = '';
        if(contextContentContainer) contextContentContainer.innerHTML = '';
        if (mainViewNav && contextTabsContainer && contextContentContainer) {
                const subTabButtons = mainViewNav.querySelectorAll('.sub-tab-btn');
            subTabButtons.forEach(btn => {
                    const subTabId = btn.dataset.target;
                const isActive = btn.classList.contains('active');
                 const newTabBtn = document.createElement('button');
                newTabBtn.className = `composer__tab-btn ${isActive ? 'active' : ''}`;
                newTabBtn.dataset.target = `context-pane-${subTabId}`;
                newTabBtn.textContent = btn.textContent.trim();
                    newTabBtn.addEventListener('click', () => {
                    contextTabsContainer.querySelectorAll('.composer__tab-btn').forEach(t => t.classList.remove('active'));
                    contextContentContainer.querySelectorAll('.composer__context-pane').forEach(c => c.classList.add('hidden'));
                     newTabBtn.classList.add('active');
                    const targetPane = document.getElementById(`context-pane-${subTabId}`);
                    if(targetPane) targetPane.classList.remove('hidden');
                });
                    contextTabsContainer.appendChild(newTabBtn);
                    const newContentPane = document.createElement('div');
                    newContentPane.id = `context-pane-${subTabId}`;
                    newContentPane.className = `composer__context-pane ${!isActive ? 'hidden' : ''}`;
                    const textarea = document.createElement('textarea');
                    textarea.className = 'composer__textarea';
                    textarea.rows = 15;
                    textarea.placeholder = `Soạn thảo nhận xét cho tab ${btn.textContent.trim()}...`;
                    if (!appState.composerTemplates[sectionId]) appState.composerTemplates[sectionId] = {};
                    textarea.value = appState.composerTemplates[sectionId]?.[subTabId] || '';
                    newContentPane.appendChild(textarea);
                    contextContentContainer.appendChild(newContentPane);
            });
            contextTabsContainer.classList.toggle('hidden', contextTabsContainer.children.length === 0);
        }
        
        const filteredReportData = this._getFilteredReportData(sectionId);
        const supermarketReport = services.aggregateReport(filteredReportData);
        ui.populateComposerDetailTags(supermarketReport);
        ui.showComposerModal(sectionId);
    },

    handleComposerActions(e, modal) {
        // ... (Giữ nguyên)
        const sectionId = modal.dataset.sectionId;
        const activeContextPane = modal.querySelector('.composer__context-pane:not(.hidden)');
        const activeTextarea = activeContextPane ? activeContextPane.querySelector('textarea') : null;
        if (e.target.matches('.composer__tab-btn:not([data-context-tab])')) {
            const nav = e.target.closest('.composer__nav');
            const content = nav?.nextElementSibling;
            if (nav && content) {
                    nav.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
                    content.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
                    e.target.classList.add('active');
                    const targetId = e.target.dataset.tab;
                    const targetContent = content.querySelector(`#${targetId}`);
                    if (targetContent) targetContent.classList.add('active');
            }
            return;
        }
        
        if (e.target.matches('.composer__icon-btn, .composer__tag-btn')) {
                if (!activeTextarea) { ui.showNotification("Vui lòng chọn một tab nội dung để chèn thẻ.", "error"); return; }
                let tagToInsert = e.target.dataset.tag;
            if (e.target.dataset.tagTemplate) {
                const deptFilterEl = document.getElementById('composer-dept-filter');
                const dept = deptFilterEl ? deptFilterEl.value : 'ALL';
                tagToInsert = e.target.dataset.tagTemplate.replace('{dept}', dept);
            }
            ui.insertComposerTag(activeTextarea, tagToInsert || e.target.textContent);
            return;
        }
            if (e.target.id === 'save-composer-template-btn') {
            if (!activeTextarea) return;
const activeContextTab = modal.querySelector('#composer-context-tabs .composer__tab-btn.active');
            const subTabId = activeContextTab?.dataset.target.replace('context-pane-', '');
            if (subTabId) {
                    if (!appState.composerTemplates[sectionId]) appState.composerTemplates[sectionId] ={};
                appState.composerTemplates[sectionId][subTabId] = activeTextarea.value;
                localStorage.setItem('composerTemplates', JSON.stringify(appState.composerTemplates));
                ui.showNotification(`Đã lưu mẫu cho tab con!`, 'success');
            } else { ui.showNotification(`Không tìm thấy tab con để lưu.`, 'error'); }
        }
        if (e.target.id === 'copy-composed-notification-btn') {
                if (!activeTextarea) { ui.showNotification("Lỗi: Không tìm thấy ô nội dung đang hoạt động.", "error"); return; }
                const template = activeTextarea.value;
                const filteredReportData = this._getFilteredReportData(sectionId);
                const supermarketReport = services.aggregateReport(filteredReportData);
                const warehouseEl = document.getElementById(`${sectionId}-filter-warehouse`);
                const selectedWarehouse = warehouseEl ? warehouseEl.value : null;
                const goals = sectionId === 'realtime' ? settingsService.getRealtimeGoalSettings(selectedWarehouse).goals : settingsService.getLuykeGoalSettings(selectedWarehouse).goals;
                const pasteLuykeEl = document.getElementById('paste-luyke');
                const competitionDataForComposer = services.parseCompetitionDataFromLuyKe(pasteLuykeEl?.value || '');
                const processedText = services.processComposerTemplate(template, supermarketReport, goals, filteredReportData, competitionDataForComposer, sectionId);
                ui.showPreviewAndCopy(processedText);
        }
    },

    async loadAndDisplayQrCode() {
        // ... (Giữ nguyên)
            try {
                // === START: TÁI CẤU TRÚC (RE-WIRING) ===
                const bookmarkUrl = await storageService.getBookmarkDownloadURL();
                // === END: TÁI CẤU TRÚC (RE-WIRING) ===
             const linkElement = document.getElementById('download-bookmark-link');
            if (linkElement) linkElement.href = bookmarkUrl;
        }
        catch (error) {
                console.error("Không thể tải link bookmark:", error);
            const linkElement = document.getElementById('download-bookmark-link');
            if (linkElement) linkElement.style.display = 'none';
        }
    }
};

// Khởi chạy ứng dụng khi DOM đã sẵn sàng
app.init();

// <--- THAY ĐỔI 5: Export biến adminModal
export { adminModal };