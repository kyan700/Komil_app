/* =====================================================
   كُميل برو - الميزات المتقدمة
   ميزات إضافية وأدوات مساعدة
===================================================== */

class AdvancedFeatures {
    constructor(app) {
        this.app = app;
        this.shortcuts = new Map();
        this.themes = new Map();
        this.plugins = new Map();
        this.analytics = null;
        
        this.init();
    }

    init() {
        this.setupKeyboardShortcuts();
        this.setupThemes();
        this.setupDataExportImport();
        this.setupAnalytics();
        this.setupPluginSystem();
        this.setupAdvancedSearch();
        console.log('Advanced Features initialized');
    }

    // Keyboard Shortcuts System
    setupKeyboardShortcuts() {
        const shortcuts = [
            { key: 'ctrl+n', action: 'new-task', description: 'إضافة مهمة جديدة' },
            { key: 'ctrl+shift+n', action: 'new-subject', description: 'إضافة مادة جديدة' },
            { key: 'ctrl+s', action: 'save', description: 'حفظ' },
            { key: 'ctrl+f', action: 'search', description: 'بحث' },
            { key: 'ctrl+/', action: 'help', description: 'المساعدة' },
            { key: 'ctrl+shift+d', action: 'dashboard', description: 'الرئيسية' },
            { key: 'ctrl+shift+t', action: 'tasks', description: 'المهام' },
            { key: 'ctrl+shift+s', action: 'subjects', description: 'المواد' },
            { key: 'ctrl+shift+c', action: 'schedule', description: 'الجدول' },
            { key: 'ctrl+shift+f', action: 'files', description: 'الملفات' },
            { key: 'ctrl+shift+g', action: 'grades', description: 'الدرجات' }
        ];

        shortcuts.forEach(shortcut => {
            this.shortcuts.set(shortcut.key, shortcut);
        });

        document.addEventListener('keydown', (e) => {
            const key = this.getShortcutKey(e);
            const shortcut = this.shortcuts.get(key);
            
            if (shortcut) {
                e.preventDefault();
                this.executeShortcut(shortcut.action);
            }
        });
    }

    getShortcutKey(event) {
        const parts = [];
        
        if (event.ctrlKey) parts.push('ctrl');
        if (event.shiftKey) parts.push('shift');
        if (event.altKey) parts.push('alt');
        if (event.metaKey) parts.push('meta');
        
        parts.push(event.key.toLowerCase());
        
        return parts.join('+');
    }

    executeShortcut(action) {
        switch (action) {
            case 'new-task':
                this.app.handleQuickAction('add-task');
                break;
            case 'new-subject':
                this.app.handleQuickAction('add-subject');
                break;
            case 'search':
                this.showAdvancedSearch();
                break;
            case 'help':
                this.showKeyboardShortcuts();
                break;
            case 'dashboard':
            case 'tasks':
            case 'subjects':
            case 'schedule':
            case 'files':
            case 'grades':
                this.app.navigateToView(action);
                break;
            default:
                console.log('Shortcut action not implemented:', action);
        }
    }

    showKeyboardShortcuts() {
        const shortcutsHtml = Array.from(this.shortcuts.values())
            .map(shortcut => `
                <div class="shortcut-item">
                    <kbd class="shortcut-key">${shortcut.key}</kbd>
                    <span class="shortcut-desc">${shortcut.description}</span>
                </div>
            `).join('');

        const modal = new Modal('اختصارات لوحة المفاتيح', `
            <div class="shortcuts-list">
                ${shortcutsHtml}
            </div>
            <style>
                .shortcuts-list { max-height: 400px; overflow-y: auto; }
                .shortcut-item { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding: var(--spacing-sm) 0;
                    border-bottom: 1px solid var(--border-light);
                }
                .shortcut-key { 
                    background: var(--bg-tertiary);
                    padding: 2px 8px;
                    border-radius: var(--radius-sm);
                    font-family: monospace;
                    font-size: var(--font-sm);
                }
            </style>
        `, [
            { text: 'إغلاق', type: 'primary' }
        ]);
        
        modal.show();
    }

