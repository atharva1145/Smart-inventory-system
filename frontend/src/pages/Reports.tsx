import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ValuationReportDTO, DashboardSummary, RestockSuggestion, ApiResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatCard } from '../components/common/StatCard';
import {
  BarChart3,
  DollarSign,
  Boxes,
  TrendingUp,
  Printer,
  Calendar,
  Percent,
  Clock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

  const { data: restockData } = useQuery<ApiResponse<RestockSuggestion[]>>({
    queryKey: ['restockSuggestions'],
    queryFn: async () => {
      const res = await api.get('/inventory/restock-suggestions');
      return res.data;
    },
  });

  if (isValLoading || isDashLoading) {
    return <LoadingSpinner message="Generating real-time business valuation report..." />;
  }

  const valReport = valuationData?.data;
  const dashSummary = dashboardData?.data;
  const restockSuggestions = restockData?.data || [];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Valuation (Cost Basis)"
          value={`$${valReport?.totalValuationAtCost?.toLocaleString() || '0.00'}`}
          icon={DollarSign}
          color="emerald"
          subtitle="Physical inventory cost basis"
        />
        <StatCard
          title="Total Retail Value (Gross)"
          value={`$${valReport?.totalRetailValue?.toLocaleString() || '0.00'}`}
          icon={TrendingUp}
          color="indigo"
          subtitle="Selling potential of on-hand units"
        />
        <StatCard
          title="Potential Gross Margin"
          value={
            valReport?.averageGrossMarginPercent != null
              ? `${valReport.averageGrossMarginPercent.toFixed(1)}%`
              : '0.0%'
          }
          icon={Percent}
          color="primary"
          subtitle={`+$${valReport?.totalPotentialGrossProfit?.toLocaleString() || '0.00'} projected profit`}
        />
        <StatCard
          title="Total Units On-Hand"
          value={valReport?.totalOnHandUnits?.toLocaleString() || 0}
          icon={Boxes}
          color="amber"
          subtitle="Across all active warehouses"
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
          color="purple"
          subtitle="Active pipeline & confirmed orders"
        />
      </div>

      {/* Stock Burn-Rate & Stockout Forecaster Card */}
      {restockSuggestions.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Stock Burn-Rate & Depletion Risk Forecaster
              </h3>
              <p className="text-xs text-slate-500">
                Predictive run-out timelines based on consumption velocity and reorder safety thresholds
              </p>
            </div>
            <Link
              to="/inventory/alerts"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <span>Smart Restock Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Product / SKU</th>
                  <th className="px-4 py-2.5 text-center">Available Stock</th>
                  <th className="px-4 py-2.5 text-center">Reorder Safety Level</th>
                  <th className="px-4 py-2.5 text-center">Est. Daily Burn Rate</th>
                  <th className="px-4 py-2.5 text-center">Days Until Depletion</th>
                  <th className="px-4 py-2.5 text-right">Risk Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {restockSuggestions.map((item) => {
                  const days = item.daysUntilStockout ?? 0;
                  const isOut = item.currentAvailable <= 0;
                  const isCritical = days <= 5 || isOut;

                  return (
                    <tr key={item.productId} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">
                        {item.currentAvailable} units
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {item.reorderLevel} units
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-medium text-slate-600">
                        {item.dailyBurnRate ? `${item.dailyBurnRate.toFixed(1)} / day` : '1.0 / day'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isCritical
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isOut ? 'Depleted (0 Days)' : `~${days} Days Remaining`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isOut
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isCritical
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {isOut ? 'STOCKOUT' : isCritical ? 'CRITICAL RISK' : 'MODERATE RISK'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
            <h3 className="font-bold text-sm text-slate-900">Stock Valuation & Profit Margin Breakdown</h3>
            <p className="text-xs text-slate-500">Unit cost basis vs. retail selling potential and projected gross profit margins</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg font-mono">
              Cost: ${valReport?.totalValuationAtCost?.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-mono">
              Retail: ${valReport?.totalRetailValue?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3">Product / SKU</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-center">On-Hand Units</th>
                <th className="px-6 py-3 text-right">Unit Cost</th>
                <th className="px-6 py-3 text-right">Selling Price</th>
                <th className="px-6 py-3 text-right">Total Cost Basis</th>
                <th className="px-6 py-3 text-right">Projected Retail Value</th>
                <th className="px-6 py-3 text-right">Gross Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {valReport?.items && valReport.items.length > 0 ? (
                valReport.items.map((item) => {
                  const margin = item.grossMarginPercent ?? 0;
                  return (
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
                      <td className="px-6 py-3.5 text-right font-medium text-slate-900 font-mono">
                        ${(item.sellingPrice ?? 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-slate-700 font-mono">
                        ${item.totalCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-900 font-mono">
                        ${(item.totalRetailValue ?? item.totalCost).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            margin >= 40
                              ? 'bg-emerald-50 text-emerald-700'
                              : margin >= 20
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No inventory balances recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
