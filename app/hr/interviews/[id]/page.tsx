'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, FileText, Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function HRInterviewDetailPage() {
    const router = useRouter();
    const params = useParams();
    const interviewId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [interview, setInterview] = useState<any>(null);
    const [feedback, setFeedback] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Load interview
                const interviewDoc = await getDoc(doc(db, Collections.INTERVIEWS, interviewId));
                if (interviewDoc.exists()) {
                    setInterview({ id: interviewDoc.id, ...interviewDoc.data() });

                    // Load feedback if available
                    const feedbackDoc = await getDoc(doc(db, Collections.FEEDBACK, interviewId));
                    if (feedbackDoc.exists()) {
                        setFeedback(feedbackDoc.data());
                    }
                }
            } catch (error) {
                console.error('Error loading interview:', error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [interviewId, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!interview) {
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
                            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">Interview Not Found</h3>
                            <p className="text-muted-foreground">The interview could not be found.</p>
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

                {/* Interview Header */}
                <Card className="glass mb-6">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl mb-2">{interview.jobRole || 'Interview'}</CardTitle>
                                <p className="text-muted-foreground">
                                    {interview.techStack?.join(', ')} • {interview.experienceLevel} level
                                </p>
                            </div>
                            <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                                {interview.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{interview.candidateName || interview.candidateEmail}</span>
                            </div>
                            {interview.createdAt && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(interview.createdAt.seconds * 1000).toLocaleDateString()}</span>
                                </div>
                            )}
                            {interview.duration && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{interview.duration} minutes</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Video Recording */}
                {interview.recordingUrl && (
                    <Card className="glass mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Interview Recording
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <video
                                controls
                                className="w-full rounded-lg bg-black"
                                style={{ maxHeight: '500px' }}
                            >
                                <source src={interview.recordingUrl} type="video/webm" />
                                Your browser does not support video playback.
                            </video>

                            {/* Violation Log */}
                            {interview.violations && interview.violations.length > 0 && (
                                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                                    <h4 className="font-semibold mb-2 text-sm">Proctoring Violations ({interview.violations.length})</h4>
                                    <div className="space-y-1 text-sm text-muted-foreground max-h-40 overflow-y-auto">
                                        {interview.violations.map((violation: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <Badge variant="destructive" className="text-xs">
                                                    {violation.type.replace(/_/g, ' ')}
                                                </Badge>
                                                <span className="text-xs">
                                                    {violation.timestamp?.seconds
                                                        ? new Date(violation.timestamp.seconds * 1000).toLocaleTimeString()
                                                        : 'Unknown time'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Questions & Answers */}
                {interview.transcript && interview.transcript.length > 0 && (
                    <Card className="glass mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Interview Transcript
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {interview.transcript.map((item: any, idx: number) => (
                                    <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                                        <p className="font-semibold mb-2">Q{idx + 1}: {item.question}</p>
                                        <p className="text-muted-foreground">{item.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Feedback/Scores */}
                {feedback && (
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Performance Feedback
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Overall Score */}
                                {feedback.overallScore && (
                                    <div className="text-center p-6 bg-accent/10 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                                        <p className="text-4xl font-bold text-primary">{feedback.overallScore}%</p>
                                    </div>
                                )}

                                {/* Category Scores */}
                                {feedback.communicationScore && (
                                    <div className="grid md:grid-cols-4 gap-4">
                                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">Communication</p>
                                            <p className="text-2xl font-bold">{feedback.communicationScore}%</p>
                                        </div>
                                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">Technical</p>
                                            <p className="text-2xl font-bold">{feedback.technicalScore}%</p>
                                        </div>
                                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">Problem Solving</p>
                                            <p className="text-2xl font-bold">{feedback.problemSolvingScore}%</p>
                                        </div>
                                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                                            <p className="text-2xl font-bold">{feedback.confidenceScore}%</p>
                                        </div>
                                    </div>
                                )}

                                {/* Strengths */}
                                {feedback.strengths && feedback.strengths.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            Strengths
                                        </h4>
                                        <ul className="space-y-2">
                                            {feedback.strengths.map((strength: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm">
                                                    <span className="text-green-500 mt-1">•</span>
                                                    <span>{strength}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Weaknesses */}
                                {feedback.weaknesses && feedback.weaknesses.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <XCircle className="h-4 w-4 text-orange-500" />
                                            Areas for Improvement
                                        </h4>
                                        <ul className="space-y-2">
                                            {feedback.weaknesses.map((weakness: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm">
                                                    <span className="text-orange-500 mt-1">•</span>
                                                    <span>{weakness}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* AI Analysis */}
                                {feedback.aiAnalysis && (
                                    <div className="bg-muted/30 rounded-lg p-4">
                                        <h4 className="font-semibold mb-2">AI Analysis</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback.aiAnalysis}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* No feedback message */}
                {interview.status === 'completed' && !feedback && (
                    <Card className="glass">
                        <CardContent className="p-12 text-center">
                            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">Feedback is being generated...</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
