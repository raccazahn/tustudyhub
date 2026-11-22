import React from 'react';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  variant = 'spinner'
}) => {
  if (variant === 'skeleton') {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-xl bg-[#EDE9E2] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-[#EDE9E2]"></div>
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-[#8A3E12] border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-xs font-semibold text-[#726B62]">{message}</p>
    </div>
  );
};
