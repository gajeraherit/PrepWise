'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { jsPDF } from 'jspdf';
import { Loader2, ArrowLeft, TrendingUp, Star, AlertCircle, Lightbulb, Download } from 'lucide-react';
import Link from 'next/link';

export default function FeedbackPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [interview, setInterview] = useState<any>(null);
    const [feedback, setFeedback] = useState<any>(null);
    const [noAnswers, setNoAnswers] = useState(false);

    // ... (existing useEffect) ...

    const downloadPDF = () => {
        if (!interview || !feedback) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let yPos = 20;

        // Title
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0); // Black
        doc.text('Interview Feedback Report', margin, yPos);
        yPos += 15;

        // Job Details
        doc.setFontSize(12);
        doc.setTextColor(100); // Gray
        doc.text(`Role: ${interview.jobRole}`, margin, yPos);
        yPos += 8;
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);
        yPos += 15;

        // Overall Score
        doc.setDrawColor(200);
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 30, 3, 3, 'FD');

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Overall Score', margin + 10, yPos + 12);
        doc.setFontSize(20);
        doc.setTextColor(feedback.overallScore >= 80 ? 34 : 200, feedback.overallScore >= 80 ? 197 : 150, feedback.overallScore >= 80 ? 94 : 50); // Green or Red-ish
        doc.text(`${feedback.overallScore}/100`, margin + 10, yPos + 22);
        yPos += 45;

        // Breakdown
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('Score Breakdown', margin, yPos);
        yPos += 10;

        const scores = [
            { label: 'Communication', score: feedback.communicationScore },
            { label: 'Technical Knowledge', score: feedback.technicalScore },
            { label: 'Problem Solving', score: feedback.problemSolvingScore },
            { label: 'Confidence', score: feedback.confidenceScore },
        ];

        doc.setFontSize(12);
        scores.forEach(item => {
            doc.setTextColor(60);
            doc.text(`${item.label}:`, margin, yPos);
            doc.setTextColor(0);
            doc.text(`${item.score}/100`, 120, yPos);
            yPos += 8;
        });
        yPos += 10;

        // Strengths
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('Key Strengths', margin, yPos);
        yPos += 10;
        doc.setFontSize(11);
        doc.setTextColor(60);
        feedback.strengths.forEach((s: string) => {
            doc.text(`• ${s}`, margin, yPos);
            yPos += 7;
        });
        yPos += 10;

        // Weaknesses
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('Areas for Improvement', margin, yPos);
        yPos += 10;
        doc.setFontSize(11);
        doc.setTextColor(60);
        feedback.weaknesses.forEach((w: string) => {
            doc.text(`• ${w}`, margin, yPos);
            yPos += 7;
        });
        yPos += 10;

        // Recommendations
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('Recommendations', margin, yPos);
        yPos += 10;
        doc.setFontSize(11);
        doc.setTextColor(60);
        feedback.improvementTips.forEach((tip: string) => {
            const splitText = doc.splitTextToSize(`• ${tip}`, pageWidth - (margin * 2));
            doc.text(splitText, margin, yPos);
            yPos += (splitText.length * 7) + 2;
        });

        // Save
        doc.save(`PrepWise-Feedback-${interview.jobRole.replace(/\s+/g, '-')}.pdf`);
    };

    useEffect(() => {
        const loadFeedback = async () => {
            try {
                const interviewDoc = await getDoc(doc(db, Collections.INTERVIEWS, params.id as string));

                if (interviewDoc.exists()) {
                    const interviewData = { id: interviewDoc.id, ...interviewDoc.data() };
                    setInterview(interviewData);

                    // Try to load feedback doc
                    const feedbackDoc = await getDoc(doc(db, Collections.FEEDBACK, params.id as string));
                    if (feedbackDoc.exists()) {
                        const feedbackData = feedbackDoc.data();
                        if (feedbackData.noAnswers) {
                            // Candidate ended without giving any answers
                            setNoAnswers(true);
                        } else {
                            setFeedback(feedbackData);
                        }
                    }
                    // If no feedback doc at all — leave both null (handled in render)
                }
            } catch (error) {
                console.error('Error loading feedback:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            loadFeedback();
        }
    }, [params.id]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!interview || (!feedback && !noAnswers)) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Feedback Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">No feedback available for this interview yet.</p>
                        <Button onClick={() => router.push('/candidate/dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (noAnswers) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            Interview Not Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-2">
                            You ended this interview without answering any questions, so no feedback report was generated.
                        </p>
                        <p className="text-muted-foreground mb-6">
                            Start a new interview and make sure to answer the questions to receive your feedback report.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => router.push('/candidate/dashboard')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                            <Button className="gradient-primary text-white" onClick={() => router.push('/candidate/interview/new')}>
                                Start New Interview
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-5xl">
                <Link href="/candidate/history">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to History
                    </Button>
                </Link>

                {/* Interview Info */}
                <Card className="glass mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl mb-2">{interview.jobRole}</CardTitle>
                                <p className="text-muted-foreground">
                                    {interview.techStack?.join(', ')} • {interview.experienceLevel} level
                                </p>
                            </div>
                            <Button variant="outline" className="gap-2" onClick={downloadPDF}>
                                <Download className="h-4 w-4" />
                                Download PDF
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Overall Score */}
                <Card className="glass mb-6">
                    <CardContent className="p-8 text-center">
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">Overall Score</h3>
                        <div className={`text-6xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                            {feedback.overallScore}
                            <span className="text-2xl">/100</span>
                        </div>
                        <p className="text-muted-foreground mt-2">
                            {feedback.overallScore >= 80 ? 'Excellent Performance!' :
                                feedback.overallScore >= 60 ? 'Good Performance' : 'Needs Improvement'}
                        </p>
                    </CardContent>
                </Card>

                {/* Score Breakdown */}
                <Card className="glass mb-6">
                    <CardHeader>
                        <CardTitle>Score Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: 'Communication', score: feedback.communicationScore },
                            { label: 'Technical Knowledge', score: feedback.technicalScore },
                            { label: 'Problem Solving', score: feedback.problemSolvingScore },
                            { label: 'Confidence', score: feedback.confidenceScore },
                        ].map((item) => (
                            <div key={item.label} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{item.label}</span>
                                    <span className={`font-bold ${getScoreColor(item.score)}`}>{item.score}/100</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${item.score >= 80 ? 'bg-green-500' :
                                            item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${item.score}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Strengths */}
                <Card className="glass mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Strengths
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {feedback.strengths.map((strength: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <Badge variant="outline" className="mt-0.5 bg-green-500/10 text-green-600 border-green-500/20">
                                        ✓
                                    </Badge>
                                    <span>{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Weaknesses */}
                <Card className="glass mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            Areas for Improvement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {feedback.weaknesses.map((weakness: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <Badge variant="outline" className="mt-0.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                        !
                                    </Badge>
                                    <span>{weakness}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Improvement Tips */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-blue-500" />
                            Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {feedback.improvementTips.map((tip: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                                        {idx + 1}
                                    </div>
                                    <span className="flex-1">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
