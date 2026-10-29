import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Bell, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface ToastAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
}

interface SseContextType {
  toasts: ToastAlert[];
  dismissToast: (id: string) => void;
}

const SseContext = createContext<SseContextType>({
  toasts: [],
  dismissToast: () => {},
});

export const SseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Use EventSource or fetch stream with token
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/v1/notifications/stream`);

      eventSource.addEventListener('NOTIFICATION', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          const newToast: ToastAlert = {
            id: Math.random().toString(36).substring(2, 9),
            type: data.type || 'INFO',
            title: data.title || 'System Alert',
            message: data.message || '',
            timestamp: new Date().toLocaleTimeString(),
          };

          setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

          // Invalidate relevant queries so UI refreshes automatically
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
          queryClient.invalidateQueries({ queryKey: ['inventoryOverview'] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        } catch {
          // ignore malformed event
        }
      });

      eventSource.onerror = () => {
        // Silent reconnect
        eventSource?.close();
      };
    } catch {
      // EventSource fallback
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isAuthenticated, token, queryClient]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <SseContext.Provider value={{ toasts, dismissToast }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white border border-slate-200/90 shadow-xl rounded-xl p-3.5 flex items-start gap-3 animate-slide-in transition-all"
          >
            <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h5 className="text-xs font-bold text-slate-900 truncate">{toast.title}</h5>
                <span className="text-[10px] text-slate-400 font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{toast.message}</p>
            </div>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </SseContext.Provider>
  );
};

export const useSse = () => useContext(SseContext);
