'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_PRICE } from '@/lib/constants';
import { useTechnicians } from '@/lib/use-technicians';

type Tab = 'input' | 'invoice' | 'work-order';

export default function GeneratePage() {
  const technicians = useTechnicians();
  const [tab, setTab] = useState<Tab>('input');
  const [form, setForm] = useState({
    storeNumber: '',
    woNumber: '',
    invoiceNumber: '',
    price: DEFAULT_PRICE.toString(),
    serviceDate: new Date().toISOString().split('T')[0],
    technician: '',
    startTime: '',
    stopTime: '',
    address: '',
    cityStateZip: '',
    storePhone: '',
  });
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  // Parse city, state, zip from combined field
  function parseCityStateZip() {
    const parts = form.cityStateZip.split(',').map((s) => s.trim());
    const city = parts[0] || '';
    const stateZip = (parts[1] || '').trim().split(/\s+/);
    const state = stateZip[0] || '';
    const zip = stateZip[1] || '';
    return { city, state, zip };
  }

  // Generate preview when switching to invoice/work-order tabs
  useEffect(() => {
    if (tab === 'input') {
      setPreviewUrl(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { city, state, zip } = parseCityStateZip();

        if (tab === 'invoice') {
          const { generateInvoicePDF } = await import('@/lib/pdf/invoice');
          const doc = generateInvoicePDF({
            storeNumber: form.storeNumber,
            woNumber: form.woNumber,
            invoiceNumber: form.invoiceNumber,
            price: parseFloat(form.price) || DEFAULT_PRICE,
            serviceDate: form.serviceDate,
            address: form.address,
            city, state, zip,
          });
          if (!cancelled) {
            const blob = doc.output('blob');
            setPreviewUrl(URL.createObjectURL(blob));
          }
        } else {
          const { generateWorkOrderPDF } = await import('@/lib/pdf/work-order');
          const bytes = await generateWorkOrderPDF({
            storeNumber: form.storeNumber,
            woNumber: form.woNumber,
            address: form.address,
            city, state, zip,
            storePhone: form.storePhone,
            serviceDate: form.serviceDate,
            technician: form.technician,
            startTime: form.startTime,
            stopTime: form.stopTime,
          });
          if (!cancelled) {
            const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
            setPreviewUrl(URL.createObjectURL(blob));
          }
        }
      } catch {
        // Preview generation can fail if the browser cannot fetch the WO template.
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, form]);

  async function generateAndDownload() {
    setGenerating(true);
    try {
      const { city, state, zip } = parseCityStateZip();
      const { generateInvoicePDF } = await import('@/lib/pdf/invoice');
      const { generateWorkOrderPDF } = await import('@/lib/pdf/work-order');

      const inv = generateInvoicePDF({
        storeNumber: form.storeNumber,
        woNumber: form.woNumber,
        invoiceNumber: form.invoiceNumber,
        price: parseFloat(form.price) || DEFAULT_PRICE,
        serviceDate: form.serviceDate,
        address: form.address,
        city, state, zip,
      });
      inv.save(`Invoice_${form.storeNumber}_${form.invoiceNumber || 'draft'}.pdf`);

      const woBytes = await generateWorkOrderPDF({
        storeNumber: form.storeNumber,
        woNumber: form.woNumber,
        address: form.address,
        city, state, zip,
        storePhone: form.storePhone,
        serviceDate: form.serviceDate,
        technician: form.technician,
        startTime: form.startTime,
        stopTime: form.stopTime,
      });
      const blob = new Blob([woBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WO_${form.storeNumber}_${form.woNumber || 'draft'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
    setGenerating(false);
  }

  async function addToSchedule() {
    const { city, state, zip } = parseCityStateZip();
    const job = {
      id: uuidv4(),
      storeNumber: form.storeNumber,
      woNumber: form.woNumber || undefined,
      invoiceNumber: form.invoiceNumber || undefined,
      address: form.address,
      city,
      state,
      zip,
      storePhone: form.storePhone || undefined,
      price: parseFloat(form.price) || DEFAULT_PRICE,
      serviceDate: form.serviceDate,
      assignedTech: form.technician || undefined,
      startTime: form.startTime || undefined,
      stopTime: form.stopTime || undefined,
      status: 'scheduled' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });

    if (res.ok) {
      setSaved(true);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'input', label: 'Input' },
    { key: 'invoice', label: 'Invoice' },
    { key: 'work-order', label: 'Work Order' },
  ];

  return (
    <div className="space-y-0">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-[#0a0f1a] via-[#0d2137] to-[#00A4C7]/40 rounded-t-lg p-5 flex items-center gap-4">
        <div className="bg-white text-[#00A4C7] font-serif font-bold px-3 py-2 rounded-lg text-lg">RS</div>
        <div>
          <h1 className="text-xl font-bold text-white">Starbucks Job Doc Generator</h1>
          <p className="text-[#00A4C7] text-sm">Invoice + Work Order &rarr; PDF</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#111827] border-b border-[#1f2937] flex">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'text-[#00A4C7] border-b-2 border-[#00A4C7]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-[#111827] rounded-b-lg border border-t-0 border-[#1f2937]">
        {tab === 'input' ? (
          <div className="p-6 space-y-5">
            {/* Row 1: Store # and WO # */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="STORE #" value={form.storeNumber} onChange={(v) => update('storeNumber', v)} placeholder="00806" />
              <Field label="WORK ORDER #" value={form.woNumber} onChange={(v) => update('woNumber', v)} placeholder="1963606" />
            </div>

            {/* Row 2: Invoice # and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="INVOICE #" value={form.invoiceNumber} onChange={(v) => update('invoiceNumber', v)} placeholder="160" />
              <Field label="PRICE ($)" value={form.price} onChange={(v) => update('price', v)} type="number" />
            </div>

            {/* Row 3: Service Date and Technician */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="SERVICE DATE" value={form.serviceDate} onChange={(v) => update('serviceDate', v)} type="date" />
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Technician</label>
                <select
                  value={form.technician}
                  onChange={(e) => update('technician', e.target.value)}
                  className="w-full bg-[#0a0f1a] border border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-100 focus:border-[#00A4C7] focus:outline-none"
                >
                  <option value="">Select technician...</option>
                  {technicians.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Start/Stop Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="START TIME" value={form.startTime} onChange={(v) => update('startTime', v)} type="time" />
              <Field label="STOP TIME" value={form.stopTime} onChange={(v) => update('stopTime', v)} type="time" />
            </div>

            {/* Row 5: Address */}
            <Field label="STORE ADDRESS" value={form.address} onChange={(v) => update('address', v)} placeholder="301 Greenwich Ave" />

            {/* Row 6: City/State/Zip and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="CITY, STATE ZIP" value={form.cityStateZip} onChange={(v) => update('cityStateZip', v)} placeholder="Greenwich, CT 06830" />
              <Field label="STORE PHONE" value={form.storePhone} onChange={(v) => update('storePhone', v)} placeholder="(203) 661-3042" />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <button
                onClick={generateAndDownload}
                disabled={generating}
                className="flex-1 min-w-[200px] px-5 py-3.5 bg-[#00A4C7] text-white rounded-lg text-sm font-semibold hover:bg-[#0090b0] transition-colors disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Invoice & Work Order'}
              </button>
              <button
                onClick={addToSchedule}
                disabled={!form.storeNumber}
                className={`px-5 py-3.5 rounded-lg text-sm font-semibold transition-colors ${
                  saved
                    ? 'bg-green-600 text-white'
                    : 'bg-[#1f2937] text-gray-300 border border-[#374151] hover:border-[#00A4C7] hover:text-white disabled:opacity-50'
                }`}
              >
                {saved ? 'Added to Schedule!' : '+ Add to Schedule'}
              </button>
            </div>
          </div>
        ) : (
          /* PDF Preview */
          <div className="p-6">
            {/* Title bar with download button */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {tab === 'invoice' ? 'Invoice' : 'Work Order'} - SB #{form.storeNumber || '?????'}
              </h2>
              <button
                onClick={() => {
                  if (previewUrl) {
                    const a = document.createElement('a');
                    a.href = previewUrl;
                    a.download = tab === 'invoice'
                      ? `Invoice_${form.storeNumber}_${form.invoiceNumber || 'draft'}.pdf`
                      : `WO_${form.storeNumber}_${form.woNumber || 'draft'}.pdf`;
                    a.click();
                  }
                }}
                className="px-5 py-2.5 bg-[#00A4C7] text-white rounded-lg text-sm font-semibold hover:bg-[#0090b0] transition-colors flex items-center gap-2"
              >
                <span>&darr;</span> Download PDF
              </button>
            </div>

            {previewUrl ? (
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-[75vh] rounded-lg border border-[#1f2937] bg-white"
                title={tab === 'invoice' ? 'Invoice Preview' : 'Work Order Preview'}
              />
            ) : (
              <div className="flex items-center justify-center h-[75vh] text-gray-500">
                Loading preview...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0a0f1a] border border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:border-[#00A4C7] focus:outline-none"
      />
    </div>
  );
}
