import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Plus, Search, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { ApiResponse, PageResponse, StockTransfer, StockTransferStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { CreateTransferModal } from './modals/CreateTransferModal';
import { useAuth } from '../context/AuthContext';

export const StockTransfers: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockTransferStatus | ''>('');
  const [page, setPage] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';

  const { data, isLoading } = useQuery({
    queryKey: ['stock-transfers', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('size', '15');
      const res = await api.get<ApiResponse<PageResponse<StockTransfer>>>(`/stock-transfers?${params.toString()}`);
      return res.data.data;
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/stock-transfers/${id}/dispatch`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-overview'] });
      setActionError(null);
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const receiveMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/stock-transfers/${id}/receive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-overview'] });
      setActionError(null);
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/stock-transfers/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-overview'] });
      setActionError(null);
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const getStatusBadge = (status: StockTransferStatus) => {
    switch (status) {
      case 'REQUESTED':
        return <Badge variant="warning">Requested</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="info">In Transit</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Inter-warehouse stock rebalancing, dispatching, and in-transit tracking
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold uppercase rounded-lg shadow transition"
          >
            <Plus className="w-4 h-4" />
            Request Transfer
          </button>
        )}
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
          {actionError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search transfer number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StockTransferStatus | '');
            setPage(0);
          }}
          className="text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="REQUESTED">Requested</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner message="Loading stock transfers..." />
          </div>
        ) : !data?.content || data.content.length === 0 ? (
          <EmptyState
            title="No stock transfers found"
            description="Create a transfer to move inventory between fulfillment centers."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Transfer #</th>
                  <th className="px-6 py-3">Source Warehouse</th>
                  <th className="px-6 py-3">Destination</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created By</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.content.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">
                      {t.transferNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{t.sourceWarehouseName}</p>
                      <p className="text-[11px] font-mono text-gray-500">{t.sourceWarehouseCode}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{t.destinationWarehouseName}</p>
                      <p className="text-[11px] font-mono text-gray-500">{t.destinationWarehouseCode}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-800">{t.items?.length || 0} line items</span>
                      <div className="text-[11px] text-gray-500 truncate max-w-xs">
                        {t.items?.map((i) => `${i.productSku} (${i.quantity})`).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{t.createdBy}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-1.5 justify-end">
                        {canManage && t.status === 'REQUESTED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => dispatchMutation.mutate(t.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition"
                              title="Dispatch from source warehouse"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              Dispatch
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelMutation.mutate(t.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 rounded border border-red-200 transition"
                              title="Cancel transfer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </>
                        )}

                        {canManage && t.status === 'IN_TRANSIT' && (
                          <button
                            type="button"
                            onClick={() => receiveMutation.mutate(t.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-200 transition"
                            title="Confirm receipt at destination"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Receive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateTransferModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })}
      />
    </div>
  );
};
