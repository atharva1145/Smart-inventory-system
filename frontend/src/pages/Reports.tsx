import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ValuationReportDTO, DashboardSummary, ApiResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatCard } from '../components/common/StatCard';
import {
  BarChart3,
  DollarSign,
  Boxes,
  Package,
  TrendingUp,
  Printer,
  Calendar,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { data: valuationData, isLoading: isValLoading } = useQuery<ApiResponse<ValuationReportDTO>>({
    queryKey: ['valuationReport'],
    queryFn: async () => {
      const res = await api.get('/inventory/valuation');
      return res.data;
    },
  });

  const { data: dashboardData, isLoading: isDashLoading } = useQuery<ApiResponse<DashboardSummary>>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data;
    },
  });

  if (isValLoading || isDashLoading) {
    return <LoadingSpinner message="Generating real-time business valuation report..." />;
  }

  const valReport = valuationData?.data;
  const dashSummary = dashboardData?.data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="printable-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial & Inventory Reports</h2>
          <p className="text-xs text-slate-500">
            Valuation at cost basis, realized revenue, order volume, and top-performing merchandise
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm shrink-0 print:hidden"
        >
          <Printer className="w-4 h-4" /> Print / Export Report
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Valuation (Cost Basis)"
          value={`$${valReport?.totalValuationAtCost?.toLocaleString() || '0.00'}`}
          icon={DollarSign}
          color="emerald"
          subtitle="Physical inventory cost"
        />
        <StatCard
          title="Total Units On-Hand"
          value={valReport?.totalOnHandUnits?.toLocaleString() || 0}
          icon={Boxes}
          color="indigo"
          subtitle="Warehouse inventory"
        />
        <StatCard
          title="Realized Revenue (Delivered)"
          value={`$${dashSummary?.totalRevenue?.toLocaleString() || '0.00'}`}
          icon={TrendingUp}
          color="emerald"
          subtitle="Completed customer orders"
        />
        <StatCard
          title="Total Order Value (Booked)"
          value={`$${dashSummary?.totalOrderValue?.toLocaleString() || '0.00'}`}
          icon={BarChart3}
          color="primary"
          subtitle="Non-cancelled orders"
        />
      </div>

      {/* Top Performing Merchandise */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Top Performing Products (All-Time)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Rank</th>
                <th className="px-4 py-2.5">Product / SKU</th>
                <th className="px-4 py-2.5 text-center">Units Sold</th>
                <th className="px-4 py-2.5 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashSummary?.topSellingProducts && dashSummary.topSellingProducts.length > 0 ? (
                dashSummary.topSellingProducts.map((p, idx) => (
                  <tr key={p.productId} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-500">#{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {p.unitsSold} units
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 font-mono">
                      ${p.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">No sales transactions completed yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Valuation Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Stock Valuation at Cost Detail</h3>
            <p className="text-xs text-slate-500">Breakdown of on-hand physical stock multiplied by product unit cost</p>
          </div>
          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg">
            Total Cost Value: ${valReport?.totalValuationAtCost?.toFixed(2)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3">Product / SKU</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-center">On-Hand Stock</th>
                <th className="px-6 py-3 text-right">Unit Cost Price</th>
                <th className="px-6 py-3 text-right">Total Cost Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {valReport?.items && valReport.items.length > 0 ? (
                valReport.items.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-medium">
                      {item.categoryName}
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold text-slate-900">
                      {item.onHand}
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-600 font-mono">
                      ${item.unitCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900 font-mono">
                      ${item.totalCost.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No inventory balances recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
