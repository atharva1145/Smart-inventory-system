import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '../services/api';
import { Customer, Product, Warehouse, ApiResponse } from '../types';
import {
  ShoppingCart,
  Plus,
  Trash2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrderLine {
  productId: number | '';
  quantity: number;
}

export const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState<number | ''>('');
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [discountAmount, setDiscountAmount] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([{ productId: '', quantity: 1 }]);
  const [error, setError] = useState<string | null>(null);

  // Generate unique idempotency key for this order session
  const [idempotencyKey] = useState<string>(() => `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  const { data: customersData } = useQuery<ApiResponse<Customer[]>>({
    queryKey: ['allCustomers'],
    queryFn: async () => {
      const res = await api.get('/customers/all');
      return res.data;
    },
  });

  const { data: productsData } = useQuery<ApiResponse<{ content: Product[] }>>({
    queryKey: ['activeProductsForOrder'],
    queryFn: async () => {
      const res = await api.get('/products?size=100&active=true');
      return res.data;
    },
  });

  const { data: warehousesData } = useQuery<ApiResponse<Warehouse[]>>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const validItems = lines.map((l) => ({
        productId: Number(l.productId),
        quantity: Number(l.quantity),
      }));

      return api.post('/orders', {
        customerId: Number(customerId),
        warehouseId: warehouseId ? Number(warehouseId) : null,
        discountAmount: discountAmount ? Number(discountAmount) : 0,
        idempotencyKey,
        notes,
        items: validItems,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryOverview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      navigate('/orders');
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const handleAddLine = () => {
    setLines([...lines, { productId: '', quantity: 1 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleProductChange = (idx: number, pId: number) => {
    const updated = [...lines];
    updated[idx].productId = pId;
    setLines(updated);
  };

  const handleQuantityChange = (idx: number, qty: number) => {
    const updated = [...lines];
    updated[idx].quantity = qty;
    setLines(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer');
      return;
    }
    if (lines.some((l) => !l.productId || l.quantity <= 0)) {
      setError('All items must have a valid selected product and quantity greater than zero');
      return;
    }

    // Check available stock on client side before sending
    const products = productsData?.data?.content || [];
    for (const line of lines) {
      const prod = products.find((p) => p.id === Number(line.productId));
      if (prod) {
        const avail = prod.availableQuantity ?? 0;
        if (line.quantity > avail) {
          setError(`Requested quantity (${line.quantity}) for ${prod.name} exceeds available stock (${avail})`);
          return;
        }
      }
    }

    setError(null);
    createOrderMutation.mutate();
  };

  const customers = customersData?.data || [];
  const products = productsData?.data?.content || [];
  const warehouses = warehousesData?.data || [];

  // Live total preview calculations
  let calculatedSubtotal = 0;
  for (const line of lines) {
    if (line.productId) {
      const prod = products.find((p) => p.id === Number(line.productId));
      if (prod) {
        calculatedSubtotal += prod.sellingPrice * line.quantity;
      }
    }
  }
  const discountVal = Number(discountAmount) || 0;
  const calculatedTotal = Math.max(0, calculatedSubtotal - discountVal);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/orders"
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Customer Order</h2>
          <p className="text-xs text-slate-500">
            Atomically locks stock balances, prevents overselling, and secures order reservation
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-xs text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            1. Order Details & Customer
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
              >
                <option value="">Select Customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fulfillment Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
              >
                <option value="">Default Warehouse (Primary)</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Order Notes / Delivery Instructions</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="e.g. Expedited ground shipment, gate access code #4321"
            />
          </div>
        </div>

        {/* Line Items Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900">2. Order Items</h3>
            <button
              type="button"
              onClick={handleAddLine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((row, idx) => {
              const selected = products.find((p) => p.id === Number(row.productId));
              const avail = selected?.availableQuantity ?? 0;
              const isInsufficient = selected && row.quantity > avail;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border ${
                    isInsufficient ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                  } flex flex-col sm:flex-row items-center gap-3`}
                >
                  <div className="flex-1 w-full">
                    <select
                      required
                      value={row.productId}
                      onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-500 bg-white"
                    >
                      <option value="">Select Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — Available: {p.availableQuantity ?? 0} {p.unitOfMeasure} — ${p.sellingPrice.toFixed(2)}
                        </option>
                      ))}
                    </select>

                    {selected && (
                      <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                        <span className="text-slate-500">Unit Price: ${selected.sellingPrice.toFixed(2)}</span>
                        <span className="text-slate-300">•</span>
                        <span className={`font-semibold ${isInsufficient ? 'text-rose-600' : 'text-slate-700'}`}>
                          Available: {avail} {selected.unitOfMeasure}
                        </span>
                        {isInsufficient && (
                          <span className="text-rose-600 font-bold flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" /> Insufficient Stock!
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={row.quantity}
                      onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-mono text-slate-900 focus:outline-none focus:border-primary-500 bg-white"
                    />
                  </div>

                  <div className="w-full sm:w-28 text-right">
                    <span className="block text-[10px] font-semibold text-slate-500 mb-0.5">Line Total</span>
                    <span className="text-sm font-bold text-slate-900">
                      ${((selected?.sellingPrice || 0) * row.quantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={lines.length === 1}
                    onClick={() => handleRemoveLine(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pricing Calculation Summary */}
          <div className="border-t border-slate-100 pt-4 flex flex-col items-end gap-2 text-xs">
            <div className="flex justify-between w-64 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">${calculatedSubtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between w-64">
              <span className="text-slate-600">Discount ($):</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-24 text-right rounded border border-slate-200 px-2 py-1 text-xs font-mono text-slate-900 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex justify-between w-64 text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Final Total:</span>
              <span className="text-primary-600">${calculatedTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Concurrency & Idempotency Guarantee Note */}
        <div className="rounded-xl bg-primary-50/50 p-4 border border-primary-200/60 flex items-start gap-3 text-xs text-primary-900">
          <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Overselling Prevention Active</p>
            <p className="text-[11px] text-primary-700/80 leading-relaxed">
              Order submission executes inside an atomic PostgreSQL row-level pessimistic lock transaction with deadlock prevention. Idempotency key: <code className="font-mono text-xs font-bold text-primary-800">{idempotencyKey}</code>.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createOrderMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            {createOrderMutation.isPending ? 'Reserving Stock...' : 'Submit Order & Reserve Stock'}
          </button>
        </div>
      </form>
    </div>
  );
};
