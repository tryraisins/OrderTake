'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import gsap from 'gsap';
import { toast } from 'sonner';

interface UploadResult {
    success: boolean;
    upload: {
        id: string;
        fileName: string;
        discountAmount: number;
        totalCost: number;
        totalExtraCost: number;
        totalNubiavilleCost: number;
        orderCount: number;
        orders: Array<{
            id: string;
            name: string;
            nickname: string;
            email: string;
            vendor: string;
            foodItems: string;
            totalCost: number;
            discountAmount: number;
            extraCost: number;
            nubiavilleCost: number;
        }>;
    };
    warnings: string[];
}

interface CsvUploaderProps {
    onUploadComplete: (result: UploadResult) => void;
}

export function CsvUploader({ onUploadComplete }: CsvUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [discountAmount, setDiscountAmount] = useState<string>('7000');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.toLowerCase().endsWith('.csv')) {
            setFile(droppedFile);
            if (dropZoneRef.current) {
                gsap.fromTo(dropZoneRef.current, { scale: 0.98 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
            }
            toast.success('File ready', { description: droppedFile.name });
        } else {
            toast.error('Invalid file', { description: 'Please upload a CSV file' });
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
                toast.error('Invalid file', { description: 'Please upload a CSV file' });
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File too large', { description: 'Maximum file size is 5MB' });
                return;
            }
            setFile(selectedFile);
            toast.success('File ready', { description: selectedFile.name });
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('No file selected');
            return;
        }

        const discount = parseFloat(discountAmount);
        if (isNaN(discount) || discount < 0) {
            toast.error('Invalid discount amount');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('discountAmount', String(discount));

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error('Upload failed', { description: data.error || 'Unknown error' });
                return;
            }

            toast.success('Upload successful!', {
                description: `${data.upload.orderCount} orders processed`,
            });

            onUploadComplete(data);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch {
            toast.error('Network error', { description: 'Please try again' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="p-6 space-y-6">
                {/* Title section */}
                <div>
                    <h2 className="font-display text-xl font-bold text-foreground">
                        Import Food Orders
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Upload a CSV file to calculate and track food costs
                    </p>
                </div>

                {/* Drop Zone */}
                <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
            interactive relative rounded-xl border-2 border-dashed p-8
            flex flex-col items-center justify-center gap-3
            transition-all duration-300 min-h-[160px]
            ${isDragging
                            ? 'border-primary bg-primary/5 scale-[1.02]'
                            : file
                                ? 'border-success/50 bg-success/5'
                                : 'border-border hover:border-primary/50 hover:bg-accent/30'
                        }
          `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        aria-label="Select CSV file"
                    />

                    {file ? (
                        <>
                            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-sm text-foreground">{file.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {(file.size / 1024).toFixed(1)} KB •{' '}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="text-destructive hover:underline interactive"
                                    >
                                        Remove
                                    </button>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                    Drop your CSV file here
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    or click to browse • Max 5MB
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Discount Amount */}
                <div className="space-y-2">
                    <Label htmlFor="discount" className="text-sm font-medium">
                        Discount Amount (₦)
                    </Label>
                    <Input
                        id="discount"
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        placeholder="7000"
                        min="0"
                        className="bg-background/50 font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                        Amount Nubiaville covers per person. Default: ₦7,000
                    </p>
                </div>

                {/* Upload Button */}
                <Button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="w-full interactive font-display font-semibold tracking-wide"
                    size="lg"
                >
                    {isUploading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        'Calculate & Save'
                    )}
                </Button>
            </div>
        </Card>
    );
}
