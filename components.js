/* =====================================================
   كُميل برو - مكونات الواجهة
   مكونات قابلة لإعادة الاستخدام
===================================================== */

// Modal Component
class Modal {
    constructor(title, content, actions = [], options = {}) {
        this.id = `modal-${Date.now()}`;
        this.title = title;
        this.content = content;
        this.actions = actions;
        this.options = {
            closable: true,
            keyboard: true,
            backdrop: true,
            size: 'medium', // small, medium, large, fullscreen
            ...options
        };
        
        this.element = null;
        this.isVisible = false;
        
        // Store reference to active modal
        Modal.activeModal = this;
    }

    static activeModal = null;

    static closeActive() {
        if (Modal.activeModal) {
            Modal.activeModal.hide();
        }
    }

    show() {
        this.create();
        this.attachEvents();
        
        // Add to DOM
        const container = document.getElementById('modals-container') || document.body;
        container.appendChild(this.element);
        
        // Show with animation
        requestAnimationFrame(() => {
            this.element.classList.add('active');
            this.isVisible = true;
        });
        
        // Focus management
        this.focusFirst();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        return this;
    }

    hide() {
        if (!this.isVisible) return;
        
        this.element.classList.remove('active');
        this.isVisible = false;
        
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Clear active modal reference
            if (Modal.activeModal === this) {
                Modal.activeModal = null;
            }
        }, 300);
        
        return this;
    }

    create() {
        this.element = document.createElement('div');
        this.element.className = `modal modal-${this.options.size}`;
        this.element.id = this.id;
        
        this.element.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${this.title}</h3>
                    ${this.options.closable ? '<button class="modal-close" aria-label="إغلاق">×</button>' : ''}
                </div>
                <div class="modal-body">
                    ${this.content}
                </div>
                ${this.actions.length > 0 ? this.createFooter() : ''}
            </div>
        `;
    }

    createFooter() {
        const actionsHtml = this.actions.map((action, index) => `
            <button class="btn ${action.type ? `btn-${action.type}` : 'btn-secondary'} modal-action-${index}"
                    ${action.disabled ? 'disabled' : ''}>
                ${action.icon ? `<i class="${action.icon}"></i>` : ''}
                ${action.text}
            </button>
        `).join('');

        return `
            <div class="modal-footer">
                ${actionsHtml}
            </div>
        `;
    }

    attachEvents() {
        // Close button
        if (this.options.closable) {
            const closeBtn = this.element.querySelector('.modal-close');
            closeBtn?.addEventListener('click', () => this.hide());
        }

        // Backdrop click
        if (this.options.backdrop) {
            this.element.addEventListener('click', (e) => {
                if (e.target === this.element) {
                    this.hide();
                }
            });
        }

        // Action buttons
        this.actions.forEach((action, index) => {
            const btn = this.element.querySelector(`.modal-action-${index}`);
            if (btn && action.action) {
                btn.addEventListener('click', () => {
                    const result = action.action();
                    
                    // Close modal if action returns true or no return value
                    if (result !== false && action.dismiss !== false) {
                        this.hide();
                    }
                });
            }
        });

        // Keyboard events
        if (this.options.keyboard) {
            document.addEventListener('keydown', this.handleKeydown.bind(this));
        }
    }

    handleKeydown(e) {
        if (!this.isVisible) return;
        
        if (e.key === 'Escape' && this.options.closable) {
            this.hide();
        }
        
        // Tab trapping
        if (e.key === 'Tab') {
            this.trapFocus(e);
        }
    }

    focusFirst() {
        const focusable = this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusable.length > 0) {
            focusable[0].focus();
        }
    }

    trapFocus(e) {
        const focusable = this.element.querySelectorAll(
            'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        );
        
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === first) {
                last.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        }
    }

    // Utility methods
    updateContent(content) {
        const body = this.element.querySelector('.modal-body');
        if (body) {
            body.innerHTML = content;
        }
    }

    updateTitle(title) {
        const titleElement = this.element.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    setLoading(loading = true) {
        const footer = this.element.querySelector('.modal-footer');
        if (footer) {
            const buttons = footer.querySelectorAll('button');
            buttons.forEach(btn => {
                btn.disabled = loading;
                if (loading) {
                    btn.classList.add('loading');
                } else {
                    btn.classList.remove('loading');
                }
            });
        }
    }
}

// Tooltip Component
class Tooltip {
    constructor(element, content, options = {}) {
        this.element = element;
        this.content = content;
        this.options = {
            placement: 'top', // top, bottom, left, right
            trigger: 'hover', // hover, click, focus
            delay: 300,
            ...options
        };
        
        this.tooltip = null;
        this.isVisible = false;
        this.timeout = null;
        
        this.init();
    }

    static instances = new Map();

    static create(element, content, options) {
        const instance = new Tooltip(element, content, options);
        Tooltip.instances.set(element, instance);
        return instance;
    }

    static destroy(element) {
        const instance = Tooltip.instances.get(element);
        if (instance) {
            instance.destroy();
            Tooltip.instances.delete(element);
        }
    }

    init() {
        this.attachEvents();
    }

    attachEvents() {
        if (this.options.trigger === 'hover') {
            this.element.addEventListener('mouseenter', () => this.show());
            this.element.addEventListener('mouseleave', () => this.hide());
        } else if (this.options.trigger === 'click') {
            this.element.addEventListener('click', () => this.toggle());
        } else if (this.options.trigger === 'focus') {
            this.element.addEventListener('focus', () => this.show());
            this.element.addEventListener('blur', () => this.hide());
        }
    }

    show() {
        if (this.isVisible) return;
        
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.create();
            this.position();
            this.tooltip.classList.add('show');
            this.isVisible = true;
        }, this.options.delay);
    }

    hide() {
        clearTimeout(this.timeout);
        
        if (this.tooltip) {
            this.tooltip.classList.remove('show');
            setTimeout(() => {
                if (this.tooltip && this.tooltip.parentNode) {
                    this.tooltip.parentNode.removeChild(this.tooltip);
                    this.tooltip = null;
                }
            }, 200);
        }
        
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    create() {
        if (this.tooltip) return;
        
        this.tooltip = document.createElement('div');
        this.tooltip.className = `tooltip tooltip-${this.options.placement}`;
        this.tooltip.innerHTML = `
            <div class="tooltip-content">${this.content}</div>
            <div class="tooltip-arrow"></div>
        `;
        
        document.body.appendChild(this.tooltip);
    }

    position() {
        if (!this.tooltip) return;
        
        const rect = this.element.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (this.options.placement) {
            case 'top':
                top = rect.top - tooltipRect.height - 8;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.right + 8;
                break;
        }
        
        // Adjust for viewport boundaries
        const margin = 8;
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));
        
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
    }

    destroy() {
        this.hide();
        // Remove event listeners would be here if we stored them
    }
}

// Dropdown Component
class Dropdown {
    constructor(trigger, menu, options = {}) {
        this.trigger = trigger;
        this.menu = menu;
        this.options = {
            closeOnClick: true,
            closeOnOutsideClick: true,
            ...options
        };
        
        this.isOpen = false;
        this.init();
    }

    static instances = new Set();

    static closeAll() {
        Dropdown.instances.forEach(instance => instance.close());
    }

    init() {
        this.attachEvents();
        Dropdown.instances.add(this);
    }

    attachEvents() {
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        if (this.options.closeOnClick) {
            this.menu.addEventListener('click', () => {
                this.close();
            });
        }

        if (this.options.closeOnOutsideClick) {
            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.menu.contains(e.target)) {
                    this.close();
                }
            });
        }

        // Keyboard navigation
        this.trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
        });

        this.menu.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
                this.trigger.focus();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.isOpen) return;
        
        // Close other dropdowns
        Dropdown.closeAll();
        
        this.menu.classList.add('show');
        this.trigger.setAttribute('aria-expanded', 'true');
        this.isOpen = true;
        
        // Focus first menu item
        const firstItem = this.menu.querySelector('a, button');
        if (firstItem) {
            firstItem.focus();
        }
    }

    close() {
        if (!this.isOpen) return;
        
        this.menu.classList.remove('show');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.isOpen = false;
    }

    destroy() {
        this.close();
        Dropdown.instances.delete(this);
    }
}

// Tabs Component
class Tabs {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            activeClass: 'active',
            ...options
        };
        
        this.tabs = [];
        this.panels = [];
        this.activeIndex = 0;
        
        this.init();
    }

    init() {
        this.findElements();
        this.attachEvents();
        this.setActiveTab(0);
    }

    findElements() {
        this.tabs = Array.from(this.container.querySelectorAll('[role="tab"]'));
        this.panels = Array.from(this.container.querySelectorAll('[role="tabpanel"]'));
    }

    attachEvents() {
        this.tabs.forEach((tab, index) => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.setActiveTab(index);
            });

            tab.addEventListener('keydown', (e) => {
                this.handleKeydown(e, index);
            });
        });
    }

    setActiveTab(index) {
        if (index < 0 || index >= this.tabs.length) return;
        
        // Remove active class from all tabs and panels
        this.tabs.forEach(tab => tab.classList.remove(this.options.activeClass));
        this.panels.forEach(panel => panel.classList.remove(this.options.activeClass));
        
        // Add active class to selected tab and panel
        this.tabs[index].classList.add(this.options.activeClass);
        this.panels[index].classList.add(this.options.activeClass);
        
        // Update ARIA attributes
        this.tabs.forEach((tab, i) => {
            tab.setAttribute('aria-selected', i === index);
            tab.setAttribute('tabindex', i === index ? '0' : '-1');
        });
        
        this.activeIndex = index;
        this.tabs[index].focus();
    }

    handleKeydown(e, index) {
        let newIndex = index;
        
        switch (e.key) {
            case 'ArrowRight':
                newIndex = (index + 1) % this.tabs.length;
                break;
            case 'ArrowLeft':
                newIndex = (index - 1 + this.tabs.length) % this.tabs.length;
                break;
            case 'Home':
                newIndex = 0;
                break;
            case 'End':
                newIndex = this.tabs.length - 1;
                break;
            default:
                return;
        }
        
        e.preventDefault();
        this.setActiveTab(newIndex);
    }
}

// Calendar Component
class Calendar {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            locale: 'ar-SA',
            firstDayOfWeek: 6, // Saturday
            showOtherMonths: true,
            ...options
        };
        
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = new Map();
        
        this.init();
    }

    init() {
        this.render();
        this.attachEvents();
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        this.container.innerHTML = `
            <div class="calendar-header">
                <button class="btn-icon calendar-prev" aria-label="الشهر السابق">
                    <i class="icon-chevron-left"></i>
                </button>
                <h3 class="calendar-title">
                    ${this.getMonthName(month)} ${year}
                </h3>
                <button class="btn-icon calendar-next" aria-label="الشهر التالي">
                    <i class="icon-chevron-right"></i>
                </button>
            </div>
            <div class="calendar-weekdays">
                ${this.renderWeekdays()}
            </div>
            <div class="calendar-days">
                ${this.renderDays(year, month)}
            </div>
        `;
    }

    renderWeekdays() {
        const weekdays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
        
        // Reorder based on first day of week
        const orderedWeekdays = [
            ...weekdays.slice(this.options.firstDayOfWeek),
            ...weekdays.slice(0, this.options.firstDayOfWeek)
        ];
        
        return orderedWeekdays.map(day => 
            `<div class="calendar-weekday">${day}</div>`
        ).join('');
    }

    renderDays(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        const endDate = new Date(lastDay);
        
        // Adjust to show full weeks
        while (startDate.getDay() !== this.options.firstDayOfWeek) {
            startDate.setDate(startDate.getDate() - 1);
        }
        
        const days = [];
        const current = new Date(startDate);
        
        while (current <= endDate || days.length % 7 !== 0) {
            const dayEvents = this.getEventsForDate(current);
            const isCurrentMonth = current.getMonth() === month;
            const isToday = this.isToday(current);
            const isSelected = this.isSelected(current);
            
            const classes = ['calendar-day'];
            if (!isCurrentMonth) classes.push('other-month');
            if (isToday) classes.push('today');
            if (isSelected) classes.push('selected');
            if (dayEvents.length > 0) classes.push('has-events');
            
            days.push(`
                <div class="${classes.join(' ')}" data-date="${current.toISOString().split('T')[0]}">
                    <span class="day-number">${current.getDate()}</span>
                    ${dayEvents.length > 0 ? `<div class="day-events">${dayEvents.length}</div>` : ''}
                </div>
            `);
            
            current.setDate(current.getDate() + 1);
        }
        
        return days.join('');
    }

    attachEvents() {
        // Navigation buttons
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.calendar-prev')) {
                this.previousMonth();
            } else if (e.target.closest('.calendar-next')) {
                this.nextMonth();
            } else if (e.target.closest('.calendar-day')) {
                const dayElement = e.target.closest('.calendar-day');
                const dateStr = dayElement.dataset.date;
                this.selectDate(new Date(dateStr));
            }
        });
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    selectDate(date) {
        this.selectedDate = date;
        this.render();
        
        // Trigger custom event
        this.container.dispatchEvent(new CustomEvent('dateselect', {
            detail: { date }
        }));
    }

    addEvent(date, event) {
        const dateStr = date.toISOString().split('T')[0];
        if (!this.events.has(dateStr)) {
            this.events.set(dateStr, []);
        }
        this.events.get(dateStr).push(event);
        this.render();
    }

    removeEvent(date, eventId) {
        const dateStr = date.toISOString().split('T')[0];
        const events = this.events.get(dateStr);
        if (events) {
            const index = events.findIndex(e => e.id === eventId);
            if (index > -1) {
                events.splice(index, 1);
                this.render();
            }
        }
    }

    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.events.get(dateStr) || [];
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isSelected(date) {
        return this.selectedDate && 
               date.toDateString() === this.selectedDate.toDateString();
    }

    getMonthName(month) {
        const months = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        return months[month];
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.render();
    }

    goToDate(date) {
        this.currentDate = new Date(date);
        this.selectedDate = new Date(date);
        this.render();
    }
}

// Initialize components automatically
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tooltips
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        const content = element.dataset.tooltip;
        const placement = element.dataset.tooltipPlacement || 'top';
        Tooltip.create(element, content, { placement });
    });
    
    // Initialize dropdowns
    document.querySelectorAll('[data-dropdown]').forEach(trigger => {
        const menuSelector = trigger.dataset.dropdown;
        const menu = document.querySelector(menuSelector);
        if (menu) {
            new Dropdown(trigger, menu);
        }
    });
    
    // Initialize tabs
    document.querySelectorAll('[data-tabs]').forEach(container => {
        new Tabs(container);
    });
});

// Add component styles
if (!document.getElementById('component-styles')) {
    const style = document.createElement('style');
    style.id = 'component-styles';
    style.textContent = `
        /* Modal Styles */
        .modal-large .modal-content { max-width: 800px; }
        .modal-small .modal-content { max-width: 400px; }
        .modal-fullscreen .modal-content { 
            max-width: 100%; 
            max-height: 100%; 
            margin: 0; 
            border-radius: 0; 
        }
        
        /* Tooltip Styles */
        .tooltip {
            position: absolute;
            z-index: 10002;
            opacity: 0;
            transition: opacity 0.2s ease;
            pointer-events: none;
        }
        
        .tooltip.show {
            opacity: 1;
        }
        
        .tooltip-content {
            background: var(--bg-primary);
            border: 1px solid var(--border-medium);
            border-radius: var(--radius-md);
            padding: var(--spacing-sm) var(--spacing-md);
            font-size: var(--font-sm);
            box-shadow: var(--shadow-lg);
            max-width: 200px;
        }
        
        .tooltip-arrow {
            position: absolute;
            width: 8px;
            height: 8px;
            background: var(--bg-primary);
            border: 1px solid var(--border-medium);
            transform: rotate(45deg);
        }
        
        .tooltip-top .tooltip-arrow {
            bottom: -5px;
            left: 50%;
            margin-left: -4px;
            border-top: none;
            border-left: none;
        }
        
        .tooltip-bottom .tooltip-arrow {
            top: -5px;
            left: 50%;
            margin-left: -4px;
            border-bottom: none;
            border-right: none;
        }
        
        .tooltip-left .tooltip-arrow {
            right: -5px;
            top: 50%;
            margin-top: -4px;
            border-left: none;
            border-bottom: none;
        }
        
        .tooltip-right .tooltip-arrow {
            left: -5px;
            top: 50%;
            margin-top: -4px;
            border-right: none;
            border-top: none;
        }
        
        /* Calendar Styles */
        .calendar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-md);
            border-bottom: 1px solid var(--border-light);
        }
        
        .calendar-title {
            margin: 0;
            font-size: var(--font-lg);
        }
        
        .calendar-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            border-bottom: 1px solid var(--border-light);
        }
        
        .calendar-weekday {
            padding: var(--spacing-sm);
            text-align: center;
            font-weight: 600;
            font-size: var(--font-sm);
            color: var(--text-secondary);
        }
        
        .calendar-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }
        
        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border-light);
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }
        
        .calendar-day:hover {
            background: var(--bg-secondary);
        }
        
        .calendar-day.other-month {
            color: var(--text-tertiary);
        }
        
        .calendar-day.today {
            background: var(--primary-color);
            color: white;
        }
        
        .calendar-day.selected {
            background: var(--primary-light);
            color: white;
        }
        
        .calendar-day.has-events .day-number {
            font-weight: 600;
        }
        
        .day-events {
            position: absolute;
            top: 2px;
            right: 2px;
            background: var(--accent-color);
            color: white;
            font-size: 10px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);
}

// Export components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Modal, Tooltip, Dropdown, Tabs, Calendar };
}