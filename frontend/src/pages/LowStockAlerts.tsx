import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '../services/api';
import { InventoryOverview, RestockSuggestion, ApiResponse, PurchaseOrder } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { AlertTriangle, ShoppingBag, CheckCircle2, Sparkles, ArrowRight, DollarSign, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LowStockAlerts: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [successPo, setSuccessPo] = useState<PurchaseOrder | null>(null);
  const [restockError, setRestockError] = useState<string | null>(null);

  const canManagePo = hasRole(['ADMIN', 'INVENTORY_MANAGER']);

  const { data, isLoading } = useQuery<ApiResponse<InventoryOverview[]>>({
    queryKey: ['lowStockAlerts'],
    queryFn: async () => {
      const res = await api.get('/inventory/alerts/low-stock');
      return res.data;
    },
    refetchInterval: 20000,
  });

  const { data: suggestionsData } = useQuery<ApiResponse<RestockSuggestion[]>>({
    queryKey: ['restockSuggestions'],
    queryFn: async () => {
      const res = await api.get('/inventory/restock-suggestions');
      return res.data;
    },
  });

  const autoReorderMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      const res = await api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/auto-reorder?supplierId=${supplierId}`);
      return res.data.data;
    },
    onSuccess: (createdPo) => {
      setSuccessPo(createdPo);
      setRestockError(null);
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
    },
    onError: (err) => {
      setRestockError(getErrorMessage(err));
    },
  });

  const alerts = data?.data || [];
  const suggestions = suggestionsData?.data || [];
  const totalReplenishmentCost = suggestions.reduce((acc, s) => acc + (s.estimatedCost || 0), 0);
  const defaultSupplierId = suggestions.find((s) => s.suggestedSupplierId)?.suggestedSupplierId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Low Stock & Out-of-Stock Alerts</h2>
          <p className="text-xs text-slate-500">
            Automated alerts triggered when available quantity drops below configured reorder levels
          </p>
        </div>
        <Link
          to="/purchase-orders"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm shrink-0"
        >
          <ShoppingBag className="w-4 h-4" /> Go to Purchase Orders
        </Link>
      </div>

      {/* Smart Restock Recommendation Banner */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-primary-700">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-200 border border-primary-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Smart Reorder Assistant
            </div>
            <h3 className="text-lg font-bold">
              {suggestions.length} items require replenishment across warehouses
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Based on historical thresholds and lead safety buffers, an estimated{' '}
              <span className="font-bold text-white font-mono">
                ${totalReplenishmentCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>{' '}
              in purchase orders will restore healthy inventory levels.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            {canManagePo && defaultSupplierId && (
              <button
                type="button"
                disabled={autoReorderMutation.isPending}
                onClick={() => autoReorderMutation.mutate(defaultSupplierId)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wide shadow-lg shadow-amber-400/20 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-slate-900" />
                {autoReorderMutation.isPending ? 'Generating Order...' : '1-Click Generate Draft PO'}
              </button>
            )}
            <Link
              to="/purchase-orders"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur transition"
            >
              Manual PO <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Success / Error notification for 1-click PO */}
      {successPo && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              Draft restock Purchase Order <strong>{successPo.poNumber}</strong> created successfully with {successPo.items?.length || 0} line items.
            </span>
          </div>
          <Link
            to="/purchase-orders"
            className="font-bold underline hover:text-emerald-950"
          >
            Review & Approve PO →
          </Link>
        </div>
      )}

      {restockError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          {restockError}
        </div>
      )}

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Scanning stock threshold invariants..." />
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All Stock Levels Healthy"
            description="No products are currently below their reorder threshold or out of stock."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3">Product / SKU</th>
                  <th className="px-6 py-3">Warehouse</th>
                  <th className="px-6 py-3 text-center">Available Stock</th>
                  <th className="px-6 py-3 text-center">Reorder Threshold</th>
                  <th className="px-6 py-3 text-center">Deficit Units</th>
                  <th className="px-6 py-3 text-center">Severity</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((item) => {
                  const deficit = Math.max(0, item.reorderLevel - item.availableQuantity);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.productSku}</div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 font-medium">
                        {item.warehouseName}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full ${
                            item.outOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {item.availableQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center font-medium text-slate-600">
                        {item.reorderLevel}
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold text-rose-600">
                        +{deficit} units needed
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {item.outOfStock ? (
                          <Badge variant="danger">Depleted (0 available)</Badge>
                        ) : (
                          <Badge variant="warning">Below Reorder Level</Badge>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          to="/purchase-orders"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 font-semibold transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Restock PO
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
