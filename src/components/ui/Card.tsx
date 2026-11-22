/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Card Component
 * Kaolin neutral surface with subtle 1px border and warm ambient shadows.
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'interactive' | 'clayTint';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }[padding];

  const variantClasses = {
    default: 'bg-white border border-[#DDD8CF] shadow-[0_1px_3px_rgba(28,26,23,0.06)]',
    flat: 'bg-[#EDE9E2] border border-[#DDD8CF]',
    interactive: 'bg-white border border-[#DDD8CF] shadow-[0_1px_3px_rgba(28,26,23,0.06)] hover:border-[#C4BEB4] hover:shadow-[0_4px_12px_rgba(28,26,23,0.08)] transition-all cursor-pointer',
    clayTint: 'bg-[#FBF1E6] border border-[#F7E4D0] shadow-sm'
  }[variant];

  return (
    <div className={`rounded-xl ${paddingClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};
