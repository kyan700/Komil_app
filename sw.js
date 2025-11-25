/* =====================================================
   كُميل برو - Service Worker
   للعمل بدون إنترنت وإدارة التخزين المؤقت
===================================================== */

const CACHE_NAME = 'komeil-pro-v1.0.0';
const STATIC_CACHE = 'komeil-static-v1';
const DYNAMIC_CACHE = 'komeil-dynamic-v1';

// Static files to cache
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/database.js',
    '/notifications.js',
    '/components.js',
    '/advanced-features.js',
    '/manifest.json',
    '/icon.svg',
    '/icon-72.png',
    '/icon-96.png',
    '/icon-128.png',
    '/icon-144.png',
    '/icon-152.png',
    '/icon-192.png',
    '/icon-384.png',
    '/icon-512.png'
];

// Dynamic cache patterns
const CACHE_PATTERNS = [
    /^https:\/\/fonts\.googleapis\.com/,
    /^https:\/\/fonts\.gstatic\.com/,
    /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    /\.(?:css|js)$/
];

// Files to exclude from caching
const EXCLUDE_PATTERNS = [
    /\/api\//,
    /\/admin\//,
    /\?.*nocache/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static files', error);
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip excluded patterns
    if (EXCLUDE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        return;
    }
    
    event.respondWith(
        handleFetch(request)
    );
});

// Handle fetch with caching strategies
async function handleFetch(request) {
    const url = new URL(request.url);
    
    try {
        // Strategy 1: Cache First (for static files)
        if (STATIC_FILES.includes(url.pathname) || url.pathname === '/') {
            return await cacheFirst(request);
        }
        
        // Strategy 2: Network First (for dynamic content)
        if (shouldCacheDynamically(request)) {
            return await networkFirst(request);
        }
        
        // Strategy 3: Network Only (for uncached requests)
        return await fetch(request);
        
    } catch (error) {
        console.error('Service Worker: Fetch failed', error);
        
        // Fallback to offline page for navigation requests
        if (request.mode === 'navigate') {
            return await caches.match('/index.html');
        }
        
        throw error;
    }
}

// Cache First strategy
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            // Update cache in background
            updateCacheInBackground(request);
            return cachedResponse;
        }
        
        // Not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        // Try to return cached version as fallback
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Network First strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Check if request should be cached dynamically
function shouldCacheDynamically(request) {
    const url = new URL(request.url);
    
    return CACHE_PATTERNS.some(pattern => {
        if (pattern instanceof RegExp) {
            return pattern.test(url.href);
        }
        return url.href.includes(pattern);
    });
}

// Update cache in background
async function updateCacheInBackground(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            await cache.put(request, networkResponse);
        }
    } catch (error) {
        // Silent fail for background updates
        console.warn('Service Worker: Background update failed', error);
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(handleBackgroundSync());
    }
});

// Handle background synchronization
async function handleBackgroundSync() {
    try {
        // Get offline actions from IndexedDB
        const offlineActions = await getOfflineActions();
        
        for (const action of offlineActions) {
            try {
                await processOfflineAction(action);
                await removeOfflineAction(action.id);
            } catch (error) {
                console.error('Service Worker: Failed to sync action', action, error);
            }
        }
        
        // Notify main thread of sync completion
        await notifyClients('sync-complete');
        
    } catch (error) {
        console.error('Service Worker: Background sync failed', error);
    }
}

// Process offline action
async function processOfflineAction(action) {
    const { type, data, url, method = 'POST' } = action;
    
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: 'لديك تحديث جديد في كُميل برو',
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/'
        },
        actions: [
            {
                action: 'open',
                title: 'فتح التطبيق',
                icon: '/icon-72.png'
            },
            {
                action: 'close',
                title: 'إغلاق'
            }
        ]
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            Object.assign(options, data);
        } catch (error) {
            console.warn('Service Worker: Invalid push data', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification('كُميل برو', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event.action);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // Try to focus existing window
                    for (const client of clientList) {
                        if (client.url === self.location.origin && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // Open new window
                    if (clients.openWindow) {
                        const url = event.notification.data?.url || '/';
                        return clients.openWindow(url);
                    }
                })
        );
    }
});

// Periodic background sync for reminders
self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync triggered', event.tag);
    
    if (event.tag === 'check-reminders') {
        event.waitUntil(checkReminders());
    }
});

