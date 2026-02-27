'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import gsap from 'gsap';
import { toast } from 'sonner';

interface Upload {
    id: string;
    fileName: string;
    uploadDate: string;
    discountAmount: number;
    totalCost: number;
    totalExtraCost: number;
    totalNubiavilleCost: number;
    orderCount: number;
    createdAt: string;
}

function formatCurrency(amount: number): string {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function HistoryPage() {
    const [uploads, setUploads] = useState<Upload[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);

    const fetchUploads = async () => {
        try {
            const res = await fetch('/api/uploads');
            const data = await res.json();
            if (data.uploads) {
                setUploads(data.uploads);
            }
        } catch {
            toast.error('Failed to load uploads');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUploads();
    }, []);

    useEffect(() => {
        if (!loading && gridRef.current) {
            const cards = gridRef.current.querySelectorAll('.upload-card');
            gsap.fromTo(
                cards,
                { opacity: 0, y: 20, scale: 0.97 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.5,
                    stagger: 0.08,
                    ease: 'power2.out',
                }
            );
        }
    }, [loading, uploads]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/uploads/${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                setUploads((prev) => prev.filter((u) => u.id !== deleteId));
                toast.success('Upload deleted');
            } else {
                toast.error('Failed to delete');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
                    Upload <span className="gradient-text">History</span>
                </h1>
                <p className="text-muted-foreground text-sm">
                    View and manage your previous food cost calculations
                </p>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-6 border-border/50 bg-card/60 animate-pulse">
                            <div className="space-y-3">
                                <div className="h-4 bg-accent/50 rounded w-3/4" />
                                <div className="h-3 bg-accent/30 rounded w-1/2" />
                                <div className="h-8 bg-accent/20 rounded mt-4" />
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && uploads.length === 0 && (
                <Card className="p-16 text-center border-border/50 bg-card/80 backdrop-blur-sm">
                    <div className="w-20 h-20 rounded-2xl bg-accent/50 flex items-center justify-center mx-auto mb-5">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="13 2 13 9 20 9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h2 className="font-display text-xl font-bold text-foreground">No uploads yet</h2>
                    <p className="text-sm text-muted-foreground mt-2 mb-6">
                        Upload your first CSV file to get started
                    </p>
                    <Link href="/">
                        <Button className="interactive font-display">Go to Upload</Button>
                    </Link>
                </Card>
            )}

            {/* Uploads Grid */}
            {!loading && uploads.length > 0 && (
                <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploads.map((upload) => (
                        <Card
                            key={upload.id}
                            className="upload-card group border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 opacity-0"
                        >
                            <div className="p-5 space-y-4">
                                {/* File info */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-display font-bold text-sm truncate text-foreground">
                                            {upload.fileName}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {formatDate(upload.createdAt)}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="ml-2 font-mono text-xs shrink-0">
                                        {upload.orderCount} orders
                                    </Badge>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                                        <p className="font-mono text-xs font-bold">{formatCurrency(upload.totalCost)}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Extra</p>
                                        <p className="font-mono text-xs font-bold text-amber">{formatCurrency(upload.totalExtraCost)}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nubiaville</p>
                                        <p className="font-mono text-xs font-bold text-success">{formatCurrency(upload.totalNubiavilleCost)}</p>
                                    </div>
                                </div>

                                {/* Discount */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Discount: {formatCurrency(upload.discountAmount)}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-1">
                                    <Link href={`/history/${upload.id}`} className="flex-1">
                                        <Button variant="secondary" size="sm" className="w-full interactive text-xs font-medium">
                                            View Details
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteId(upload.id)}
                                        className="interactive text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="glass">
                    <DialogHeader>
                        <DialogTitle className="font-display">Delete Upload</DialogTitle>
                        <DialogDescription>
                            This will permanently remove this upload and all its orders. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteId(null)} className="interactive">
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="interactive"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
