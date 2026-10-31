import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Product, Category, ApiResponse } from '../../types';
import api, { getErrorMessage } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const queryClient = useQueryClient();
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [reorderLevel, setReorderLevel] = useState<number>(10);
  const [unitOfMeasure, setUnitOfMeasure] = useState('UNIT');
  const [initialStock, setInitialStock] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState('');
  const [binLocation, setBinLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: categoriesData } = useQuery<ApiResponse<Category[]>>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setName(productToEdit.name);
      setDescription(productToEdit.description || '');
      setCategoryId(productToEdit.categoryId || '');
      setCostPrice(productToEdit.costPrice);
      setSellingPrice(productToEdit.sellingPrice);
      setReorderLevel(productToEdit.reorderLevel);
      setUnitOfMeasure(productToEdit.unitOfMeasure);
      setImageUrl(productToEdit.imageUrl || '');
      setBinLocation(productToEdit.binLocation || '');
    } else {
      setSku('');
      setName('');
      setDescription('');
      setCategoryId('');
      setCostPrice('');
      setSellingPrice('');
      setReorderLevel(10);
      setUnitOfMeasure('UNIT');
      setInitialStock(0);
      setImageUrl('');
      setBinLocation('');
    }
    setError(null);
  }, [productToEdit, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (productToEdit) {
        return api.put(`/products/${productToEdit.id}`, {
          name,
          description,
          categoryId: categoryId === '' ? null : categoryId,
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          reorderLevel: Number(reorderLevel),
          unitOfMeasure,
          imageUrl: imageUrl || undefined,
          binLocation: binLocation || undefined,
        });
      } else {
        return api.post('/products', {
          sku,
          name,
          description,
          categoryId: categoryId === '' ? null : categoryId,
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          reorderLevel: Number(reorderLevel),
          unitOfMeasure,
          initialStock: Number(initialStock),
          imageUrl: imageUrl || undefined,
          binLocation: binLocation || undefined,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryOverview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      onClose();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    saveMutation.mutate();
  };

  const categories = categoriesData?.data || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Edit Product' : 'Add New Product'}
      description="Manage product details, pricing snapshots, and reorder alerts"
      maxWidth="xl"
    >
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-center gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">SKU (Unique)</label>
            <input
              type="text"
              required
              disabled={!!productToEdit}
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-100 uppercase"
              placeholder="e.g. SKU-1001"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="e.g. Industrial Barcode Scanner"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Product Image URL (Optional)</label>
          <div className="flex items-center gap-3">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="https://example.com/images/product.jpg"
            />
            {imageUrl && (
              <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            placeholder="Product specifications and physical characteristics"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
            >
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
            <input
              type="text"
              required
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="e.g. UNIT, BOX, PACK, KG"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Warehouse Bin / Shelf Location</label>
          <input
            type="text"
            value={binLocation}
            onChange={(e) => setBinLocation(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 font-mono uppercase focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            placeholder="e.g. A-03-S2-B12 (Aisle 3, Shelf 2, Bin 12)"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cost Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Selling Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reorder Level</label>
            <input
              type="number"
              min="0"
              required
              value={reorderLevel}
              onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="10"
            />
          </div>
        </div>

        {!productToEdit && (
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
            <label className="block font-semibold text-slate-700 mb-1">
              Initial Stock Entry (Default Warehouse)
            </label>
            <input
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
              placeholder="0"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Initial stock will automatically create an immutable INITIAL_STOCK movement record.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : productToEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
