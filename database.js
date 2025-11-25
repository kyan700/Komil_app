/* =====================================================
   كُميل برو - إدارة قاعدة البيانات
   استخدام IndexedDB للتخزين المحلي
===================================================== */

class KomeilDB {
    constructor() {
        this.dbName = 'KomeilProDB';
        this.version = 1;
        this.db = null;
        
        this.stores = {
            subjects: 'subjects',
            tasks: 'tasks',
            schedule: 'schedule',
            files: 'files',
            grades: 'grades',
            notes: 'notes',
            goals: 'goals',
            settings: 'settings'
        };
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject(new Error('فشل في فتح قاعدة البيانات'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('تم فتح قاعدة البيانات بنجاح');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                this.createStores();
            };
        });
    }

    createStores() {
        // Subjects store
        if (!this.db.objectStoreNames.contains(this.stores.subjects)) {
            const subjectsStore = this.db.createObjectStore(this.stores.subjects, {
                keyPath: 'id',
                autoIncrement: true
            });
            subjectsStore.createIndex('code', 'code', { unique: true });
            subjectsStore.createIndex('semester', 'semester');
            subjectsStore.createIndex('createdAt', 'createdAt');
        }

        // Tasks store
        if (!this.db.objectStoreNames.contains(this.stores.tasks)) {
            const tasksStore = this.db.createObjectStore(this.stores.tasks, {
                keyPath: 'id',
                autoIncrement: true
            });
            tasksStore.createIndex('subjectId', 'subjectId');
            tasksStore.createIndex('dueDate', 'dueDate');
            tasksStore.createIndex('priority', 'priority');
            tasksStore.createIndex('completed', 'completed');
            tasksStore.createIndex('createdAt', 'createdAt');
        }

        // Schedule store
        if (!this.db.objectStoreNames.contains(this.stores.schedule)) {
            const scheduleStore = this.db.createObjectStore(this.stores.schedule, {
                keyPath: 'id',
                autoIncrement: true
            });
            scheduleStore.createIndex('subjectId', 'subjectId');
            scheduleStore.createIndex('dayOfWeek', 'dayOfWeek');
            scheduleStore.createIndex('startTime', 'startTime');
        }

        // Files store
        if (!this.db.objectStoreNames.contains(this.stores.files)) {
            const filesStore = this.db.createObjectStore(this.stores.files, {
                keyPath: 'id',
                autoIncrement: true
            });
            filesStore.createIndex('subjectId', 'subjectId');
            filesStore.createIndex('type', 'type');
            filesStore.createIndex('uploadDate', 'uploadDate');
        }

        // Grades store
        if (!this.db.objectStoreNames.contains(this.stores.grades)) {
            const gradesStore = this.db.createObjectStore(this.stores.grades, {
                keyPath: 'id',
                autoIncrement: true
            });
            gradesStore.createIndex('subjectId', 'subjectId');
            gradesStore.createIndex('type', 'type');
            gradesStore.createIndex('date', 'date');
        }

        // Notes store
        if (!this.db.objectStoreNames.contains(this.stores.notes)) {
            const notesStore = this.db.createObjectStore(this.stores.notes, {
                keyPath: 'id',
                autoIncrement: true
            });
            notesStore.createIndex('subjectId', 'subjectId');
            notesStore.createIndex('createdAt', 'createdAt');
            notesStore.createIndex('updatedAt', 'updatedAt');
        }

        // Goals store
        if (!this.db.objectStoreNames.contains(this.stores.goals)) {
            const goalsStore = this.db.createObjectStore(this.stores.goals, {
                keyPath: 'id',
                autoIncrement: true
            });
            goalsStore.createIndex('targetDate', 'targetDate');
            goalsStore.createIndex('completed', 'completed');
            goalsStore.createIndex('priority', 'priority');
        }

        // Settings store
        if (!this.db.objectStoreNames.contains(this.stores.settings)) {
            this.db.createObjectStore(this.stores.settings, {
                keyPath: 'key'
            });
        }

        console.log('تم إنشاء جداول قاعدة البيانات بنجاح');
    }

    // Generic CRUD operations
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`فشل في إضافة البيانات إلى ${storeName}`));
            };
        });
    }

    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`فشل في تحديث البيانات في ${storeName}`));
            };
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error(`فشل في حذف البيانات من ${storeName}`));
            };
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`فشل في جلب البيانات من ${storeName}`));
            };
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`فشل في جلب جميع البيانات من ${storeName}`));
            };
        });
    }

    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`فشل في البحث في ${storeName} باستخدام ${indexName}`));
            };
        });
    }

    // Subject operations
    async addSubject(subject) {
        try {
            const id = await this.add(this.stores.subjects, subject);
            return { ...subject, id };
        } catch (error) {
            throw new Error('فشل في إضافة المادة الدراسية');
        }
    }

    async updateSubject(subject) {
        return this.update(this.stores.subjects, subject);
    }

    async deleteSubject(id) {
        // Also delete related data
        await Promise.all([
            this.delete(this.stores.subjects, id),
            this.deleteTasksBySubject(id),
            this.deleteScheduleBySubject(id),
            this.deleteFilesBySubject(id),
            this.deleteGradesBySubject(id),
            this.deleteNotesBySubject(id)
        ]);
    }

    async getSubject(id) {
        return this.get(this.stores.subjects, id);
    }

    async getAllSubjects() {
        return this.getAll(this.stores.subjects);
    }

    async getSubjectsBysemester(semester) {
        return this.getByIndex(this.stores.subjects, 'semester', semester);
    }

    // Task operations
    async addTask(task) {
        try {
            const id = await this.add(this.stores.tasks, task);
            return { ...task, id };
        } catch (error) {
            throw new Error('فشل في إضافة المهمة');
        }
    }

    async updateTask(task) {
        return this.update(this.stores.tasks, task);
    }

    async deleteTask(id) {
        return this.delete(this.stores.tasks, id);
    }

    async getTask(id) {
        return this.get(this.stores.tasks, id);
    }

    async getAllTasks() {
        return this.getAll(this.stores.tasks);
    }

    async getTasksBySubject(subjectId) {
        return this.getByIndex(this.stores.tasks, 'subjectId', subjectId);
    }

    async deleteTasksBySubject(subjectId) {
        const tasks = await this.getTasksBySubject(subjectId);
        await Promise.all(tasks.map(task => this.deleteTask(task.id)));
    }

    async getUpcomingTasks(limit = 10) {
        const tasks = await this.getAllTasks();
        const now = new Date();
        
        return tasks
            .filter(task => !task.completed && new Date(task.dueDate) >= now)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, limit);
    }

    async getOverdueTasks() {
        const tasks = await this.getAllTasks();
        const now = new Date();
        
        return tasks
            .filter(task => !task.completed && new Date(task.dueDate) < now)
            .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
    }

    async markTaskComplete(id) {
        const task = await this.getTask(id);
        if (task) {
            task.completed = true;
            task.completedAt = new Date();
            await this.updateTask(task);
        }
    }

    // Schedule operations
    async addScheduleItem(item) {
        return this.add(this.stores.schedule, item);
    }

    async updateScheduleItem(item) {
        return this.update(this.stores.schedule, item);
    }

    async deleteScheduleItem(id) {
        return this.delete(this.stores.schedule, id);
    }

    async getAllSchedule() {
        return this.getAll(this.stores.schedule);
    }

    async getScheduleBySubject(subjectId) {
        return this.getByIndex(this.stores.schedule, 'subjectId', subjectId);
    }

    async deleteScheduleBySubject(subjectId) {
        const items = await this.getScheduleBySubject(subjectId);
        await Promise.all(items.map(item => this.deleteScheduleItem(item.id)));
    }

    async getTodaySchedule() {
        const schedule = await this.getAllSchedule();
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        return schedule
            .filter(item => item.dayOfWeek === today)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    // File operations
    async addFile(file) {
        return this.add(this.stores.files, file);
    }

    async updateFile(file) {
        return this.update(this.stores.files, file);
    }

    async deleteFile(id) {
        return this.delete(this.stores.files, id);
    }

    async getAllFiles() {
        return this.getAll(this.stores.files);
    }

    async getFilesBySubject(subjectId) {
        return this.getByIndex(this.stores.files, 'subjectId', subjectId);
    }

    async deleteFilesBySubject(subjectId) {
        const files = await this.getFilesBySubject(subjectId);
        await Promise.all(files.map(file => this.deleteFile(file.id)));
    }

    async getFilesByType(type) {
        return this.getByIndex(this.stores.files, 'type', type);
    }

    // Grade operations
    async addGrade(grade) {
        return this.add(this.stores.grades, grade);
    }

    async updateGrade(grade) {
        return this.update(this.stores.grades, grade);
    }

    async deleteGrade(id) {
        return this.delete(this.stores.grades, id);
    }

    async getAllGrades() {
        return this.getAll(this.stores.grades);
    }

    async getGradesBySubject(subjectId) {
        return this.getByIndex(this.stores.grades, 'subjectId', subjectId);
    }

    async deleteGradesBySubject(subjectId) {
        const grades = await this.getGradesBySubject(subjectId);
        await Promise.all(grades.map(grade => this.deleteGrade(grade.id)));
    }

    // Note operations
    async addNote(note) {
        return this.add(this.stores.notes, note);
    }

    async updateNote(note) {
        note.updatedAt = new Date();
        return this.update(this.stores.notes, note);
    }

    async deleteNote(id) {
        return this.delete(this.stores.notes, id);
    }

    async getAllNotes() {
        return this.getAll(this.stores.notes);
    }

    async getNotesBySubject(subjectId) {
        return this.getByIndex(this.stores.notes, 'subjectId', subjectId);
    }

    async deleteNotesBySubject(subjectId) {
        const notes = await this.getNotesBySubject(subjectId);
        await Promise.all(notes.map(note => this.deleteNote(note.id)));
    }

    // Goal operations
    async addGoal(goal) {
        return this.add(this.stores.goals, goal);
    }

    async updateGoal(goal) {
        return this.update(this.stores.goals, goal);
    }

    async deleteGoal(id) {
        return this.delete(this.stores.goals, id);
    }

    async getAllGoals() {
        return this.getAll(this.stores.goals);
    }

    async getActiveGoals() {
        const goals = await this.getAllGoals();
        return goals.filter(goal => !goal.completed);
    }

    async markGoalComplete(id) {
        const goal = await this.get(this.stores.goals, id);
        if (goal) {
            goal.completed = true;
            goal.completedAt = new Date();
            await this.updateGoal(goal);
        }
    }

    // Settings operations
    async setSetting(key, value) {
        return this.update(this.stores.settings, { key, value });
    }

    async getSetting(key, defaultValue = null) {
        try {
            const setting = await this.get(this.stores.settings, key);
            return setting ? setting.value : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }

    async deleteSetting(key) {
        return this.delete(this.stores.settings, key);
    }

    // Statistics and analytics
    async getStatistics() {
        try {
            const [subjects, tasks, files, grades] = await Promise.all([
                this.getAllSubjects(),
                this.getAllTasks(),
                this.getAllFiles(),
                this.getAllGrades()
            ]);

            const completedTasks = tasks.filter(task => task.completed).length;
            const pendingTasks = tasks.filter(task => !task.completed).length;
            const overdueTasks = await this.getOverdueTasks();

            return {
                subjects: {
                    total: subjects.length,
                    creditHours: subjects.reduce((sum, s) => sum + (s.creditHours || 0), 0)
                },
                tasks: {
                    total: tasks.length,
                    completed: completedTasks,
                    pending: pendingTasks,
                    overdue: overdueTasks.length
                },
                files: {
                    total: files.length,
                    size: files.reduce((sum, f) => sum + (f.size || 0), 0)
                },
                grades: {
                    total: grades.length,
                    average: this.calculateGPA(subjects)
                }
            };
        } catch (error) {
            console.error('خطأ في حساب الإحصائيات:', error);
            return null;
        }
    }

    calculateGPA(subjects) {
        if (!subjects || subjects.length === 0) return 0;
        
        let totalPoints = 0;
        let totalHours = 0;
        
        subjects.forEach(subject => {
            if (subject.gpa && subject.creditHours) {
                totalPoints += subject.gpa * subject.creditHours;
                totalHours += subject.creditHours;
            }
        });
        
        return totalHours > 0 ? totalPoints / totalHours : 0;
    }

    // Database maintenance
    async clearAllData() {
        const storeNames = Object.values(this.stores);
        
        return Promise.all(storeNames.map(storeName => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(new Error(`فشل في مسح ${storeName}`));
            });
        }));
    }

    async exportData() {
        try {
            const data = {};
            
            for (const [key, storeName] of Object.entries(this.stores)) {
                data[key] = await this.getAll(storeName);
            }
            
            return {
                version: this.version,
                exportDate: new Date().toISOString(),
                data
            };
        } catch (error) {
            throw new Error('فشل في تصدير البيانات');
        }
    }

    async importData(importedData) {
        try {
            // Clear existing data
            await this.clearAllData();
            
            // Import new data
            for (const [key, items] of Object.entries(importedData.data)) {
                if (this.stores[key] && Array.isArray(items)) {
                    for (const item of items) {
                        // Remove id for auto-increment stores
                        delete item.id;
                        await this.add(this.stores[key], item);
                    }
                }
            }
            
            return true;
        } catch (error) {
            throw new Error('فشل في استيراد البيانات');
        }
    }

    // Storage usage calculation
    async getStorageUsage() {
        try {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage || 0,
                quota: estimate.quota || 0,
                percentage: estimate.quota ? 
                    Math.round((estimate.usage / estimate.quota) * 100) : 0
            };
        } catch (error) {
            return { used: 0, quota: 0, percentage: 0 };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KomeilDB;
}