    // Advanced Theme System
    setupThemes() {
        const themes = [
            {
                name: 'light',
                displayName: 'الوضع النهاري',
                colors: {
                    primary: '#4f46e5',
                    secondary: '#10b981',
                    background: '#ffffff',
                    surface: '#f8fafc'
                }
            },
            {
                name: 'dark',
                displayName: 'الوضع الليلي',
                colors: {
                    primary: '#6366f1',
                    secondary: '#10b981',
                    background: '#0f172a',
                    surface: '#1e293b'
                }
            },
            {
                name: 'blue',
                displayName: 'الأزرق',
                colors: {
                    primary: '#3b82f6',
                    secondary: '#06b6d4',
                    background: '#f8fafc',
                    surface: '#ffffff'
                }
            },
            {
                name: 'green',
                displayName: 'الأخضر',
                colors: {
                    primary: '#10b981',
                    secondary: '#059669',
                    background: '#f0fdf4',
                    surface: '#ffffff'
                }
            }
        ];

        themes.forEach(theme => {
            this.themes.set(theme.name, theme);
        });
    }

    applyCustomTheme(themeName, customColors = {}) {
        const theme = this.themes.get(themeName);
        if (!theme) return;

        const colors = { ...theme.colors, ...customColors };
        const root = document.documentElement;

        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--${key}-color`, value);
        });

        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('theme', themeName);
        localStorage.setItem('customColors', JSON.stringify(customColors));
    }

    showThemeSelector() {
        const themesHtml = Array.from(this.themes.values())
            .map(theme => `
                <div class="theme-option" data-theme="${theme.name}">
                    <div class="theme-preview" style="
                        background: ${theme.colors.background};
                        border: 2px solid ${theme.colors.primary};
                    ">
                        <div style="background: ${theme.colors.primary}; height: 20px;"></div>
                        <div style="background: ${theme.colors.surface}; height: 40px; padding: 8px;">
                            <div style="background: ${theme.colors.secondary}; height: 8px; width: 60%;"></div>
                        </div>
                    </div>
                    <span class="theme-name">${theme.displayName}</span>
                </div>
            `).join('');

        const modal = new Modal('اختيار السمة', `
            <div class="themes-grid">
                ${themesHtml}
            </div>
            <style>
                .themes-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: var(--spacing-md);
                }
                .theme-option {
                    text-align: center;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                .theme-option:hover {
                    transform: scale(1.05);
                }
                .theme-preview {
                    width: 100%;
                    height: 80px;
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    margin-bottom: var(--spacing-sm);
                }
                .theme-name {
                    font-size: var(--font-sm);
                    color: var(--text-secondary);
                }
            </style>
        `, [
            { text: 'إلغاء', type: 'secondary' },
            { text: 'تطبيق', type: 'primary', action: () => this.applySelectedTheme() }
        ]);

        modal.show();

        // Add click handlers
        modal.element.addEventListener('click', (e) => {
            const option = e.target.closest('.theme-option');
            if (option) {
                modal.element.querySelectorAll('.theme-option').forEach(opt => 
                    opt.classList.remove('selected')
                );
                option.classList.add('selected');
            }
        });
    }

    applySelectedTheme() {
        const selected = document.querySelector('.theme-option.selected');
        if (selected) {
            const themeName = selected.dataset.theme;
            this.applyCustomTheme(themeName);
            this.app.notifications.show(`تم تطبيق سمة ${this.themes.get(themeName).displayName}`, 'success');
        }
    }

    // Data Export/Import System
    setupDataExportImport() {
        this.exportFormats = {
            json: { name: 'JSON', extension: 'json', mime: 'application/json' },
            csv: { name: 'CSV', extension: 'csv', mime: 'text/csv' },
            xlsx: { name: 'Excel', extension: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        };
    }

    async exportData(format = 'json', options = {}) {
        try {
            const data = await this.app.db.exportData();
            let exportContent;
            let filename;

            switch (format) {
                case 'json':
                    exportContent = JSON.stringify(data, null, 2);
                    filename = `komeil-pro-backup-${this.getDateString()}.json`;
                    break;
                    
                case 'csv':
                    exportContent = this.convertToCSV(data);
                    filename = `komeil-pro-backup-${this.getDateString()}.csv`;
                    break;
                    
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            await this.downloadFile(exportContent, filename, this.exportFormats[format].mime);
            
            this.app.notifications.show('تم تصدير البيانات بنجاح', 'success');
            
            // Log export activity
            this.logActivity('data_export', { format, filename });
            
        } catch (error) {
            console.error('Export failed:', error);
            this.app.notifications.show('فشل في تصدير البيانات', 'error');
        }
    }

    async importData(file) {
        try {
            const content = await this.readFile(file);
            let data;

            if (file.type.includes('json')) {
                data = JSON.parse(content);
            } else {
                throw new Error('Unsupported file format');
            }

            await this.app.db.importData(data);
            await this.app.loadViewData(this.app.currentView);
            
            this.app.notifications.show('تم استيراد البيانات بنجاح', 'success');
            
            // Log import activity
            this.logActivity('data_import', { filename: file.name, size: file.size });
            
        } catch (error) {
            console.error('Import failed:', error);
            this.app.notifications.show('فشل في استيراد البيانات', 'error');
        }
    }

    convertToCSV(data) {
        const csvData = [];
        
        // Add subjects
        if (data.data.subjects && data.data.subjects.length > 0) {
            csvData.push('المواد الدراسية');
            csvData.push('الاسم,الرمز,الساعات,المدرس,الفصل');
            
            data.data.subjects.forEach(subject => {
                csvData.push([
                    subject.name || '',
                    subject.code || '',
                    subject.creditHours || '',
                    subject.instructor || '',
                    subject.semester || ''
                ].join(','));
            });
            
            csvData.push('');
        }
        
        // Add tasks
        if (data.data.tasks && data.data.tasks.length > 0) {
            csvData.push('المهام');
            csvData.push('العنوان,المادة,تاريخ التسليم,الأولوية,مكتملة');
            
            data.data.tasks.forEach(task => {
                csvData.push([
                    task.title || '',
                    task.subjectId || '',
                    task.dueDate || '',
                    task.priority || '',
                    task.completed ? 'نعم' : 'لا'
                ].join(','));
            });
        }
        
        return csvData.join('\n');
    }

    async downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    showDataManager() {
        const modal = new Modal('إدارة البيانات', `
            <div class="data-manager">
                <div class="section">
                    <h4>تصدير البيانات</h4>
                    <p>احفظ نسخة احتياطية من جميع بياناتك</p>
                    <div class="export-options">
                        <select id="export-format" class="select">
                            <option value="json">JSON (مفصل)</option>
                            <option value="csv">CSV (جداول)</option>
                        </select>
                        <button class="btn btn-primary" id="export-btn">
                            <i class="icon-download"></i> تصدير
                        </button>
                    </div>
                </div>
                
                <div class="section">
                    <h4>استيراد البيانات</h4>
                    <p class="warning">⚠️ سيتم استبدال البيانات الحالية</p>
                    <div class="import-options">
                        <input type="file" id="import-file" accept=".json" class="file-input">
                        <button class="btn btn-secondary" id="import-btn" disabled>
                            <i class="icon-upload"></i> استيراد
                        </button>
                    </div>
                </div>
                
                <div class="section">
                    <h4>مسح البيانات</h4>
                    <p class="danger">⛔ هذا الإجراء لا يمكن التراجع عنه</p>
                    <button class="btn btn-danger" id="clear-data-btn">
                        <i class="icon-trash"></i> مسح جميع البيانات
                    </button>
                </div>
            </div>
            
            <style>
                .data-manager .section {
                    margin-bottom: var(--spacing-xl);
                    padding: var(--spacing-lg);
                    border: 1px solid var(--border-light);
                    border-radius: var(--radius-lg);
                }
                .export-options, .import-options {
                    display: flex;
                    gap: var(--spacing-md);
                    align-items: center;
                }
                .warning { color: var(--warning-color); }
                .danger { color: var(--danger-color); }
                .file-input { flex: 1; }
            </style>
        `, [
            { text: 'إغلاق', type: 'secondary' }
        ]);

        modal.show();
        this.attachDataManagerEvents(modal);
    }

    attachDataManagerEvents(modal) {
        const exportBtn = modal.element.querySelector('#export-btn');
        const importBtn = modal.element.querySelector('#import-btn');
        const importFile = modal.element.querySelector('#import-file');
        const clearBtn = modal.element.querySelector('#clear-data-btn');
        const exportFormat = modal.element.querySelector('#export-format');

        exportBtn.addEventListener('click', () => {
            this.exportData(exportFormat.value);
        });

        importFile.addEventListener('change', (e) => {
            importBtn.disabled = !e.target.files.length;
        });

        importBtn.addEventListener('click', () => {
            if (importFile.files[0]) {
                this.importData(importFile.files[0]);
                modal.hide();
            }
        });

        clearBtn.addEventListener('click', () => {
            this.showClearDataConfirmation();
        });
    }

    showClearDataConfirmation() {
        const modal = new Modal('تأكيد مسح البيانات', `
            <div class="confirmation-message">
                <div class="warning-icon">⚠️</div>
                <h4>هل أنت متأكد؟</h4>
                <p>سيتم حذف جميع البيانات نهائياً بما في ذلك:</p>
                <ul>
                    <li>المواد الدراسية</li>
                    <li>المهام والواجبات</li>
                    <li>الجداول الدراسية</li>
                    <li>الملفات والملاحظات</li>
                    <li>الدرجات والأهداف</li>
                </ul>
                <p class="danger-text">⛔ لا يمكن التراجع عن هذا الإجراء</p>
            </div>
            
            <style>
                .confirmation-message {
                    text-align: center;
                }
                .warning-icon {
                    font-size: 48px;
                    margin-bottom: var(--spacing-md);
                }
                .danger-text {
                    color: var(--danger-color);
                    font-weight: 600;
                    margin-top: var(--spacing-md);
                }
                ul {
                    text-align: right;
                    margin: var(--spacing-md) 0;
                }
            </style>
        `, [
            { text: 'إلغاء', type: 'secondary' },
            { text: 'مسح البيانات', type: 'danger', action: () => this.clearAllData() }
        ]);

        modal.show();
    }

    async clearAllData() {
        try {
            await this.app.db.clearAllData();
            await this.app.loadViewData(this.app.currentView);
            
            this.app.notifications.show('تم مسح جميع البيانات', 'success');
            
            // Log clear activity
            this.logActivity('data_clear');
            
        } catch (error) {
            console.error('Clear data failed:', error);
            this.app.notifications.show('فشل في مسح البيانات', 'error');
        }
    }

    // Advanced Search System
    setupAdvancedSearch() {
        this.searchIndex = new Map();
        this.buildSearchIndex();
    }

    async buildSearchIndex() {
        try {
            const [subjects, tasks, notes] = await Promise.all([
                this.app.db.getAllSubjects(),
                this.app.db.getAllTasks(),
                this.app.db.getAllNotes()
            ]);

            this.searchIndex.clear();

            // Index subjects
            subjects.forEach(subject => {
                this.addToSearchIndex('subject', subject.id, [
                    subject.name,
                    subject.code,
                    subject.instructor
                ].filter(Boolean));
            });

            // Index tasks
            tasks.forEach(task => {
                this.addToSearchIndex('task', task.id, [
                    task.title,
                    task.description
                ].filter(Boolean));
            });

            // Index notes
            notes.forEach(note => {
                this.addToSearchIndex('note', note.id, [
                    note.title,
                    note.content
                ].filter(Boolean));
            });

            console.log('Search index built successfully');
            
        } catch (error) {
            console.error('Failed to build search index:', error);
        }
    }

    addToSearchIndex(type, id, texts) {
        const key = `${type}-${id}`;
        const searchText = texts.join(' ').toLowerCase();
        this.searchIndex.set(key, { type, id, searchText });
    }

    search(query) {
        if (!query || query.length < 2) return [];

        const normalizedQuery = query.toLowerCase();
        const results = [];

        for (const [key, item] of this.searchIndex) {
            if (item.searchText.includes(normalizedQuery)) {
                results.push({
                    type: item.type,
                    id: item.id,
                    relevance: this.calculateRelevance(item.searchText, normalizedQuery)
                });
            }
        }

        return results.sort((a, b) => b.relevance - a.relevance);
    }

    calculateRelevance(text, query) {
        const words = query.split(' ').filter(word => word.length > 1);
        let score = 0;

        words.forEach(word => {
            const index = text.indexOf(word);
            if (index !== -1) {
                score += 1;
                // Boost score for matches at the beginning
                if (index === 0) score += 0.5;
            }
        });

        return score;
    }

    showAdvancedSearch() {
        const modal = new Modal('البحث المتقدم', `
            <div class="advanced-search">
                <div class="search-input-container">
                    <input type="text" id="search-query" class="form-input" 
                           placeholder="ابحث في المواد، المهام، والملاحظات...">
                    <button class="btn btn-primary" id="search-btn">
                        <i class="icon-search"></i> بحث
                    </button>
                </div>
                
                <div class="search-filters">
                    <label class="checkbox-label">
                        <input type="checkbox" id="search-subjects" checked> المواد الدراسية
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="search-tasks" checked> المهام
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="search-notes" checked> الملاحظات
                    </label>
                </div>
                
                <div id="search-results" class="search-results">
                    <div class="search-placeholder">
                        <i class="icon-search"></i>
                        <p>ابدأ البحث للحصول على النتائج</p>
                    </div>
                </div>
            </div>
            
            <style>
                .search-input-container {
                    display: flex;
                    gap: var(--spacing-sm);
                    margin-bottom: var(--spacing-md);
                }
                .search-input-container input {
                    flex: 1;
                }
                .search-filters {
                    display: flex;
                    gap: var(--spacing-lg);
                    margin-bottom: var(--spacing-lg);
                }
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    cursor: pointer;
                }
                .search-results {
                    max-height: 400px;
                    overflow-y: auto;
                    border: 1px solid var(--border-light);
                    border-radius: var(--radius-md);
                    padding: var(--spacing-md);
                }
                .search-placeholder {
                    text-align: center;
                    color: var(--text-secondary);
                    padding: var(--spacing-xl);
                }
                .search-result {
                    padding: var(--spacing-md);
                    border-bottom: 1px solid var(--border-light);
                    cursor: pointer;
                    transition: background 0.2s ease;
                }
                .search-result:hover {
                    background: var(--bg-secondary);
                }
                .result-type {
                    font-size: var(--font-xs);
                    color: var(--primary-color);
                    text-transform: uppercase;
                }
                .result-title {
                    font-weight: 600;
                    margin: var(--spacing-xs) 0;
                }
            </style>
        `, [
            { text: 'إغلاق', type: 'secondary' }
        ]);

        modal.show();
        this.attachSearchEvents(modal);
    }

    attachSearchEvents(modal) {
        const searchInput = modal.element.querySelector('#search-query');
        const searchBtn = modal.element.querySelector('#search-btn');
        const resultsContainer = modal.element.querySelector('#search-results');

        const performSearch = () => {
            const query = searchInput.value.trim();
            if (!query) return;

            const results = this.search(query);
            this.displaySearchResults(results, resultsContainer);
        };

        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Auto-search as user types (debounced)
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 300);
        });
    }

    async displaySearchResults(results, container) {
        if (results.length === 0) {
            container.innerHTML = `
                <div class="search-placeholder">
                    <i class="icon-search"></i>
                    <p>لا توجد نتائج مطابقة</p>
                </div>
            `;
            return;
        }

        const resultsHtml = await Promise.all(
            results.map(async result => {
                const item = await this.getSearchResultItem(result);
                return `
                    <div class="search-result" data-type="${result.type}" data-id="${result.id}">
                        <div class="result-type">${this.getTypeLabel(result.type)}</div>
                        <div class="result-title">${item.title}</div>
                        <div class="result-description">${item.description}</div>
                    </div>
                `;
            })
        );

        container.innerHTML = resultsHtml.join('');

        // Add click handlers
        container.addEventListener('click', (e) => {
            const result = e.target.closest('.search-result');
            if (result) {
                this.openSearchResult(result.dataset.type, result.dataset.id);
            }
        });
    }

    async getSearchResultItem(result) {
        try {
            let item;
            
            switch (result.type) {
                case 'subject':
                    item = await this.app.db.getSubject(result.id);
                    return {
                        title: item.name,
                        description: `${item.code} - ${item.instructor || 'غير محدد'}`
                    };
                    
                case 'task':
                    item = await this.app.db.getTask(result.id);
                    return {
                        title: item.title,
                        description: item.description || 'لا يوجد وصف'
                    };
                    
                case 'note':
                    item = await this.app.db.get('notes', result.id);
                    return {
                        title: item.title,
                        description: item.content?.substring(0, 100) + '...' || 'لا يوجد محتوى'
                    };
                    
                default:
                    return { title: 'غير معروف', description: '' };
            }
        } catch (error) {
            return { title: 'خطأ في تحميل البيانات', description: '' };
        }
    }

    getTypeLabel(type) {
        const labels = {
            subject: 'مادة دراسية',
            task: 'مهمة',
            note: 'ملاحظة'
        };
        return labels[type] || type;
    }

    openSearchResult(type, id) {
        // Navigate to appropriate view and highlight item
        switch (type) {
            case 'subject':
                this.app.navigateToView('subjects');
                break;
            case 'task':
                this.app.navigateToView('tasks');
                break;
            case 'note':
                this.app.navigateToView('notes');
                break;
        }
        
        // Close search modal
        Modal.closeActive();
        
        // Highlight item (implementation depends on view)
        setTimeout(() => {
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                element.classList.add('highlight');
                setTimeout(() => element.classList.remove('highlight'), 2000);
            }
        }, 500);
    }

    // Plugin System (Basic)
    setupPluginSystem() {
        this.pluginHooks = {
            beforeTaskCreate: [],
            afterTaskCreate: [],
            beforeSubjectCreate: [],
            afterSubjectCreate: []
        };
    }

    registerPlugin(name, plugin) {
        this.plugins.set(name, plugin);
        
        // Register hooks
        if (plugin.hooks) {
            Object.entries(plugin.hooks).forEach(([hook, callback]) => {
                if (this.pluginHooks[hook]) {
                    this.pluginHooks[hook].push(callback);
                }
            });
        }
        
        console.log(`Plugin registered: ${name}`);
    }

    executeHook(hookName, data) {
        const hooks = this.pluginHooks[hookName] || [];
        let result = data;
        
        hooks.forEach(hook => {
            try {
                result = hook(result) || result;
            } catch (error) {
                console.error(`Plugin hook error (${hookName}):`, error);
            }
        });
        
        return result;
    }

    // Analytics & Activity Logging
    setupAnalytics() {
        this.analytics = {
            sessions: parseInt(localStorage.getItem('komeil-sessions') || '0'),
            tasksCreated: parseInt(localStorage.getItem('komeil-tasks-created') || '0'),
            subjectsCreated: parseInt(localStorage.getItem('komeil-subjects-created') || '0'),
            lastActivity: localStorage.getItem('komeil-last-activity'),
            totalUsage: parseInt(localStorage.getItem('komeil-usage-time') || '0')
        };
        
        // Track session start
        this.analytics.sessions++;
        localStorage.setItem('komeil-sessions', this.analytics.sessions.toString());
        
        // Track usage time
        this.startTime = Date.now();
        
        // Save usage time periodically and on beforeunload
        setInterval(() => this.updateUsageTime(), 60000); // Every minute
        window.addEventListener('beforeunload', () => this.updateUsageTime());
    }

    logActivity(action, data = {}) {
        const activity = {
            action,
            data,
            timestamp: new Date().toISOString(),
            session: this.analytics.sessions
        };
        
        // Update counters
        if (action === 'task_create') {
            this.analytics.tasksCreated++;
            localStorage.setItem('komeil-tasks-created', this.analytics.tasksCreated.toString());
        } else if (action === 'subject_create') {
            this.analytics.subjectsCreated++;
            localStorage.setItem('komeil-subjects-created', this.analytics.subjectsCreated.toString());
        }
        
        // Store last activity
        localStorage.setItem('komeil-last-activity', activity.timestamp);
        
        console.log('Activity logged:', activity);
    }

    updateUsageTime() {
        const currentTime = Date.now();
        const sessionTime = Math.floor((currentTime - this.startTime) / 1000);
        this.analytics.totalUsage += sessionTime;
        
        localStorage.setItem('komeil-usage-time', this.analytics.totalUsage.toString());
        this.startTime = currentTime;
    }

    getUsageStats() {
        return {
            ...this.analytics,
            averageSessionTime: this.analytics.sessions > 0 ? 
                Math.floor(this.analytics.totalUsage / this.analytics.sessions) : 0,
            totalUsageFormatted: this.formatTime(this.analytics.totalUsage)
        };
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours} ساعة و ${minutes} دقيقة`;
        } else {
            return `${minutes} دقيقة`;
        }
    }

    getDateString() {
        return new Date().toISOString().split('T')[0];
    }

    // Utility Functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedFeatures;
}