/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Empty State & Skeleton Components
 */

import React from 'react';
import { Button } from './Button.tsx';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-[#DDD8CF] bg-[#F7F5F1] my-4">
      <div className="w-14 h-14 rounded-full bg-[#EDE9E2] flex items-center justify-center text-[#8A3E12] mb-4 shadow-xs">
        {icon}
      </div>
      <h4 className="text-base sm:text-lg font-bold text-[#1C1A17] mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-[#726B62] max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-white border border-[#DDD8CF] space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-[#EDE9E2] rounded-md w-1/4"></div>
            <div className="h-4 bg-[#EDE9E2] rounded-md w-16"></div>
          </div>
          <div className="h-5 bg-[#EDE9E2] rounded-md w-3/4"></div>
          <div className="h-3 bg-[#EDE9E2] rounded-md w-1/2"></div>
        </div>
      ))}
    </div>
  );
};
