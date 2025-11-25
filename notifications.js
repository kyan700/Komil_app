/* =====================================================
   كُميل برو - نظام الإشعارات
   إدارة الإشعارات والتنبيهات
===================================================== */

class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.counter = 0;
        this.maxNotifications = 5;
        this.defaultDuration = 4000;
        this.permissionGranted = false;
        
        this.init();
    }

    init() {
        this.createContainer();
        this.requestPermission();
        this.setupServiceWorkerMessages();
        console.log('نظام الإشعارات جاهز');
    }

    createContainer() {
        this.container = document.getElementById('notifications-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications-container';
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        }
    }

    async requestPermission() {
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                this.permissionGranted = permission === 'granted';
                
                if (this.permissionGranted) {
                    console.log('تم منح إذن الإشعارات');
                } else {
                    console.log('لم يتم منح إذن الإشعارات');
                }
            } catch (error) {
                console.error('خطأ في طلب إذن الإشعارات:', error);
            }
        }
    }

    setupServiceWorkerMessages() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'notification') {
                    this.show(event.data.message, event.data.notificationType || 'info');
                }
            });
        }
    }

    show(message, type = 'info', duration = null, options = {}) {
        const id = ++this.counter;
        const notification = this.createNotification(id, message, type, options);
        
        // Add to container
        this.container.appendChild(notification.element);
        this.notifications.set(id, notification);
        
        // Animate in
        setTimeout(() => {
            notification.element.classList.add('show');
        }, 100);
        
        // Auto remove
        const timeout = duration || this.defaultDuration;
        if (timeout > 0) {
            setTimeout(() => {
                this.hide(id);
            }, timeout);
        }
        
        // Limit max notifications
        this.limitNotifications();
        
        return id;
    }

    createNotification(id, message, type, options) {
        const element = document.createElement('div');
        element.className = `notification notification-${type}`;
        element.dataset.id = id;
        
        const config = this.getTypeConfig(type);
        
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon" style="background-color: ${config.color}">
                    ${config.icon}
                </div>
                <div class="notification-text">
                    ${options.title ? `<div class="notification-title">${options.title}</div>` : ''}
                    <div class="notification-message">${message}</div>
                </div>
                ${options.closable !== false ? `
                    <button class="notification-close" aria-label="إغلاق">
                        <i class="icon-x"></i>
                    </button>
                ` : ''}
            </div>
            ${options.actions ? this.createActionButtons(options.actions) : ''}
        `;
        
        // Add event listeners
        const closeBtn = element.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide(id);
            });
        }
        
        // Add action button listeners
        if (options.actions) {
            options.actions.forEach((action, index) => {
                const btn = element.querySelector(`.notification-action-${index}`);
                if (btn && action.callback) {
                    btn.addEventListener('click', () => {
                        action.callback();
                        if (action.dismiss !== false) {
                            this.hide(id);
                        }
                    });
                }
            });
        }
        
        return {
            id,
            element,
            type,
            message,
            createdAt: new Date()
        };
    }

    createActionButtons(actions) {
        if (!Array.isArray(actions) || actions.length === 0) {
            return '';
        }
        
        const buttonsHtml = actions.map((action, index) => `
            <button class="btn btn-sm ${action.type || 'btn-secondary'} notification-action-${index}">
                ${action.icon ? `<i class="${action.icon}"></i>` : ''}
                ${action.label}
            </button>
        `).join('');
        
        return `
            <div class="notification-actions">
                ${buttonsHtml}
            </div>
        `;
    }

    getTypeConfig(type) {
        const configs = {
            success: {
                icon: '✅',
                color: 'var(--success-color)'
            },
            error: {
                icon: '❌',
                color: 'var(--danger-color)'
            },
            warning: {
                icon: '⚠️',
                color: 'var(--warning-color)'
            },
            info: {
                icon: 'ℹ️',
                color: 'var(--info-color)'
            }
        };
        
        return configs[type] || configs.info;
    }

    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        notification.element.classList.add('hiding');
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    hideAll() {
        this.notifications.forEach((notification, id) => {
            this.hide(id);
        });
    }

    limitNotifications() {
        if (this.notifications.size > this.maxNotifications) {
            const oldest = Array.from(this.notifications.values())
                .sort((a, b) => a.createdAt - b.createdAt)[0];
            
            if (oldest) {
                this.hide(oldest.id);
            }
        }
    }

    // System notifications (browser notifications)
    showSystemNotification(title, message, options = {}) {
        if (!this.permissionGranted) {
            // Fallback to in-app notification
            this.show(`${title}: ${message}`, 'info');
            return;
        }
        
        const notification = new Notification(title, {
            body: message,
            icon: '/icon-192.png',
            badge: '/icon-72.png',
            tag: options.tag || 'komeil-pro',
            requireInteraction: options.persistent || false,
            ...options
        });
        
        notification.addEventListener('click', () => {
            window.focus();
            notification.close();
            
            if (options.onClick) {
                options.onClick();
            }
        });
        
        return notification;
    }

    // Specialized notification methods
    showTaskReminder(task) {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const timeDiff = dueDate - now;
        const hoursLeft = Math.ceil(timeDiff / (1000 * 60 * 60));
        
        let message = `مهمة "${task.title}" `;
        
        if (hoursLeft <= 0) {
            message += 'متأخرة!';
        } else if (hoursLeft <= 1) {
            message += 'مستحقة خلال ساعة';
        } else if (hoursLeft <= 24) {
            message += `مستحقة خلال ${hoursLeft} ساعة`;
        } else {
            const daysLeft = Math.ceil(hoursLeft / 24);
            message += `مستحقة خلال ${daysLeft} يوم`;
        }
        
        this.show(message, hoursLeft <= 0 ? 'error' : 'warning', 6000, {
            title: 'تذكير بالمهام',
            actions: [
                {
                    label: 'عرض المهمة',
                    type: 'btn-primary',
                    callback: () => {
                        // Navigate to task
                        if (window.komeilApp) {
                            window.komeilApp.navigateToView('tasks');
                        }
                    }
                }
            ]
        });
        
        // Also show system notification
        this.showSystemNotification('تذكير بالمهام', message, {
            tag: `task-${task.id}`,
            onClick: () => {
                if (window.komeilApp) {
                    window.komeilApp.navigateToView('tasks');
                }
            }
        });
    }

    showScheduleReminder(scheduleItem) {
        const message = `محاضرة ${scheduleItem.subject} تبدأ في ${scheduleItem.startTime}`;
        
        this.show(message, 'info', 5000, {
            title: 'تذكير بالمحاضرة',
            actions: [
                {
                    label: 'عرض الجدول',
                    type: 'btn-primary',
                    callback: () => {
                        if (window.komeilApp) {
                            window.komeilApp.navigateToView('schedule');
                        }
                    }
                }
            ]
        });
        
        this.showSystemNotification('تذكير بالمحاضرة', message, {
            tag: `schedule-${scheduleItem.id}`,
            onClick: () => {
                if (window.komeilApp) {
                    window.komeilApp.navigateToView('schedule');
                }
            }
        });
    }

    showExamReminder(exam) {
        const examDate = new Date(exam.date);
        const now = new Date();
        const timeDiff = examDate - now;
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        let message = `امتحان ${exam.subject} `;
        
        if (daysLeft <= 0) {
            message += 'اليوم!';
        } else if (daysLeft === 1) {
            message += 'غداً';
        } else if (daysLeft <= 7) {
            message += `خلال ${daysLeft} أيام`;
        } else {
            message += `خلال ${Math.ceil(daysLeft / 7)} أسابيع`;
        }
        
        this.show(message, daysLeft <= 1 ? 'error' : 'warning', 8000, {
            title: 'تذكير بالامتحان',
            actions: [
                {
                    label: 'عرض التفاصيل',
                    type: 'btn-primary',
                    callback: () => {
                        // Show exam details
                    }
                }
            ]
        });
    }

    showGoalProgress(goal) {
        const message = `تقدمت في هدف "${goal.title}" بنسبة ${goal.progress}%`;
        
        this.show(message, 'success', 4000, {
            title: 'تقدم في الأهداف'
        });
    }

    showStorageWarning(usage) {
        if (usage.percentage >= 90) {
            this.show(
                `مساحة التخزين ممتلئة بنسبة ${usage.percentage}%`,
                'warning',
                0, // Don't auto-hide
                {
                    title: 'تحذير مساحة التخزين',
                    actions: [
                        {
                            label: 'إدارة الملفات',
                            type: 'btn-primary',
                            callback: () => {
                                if (window.komeilApp) {
                                    window.komeilApp.navigateToView('files');
                                }
                            }
                        }
                    ],
                    closable: false
                }
            );
        }
    }

    showOfflineMode() {
        this.show(
            'أنت الآن تعمل في وضع عدم الاتصال. بعض الميزات قد تكون محدودة.',
            'info',
            0,
            {
                title: 'وضع عدم الاتصال',
                closable: true
            }
        );
    }

    showDataSyncComplete() {
        this.show(
            'تم مزامنة البيانات بنجاح',
            'success',
            3000
        );
    }

    showDataExported(filename) {
        this.show(
            `تم تصدير البيانات إلى ${filename}`,
            'success',
            4000,
            {
                title: 'تصدير البيانات'
            }
        );
    }

    showDataImported() {
        this.show(
            'تم استيراد البيانات بنجاح',
            'success',
            4000,
            {
                title: 'استيراد البيانات'
            }
        );
    }

    showUpdateAvailable() {
        this.show(
            'يتوفر تحديث جديد للتطبيق',
            'info',
            0,
            {
                title: 'تحديث متوفر',
                actions: [
                    {
                        label: 'تحديث الآن',
                        type: 'btn-primary',
                        callback: () => {
                            location.reload();
                        }
                    },
                    {
                        label: 'لاحقاً',
                        type: 'btn-secondary'
                    }
                ],
                closable: false
            }
        );
    }

    // Batch operations
    showBatchSuccess(operation, count) {
        const operations = {
            delete: 'حذف',
            update: 'تحديث',
            create: 'إنشاء',
            import: 'استيراد',
            export: 'تصدير'
        };
        
        const operationName = operations[operation] || operation;
        
        this.show(
            `تم ${operationName} ${count} عنصر بنجاح`,
            'success',
            3000
        );
    }

    showBatchError(operation, errors) {
        const message = `فشل في ${operation} ${errors.length} عنصر`;
        
        this.show(message, 'error', 6000, {
            title: 'خطأ في العملية المجمعة',
            actions: [
                {
                    label: 'عرض التفاصيل',
                    type: 'btn-secondary',
                    callback: () => {
                        console.error('أخطاء العملية المجمعة:', errors);
                        // Could show a detailed error modal
                    }
                }
            ]
        });
    }

    // Utility methods
    getNotificationById(id) {
        return this.notifications.get(id);
    }

    getNotificationsByType(type) {
        return Array.from(this.notifications.values())
            .filter(notification => notification.type === type);
    }

    clearNotificationsByType(type) {
        this.getNotificationsByType(type)
            .forEach(notification => this.hide(notification.id));
    }

    updateNotificationCount() {
        const count = this.notifications.size;
        const badge = document.getElementById('notification-count');
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    // Settings
    setDefaultDuration(duration) {
        this.defaultDuration = duration;
    }

    setMaxNotifications(max) {
        this.maxNotifications = max;
        this.limitNotifications();
    }

    // Cleanup
    destroy() {
        this.hideAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Add notification styles if not already present
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification {
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            margin-bottom: var(--spacing-sm);
        }
        
        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification.hiding {
            transform: translateX(100%);
            opacity: 0;
        }
        
        .notification-actions {
            display: flex;
            gap: var(--spacing-sm);
            margin-top: var(--spacing-sm);
            padding-top: var(--spacing-sm);
            border-top: 1px solid var(--border-light);
        }
        
        .notification-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: var(--spacing-xs);
            border-radius: var(--radius-sm);
            transition: all 0.2s ease;
            margin-left: var(--spacing-sm);
        }
        
        .notification-close:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }
    `;
    document.head.appendChild(style);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}