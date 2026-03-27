'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DataTable, type OrderRow } from '@/components/DataTable';
import { FilterBar } from '@/components/FilterBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface UploadDetail {
    id: string;
    fileName: string;
    uploadDate: string;
    discountAmount: number;
    totalCost: number;
    totalExtraCost: number;
    totalNubiavilleCost: number;
    orderCount: number;
    orders: OrderRow[];
}

function formatCurrency(amount: number): string {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function UploadDetailPage() {
    const params = useParams();
    const [upload, setUpload] = useState<UploadDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [nameFilter, setNameFilter] = useState('');
    const [vendorFilter, setVendorFilter] = useState('all');
    const [extraCostFilter, setExtraCostFilter] = useState<'all' | 'yes' | 'no'>('all');

    useEffect(() => {
        const fetchUpload = async () => {
            try {
                const res = await fetch(`/api/uploads/${params.id}`);
                const data = await res.json();
                if (data.upload) {
                    setUpload(data.upload);
                } else {
                    toast.error('Upload not found');
                }
            } catch {
                toast.error('Failed to load upload details');
            } finally {
                setLoading(false);
            }
        };
        fetchUpload();
    }, [params.id]);

    const vendors = useMemo(() => {
        if (!upload) return [];
        const vendorSet = new Set(upload.orders.map((o) => o.vendor));
        return Array.from(vendorSet).sort();
    }, [upload]);

    // Pre-calculate per-person extra cost based on all orders before any filtering
    const personExtraCosts = useMemo(() => {
        if (!upload) return new Map<string, number>();
        const personTotals = new Map<string, number>();
        for (const o of upload.orders) {
            const key = o.nickname || o.name;
            personTotals.set(key, (personTotals.get(key) || 0) + o.totalCost);
        }
        const extraCosts = new Map<string, number>();
        for (const [key, total] of personTotals.entries()) {
            extraCosts.set(key, Math.max(0, total - upload.discountAmount));
        }
        return extraCosts;
    }, [upload]);

    const filteredOrders = useMemo(() => {
        if (!upload) return [];
        let orders = upload.orders;

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
    }, [upload, nameFilter, vendorFilter, extraCostFilter, personExtraCosts]);

    const filteredTotals = useMemo(() => {
        if (!upload) return { totalCost: 0, totalExtraCost: 0, totalNubiavilleCost: 0 };
        
        // Group the filtered orders
        const personTotals = new Map<string, number>();
        for (const o of filteredOrders) {
            const key = o.nickname || o.name;
            personTotals.set(key, (personTotals.get(key) || 0) + o.totalCost);
        }
        
        let totalCost = 0;
        let totalExtraCost = 0;
        let totalNubiavilleCost = 0;
        const discount = upload.discountAmount;
        
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
    }, [filteredOrders, upload]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-6 bg-accent/30 rounded w-48 animate-pulse" />
                <div className="h-4 bg-accent/20 rounded w-32 animate-pulse" />
                <div className="h-[400px] bg-accent/10 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (!upload) {
        return (
            <div className="text-center py-20">
                <h2 className="font-display text-xl font-bold">Upload not found</h2>
                <p className="text-muted-foreground mt-2">This upload may have been deleted</p>
                <Link href="/history">
                    <Button className="mt-6 interactive font-display">Back to History</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Link href="/history">
                            <Button variant="ghost" size="sm" className="interactive -ml-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                            </Button>
                        </Link>
                        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                            {upload.fileName}
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">
                        {formatDate(upload.uploadDate)}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="secondary" className="font-mono text-xs">
                        {upload.orderCount} orders
                    </Badge>
                    <Badge variant="secondary" className="font-mono text-xs">
                        Discount: {formatCurrency(upload.discountAmount)}
                    </Badge>
                </div>
            </div>

            {/* Stats overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Cost</p>
                    <p className="font-mono text-2xl font-bold">{formatCurrency(upload.totalCost)}</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Extra Cost</p>
                    <p className="font-mono text-2xl font-bold text-amber">{formatCurrency(upload.totalExtraCost)}</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Nubiaville Cost</p>
                    <p className="font-mono text-2xl font-bold text-success">{formatCurrency(upload.totalNubiavilleCost)}</p>
                </div>
            </div>

            {/* Filters */}
            <FilterBar
                vendors={vendors}
                selectedVendor={vendorFilter}
                onVendorChange={setVendorFilter}
                nameFilter={nameFilter}
                onNameChange={setNameFilter}
                extraCostFilter={extraCostFilter}
                onExtraCostChange={setExtraCostFilter}
            />

            {/* Data Table */}
            <DataTable
                orders={filteredOrders}
                totalCost={filteredTotals.totalCost}
                totalExtraCost={filteredTotals.totalExtraCost}
                totalNubiavilleCost={filteredTotals.totalNubiavilleCost}
                discountAmount={upload.discountAmount}
            />
        </div>
    );
}
