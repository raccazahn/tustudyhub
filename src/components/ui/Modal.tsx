/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Modal Component
 * Accessible dialog with Clay/Kaolin backdrop and smooth entrance.
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1C1A17]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${maxWidthClasses} bg-white rounded-2xl border border-[#DDD8CF] shadow-[0_12px_36px_rgba(28,26,23,0.18)] z-10 overflow-hidden my-auto`}
      >
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[#EDE9E2] flex items-center justify-between bg-[#F7F5F1]">
          <div>
            <h3 id="modal-title" className="text-lg font-bold text-[#1C1A17]">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-[#726B62] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-[#726B62] hover:text-[#1C1A17] hover:bg-[#EDE9E2] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
