'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Briefcase, MapPin, Clock, TrendingUp, CheckCircle, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function BrowseJobsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);
    const [appliedJobs, setAppliedJobs] = useState<Map<string, any>>(new Map());
    const [applying, setApplying] = useState<string | null>(null);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        const user = auth.currentUser;
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            // Load all active jobs
            const q = query(
                collection(db, Collections.JOBS),
                where('status', '==', 'active')
            );

            const snapshot = await getDocs(q);
            const jobData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Sort by createdAt (newest first)
            jobData.sort((a: any, b: any) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            });

            setJobs(jobData);

            // Load user's applications to check which jobs they've applied to
            const applicationsQuery = query(
                collection(db, 'applications'),
                where('candidateId', '==', user.uid)
            );
            const applicationsSnapshot = await getDocs(applicationsQuery);
            const appliedMap = new Map();
            applicationsSnapshot.forEach(doc => {
                const data = doc.data();
                appliedMap.set(data.jobId, { id: doc.id, ...data });
            });
            setAppliedJobs(appliedMap);
        } catch (error) {
            console.error('Error loading jobs:', error);
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (jobId: string, jobTitle: string) => {
        const user = auth.currentUser;
        if (!user) return;

        setApplying(jobId);
        try {
            const docRef = await addDoc(collection(db, 'applications'), {
                jobId,
                candidateId: user.uid,
                candidateEmail: user.email,
                status: 'pending',
                appliedAt: new Date(),
            });

            const newMap = new Map(appliedJobs);
            newMap.set(jobId, {
                id: docRef.id,
                jobId,
                candidateId: user.uid,
                status: 'pending'
            });
            setAppliedJobs(newMap);

            toast.success(`Successfully applied to ${jobTitle}!`);
        } catch (error) {
            console.error('Error applying to job:', error);
            toast.error('Failed to apply. Please try again.');
        } finally {
            setApplying(null);
        }
    };

    const handleStartInterview = async (job: any) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            // Create interview session
            const interviewData = {
                candidateId: user.uid,
                jobId: job.id,
                jobRole: job.title,
                techStack: job.techStack || [],
                experienceLevel: job.experienceLevel || 'mid',
                status: 'scheduled',
                createdAt: new Date(),
                completedAt: null,
                score: 0,
                feedback: null,
            };

            const docRef = await addDoc(collection(db, Collections.INTERVIEWS), interviewData);
            router.push(`/candidate/interview/${docRef.id}`);
        } catch (error) {
            console.error('Error starting interview:', error);
            toast.error('Failed to start interview');
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
            <div className="container mx-auto max-w-6xl">
                <Link href="/candidate/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>

                <Card className="glass mb-6">
                    <CardHeader>
                        <CardTitle className="text-2xl">Browse Jobs</CardTitle>
                        <p className="text-muted-foreground mt-1">Find and apply to exciting opportunities</p>
                    </CardHeader>
                </Card>

                {jobs.length === 0 ? (
                    <Card className="glass">
                        <CardContent className="p-12 text-center">
                            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">No Jobs Available</h3>
                            <p className="text-muted-foreground">Check back later for new opportunities</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job) => {
                            const application = appliedJobs.get(job.id);
                            const hasApplied = !!application;
                            const isApplying = applying === job.id;

                            return (
                                <Card key={job.id} className="glass card-hover">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-xl font-semibold">{job.title}</h3>
                                                    {hasApplied && (
                                                        <Badge className="bg-green-500 text-white">
                                                            <CheckCircle className="mr-1 h-3 w-3" />
                                                            Applied
                                                        </Badge>
                                                    )}
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

                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{job.description}</p>

                                                {job.requirements && job.requirements.length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-sm font-medium mb-2">Requirements:</p>
                                                        <ul className="text-sm text-muted-foreground space-y-1">
                                                            {job.requirements.slice(0, 3).map((req: string, idx: number) => (
                                                                <li key={idx} className="flex items-start gap-2">
                                                                    <span className="text-primary mt-1">•</span>
                                                                    <span>{req}</span>
                                                                </li>
                                                            ))}
                                                            {job.requirements.length > 3 && (
                                                                <li className="text-xs italic">+ {job.requirements.length - 3} more requirements</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="ml-4 flex flex-col gap-2">
                                                {!hasApplied ? (
                                                    <Button
                                                        className="gradient-primary text-white"
                                                        onClick={() => handleApply(job.id, job.title)}
                                                        disabled={isApplying}
                                                    >
                                                        {isApplying ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Applying...
                                                            </>
                                                        ) : (
                                                            'Apply Now'
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                        onClick={() => handleStartInterview(job)}
                                                    >
                                                        <PlayCircle className="mr-2 h-4 w-4" />
                                                        Start Interview
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
