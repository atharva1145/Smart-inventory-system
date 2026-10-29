import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Supplier, Product, ApiResponse } from '../../types';
import api, { getErrorMessage } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ItemRow {
  productId: number | '';
  orderedQuantity: number;
  unitCost: number;
}

export const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([
    { productId: '', orderedQuantity: 10, unitCost: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);

  const { data: suppliersData } = useQuery<ApiResponse<Supplier[]>>({
    queryKey: ['activeSuppliers'],
    queryFn: async () => {
      const res = await api.get('/suppliers/active');
      return res.data;
    },
    enabled: isOpen,
  });

  const { data: productsData } = useQuery<ApiResponse<{ content: Product[] }>>({
    queryKey: ['productsForPO'],
    queryFn: async () => {
      const res = await api.get('/products?size=100&active=true');
      return res.data;
    },
    enabled: isOpen,
  });

  const createPOMutation = useMutation({
    mutationFn: async () => {
      const validItems = items.map((i) => ({
        productId: Number(i.productId),
        orderedQuantity: Number(i.orderedQuantity),
        unitCost: Number(i.unitCost),
      }));

      return api.post('/purchase-orders', {
        supplierId: Number(supplierId),
        expectedDeliveryDate: expectedDeliveryDate || null,
        notes,
        items: validItems,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      onClose();
      setSupplierId('');
      setExpectedDeliveryDate('');
      setNotes('');
      setItems([{ productId: '', orderedQuantity: 10, unitCost: 0 }]);
      setError(null);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const handleAddItem = () => {
    setItems([...items, { productId: '', orderedQuantity: 10, unitCost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleProductChange = (index: number, pId: number) => {
    const products = productsData?.data?.content || [];
    const prod = products.find((p) => p.id === pId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: pId,
      unitCost: prod ? prod.costPrice : 0,
    };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].orderedQuantity = qty;
    setItems(updated);
  };

  const handleCostChange = (index: number, cost: number) => {
    const updated = [...items];
    updated[index].unitCost = cost;
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (items.some((i) => !i.productId || i.orderedQuantity <= 0)) {
      setError('Please ensure all items have a selected product and quantity > 0');
      return;
    }
    setError(null);
    createPOMutation.mutate();
  };

  const suppliers = suppliersData?.data || [];
  const products = productsData?.data?.content || [];

  const totalCost = items.reduce((acc, i) => acc + (i.orderedQuantity * i.unitCost || 0), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order"
      description="Draft a restock order with a vendor to replenish inventory"
      maxWidth="2xl"
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
            <label className="block font-semibold text-slate-700 mb-1">Supplier <span className="text-rose-500">*</span></label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
            >
              <option value="">Select Supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expected Delivery Date</label>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">PO Notes / Reference</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            placeholder="e.g. Q4 Restock for regional hub"
          />
        </div>

        {/* Line Items */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">Purchase Order Line Items</span>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Line
            </button>
          </div>

          <div className="space-y-2">
            {items.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <select
                    required
                    value={row.productId}
                    onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                    className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-primary-500 bg-white"
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    required
                    value={row.orderedQuantity}
                    onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                    className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-primary-500 font-mono"
                    placeholder="Qty"
                  />
                </div>

                <div className="w-28">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={row.unitCost}
                    onChange={(e) => handleCostChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-primary-500 font-mono"
                    placeholder="Unit Cost"
                  />
                </div>

                <div className="w-24 text-right font-bold text-slate-900">
                  ${(row.orderedQuantity * row.unitCost).toFixed(2)}
                </div>

                <button
                  type="button"
                  disabled={items.length === 1}
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
            <span className="font-semibold text-slate-600">Total Purchase Cost:</span>
            <span className="font-bold text-slate-900 text-base">${totalCost.toFixed(2)}</span>
          </div>
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
            disabled={createPOMutation.isPending}
            className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {createPOMutation.isPending ? 'Drafting...' : 'Create Purchase Order (DRAFT)'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
