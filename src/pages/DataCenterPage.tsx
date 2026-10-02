import { useRef, useState } from 'react';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Database,
  RotateCcw,
  AlertTriangle,
  Table,
} from 'lucide-react';
import type { Order } from '@/types';
import { SectionHeader } from '@/components/ui';
import {
  validateCsvFile,
  parseCsv,
  type CsvValidationResult,
} from '@/logic/csvParser';
import { generateSampleCsv } from '@/data/demoData';

interface DataCenterProps {
  orders: Order[];
  onDataLoaded: (orders: Order[], source: string) => void;
  dataSource: string;
}

export function DataCenterPage({ orders, onDataLoaded, dataSource }: DataCenterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<CsvValidationResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleFile = (file: File) => {
    setFileError(null);
    setFileName(file.name);

    const fileErr = validateCsvFile(file);
    if (fileErr) {
      setFileError(fileErr);
      setResult(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsv(text);
      setResult(parsed);
      if (parsed.valid && parsed.orders.length > 0) {
        onDataLoaded(parsed.orders, file.name);
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const downloadSample = () => {
    const csv = generateSampleCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nova_cart_sample_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetToDemo = () => {
    onDataLoaded([], 'Demo Dataset');
    setResult(null);
    setFileError(null);
    setFileName(null);
    setShowPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <SectionHeader
        title="Data Center"
        description="Upload your own CSV data or use the built-in demo dataset. All processing happens locally in your browser."
      />

      {/* Current data source */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm flex items-center gap-3">
        <Database className="w-5 h-5 text-pink-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-700">Current Data Source</p>
          <p className="text-xs text-slate-500">{dataSource} — {orders.length} orders loaded</p>
        </div>
        <button
          onClick={resetToDemo}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Demo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload area */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-4 h-4 text-pink-500" />
            <h2 className="text-sm font-semibold text-slate-900">Upload CSV Data</h2>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? 'border-pink-400 bg-pink-50' : 'border-slate-300 bg-slate-50'}`}
          >
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-2">Drag and drop a CSV file here</p>
            <p className="text-xs text-slate-400 mb-4">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              Browse Files
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileInput} className="hidden" aria-label="Upload CSV file" />
            <p className="text-xs text-slate-400 mt-3">CSV only, max 5 MB</p>
          </div>

          {fileName && <p className="text-xs text-slate-500 mt-3">Selected: <span className="font-medium">{fileName}</span></p>}

          {fileError && (
            <div className="mt-4 flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3" role="alert">
              <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{fileError}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-2">
              {result.valid ? (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-emerald-700">Successfully parsed {result.rowCount} valid orders.</p>
                    {result.errors.length > 0 && <p className="text-xs text-amber-600 mt-1">{result.errors.length} rows skipped. See details below.</p>}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3" role="alert">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-700">Validation failed. No orders loaded.</p>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <ul className="text-xs text-amber-700 space-y-0.5">
                    {result.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium text-slate-500 mb-1">Validation Messages:</p>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    {result.errors.map((err, i) => <li key={i}>• {err}</li>)}
                  </ul>
                </div>
              )}

              {result.valid && result.orders.length > 0 && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1.5 text-xs text-pink-600 hover:text-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300 rounded px-2 py-1"
                  aria-expanded={showPreview}
                >
                  <Table className="w-3.5 h-3.5" />
                  {showPreview ? 'Hide' : 'Show'} Data Preview (first 5 rows)
                </button>
              )}

              {showPreview && result.orders.length > 0 && (
                <div className="overflow-x-auto bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-1 px-2 font-medium text-slate-500">order_id</th>
                        <th className="text-left py-1 px-2 font-medium text-slate-500">zone</th>
                        <th className="text-right py-1 px-2 font-medium text-slate-500">value</th>
                        <th className="text-right py-1 px-2 font-medium text-slate-500">delivery</th>
                        <th className="text-center py-1 px-2 font-medium text-slate-500">cancelled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.orders.slice(0, 5).map((o) => (
                        <tr key={o.order_id} className="border-b border-slate-100">
                          <td className="py-1 px-2 text-slate-600">{o.order_id}</td>
                          <td className="py-1 px-2 text-slate-600">{o.zone}</td>
                          <td className="text-right py-1 px-2 text-slate-600">${o.order_value.toFixed(0)}</td>
                          <td className="text-right py-1 px-2 text-slate-600">{o.delivery_time.toFixed(1)}</td>
                          <td className="text-center py-1 px-2 text-slate-600">{o.cancelled ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sample download & schema */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-4 h-4 text-pink-500" />
              <h2 className="text-sm font-semibold text-slate-900">Sample Dataset</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">Download a realistic sample CSV file with the correct format and column structure to use as a template.</p>
            <button
              onClick={downloadSample}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              <Download className="w-4 h-4" />
              Download Sample CSV
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-pink-500" />
              <h2 className="text-sm font-semibold text-slate-900">Required CSV Schema</h2>
            </div>
            <div className="space-y-1.5">
              {[
                { col: 'order_id', type: 'string' },
                { col: 'customer_id', type: 'string' },
                { col: 'zone', type: 'string' },
                { col: 'order_value', type: 'number (must be ≥ 0)' },
                { col: 'order_time', type: 'string (ISO date)' },
                { col: 'delivery_time', type: 'number (minutes, ≥ 0)' },
                { col: 'expected_delivery_time', type: 'number (minutes, ≥ 0)' },
                { col: 'cancelled', type: 'boolean (true/false)' },
                { col: 'cancellation_reason', type: 'string (optional)' },
                { col: 'rider_available', type: 'boolean' },
                { col: 'inventory_available', type: 'boolean' },
                { col: 'repeat_purchase', type: 'boolean' },
                { col: 'peak_hour', type: 'boolean' },
                { col: 'timestamp', type: 'string (ISO date)' },
              ].map((f) => (
                <div key={f.col} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <code className="text-slate-700 font-mono">{f.col}</code>
                  <span className="text-slate-400">{f.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
