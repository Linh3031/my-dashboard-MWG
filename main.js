// Version 3.3 - Add handler for Luy Ke Competition view switcher
// MODULE 5: BỘ ĐIỀU KHIỂN TRUNG TÂM (MAIN)
// File này đóng vai trò điều phối, nhập khẩu các module khác và khởi chạy ứng dụng.

import { config } from './config.js';
import { appState } from './state.js';
import { services } from './services.js';
import { ui } from './ui.js';
import { firebase } from './firebase.js';
import { auth } from './auth.js';
import { luykeTab } from './tab-luyke.js';
import { sknvTab } from './tab-sknv.js';
import { realtimeTab } from './tab-realtime.js';
import { initializeEventListeners } from './event-listeners/ui-listeners.js';
import { sidebar } from './components/sidebar.js';
import { storage } from './modules/storage.js';
import { drawerInterface } from './components/drawer-interface.js';
import { drawerGoal } from './components/drawer-goal.js';
import { modalForceUpdate } from './components/modal-force-update.js';
import { modalAdmin } from './components/modal-admin.js';
import { modalHelp } from './components/modal-help.js';
import { modalChart } from './components/modal-chart.js';
import { modalComposer } from './components/modal-composer.js';
import { modalPreview } from './components/modal-preview.js';
import { modalSelection } from './components/modal-selection.js';
import { settingsService } from './modules/settings.service.js';
import { highlightService } from './modules/highlight.service.js';

