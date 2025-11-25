/* =====================================================
   كُميل برو - المنظم الجامعي الذكي
   ملف JavaScript الرئيسي
===================================================== */

class KomeilApp {
    constructor() {
        this.currentView = 'dashboard';
        this.sidebarOpen = false;
        this.theme = localStorage.getItem('theme') || 'light';
        this.db = null;
        this.notifications = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize database
            this.db = new KomeilDB();
            await this.db.init();
            
            // Initialize notifications
            this.notifications = new NotificationManager();
            
            // Apply theme
            this.applyTheme();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadDashboardData();
            
            // Hide splash screen
            this.hideSplashScreen();
            
            // Show welcome notification for new users
            this.showWelcomeMessage();
            
            console.log('كُميل برو initialized successfully');
            
        } catch (error) {
            console.error('خطأ في تهيئة التطبيق:', error);
            this.notifications.show('حدث خطأ في تهيئة التطبيق', 'error');
        }
    }

    setupEventListeners() {
        // Menu toggle
        document.getElementById('menu-btn')?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Theme toggle
        document.getElementById('theme-btn')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                this.navigateToView(view);
            });
        });

        // Overlay click
        document.getElementById('overlay')?.addEventListener('click', () => {
            this.closeSidebar();
        });

        // Quick actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Online/offline detection
        window.addEventListener('online', () => {
            this.notifications.show('اتصال الإنترنت متاح', 'success');
        });

        window.addEventListener('offline', () => {
            this.notifications.show('وضع العمل بدون إنترنت', 'info');
        });
    }

    hideSplashScreen() {
        setTimeout(() => {
            const splash = document.getElementById('splash');
            if (splash) {
                splash.classList.remove('active');
                setTimeout(() => {
                    splash.style.display = 'none';
                }, 500);
            }
        }, 2000);
    }

    showWelcomeMessage() {
        const hasVisited = localStorage.getItem('hasVisited');
        if (!hasVisited) {
            setTimeout(() => {
                this.notifications.show(
                    'مرحباً بك في كُميل برو! ابدأ بإضافة مادة دراسية أو مهمة.',
                    'info',
                    5000
                );
                localStorage.setItem('hasVisited', 'true');
            }, 3000);
        }
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const mainContent = document.querySelector('.main-content');

        if (this.sidebarOpen) {
            sidebar?.classList.add('open');
            overlay?.classList.add('active');
            if (window.innerWidth >= 768) {
                mainContent?.classList.add('sidebar-open');
            }
        } else {
            sidebar?.classList.remove('open');
            overlay?.classList.remove('active');
            mainContent?.classList.remove('sidebar-open');
        }
    }

    closeSidebar() {
        this.sidebarOpen = false;
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('overlay')?.classList.remove('active');
        document.querySelector('.main-content')?.classList.remove('sidebar-open');
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
        
        const themeIcon = document.querySelector('#theme-btn i');
        if (themeIcon) {
            themeIcon.className = this.theme === 'dark' ? 'icon-sun' : 'icon-moon';
        }
        
        this.notifications.show(
            `تم التبديل إلى الوضع ${this.theme === 'dark' ? 'الليلي' : 'النهاري'}`,
            'success'
        );
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Update theme icon
        const themeIcon = document.querySelector('#theme-btn i');
        if (themeIcon) {
            themeIcon.className = this.theme === 'dark' ? 'icon-sun' : 'icon-moon';
        }
    }

    navigateToView(viewName) {
        // Hide current view
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show new view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
            
            // Update navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.querySelector(`[data-view="${viewName}"]`);
            activeLink?.classList.add('active');
            
            // Load view data
            this.loadViewData(viewName);
            
            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                this.closeSidebar();
            }
        }
    }

    async loadViewData(viewName) {
        try {
            switch (viewName) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'subjects':
                    await this.loadSubjectsData();
                    break;
                case 'tasks':
                    await this.loadTasksData();
                    break;
                case 'schedule':
                    await this.loadScheduleData();
                    break;
                case 'files':
                    await this.loadFilesData();
                    break;
                case 'grades':
                    await this.loadGradesData();
                    break;
                case 'notes':
                    await this.loadNotesData();
                    break;
                case 'goals':
                    await this.loadGoalsData();
                    break;
            }
        } catch (error) {
            console.error(`خطأ في تحميل بيانات ${viewName}:`, error);
            this.notifications.show('حدث خطأ في تحميل البيانات', 'error');
        }
    }

    async loadDashboardData() {
        try {
            // Get stats
            const subjects = await this.db.getAllSubjects();
            const tasks = await this.db.getAllTasks();
            const files = await this.db.getAllFiles();
            
            // Update stats
            document.getElementById('total-subjects').textContent = subjects.length;
            document.getElementById('total-tasks').textContent = 
                tasks.filter(task => !task.completed).length;
            document.getElementById('total-files').textContent = files.length;
            
            // Calculate GPA
            const gpa = this.calculateGPA(subjects);
            document.getElementById('current-gpa').textContent = gpa.toFixed(2);
            
            // Load recent activity
            await this.loadRecentActivity();
            
            // Load today's schedule
            await this.loadTodaySchedule();
            
            // Load upcoming tasks
            await this.loadUpcomingTasks();
            
        } catch (error) {
            console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
        }
    }

    async loadSubjectsData() {
        try {
            const subjects = await this.db.getAllSubjects();
            const container = document.getElementById('subjects-list');
            const emptyState = document.getElementById('subjects-empty');
            
            if (subjects.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
            } else {
                container.style.display = 'grid';
                emptyState.style.display = 'none';
                
                container.innerHTML = subjects.map(subject => 
                    this.createSubjectCard(subject)
                ).join('');
                
                // Add event listeners
                container.querySelectorAll('.subject-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const subjectId = card.dataset.id;
                        this.showSubjectDetails(subjectId);
                    });
                });
            }
        } catch (error) {
            console.error('خطأ في تحميل المواد:', error);
        }
    }

    createSubjectCard(subject) {
        return `
            <div class="subject-card" data-id="${subject.id}">
                <div class="subject-header">
                    <h3 class="subject-title">${subject.name}</h3>
                    <p class="subject-code">${subject.code}</p>
                </div>
                <div class="subject-body">
                    <div class="subject-info">
                        <div class="subject-info-item">
                            <p class="subject-info-value">${subject.creditHours}</p>
                            <p class="subject-info-label">ساعات</p>
                        </div>
                        <div class="subject-info-item">
                            <p class="subject-info-value">${subject.grade || '-'}</p>
                            <p class="subject-info-label">الدرجة</p>
                        </div>
                        <div class="subject-info-item">
                            <p class="subject-info-value">${this.getTasksCount(subject.id)}</p>
                            <p class="subject-info-label">مهام</p>
                        </div>
                    </div>
                    <div class="subject-actions">
                        <button class="btn btn-sm btn-primary">عرض التفاصيل</button>
                    </div>
                </div>
            </div>
        `;
    }

    calculateGPA(subjects) {
        if (subjects.length === 0) return 0;
        
        let totalPoints = 0;
        let totalHours = 0;
        
        subjects.forEach(subject => {
            if (subject.grade && subject.gpa && subject.creditHours) {
                totalPoints += subject.gpa * subject.creditHours;
                totalHours += subject.creditHours;
            }
        });
        
        return totalHours > 0 ? totalPoints / totalHours : 0;
    }

    async getTasksCount(subjectId) {
        try {
            const tasks = await this.db.getTasksBySubject(subjectId);
            return tasks.filter(task => !task.completed).length;
        } catch (error) {
            return 0;
        }
    }

    async loadRecentActivity() {
        const container = document.getElementById('activity-list');
        // This would typically load from database
        // For now, showing welcome message
    }

    async loadTodaySchedule() {
        const container = document.getElementById('today-classes');
        try {
            const schedule = await this.db.getTodaySchedule();
            
            if (schedule.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="icon-calendar"></i>
                        <p>لا توجد محاضرات اليوم</p>
                    </div>
                `;
            } else {
                container.innerHTML = schedule.map(item => `
                    <div class="schedule-item">
                        <div class="schedule-icon">
                            <i class="icon-clock"></i>
                        </div>
                        <div class="schedule-content">
                            <p class="schedule-title">${item.subject}</p>
                            <span class="schedule-time">${item.time} - ${item.room}</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('خطأ في تحميل جدول اليوم:', error);
        }
    }

    async loadUpcomingTasks() {
        const container = document.getElementById('upcoming-tasks-list');
        try {
            const tasks = await this.db.getUpcomingTasks(5);
            
            if (tasks.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="icon-check-circle"></i>
                        <p>لا توجد مهام معلقة</p>
                    </div>
                `;
            } else {
                container.innerHTML = tasks.map(task => `
                    <div class="task-item">
                        <div class="task-icon">
                            <i class="icon-clock"></i>
                        </div>
                        <div class="task-content">
                            <p class="task-title">${task.title}</p>
                            <span class="task-due">${this.formatDate(task.dueDate)}</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('خطأ في تحميل المهام القادمة:', error);
        }
    }

    handleQuickAction(action) {
        switch (action) {
            case 'add-task':
                this.showAddTaskModal();
                break;
            case 'add-subject':
                this.showAddSubjectModal();
                break;
            case 'upload-file':
                this.showUploadFileModal();
                break;
            case 'add-note':
                this.showAddNoteModal();
                break;
        }
    }

    showAddTaskModal() {
        const modal = new Modal('إضافة مهمة جديدة', `
            <form id="add-task-form">
                <div class="form-group">
                    <label class="form-label">عنوان المهمة</label>
                    <input type="text" name="title" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">المادة</label>
                    <select name="subject" class="select" required>
                        <option value="">اختر المادة</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">تاريخ التسليم</label>
                    <input type="datetime-local" name="dueDate" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">الأولوية</label>
                    <select name="priority" class="select">
                        <option value="low">منخفضة</option>
                        <option value="medium" selected>متوسطة</option>
                        <option value="high">عالية</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">الوصف (اختياري)</label>
                    <textarea name="description" class="form-textarea" rows="3"></textarea>
                </div>
            </form>
        `, [
            { text: 'إلغاء', type: 'secondary' },
            { text: 'إضافة المهمة', type: 'primary', action: () => this.submitAddTask() }
        ]);
        
        modal.show();
        this.loadSubjectOptions('add-task-form');
    }

    showAddSubjectModal() {
        const modal = new Modal('إضافة مادة دراسية', `
            <form id="add-subject-form">
                <div class="form-group">
                    <label class="form-label">اسم المادة</label>
                    <input type="text" name="name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">رمز المادة</label>
                    <input type="text" name="code" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">عدد الساعات المعتمدة</label>
                    <input type="number" name="creditHours" class="form-input" min="1" max="6" required>
                </div>
                <div class="form-group">
                    <label class="form-label">اسم المدرس</label>
                    <input type="text" name="instructor" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">الفصل الدراسي</label>
                    <select name="semester" class="select" required>
                        <option value="current">الفصل الحالي</option>
                        <option value="fall2024">خريف 2024</option>
                        <option value="spring2025">ربيع 2025</option>
                    </select>
                </div>
            </form>
        `, [
            { text: 'إلغاء', type: 'secondary' },
            { text: 'إضافة المادة', type: 'primary', action: () => this.submitAddSubject() }
        ]);
        
        modal.show();
    }

    async submitAddTask() {
        try {
            const form = document.getElementById('add-task-form');
            const formData = new FormData(form);
            
            const task = {
                title: formData.get('title'),
                subjectId: formData.get('subject'),
                dueDate: new Date(formData.get('dueDate')),
                priority: formData.get('priority'),
                description: formData.get('description'),
                completed: false,
                createdAt: new Date()
            };
            
            await this.db.addTask(task);
            this.notifications.show('تم إضافة المهمة بنجاح', 'success');
            Modal.closeActive();
            
            // Refresh dashboard if currently viewing
            if (this.currentView === 'dashboard') {
                await this.loadDashboardData();
            }
            
        } catch (error) {
            console.error('خطأ في إضافة المهمة:', error);
            this.notifications.show('حدث خطأ في إضافة المهمة', 'error');
        }
    }

    async submitAddSubject() {
        try {
            const form = document.getElementById('add-subject-form');
            const formData = new FormData(form);
            
            const subject = {
                name: formData.get('name'),
                code: formData.get('code'),
                creditHours: parseInt(formData.get('creditHours')),
                instructor: formData.get('instructor'),
                semester: formData.get('semester'),
                createdAt: new Date()
            };
            
            await this.db.addSubject(subject);
            this.notifications.show('تم إضافة المادة بنجاح', 'success');
            Modal.closeActive();
            
            // Refresh current view
            await this.loadViewData(this.currentView);
            
        } catch (error) {
            console.error('خطأ في إضافة المادة:', error);
            this.notifications.show('حدث خطأ في إضافة المادة', 'error');
        }
    }

    async loadSubjectOptions(formId) {
        try {
            const subjects = await this.db.getAllSubjects();
            const select = document.querySelector(`#${formId} select[name="subject"]`);
            
            if (select) {
                subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.id;
                    option.textContent = `${subject.name} (${subject.code})`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('خطأ في تحميل خيارات المواد:', error);
        }
    }

    handleKeyboardShortcuts(e) {
        // Alt + M: Toggle sidebar
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            this.toggleSidebar();
        }
        
        // Alt + T: Toggle theme
        if (e.altKey && e.key === 't') {
            e.preventDefault();
            this.toggleTheme();
        }
        
        // Alt + N: Add new task
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            this.handleQuickAction('add-task');
        }
        
        // Escape: Close modals/sidebar
        if (e.key === 'Escape') {
            Modal.closeActive();
            this.closeSidebar();
        }
    }

    handleResize() {
        // Auto-close sidebar on mobile
        if (window.innerWidth < 768 && this.sidebarOpen) {
            this.closeSidebar();
        }
        
        // Auto-open sidebar on desktop
        if (window.innerWidth >= 768 && !this.sidebarOpen) {
            this.toggleSidebar();
        }
    }

    formatDate(date) {
        if (!date) return '';
        
        const now = new Date();
        const targetDate = new Date(date);
        const diffTime = targetDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'اليوم';
        } else if (diffDays === 1) {
            return 'غداً';
        } else if (diffDays === -1) {
            return 'أمس';
        } else if (diffDays > 0) {
            return `خلال ${diffDays} أيام`;
        } else {
            return `متأخر ${Math.abs(diffDays)} أيام`;
        }
    }

    // Placeholder methods for other views
    async loadTasksData() {
        // Implementation for tasks view
    }

    async loadScheduleData() {
        // Implementation for schedule view
    }

    async loadFilesData() {
        // Implementation for files view
    }

    async loadGradesData() {
        // Implementation for grades view
    }

    async loadNotesData() {
        // Implementation for notes view
    }

    async loadGoalsData() {
        // Implementation for goals view
    }

    showUploadFileModal() {
        this.notifications.show('ميزة رفع الملفات ستتوفر قريباً', 'info');
    }

    showAddNoteModal() {
        this.notifications.show('ميزة الملاحظات ستتوفر قريباً', 'info');
    }

    showSubjectDetails(subjectId) {
        this.notifications.show('ميزة عرض تفاصيل المادة ستتوفر قريباً', 'info');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.komeilApp = new KomeilApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KomeilApp;
}