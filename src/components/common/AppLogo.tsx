/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Official System Logo Component
 * Renders the institutional Clay & Kaolin brand emblem:
 * - Knowledge Pages in Kaolin Cream (#EDE9E2)
 * - Academic Verification Seal in Clay 500 (#C2691D)
 * - Clay 700 (#8A3E12) and Dark Charcoal (#1C1A17) housing
 */

import React from 'react';

interface AppLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AppLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = ''
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      aria-label="TuStudyHub Institutional Emblem"
    >
      <rect width="512" height="512" rx="112" fill="#8A3E12"/>
      <rect x="28" y="28" width="456" height="456" rx="88" fill="#1C1A17" stroke="#A84D16" strokeWidth="4"/>
      {/* Book / Knowledge Pages in Kaolin Cream */}
      <path d="M128 176c48-24 96-24 128 0 32-24 80-24 128 0v168c-48-24-96-24-128 0-32-24-80-24-128 0V176z" fill="#EDE9E2"/>
      <path d="M256 176v168" stroke="#8A3E12" strokeWidth="8" strokeLinecap="round"/>
      {/* Verification Seal in Clay 500 & Clay 100 */}
      <circle cx="256" cy="240" r="44" fill="#C2691D" stroke="#F7E4D0" strokeWidth="6"/>
      <path d="M240 240l12 12 24-24" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Brand Initials TSH */}
      <text x="256" y="388" fontFamily="system-ui, -apple-system, sans-serif" fontSize="34" fontWeight="900" fill="#F7E4D0" textAnchor="middle" letterSpacing="4">TUSTUDYHUB</text>
      <text x="256" y="418" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="600" fill="#DDD8CF" textAnchor="middle" letterSpacing="3">LEARN • SHARE • VERIFY</text>
    </svg>
  );
};

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  onClick
}) => {
  const pixelSize = typeof size === 'number'
    ? size
    : size === 'sm' ? 32
    : size === 'md' ? 40
    : size === 'lg' ? 48
    : 64;

  return (
    <div
      className={`flex items-center gap-3 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <AppLogoIcon size={pixelSize} className="rounded-xl shadow-xs" />
      {showText && (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-[#1C1A17] font-sans">
              TuStudyHub
            </span>
          </div>
          <p className="text-[11px] font-semibold text-[#8A3E12] tracking-wider uppercase">
            Learn • Share • Verify
          </p>
        </div>
      )}
    </div>
  );
};

export default AppLogo;
