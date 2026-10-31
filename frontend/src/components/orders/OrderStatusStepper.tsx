import React from 'react';
import { Order, OrderStatus } from '../../types';
import {
  FileEdit,
  Clock,
  CheckCircle2,
  PackageCheck,
  Truck,
  CheckCheck,
  XCircle,
} from 'lucide-react';

interface OrderStatusStepperProps {
  order: Order;
}

const STEPS: { status: OrderStatus; label: string; icon: React.FC<{ className?: string }> }[] = [
  { status: 'DRAFT', label: 'Drafted', icon: FileEdit },
  { status: 'PENDING', label: 'Pending', icon: Clock },
  { status: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'PROCESSING', label: 'Processing', icon: PackageCheck },
  { status: 'SHIPPED', label: 'Shipped', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', icon: CheckCheck },
];

const ORDER_FLOW: OrderStatus[] = ['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({ order }) => {
  const isCancelled = order.status === 'CANCELLED';
  const history = order.statusHistory || [];

  // Find index of current status in flow
  const currentIdx = ORDER_FLOW.indexOf(order.status);

  // Helper to find history event for status
  const getHistoryFor = (st: OrderStatus) => {
    return history.find((h) => h.newStatus === st);
  };

  const cancelEvent = isCancelled ? history.find((h) => h.newStatus === 'CANCELLED') : null;

  return (
    <div className="w-full bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
      {isCancelled ? (
        <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Order Cancelled & Stock Released</span>
            {cancelEvent && (
              <p className="text-[11px] text-rose-600 mt-0.5">
                Cancelled by <span className="font-semibold">{cancelEvent.actorUsername}</span> on{' '}
                {new Date(cancelEvent.createdAt).toLocaleString()}
                {cancelEvent.comment ? ` — "${cancelEvent.comment}"` : ''}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Track line behind steps */}
          <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-2 relative z-10">
            {STEPS.map((step, idx) => {
              const isPast = currentIdx > idx;
              const isCurrent = currentIdx === idx;
              const historyItem = getHistoryFor(step.status);
              const Icon = step.icon;

              let iconBg = 'bg-white border-slate-200 text-slate-400';
              if (isPast) {
                iconBg = 'bg-primary-600 border-primary-600 text-white';
              } else if (isCurrent) {
                iconBg = 'bg-primary-50 border-primary-600 text-primary-600 ring-4 ring-primary-500/20';
              }

              return (
                <div key={step.status} className="flex flex-col items-center text-center">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${iconBg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`mt-1.5 text-[11px] font-bold ${
                      isCurrent ? 'text-primary-600' : isPast ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  {historyItem ? (
                    <div className="mt-0.5 text-[10px] text-slate-400 leading-tight">
                      <p>{new Date(historyItem.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                      <p>{new Date(historyItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ) : isCurrent ? (
                    <span className="mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-primary-100 text-primary-700">
                      Active
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
