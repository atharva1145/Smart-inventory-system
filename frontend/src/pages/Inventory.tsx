import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { InventoryOverview, PageResponse, ApiResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { StockAdjustmentModal } from './modals/StockAdjustmentModal';
import {
  Boxes,
  Sliders,
  Search,
  Filter,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(0);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [targetProductId, setTargetProductId] = useState<number | undefined>(undefined);

  const { data, isLoading } = useQuery<ApiResponse<PageResponse<InventoryOverview>>>({
    queryKey: ['inventoryOverview', search, lowStockOnly, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (lowStockOnly) params.append('lowStockOnly', 'true');
      params.append('page', page.toString());
      params.append('size', '15');

      const res = await api.get(`/inventory/overview?${params.toString()}`);
      return res.data;
    },
  });

  const pageResponse = data?.data;
  const balances = pageResponse?.content || [];

  const handleOpenAdjust = (prodId?: number) => {
    setTargetProductId(prodId);
    setIsAdjustOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Inventory Balances</h2>
          <p className="text-xs text-slate-500">
            Real-time physical on-hand, reserved orders, and available stock levels
          </p>
        </div>
        {hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
          <button
            onClick={() => handleOpenAdjust()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm shrink-0"
          >
            <Sliders className="w-4 h-4" /> Manual Adjustment
          </button>
        )}
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search SKU or product..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(0);
              }}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
            />
            <span>Show Low Stock & Out-of-Stock Only</span>
          </label>
        </div>
      </div>

      {/* Balances Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading stock balances..." />
        ) : balances.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No Inventory Balances Found"
            description="No inventory items match the current query. Try adjusting your filters or create a product."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Product / SKU</th>
                    <th className="px-6 py-3">Warehouse</th>
                    <th className="px-6 py-3 text-center">On-Hand</th>
                    <th className="px-6 py-3 text-center">Reserved</th>
                    <th className="px-6 py-3 text-center">Available</th>
                    <th className="px-6 py-3 text-center">Reorder Threshold</th>
                    <th className="px-6 py-3 text-right">Valuation (Cost)</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    {hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
                      <th className="px-6 py-3 text-right">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balances.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900">{b.productName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{b.productSku}</div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 font-medium">
                        {b.warehouseName}
                      </td>
                      <td className="px-6 py-3.5 text-center font-semibold text-slate-800">
                        {b.onHandQuantity}
                      </td>
                      <td className="px-6 py-3.5 text-center text-slate-500">
                        {b.reservedQuantity}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full ${
                            b.outOfStock
                              ? 'bg-rose-50 text-rose-700'
                              : b.lowStock
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {b.availableQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center text-slate-500">
                        {b.reorderLevel}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                        ${b.totalValueAtCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {b.outOfStock ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : b.lowStock ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">Normal</Badge>
                        )}
                      </td>
                      {hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenAdjust(b.productId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-primary-600 hover:bg-primary-50 border border-slate-200 transition-colors"
                          >
                            <Sliders className="w-3 h-3" /> Adjust
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageResponse && pageResponse.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Showing {balances.length} of {pageResponse.totalElements} records (Page{' '}
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

      <StockAdjustmentModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        defaultProductId={targetProductId}
      />
    </div>
  );
};
