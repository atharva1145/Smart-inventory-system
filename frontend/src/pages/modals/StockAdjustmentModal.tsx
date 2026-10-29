import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Product, Warehouse, ApiResponse } from '../../types';
import api, { getErrorMessage } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Sliders } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProductId?: number;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  defaultProductId,
}) => {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState<number | ''>(defaultProductId || '');
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [quantityChange, setQuantityChange] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: productsData } = useQuery<ApiResponse<{ content: Product[] }>>({
    queryKey: ['allProductsList'],
    queryFn: async () => {
      const res = await api.get('/products?size=100');
      return res.data;
    },
    enabled: isOpen,
  });

  const { data: warehousesData } = useQuery<ApiResponse<Warehouse[]>>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (defaultProductId) {
      setProductId(defaultProductId);
    }
    if (warehousesData?.data && warehousesData.data.length > 0 && !warehouseId) {
      setWarehouseId(warehousesData.data[0].id);
    }
  }, [defaultProductId, warehousesData, isOpen]);

  const adjustMutation = useMutation({
    mutationFn: async () => {
      return api.post('/inventory/adjust', {
        productId: Number(productId),
        warehouseId: Number(warehouseId),
        quantityChange: Number(quantityChange),
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryOverview'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      onClose();
      setQuantityChange('');
      setReason('');
      setError(null);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      setError('Adjustment reason is mandatory (minimum 5 characters)');
      return;
    }
    if (quantityChange === 0 || quantityChange === '') {
      setError('Quantity change cannot be zero');
      return;
    }
    setError(null);
    adjustMutation.mutate();
  };

  const products = productsData?.data?.content || [];
  const warehouses = warehousesData?.data || [];
  const selectedProduct = products.find((p) => p.id === Number(productId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Stock Adjustment"
      description="Record physical stock reconciliation with an immutable audit entry"
      maxWidth="md"
    >
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-center gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Target Product</label>
          <select
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
          >
            <option value="">Select a Product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) — Available: {p.availableQuantity ?? 0}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Target Warehouse</label>
          <select
            required
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
          >
            <option value="">Select Warehouse...</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Current Available Stock:</span>
            <span className="font-bold text-slate-900 text-sm">
              {selectedProduct.availableQuantity ?? 0} {selectedProduct.unitOfMeasure}
            </span>
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Quantity Change (Positive to add, Negative to deduct)
          </label>
          <div className="relative">
            <input
              type="number"
              required
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono"
              placeholder="e.g. +10 or -5"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Use positive values for found inventory or negative values for damaged/lost stock.
          </p>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Adjustment Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            placeholder="e.g. Annual warehouse physical count discrepancy reconciliation"
          />
        </div>

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
            disabled={adjustMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Sliders className="w-3.5 h-3.5" />
            {adjustMutation.isPending ? 'Recording...' : 'Apply Stock Adjustment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
