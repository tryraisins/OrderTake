'use client';

import { useEffect, useRef } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import gsap from 'gsap';

export interface OrderRow {
    id: string;
    name: string;
    nickname: string;
    vendor: string;
    foodItems: string;
    totalCost: number;
    discountAmount: number;
    extraCost: number;
    nubiavilleCost: number;
}

interface DataTableProps {
    orders: OrderRow[];
    totalCost: number;
    totalExtraCost: number;
    totalNubiavilleCost: number;
    discountAmount: number;
}

function formatCurrency(amount: number): string {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function parseFoodItemsDisplay(foodItemsJson: string): string {
    try {
        const items = JSON.parse(foodItemsJson);
        if (Array.isArray(items)) {
            return items
                .flatMap((group: { items: string[]; }) => group.items || [])
                .join(', ');
        }
        return foodItemsJson;
    } catch {
        return foodItemsJson;
    }
}

export function DataTable({ orders, totalCost, totalExtraCost, totalNubiavilleCost, discountAmount }: DataTableProps) {
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (tableRef.current) {
            const rows = tableRef.current.querySelectorAll('tbody tr');
            gsap.fromTo(
                rows,
                { opacity: 0, y: 15 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    stagger: 0.04,
                    ease: 'power2.out',
                    delay: 0.2,
                }
            );
        }
    }, [orders]);

    if (orders.length === 0) {
        return (
            <Card className="p-12 text-center border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-2xl bg-accent/50 flex items-center justify-center mx-auto mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <p className="font-display font-semibold text-foreground">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-1">Upload a CSV file to see the data here</p>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
            {/* Summary bar */}
            <div className="p-4 border-b border-border/50 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Orders</span>
                    <Badge variant="secondary" className="font-mono text-xs">{orders.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Discount</span>
                    <Badge variant="secondary" className="font-mono text-xs">{formatCurrency(discountAmount)}</Badge>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total Cost</p>
                        <p className="font-mono font-bold text-sm">{formatCurrency(totalCost)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Extra Cost</p>
                        <p className="font-mono font-bold text-sm text-amber">{formatCurrency(totalExtraCost)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Nubiaville</p>
                        <p className="font-mono font-bold text-sm text-success">{formatCurrency(totalNubiavilleCost)}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div ref={tableRef} className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider w-8">#</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">Name</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">Vendor</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider max-w-[300px]">Food Items</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider text-right">Total Cost</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider text-right">Discount</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider text-right">Extra Cost</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider text-right">Nubiaville Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order, index) => (
                            <TableRow
                                key={order.id}
                                className={`border-border/30 transition-colors ${order.extraCost > 0
                                        ? 'bg-amber/5 hover:bg-amber/10'
                                        : 'hover:bg-accent/30'
                                    }`}
                            >
                                <TableCell className="font-mono text-xs text-muted-foreground">{index + 1}</TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium text-sm">{order.name}</p>
                                        {order.nickname && order.nickname !== order.name && (
                                            <p className="text-xs text-muted-foreground">{order.nickname}</p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-xs font-medium">
                                        {order.vendor}
                                    </Badge>
                                </TableCell>
                                <TableCell className="max-w-[300px]">
                                    <p className="text-xs text-muted-foreground truncate" title={parseFoodItemsDisplay(order.foodItems)}>
                                        {parseFoodItemsDisplay(order.foodItems)}
                                    </p>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm font-medium">
                                    {formatCurrency(order.totalCost)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                    {formatCurrency(order.discountAmount)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                    {order.extraCost > 0 ? (
                                        <span className="text-amber font-bold">{formatCurrency(order.extraCost)}</span>
                                    ) : (
                                        <span className="text-muted-foreground">₦0</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm font-medium text-success">
                                    {formatCurrency(order.nubiavilleCost)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="border-border/50 bg-accent/20 font-bold">
                            <TableCell colSpan={4} className="font-display font-bold text-sm">
                                TOTALS
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-bold">
                                {formatCurrency(totalCost)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-muted-foreground">—</TableCell>
                            <TableCell className="text-right font-mono text-sm font-bold text-amber">
                                {formatCurrency(totalExtraCost)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-bold text-success">
                                {formatCurrency(totalNubiavilleCost)}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </Card>
    );
}
