'use client';

import { usePathname } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

interface MaintenanceGateProps {
    children: React.ReactNode;
    maintenanceMode: boolean;
}

export function MaintenanceGate({ children, maintenanceMode }: MaintenanceGateProps) {
    const pathname = usePathname();

    // Allow access to admin, login, and api routes even in maintenance mode
    const isExcluded =
        pathname?.startsWith('/admin') ||
        pathname?.startsWith('/login') ||
        pathname?.startsWith('/api');

    if (maintenanceMode && !isExcluded) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground text-center">
                <div className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
                    <AlertTriangle className="h-10 w-10 text-yellow-500" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
                <p className="text-muted-foreground max-w-md">
                    We are currently performing scheduled maintenance to improve your experience.
                    Please check back soon.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
