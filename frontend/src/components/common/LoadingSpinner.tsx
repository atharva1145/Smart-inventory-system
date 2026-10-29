import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
      <p className="text-sm text-slate-500 font-medium">{message}</p>
    </div>
  );
};
