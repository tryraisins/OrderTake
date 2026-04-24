'use client';

import { useState, useMemo } from 'react';
import { CsvUploader } from '@/components/CsvUploader';
import { DataTable, type OrderRow } from '@/components/DataTable';
import { FilterBar } from '@/components/FilterBar';

interface UploadData {
  id: string;
  discountAmount: number;
  totalCost: number;
  totalExtraCost: number;
  totalNubiavilleCost: number;
  orders: OrderRow[];
}

const COLUMN_GUIDE = [
  { name: 'Id', required: true, description: 'Row identifier', example: '1' },
  { name: 'Name', required: true, description: 'Full name', example: 'Oluwaseun Sowemimo' },
  { name: 'Name1', required: true, description: 'Nickname / short name', example: 'Seun' },
  { name: 'Email', required: true, description: 'Email address', example: 'seun@company.com' },
  { name: 'Choose Your Food Vendor', required: true, description: 'Vendor name', example: 'Mama Mayowa' },
  { name: 'Start time', required: false, description: 'Form start timestamp', example: '06/12/2025 10:00' },
  { name: 'Completion time', required: false, description: 'Form completion timestamp', example: '06/12/2025 10:05' },
  { name: 'Select a Main Meal', required: false, description: 'Main meal — format: Item - Price', example: 'Jollof Rice - 2000' },
  { name: 'Choose a Shawarma', required: false, description: 'Shawarma selection', example: 'Chicken Shawarma - 1500' },
  { name: 'What Type of Rice', required: false, description: 'Rice type selection', example: 'Fried Rice - 1800' },
  { name: 'Choose a Shawarma (Optional)', required: false, description: 'Optional shawarma add-on', example: '' },
  { name: 'Choose a Side (Optional)', required: false, description: 'Optional side dish', example: 'Plantain - 500' },
  { name: 'More Side Options (Optional)', required: false, description: 'Additional side options', example: '' },
  { name: 'Choose an Extra', required: false, description: 'Extra items / drinks', example: 'Drinks - 500' },
  { name: 'Select a Main Meal1', required: false, description: 'Second vendor main meal', example: '4 Portions Fried Rice - 2300' },
  { name: 'Select second Option', required: false, description: 'Second food option', example: '' },
  { name: 'Select Combo (Optional)', required: false, description: 'Combo selection', example: '' },
  { name: 'Choose a Protein', required: false, description: 'Protein choice', example: 'Hake Fish - 3500' },
  { name: 'Choose a Side', required: false, description: 'Side dish', example: 'Plantain - 500' },
];

