/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Offline & Connection State Banner
 * Conforms to SRS: alerts users of offline status and explains security restrictions.
 */

import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { AppLogoIcon } from '../common/AppLogo.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useAuth();

  if (isOnline) return null;

  return (
    <div className="bg-[#B45309] text-white px-4 py-2 shadow-md flex items-center justify-between text-xs sm:text-sm font-medium sticky top-0 z-40 transition-all">
      <div className="flex items-center gap-2 max-w-4xl mx-auto">
        <AppLogoIcon size={20} className="rounded shadow-xs border border-white/20" />
        <WifiOff className="w-3.5 h-3.5 shrink-0 text-[#FEF3C7]" />
        <span>
          <strong>Offline Mode Active:</strong> You are browsing cached application resources. Restricted academic document downloads require an active internet connection.
        </span>
      </div>
    </div>
  );
};
