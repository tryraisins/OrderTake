'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export function Navbar() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const navRef = useRef<HTMLElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (navRef.current) {
            gsap.fromTo(
                navRef.current,
                { y: -30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
            );
        }
    }, []);

    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        if (toggleRef.current) {
            gsap.fromTo(
                toggleRef.current,
                { rotate: 0, scale: 0.8 },
                { rotate: 360, scale: 1, duration: 0.5, ease: 'back.out(2)' }
            );
        }
    };

    const navLinks = [
        { href: '/', label: 'Upload', icon: '◈' },
        { href: '/history', label: 'History', icon: '◆' },
    ];

    return (
        <nav
            ref={navRef}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 opacity-0"
        >
            <div className="glass rounded-2xl px-2 py-2 flex items-center gap-1 shadow-lg shadow-black/5 dark:shadow-black/20">
                {/* Brand */}
                <Link
                    href="/"
                    className="interactive flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors"
                >
                    <span className="text-xl">🍽</span>
                    <span className="font-display font-bold text-sm tracking-tight hidden sm:block gradient-text">
                        TGIF Costs
                    </span>
                </Link>

                {/* Divider */}
                <div className="w-px h-6 bg-border/60 mx-1" />

                {/* Nav Links */}
                {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`interactive flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                                }`}
                        >
                            <span className="text-xs">{link.icon}</span>
                            {link.label}
                        </Link>
                    );
                })}

                {/* Divider */}
                <div className="w-px h-6 bg-border/60 mx-1" />

                {/* Theme Toggle */}
                {mounted && (
                    <button
                        ref={toggleRef}
                        onClick={handleThemeToggle}
                        className="interactive p-2.5 rounded-xl hover:bg-accent/60 transition-colors text-muted-foreground hover:text-foreground"
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
        </nav>
    );
}
