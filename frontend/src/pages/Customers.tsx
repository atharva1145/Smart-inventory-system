import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Customer, PageResponse, ApiResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { CreateCustomerModal } from './modals/CreateCustomerModal';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const Customers: React.FC = () => {
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const [isOpen, setIsOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery<ApiResponse<PageResponse<Customer>>>({
    queryKey: ['customers', search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('size', '15');

      const res = await api.get(`/customers?${params.toString()}`);
      return res.data;
    },
  });

  const pageResponse = data?.data;
  const customers = pageResponse?.content || [];

  const handleOpenCreate = () => {
    setCustomerToEdit(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setCustomerToEdit(c);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h2>
          <p className="text-xs text-slate-500">
            Customer contact information, shipping destinations, and order accounts
          </p>
        </div>
        {hasRole(['ADMIN', 'SALES_STAFF', 'INVENTORY_MANAGER']) && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Customer
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
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading customer directory..." />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Customers Found"
            description="Create your first customer account to begin generating orders."
            actionText="Add Customer"
            onAction={handleOpenCreate}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Customer Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Address</th>
                    <th className="px-6 py-3 text-right">Created</th>
                    {hasRole(['ADMIN', 'SALES_STAFF', 'INVENTORY_MANAGER']) && (
                      <th className="px-6 py-3 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-900">
                        {c.name}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {c.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.email}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {c.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.phone}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate">
                        {c.address ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      {hasRole(['ADMIN', 'SALES_STAFF', 'INVENTORY_MANAGER']) && (
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Edit Customer"
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
                  Showing {customers.length} of {pageResponse.totalElements} customers (Page{' '}
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

      <CreateCustomerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        customerToEdit={customerToEdit}
      />
    </div>
  );
};
