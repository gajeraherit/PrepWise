'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Mic, MicOff, Circle, CheckCircle2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useProctoring } from '@/hooks/useProctoring';
import { ProctoringPanel } from '@/components/interview/ProctoringPanel';
import { ViolationWarning } from '@/components/interview/ViolationWarning';

export default function InterviewPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [generatingQuestions, setGeneratingQuestions] = useState(false);
    const [interview, setInterview] = useState<any>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState<Array<{ question: string; answer: string }>>([]);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [recognition, setRecognition] = useState<any>(null);
    const [useTextInput, setUseTextInput] = useState(false);
    const [showViolationWarning, setShowViolationWarning] = useState(false);
    const [lastViolationType, setLastViolationType] = useState('');

    // Proctoring hook
    const proctoring = useProctoring({
        interviewId: params.id as string,
        onViolation: (count) => {
            setShowViolationWarning(true);
            setTimeout(() => setShowViolationWarning(false), 4000);
        },
        maxViolations: 3,
        onMaxViolationsReached: () => {
            finishInterview(transcript);
        },
    });

    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const interviewId = params.id as string;
                const interviewDoc = await getDoc(doc(db, Collections.INTERVIEWS, interviewId));

                if (interviewDoc.exists()) {
                    const data = { id: interviewDoc.id, ...interviewDoc.data() } as any;
                    setInterview(data);

                    // Auto-generate questions if not already generated
                    if (!data.questions || data.questions.length === 0) {
                        await generateQuestions(interviewId, data);
                    }
                } else {
                    console.error('Interview not found');
                }
            } catch (error) {
                console.error('Error fetching interview:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchInterview();
        }
    }, [params.id]);

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

    const startInterview = async () => {
        try {
            // Request proctoring permissions and setup
            const stream = await proctoring.requestPermissions();

            if (!stream) {
                toast({
                    title: 'Camera/Microphone Required',
                    description: 'Please allow camera and microphone access to start the interview.',
                    variant: 'destructive',
                });
                return;
            }

            // Enter fullscreen
            proctoring.enterFullscreen();

            // Start recording
            proctoring.startRecording();

            // Update interview status
            await updateDoc(doc(db, Collections.INTERVIEWS, params.id as string), {
                status: 'in-progress',
                startedAt: new Date(),
            });
            setInterview({ ...interview, status: 'in-progress' });
            setCurrentQuestionIndex(0);

            // Initialize speech recognition
            initializeSpeechRecognition();
        } catch (error) {
            console.error('Error starting interview:', error);
        }
    };

    const initializeSpeechRecognition = () => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();

            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setCurrentAnswer((prev) => prev + finalTranscript);
            };

            recognitionInstance.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);

                // Provide user-friendly error messages
                if (event.error === 'network') {
                    toast({
                        title: 'Network Error',
                        description: 'Speech recognition requires an internet connection. Please check your network or use text input.',
                        variant: 'destructive',
                    });
                } else if (event.error === 'not-allowed') {
                    toast({
                        title: 'Microphone Access Denied',
                        description: 'Please allow microphone access to use voice recording.',
                        variant: 'destructive',
                    });
                } else if (event.error === 'no-speech') {
                    toast({
                        title: 'No Speech Detected',
                        description: 'Please try speaking again.',
                    });
                }
            };

            recognitionInstance.onend = () => {
                if (isRecording) {
                    recognitionInstance.start();
                }
            };

            setRecognition(recognitionInstance);
        }
    };

    const toggleRecording = () => {
        if (!recognition) {
            toast({
                title: 'Voice Not Supported',
                description: 'Your browser does not support voice recording. Please use text input.',
                variant: 'destructive',
            });
            return;
        }

        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
        } else {
            setCurrentAnswer('');
            recognition.start();
            setIsRecording(true);
        }
    };

    const submitAnswer = () => {
        if (!currentAnswer.trim()) {
            toast({
                title: 'Empty Answer',
                description: 'Please provide an answer before continuing.',
                variant: 'destructive',
            });
            return;
        }

        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
        }

        handleAnswer(currentAnswer);
        setCurrentAnswer('');
    };

    const handleAnswer = (answer: string) => {
        const currentQuestion = interview.questions[currentQuestionIndex];
        const newTranscript = [
            ...transcript,
            { question: currentQuestion.question, answer },
        ];
        setTranscript(newTranscript);

        if (currentQuestionIndex < interview.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            finishInterview(newTranscript);
        }
    };

    const finishInterview = async (finalTranscript: any[]) => {
        try {
            // Stop proctoring and get the video blob
            const videoBlob = await proctoring.stopRecording();
            proctoring.exitFullscreen();

            console.log('🎬 Interview finishing - video blob:', {
                hasBlob: !!videoBlob,
                size: videoBlob ? `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
                type: videoBlob?.type
            });

            let recordingUrl = '';

            // Upload video recording if available
            if (videoBlob) {
                toast({
                    title: 'Processing...',
                    description: 'Uploading interview recording...',
                });

                try {
                    // Upload to Cloudinary
                    const formData = new FormData();
                    formData.append('video', videoBlob, 'recording.webm');
                    formData.append('interviewId', params.id as string);

                    const uploadResponse = await fetch('/api/upload-video', {
                        method: 'POST',
                        body: formData,
                    });

                    if (uploadResponse.ok) {
                        const data = await uploadResponse.json();
                        recordingUrl = data.url;
                        console.log('✅ Cloudinary upload success:', recordingUrl);
                    } else {
                        throw new Error('Upload failed');
                    }

                    console.log('Video uploaded successfully:', recordingUrl);
                } catch (uploadError: any) {
                    console.error('❌ Error uploading video:', uploadError);
                    toast({
                        title: 'Upload Warning',
                        description: 'Video upload failed. Interview data saved.',
                        variant: 'destructive',
                    });
                }
            } else {
                console.warn('⚠️ No video recording captured - camera may not have been enabled');
                console.warn('💡 Make sure to grant camera/microphone permissions when starting the interview');
            }

            // Update interview status
            await updateDoc(doc(db, Collections.INTERVIEWS, params.id as string), {
                status: 'completed',
                completedAt: new Date(),
                transcript: finalTranscript,
                ...(recordingUrl && { recordingUrl }), // Only add if upload succeeded
            });

            toast({
                title: 'Interview Completed!',
                description: 'Generating your feedback report...',
            });

            // Generate AI feedback
            const feedbackResponse = await fetch('/api/interviews/generate-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    interviewId: params.id,
                    transcript: finalTranscript,
                    jobRole: interview.jobRole,
                    techStack: interview.techStack,
                    experienceLevel: interview.experienceLevel,
                }),
            });

            if (feedbackResponse.ok) {
                const { feedback } = await feedbackResponse.json();

                toast({
                    title: 'Feedback Generated!',
                    description: 'Redirecting to your feedback...',
                });

                // Redirect to feedback page
                setTimeout(() => {
                    router.push(`/candidate/feedback/${params.id}`);
                }, 2000);
            } else {
                throw new Error('Failed to generate feedback');
            }
        } catch (error) {
            console.error('Error finishing interview:', error);
            toast({
                title: 'Interview Completed',
                description: 'Feedback generation failed. Please try again later.',
                variant: 'destructive',
            });

            setTimeout(() => {
                router.push('/candidate/dashboard');
            }, 2000);
        }
    };

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

    const currentQuestion = interview.questions?.[currentQuestionIndex];
    const isInterviewActive = interview.status === 'in-progress';
    const isInterviewReady = interview.status === 'ready' || (interview.questions && interview.questions.length > 0);

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-5xl">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/candidate/dashboard')}
                    className="mb-6"
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
                                    {interview.techStack?.join(', ')} • {interview.experienceLevel} level • {interview.duration} min
                                </p>
                            </div>
                            <Badge variant={isInterviewActive ? 'default' : 'secondary'} className="capitalize">
                                {interview.status}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Interview Content */}
                {!isInterviewActive && isInterviewReady && (
                    <Card className="glass">
                        <CardContent className="p-8 text-center">
                            <div className="h-20 w-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="h-10 w-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Ready to Start Your Interview?</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                {interview.questions?.length} AI-generated questions are ready. The interview will take approximately {interview.duration} minutes.
                            </p>

                            <div className="bg-muted/30 rounded-lg p-4 mb-6 max-w-md mx-auto">
                                <h4 className="font-semibold mb-2">Interview Tips:</h4>
                                <ul className="text-sm text-left space-y-1 text-muted-foreground">
                                    <li>• Find a quiet space</li>
                                    <li>• Speak clearly and confidently</li>
                                    <li>• Take your time to think before answering</li>
                                    <li>• Use the STAR method for behavioral questions</li>
                                </ul>
                            </div>

                            <Button onClick={startInterview} size="lg" className="gradient-primary text-white">
                                <Mic className="mr-2 h-5 w-5" />
                                Start Interview Now
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Active Interview */}
                {isInterviewActive && currentQuestion && (
                    <div className="space-y-6">
                        {/* Progress */}
                        <Card className="glass">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Question {currentQuestionIndex + 1} of {interview.questions.length}</span>
                                    <span className="text-sm text-muted-foreground">{Math.round((currentQuestionIndex / interview.questions.length) * 100)}% Complete</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="gradient-primary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(currentQuestionIndex / interview.questions.length) * 100}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Question Card */}
                        <Card className="glass">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <Badge className="mb-3">{currentQuestion.category}</Badge>
                                        <CardTitle className="text-xl leading-relaxed">{currentQuestion.question}</CardTitle>
                                    </div>
                                    <Badge variant="outline">{currentQuestion.difficulty}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Voice Recording UI */}
                                    <div className="bg-muted/30 rounded-lg p-8 text-center">
                                        <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${isRecording ? 'gradient-primary animate-pulse' : 'bg-muted'}`}>
                                            {isRecording ? (
                                                <MicOff className="h-12 w-12 text-white" />
                                            ) : (
                                                <Mic className="h-12 w-12" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {isRecording ? 'Recording your answer...' : 'Click to record your answer'}
                                        </p>
                                        <Button
                                            size="lg"
                                            variant={isRecording ? 'destructive' : 'default'}
                                            onClick={toggleRecording}
                                            className="mb-4"
                                        >
                                            {isRecording ? (
                                                <>
                                                    <MicOff className="mr-2 h-5 w-5" />
                                                    Stop Recording
                                                </>
                                            ) : (
                                                <>
                                                    <Mic className="mr-2 h-5 w-5" />
                                                    Start Recording
                                                </>
                                            )}
                                        </Button>

                                        {/* Live Transcript Display */}
                                        {currentAnswer && (
                                            <div className="bg-background/50 rounded-lg p-4 mb-4 text-left">
                                                <p className="text-sm font-medium mb-2">Your Answer:</p>
                                                <p className="text-sm">{currentAnswer}</p>
                                            </div>
                                        )}

                                        {/* Text Input Fallback */}
                                        {useTextInput && (
                                            <div className="mt-4">
                                                <textarea
                                                    className="w-full min-h-[120px] p-3 rounded-lg border bg-background"
                                                    placeholder="Type your answer here..."
                                                    value={currentAnswer}
                                                    onChange={(e) => setCurrentAnswer(e.target.value)}
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={submitAnswer}
                                                disabled={!currentAnswer.trim()}
                                            >
                                                Submit Answer & Continue
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setUseTextInput(!useTextInput)}
                                            >
                                                {useTextInput ? 'Use Voice' : 'Use Text'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Question Status */}
                                    <div className="flex gap-2 flex-wrap">
                                        {interview.questions.map((_: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${idx < currentQuestionIndex
                                                    ? 'bg-green-500 text-white'
                                                    : idx === currentQuestionIndex
                                                        ? 'gradient-primary text-white'
                                                        : 'bg-muted text-muted-foreground'
                                                    }`}
                                            >
                                                {idx < currentQuestionIndex ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Proctoring Panel - Only show when interview is active */}
            {isInterviewActive && proctoring.permissionsGranted && (
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
