import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter, AppState, AppStateStatus } from 'react-native';

const OFFLINE_QUEUE_STORAGE_KEY = 'fittrack_offline_outbox_queue';
const MAX_RETRIES = 3;

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

class OfflineQueueManager {
  private isFlushing = false;
  private appStateSubscription: any = null;

  constructor() {
    this.initAppStateListener();
  }

  private initAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        this.triggerFlush();
      }
    });
  }

  /**
   * Retrieve all pending mutations in the outbox
   */
  async getQueue(): Promise<QueuedMutation[]> {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Get total count of pending mutations
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Save queue to AsyncStorage and broadcast update
   */
  private async saveQueue(queue: QueuedMutation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
      DeviceEventEmitter.emit('OFFLINE_QUEUE_UPDATED', { count: queue.length });
    } catch (e) {
      console.warn('[OfflineQueue] Failed to persist queue:', e);
    }
  }

  /**
   * Enqueue a failed mutation for later sync
   */
  async enqueue(item: {
    endpoint: string;
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  }): Promise<void> {
    const queue = await this.getQueue();
    const newEntry: QueuedMutation = {
      id: `mut_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      endpoint: item.endpoint,
      method: (item.method || 'POST').toUpperCase(),
      body: item.body,
      headers: item.headers,
      timestamp: Date.now(),
      retryCount: 0,
    };

    queue.push(newEntry);
    await this.saveQueue(queue);
    console.log(`[OfflineQueue] Enqueued mutation: ${newEntry.method} ${newEntry.endpoint} (Total: ${queue.length})`);
  }

  /**
   * Process and replay all queued mutations in FIFO order
   */
  async flush(
    executor: (endpoint: string, options: any) => Promise<any>
  ): Promise<{ synced: number; remaining: number }> {
    if (this.isFlushing) {
      return { synced: 0, remaining: await this.getPendingCount() };
    }

    const queue = await this.getQueue();
    if (queue.length === 0) {
      return { synced: 0, remaining: 0 };
    }

    this.isFlushing = true;
    let synced = 0;
    const remainingQueue: QueuedMutation[] = [];

    try {
      for (const item of queue) {
        try {
          await executor(item.endpoint, {
            method: item.method,
            body: item.body,
            headers: item.headers,
            _skipOfflineQueue: true,
          });
          synced++;
          console.log(`[OfflineQueue] Synced: ${item.method} ${item.endpoint}`);
        } catch (err: any) {
          const isNetworkError =
            err?.message?.includes('connect') ||
            err?.message?.includes('timed out') ||
            err?.name === 'AbortError';

          if (isNetworkError) {
            // Still offline or unstable, stop flushing and keep remaining
            remainingQueue.push(item);
            console.log(`[OfflineQueue] Still offline, paused flush on: ${item.endpoint}`);
            break;
          } else {
            // Non-network error (e.g. 400 validation), increment retry
            item.retryCount += 1;
            if (item.retryCount < MAX_RETRIES) {
              remainingQueue.push(item);
            } else {
              console.warn(`[OfflineQueue] Dropping invalid mutation after ${MAX_RETRIES} retries:`, item);
            }
          }
        }
      }

      await this.saveQueue(remainingQueue);

      if (synced > 0) {
        DeviceEventEmitter.emit('OFFLINE_SYNC_SUCCESS', {
          synced,
          remaining: remainingQueue.length,
        });
      }
    } finally {
      this.isFlushing = false;
    }

    return { synced, remaining: remainingQueue.length };
  }

  private triggerFlush() {
    DeviceEventEmitter.emit('OFFLINE_QUEUE_TRIGGER_FLUSH');
  }

  /**
   * Clear outbox queue
   */
  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);
    DeviceEventEmitter.emit('OFFLINE_QUEUE_UPDATED', { count: 0 });
  }
}

export const offlineQueue = new OfflineQueueManager();