export default function HomePage() {
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [extraCostFilter, setExtraCostFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [showGuide, setShowGuide] = useState(false);

  const handleUploadComplete = (result: { upload: UploadData; }) => {
    setUploadData(result.upload);
    setNameFilter('');
    setVendorFilter('all');
    setExtraCostFilter('all');
  };

  // Get unique vendors
  const vendors = useMemo(() => {
    if (!uploadData) return [];
    const vendorSet = new Set(uploadData.orders.map((o) => o.vendor));
    return Array.from(vendorSet).sort();
  }, [uploadData]);

  // Pre-calculate per-person extra cost based on all orders before any filtering
  const personExtraCosts = useMemo(() => {
    if (!uploadData) return new Map<string, number>();
    const personTotals = new Map<string, number>();
    for (const o of uploadData.orders) {
      const key = o.nickname || o.name;
      personTotals.set(key, (personTotals.get(key) || 0) + o.totalCost);
    }
    const extraCosts = new Map<string, number>();
    for (const [key, total] of personTotals.entries()) {
      extraCosts.set(key, Math.max(0, total - uploadData.discountAmount));
    }
    return extraCosts;
  }, [uploadData]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!uploadData) return [];
    let orders = uploadData.orders;

    if (nameFilter) {
      const lower = nameFilter.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.name.toLowerCase().includes(lower) ||
          o.nickname.toLowerCase().includes(lower)
      );
    }

    if (vendorFilter !== 'all') {
      orders = orders.filter((o) => o.vendor === vendorFilter);
    }

    if (extraCostFilter === 'yes') {
      orders = orders.filter((o) => {
        const key = o.nickname || o.name;
        return (personExtraCosts.get(key) || 0) > 0;
      });
    } else if (extraCostFilter === 'no') {
      orders = orders.filter((o) => {
        const key = o.nickname || o.name;
        return (personExtraCosts.get(key) || 0) === 0;
      });
    }

    return orders;
  }, [uploadData, nameFilter, vendorFilter, extraCostFilter, personExtraCosts]);

  // Recalculate totals for filtered view using grouped values
  const filteredTotals = useMemo(() => {
    if (!uploadData) return { totalCost: 0, totalExtraCost: 0, totalNubiavilleCost: 0 };
    
    // Group the filtered orders
    const personTotals = new Map<string, number>();
    for (const o of filteredOrders) {
      const key = o.nickname || o.name;
      personTotals.set(key, (personTotals.get(key) || 0) + o.totalCost);
    }
    
    let totalCost = 0;
    let totalExtraCost = 0;
    let totalNubiavilleCost = 0;
    const discount = uploadData.discountAmount;
    
    for (const total of personTotals.values()) {
      totalCost += total;
      totalExtraCost += Math.max(0, total - discount);
      totalNubiavilleCost += Math.min(total, discount);
    }
    
    return {
      totalCost,
      totalExtraCost,
      totalNubiavilleCost,
    };
  }, [filteredOrders, uploadData]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
          <span className="gradient-text">Food Cost</span>{' '}
          <span className="text-foreground">Manager</span>
        </h1>
        <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
          Upload your TGIF food order CSV, calculate costs and discounts,
          and keep track of every penny.
        </p>
      </div>

      {/* File Format Guide */}
      <div className="max-w-3xl mx-auto w-full">
        <button
          onClick={() => setShowGuide((s: boolean) => !s)}
          className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2.5 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/30"
        >
          <span className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" />
              <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" />
            </svg>
            Expected file format
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`}
          >
            <polyline points="6,9 12,15 18,9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showGuide && (
          <div className="mt-2 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Column reference</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Food item cells use format <code className="bg-accent px-1 rounded">Item Name - Price</code>.
                  Multiple items separated by semicolons.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs flex-shrink-0 pt-0.5">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary/70 inline-block" />Required</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />Optional</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-accent/20">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground w-[38%]">Column name</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[14%]">Type</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[28%]">Description</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {COLUMN_GUIDE.map((col, i) => (
                    <tr
                      key={col.name}
                      className={`border-b border-border/20 last:border-0 ${i % 2 === 0 ? '' : 'bg-accent/10'}`}
                    >
                      <td className="px-4 py-2">
                        <code className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${col.required ? 'bg-primary/10 text-primary' : 'bg-accent text-foreground'}`}>
                          {col.name}
                        </code>
                      </td>
                      <td className="px-3 py-2">
                        {col.required ? (
                          <span className="text-primary font-medium">Required</span>
                        ) : (
                          <span className="text-muted-foreground">Optional</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{col.description}</td>
                      <td className="px-3 py-2 text-muted-foreground font-mono">
                        {col.example || <span className="opacity-40">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="max-w-xl mx-auto">
        <CsvUploader onUploadComplete={handleUploadComplete} />
      </div>

      {/* Results Section */}
      {uploadData && (
        <div className="space-y-4 animate-[slide-up_0.5s_ease-out]">
          <FilterBar
            vendors={vendors}
            selectedVendor={vendorFilter}
            onVendorChange={setVendorFilter}
            nameFilter={nameFilter}
            onNameChange={setNameFilter}
            extraCostFilter={extraCostFilter}
            onExtraCostChange={setExtraCostFilter}
          />

          <DataTable
            orders={filteredOrders}
            totalCost={filteredTotals.totalCost}
            totalExtraCost={filteredTotals.totalExtraCost}
            totalNubiavilleCost={filteredTotals.totalNubiavilleCost}
            discountAmount={uploadData.discountAmount}
          />
        </div>
      )}
    </div>
  );
}
