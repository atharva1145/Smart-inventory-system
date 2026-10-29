import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { GoodsReceipt, PageResponse, ApiResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  PackageCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Warehouse as WarehouseIcon,
  ShoppingBag,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const GoodsReceipts: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery<ApiResponse<PageResponse<GoodsReceipt>>>({
    queryKey: ['goodsReceipts', search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('size', '15');

      const res = await api.get(`/goods-receipts?${params.toString()}`);
      return res.data;
    },
  });

  const pageResponse = data?.data;
  const receipts = pageResponse?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Goods Receipts</h2>
          <p className="text-xs text-slate-500">
            Audit history of inbound shipments received against purchase orders
          </p>
        </div>
        <Link
          to="/purchase-orders"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm shrink-0"
        >
          <ShoppingBag className="w-4 h-4" /> View Purchase Orders
        </Link>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by receipt or PO number..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading goods receipts..." />
        ) : receipts.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="No Goods Receipts Found"
            description="Goods receipts are created when deliveries for approved purchase orders arrive at the warehouse."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Receipt Number</th>
                    <th className="px-6 py-3">Purchase Order</th>
                    <th className="px-6 py-3">Warehouse</th>
                    <th className="px-6 py-3">Items Received</th>
                    <th className="px-6 py-3">Received By</th>
                    <th className="px-6 py-3 text-right">Received At (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipts.map((gr) => (
                    <tr key={gr.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="font-mono font-bold text-primary-600">{gr.receiptNumber}</span>
                        {gr.notes && (
                          <div className="text-[10px] text-slate-400 line-clamp-1">{gr.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-mono font-medium text-slate-800">{gr.poNumber}</span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <WarehouseIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{gr.warehouseName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="space-y-1">
                          {gr.items.map((item) => (
                            <div key={item.id} className="text-slate-700 flex items-center gap-1.5">
                              <span className="font-bold text-emerald-600">+{item.quantityReceived}</span>
                              <span>{item.productName}</span>
                              <span className="text-[10px] font-mono text-slate-400">({item.productSku})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-700">
                        {gr.receivedBy}
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-500 whitespace-nowrap">
                        {new Date(gr.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageResponse && pageResponse.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Showing {receipts.length} of {pageResponse.totalElements} receipts (Page{' '}
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
