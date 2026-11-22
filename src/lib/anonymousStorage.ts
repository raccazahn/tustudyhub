/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Anonymous Learning Progress Engine
 * Provides client-side persistence for visitors practicing quizzes without accounts.
 * Primary storage: IndexedDB (TuStudyHub_DB / anonymous_quiz_attempts)
 * Fallback: localStorage / in-memory buffer
 */

import type { QuizAttempt } from '../types/index.ts';

const DB_NAME = 'TuStudyHub_DB';
const DB_VERSION = 1;
const STORE_NAME = 'anonymous_quiz_attempts';
const LOCAL_STORAGE_FALLBACK_KEY = 'tustudyhub_anonymous_quiz_attempts';

// In-memory fallback if both IndexedDB and localStorage are unavailable
let memoryAttemptsStore: QuizAttempt[] = [];

/**
 * Diagnostic information regarding active browser storage
 */
export interface StorageDiagnostics {
  engine: 'IndexedDB' | 'localStorage' | 'Memory (Temporary)';
  isPersistent: boolean;
  attemptCount: number;
  notice: string;
}

/**
 * Checks if IndexedDB is available and functional in the current environment
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Opens connection to IndexedDB
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not supported or accessible in this environment.'));
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('quizId', 'quizId', { unique: false });
          store.createIndex('courseCode', 'courseCode', { unique: false });
          store.createIndex('completedAt', 'completedAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB database.'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Read attempts from localStorage fallback
 */
function getFromLocalStorage(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [...memoryAttemptsStore];
  }
}

/**
 * Save attempts to localStorage fallback
 */
function saveToLocalStorage(attempts: QuizAttempt[]): boolean {
  try {
    localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(attempts));
    return true;
  } catch {
    memoryAttemptsStore = [...attempts];
    return false;
  }
}

/**
 * Saves a completed anonymous quiz attempt to local device storage.
 * Prioritizes IndexedDB, gracefully falling back to localStorage.
 */
export async function saveAnonymousQuizAttempt(attempt: QuizAttempt): Promise<{
  success: boolean;
  engine: 'IndexedDB' | 'localStorage' | 'Memory';
}> {
  // Ensure the attempt has anonymous metadata
  const sanitizedAttempt: QuizAttempt = {
    ...attempt,
    userId: 'anonymous',
    userName: attempt.userName || 'Anonymous Learner',
  };

  // Attempt IndexedDB first
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putRequest = store.put(sanitizedAttempt);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
      tx.onabort = () => reject(tx.error);
    });

    return { success: true, engine: 'IndexedDB' };
  } catch (idbErr) {
    console.warn('[TuStudyHub Storage] IndexedDB failed, switching to localStorage fallback:', idbErr);

    // Fallback to localStorage
    const existing = getFromLocalStorage();
    const updated = [sanitizedAttempt, ...existing.filter(a => a.id !== sanitizedAttempt.id)];
    const saved = saveToLocalStorage(updated);

    return {
      success: true,
      engine: saved ? 'localStorage' : 'Memory'
    };
  }
}

/**
 * Retrieves all stored anonymous quiz attempts, optionally filtered by quizId or courseCode
 */
export async function getAnonymousQuizAttempts(options?: {
  quizId?: string;
  courseCode?: string;
}): Promise<QuizAttempt[]> {
  try {
    const db = await openDatabase();
    const attempts = await new Promise<QuizAttempt[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });

    let result = attempts;
    if (options?.quizId) {
      result = result.filter(a => a.quizId === options.quizId);
    }
    if (options?.courseCode) {
      result = result.filter(a => a.courseCode.toLowerCase() === options.courseCode?.toLowerCase());
    }

    return result.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  } catch (err) {
    // Fallback to localStorage
    let attempts = getFromLocalStorage();
    if (options?.quizId) {
      attempts = attempts.filter(a => a.quizId === options.quizId);
    }
    if (options?.courseCode) {
      attempts = attempts.filter(a => a.courseCode.toLowerCase() === options.courseCode?.toLowerCase());
    }
    return attempts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }
}

/**
 * Retrieves a single anonymous attempt by its unique identifier
 */
export async function getAnonymousQuizAttemptById(id: string): Promise<QuizAttempt | null> {
  try {
    const db = await openDatabase();
    return await new Promise<QuizAttempt | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch {
    const attempts = getFromLocalStorage();
    return attempts.find(a => a.id === id) || null;
  }
}

/**
 * Deletes a single anonymous attempt by id
 */
export async function deleteAnonymousQuizAttempt(id: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delRequest = store.delete(id);

      delRequest.onsuccess = () => resolve();
      delRequest.onerror = () => reject(delRequest.error);
    });
  } catch {
    // Fallback
    const existing = getFromLocalStorage();
    saveToLocalStorage(existing.filter(a => a.id !== id));
  }
  return true;
}

/**
 * Clears all anonymous quiz attempts from the device
 */
export async function clearAllAnonymousQuizAttempts(): Promise<boolean> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  } catch {
    // ignore
  }

  try {
    localStorage.removeItem(LOCAL_STORAGE_FALLBACK_KEY);
  } catch {
    // ignore
  }
  memoryAttemptsStore = [];
  return true;
}

/**
 * Computes aggregated statistics for local anonymous learning history
 */
export async function getAnonymousLearningStats(): Promise<{
  totalAttempts: number;
  passedCount: number;
  avgScore: number;
  distinctCourses: string[];
  lastPracticedAt: string | null;
}> {
  const attempts = await getAnonymousQuizAttempts();
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      passedCount: 0,
      avgScore: 0,
      distinctCourses: [],
      lastPracticedAt: null
    };
  }

  const passedCount = attempts.filter(a => a.passed).length;
  const avgScore = Math.round(attempts.reduce((sum, a) => sum + a.scorePercentage, 0) / attempts.length);
  const distinctCourses = Array.from(new Set(attempts.map(a => a.courseCode)));
  const lastPracticedAt = attempts[0]?.completedAt || null;

  return {
    totalAttempts: attempts.length,
    passedCount,
    avgScore,
    distinctCourses,
    lastPracticedAt
  };
}

/**
 * Returns diagnostics about the current client-side storage state
 */
export async function getStorageDiagnostics(): Promise<StorageDiagnostics> {
  const attempts = await getAnonymousQuizAttempts();
  const isIdb = isIndexedDBAvailable();

  return {
    engine: isIdb ? 'IndexedDB' : 'localStorage',
    isPersistent: true,
    attemptCount: attempts.length,
    notice: 'Anonymous learning progress is stored locally on this device. It is not synchronized across devices or accounts. Clearing browser cache or switching devices will reset this local history.'
  };
}
