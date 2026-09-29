/**
 * Browser-side persistent storage for Whiteboard data using native IndexedDB.
 * Ensures zero server-database dependency for canvas drawings, high performance,
 * and seamless offline / page-refresh resilience.
 */

const DB_NAME = 'OneClass_Whiteboard_DB';
const DB_VERSION = 1;
const STORE_NAME = 'room_canvases';

let dbPromise = null;

function getDb() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'roomCode' });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error('Failed to open Whiteboard IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  return dbPromise;
}

// In-memory debounce timers per room code
const saveTimers = new Map();

export const whiteboardStorage = {
  /**
   * Load canvas elements stored in user browser for the given room
   * @param {string} roomCode
   * @returns {Promise<Array|null>}
   */
  async loadElements(roomCode) {
    if (!roomCode) return null;
    const normalizedCode = roomCode.toUpperCase();

    try {
      const db = await getDb();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(normalizedCode);

        request.onsuccess = () => {
          if (request.result && Array.isArray(request.result.elements)) {
            resolve(request.result.elements);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.warn(`Could not read room ${normalizedCode} from IndexedDB`);
          resolve(null);
        };
      });
    } catch (err) {
      console.warn('IndexedDB unavailable, checking fallback:', err);
      try {
        const fallback = localStorage.getItem(`whiteboard_${normalizedCode}`);
        return fallback ? JSON.parse(fallback) : null;
      } catch {
        return null;
      }
    }
  },

  /**
   * Debounced save to IndexedDB (120ms debounce to batch high-frequency brush stroke events)
   * @param {string} roomCode
   * @param {Array} elements
   */
  saveElements(roomCode, elements) {
    if (!roomCode || !elements) return;
    const normalizedCode = roomCode.toUpperCase();

    if (saveTimers.has(normalizedCode)) {
      clearTimeout(saveTimers.get(normalizedCode));
    }

    const timer = setTimeout(() => {
      saveTimers.delete(normalizedCode);
      whiteboardStorage.saveElementsImmediate(normalizedCode, elements);
    }, 120);

    saveTimers.set(normalizedCode, timer);
  },

  /**
   * Immediate write to IndexedDB
   * @param {string} roomCode
   * @param {Array} elements
   */
  async saveElementsImmediate(roomCode, elements) {
    if (!roomCode) return;
    const normalizedCode = roomCode.toUpperCase();

    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const record = {
          roomCode: normalizedCode,
          elements: elements || [],
          lastModified: Date.now(),
        };

        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = (err) => {
          console.warn('Error saving whiteboard elements to IndexedDB:', err);
          reject(err);
        };
      });
    } catch (err) {
      console.warn('IndexedDB write failed, writing to fallback localStorage:', err);
      try {
        localStorage.setItem(`whiteboard_${normalizedCode}`, JSON.stringify(elements || []));
      } catch (storageErr) {
        console.error('Local fallback storage also failed:', storageErr);
      }
    }
  },

  /**
   * Clear elements for a room from local browser storage
   * @param {string} roomCode
   */
  async clearCanvas(roomCode) {
    if (!roomCode) return;
    const normalizedCode = roomCode.toUpperCase();

    if (saveTimers.has(normalizedCode)) {
      clearTimeout(saveTimers.get(normalizedCode));
      saveTimers.delete(normalizedCode);
    }

    try {
      const db = await getDb();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(normalizedCode);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    } catch (err) {
      try {
        localStorage.removeItem(`whiteboard_${normalizedCode}`);
      } catch {
        // ignore
      }
    }
  },

  /**
   * Export the current whiteboard canvas as a downloadable JSON file
   * @param {string} roomCode
   * @param {Array} elements
   */
  exportCanvasAsJson(roomCode, elements) {
    const data = {
      app: 'OneClass Whiteboard',
      version: 1,
      roomCode: (roomCode || 'ROOM').toUpperCase(),
      exportedAt: new Date().toISOString(),
      elements: elements || [],
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `whiteboard-${(roomCode || 'canvas').toUpperCase()}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },

  /**
   * Parse a JSON file containing saved whiteboard data
   * @param {File} file
   * @returns {Promise<Array>}
   */
  importCanvasFromJson(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('No file selected'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (Array.isArray(parsed.elements)) {
            resolve(parsed.elements);
          } else if (Array.isArray(parsed)) {
            resolve(parsed);
          } else {
            reject(new Error('Invalid whiteboard file format'));
          }
        } catch (err) {
          reject(new Error('Failed to parse whiteboard JSON file: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },
};

