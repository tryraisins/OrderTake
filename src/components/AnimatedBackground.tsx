'use client';

import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let particles: Array<{
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;
            hue: number;
        }> = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Create floating particles
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.15 + 0.05,
                hue: Math.random() * 40 + 30, // Warm amber range
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw soft gradient orbs
            const isDark = document.documentElement.classList.contains('dark');

            // Large ambient orbs
            const orbs = [
                { x: canvas.width * 0.2, y: canvas.height * 0.3, r: 300, color: isDark ? 'rgba(200, 140, 60, 0.04)' : 'rgba(200, 140, 60, 0.06)' },
                { x: canvas.width * 0.8, y: canvas.height * 0.6, r: 250, color: isDark ? 'rgba(180, 100, 40, 0.03)' : 'rgba(180, 100, 40, 0.05)' },
                { x: canvas.width * 0.5, y: canvas.height * 0.8, r: 350, color: isDark ? 'rgba(160, 120, 80, 0.03)' : 'rgba(160, 120, 80, 0.04)' },
            ];

            for (const orb of orbs) {
                const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
                gradient.addColorStop(0, orb.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Draw particles
            for (const p of particles) {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                const alpha = isDark ? p.opacity * 0.8 : p.opacity;
                ctx.fillStyle = `hsla(${p.hue}, 60%, 50%, ${alpha})`;
                ctx.fill();
            }

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 pointer-events-none"
            aria-hidden="true"
        />
    );
}
