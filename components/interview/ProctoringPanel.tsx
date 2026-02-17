'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Mic, MicOff, AlertTriangle, Maximize } from 'lucide-react';

interface ProctoringPanelProps {
    cameraStream: MediaStream | null;
    micActive: boolean;
    violationCount: number;
    isFullscreen: boolean;
}

export function ProctoringPanel({
    cameraStream,
    micActive,
    violationCount,
    isFullscreen,
}: ProctoringPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [cameraStream]);

    return (
        <Card className="fixed top-4 right-4 z-50 glass p-3 w-64">
            {/* Camera Preview */}
            <div className="relative mb-3">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-36 bg-black rounded-lg object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-sm">
                        <Camera className="h-3 w-3 mr-1" />
                        Live
                    </Badge>
                    {micActive ? (
                        <Badge variant="secondary" className="bg-green-500/80 text-white backdrop-blur-sm animate-pulse">
                            <Mic className="h-3 w-3" />
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-gray-500/80 text-white backdrop-blur-sm">
                            <MicOff className="h-3 w-3" />
                        </Badge>
                    )}
                </div>
            </div>

            {/* Status Indicators */}
            <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fullscreen</span>
                    <div className="flex items-center gap-1">
                        {isFullscreen ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                <Maximize className="h-3 w-3 mr-1" />
                                Active
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                Inactive
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Violations</span>
                    {violationCount > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {violationCount}/3
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                            None
                        </Badge>
                    )}
                </div>
            </div>
        </Card>
    );
}
