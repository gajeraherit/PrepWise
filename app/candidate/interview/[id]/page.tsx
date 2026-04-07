'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Loader2, ArrowLeft, Mic, MicOff, PhoneOff, Sparkles,
    Volume2, CheckCircle2, Radio,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useProctoring } from '@/hooks/useProctoring';
import { ProctoringPanel } from '@/components/interview/ProctoringPanel';
import { ViolationWarning } from '@/components/interview/ViolationWarning';
import { useVapi } from '@/hooks/useVapi';
import { buildVapiStartArgs, parseVapiTranscript } from '@/lib/ai/vapi';

export default function InterviewPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();

    // ── Interview state ──────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [generatingQuestions, setGeneratingQuestions] = useState(false);
    const [interview, setInterview] = useState<any>(null);
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [showViolationWarning, setShowViolationWarning] = useState(false);

    // ── Proctoring ───────────────────────────────────────────────────
    const proctoring = useProctoring({
        interviewId: params.id as string,
        onViolation: () => {
            setShowViolationWarning(true);
            setTimeout(() => setShowViolationWarning(false), 4000);
        },
        maxViolations: 3,
        onMaxViolationsReached: () => {
            vapi.stopCall();
        },
    });

    // ── Vapi ─────────────────────────────────────────────────────────
    const handleCallEnd = useCallback(
        async (messages: { role: string; content: string }[]) => {
            if (!interview) return;
            await finishInterview(messages);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [interview]
    );

    const vapi = useVapi({
        onCallEnd: handleCallEnd,
        onError: (err) => {
            toast({
                title: 'Vapi Error',
                description: err.message,
                variant: 'destructive',
            });
        },
    });

    // ── Load interview ───────────────────────────────────────────────
    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const interviewId = params.id as string;
                const interviewDoc = await getDoc(doc(db, Collections.INTERVIEWS, interviewId));

                if (interviewDoc.exists()) {
                    const data = { id: interviewDoc.id, ...interviewDoc.data() } as any;
                    setInterview(data);

                    if (!data.questions || data.questions.length === 0) {
                        await generateQuestions(interviewId, data);
                    }
                }
            } catch (error) {
                console.error('Error fetching interview:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchInterview();
    }, [params.id]);

    // ── Generate questions ───────────────────────────────────────────
    const generateQuestions = async (interviewId: string, interviewData: any) => {
        setGeneratingQuestions(true);
        try {
            const response = await fetch('/api/interviews/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    interviewId,
                    jobRole: interviewData.jobRole,
                    techStack: interviewData.techStack,
                    experienceLevel: interviewData.experienceLevel,
                    duration: interviewData.duration,
                }),
            });

            if (response.ok) {
                const { questions } = await response.json();
                setInterview({ ...interviewData, questions, status: 'ready' });
                toast({
                    title: 'Questions Generated!',
                    description: `${questions.length} questions ready for your interview.`,
                });
            } else {
                throw new Error('Failed to generate questions');
            }
        } catch (error) {
            console.error('Error generating questions:', error);
            toast({
                title: 'Error',
                description: 'Failed to generate questions. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setGeneratingQuestions(false);
        }
    };

    // ── Start interview (proctoring + Vapi) ─────────────────────────
    const startInterview = async () => {
        try {
            const stream = await proctoring.requestPermissions();

            if (!stream) {
                toast({
                    title: 'Camera/Microphone Required',
                    description: 'Please allow camera and microphone access to start the interview.',
                    variant: 'destructive',
                });
                return;
            }

            proctoring.enterFullscreen();
            proctoring.startRecording();

            await updateDoc(doc(db, Collections.INTERVIEWS, params.id as string), {
                status: 'in-progress',
                startedAt: new Date(),
            });

            setInterview((prev: any) => ({ ...prev, status: 'in-progress' }));
            setInterviewStarted(true);

            // Build Vapi start args: [assistantId, overrides]
            const [assistantId, overrides] = buildVapiStartArgs({
                jobRole: interview.jobRole,
                techStack: interview.techStack,
                experienceLevel: interview.experienceLevel,
                duration: interview.duration,
                questions: interview.questions,
            });

            // Start Vapi call with assistant ID + dynamic overrides
            await vapi.startCall(assistantId, overrides);
        } catch (error) {
            console.error('Error starting interview:', error);
            toast({
                title: 'Error',
                description: 'Failed to start interview. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // ── End call manually ────────────────────────────────────────────
    const endCallManually = () => {
        vapi.stopCall();
    };

    // ── Finish interview (after Vapi call ends) ──────────────────────
    const finishInterview = async (vapiMessages: { role: string; content: string }[]) => {
        const interviewId = params.id as string;

        // ── Guard: did the candidate actually speak? ─────────────────
        const userMessages = vapiMessages.filter((m) => m.role === 'user');
        if (userMessages.length === 0) {
            proctoring.stopRecording();
            proctoring.exitFullscreen();

            // Mark as cancelled (not completed) — no answers were given
            try {
                await updateDoc(doc(db, Collections.INTERVIEWS, interviewId), {
                    status: 'cancelled',
                    completedAt: new Date(),
                });
            } catch { /* ignore */ }

            toast({
                title: 'No Answers Recorded',
                description: "You didn't answer any questions. The interview was not submitted.",
                variant: 'destructive',
            });
            setTimeout(() => router.push('/candidate/dashboard'), 2500);
            return;
        }

        try {
            const videoBlob = await proctoring.stopRecording();
            proctoring.exitFullscreen();

            let recordingUrl = '';

            if (videoBlob) {
                toast({ title: 'Processing...', description: 'Uploading interview recording...' });
                try {
                    const formData = new FormData();
                    formData.append('video', videoBlob, 'recording.webm');
                    formData.append('interviewId', interviewId);

                    const uploadResponse = await fetch('/api/upload-video', {
                        method: 'POST',
                        body: formData,
                    });

                    if (uploadResponse.ok) {
                        const data = await uploadResponse.json();
                        recordingUrl = data.url;
                    }
                } catch (uploadError) {
                    console.error('Error uploading video:', uploadError);
                }
            }

            // Parse Vapi transcript into our Q&A format
            const finalTranscript = parseVapiTranscript(
                vapiMessages as { role: string; content: string }[],
                interview.questions || []
            );

            // Mark interview as completed
            await updateDoc(doc(db, Collections.INTERVIEWS, interviewId), {
                status: 'completed',
                completedAt: new Date(),
                transcript: finalTranscript,
                ...(recordingUrl && { recordingUrl }),
            });

            toast({
                title: 'Interview Completed!',
                description: 'Generating your feedback report...',
            });

            // Generate AI feedback based on actual answers
            try {
                await fetch('/api/interviews/generate-feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        interviewId,
                        candidateId: interview.candidateId,
                        transcript: finalTranscript,
                        jobRole: interview.jobRole,
                        techStack: interview.techStack,
                        experienceLevel: interview.experienceLevel,
                    }),
                });
            } catch (feedbackErr) {
                console.error('Feedback generation error (non-fatal):', feedbackErr);
            }

            toast({
                title: 'Feedback Ready!',
                description: 'Redirecting to your feedback report...',
            });

            setTimeout(() => router.push(`/candidate/feedback/${interviewId}`), 2000);

        } catch (error) {
            console.error('Error finishing interview:', error);

            try {
                await updateDoc(doc(db, Collections.INTERVIEWS, interviewId), {
                    status: 'completed',
                    completedAt: new Date(),
                });
            } catch { /* ignore */ }

            toast({
                title: 'Interview Ended',
                description: 'Redirecting to your feedback...',
            });
            setTimeout(() => router.push(`/candidate/feedback/${interviewId}`), 2000);
        }
    };

    // ── Helpers ──────────────────────────────────────────────────────
    const isInterviewActive = interview?.status === 'in-progress';
    const isInterviewReady =
        interview?.status === 'ready' ||
        (interview?.questions && interview.questions.length > 0);

    const answeredCount = vapi.messages.filter((m) => m.role === 'user').length;
    const totalQuestions = interview?.questions?.length || 0;

    // ── Loading ──────────────────────────────────────────────────────
    if (loading || generatingQuestions) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">
                    {generatingQuestions ? 'Generating AI questions...' : 'Loading interview...'}
                </p>
            </div>
        );
    }

    if (!interview) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Interview Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            The interview you're looking for doesn't exist or has been deleted.
                        </p>
                        <Button onClick={() => router.push('/candidate/dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ── Render ───────────────────────────────────────────────────────
    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-5xl">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/candidate/dashboard')}
                    className="mb-6"
                    disabled={vapi.isCalling}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                {/* Interview Header */}
                <Card className="glass mb-6">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl mb-2">{interview.jobRole}</CardTitle>
                                <p className="text-muted-foreground">
                                    {interview.techStack?.join(', ')} • {interview.experienceLevel} level •{' '}
                                    {interview.duration} min
                                </p>
                            </div>
                            <Badge
                                variant={vapi.isCalling ? 'default' : 'secondary'}
                                className="capitalize"
                            >
                                {vapi.callStatus === 'connecting'
                                    ? 'Connecting...'
                                    : vapi.callStatus === 'active'
                                        ? 'Live'
                                        : interview.status}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Ready State */}
                {!interviewStarted && isInterviewReady && (
                    <Card className="glass">
                        <CardContent className="p-8 text-center">
                            <div className="h-20 w-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="h-10 w-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Ready to Start Your Interview?</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                {totalQuestions} AI-generated questions are ready. The interview will be conducted
                                by an AI voice interviewer powered by Vapi.
                            </p>

                            <div className="bg-muted/30 rounded-lg p-4 mb-6 max-w-md mx-auto text-left">
                                <h4 className="font-semibold mb-2">How it works:</h4>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li>🎙️ An AI interviewer will speak each question aloud</li>
                                    <li>💬 Answer by speaking naturally — Vapi transcribes in real-time</li>
                                    <li>✅ The interviewer moves to the next question automatically</li>
                                    <li>📊 Feedback is generated after the interview ends</li>
                                </ul>
                            </div>

                            <Button
                                onClick={startInterview}
                                size="lg"
                                className="gradient-primary text-white"
                                disabled={vapi.callStatus === 'connecting'}
                            >
                                {vapi.callStatus === 'connecting' ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Connecting to AI Interviewer...
                                    </>
                                ) : (
                                    <>
                                        <Mic className="mr-2 h-5 w-5" />
                                        Start Interview with AI
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Active Vapi Interview */}
                {interviewStarted && vapi.callStatus !== 'ended' && (
                    <div className="space-y-6">
                        {/* Progress */}
                        <Card className="glass">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">
                                        Questions Answered: {answeredCount} / {totalQuestions}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {totalQuestions > 0
                                            ? Math.round((answeredCount / totalQuestions) * 100)
                                            : 0}
                                        % Complete
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="gradient-primary h-2 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${totalQuestions > 0
                                                ? (answeredCount / totalQuestions) * 100
                                                : 0
                                                }%`,
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vapi Voice UI */}
                        <Card className="glass">
                            <CardContent className="p-8">
                                <div className="text-center mb-8">
                                    {/* AI Interviewer Avatar */}
                                    <div className="relative inline-block mb-6">
                                        <div
                                            className={`h-28 w-28 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${vapi.isSpeaking
                                                ? 'gradient-primary shadow-lg shadow-primary/40'
                                                : 'bg-muted'
                                                }`}
                                        >
                                            {vapi.callStatus === 'connecting' ? (
                                                <Loader2 className="h-14 w-14 animate-spin text-white" />
                                            ) : vapi.isSpeaking ? (
                                                <Volume2 className="h-14 w-14 text-white animate-pulse" />
                                            ) : (
                                                <Radio className="h-14 w-14 text-muted-foreground" />
                                            )}
                                        </div>

                                        {/* Speaking ring animation */}
                                        {vapi.isSpeaking && (
                                            <div className="absolute inset-0 rounded-full border-4 border-primary/50 animate-ping" />
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold mb-1">
                                        {vapi.callStatus === 'connecting'
                                            ? 'Connecting to AI Interviewer...'
                                            : vapi.isSpeaking
                                                ? 'AI Interviewer is speaking...'
                                                : vapi.isUserSpeaking
                                                    ? 'Listening to your answer...'
                                                    : 'AI Interviewer is ready'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {vapi.isSpeaking
                                            ? 'Please wait for the question to finish'
                                            : 'Speak clearly and naturally to answer'}
                                    </p>
                                </div>

                                {/* Volume Visualizer */}
                                <div className="flex items-end justify-center gap-1 h-12 mb-6">
                                    {Array.from({ length: 20 }).map((_, i) => {
                                        const height = Math.max(
                                            4,
                                            Math.min(
                                                48,
                                                vapi.volumeLevel * 48 *
                                                (0.5 + 0.5 * Math.sin((i / 20) * Math.PI))
                                            )
                                        );
                                        return (
                                            <div
                                                key={i}
                                                className={`w-2 rounded-full transition-all duration-75 ${vapi.isSpeaking || vapi.isUserSpeaking
                                                    ? 'bg-primary'
                                                    : 'bg-muted'
                                                    }`}
                                                style={{ height: `${height}px` }}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Microphone status */}
                                <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
                                    {vapi.isUserSpeaking ? (
                                        <>
                                            <Mic className="h-4 w-4 text-green-500 animate-pulse" />
                                            <span className="text-green-500 font-medium">
                                                Recording your answer...
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <MicOff className="h-4 w-4" />
                                            <span>Microphone active — speak to answer</span>
                                        </>
                                    )}
                                </div>

                                {/* Live Transcript Preview */}
                                {vapi.messages.length > 0 && (
                                    <div className="bg-muted/20 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto space-y-2 text-left">
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                                            Transcript
                                        </p>
                                        {vapi.messages.slice(-6).map((msg, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex gap-2 text-sm ${msg.role === 'assistant'
                                                    ? 'text-primary'
                                                    : 'text-foreground'
                                                    }`}
                                            >
                                                <span className="font-semibold shrink-0">
                                                    {msg.role === 'assistant' ? '🤖 AI:' : '🧑 You:'}
                                                </span>
                                                <span>{msg.content}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Question status dots */}
                                <div className="flex gap-2 flex-wrap justify-center mb-6">
                                    {interview.questions.map((_: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs transition-all ${idx < answeredCount
                                                ? 'bg-green-500 text-white'
                                                : idx === answeredCount
                                                    ? 'gradient-primary text-white'
                                                    : 'bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            {idx < answeredCount ? (
                                                <CheckCircle2 className="h-4 w-4" />
                                            ) : (
                                                idx + 1
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* End Call Button */}
                                <div className="flex justify-center">
                                    <Button
                                        variant="destructive"
                                        size="lg"
                                        onClick={endCallManually}
                                        disabled={vapi.callStatus === 'ending'}
                                        className="gap-2"
                                    >
                                        {vapi.callStatus === 'ending' ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Ending Interview...
                                            </>
                                        ) : (
                                            <>
                                                <PhoneOff className="h-5 w-5" />
                                                End Interview Early
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Processing state after call ends */}
                {vapi.callStatus === 'ended' && (
                    <Card className="glass">
                        <CardContent className="p-8 text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">Interview Complete!</h3>
                            <p className="text-muted-foreground">
                                Processing your responses and generating feedback...
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Proctoring Panel */}
            {interviewStarted && proctoring.permissionsGranted && (
                <ProctoringPanel
                    cameraStream={proctoring.cameraStream}
                    micActive={proctoring.micActive}
                    violationCount={proctoring.violationCount}
                    isFullscreen={proctoring.isFullscreen}
                />
            )}

            {/* Violation Warning */}
            <ViolationWarning
                open={showViolationWarning}
                violationType={proctoring.violations[proctoring.violations.length - 1]?.type || ''}
                violationCount={proctoring.violationCount}
                maxViolations={3}
            />
        </div>
    );
}
