'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Briefcase, MapPin, Clock, TrendingUp, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function JobsListPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);

    const handleDeleteJob = async (jobId: string) => {
        if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteDoc(doc(db, Collections.JOBS, jobId));
            setJobs(jobs.filter(job => job.id !== jobId));
            toast.success('Job deleted successfully');
        } catch (error) {
            console.error('Error deleting job:', error);
            toast.error('Failed to delete job');
        }
    };

    useEffect(() => {
        const loadJobs = async () => {
            const user = auth.currentUser;
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                const q = query(
                    collection(db, Collections.JOBS),
                    where('postedBy', '==', user.uid)
                );

                const snapshot = await getDocs(q);
                const jobData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Sort by createdAt client-side
                jobData.sort((a: any, b: any) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return bTime - aTime;
                });

                setJobs(jobData);
            } catch (error) {
                console.error('Error loading jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        loadJobs();
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
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">Job Postings</CardTitle>
                                <p className="text-muted-foreground mt-1">Manage all your job listings</p>
                            </div>
                            <Link href="/hr/jobs/new">
                                <Button className="gradient-primary text-white">
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    Post New Job
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                </Card>

                {jobs.length === 0 ? (
                    <Card className="glass">
                        <CardContent className="p-12 text-center">
                            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">No Jobs Posted Yet</h3>
                            <p className="text-muted-foreground mb-6">
                                Create your first job posting to start attracting candidates
                            </p>
                            <Link href="/hr/jobs/new">
                                <Button className="gradient-primary text-white">
                                    Post Your First Job
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <Card key={job.id} className="glass card-hover">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h3 className="text-xl font-semibold">{job.title}</h3>
                                                <Badge variant="outline" className="capitalize bg-green-500/10 text-green-600">
                                                    {job.status || 'active'}
                                                </Badge>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground mb-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{job.location}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="capitalize">{job.jobType?.replace('-', ' ')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4" />
                                                    <span>{job.techStack?.join(', ')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary">{job.experienceLevel} level</Badge>
                                                </div>
                                            </div>

                                            <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                                        </div>

                                        <div className="flex flex-col gap-2 ml-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/hr/jobs/${job.id}`)}
                                            >
                                                View Details
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                View Applicants
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteJob(job.id)}
                                                className="mt-2"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Job
                                            </Button>
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
