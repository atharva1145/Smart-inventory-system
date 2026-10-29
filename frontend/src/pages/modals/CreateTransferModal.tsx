import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import api, { getErrorMessage } from '../../services/api';
import { ApiResponse, PageResponse, Product, Warehouse, CreateStockTransferRequest } from '../../types';

interface CreateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTransferModal: React.FC<CreateTransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sourceWarehouseId, setSourceWarehouseId] = useState<number | ''>('');
  const [destWarehouseId, setDestWarehouseId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productId: number; quantity: number }[]>([
    { productId: 0, quantity: 1 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setItems([{ productId: 0, quantity: 1 }]);
      setNotes('');
      // Load warehouses and products
      api.get<ApiResponse<Warehouse[]>>('/warehouses').then((res) => {
        setWarehouses(res.data.data || []);
        if (res.data.data && res.data.data.length >= 2) {
          setSourceWarehouseId(res.data.data[0].id);
          setDestWarehouseId(res.data.data[1].id);
        }
      }).catch(() => {});

      api.get<ApiResponse<PageResponse<Product>>>('/products?size=100').then((res) => {
        setProducts(res.data.data.content || []);
      }).catch(() => {});
    }
  }, [isOpen]);

  const addItemRow = () => {
    setItems([...items, { productId: 0, quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: 'productId' | 'quantity', val: number) => {
    const updated = [...items];
    updated[index][field] = val;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWarehouseId || !destWarehouseId) {
      setError('Please select both source and destination warehouses.');
      return;
    }
    if (sourceWarehouseId === destWarehouseId) {
      setError('Source and destination warehouses cannot be the same.');
      return;
    }

    const validItems = items.filter((i) => i.productId > 0 && i.quantity > 0);
    if (validItems.length === 0) {
      setError('Please add at least one product with a valid quantity.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload: CreateStockTransferRequest = {
      sourceWarehouseId: Number(sourceWarehouseId),
      destinationWarehouseId: Number(destWarehouseId),
      notes,
      items: validItems,
    };

    try {
      await api.post('/stock-transfers', payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Stock Transfer" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
            {error}
          </div>
        )}

        {/* Warehouse Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Source Warehouse (Stock Deducted) *
            </label>
            <select
              required
              value={sourceWarehouseId}
              onChange={(e) => setSourceWarehouseId(Number(e.target.value))}
              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select source warehouse...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Destination Warehouse (Stock Received) *
            </label>
            <select
              required
              value={destWarehouseId}
              onChange={(e) => setDestWarehouseId(Number(e.target.value))}
              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select destination warehouse...</option>
              {warehouses
                .filter((w) => w.id !== Number(sourceWarehouseId))
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Items List */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-gray-700 uppercase">
              Products to Transfer *
            </label>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto p-1">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  required
                  value={item.productId}
                  onChange={(e) => updateItem(idx, 'productId', Number(e.target.value))}
                  className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={0}>Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  required
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                  className="w-24 text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-right"
                  placeholder="Qty"
                />

                <button
                  type="button"
                  onClick={() => removeItemRow(idx)}
                  disabled={items.length === 1}
                  className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Transfer Notes / Reference Reason
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Replenishing regional fulfillment center for weekend surge..."
            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-xs font-bold uppercase transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
