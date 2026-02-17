'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Calendar, Clock, TrendingUp, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function InterviewHistoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [interviews, setInterviews] = useState<any[]>([]);

    useEffect(() => {
        const loadInterviews = async () => {
            const user = auth.currentUser;
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                const q = query(
                    collection(db, Collections.INTERVIEWS),
                    where('candidateId', '==', user.uid)
                );

                const snapshot = await getDocs(q);
                const interviewData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Sort by createdAt client-side (newest first)
                interviewData.sort((a: any, b: any) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return bTime - aTime;
                });

                setInterviews(interviewData);
            } catch (error) {
                console.error('Error loading interviews:', error);
            } finally {
                setLoading(false);
            }
        };

        loadInterviews();
    }, [router]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'in-progress': return 'bg-blue-500';
            case 'ready': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-5xl">
                <Link href="/candidate/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>

                <Card className="glass mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">Interview History</CardTitle>
                                <p className="text-muted-foreground mt-1">View all your past interview sessions</p>
                            </div>
                            <Link href="/candidate/interview/new">
                                <Button className="gradient-primary text-white">
                                    New Interview
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                </Card>

                {interviews.length === 0 ? (
                    <Card className="glass">
                        <CardContent className="p-12 text-center">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">No Interviews Yet</h3>
                            <p className="text-muted-foreground mb-6">
                                Start your first interview to begin tracking your progress
                            </p>
                            <Link href="/candidate/interview/new">
                                <Button className="gradient-primary text-white">
                                    Create Your First Interview
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {interviews.map((interview) => (
                            <Card key={interview.id} className="glass card-hover">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h3 className="text-xl font-semibold">{interview.jobRole}</h3>
                                                <Badge className={`${getStatusColor(interview.status)} text-white capitalize`}>
                                                    {interview.status}
                                                </Badge>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4" />
                                                    <span>Tech Stack: {interview.techStack?.join(', ') || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{interview.duration} minutes • {interview.experienceLevel} level</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Created: {interview.createdAt ? formatDate(new Date(interview.createdAt.seconds * 1000)) : 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <span>{interview.questions?.length || 0} questions</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 ml-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/candidate/interview/${interview.id}`)}
                                            >
                                                View Details
                                            </Button>
                                            {interview.status === 'completed' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-green-600"
                                                    onClick={() => router.push(`/candidate/feedback/${interview.id}`)}
                                                >
                                                    View Feedback
                                                </Button>
                                            )}
                                        </div>
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
