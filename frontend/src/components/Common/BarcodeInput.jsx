import React, { useState, useEffect, useRef } from 'react';
import { Scan, X, Camera, Keyboard } from 'lucide-react';
import Input from './Input';
import Button from './Button';

/**
 * BarcodeInput Component
 * 
 * Supports:
 * - Hardware barcode scanner (keyboard wedge)
 * - Manual barcode entry
 * - Real-time validation
 */

const BarcodeInput = ({ onScan, onError, placeholder = "Scan or enter barcode", autoFocus = true }) => {
    const [barcode, setBarcode] = useState('');
    const [scanMode, setScanMode] = useState('manual'); // 'manual' or 'scanner'
    const [isScanning, setIsScanning] = useState(false);
    const inputRef = useRef(null);
    const scanTimeoutRef = useRef(null);
    const barcodeBufferRef = useRef('');

    // Focus input on mount
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Hardware scanner detection
    // Most barcode scanners act as keyboard wedge and type very fast
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ignore if user is typing in another input
            if (document.activeElement !== inputRef.current && document.activeElement.tagName === 'INPUT') {
                return;
            }

            // Clear previous timeout
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }

            // If Enter key, process the scanned barcode
            if (e.key === 'Enter' && barcodeBufferRef.current.length > 0) {
                e.preventDefault();
                const scannedBarcode = barcodeBufferRef.current.trim();
                barcodeBufferRef.current = '';

                if (scannedBarcode) {
                    setBarcode(scannedBarcode);
                    setScanMode('scanner');
                    setIsScanning(true);
                    handleScan(scannedBarcode);
                }
                return;
            }

            // Build barcode buffer
            if (e.key.length === 1) {
                barcodeBufferRef.current += e.key;

                // Auto-clear buffer after 100ms (scanner types very fast)
                scanTimeoutRef.current = setTimeout(() => {
                    barcodeBufferRef.current = '';
                }, 100);
            }
        };

        window.addEventListener('keypress', handleKeyPress);
        return () => {
            window.removeEventListener('keypress', handleKeyPress);
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
        };
    }, []);

    const handleScan = (scannedBarcode) => {
        const trimmedBarcode = scannedBarcode.trim();

        if (!trimmedBarcode) {
            if (onError) {
                onError('Barcode cannot be empty');
            }
            setIsScanning(false);
            return;
        }

        if (onScan) {
            onScan(trimmedBarcode);
        }

        // Reset scanning state after a delay
        setTimeout(() => {
            setIsScanning(false);
        }, 500);
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (barcode.trim()) {
            setScanMode('manual');
            handleScan(barcode);
        }
    };

    const handleClear = () => {
        setBarcode('');
        barcodeBufferRef.current = '';
        setIsScanning(false);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
                <Scan className={`w-5 h-5 ${isScanning ? 'text-cyan animate-pulse' : 'text-gray-400'}`} />
                <span className="text-sm font-medium text-text-primary">Barcode Scanner</span>
                {scanMode === 'scanner' && (
                    <span className="text-xs bg-cyan/10 text-cyan px-2 py-0.5 rounded-full">
                        Hardware Scanner
                    </span>
                )}
            </div>

            <form onSubmit={handleManualSubmit} className="relative">
                <div className="relative">
                    <Input
                        ref={inputRef}
                        type="text"
                        value={barcode}
                        onChange={(e) => {
                            setBarcode(e.target.value);
                            setScanMode('manual');
                        }}
                        placeholder={placeholder}
                        className="pr-20"
                        icon={Keyboard}
                    />

                    {barcode && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X size={16} className="text-gray-400" />
                        </button>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        disabled={!barcode.trim()}
                    >
                        Scan
                    </Button>
                </div>
            </form>

            <div className="flex items-start gap-2 text-xs text-text-muted bg-blue-50 p-2 rounded">
                <Camera size={14} className="mt-0.5 flex-shrink-0" />
                <p>
                    Use a hardware barcode scanner or manually enter the barcode and click "Scan".
                    Hardware scanners will auto-submit when you scan.
                </p>
            </div>
        </div>
    );
};

export default BarcodeInput;
