'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, User, Mail, Phone, MapPin, Briefcase, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';

// HR Candidate Detail Page - View candidate profile with authorization

export default function CandidateDetailPage() {
    const router = useRouter();
    const params = useParams();
    const candidateId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [candidate, setCandidate] = useState<any>(null);
    const [interviews, setInterviews] = useState<any[]>([]);
    const [unauthorized, setUnauthorized] = useState(false);

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

                // Step 2: Check if this candidate has applied to any of the HR's jobs
                if (jobIds.length > 0) {
                    const applicationsQuery = query(
                        collection(db, 'applications'),
                        where('candidateId', '==', candidateId),
                        where('jobId', 'in', jobIds)
                    );
                    const applicationsSnapshot = await getDocs(applicationsQuery);

                    // If candidate hasn't applied to any of HR's jobs, unauthorized
                    if (applicationsSnapshot.empty) {
                        setUnauthorized(true);
                        setLoading(false);
                        return;
                    }
                } else {
                    // HR has no jobs, so unauthorized to view any candidate
                    setUnauthorized(true);
                    setLoading(false);
                    return;
                }

                // Step 3: Load candidate profile (authorized)
                const candidateDoc = await getDoc(doc(db, Collections.USERS, candidateId));
                if (candidateDoc.exists()) {
                    setCandidate({ id: candidateDoc.id, ...candidateDoc.data() });
                }

                // Step 4: Load candidate's interviews related to HR's jobs
                const interviewsQuery = query(
                    collection(db, Collections.INTERVIEWS),
                    where('candidateId', '==', candidateId),
                    where('jobId', 'in', jobIds)
                );
                const interviewsSnapshot = await getDocs(interviewsQuery);
                const interviewsData = interviewsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setInterviews(interviewsData);
            } catch (error) {
                console.error('Error loading candidate data:', error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [candidateId, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (unauthorized) {
        return (
            <div className="min-h-screen p-4 md:p-8">
                <div className="container mx-auto max-w-4xl">
                    <Link href="/hr/candidates">
                        <Button variant="ghost" className="mb-6">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Candidates
                        </Button>
                    </Link>
                    <Card className="glass">
                        <CardContent className="p-12 text-center">
                            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
                            <p className="text-muted-foreground">
                                You can only view candidates who have applied to your job postings.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="min-h-screen p-4 md:p-8">
                <div className="container mx-auto max-w-4xl">
                    <Link href="/hr/candidates">
                        <Button variant="ghost" className="mb-6">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Candidates
                        </Button>
                    </Link>
                    <Card className="glass">
                        <CardContent className="p-12 text-center">
                            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">Candidate Not Found</h3>
                            <p className="text-muted-foreground">The requested candidate profile could not be found.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-4xl">
                <Link href="/hr/candidates">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Candidates
                    </Button>
                </Link>

                {/* Profile Header */}
                <Card className="glass mb-6">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                            <div className="h-20 w-20 gradient-primary rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                                {candidate.displayName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-3xl font-bold mb-2">{candidate.displayName || 'Unnamed User'}</h1>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Badge variant="outline" className="capitalize">
                                                {candidate.experienceLevel || 'Not specified'}
                                            </Badge>
                                            <Badge variant="secondary">
                                                {candidate.role || 'candidate'}
                                            </Badge>
                                        </div>
                                    </div>
                                    {candidate.resumeUrl && (
                                        <Button
                                            variant="outline"
                                            className="gap-2"
                                            onClick={() => window.open(candidate.resumeUrl, '_blank')}
                                        >
                                            <FileText className="h-4 w-4" />
                                            Download Resume
                                        </Button>
                                    )}
                                </div>
                                <div className="grid md:grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span>{candidate.email}</span>
                                    </div>
                                    {candidate.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            <span>{candidate.phone}</span>
                                        </div>
                                    )}
                                    {candidate.location && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            <span>{candidate.location}</span>
                                        </div>
                                    )}
                                    {candidate.createdAt && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>Joined {new Date(candidate.createdAt.seconds * 1000).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Skills Section */}
                {candidate.skills && candidate.skills.length > 0 && (
                    <Card className="glass mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5" />
                                Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {candidate.skills.map((skill: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-sm">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Interview History */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Interview History ({interviews.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {interviews.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No interviews completed yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {interviews.map((interview) => (
                                    <div
                                        key={interview.id}
                                        className="p-4 border border-border rounded-lg hover:bg-accent/10 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold mb-1">
                                                    {interview.jobRole || 'Interview'}
                                                </h4>
                                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                                    <span>
                                                        {interview.createdAt &&
                                                            new Date(interview.createdAt.seconds * 1000).toLocaleDateString()
                                                        }
                                                    </span>
                                                    {interview.score && (
                                                        <Badge variant="outline">
                                                            Score: {interview.score}%
                                                        </Badge>
                                                    )}
                                                    <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                                                        {interview.status || 'pending'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/hr/interviews/${interview.id}`)}
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
