'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections, User as UserType } from '@/lib/firebase/schema';
import { Loader2 } from 'lucide-react';
import { CandidateSidebar } from '@/components/candidate-sidebar';

export default function CandidateDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserType | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                router.push('/login');
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, Collections.USERS, firebaseUser.uid));

                if (!userDoc.exists()) {
                    router.push('/login');
                    return;
                }

                const userData = userDoc.data() as UserType;

                if (userData.role !== 'candidate') {
                    // Redirect to appropriate dashboard
                    if (userData.role === 'hr') {
                        router.push('/hr/dashboard');
                    } else if (userData.role === 'admin') {
                        router.push('/admin/dashboard');
                    }
                    return;
                }

                setUser(userData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user:', error);
                router.push('/login');
            }
        });

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
        <div className="min-h-screen bg-background flex">
            <CandidateSidebar />
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
