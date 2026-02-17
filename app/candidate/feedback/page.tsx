'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function FeedbackListPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);

    useEffect(() => {
        const loadFeedbacks = async () => {
            const user = auth.currentUser;
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Query for COMPLETED interviews only
                const q = query(
                    collection(db, Collections.INTERVIEWS),
                    where('candidateId', '==', user.uid),
                    where('status', '==', 'completed')
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Sort by createdAt (newest first)
                data.sort((a: any, b: any) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return bTime - aTime;
                });

                setFeedbacks(data);
            } catch (error) {
                console.error('Error loading feedback:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFeedbacks();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto max-w-5xl">
                <Card className="glass mb-8">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Interview Feedback</CardTitle>
                                <p className="text-muted-foreground mt-1">Review detailed performance reports for your completed interviews</p>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {feedbacks.length === 0 ? (
                    <Card className="glass">
                        <CardContent className="p-12 text-center">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">No Feedback Available</h3>
                            <p className="text-muted-foreground mb-6">
                                Complete an interview to generate a feedback report.
                            </p>
                            <Link href="/candidate/interview/new">
                                <Button className="gradient-primary text-white">
                                    Start New Interview
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {feedbacks.map((item) => (
                            <Card key={item.id} className="glass card-hover hover:border-primary/50 cursor-pointer" onClick={() => router.push(`/candidate/feedback/${item.id}`)}>
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">{item.jobRole}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{item.jobDescription?.substring(0, 50)}...</p>
                                        </div>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            Completed
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground mb-6">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>{item.createdAt ? formatDate(new Date(item.createdAt.seconds * 1000)) : 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            <span>{item.questions?.length || 0} Questions Answered</span>
                                        </div>
                                    </div>

                                    <Button className="w-full" variant="outline">
                                        View Full Report
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
