/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Cross-Device Document Access & Download Engine
 * Handles reliable viewing and downloading on Android Chrome, iOS Safari, desktop browsers,
 * and PWA standalone mode with token persistence and safe blob URL lifecycle.
 */

import type { AcademicDocument } from '../types/index.ts';

/**
 * Returns the direct inline viewing URL with optional token authentication query
 */
export function getDocumentViewUrl(docId: string, token?: string | null): string {
  const base = `/api/v1/documents/${encodeURIComponent(docId)}/view`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

/**
 * Returns the direct download URL with optional token authentication query
 */
export function getDocumentDownloadUrl(docId: string, token?: string | null): string {
  const base = `/api/v1/documents/${encodeURIComponent(docId)}/download`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export interface DownloadResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Downloads a document reliably across mobile (Android, iOS) and desktop browsers.
 * - Handles authenticated fetch for STUDENT_ONLY materials
 * - Traps server errors (e.g. LOGIN_REQUIRED, FORBIDDEN, DOC_NOT_FOUND) with descriptive messages
 * - Dispatches synthetic download anchor with 60-second deferred blob revocation for mobile spooling
 */
export async function downloadDocumentFile(
  doc: AcademicDocument,
  token?: string | null,
  onStatusUpdate?: (status: string) => void
): Promise<DownloadResult> {
  // Pre-flight client verification for restricted documents
  if (doc.accessLevel === 'STUDENT_ONLY' && !token) {
    return {
      success: false,
      errorCode: 'LOGIN_REQUIRED',
      error: 'Institutional Authentication Required: Please sign in with your student account to download this resource.'
    };
  }

  onStatusUpdate?.('Connecting to repository...');

  try {
    const url = getDocumentDownloadUrl(doc.id, token);
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      // Check for structured JSON error response from server
      let errorMsg = 'Failed to download document from academic repository.';
      let errCode = 'DOWNLOAD_FAILED';
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) {
          errorMsg = errJson.error.message;
        }
        if (errJson?.error?.code) {
          errCode = errJson.error.code;
        }
      } catch {
        if (response.status === 401) {
          errorMsg = 'Please sign in with your student account to download this resource.';
          errCode = 'LOGIN_REQUIRED';
        } else if (response.status === 403) {
          errorMsg = 'Access Denied: You do not have permission to download this document.';
          errCode = 'FORBIDDEN';
        } else if (response.status === 404) {
          errorMsg = 'Document Not Found: This resource may have been withdrawn or moved.';
          errCode = 'DOC_NOT_FOUND';
        }
      }

      return {
        success: false,
        errorCode: errCode,
        error: errorMsg
      };
    }

    onStatusUpdate?.('Receiving verified file...');
    const blob = await response.blob();

    // Verify blob size is non-empty
    if (blob.size === 0) {
      return {
        success: false,
        errorCode: 'EMPTY_FILE',
        error: 'The downloaded file appears empty. Please contact your course instructor.'
      };
    }

    // Generate blob URL for download trigger
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = doc.fileName || `${doc.courseCode}_Document.pdf`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Keep object URL alive for 60 seconds so Android Chrome and mobile download managers can complete spooling
    setTimeout(() => {
      try {
        window.URL.revokeObjectURL(blobUrl);
      } catch {
        // Ignored
      }
    }, 60000);

    onStatusUpdate?.('Download started');
    return { success: true };
  } catch (err: any) {
    console.error('Document download failed:', err);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      error: 'Network connection interrupted: Unable to complete document download. Please verify your connection.'
    };
  }
}
