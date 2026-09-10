import { Order, OrderStatus } from '../types';

export interface OfflineOrderPayload {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    size?: string;
    price: number;
    notes?: string;
  }[];
  totalAmount: number;
  paymentMethod: string;
  paymentReference?: string;
  paymentProofUrl?: string;
}

export interface OfflineOrder {
  id: string; // e.g. 'OFFLINE-MUFF-8492'
  orderPayload: OfflineOrderPayload;
  createdAt: string;
  retryCount: number;
  lastAttemptAt?: string;
  status: 'pending_sync' | 'syncing' | 'synced' | 'failed';
  errorMessage?: string;
}

const DB_NAME = 'MuffinnsBakeryDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_orders';

// Open IndexedDB instance with error handling and version management
export function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Custom event emitter to inform all UI components in real-time
export function notifyOfflineOrdersUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('muffinns:offline-orders-updated'));
  }
}

// Save a newly placed offline order to IndexedDB
export async function saveOfflineOrder(offlineOrder: OfflineOrder): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(offlineOrder);

    request.onsuccess = () => {
      notifyOfflineOrdersUpdated();
      resolve();
    };

    request.onerror = () => {
      console.error('Failed to save offline order to IndexedDB:', request.error);
      reject(request.error);
    };
  });
}

// Retrieve all offline orders from IndexedDB
export async function getOfflineOrders(): Promise<OfflineOrder[]> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const orders: OfflineOrder[] = request.result || [];
        // Sort newest first
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(orders);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('Could not read offline orders from IndexedDB:', err);
    return [];
  }
}

// Retrieve pending unsynced offline orders
export async function getPendingOfflineOrders(): Promise<OfflineOrder[]> {
  const allOrders = await getOfflineOrders();
  return allOrders.filter(o => o.status === 'pending_sync' || o.status === 'failed');
}

// Delete an offline order once synced or cancelled
export async function removeOfflineOrder(id: string): Promise<void> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        notifyOfflineOrdersUpdated();
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('Error removing offline order from IndexedDB:', err);
  }
}

// Update status of an offline order
export async function updateOfflineOrderStatus(
  id: string, 
  status: OfflineOrder['status'], 
  errorMessage?: string
): Promise<void> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const order = getReq.result as OfflineOrder | undefined;
        if (order) {
          order.status = status;
          order.retryCount = (order.retryCount || 0) + 1;
          order.lastAttemptAt = new Date().toISOString();
          if (errorMessage !== undefined) {
            order.errorMessage = errorMessage;
          }
          const putReq = store.put(order);
          putReq.onsuccess = () => {
            notifyOfflineOrdersUpdated();
            resolve();
          };
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };

      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('Error updating offline order status in IndexedDB:', err);
  }
}

// Convert an OfflineOrder to a temporary display Order for tracking before sync
export function offlineOrderToDisplayOrder(offline: OfflineOrder): Order {
  return {
    id: offline.id,
    customerName: offline.orderPayload.customerName,
    customerPhone: offline.orderPayload.customerPhone,
    customerAddress: offline.orderPayload.customerAddress,
    items: offline.orderPayload.items,
    totalAmount: offline.orderPayload.totalAmount,
    status: 'Pending',
    paymentMethod: offline.orderPayload.paymentMethod,
    paymentReference: offline.orderPayload.paymentReference || 'Offline Queued (IndexedDB)',
    createdAt: offline.createdAt,
  };
}

// Submit a single offline order to the backend /api/orders
export async function submitOfflineOrderToApi(offlineOrder: OfflineOrder): Promise<Order> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offlineOrder.orderPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.order) {
      throw new Error(data.error || 'Server did not return a valid order object.');
    }

    return data.order as Order;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Alias for single order synchronization
export const syncSingleOfflineOrder = submitOfflineOrderToApi;

