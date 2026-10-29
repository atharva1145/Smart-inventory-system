import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { PurchaseOrder, PurchaseOrderStatus, PageResponse, ApiResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { CreatePurchaseOrderModal } from './modals/CreatePurchaseOrderModal';
import { RecordGoodsReceiptModal } from './modals/RecordGoodsReceiptModal';
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  PackageCheck,
  ChevronDown,
  ChevronRight,
  Calendar,
  DollarSign,
  ChevronLeft,
} from 'lucide-react';

export const PurchaseOrders: React.FC = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('');
  const [page, setPage] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [expandedPoId, setExpandedPoId] = useState<number | null>(null);

  const { data, isLoading } = useQuery<ApiResponse<PageResponse<PurchaseOrder>>>({
    queryKey: ['purchaseOrders', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('size', '15');

      const res = await api.get(`/purchase-orders?${params.toString()}`);
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/purchase-orders/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/purchase-orders/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });

  const pageResponse = data?.data;
  const purchaseOrders = pageResponse?.content || [];

  const handleOpenReceipt = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsReceiptOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders</h2>
          <p className="text-xs text-slate-500">
            Track procurement lifecycle: Draft → Approved → Partially Received → Received
          </p>
        </div>
        {hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Purchase Order
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
            placeholder="Search by PO number or supplier..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as PurchaseOrderStatus | '');
            setPage(0);
          }}
          className="py-2 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 bg-white"
        >
          <option value="">All PO Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="APPROVED">APPROVED</option>
          <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
          <option value="RECEIVED">RECEIVED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading purchase orders..." />
        ) : purchaseOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No Purchase Orders Found"
            description="Create a purchase order to initiate supplier restocking."
            actionText="Create Purchase Order"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3 w-10"></th>
                    <th className="px-6 py-3">PO Number</th>
                    <th className="px-6 py-3">Supplier</th>
                    <th className="px-6 py-3">Expected Date</th>
                    <th className="px-6 py-3 text-right">Total Cost</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.map((po) => {
                    const isExpanded = expandedPoId === po.id;
                    return (
                      <React.Fragment key={po.id}>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <button
                              onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="font-mono font-bold text-slate-900">{po.poNumber}</span>
                            <div className="text-[10px] text-slate-400">Created by {po.createdBy}</div>
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-slate-800">
                            {po.supplierName}
                          </td>
                          <td className="px-6 py-3.5 text-slate-600">
                            {po.expectedDeliveryDate || '—'}
                          </td>
                          <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                            ${po.totalCost.toFixed(2)}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <Badge status={po.status} size="sm" />
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {po.status === 'DRAFT' && hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
                                <button
                                  onClick={() => approveMutation.mutate(po.id)}
                                  disabled={approveMutation.isPending}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold transition-colors"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                                </button>
                              )}

                              {(po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED') &&
                                hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
                                  <button
                                    onClick={() => handleOpenReceipt(po)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 font-semibold transition-colors"
                                  >
                                    <PackageCheck className="w-3.5 h-3.5" /> Receive Goods
                                  </button>
                                )}

                              {(po.status === 'DRAFT' || po.status === 'APPROVED') &&
                                hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
                                  <button
                                    onClick={() => cancelMutation.mutate(po.id)}
                                    disabled={cancelMutation.isPending}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Cancel
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Line Items */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={7} className="px-12 py-4">
                              <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <h4 className="font-bold text-slate-800 text-xs mb-2">
                                  Purchase Order Line Items
                                </h4>
                                <table className="w-full text-left text-xs">
                                  <thead className="border-b border-slate-100 text-slate-400 font-semibold text-[10px] uppercase">
                                    <tr>
                                      <th className="pb-1.5">Product SKU</th>
                                      <th className="pb-1.5">Product Name</th>
                                      <th className="pb-1.5 text-center">Ordered</th>
                                      <th className="pb-1.5 text-center">Received</th>
                                      <th className="pb-1.5 text-center">Outstanding</th>
                                      <th className="pb-1.5 text-right">Unit Cost</th>
                                      <th className="pb-1.5 text-right">Line Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {po.items.map((item) => (
                                      <tr key={item.id}>
                                        <td className="py-2 font-mono text-slate-600">{item.productSku}</td>
                                        <td className="py-2 font-medium text-slate-800">{item.productName}</td>
                                        <td className="py-2 text-center font-bold text-slate-900">
                                          {item.orderedQuantity}
                                        </td>
                                        <td className="py-2 text-center text-emerald-600 font-bold">
                                          {item.receivedQuantity}
                                        </td>
                                        <td className="py-2 text-center text-rose-600 font-bold">
                                          {item.outstandingQuantity}
                                        </td>
                                        <td className="py-2 text-right text-slate-600">
                                          ${item.unitCost.toFixed(2)}
                                        </td>
                                        <td className="py-2 text-right font-bold text-slate-900">
                                          ${item.totalCost.toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pageResponse && pageResponse.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Showing {purchaseOrders.length} of {pageResponse.totalElements} orders (Page{' '}
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

      <CreatePurchaseOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {selectedPO && (
        <RecordGoodsReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => {
            setIsReceiptOpen(false);
            setSelectedPO(null);
          }}
          purchaseOrder={selectedPO}
        />
      )}
    </div>
  );
};
