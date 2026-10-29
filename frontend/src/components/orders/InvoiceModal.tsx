import React, { useState } from 'react';
import { Printer, Download, FileText, CheckSquare, X } from 'lucide-react';
import { Order } from '../../types';
import { Barcode } from '../common/Barcode';
import { Badge } from '../common/Badge';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  const [docType, setDocType] = useState<'INVOICE' | 'PACKING_SLIP'>('INVOICE');

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
      {/* Container - hide non-printable elements in print mode */}
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Control Bar (Hidden during print) */}
        <div className="p-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-300">Document Type:</span>
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setDocType('INVOICE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-l-md transition ${
                  docType === 'INVOICE'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Commercial Invoice
              </button>
              <button
                type="button"
                onClick={() => setDocType('PACKING_SLIP')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-r-md transition ${
                  docType === 'PACKING_SLIP'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Warehouse Packing Slip
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold uppercase rounded-md shadow transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-gray-900 font-sans print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-300 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">SMART INVENTORY</h1>
              </div>
              <p className="text-xs text-gray-500 mt-1">Industrial Logistics & Supply Management Systems</p>
              <p className="text-xs text-gray-500">100 Logistics Way, Suite 4, Industrial Park</p>
              <p className="text-xs text-gray-500">support@smartinventory.local | +1 (800) 555-0199</p>
            </div>

            <div className="text-right">
              <h2 className="text-xl font-extrabold uppercase tracking-wider text-gray-800">
                {docType === 'INVOICE' ? 'COMMERCIAL INVOICE' : 'PACKING SLIP'}
              </h2>
              <p className="text-sm font-mono font-bold text-gray-900 mt-1">{order.orderNumber}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Date: {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-2">
                <Barcode value={order.orderNumber} height={36} showText={false} />
              </div>
            </div>
          </div>

          {/* Customer & Order Metadata */}
          <div className="grid grid-cols-2 gap-8 mb-6 text-xs">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider mb-2">Customer & Billing Details</h3>
              <p className="font-semibold text-sm text-gray-900">{order.customerName || 'Walk-in Customer'}</p>
              {order.customerEmail && <p className="text-gray-600 mt-0.5">Email: {order.customerEmail}</p>}
              {order.customerPhone && <p className="text-gray-600">Phone: {order.customerPhone}</p>}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider mb-2">Fulfillment & Status</h3>
              <div className="space-y-1">
                <p className="flex justify-between">
                  <span className="text-gray-500">Order Status:</span>
                  <span className="font-semibold">{order.status}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className="font-semibold">{order.paymentStatus || 'PENDING'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500">Created By:</span>
                  <span className="font-mono">{order.createdBy || 'System'}</span>
                </p>
                {order.notes && (
                  <p className="mt-2 text-gray-600 italic">Notes: {order.notes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-100 font-bold text-gray-700 uppercase">
                <tr>
                  {docType === 'PACKING_SLIP' && <th className="px-3 py-2 w-12 text-center">Verify</th>}
                  <th className="px-4 py-2">Item / SKU</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  {docType === 'INVOICE' && (
                    <>
                      <th className="px-4 py-2 text-right">Unit Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {docType === 'PACKING_SLIP' && (
                      <td className="px-3 py-2 text-center">
                        <div className="w-4 h-4 border-2 border-gray-400 rounded inline-block" />
                      </td>
                    )}
                    <td className="px-4 py-2.5 font-mono font-medium text-gray-900">
                      {item.productSku || `PROD-${item.productId}`}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 font-medium">
                      {item.productName || 'Catalog Product'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                      {item.quantity}
                    </td>
                    {docType === 'INVOICE' && (
                      <>
                        <td className="px-4 py-2.5 text-right text-gray-700">
                          ${Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                          ${Number(item.totalPrice).toFixed(2)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary (Invoice Mode Only) */}
          {docType === 'INVOICE' ? (
            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>${Number(order.subtotal).toFixed(2)}</span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount:</span>
                    <span>-${Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-1.5 flex justify-between font-extrabold text-sm text-gray-900">
                  <span>Total Due:</span>
                  <span>${Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Packing Verification Sign-off for Packing Slip */
            <div className="grid grid-cols-2 gap-8 border-t border-gray-200 pt-6 mt-8 text-xs text-gray-600">
              <div>
                <p className="font-semibold mb-4">Packed By:</p>
                <div className="border-b border-gray-400 w-48 mb-1" />
                <p className="text-[10px] text-gray-400">Signature / Date</p>
              </div>
              <div>
                <p className="font-semibold mb-4">Inspected & Verified By:</p>
                <div className="border-b border-gray-400 w-48 mb-1" />
                <p className="text-[10px] text-gray-400">Quality Assurance / Date</p>
              </div>
            </div>
          )}

          {/* Footer Terms */}
          <div className="border-t border-gray-200 pt-4 text-[11px] text-gray-500 text-center">
            <p className="font-medium">Thank you for your business!</p>
            <p className="mt-0.5">Goods received in good order and condition. For support or returns contact support@smartinventory.local</p>
          </div>
        </div>
      </div>
    </div>
  );
};
