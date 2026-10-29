import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Order, OrderStatus, ApiResponse } from '../../types';
import api, { getErrorMessage } from '../../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../components/common/Badge';
import {
  Printer,
  CheckCircle,
  Clock,
  Truck,
  Package,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
} from 'lucide-react';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const transitionMutation = useMutation({
    mutationFn: async ({ status, comment }: { status: OrderStatus; comment?: string }) => {
      return api.patch(`/orders/${order.id}/status`, { newStatus: status, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryOverview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      onClose();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Invoice & Lifecycle — ${order.orderNumber}`}
      description={`Created on ${new Date(order.createdAt).toLocaleString()} by ${order.createdBy}`}
      maxWidth="4xl"
    >
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-center gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6 text-xs" id="printable-content">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Customer Information
            </span>
            <h4 className="text-sm font-bold text-slate-900 mt-1">{order.customerName}</h4>
            <div className="text-slate-500 mt-0.5 space-y-0.5">
              {order.customerEmail && <p>Email: {order.customerEmail}</p>}
              {order.customerPhone && <p>Phone: {order.customerPhone}</p>}
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Order Status
            </span>
            <div className="flex sm:justify-end items-center gap-2">
              <Badge status={order.status} size="md" />
              <span className="font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Payment: {order.paymentStatus}
              </span>
            </div>
            {order.idempotencyKey && (
              <p className="text-[10px] font-mono text-slate-400">Key: {order.idempotencyKey}</p>
            )}
          </div>
        </div>

        {/* Action Transitions Ribbon (Non-printable) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 print:hidden">
          <span className="font-semibold text-slate-700">Lifecycle Transitions:</span>
          <div className="flex flex-wrap items-center gap-2">
            {order.status === 'PENDING' && (
              <button
                onClick={() =>
                  transitionMutation.mutate({
                    status: 'CONFIRMED',
                    comment: 'Order confirmed and approved for packing',
                  })
                }
                disabled={transitionMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white bg-primary-600 hover:bg-primary-700 font-semibold"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Confirm Order
              </button>
            )}

            {order.status === 'CONFIRMED' && (
              <button
                onClick={() =>
                  transitionMutation.mutate({
                    status: 'PROCESSING',
                    comment: 'Items gathered in warehouse',
                  })
                }
                disabled={transitionMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white bg-sky-600 hover:bg-sky-700 font-semibold"
              >
                <Package className="w-3.5 h-3.5" /> Start Processing
              </button>
            )}

            {order.status === 'PROCESSING' && (
              <button
                onClick={() =>
                  transitionMutation.mutate({
                    status: 'SHIPPED',
                    comment: 'Order dispatched with courier',
                  })
                }
                disabled={transitionMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold"
              >
                <Truck className="w-3.5 h-3.5" /> Mark Shipped
              </button>
            )}

            {order.status === 'SHIPPED' && (
              <button
                onClick={() =>
                  transitionMutation.mutate({
                    status: 'DELIVERED',
                    comment: 'Delivered to customer. Reserved stock fulfilled.',
                  })
                }
                disabled={transitionMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 font-semibold"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Complete & Deliver (Fulfill Stock)
              </button>
            )}

            {(order.status === 'PENDING' ||
              order.status === 'CONFIRMED' ||
              order.status === 'PROCESSING') && (
              <button
                onClick={() =>
                  transitionMutation.mutate({
                    status: 'CANCELLED',
                    comment: 'Order cancelled. Reserved inventory released.',
                  })
                }
                disabled={transitionMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel Order (Release Stock)
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold"
            >
              <Printer className="w-3.5 h-3.5" /> Print Summary
            </button>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Item / SKU</th>
                <th className="px-4 py-3 text-center">Quantity</th>
                <th className="px-4 py-3 text-right">Unit Price (Snapshot)</th>
                <th className="px-4 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{item.productName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{item.productSku}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 font-mono">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                    ${item.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 border-t border-slate-100 pt-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-semibold">-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Final Total:</span>
              <span className="text-primary-600">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order Status History Timeline */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs">Lifecycle Audit Timeline</h4>
            <div className="space-y-2 border-l-2 border-slate-200 pl-4 ml-2">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary-600 ring-4 ring-white" />
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{h.newStatus}</span>
                    <span className="text-[10px] text-slate-400">by {h.actorUsername}</span>
                    <span className="text-[10px] text-slate-400">
                      • {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {h.comment && <p className="text-xs text-slate-600 mt-0.5">{h.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
