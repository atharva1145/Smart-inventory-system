import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { InventoryOverview, ApiResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { AlertTriangle, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LowStockAlerts: React.FC = () => {
  const { data, isLoading } = useQuery<ApiResponse<InventoryOverview[]>>({
    queryKey: ['lowStockAlerts'],
    queryFn: async () => {
      const res = await api.get('/inventory/alerts/low-stock');
      return res.data;
    },
    refetchInterval: 20000,
  });

  const alerts = data?.data || [];

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
