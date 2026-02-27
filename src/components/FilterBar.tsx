'use client';

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface FilterBarProps {
    vendors: string[];
    selectedVendor: string;
    onVendorChange: (vendor: string) => void;
    nameFilter: string;
    onNameChange: (name: string) => void;
    extraCostFilter: 'all' | 'yes' | 'no';
    onExtraCostChange: (filter: 'all' | 'yes' | 'no') => void;
}

export function FilterBar({
    vendors,
    selectedVendor,
    onVendorChange,
    nameFilter,
    onNameChange,
    extraCostFilter,
    onExtraCostChange,
}: FilterBarProps) {
    return (
        <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="flex flex-wrap items-end gap-4">
                {/* Name Search */}
                <div className="flex-1 min-w-[180px] space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Search Name
                    </Label>
                    <Input
                        placeholder="Type a name..."
                        value={nameFilter}
                        onChange={(e) => onNameChange(e.target.value)}
                        className="bg-background/50 h-9 text-sm"
                    />
                </div>

                {/* Vendor Filter */}
                <div className="min-w-[160px] space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Vendor
                    </Label>
                    <Select value={selectedVendor} onValueChange={onVendorChange}>
                        <SelectTrigger className="bg-background/50 h-9 text-sm interactive">
                            <SelectValue placeholder="All Vendors" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                            <SelectItem value="all" className="interactive">All Vendors</SelectItem>
                            {vendors.map((vendor) => (
                                <SelectItem key={vendor} value={vendor} className="interactive">
                                    {vendor}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Extra Cost Filter */}
                <div className="min-w-[160px] space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Extra Cost
                    </Label>
                    <Select value={extraCostFilter} onValueChange={(v) => onExtraCostChange(v as 'all' | 'yes' | 'no')}>
                        <SelectTrigger className="bg-background/50 h-9 text-sm interactive">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                            <SelectItem value="all" className="interactive">All Orders</SelectItem>
                            <SelectItem value="yes" className="interactive">Has Extra Cost</SelectItem>
                            <SelectItem value="no" className="interactive">No Extra Cost</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
    );
}