const app = {
    currentVersion: '3.3',
    storage: storage,

    async init() {
        try {
            appState.competitionConfigs = [];

            await firebase.init();
            auth.init();

            // Render static UI components
            sidebar.render('#sidebar-container');
            drawerInterface.render('#interface-drawer-container');
            drawerGoal.render('#goal-drawer-container');
            modalForceUpdate.render('#modal-force-update-container');
            modalAdmin.render('#modal-admin-container');
            modalHelp.render('#modal-help-container');
            modalChart.render('#modal-chart-container');
            modalComposer.render('#modal-composer-container');
            modalPreview.render('#modal-preview-container');
            modalSelection.render('#modal-selection-container');

            this.loadAndApplyBookmarkLink();
            this.loadAndDisplayQrCode(); 
            this.setupMarquee(); // <<< GỌI HÀM MỚI

            await this.storage.openDB();

            // === START: TẢI TẤT CẢ DỮ LIỆU TỪ FIRESTORE ===
            console.log("Loading category data from Firestore...");
            const { categories, brands } = await firebase.loadCategoryDataFromFirestore();
            appState.categoryStructure = categories;
            appState.brandList = brands;
            console.log(`Successfully populated ${appState.categoryStructure.length} categories and ${appState.brandList.length} brands from Firestore.`);
            
            console.log("Loading calculation declarations from Firestore...");
            const declarations = await firebase.loadDeclarationsFromFirestore();
            appState.declarations = declarations;
            document.getElementById('declaration-ycx').value = declarations.hinhThucXuat || config.DEFAULT_DATA.HINH_THUC_XUAT_TINH_DOANH_THU.join('\n');
            document.getElementById('declaration-ycx-gop').value = declarations.hinhThucXuatGop || config.DEFAULT_DATA.HINH_THUC_XUAT_TRA_GOP.join('\n');
            document.getElementById('declaration-heso').value = declarations.heSoQuyDoi || Object.entries(config.DEFAULT_DATA.HE_SO_QUY_DOI).map(([k, v]) => `${k},${v}`).join('\n');
            // === END: TẢI TẤT CẢ DỮ LIỆU TỪ FIRESTORE ===

            initializeEventListeners(this);

            await this.loadDataFromStorage();

            settingsService.loadInterfaceSettings();
            settingsService.applyContrastSetting();
            settingsService.loadHighlightSettings();

            ui.populateAllFilters();

            settingsService.loadAndApplyLuykeGoalSettings();
            settingsService.loadAndApplyRealtimeGoalSettings();

            this.loadPastedDataFromStorage();

            this.switchTab('data-section');
            this.checkForUpdates();
            setInterval(() => this.checkForUpdates(), 15 * 60 * 1000);
        } catch (error) {
            console.error("Lỗi nghiêm trọng trong quá trình khởi tạo ứng dụng:", error);
        }
    },

    // === START: HÀM MỚI ĐỂ XỬ LÝ DÒNG CHỮ CHẠY ===
    async setupMarquee() {
        const marqueeContainer = document.getElementById('version-marquee-container');
        const marqueeText = marqueeContainer?.querySelector('.marquee-text');

        if (!marqueeContainer || !marqueeText) return;

        try {
            // Lấy số phiên bản
            const versionRes = await fetch(`./version.json?v=${new Date().getTime()}`);
            const versionInfo = await versionRes.json();
            const currentVersion = versionInfo.version || this.currentVersion;
            marqueeText.textContent = `🔥 Chi tiết bản cập nhật - Phiên bản ${currentVersion}`;

            // Gắn sự kiện click
            marqueeContainer.addEventListener('click', async () => {
                try {
                    const changelogRes = await fetch(`./changelog.json?v=${new Date().getTime()}`);
                    const changelogData = await changelogRes.json();
                    
                    const modalTitle = document.getElementById('help-modal-title');
                    const modalContent = document.getElementById('help-modal-content');

                    if (modalTitle) modalTitle.textContent = "Lịch Sử Cập Nhật";
                    if (modalContent) {
                        modalContent.innerHTML = this._formatChangelogForModal(changelogData);
                    }
                    
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

    _formatChangelogForModal(changelogData) {
        if (!changelogData || changelogData.length === 0) {
            return '<p>Không có lịch sử cập nhật.</p>';
        }
        return changelogData.map(item => `
            <div class="mb-4 pb-4 border-b last:border-b-0">
                <h4 class="font-bold text-blue-600 mb-2">Phiên bản ${item.version} (${item.date})</h4>
                <ul class="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    ${item.notes.map(note => `<li>${note}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    },
    // === END: HÀM MỚI ===

    async checkForUpdates() {
        try {
            const response = await fetch(`./version.json?v=${new Date().getTime()}`);
            if (!response.ok) return;
            const serverConfig = await response.json();
            
            if (serverConfig.version && serverConfig.version !== this.currentVersion) {
                console.log(`Phiên bản mới ${serverConfig.version} đã sẵn sàng!`);

                const changelogRes = await fetch(`./changelog.json?v=${new Date().getTime()}`);
                const changelogData = await changelogRes.json();
                const newVersionDetails = changelogData.find(log => log.version === serverConfig.version);

                const titleEl = document.getElementById('force-update-title');
                const notesContainer = document.getElementById('update-notes-container');

                if (titleEl) {
                    titleEl.textContent = `📢 Đã có phiên bản mới ${serverConfig.version}!`;
                }

                if (notesContainer && newVersionDetails && newVersionDetails.notes) {
                    notesContainer.innerHTML = `
                        <p class="text-sm font-semibold text-gray-700 mb-2">Nội dung cập nhật:</p>
                        <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
                            ${newVersionDetails.notes.map(note => `<li>${note}</li>`).join('')}
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
        const loadSavedFile = async (saveKey, stateKey, fileType, uiId) => {
            if (saveKey === 'saved_category_structure') {
                if (appState.categoryStructure.length > 0 || appState.brandList.length > 0) {
                    ui.updateFileStatus('category-structure', 'Tải từ Cloud', `✓ Đã tải ${appState.categoryStructure.length} nhóm & ${appState.brandList.length} hãng.`, 'success');
                }
                return;
            }

            const savedData = await this.storage.getItem(saveKey);
            if (!savedData) return;

            try {
                const { normalizedData, success } = services.normalizeData(savedData, fileType);
                if (success) {
                    appState[stateKey] = normalizedData;
                    ui.updateFileStatus(uiId, '', `✓ Đã tải ${normalizedData.length} dòng.`, 'success');
                }
            } catch (e) { console.error(`Lỗi đọc ${uiId} từ IndexedDB:`, e); }
        };

        await loadSavedFile('saved_danhsachnv', 'danhSachNhanVien', 'danhsachnv', 'danhsachnv');
        if (appState.danhSachNhanVien.length > 0) {
            services.updateEmployeeMaps();
        }
        await loadSavedFile('saved_category_structure', null, null, null);
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

            const savedCompetition = localStorage.getItem('competitionConfigs');
            if (savedCompetition) appState.competitionConfigs = JSON.parse(savedCompetition);

        } catch (e) { console.error("Lỗi đọc cài đặt từ localStorage:", e); }
    },

    loadPastedDataFromStorage() {
        const pasteThuongERPThangTruoc = localStorage.getItem('saved_thuongerp_thangtruoc');
        if (pasteThuongERPThangTruoc) {
            const el = document.getElementById('paste-thuongerp-thangtruoc');
            if(el) {
                el.value = pasteThuongERPThangTruoc;
                this.handleErpThangTruocPaste({ target: el });
            }
        }
        const pasteLuyke = localStorage.getItem('daily_paste_luyke');
        if (pasteLuyke) {
            document.getElementById('paste-luyke').value = pasteLuyke;
            this.handleLuykePaste();
        }

        const pasteThiduaNV = localStorage.getItem('daily_paste_thiduanv');
        if (pasteThiduaNV) {
            document.getElementById('paste-thiduanv').value = pasteThiduaNV;
            this.handleThiduaNVPaste();
        }

        const pasteThuongERP = localStorage.getItem('daily_paste_thuongerp');
        if (pasteThuongERP) {
            const el = document.getElementById('paste-thuongerp');
            if(el) {
                el.value = pasteThuongERP;
                this.handleErpPaste();
            }
        }
    },

    handleFileRead(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error("No file provided."));
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    resolve(workbook);
                } catch (err) { reject(err); }
            };
            reader.onerror = (err) => reject(new Error("Could not read the file: " + err));
            reader.readAsArrayBuffer(file);
        });
    },

    updateAndRenderCurrentTab() {
        if (appState.danhSachNhanVien.length === 0) return;

        ui.renderCompetitionConfigUI();

        const activeTab = document.querySelector('.page-section:not(.hidden)');
        if (!activeTab) return;

        switch (activeTab.id) {
            case 'health-section':
                luykeTab.render();
                break;
            case 'health-employee-section':
                sknvTab.render();
                break;
            case 'realtime-section':
                realtimeTab.render();
                break;
        }
    },

    switchTab(targetId) {
        document.querySelectorAll('.page-section').forEach(section => section.classList.toggle('hidden', section.id !== targetId));
        document.querySelectorAll('.nav-link').forEach(link => {
            const isActive = link.getAttribute('href') === `#${targetId}`;
            link.classList.toggle('bg-blue-100', isActive);
            link.classList.toggle('text-blue-700', isActive);
        });

        if (targetId === 'home-section') ui.renderHomePage();
        else if (targetId === 'health-section') luykeTab.render();
        else if (targetId === 'health-employee-section') sknvTab.render();
        else if (targetId === 'realtime-section') realtimeTab.render();
        else if (targetId === 'declaration-section' && appState.isAdmin) ui.renderAdminHelpEditors();
    },

    async loadAndApplyBookmarkLink() {
        try {
            const bookmarkUrl = await firebase.getBookmarkDownloadURL();
            const linkElement = document.getElementById('download-bookmark-link');
            if (linkElement) {
                linkElement.href = bookmarkUrl;
            }
        } catch (error) {
            console.error("Không thể tải link bookmark:", error);
            const linkElement = document.getElementById('download-bookmark-link');
            if (linkElement) {
                linkElement.style.display = 'none';
            }
        }
    },

    handleLuykePaste() {
        const pastedText = document.getElementById('paste-luyke')?.value || '';
        localStorage.setItem('daily_paste_luyke', pastedText);
        ui.updatePasteStatus('status-luyke');
        this.updateAndRenderCurrentTab();
    },

    handleThiduaNVPaste() {
        const pastedText = document.getElementById('paste-thiduanv')?.value || '';
        localStorage.setItem('daily_paste_thiduanv', pastedText);
        sknvTab.render();
        ui.updatePasteStatus('status-thiduanv', '✓ Đã xử lý và hiển thị báo cáo.');
    },

    handleErpPaste() {
        const pastedText = document.getElementById('paste-thuongerp')?.value || '';
        localStorage.setItem('daily_paste_thuongerp', pastedText);
        appState.thuongERPData = services.processThuongERP(pastedText);
        ui.updatePasteStatus('status-thuongerp', `✓ Đã xử lý ${appState.thuongERPData.length} nhân viên.`);
        this.updateAndRenderCurrentTab();
    },

    handleErpThangTruocPaste(e) {
         const pastedText = e.target.value;
         localStorage.setItem('saved_thuongerp_thangtruoc', pastedText);
         appState.thuongERPDataThangTruoc = services.processThuongERP(pastedText);
         ui.updatePasteStatus('status-thuongerp-thangtruoc', `✓ Đã xử lý ${appState.thuongERPDataThangTruoc.length} nhân viên.`);
         sknvTab.render();
    },

    async handleRealtimeFileInput(e) {
        const file = e.target.files[0];
        if (!file) return;
        ui.showNotification('Đang xử lý file realtime...', 'success');
        appState.realtimeYCXData = [];
        e.target.value = '';
        try {
            const workbook = await this.handleFileRead(file);
            const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const { normalizedData, success, missingColumns } = services.normalizeData(rawData, 'ycx');
            ui.displayDebugInfo('ycx-realtime');
            if (success) {
                appState.realtimeYCXData = normalizedData;
                ui.populateRealtimeBrandCategoryFilter();
                ui.showNotification(`Tải thành công ${normalizedData.length} dòng realtime!`, 'success');
                this.updateAndRenderCurrentTab();
            } else {
                 ui.showNotification(`File realtime lỗi: Thiếu cột ${missingColumns.join(', ')}.`, 'error');
                 if (document.getElementById('debug-tool-container')?.classList.contains('hidden')) {
                    document.getElementById('toggle-debug-btn')?.click();
                 }
            }
        } catch (err) { ui.showNotification(`Có lỗi khi đọc file: ${err.message}`, 'error'); console.error(err); }
    },
    
    async handleCategoryFile(e) {
        const fileInput = e.target;
        const file = fileInput.files[0];
        if (!file) return;
        ui.updateFileStatus('category-structure', file.name, 'Đang xử lý...', 'default');
        ui.showProgressBar('category-structure');
        try {
            const workbook = await this.handleFileRead(file);
            const categorySheet = workbook.Sheets[workbook.SheetNames[0]];
            const categoryRawData = XLSX.utils.sheet_to_json(categorySheet);
            const categoryResult = services.normalizeCategoryStructureData(categoryRawData);
            let brandResult = { success: true, normalizedData: [] };
            const brandSheetName = workbook.SheetNames.find(name => name.toLowerCase().trim() === 'hãng');
            if (brandSheetName) {
                const brandSheet = workbook.Sheets[brandSheetName];
                const brandRawData = XLSX.utils.sheet_to_json(brandSheet);
                brandResult = services.normalizeBrandData(brandRawData);
            }
            if(categoryResult.success) {
                appState.categoryStructure = categoryResult.normalizedData;
                appState.brandList = brandResult.normalizedData;
                await firebase.saveCategoryDataToFirestore({ categories: categoryResult.normalizedData, brands: brandResult.normalizedData });
                ui.updateFileStatus('category-structure', file.name, `✓ Đã xử lý và đồng bộ ${categoryResult.normalizedData.length} nhóm & ${brandResult.normalizedData.length} hãng.`, 'success');
            } else {
                ui.showNotification(`Lỗi xử lý file khai báo: ${categoryResult.error}`, 'error');
            }
        } catch (error) {
            ui.updateFileStatus('category-structure', file.name, `Lỗi: ${error.message}`, 'error');
        } finally {
            ui.hideProgressBar('category-structure');
            fileInput.value = '';
        }
    },
    
    async handleThiDuaVungFileInput(e) {
        const fileInput = e.target;
        const file = fileInput.files[0];
        if (!file) return;
        ui.updateFileStatus('thidua-vung', file.name, 'Đang xử lý...', 'default');
        try {
            const workbook = await this.handleFileRead(file);
            const { chiTietData, tongData } = services.processThiDuaVungFile(workbook);
            if (!tongData || tongData.length === 0) throw new Error('Không tìm thấy dữ liệu hợp lệ trong sheet "TONG".');
            appState.thiDuaVungChiTiet = chiTietData;
            appState.thiDuaVungTong = tongData;
            const supermarketKey = Object.keys(tongData[0]).find(k => k.trim().toLowerCase().includes('siêu thị'));
            const supermarketNames = [...new Set(tongData.map(row => row[supermarketKey]).filter(Boolean))].sort();
            const choicesInstance = appState.choices.thiDuaVung_sieuThi;
            if (choicesInstance) {
                choicesInstance.clearStore();
                choicesInstance.setChoices(supermarketNames.map(name => ({ value: name, label: name })), 'value', 'label', true);
            }
            ui.updateFileStatus('thidua-vung', file.name, `✓ Đã xử lý ${supermarketNames.length} siêu thị.`, 'success');
        } catch (error) {
            ui.updateFileStatus('thidua-vung', file.name, `Lỗi: ${error.message}`, 'error');
        }
    },

    handleThiDuaVungFilterChange() {
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

    handleSknvViewChange(e) {
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#sknv-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const view = button.dataset.view;
            document.getElementById('sknv-employee-selector-container').classList.toggle('hidden', view !== 'detail');
            sknvTab.render();
        }
    },

    handleDtnvRealtimeViewChange(e) {
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#dtnv-realtime-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const view = button.dataset.view;
            document.getElementById('dtnv-realtime-employee-selector-container').classList.toggle('hidden', view !== 'infographic');
            realtimeTab.render();
        }
    },

    handleDthangRealtimeViewChange(e) {
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#dthang-realtime-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            realtimeTab.render();
        }
    },

    handleLuykeThiDuaViewChange(e) {
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#luyke-thidua-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            luykeTab.render();
        }
    },

    handleThiDuaViewChange(e) {
        const button = e.target.closest('.view-switcher__btn');
        if (button) {
            document.querySelectorAll('#thidua-view-selector .view-switcher__btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const view = button.dataset.view;
            document.getElementById('thidua-employee-selector-container').classList.toggle('hidden', view !== 'employee');
            ui.displayCompetitionReport(view);
        }
    },

    async handleCompetitionDebugFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        ui.showNotification('Đang phân tích file gỡ lỗi...', 'success');
        try {
            const workbook = await this.handleFileRead(file);
            const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const debugResults = services.debugCompetitionFiltering(rawData);
            ui.renderCompetitionDebugReport(debugResults);
        } catch (err) {
            ui.showNotification(`Lỗi khi đọc file gỡ lỗi: ${err.message}`, 'error');
        }
    },

    _handleCompetitionFormShow(show = true, isEdit = false) {
        const form = document.getElementById('competition-form');
        const addBtn = document.getElementById('add-competition-btn');
        if (!form || !addBtn) return;

        if (show) {
            ui.populateCompetitionFilters();
            ui.populateCompetitionBrandFilter();
        }

        form.classList.toggle('hidden', !show);
        addBtn.classList.toggle('hidden', show);

        if (show && !isEdit) {
            form.reset();
            document.getElementById('competition-id').value = '';
            appState.choices['competition_group']?.removeActiveItems();
            appState.choices['competition_brand']?.removeActiveItems();
            document.getElementById('price-segment').classList.add('hidden');
        }
    },

    _handleCompetitionFormEdit(index) {
        const config = appState.competitionConfigs[index];
        if (!config) return;

        this._handleCompetitionFormShow(true, true);
        
        document.getElementById('competition-id').value = index;
        document.getElementById('competition-name').value = config.name;
        
        const brandChoices = appState.choices['competition_brand'];
        if(brandChoices) {
            brandChoices.removeActiveItems();
            brandChoices.setChoiceByValue(config.brands || []);
        }

        document.getElementById('competition-type').value = config.type;
        document.getElementById('competition-exclude-apple').checked = config.excludeApple;
        
        const priceSegment = document.getElementById('price-segment');
        priceSegment.classList.toggle('hidden', config.type !== 'soluong');

        document.getElementById('competition-min-price').value = config.minPrice ? config.minPrice / 1000000 : '';
        document.getElementById('competition-max-price').value = config.maxPrice ? config.maxPrice / 1000000 : '';

        const groupChoices = appState.choices['competition_group'];
        if (groupChoices) {
            groupChoices.removeActiveItems();
            groupChoices.setChoiceByValue(config.groups);
        }
    },

    _handleCompetitionDelete(index) {
        appState.competitionConfigs.splice(index, 1);
        this._saveCompetitionConfigs();
        this.updateAndRenderCurrentTab();
        ui.showNotification('Đã xóa chương trình thi đua.', 'success');
    },

    _handleCompetitionFormSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('competition-id').value;
        const name = document.getElementById('competition-name').value.trim();
        if (!name) {
            ui.showNotification('Tên chương trình không được để trống.', 'error');
            return;
        }

        const groupChoices = appState.choices['competition_group'];
        const groups = groupChoices ? groupChoices.getValue(true) : [];

        const brandChoices = appState.choices['competition_brand'];
        const brands = brandChoices ? brandChoices.getValue(true) : [];
        if (brands.length === 0) {
            ui.showNotification('Lỗi: Vui lòng chọn ít nhất một hãng sản xuất.', 'error');
            return;
        }
        
        const newConfig = {
            id: id ? appState.competitionConfigs[parseInt(id, 10)].id : `comp_${new Date().getTime()}`,
            name: name,
            brands: brands,
            groups: groups,
            type: document.getElementById('competition-type').value,
            minPrice: (parseFloat(document.getElementById('competition-min-price').value) || 0) * 1000000,
            maxPrice: (parseFloat(document.getElementById('competition-max-price').value) || 0) * 1000000,
            excludeApple: document.getElementById('competition-exclude-apple').checked,
        };

        if (id !== '') {
            appState.competitionConfigs[parseInt(id, 10)] = newConfig;
        } else {
            appState.competitionConfigs.push(newConfig);
        }

        this._saveCompetitionConfigs();
        this._handleCompetitionFormShow(false);
        this.updateAndRenderCurrentTab();
        ui.showNotification('Đã lưu chương trình thi đua thành công!', 'success');
    },

     _saveCompetitionConfigs() {
        localStorage.setItem('competitionConfigs', JSON.stringify(appState.competitionConfigs));
    },
    
    async handleTemplateDownload() {
        ui.showNotification('Đang chuẩn bị file mẫu...', 'success');
        try {
            const url = await firebase.getTemplateDownloadURL();
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Danh_Sach_Nhan_Vien_Mau.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Lỗi khi tải file mẫu:", error);
            ui.showNotification('Không thể tải file mẫu. Vui lòng thử lại.', 'error');
        }
    },

    handleAdminLogin() {
        if (document.getElementById('admin-password-input').value === config.ADMIN_PASSWORD) {
            appState.isAdmin = true;
            ui.renderFeedbackSection();
            ui.renderAdminHelpEditors();
            this.switchTab('declaration-section');
            ui.toggleModal('admin-modal', false);
            document.getElementById('admin-password-input').value = '';
            document.getElementById('admin-error-msg').classList.add('hidden');
        } else {
            document.getElementById('admin-error-msg').classList.remove('hidden');
        }
    },
    
    handleContrastChange(e) {
        const level = e.target.value;
        localStorage.setItem('contrastLevel', level);
        document.documentElement.dataset.contrast = level;
    },

    handleHighlightColorChange(prefix) {
        const activeType = appState.highlightSettings[prefix]?.type;
        if (activeType) {
             const choicesInstance = appState.choices[`${prefix}_highlight_${activeType}`];
             if(choicesInstance) {
                const values = choicesInstance.getValue(true);
                const color = document.getElementById(`${prefix}-highlight-color`).value;
                appState.highlightSettings[prefix] = { type: activeType, values, color };
                localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
                highlightService.applyHighlights(prefix);
             }
        }
    },

    handleClearHighlight(prefix) {
        appState.highlightSettings[prefix] = {};
        localStorage.setItem('highlightSettings', JSON.stringify(appState.highlightSettings));
        ['nhanhang', 'nhomhang', 'employee'].forEach(type => {
             appState.choices[`${prefix}_highlight_${type}`]?.removeActiveItemsByValue(appState.choices[`${prefix}_highlight_${type}`]?.getValue(true) || []);
        });
        highlightService.applyHighlights(prefix);
    },

    async saveDeclarations() {
        const declarationsToSave = {
            ycx: document.getElementById('declaration-ycx').value,
            ycxGop: document.getElementById('declaration-ycx-gop').value,
            heSo: document.getElementById('declaration-heso').value
        };
        // Ghi lên Firebase
        await firebase.saveDeclarationsToFirestore(declarationsToSave);
        // Cập nhật state cục bộ ngay lập tức
        appState.declarations.hinhThucXuat = declarationsToSave.ycx;
        appState.declarations.hinhThucXuatGop = declarationsToSave.ycxGop;
        appState.declarations.heSoQuyDoi = declarationsToSave.heSo;
        // Render lại tab hiện tại để áp dụng thay đổi
        this.updateAndRenderCurrentTab();
    },
    
    saveHelpContent() {
        const contents = {
            data: document.getElementById('edit-help-data').value,
            luyke: document.getElementById('edit-help-luyke').value,
            sknv: document.getElementById('edit-help-sknv').value,
            realtime: document.getElementById('edit-help-realtime').value
        };
        firebase.saveHelpContent(contents);
    },
    
    async handleSubmitFeedback() {
        const textarea = document.getElementById('feedback-textarea');
        const success = await firebase.submitFeedback(textarea.value.trim());
        if (success) textarea.value = '';
    },
    
    async handleFeedbackReplyActions(e, feedbackItem) {
        const docId = feedbackItem.dataset.id;
        const replyForm = feedbackItem.querySelector('.reply-form-container');
        if (e.target.classList.contains('reply-btn')) {
            replyForm.classList.remove('hidden');
        }
        if (e.target.classList.contains('cancel-reply-btn')) {
            replyForm.classList.add('hidden');
        }
        if (e.target.classList.contains('submit-reply-btn')) {
            const textarea = replyForm.querySelector('textarea');
            const success = await firebase.submitReply(docId, textarea.value.trim());
            if (success) {
                textarea.value = '';
                replyForm.classList.add('hidden');
            }
        }
    },

    _getFilteredReportData(sectionId) {
        const masterData = appState.masterReportData[sectionId] || [];
        if (masterData.length === 0) return [];

        const selectedWarehouse = document.getElementById(`${sectionId}-filter-warehouse`).value;
        const selectedDept = document.getElementById(`${sectionId}-filter-department`).value;
        const selectedNames = appState.choices[`${sectionId}_employee`] ? appState.choices[`${sectionId}_employee`].getValue(true) : [];
        
        let filteredReport = masterData;
        if (selectedWarehouse) filteredReport = filteredReport.filter(nv => nv.maKho == selectedWarehouse);
        if (selectedDept) filteredReport = filteredReport.filter(nv => nv.boPhan === selectedDept);
        if (selectedNames && selectedNames.length > 0) filteredReport = filteredReport.filter(nv => selectedNames.includes(String(nv.maNV)));

        return filteredReport;
    },

    async prepareAndShowComposer(sectionId) {
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
        
        contextTabsContainer.innerHTML = '';
        contextContentContainer.innerHTML = '';

        if (mainViewNav) {
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
                    document.getElementById(`context-pane-${subTabId}`).classList.remove('hidden');
                });
                contextTabsContainer.appendChild(newTabBtn);

                const newContentPane = document.createElement('div');
                newContentPane.id = `context-pane-${subTabId}`;
                newContentPane.className = `composer__context-pane ${!isActive ? 'hidden' : ''}`;
                
                const textarea = document.createElement('textarea');
                textarea.className = 'composer__textarea';
                textarea.rows = 15;
                textarea.placeholder = `Soạn thảo nhận xét cho tab ${btn.textContent.trim()}...`;
                
                if (!appState.composerTemplates[sectionId]) {
                    appState.composerTemplates[sectionId] = {};
                }
                textarea.value = appState.composerTemplates[sectionId][subTabId] || '';
                
                newContentPane.appendChild(textarea);
                contextContentContainer.appendChild(newContentPane);
            });
        }
        
        contextTabsContainer.classList.toggle('hidden', contextTabsContainer.children.length === 0);

        const filteredReportData = this._getFilteredReportData(sectionId);
        const supermarketReport = services.aggregateReport(filteredReportData);
        ui.populateComposerDetailTags(supermarketReport);

        ui.showComposerModal(sectionId);
    },

    handleComposerActions(e, modal) {
        const sectionId = modal.dataset.sectionId;
        const activeContextPane = modal.querySelector('.composer__context-pane:not(.hidden)');
        const activeTextarea = activeContextPane ? activeContextPane.querySelector('textarea') : null;
        
        if (e.target.matches('.composer__tab-btn:not([data-context-tab])')) {
             const nav = e.target.closest('.composer__nav');
            const content = nav.nextElementSibling;
            if (nav && content) {
                nav.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
                content.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
                e.target.classList.add('active');
                const targetId = e.target.dataset.tab;
                const targetContent = content.querySelector(`#${targetId}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            }
            return;
        }

        if (e.target.matches('.composer__icon-btn, .composer__tag-btn')) {
             if (!activeTextarea) {
                ui.showNotification("Vui lòng chọn một tab nội dung để chèn thẻ.", "error");
                return;
            }
            let tagToInsert = e.target.dataset.tag;
            if (e.target.dataset.tagTemplate) {
                const dept = document.getElementById('composer-dept-filter').value;
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
                if (!appState.composerTemplates[sectionId]) appState.composerTemplates[sectionId] = {};
                appState.composerTemplates[sectionId][subTabId] = activeTextarea.value;
                localStorage.setItem('composerTemplates', JSON.stringify(appState.composerTemplates));
                ui.showNotification(`Đã lưu mẫu cho tab con!`, 'success');
            } else {
                ui.showNotification(`Không tìm thấy tab con để lưu.`, 'error');
            }
        }
        
        if (e.target.id === 'copy-composed-notification-btn') {
            if (!activeTextarea) {
                 ui.showNotification("Lỗi: Không tìm thấy ô nội dung đang hoạt động.", "error"); 
                return;
            }

            const template = activeTextarea.value;
            
            const filteredReportData = this._getFilteredReportData(sectionId);
            const supermarketReport = services.aggregateReport(filteredReportData);
            
            const selectedWarehouse = document.getElementById(`${sectionId}-filter-warehouse`).value;
            const goals = sectionId === 'realtime' ? settingsService.getRealtimeGoalSettings(selectedWarehouse).goals : settingsService.getLuykeGoalSettings(selectedWarehouse).goals;
            
            const competitionDataForComposer = services.parseCompetitionDataFromLuyKe(document.getElementById('paste-luyke')?.value || '');
            
            const processedText = services.processComposerTemplate(template, supermarketReport, goals, filteredReportData, competitionDataForComposer, sectionId);

            ui.showPreviewAndCopy(processedText);
        }
    },
    
    async loadAndDisplayQrCode() {
        try {
            const qrUrl = await firebase.getQrCodeDownloadURL();
            const imgEl = document.getElementById('header-qr-image');
            if (imgEl) {
                imgEl.src = qrUrl;
            }
        } catch (error) {
            console.error("Không thể tải mã QR:", error);
            const container = document.querySelector('.header-qr-container');
            if (container) {
                container.style.display = 'none';
            }
        }
    }
};

app.init();