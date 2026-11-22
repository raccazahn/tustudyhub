/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Button Component
 * Enforces minimum 44px mobile touch targets and Clay & Kaolin theme.
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'clayFill' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  // Sizing with minimum 44px touch targets on mobile
  const sizeClasses = {
    sm: 'min-h-[38px] px-3 py-1.5 text-xs sm:text-sm gap-1.5',
    md: 'min-h-[44px] px-4 py-2 text-sm gap-2',
    lg: 'min-h-[48px] px-5 py-2.5 text-base gap-2.5'
  }[size];

  // Approved Clay & Kaolin Color Variants
  const variantClasses = {
    // Primary Clay (Clay 700 with Clay 600 hover)
    primary: 'bg-[#8A3E12] hover:bg-[#A84D16] text-white focus:ring-[#8A3E12] shadow-sm',
    // Clay Fill (Clay 500 - strictly for fills per Rule 3)
    clayFill: 'bg-[#C2691D] hover:bg-[#A84D16] text-white focus:ring-[#C2691D] shadow-sm',
    // Secondary Kaolin (Kaolin 100 with Kaolin 200 border and Kaolin 900 text)
    secondary: 'bg-[#EDE9E2] hover:bg-[#DDD8CF] text-[#1C1A17] border border-[#C4BEB4] focus:ring-[#726B62]',
    // Outline Clay
    outline: 'bg-transparent border border-[#8A3E12] text-[#8A3E12] hover:bg-[#FBF1E6] focus:ring-[#8A3E12]',
    // Flag Red (Identity use / destructive actions)
    danger: 'bg-[#B91C1C] hover:bg-[#991B1B] text-white focus:ring-[#B91C1C] shadow-sm',
    // Ghost
    ghost: 'bg-transparent hover:bg-[#EDE9E2] text-[#4A463F] focus:ring-[#C4BEB4]'
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
