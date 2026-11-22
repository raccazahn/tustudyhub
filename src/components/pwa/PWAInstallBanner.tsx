/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub PWA Installation Banner
 * Non-intrusive floating invitation:
 * - Automatically hidden if app is already running as installed PWA.
 * - Automatically hidden if user previously dismissed it (persisted via localStorage).
 * - Never installs silently.
 * - Explicit install action and manual instruction trigger.
 * - Verified direct application download link for standalone/offline access.
 */

import React from 'react';
import { Download, X, HelpCircle, PackageCheck } from 'lucide-react';
import { usePWA } from '../../context/PWAContext.tsx';
import { AppLogoIcon } from '../common/AppLogo.tsx';
import { Button } from '../ui/Button.tsx';

export const PWAInstallBanner: React.FC = () => {
  const { isInstalled, isDismissed, promptInstall, dismissBanner, openManualGuide } = usePWA();

  // Strict Rule: Never show if already running in standalone mode or dismissed by user
  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <div
      className="fixed bottom-18 md:bottom-6 right-3 left-3 md:left-auto md:right-6 md:max-w-lg z-40 bg-white border border-[#DDD8CF] rounded-2xl shadow-[0_12px_36px_rgba(28,26,23,0.16)] p-4 animate-in slide-in-from-bottom-5 duration-300 select-none"
      role="region"
      aria-label="TuStudyHub App Installation Preview"
    >
      <div className="flex items-start gap-3">
        {/* Official System Logo */}
        <AppLogoIcon size={44} className="rounded-xl shadow-xs shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-black text-[#1C1A17] tracking-tight">
              Install TuStudyHub
            </h4>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F7E4D0] text-[#8A3E12]">
              PWA
            </span>
          </div>
          <p className="text-xs text-[#726B62] leading-snug mt-1">
            Install on your device for fast offline navigation, instant access, and a native app experience.
          </p>

          {/* Action buttons & Verified Direct Download Link */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Button
              variant="clayFill"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => promptInstall()}
              className="text-xs font-bold"
            >
              Install App
            </Button>

            {/* Direct Verified Application Download Link */}
            <a
              href="/api/v1/download/app"
              download="TuStudyHub-Academic-PWA.zip"
              className="min-h-[36px] px-2.5 py-1 text-xs font-bold text-[#2D6A4F] bg-[#E8F5E9] hover:bg-[#D4EDDA] border border-[#A3D9B5] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer no-underline"
              title="Download standalone offline package (.zip)"
            >
              <PackageCheck className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Download (.zip)</span>
            </a>

            <button
              type="button"
              onClick={openManualGuide}
              className="min-h-[36px] px-2 py-1 text-xs font-semibold text-[#8A3E12] hover:bg-[#FBF1E6] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Guide</span>
            </button>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={dismissBanner}
          className="text-[#726B62] hover:text-[#1C1A17] p-1.5 rounded-lg hover:bg-[#EDE9E2] transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss installation banner"
          title="Dismiss (won't show again)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
