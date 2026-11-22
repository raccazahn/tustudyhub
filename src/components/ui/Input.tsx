/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Input & Form Controls
 * Accessible forms with Kaolin borders and Clay focus accents.
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F]">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#726B62]">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full min-h-[44px] px-3.5 py-2 text-sm bg-white text-[#1C1A17] rounded-lg border transition-colors
            ${leftIcon ? 'pl-10' : ''}
            ${error ? 'border-[#B91C1C] focus:ring-[#B91C1C]' : 'border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-[#8A3E12]'}
            focus:outline-none focus:ring-1
            disabled:bg-[#EDE9E2] disabled:cursor-not-allowed
            placeholder:text-[#726B62]
            ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-[#B91C1C] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#726B62]">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 3,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        ref={ref}
        rows={rows}
        className={`w-full px-3.5 py-2 text-sm bg-white text-[#1C1A17] rounded-lg border transition-colors
          ${error ? 'border-[#B91C1C] focus:ring-[#B91C1C]' : 'border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-[#8A3E12]'}
          focus:outline-none focus:ring-1
          disabled:bg-[#EDE9E2] disabled:cursor-not-allowed
          placeholder:text-[#726B62]
          ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-[#B91C1C] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#726B62]">{helperText}</p>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';
