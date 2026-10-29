import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { PurchaseOrder, Warehouse, ApiResponse } from '../../types';
import api, { getErrorMessage } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, PackageCheck } from 'lucide-react';

interface RecordGoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
}

interface ReceiptItemInput {
  productId: number;
  productName: string;
  productSku: string;
  outstandingQuantity: number;
  quantityReceived: number;
}

export const RecordGoodsReceiptModal: React.FC<RecordGoodsReceiptModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
}) => {
  const queryClient = useQueryClient();
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [receiptItems, setReceiptItems] = useState<ReceiptItemInput[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: warehousesData } = useQuery<ApiResponse<Warehouse[]>>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (purchaseOrder?.items) {
      const itemsToReceive: ReceiptItemInput[] = purchaseOrder.items
        .filter((i) => i.outstandingQuantity > 0)
        .map((i) => ({
          productId: i.productId,
          productName: i.productName,
          productSku: i.productSku,
          outstandingQuantity: i.outstandingQuantity,
          quantityReceived: i.outstandingQuantity, // Default to full outstanding
        }));
      setReceiptItems(itemsToReceive);
    }
    if (warehousesData?.data && warehousesData.data.length > 0 && !warehouseId) {
      setWarehouseId(warehousesData.data[0].id);
    }
    setError(null);
  }, [purchaseOrder, warehousesData, isOpen]);

  const recordMutation = useMutation({
    mutationFn: async () => {
      const itemsPayload = receiptItems
        .filter((i) => i.quantityReceived > 0)
        .map((i) => ({
          productId: i.productId,
          quantityReceived: Number(i.quantityReceived),
        }));

      return api.post('/goods-receipts', {
        purchaseOrderId: purchaseOrder.id,
        warehouseId: Number(warehouseId),
        notes,
        items: itemsPayload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['goodsReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryOverview'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      onClose();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const handleQuantityChange = (productId: number, qty: number) => {
    setReceiptItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantityReceived: qty } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      setError('Please select a destination warehouse');
      return;
    }

    const itemsToReceive = receiptItems.filter((i) => i.quantityReceived > 0);
    if (itemsToReceive.length === 0) {
      setError('At least one item must have a quantity received > 0');
      return;
    }

    for (const item of itemsToReceive) {
      if (item.quantityReceived > item.outstandingQuantity) {
        setError(
          `Received quantity for ${item.productSku} (${item.quantityReceived}) exceeds outstanding quantity (${item.outstandingQuantity})`
        );
        return;
      }
    }

    setError(null);
    recordMutation.mutate();
  };

  const warehouses = warehousesData?.data || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Goods Receipt — ${purchaseOrder.poNumber}`}
      description={`Supplier: ${purchaseOrder.supplierName}. Received stock will atomically increase on-hand inventory balances.`}
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
            <label className="block font-semibold text-slate-700 mb-1">
              Destination Warehouse <span className="text-rose-500">*</span>
            </label>
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Delivery / Receipt Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="e.g. Carrier tracking #, inspection notes"
            />
          </div>
        </div>

        {/* Line Items Receive Quantities */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
          <span className="font-bold text-slate-800">Verify Received Physical Quantities</span>
          <div className="space-y-2">
            {receiptItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200"
              >
                <div>
                  <div className="font-semibold text-slate-900">{item.productName}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    SKU: {item.productSku} | Outstanding: {item.outstandingQuantity} units
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-medium text-slate-600">Received:</label>
                  <input
                    type="number"
                    min="0"
                    max={item.outstandingQuantity}
                    value={item.quantityReceived}
                    onChange={(e) =>
                      handleQuantityChange(item.productId, parseInt(e.target.value) || 0)
                    }
                    className="w-20 rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 font-mono text-center focus:outline-none focus:border-primary-500"
                  />
                  <span className="text-slate-400 text-[10px]">/ {item.outstandingQuantity}</span>
                </div>
              </div>
            ))}
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
            disabled={recordMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <PackageCheck className="w-4 h-4" />
            {recordMutation.isPending ? 'Committing Stock...' : 'Confirm Goods Receipt & Update Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