// Synchronize all pending offline orders
export async function syncAllPendingOfflineOrders(
  onSingleOrderSynced?: (syncedOrder: Order, offlineId: string) => void
): Promise<{
  synced: Order[];
  failed: { id: string; error: string }[];
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: [], failed: [] };
  }

  const pending = await getPendingOfflineOrders();
  if (pending.length === 0) {
    return { synced: [], failed: [] };
  }

  const synced: Order[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const item of pending) {
    try {
      await updateOfflineOrderStatus(item.id, 'syncing');
      const realOrder = await submitOfflineOrderToApi(item);
      
      // Update local storage history and tracking
      recordSyncedOrderInLocalStorage(realOrder, item.id);
      
      // Delete from IndexedDB upon verified success
      await removeOfflineOrder(item.id);
      synced.push(realOrder);

      if (onSingleOrderSynced) {
        onSingleOrderSynced(realOrder, item.id);
      }

      // Dispatch global sync notification event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('muffinns:order-auto-synced', {
          detail: {
            offlineId: item.id,
            syncedOrder: realOrder
          }
        }));
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Network submission failed';
      console.warn(`Sync failed for offline order ${item.id}:`, errorMsg);
      await updateOfflineOrderStatus(item.id, 'failed', errorMsg);
      failed.push({ id: item.id, error: errorMsg });
    }
  }

  notifyOfflineOrdersUpdated();
  return { synced, failed };
}

// Helper to update localStorage order history and active tracked orders
export function recordSyncedOrderInLocalStorage(realOrder: Order, offlineId?: string) {
  try {
    // 1. Update tracked orders list
    const currentTracked: string[] = JSON.parse(localStorage.getItem('muffinns_tracked_orders') || '[]');
    // Remove temporary offline ID if present, prepend real order ID
    const filteredTracked = offlineId ? currentTracked.filter(id => id !== offlineId) : currentTracked;
    if (!filteredTracked.includes(realOrder.id)) {
      filteredTracked.unshift(realOrder.id);
    }
    localStorage.setItem('muffinns_tracked_orders', JSON.stringify(filteredTracked));

    // 2. Update order history
    const currentHistory: Order[] = JSON.parse(localStorage.getItem('muffinns_order_history') || '[]');
    const filteredHistory = offlineId ? currentHistory.filter(o => o.id !== offlineId) : currentHistory;
    const existingIdx = filteredHistory.findIndex(o => o.id.toUpperCase() === realOrder.id.toUpperCase());
    if (existingIdx > -1) {
      filteredHistory[existingIdx] = realOrder;
    } else {
      filteredHistory.unshift(realOrder);
    }
    localStorage.setItem('muffinns_order_history', JSON.stringify(filteredHistory));

    // 3. Update status tracking
    const currentStatuses = JSON.parse(localStorage.getItem('muffinns_order_statuses') || '{}');
    if (offlineId) {
      delete currentStatuses[offlineId];
    }
    currentStatuses[realOrder.id] = realOrder.status;
    localStorage.setItem('muffinns_order_statuses', JSON.stringify(currentStatuses));
  } catch (e) {
    console.error('Error recording synced order in localStorage:', e);
  }
}

// Initialize global auto-sync listeners
let isListenerAttached = false;
export function initOfflineOrderAutoSync(
  onSynced?: (order: Order, offlineId: string) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  if (isListenerAttached) return () => {};
  isListenerAttached = true;

  const triggerSync = () => {
    if (navigator.onLine) {
      syncAllPendingOfflineOrders(onSynced);
    }
  };

  const handleOnline = () => {
    console.log('🌐 Network connection restored. Auto-syncing pending offline orders from IndexedDB...');
    triggerSync();
  };

  const handleFocus = () => {
    if (navigator.onLine) {
      triggerSync();
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('focus', handleFocus);

  // Periodic heartbeat sync check every 15 seconds
  const intervalId = setInterval(() => {
    if (navigator.onLine) {
      triggerSync();
    }
  }, 15000);

  // Initial check on load
  const timerId = setTimeout(() => {
    if (navigator.onLine) {
      triggerSync();
    }
  }, 2000);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('focus', handleFocus);
    clearInterval(intervalId);
    clearTimeout(timerId);
    isListenerAttached = false;
  };
}
