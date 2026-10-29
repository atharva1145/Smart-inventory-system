import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { downloadCsv } from '../services/api';
import { Order, OrderStatus, PageResponse, ApiResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { OrderDetailModal } from './modals/OrderDetailModal';
import { InvoiceModal } from '../components/orders/InvoiceModal';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Orders: React.FC = () => {
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const { data, isLoading } = useQuery<ApiResponse<PageResponse<Order>>>({
    queryKey: ['orders', search, status, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      params.append('page', page.toString());
      params.append('size', '15');

      const res = await api.get(`/orders?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 15000,
  });

  const pageResponse = data?.data;
  const orders = pageResponse?.content || [];

  const handleOpenDetail = (o: Order) => {
    setSelectedOrder(o);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Orders</h2>
          <p className="text-xs text-slate-500">
            Lifecycle: Pending → Confirmed → Processing → Shipped → Delivered (or Cancelled)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadCsv('/orders/export/csv', `orders_${new Date().toISOString().slice(0, 10)}.csv`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          {hasRole(['ADMIN', 'SALES_STAFF', 'INVENTORY_MANAGER']) && (
            <Link
              to="/orders/create"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" /> Create Order
            </Link>
          )}
        </div>
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
            placeholder="Search by order # or customer..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | '');
            setPage(0);
          }}
          className="py-2 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 bg-white"
        >
          <option value="">All Order Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading customer orders..." />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No Orders Found"
            description="Create an order with customer and line items to initiate processing."
            actionText="Create New Order"
            onAction={() => (window.location.href = '/orders/create')}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Order Number</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Items Count</th>
                    <th className="px-6 py-3 text-right">Total Amount</th>
                    <th className="px-6 py-3 text-center">Order Status</th>
                    <th className="px-6 py-3 text-center">Payment</th>
                    <th className="px-6 py-3 text-right">Created At</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((ord) => (
                    <tr
                      key={ord.id}
                      onClick={() => handleOpenDetail(ord)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-mono font-bold text-primary-600">{ord.orderNumber}</span>
                        <div className="text-[10px] text-slate-400">By {ord.createdBy}</div>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-900">
                        {ord.customerName}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {ord.items?.length || 0} line items
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-900 font-mono">
                        ${ord.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <Badge status={ord.status} size="sm" />
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <Badge status={ord.paymentStatus} size="sm" />
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-500 whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              setInvoiceOrder(ord);
                              setIsInvoiceOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
                            title="Print Invoice / Packing Slip"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print
                          </button>
                          <button
                            onClick={() => handleOpenDetail(ord)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-primary-600 hover:bg-primary-50 transition-colors border border-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageResponse && pageResponse.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Showing {orders.length} of {pageResponse.totalElements} orders (Page{' '}
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

      {selectedOrder && (
        <OrderDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
        />
      )}

      {invoiceOrder && (
        <InvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => {
            setIsInvoiceOpen(false);
            setInvoiceOrder(null);
          }}
          order={invoiceOrder}
        />
      )}
    </div>
  );
};
