import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import api, { getErrorMessage } from '../../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, ArrowRight } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedProduct {
  sku: string;
  name: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  unitOfMeasure: string;
  initialStock: number;
  imageUrl?: string;
  binLocation?: string;
  isValid: boolean;
  error?: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: async (items: ParsedProduct[]) => {
      const payload = items.map((p) => ({
        sku: p.sku.trim(),
        name: p.name.trim(),
        description: p.description?.trim() || '',
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
        reorderLevel: Number(p.reorderLevel) || 10,
        unitOfMeasure: p.unitOfMeasure?.trim() || 'UNIT',
        initialStock: Number(p.initialStock) || 0,
        imageUrl: p.imageUrl?.trim() || undefined,
        binLocation: p.binLocation?.trim() || undefined,
      }));
      return api.post('/products/bulk', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryOverview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      handleClose();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const handleClose = () => {
    setParsedProducts([]);
    setFileName('');
    setError(null);
    onClose();
  };

  const handleDownloadSample = () => {
    const csvContent =
      'sku,name,description,costPrice,sellingPrice,reorderLevel,unitOfMeasure,initialStock,imageUrl,binLocation\n' +
      'SKU-DEMO-01,Heavy Duty Industrial Gloves,Reinforced nitrile gloves size L,4.50,12.00,20,PAIR,50,https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400,A-02-S1-B3\n' +
      'SKU-DEMO-02,Laser Distance Meter,Digital 50m rangefinder with backlit LCD,28.00,59.99,10,UNIT,25,https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400,B-04-S3-B8\n' +
      'SKU-DEMO-03,Kraft Shipping Boxes 12x12,Corrugated cardboard boxes 25-pack,15.00,32.50,30,BUNDLE,40,,C-01-S4-B2\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_product_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      setError('CSV file must contain a header row and at least one product row.');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const skuIdx = headers.indexOf('sku');
    const nameIdx = headers.indexOf('name');
    const descIdx = headers.indexOf('description');
    const costIdx = headers.indexOf('costprice');
    const sellIdx = headers.indexOf('sellingprice');
    const reorderIdx = headers.indexOf('reorderlevel');
    const uomIdx = headers.indexOf('unitofmeasure');
    const stockIdx = headers.indexOf('initialstock');
    const imageIdx = headers.indexOf('imageurl');
    const binIdx = headers.indexOf('binlocation');

    if (skuIdx === -1 || nameIdx === -1 || costIdx === -1 || sellIdx === -1) {
      setError('CSV header must contain at least: sku, name, costPrice, sellingPrice');
      return;
    }

    const products: ParsedProduct[] = [];
    const seenSkus = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const sku = cols[skuIdx] || '';
      const name = cols[nameIdx] || '';
      const cost = parseFloat(cols[costIdx]);
      const sell = parseFloat(cols[sellIdx]);
      const reorder = reorderIdx !== -1 ? parseInt(cols[reorderIdx]) : 10;
      const uom = uomIdx !== -1 && cols[uomIdx] ? cols[uomIdx] : 'UNIT';
      const stock = stockIdx !== -1 ? parseInt(cols[stockIdx]) : 0;
      const imageUrl = imageIdx !== -1 && cols[imageIdx] ? cols[imageIdx] : undefined;
      const binLocation = binIdx !== -1 && cols[binIdx] ? cols[binIdx] : undefined;

      let isValid = true;
      let errorMsg = '';

      if (!sku) {
        isValid = false;
        errorMsg = 'Missing SKU';
      } else if (seenSkus.has(sku.toLowerCase())) {
        isValid = false;
        errorMsg = 'Duplicate SKU in file';
      } else if (!name) {
        isValid = false;
        errorMsg = 'Missing Name';
      } else if (isNaN(cost) || cost < 0) {
        isValid = false;
        errorMsg = 'Invalid Cost Price';
      } else if (isNaN(sell) || sell < 0) {
        isValid = false;
        errorMsg = 'Invalid Selling Price';
      }

      if (sku) seenSkus.add(sku.toLowerCase());

      products.push({
        sku,
        name,
        description: descIdx !== -1 ? cols[descIdx] : '',
        costPrice: isNaN(cost) ? 0 : cost,
        sellingPrice: isNaN(sell) ? 0 : sell,
        reorderLevel: isNaN(reorder) ? 10 : reorder,
        unitOfMeasure: uom,
        initialStock: isNaN(stock) ? 0 : stock,
        imageUrl,
        binLocation,
        isValid,
        error: errorMsg,
      });
    }

    setParsedProducts(products);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const validProducts = parsedProducts.filter((p) => p.isValid);
  const invalidCount = parsedProducts.length - validProducts.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Products & Stock via CSV"
      description="Quickly onboard your product catalog and initial inventory balances in bulk"
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs">
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Download Sample Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Need the CSV Template?</h4>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Download our ready-made CSV template with correct column headers and sample data.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold transition-colors shrink-0 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-primary-600" /> Download Sample Template
          </button>
        </div>

        {/* File Upload Zone */}
        {parsedProducts.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 hover:border-primary-400 rounded-2xl p-8 text-center transition-colors bg-white">
            <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Upload your Product CSV</h3>
            <p className="text-slate-500 text-[11px] mt-1 mb-4">
              Supports standard comma-separated .csv files
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg cursor-pointer shadow-sm transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> Select CSV File
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary-600" />
                <span className="font-bold text-slate-800">{fileName}</span>
                <span className="text-slate-400">({parsedProducts.length} rows parsed)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setParsedProducts([]);
                  setFileName('');
                }}
                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                title="Remove File"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Validation Alert */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{validProducts.length} Valid Products Ready</span>
              </div>
              {invalidCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{invalidCount} Rows With Errors (Will be Skipped)</span>
                </div>
              )}
            </div>

            {/* Preview Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2 text-right">Cost</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-center">Initial Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedProducts.map((p, idx) => (
                    <tr key={idx} className={p.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40 text-rose-800'}>
                      <td className="px-3 py-2">
                        {p.isValid ? (
                          <span className="text-emerald-600 font-semibold text-[10px]">OK</span>
                        ) : (
                          <span className="text-rose-600 font-bold text-[10px]">{p.error}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold">{p.sku || '—'}</td>
                      <td className="px-3 py-2 max-w-xs truncate">{p.name || '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">${p.costPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">${p.sellingPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center font-mono">{p.initialStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={validProducts.length === 0 || importMutation.isPending}
                onClick={() => importMutation.mutate(validProducts)}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                <span>{importMutation.isPending ? 'Importing...' : `Import ${validProducts.length} Products`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
