import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Supplier, PageResponse, ApiResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { CreateSupplierModal } from './modals/CreateSupplierModal';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const Suppliers: React.FC = () => {
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const [isOpen, setIsOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const { data, isLoading } = useQuery<ApiResponse<PageResponse<Supplier>>>({
    queryKey: ['suppliers', search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('size', '15');

      const res = await api.get(`/suppliers?${params.toString()}`);
      return res.data;
    },
  });

  const pageResponse = data?.data;
  const suppliers = pageResponse?.content || [];

  const handleOpenCreate = () => {
    setSupplierToEdit(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setSupplierToEdit(s);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Supplier Directory</h2>
          <p className="text-xs text-slate-500">
            Maintain authorized supplier contacts, procurement terms, and vendor profiles
          </p>
        </div>
        {hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        )}
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
            placeholder="Search suppliers by name or contact..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading suppliers..." />
        ) : suppliers.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No Suppliers Found"
            description="No suppliers found. Add your vendors to issue purchase orders and track goods receipts."
            actionText="Add Supplier"
            onAction={handleOpenCreate}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Supplier Name</th>
                    <th className="px-6 py-3">Contact Person</th>
                    <th className="px-6 py-3">Communication</th>
                    <th className="px-6 py-3">Address</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    {hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
                      <th className="px-6 py-3 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        {s.notes && (
                          <div className="text-[10px] text-slate-400 line-clamp-1">{s.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-700 font-medium">
                        {s.contactPerson || '—'}
                      </td>
                      <td className="px-6 py-3.5 space-y-0.5">
                        {s.email && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{s.email}</span>
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                        {!s.email && !s.phone && <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate">
                        {s.address ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{s.address}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <Badge status={s.active ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                      </td>
                      {hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
                  Showing {suppliers.length} of {pageResponse.totalElements} suppliers (Page{' '}
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

      <CreateSupplierModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        supplierToEdit={supplierToEdit}
      />
    </div>
  );
};
