'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <div className="md:hidden">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="relative z-50"
                aria-label="Open menu"
            >
                <Menu className="h-6 w-6" />
            </Button>

            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-all duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Menu Content */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-50 w-full sm:w-[300px] bg-background border-l shadow-2xl transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-2">
                            <div className="relative h-8 w-8">
                                <Image
                                    src="/logo.svg"
                                    alt="PrepWise"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="font-bold text-lg">PrepWise</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    <nav className="flex flex-col space-y-4 mb-8">
                        {['Features', 'How It Works'].map((item) => (
                            <Link
                                key={item}
                                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                                onClick={() => setIsOpen(false)}
                            >
                                {item}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-auto space-y-4">
                        <div className="flex items-center justify-between py-4 border-t">
                            <span className="text-sm font-medium">Theme</span>
                            <ThemeToggle />
                        </div>
                        <Link href="/login" onClick={() => setIsOpen(false)} className="block">
                            <Button variant="outline" className="w-full justify-start h-11">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/register" onClick={() => setIsOpen(false)} className="block">
                            <Button className="w-full h-11 gradient-primary text-white">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
