import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Product, Category, PageResponse, ApiResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ProductFormModal } from './modals/ProductFormModal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const Products: React.FC = () => {
  const { hasRole, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [activeFilter, setActiveFilter] = useState<boolean | ''>('');
  const [page, setPage] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { data: categoriesData } = useQuery<ApiResponse<Category[]>>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  const { data: productsData, isLoading } = useQuery<ApiResponse<PageResponse<Product>>>({
    queryKey: ['products', query, categoryId, activeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (categoryId !== '') params.append('categoryId', categoryId.toString());
      if (activeFilter !== '') params.append('active', activeFilter.toString());
      params.append('page', page.toString());
      params.append('size', '15');

      const res = await api.get(`/products?${params.toString()}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryOverview'] });
      setIsDeleteOpen(false);
      setProductToDelete(null);
    },
  });

  const categories = categoriesData?.data || [];
  const pageResponse = productsData?.data;
  const products = pageResponse?.content || [];

  const handleEdit = (p: Product) => {
    setProductToEdit(p);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setProductToEdit(null);
    setIsFormOpen(true);
  };

  const handleDeletePrompt = (p: Product) => {
    setProductToDelete(p);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product Catalog</h2>
          <p className="text-xs text-slate-500">
            Manage product items, SKU identifiers, cost/selling margins, and stock thresholds
          </p>
        </div>
        {hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search by SKU or product name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value ? Number(e.target.value) : '');
                setPage(0);
              }}
              className="py-2 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={activeFilter === '' ? '' : activeFilter ? 'true' : 'false'}
            onChange={(e) => {
              const val = e.target.value;
              setActiveFilter(val === '' ? '' : val === 'true');
              setPage(0);
            }}
            className="py-2 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading products catalog..." />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No Products Found"
            description="No products match your search or filter criteria. Create a new product to get started."
            actionText="Add Product"
            onAction={handleCreate}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Product / SKU</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3 text-right">Cost</th>
                    <th className="px-6 py-3 text-right">Selling</th>
                    <th className="px-6 py-3 text-center">Available Stock</th>
                    <th className="px-6 py-3 text-center">Reorder Lvl</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const avail = p.availableQuantity ?? 0;
                    const isLow = avail <= p.reorderLevel;
                    const isOut = avail <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{p.sku}</div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {p.categoryName || <span className="text-slate-400">Uncategorized</span>}
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium text-slate-600">
                          ${p.costPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                          ${p.sellingPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1 font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                isOut
                                  ? 'bg-rose-50 text-rose-700 font-bold'
                                  : isLow
                                  ? 'bg-amber-50 text-amber-700 font-bold'
                                  : 'text-slate-700'
                              }`}
                            >
                              {avail} {p.unitOfMeasure}
                            </span>
                            {isLow && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            OnHand: {p.onHandQuantity ?? 0} | Res: {p.reservedQuantity ?? 0}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center text-slate-500 font-medium">
                          {p.reorderLevel}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <Badge status={p.active ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
                              <button
                                onClick={() => handleEdit(p)}
                                title="Edit Product"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleDeletePrompt(p)}
                                title="Deactivate / Delete"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pageResponse && pageResponse.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Showing {products.length} of {pageResponse.totalElements} products (Page{' '}
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

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productToEdit={productToEdit}
      />

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => productToDelete && deleteMutation.mutate(productToDelete.id)}
        title="Deactivate Product"
        message={`Are you sure you want to deactivate or remove "${productToDelete?.name}" (${productToDelete?.sku})? If historical stock movements exist, the product will be safely marked inactive.`}
        confirmText="Confirm Deactivation"
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
