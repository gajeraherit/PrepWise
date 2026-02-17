'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async (user: any) => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, Collections.USERS, user.uid));
                if (!userDoc.exists() || userDoc.data().role !== 'admin') {
                    router.push('/login');
                    return;
                }
                setLoading(false);
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/login');
            }
        };

        const unsubscribe = onAuthStateChanged(auth, checkAuth);
        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <ThemeToggle />
            </div>
            {children}
        </>
    );
}
