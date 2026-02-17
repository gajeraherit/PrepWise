'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Users as UsersIcon, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function CandidatesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [candidates, setCandidates] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Step 1: Get all jobs posted by this HR
                const jobsQuery = query(
                    collection(db, Collections.JOBS),
                    where('postedBy', '==', user.uid)
                );
                const jobsSnapshot = await getDocs(jobsQuery);
                const jobIds = jobsSnapshot.docs.map(doc => doc.id);

                // If HR has no jobs, show empty state
                if (jobIds.length === 0) {
                    setCandidates([]);
                    setLoading(false);
                    return;
                }

                // Step 2: Get all applications for these jobs
                const applicationsQuery = query(
                    collection(db, 'applications'),
                    where('jobId', 'in', jobIds)
                );
                const applicationsSnapshot = await getDocs(applicationsQuery);

                // Extract unique candidate IDs
                const candidateIds = new Set<string>();
                applicationsSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.candidateId) {
                        candidateIds.add(data.candidateId);
                    }
                });

                // If no applications, show empty state
                if (candidateIds.size === 0) {
                    setCandidates([]);
                    setLoading(false);
                    return;
                }

                // Step 3: Fetch candidate profiles for these IDs
                // Note: Firestore 'in' queries support max 10 items, so we need to batch if more
                const candidateIdArray = Array.from(candidateIds);
                const candidateData: any[] = [];

                // Process in batches of 10
                for (let i = 0; i < candidateIdArray.length; i += 10) {
                    const batch = candidateIdArray.slice(i, i + 10);
                    const candidatesQuery = query(
                        collection(db, Collections.USERS),
                        where('__name__', 'in', batch)
                    );
                    const candidatesSnapshot = await getDocs(candidatesQuery);
                    candidatesSnapshot.docs.forEach(doc => {
                        candidateData.push({ id: doc.id, ...doc.data() });
                    });
                }

                setCandidates(candidateData);
            } catch (error) {
                console.error('Error loading candidates:', error);
            } finally {
                setLoading(false);
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
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-6xl">
                <Link href="/hr/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>

                <Card className="glass mb-6">
                    <CardHeader>
                        <CardTitle className="text-2xl">Candidate Management</CardTitle>
                        <p className="text-muted-foreground mt-1">View and manage all candidates</p>
                    </CardHeader>
                </Card>

                {candidates.length === 0 ? (
                    <Card className="glass">
                        <CardContent className="p-12 text-center">
                            <UsersIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">No Candidates Yet</h3>
                            <p className="text-muted-foreground">Candidates will appear here once they register</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {candidates.map((candidate) => (
                            <Card key={candidate.id} className="glass card-hover">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="h-12 w-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                                                    {candidate.displayName?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold">{candidate.displayName || 'Unnamed User'}</h3>
                                                    <Badge variant="outline" className="mt-1 capitalize">
                                                        {candidate.experienceLevel || 'Not specified'}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground mt-4">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    <span>{candidate.email}</span>
                                                </div>
                                                {candidate.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4" />
                                                        <span>{candidate.phone}</span>
                                                    </div>
                                                )}
                                                {candidate.skills && candidate.skills.length > 0 && (
                                                    <div className="md:col-span-2">
                                                        <p className="font-medium text-foreground mb-1">Skills:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {candidate.skills.slice(0, 5).map((skill: string, idx: number) => (
                                                                <Badge key={idx} variant="secondary">{skill}</Badge>
                                                            ))}
                                                            {candidate.skills.length > 5 && (
                                                                <Badge variant="secondary">+{candidate.skills.length - 5} more</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/hr/candidates/${candidate.id}`)}
                                        >
                                            View Profile
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
