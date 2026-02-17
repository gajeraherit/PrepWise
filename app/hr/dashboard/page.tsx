'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, FileText, TrendingUp, Plus } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Link from 'next/link';

export default function HRDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeCandidates: 0,
        completedInterviews: 0,
        pendingReviews: 0,
    });
    const [recentJobs, setRecentJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Get HR's jobs
                const jobsQuery = query(
                    collection(db, Collections.JOBS),
                    where('postedBy', '==', user.uid)
                );
                const jobsSnapshot = await getDocs(jobsQuery);
                const totalJobs = jobsSnapshot.size;
                const jobIds = jobsSnapshot.docs.map(doc => doc.id);

                // Get recent jobs for display
                const recentJobsList = jobsSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .slice(0, 5); // Show 5 most recent
                setRecentJobs(recentJobsList);

                // Count active candidates (unique candidates who applied to HR's jobs)
                let activeCandidates = 0;
                if (jobIds.length > 0) {
                    // Batch job IDs in groups of 10 for Firestore 'in' query limit
                    const batches = [];
                    for (let i = 0; i < jobIds.length; i += 10) {
                        const batch = jobIds.slice(i, i + 10);
                        const applicationsQuery = query(
                            collection(db, Collections.APPLICATIONS),
                            where('jobId', 'in', batch)
                        );
                        batches.push(getDocs(applicationsQuery));
                    }

                    const applicationsSnapshots = await Promise.all(batches);
                    const uniqueCandidates = new Set();
                    applicationsSnapshots.forEach(snapshot => {
                        snapshot.docs.forEach(doc => {
                            uniqueCandidates.add(doc.data().candidateId);
                        });
                    });
                    activeCandidates = uniqueCandidates.size;
                }

                // Count completed interviews for HR's jobs
                let completedInterviews = 0;
                if (jobIds.length > 0) {
                    const batches = [];
                    for (let i = 0; i < jobIds.length; i += 10) {
                        const batch = jobIds.slice(i, i + 10);
                        const interviewsQuery = query(
                            collection(db, Collections.INTERVIEWS),
                            where('jobId', 'in', batch),
                            where('status', '==', 'completed')
                        );
                        batches.push(getDocs(interviewsQuery));
                    }

                    const interviewsSnapshots = await Promise.all(batches);
                    completedInterviews = interviewsSnapshots.reduce((sum, snapshot) => sum + snapshot.size, 0);
                }

                // Count pending reviews (completed interviews without feedback)
                let pendingReviews = 0;
                if (completedInterviews > 0) {
                    // Get all completed interview IDs
                    const completedInterviewIds: string[] = [];
                    if (jobIds.length > 0) {
                        const batches = [];
                        for (let i = 0; i < jobIds.length; i += 10) {
                            const batch = jobIds.slice(i, i + 10);
                            const interviewsQuery = query(
                                collection(db, Collections.INTERVIEWS),
                                where('jobId', 'in', batch),
                                where('status', '==', 'completed')
                            );
                            batches.push(getDocs(interviewsQuery));
                        }

                        const interviewsSnapshots = await Promise.all(batches);
                        interviewsSnapshots.forEach(snapshot => {
                            snapshot.docs.forEach(doc => completedInterviewIds.push(doc.id));
                        });
                    }

                    // Check which ones don't have feedback
                    for (const interviewId of completedInterviewIds) {
                        const feedbackDoc = await getDoc(doc(db, Collections.FEEDBACK, interviewId));
                        if (!feedbackDoc.exists()) {
                            pendingReviews++;
                        }
                    }
                }

                setStats({
                    totalJobs,
                    activeCandidates,
                    completedInterviews,
                    pendingReviews,
                });
            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/login');
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">HR Dashboard</h1>
                        <p className="text-muted-foreground">Manage jobs, candidates, and interviews</p>
                    </div>
                    <Button variant="outline" onClick={handleSignOut}>
                        Sign Out
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="glass">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Jobs</p>
                                    <p className="text-3xl font-bold mt-1">{stats.totalJobs}</p>
                                </div>
                                <Briefcase className="h-10 w-10 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Candidates</p>
                                    <p className="text-3xl font-bold mt-1">{stats.activeCandidates}</p>
                                </div>
                                <Users className="h-10 w-10 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Completed Interviews</p>
                                    <p className="text-3xl font-bold mt-1">{stats.completedInterviews}</p>
                                </div>
                                <FileText className="h-10 w-10 text-blue-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending Reviews</p>
                                    <p className="text-3xl font-bold mt-1">{stats.pendingReviews}</p>
                                </div>
                                <TrendingUp className="h-10 w-10 text-yellow-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card className="glass mb-8">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Link href="/hr/jobs/new">
                                <Button className="w-full gradient-primary text-white h-20 text-lg">
                                    <Plus className="mr-2 h-5 w-5" />
                                    Post New Job
                                </Button>
                            </Link>
                            <Link href="/hr/candidates">
                                <Button variant="outline" className="w-full h-20 text-lg">
                                    <Users className="mr-2 h-5 w-5" />
                                    View Candidates
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Recent Job Postings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>Loading...</p>
                            </div>
                        ) : recentJobs.length > 0 ? (
                            <div className="space-y-4">
                                {recentJobs.map((job: any) => (
                                    <Link key={job.id} href={`/hr/jobs/${job.id}`}>
                                        <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                                            <h3 className="font-semibold mb-1">{job.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-2">{job.location} • {job.type}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {job.techStack?.slice(0, 3).map((tech: string, idx: number) => (
                                                    <span key={idx} className="text-xs px-2 py-1 bg-primary/10 rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                                {job.techStack?.length > 3 && (
                                                    <span className="text-xs px-2 py-1 bg-muted rounded">
                                                        +{job.techStack.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No job postings yet</p>
                                <Link href="/hr/jobs/new" className="inline-block mt-4">
                                    <Button className="gradient-primary text-white">Create Your First Job</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
