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

export default function HomePage() {
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [extraCostFilter, setExtraCostFilter] = useState<'all' | 'yes' | 'no'>('all');

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
