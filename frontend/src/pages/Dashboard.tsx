import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { DashboardSummary, ApiResponse } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Package,
  Boxes,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  PlusCircle,
  Sliders,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery<ApiResponse<DashboardSummary>>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <LoadingSpinner message="Calculating real-time inventory and sales metrics..." />;
  }

  const summary = data?.data;

  return (
    <div className="space-y-6">
      {/* Quick Action Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Operations Control Center</h2>
          <p className="text-xs text-slate-500">Live inventory tracking & concurrency-guaranteed orders</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/orders/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> New Order
          </Link>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Sliders className="w-4 h-4" /> Adjust Stock
          </Link>
          <Link
            to="/purchase-orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Boxes className="w-4 h-4" /> Restock PO
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Active Products"
          value={summary?.totalActiveProducts || 0}
          icon={Package}
          color="primary"
          subtitle="Unique SKUs"
        />
        <StatCard
          title="Total Stock Units"
          value={summary?.totalInventoryUnits?.toLocaleString() || 0}
          icon={Boxes}
          color="indigo"
          subtitle="On-hand units"
        />
        <StatCard
          title="Valuation (Cost)"
          value={`$${summary?.inventoryValuationAtCost?.toLocaleString() || '0.00'}`}
          icon={DollarSign}
          color="emerald"
          subtitle="Cost basis"
        />
        <StatCard
          title="Low / Out of Stock"
          value={summary?.lowStockCount || 0}
          icon={AlertTriangle}
          color={summary?.lowStockCount ? 'rose' : 'primary'}
          subtitle={`${summary?.outOfStockCount || 0} depleted`}
        />
        <StatCard
          title="Orders Today"
          value={summary?.ordersToday || 0}
          icon={ShoppingCart}
          color="amber"
          subtitle={`${summary?.pendingOrders || 0} pending`}
        />
        <StatCard
          title="Delivered Revenue"
          value={`$${summary?.totalRevenue?.toLocaleString() || '0.00'}`}
          icon={TrendingUp}
          color="emerald"
          subtitle="Realized income"
        />
      </div>

      {/* Charts & Top Sellers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Sales Trend</h3>
              <p className="text-xs text-slate-500">Daily gross order volume</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Total Order Value: ${summary?.totalOrderValue?.toLocaleString()}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.salesTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0e8ee9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0e8ee9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val: number) => [`$${val.toFixed(2)}`, 'Sales']}
                  labelStyle={{ fontSize: 12, fontWeight: 'bold' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#0270c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Top-Selling Products</h3>
              <Link to="/reports" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
                Report <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {summary?.topSellingProducts && summary.topSellingProducts.length > 0 ? (
                summary.topSellingProducts.map((p, idx) => (
                  <div key={p.productId} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800 line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800">{p.unitsSold} units</span>
                      <p className="text-[10px] text-emerald-600 font-medium">${p.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">No completed sales recorded yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Recent Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Customer Orders</h3>
            <Link to="/orders" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-2">Order #</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summary?.recentOrders && summary.recentOrders.length > 0 ? (
                  summary.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-semibold text-primary-600">
                        <Link to="/orders">{ord.orderNumber}</Link>
                      </td>
                      <td className="py-2.5 text-slate-700">{ord.customerName}</td>
                      <td className="py-2.5">
                        <Badge status={ord.status} size="sm" />
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900">${ord.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No orders placed yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Movements */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Inventory Movements</h3>
            <Link to="/inventory/movements" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
              Full Audit <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Movement</th>
                  <th className="pb-2 text-center">Change</th>
                  <th className="pb-2 text-right">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summary?.recentMovements && summary.recentMovements.length > 0 ? (
                  summary.recentMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5">
                        <p className="font-semibold text-slate-800 line-clamp-1">{m.productName}</p>
                        <p className="text-[10px] text-slate-400">{m.productSku}</p>
                      </td>
                      <td className="py-2.5">
                        <span className="text-[10px] font-medium text-slate-600">{m.movementType}</span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`font-bold ${
                            m.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-500 font-medium">{m.actorUsername}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No stock movements recorded yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
