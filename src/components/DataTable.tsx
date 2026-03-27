'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import gsap from 'gsap';
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { DownloadIcon, FilterIcon } from 'lucide-react';

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

function parseFoodItemsArray(foodItemsJson: string): string[] {
    try {
        const items = JSON.parse(foodItemsJson);
        if (Array.isArray(items)) {
            return items.flatMap((group: { items: string[]; }) => group.items || []);
        }
        return [foodItemsJson];
    } catch {
        return [foodItemsJson];
    }
}

interface GroupedOrder {
    nickname: string;
    vendors: string[];
    foodItemsDisplay: string;
    foodItemsList: string[];
    totalCost: number;
    discountAmount: number;
    extraCost: number;
    nubiavilleCost: number;
}

export function DataTable({ orders, totalCost, totalExtraCost, totalNubiavilleCost, discountAmount }: DataTableProps) {
    const tableRef = useRef<HTMLDivElement>(null);
    const [extraOnly, setExtraOnly] = useState(false);

    const groupedOrders = useMemo<GroupedOrder[]>(() => {
        const groups = new Map<string, GroupedOrder>();
        for (const order of orders) {
            const key = order.nickname || order.name;
            const existing = groups.get(key);
            if (existing) {
                existing.totalCost += order.totalCost;
                if (!existing.vendors.includes(order.vendor)) existing.vendors.push(order.vendor);
                const foodDisplay = parseFoodItemsDisplay(order.foodItems);
                if (foodDisplay) existing.foodItemsDisplay += ', ' + foodDisplay;
                existing.foodItemsList.push(...parseFoodItemsArray(order.foodItems));
            } else {
                const foodList = parseFoodItemsArray(order.foodItems);
                groups.set(key, {
                    nickname: key,
                    vendors: [order.vendor],
                    foodItemsDisplay: parseFoodItemsDisplay(order.foodItems),
                    foodItemsList: foodList,
                    totalCost: order.totalCost,
                    discountAmount: order.discountAmount,
                    extraCost: 0,
                    nubiavilleCost: 0,
                });
            }
        }
        // Recalculate extraCost and nubiavilleCost from merged totals.
        // discount is a fixed per-person budget; nubiaville covers up to that amount.
        for (const group of groups.values()) {
            group.extraCost = Math.max(0, group.totalCost - group.discountAmount);
            group.nubiavilleCost = Math.min(group.totalCost, group.discountAmount);
        }
        return Array.from(groups.values());
    }, [orders]);

    const displayedOrders = useMemo(
        () => extraOnly ? groupedOrders.filter((o: GroupedOrder) => o.extraCost > 0) : groupedOrders,
        [groupedOrders, extraOnly]
    );

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
    }, [displayedOrders]);

    const handleCopyAsTable = () => {
        if (displayedOrders.length === 0) return;

        const th = (v: string) => `<th style="border:1px solid #ccc;padding:6px 10px;background:#f0f0f0;font-weight:bold">${v}</th>`;
        const td = (v: string | number) => `<td style="border:1px solid #ccc;padding:6px 10px">${v}</td>`;

        const headerRow = `<tr>${['#','Nickname','Vendor','Food Items','Total Cost','Discount','Extra Cost','Nubiaville Cost'].map(th).join('')}</tr>`;

        const bodyRows = displayedOrders.map((o: GroupedOrder, i: number) => `<tr>
            ${td(i + 1)}${td(o.nickname)}${td(o.vendors.join(', '))}${td(o.foodItemsDisplay)}
            ${td(formatCurrency(o.totalCost))}${td(formatCurrency(o.discountAmount))}
            ${td(formatCurrency(o.extraCost))}${td(formatCurrency(o.nubiavilleCost))}
        </tr>`).join('');

        const footRow = `<tr>
            <td colspan="4" style="border:1px solid #ccc;padding:6px 10px;font-weight:bold">TOTALS</td>
            ${td(formatCurrency(totalCost))}<td style="border:1px solid #ccc;padding:6px 10px">—</td>
            ${td(formatCurrency(totalExtraCost))}${td(formatCurrency(totalNubiavilleCost))}
        </tr>`;

        const html = `<table style="border-collapse:collapse;font-family:sans-serif;font-size:13px">
            <thead>${headerRow}</thead>
            <tbody>${bodyRows}</tbody>
            <tfoot>${footRow}</tfoot>
        </table>`;

        navigator.clipboard.write([
            new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }) })
        ]).then(() => {
            toast.success('Table copied — paste into Excel, Sheets, or Word');
        }).catch(err => {
            console.error('Failed to copy', err);
            toast.error('Failed to copy table');
        });
    };

    const handleExportExcel = () => {
        if (displayedOrders.length === 0) return;

        const data: any[] = displayedOrders.map((o: GroupedOrder, i: number) => ({
            '#': i + 1,
            'Nickname': o.nickname,
            'Vendor': o.vendors.join(', '),
            'Food Items': o.foodItemsDisplay,
            'Total Cost': o.totalCost,
            'Discount': o.discountAmount,
            'Extra Cost': o.extraCost,
            'Nubiaville Cost': o.nubiavilleCost
        }));

        data.push({
            '#': 'TOTALS',
            'Nickname': '',
            'Vendor': '',
            'Food Items': '',
            'Total Cost': totalCost,
            'Discount': '' as any,
            'Extra Cost': totalExtraCost,
            'Nubiaville Cost': totalNubiavilleCost
        });

        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Orders');

        xlsx.writeFile(workbook, 'TGIF_Orders.xlsx');
        toast.success('Exported to Excel');
    };

    const handleExportPDF = () => {
        if (displayedOrders.length === 0) return;

        const doc = new jsPDF('landscape');

        const headers = [['#', 'Nickname', 'Vendor', 'Food Items', 'Total Cost', 'Discount', 'Extra Cost', 'Nubiaville Cost']];
        const data = displayedOrders.map((o: GroupedOrder, i: number) => [
            i + 1,
            o.nickname,
            o.vendors.join(', '),
            o.foodItemsDisplay,
            formatCurrency(o.totalCost),
            formatCurrency(o.discountAmount),
            formatCurrency(o.extraCost),
            formatCurrency(o.nubiavilleCost)
        ]);

        data.push([
            'TOTALS', '', '', '',
            formatCurrency(totalCost),
            '',
            formatCurrency(totalExtraCost),
            formatCurrency(totalNubiavilleCost)
        ]);

        autoTable(doc, {
            head: headers,
            body: data,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 8 },
            columnStyles: {
                3: { cellWidth: 80 }
            }
        });

        doc.save('TGIF_Orders.pdf');
        toast.success('Exported to PDF');
    };

    const handleExportWhatsApp = () => {
        if (displayedOrders.length === 0) return;

        const lines = displayedOrders.map((o: GroupedOrder, i: number) => {
            const items = o.foodItemsList.join(' • ');
            return `${i + 1}. ${o.nickname}• ${items}`;
        });

        const text = ['🍽️ FOOD ORDER', ...lines].join('\n');

        navigator.clipboard.writeText(text).then(() => {
            toast.success('WhatsApp order copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy', err);
            toast.error('Failed to copy to clipboard');
        });
    };

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
                    <Badge variant="secondary" className="font-mono text-xs">{displayedOrders.length}</Badge>
                </div>
                <Button
                    variant={extraOnly ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 gap-1 interactive"
                    onClick={() => setExtraOnly((v: boolean) => !v)}
                >
                    <FilterIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Extra Cost Only</span>
                </Button>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Discount</span>
                    <Badge variant="secondary" className="font-mono text-xs">{formatCurrency(discountAmount)}</Badge>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1 ml-2 interactive">
                                <DownloadIcon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={handleCopyAsTable} className="interactive">
                                Copy as Table
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportExcel} className="interactive">
                                Export as Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportPDF} className="interactive">
                                Export as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportWhatsApp} className="interactive">
                                Copy as WhatsApp Text
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">Nickname</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">Vendor</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider max-w-[300px]">Food Items</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider text-right">Total Cost</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider text-right">Discount</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider text-right">Extra Cost</TableHead>
                            <TableHead className="font-display font-semibold text-xs uppercase tracking-wider text-right">Nubiaville Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayedOrders.map((order: GroupedOrder, index: number) => (
                            <TableRow
                                key={order.nickname}
                                className={`border-border/30 transition-colors ${order.extraCost > 0
                                    ? 'bg-amber/5 hover:bg-amber/10'
                                    : 'hover:bg-accent/30'
                                    }`}
                            >
                                <TableCell className="font-mono text-xs text-muted-foreground">{index + 1}</TableCell>
                                <TableCell>
                                    <p className="font-medium text-sm">{order.nickname}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {order.vendors.map(v => (
                                            <Badge key={v} variant="outline" className="text-xs font-medium">{v}</Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[300px]">
                                    <p className="text-xs text-muted-foreground truncate" title={order.foodItemsDisplay}>
                                        {order.foodItemsDisplay}
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
                                {formatCurrency(displayedOrders.reduce((sum: number, o: GroupedOrder) => sum + o.totalCost, 0))}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-muted-foreground">—</TableCell>
                            <TableCell className="text-right font-mono text-sm font-bold text-amber">
                                {formatCurrency(displayedOrders.reduce((sum: number, o: GroupedOrder) => sum + o.extraCost, 0))}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-bold text-success">
                                {formatCurrency(displayedOrders.reduce((sum: number, o: GroupedOrder) => sum + o.nubiavilleCost, 0))}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </Card>
    );
}
