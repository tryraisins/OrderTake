import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="space-y-2">
                <h1 className="font-display text-6xl font-extrabold gradient-text">404</h1>
                <h2 className="font-display text-xl font-bold text-foreground">Page Not Found</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                    The page you&apos;re looking for doesn&apos;t exist or may have been moved.
                </p>
            </div>
            <div className="flex gap-3">
                <Link href="/">
                    <Button className="interactive font-display">Go Home</Button>
                </Link>
                <Link href="/history">
                    <Button variant="outline" className="interactive font-display">View History</Button>
                </Link>
            </div>
        </div>
    );
}
