import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';

interface Violation {
    type: 'tab_switch' | 'fullscreen_exit' | 'camera_off' | 'mic_off' | 'devtools_attempt' | 'copy_paste';
    timestamp: Date;
}

interface ProctoringOptions {
    interviewId: string;
    onViolation?: (count: number) => void;
    maxViolations?: number;
    onMaxViolationsReached?: () => void;
}

export function useProctoring({
    interviewId,
    onViolation,
    maxViolations = 3,
    onMaxViolationsReached,
}: ProctoringOptions) {
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [violations, setViolations] = useState<Violation[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [micActive, setMicActive] = useState(false);
    const [permissionsGranted, setPermissionsGranted] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    // Request camera and microphone permissions
    const requestPermissions = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: true,
            });

            setCameraStream(stream);
            setPermissionsGranted(true);
            setCameraError(null);

            // Monitor audio levels
            startAudioMonitoring(stream);

            return stream;
        } catch (error: any) {
            console.error('Permission error:', error);
            setCameraError(error.message || 'Camera/microphone access denied');
            setPermissionsGranted(false);
            return null;
        }
    }, []);

    // Start audio level monitoring
    const startAudioMonitoring = (stream: MediaStream) => {
        try {
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            microphone.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioContext;

            const checkAudioLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setMicActive(average > 10);

                if (cameraStream) {
                    requestAnimationFrame(checkAudioLevel);
                }
            };

            checkAudioLevel();
        } catch (error) {
            console.error('Audio monitoring error:', error);
        }
    };

    // Start recording
    const startRecording = useCallback(() => {
        if (!cameraStream) return;

        try {
            const recorder = new MediaRecorder(cameraStream, {
                mimeType: 'video/webm',
            });

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            recorder.start(1000); // Collect data every second
            mediaRecorderRef.current = recorder;
        } catch (error) {
            console.error('Recording error:', error);
        }
    }, [cameraStream]);

    // Stop recording
    const stopRecording = useCallback(() => {
        return new Promise<Blob | null>((resolve) => {
            if (!mediaRecorderRef.current) {
                resolve(null);
                return;
            }

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                recordedChunksRef.current = [];
                resolve(blob);
            };

            mediaRecorderRef.current.stop();
        });
    }, []);

    // Log violation
    const logViolation = useCallback(async (type: Violation['type']) => {
        const violation: Violation = {
            type,
            timestamp: new Date(),
        };

        setViolations((prev) => {
            const updated = [...prev, violation];

            // Trigger callback
            onViolation?.(updated.length);

            // Check max violations
            if (updated.length >= maxViolations) {
                onMaxViolationsReached?.();
            }

            return updated;
        });

        // Store in Firestore
        try {
            await updateDoc(doc(db, Collections.INTERVIEWS, interviewId), {
                violations: arrayUnion(violation),
            });
        } catch (error) {
            console.error('Error logging violation:', error);
        }
    }, [interviewId, onViolation, maxViolations, onMaxViolationsReached]);

    // Enter fullscreen
    const enterFullscreen = useCallback(() => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error('Fullscreen error:', err);
                // Don't treat fullscreen failure as critical - just log it
            });
        }
    }, []);

    // Exit fullscreen
    const exitFullscreen = useCallback(() => {
        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch((err) => {
                console.error('Exit fullscreen error:', err);
            });
        }
    }, []);

    // Monitor fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullscreen(isFs);

            if (!isFs && permissionsGranted) {
                logViolation('fullscreen_exit');
                // Auto re-enter after 1 second
                setTimeout(enterFullscreen, 1000);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [permissionsGranted, logViolation, enterFullscreen]);

    // Monitor tab switching
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && permissionsGranted) {
                logViolation('tab_switch');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [permissionsGranted, logViolation]);

    // Block keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!permissionsGranted) return;

            // Block DevTools
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase()))
            ) {
                e.preventDefault();
                logViolation('devtools_attempt');
            }

            // Block copy/paste/select all
            if (e.ctrlKey && ['c', 'v', 'a', 'x'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                logViolation('copy_paste');
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            if (permissionsGranted) {
                e.preventDefault();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [permissionsGranted, logViolation]);

    // Monitor camera stream
    useEffect(() => {
        if (!cameraStream) return;

        const videoTrack = cameraStream.getVideoTracks()[0];
        const audioTrack = cameraStream.getAudioTracks()[0];

        const checkTracks = setInterval(() => {
            if (videoTrack && !videoTrack.enabled) {
                logViolation('camera_off');
            }
            if (audioTrack && !audioTrack.enabled) {
                logViolation('mic_off');
            }
        }, 2000);

        return () => clearInterval(checkTracks);
    }, [cameraStream, logViolation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach((track) => track.stop());
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(err => {
                    console.error('Error closing AudioContext:', err);
                });
            }
            exitFullscreen();
        };
    }, [cameraStream, exitFullscreen]);

    return {
        cameraStream,
        violations,
        violationCount: violations.length,
        isFullscreen,
        micActive,
        permissionsGranted,
        cameraError,
        requestPermissions,
        startRecording,
        stopRecording,
        enterFullscreen,
        exitFullscreen,
        logViolation,
    };
}
