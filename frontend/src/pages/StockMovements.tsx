import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { StockMovement, MovementType, PageResponse, ApiResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  History,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export const StockMovements: React.FC = () => {
  const [movementType, setMovementType] = useState<MovementType | ''>('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery<ApiResponse<PageResponse<StockMovement>>>({
    queryKey: ['stockMovements', movementType, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (movementType) params.append('movementType', movementType);
      params.append('page', page.toString());
      params.append('size', '20');

      const res = await api.get(`/inventory/movements?${params.toString()}`);
      return res.data;
    },
  });

  const pageResponse = data?.data;
  const movements = pageResponse?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Stock Movement Audit Log</h2>
          <p className="text-xs text-slate-500">
            Immutable, append-only history of every stock change, reservation, receipt, and adjustment
          </p>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter by Event:</span>
          <select
            value={movementType}
            onChange={(e) => {
              setMovementType(e.target.value as MovementType | '');
              setPage(0);
            }}
            className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 bg-white"
          >
            <option value="">All Movement Types</option>
            <option value="INITIAL_STOCK">Initial Stock Entry</option>
            <option value="PURCHASE_RECEIPT">Goods Receipt (Restock)</option>
            <option value="ORDER_RESERVED">Order Reserved</option>
            <option value="ORDER_RELEASED">Order Reservation Released</option>
            <option value="ORDER_FULFILLED">Order Delivered / Fulfilled</option>
            <option value="MANUAL_ADJUSTMENT_ADD">Manual Adjustment (+)</option>
            <option value="MANUAL_ADJUSTMENT_DEDUCT">Manual Adjustment (-)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Retrieving movement audit trail..." />
        ) : movements.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Movements Logged"
            description="No inventory movement records match the selected filter."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Timestamp (UTC)</th>
                    <th className="px-6 py-3">Product / SKU</th>
                    <th className="px-6 py-3">Movement Type</th>
                    <th className="px-6 py-3 text-center">Quantity Delta</th>
                    <th className="px-6 py-3">Reference</th>
                    <th className="px-6 py-3">Actor</th>
                    <th className="px-6 py-3">Reason / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => {
                    const isPositive = m.quantityChange > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-slate-900">{m.productName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{m.productSku}</div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {m.movementType}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            )}
                            {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          {m.referenceId ? (
                            <div>
                              <span className="font-mono text-slate-800 font-semibold">{m.referenceId}</span>
                              <div className="text-[10px] text-slate-400">{m.referenceType}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-700">
                          {m.actorUsername}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate" title={m.reason}>
                          {m.reason || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pageResponse && pageResponse.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Showing {movements.length} of {pageResponse.totalElements} audit entries (Page{' '}
                  {pageResponse.pageNumber + 1} of {pageResponse.totalPages})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pageResponse.pageNumber === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pageResponse.last}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
