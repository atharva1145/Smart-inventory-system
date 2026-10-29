import React, { useState, useEffect, useRef } from 'react';
import { Camera, Scan, Search, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import api from '../../services/api';
import { ApiResponse, PageResponse, Product } from '../../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (sku: string, product?: Product) => void;
  title?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode / SKU',
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [sampleProducts, setSampleProducts] = useState<Product[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setManualCode('');
      // Load sample products for quick test scanning
      api.get<ApiResponse<PageResponse<Product>>>('/products?size=5')
        .then((res) => setSampleProducts(res.data.data.content || []))
        .catch(() => {});
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraActive(false);
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setScanning(false);
  };

  const handleCompleteScan = async (sku: string) => {
    const cleanSku = sku.trim();
    if (!cleanSku) return;

    setScanResult(cleanSku);
    stopCamera();

    try {
      const res = await api.get<ApiResponse<PageResponse<Product>>>(`/products?search=${encodeURIComponent(cleanSku)}`);
      const matched = res.data.data.content.find(
        (p) => p.sku.toLowerCase() === cleanSku.toLowerCase()
      );
      setTimeout(() => {
        onScan(cleanSku, matched);
        onClose();
      }, 500);
    } catch {
      setTimeout(() => {
        onScan(cleanSku);
        onClose();
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && manualCode) {
      e.preventDefault();
      handleCompleteScan(manualCode);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-4">
        {/* Viewfinder Display */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden h-56 flex flex-col items-center justify-center border-2 border-dashed border-gray-700">
          {cameraActive ? (
            <>
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-32 border-2 border-primary-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  <div className="w-full h-0.5 bg-red-500 animate-pulse" />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-4">
              <Scan className="w-12 h-12 text-gray-500 mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-gray-300 font-medium">Barcode / QR Viewfinder</p>
              <p className="text-xs text-gray-400 mt-1">Use camera or hardware USB scanner</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-800 text-gray-200 hover:bg-gray-700 rounded-md border border-gray-600 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                Activate Camera
              </button>
            </div>
          )}

          {scanResult && (
            <div className="absolute inset-0 bg-green-900/90 flex flex-col items-center justify-center text-white p-4">
              <CheckCircle className="w-12 h-12 text-green-300 mb-2" />
              <p className="text-xs uppercase tracking-wider font-semibold text-green-200">Scanned Successfully</p>
              <p className="font-mono text-lg font-bold">{scanResult}</p>
            </div>
          )}
        </div>

        {/* Hardware or Manual Barcode Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Barcode / SKU Input (Type or scan with USB scanner)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                placeholder="Scan or enter SKU..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 pl-9 font-mono text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="button"
              disabled={!manualCode}
              onClick={() => handleCompleteScan(manualCode)}
              className="px-4 py-2 bg-primary-600 text-white text-xs font-bold uppercase rounded-md hover:bg-primary-700 disabled:opacity-50 transition"
            >
              Confirm
            </button>
          </div>
        </div>

        {/* Demo Quick-Scan Options */}
        {sampleProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Quick Test Scans (Click to simulate scan)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sampleProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleCompleteScan(p.sku)}
                  className="px-2.5 py-1 text-xs font-mono bg-gray-100 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 border border-gray-200 rounded text-gray-700 transition"
                >
                  {p.sku}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