// Check for task and schedule reminders
async function checkReminders() {
    try {
        // This would typically fetch from IndexedDB
        const now = new Date();
        
        // Check for upcoming tasks
        const upcomingTasks = await getUpcomingTasks();
        
        for (const task of upcomingTasks) {
            const dueDate = new Date(task.dueDate);
            const timeDiff = dueDate - now;
            const hoursLeft = timeDiff / (1000 * 60 * 60);
            
            if (hoursLeft <= 24 && hoursLeft > 0) {
                await showTaskReminder(task, hoursLeft);
            }
        }
        
        // Check for schedule reminders
        const todaySchedule = await getTodaySchedule();
        
        for (const item of todaySchedule) {
            if (shouldShowScheduleReminder(item, now)) {
                await showScheduleReminder(item);
            }
        }
        
    } catch (error) {
        console.error('Service Worker: Failed to check reminders', error);
    }
}

// Show task reminder notification
async function showTaskReminder(task, hoursLeft) {
    const title = 'تذكير بالمهام';
    let body;
    
    if (hoursLeft <= 1) {
        body = `مهمة "${task.title}" مستحقة خلال ساعة`;
    } else {
        body = `مهمة "${task.title}" مستحقة خلال ${Math.ceil(hoursLeft)} ساعة`;
    }
    
    await self.registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: `task-${task.id}`,
        requireInteraction: true,
        data: { taskId: task.id },
        actions: [
            {
                action: 'view-task',
                title: 'عرض المهمة'
            },
            {
                action: 'dismiss',
                title: 'تأجيل'
            }
        ]
    });
}

// Show schedule reminder notification
async function showScheduleReminder(item) {
    const title = 'تذكير بالمحاضرة';
    const body = `محاضرة ${item.subject} تبدأ في ${item.startTime}`;
    
    await self.registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: `schedule-${item.id}`,
        data: { scheduleId: item.id },
        actions: [
            {
                action: 'view-schedule',
                title: 'عرض الجدول'
            }
        ]
    });
}

// Utility functions for IndexedDB operations
async function getOfflineActions() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('KomeilProOffline', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['actions'], 'readonly');
            const store = transaction.objectStore('actions');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
            getAllRequest.onerror = () => reject(getAllRequest.error);
        };
        
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('actions')) {
                db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
            }
            resolve([]);
        };
    });
}

async function removeOfflineAction(id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('KomeilProOffline', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['actions'], 'readwrite');
            const store = transaction.objectStore('actions');
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
    });
}

async function getUpcomingTasks() {
    // This would interface with the main app's IndexedDB
    // For now, return empty array
    return [];
}

async function getTodaySchedule() {
    // This would interface with the main app's IndexedDB
    // For now, return empty array
    return [];
}

function shouldShowScheduleReminder(item, now) {
    // Logic to determine if we should show reminder
    // Based on class start time and user preferences
    return false;
}

// Notify all clients
async function notifyClients(message, data = null) {
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
        client.postMessage({
            type: 'notification',
            message,
            data
        });
    });
}

// Cache size management
async function manageCacheSize() {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    // Remove oldest entries if cache is too large (> 100 items)
    if (requests.length > 100) {
        const entriesToDelete = requests.slice(0, requests.length - 100);
        
        await Promise.all(
            entriesToDelete.map(request => cache.delete(request))
        );
        
        console.log(`Service Worker: Cleaned up ${entriesToDelete.length} cache entries`);
    }
}

// Periodic cache cleanup
setInterval(manageCacheSize, 24 * 60 * 60 * 1000); // Daily

// Message handling from main thread
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URLS':
            if (Array.isArray(data)) {
                cacheUrls(data);
            }
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches();
            break;
            
        default:
            console.warn('Service Worker: Unknown message type', type);
    }
});

// Cache specific URLs
async function cacheUrls(urls) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.addAll(urls);
        console.log('Service Worker: URLs cached successfully', urls);
    } catch (error) {
        console.error('Service Worker: Failed to cache URLs', error);
    }
}

// Clear all caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('Service Worker: All caches cleared');
    } catch (error) {
        console.error('Service Worker: Failed to clear caches', error);
    }
}

console.log('Service Worker: Script loaded successfully');