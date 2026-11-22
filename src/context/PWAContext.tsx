/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub PWA Context & Hook
 * Handles Progressive Web App installation lifecycle:
 * - Standalone detection (Android, Desktop, iOS Safari)
 * - beforeinstallprompt event capture and user consent prompt
 * - Manual installation guidance for iOS Safari and other browsers
 * - Persistent dismissal preferences (prevents repeated intrusive prompts)
 * - Zero silent/unauthorized downloads
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DISMISSAL_STORAGE_KEY = 'tustudyhub_pwa_dismissed';

export interface PWAContextValue {
  isInstalled: boolean;
  canInstall: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDismissed: boolean;
  isManualModalOpen: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'manual'>;
  dismissBanner: () => void;
  openManualGuide: () => void;
  closeManualGuide: () => void;
}

const PWAContext = createContext<PWAContextValue | null>(null);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Initialize environment and standalone mode detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect OS / Browser environment
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Check if running in standalone PWA mode
    const checkIsStandalone = (): boolean => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches ||
                                window.matchMedia('(display-mode: fullscreen)').matches ||
                                window.matchMedia('(display-mode: minimal-ui)').matches;
      const isSafariStandalone = (window.navigator as any).standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');
      return Boolean(isStandaloneMedia || isSafariStandalone || isAndroidApp);
    };

    setIsInstalled(checkIsStandalone());

    // Listen for media query change (e.g. user launches or changes display mode)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };
    try {
      mediaQuery.addEventListener('change', handleMediaChange);
    } catch {
      // Fallback for older Safari
      mediaQuery.addListener?.(handleMediaChange);
    }

    // Check dismissal state in localStorage
    try {
      const storedDismissal = localStorage.getItem(DISMISSAL_STORAGE_KEY);
      if (storedDismissal === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // Storage unavailable or disabled
    }

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Capture appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      setIsManualModalOpen(false);
      try {
        localStorage.removeItem(DISMISSAL_STORAGE_KEY);
      } catch {
        // Ignored
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      try {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } catch {
        mediaQuery.removeListener?.(handleMediaChange);
      }
    };
  }, []);

  // Trigger installation workflow with explicit user consent
  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setCanInstall(false);
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.warn('Installation prompt error:', err);
        setIsManualModalOpen(true);
        return 'manual';
      }
    } else {
      // Automatic prompt unavailable (e.g., iOS Safari or non-Chromium browser)
      // Display clear, step-by-step instructions
      setIsManualModalOpen(true);
      return 'manual';
    }
  }, [deferredPrompt]);

  // Dismiss installation banner (persisted to avoid repeated annoying prompts)
  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISSAL_STORAGE_KEY, 'true');
    } catch {
      // Ignored
    }
  }, []);

  const openManualGuide = useCallback(() => {
    setIsManualModalOpen(true);
  }, []);

  const closeManualGuide = useCallback(() => {
    setIsManualModalOpen(false);
  }, []);

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        canInstall,
        isIOS,
        isAndroid,
        isDismissed,
        isManualModalOpen,
        promptInstall,
        dismissBanner,
        openManualGuide,
        closeManualGuide
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = (): PWAContextValue => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
