'use client';

import { AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ViolationWarningProps {
    open: boolean;
    violationType: string;
    violationCount: number;
    maxViolations: number;
}

export function ViolationWarning({
    open,
    violationType,
    violationCount,
    maxViolations,
}: ViolationWarningProps) {
    const getViolationMessage = (type: string) => {
        switch (type) {
            case 'tab_switch':
                return 'Tab switching detected. Please stay on this page during the interview.';
            case 'fullscreen_exit':
                return 'Fullscreen mode exited. Returning to fullscreen...';
            case 'camera_off':
                return 'Camera was turned off. Please keep your camera on.';
            case 'mic_off':
                return 'Microphone was muted. Please keep your microphone active.';
            case 'devtools_attempt':
                return 'Developer tools access blocked.';
            case 'copy_paste':
                return 'Copy/paste operations are not allowed.';
            default:
                return 'Suspicious activity detected.';
        }
    };

    const remaining = maxViolations - violationCount;
    const isWarning = remaining > 0;

    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isWarning ? 'bg-yellow-500/10' : 'bg-red-500/10'
                            }`}>
                            <AlertTriangle className={`h-6 w-6 ${isWarning ? 'text-yellow-600' : 'text-red-600'
                                }`} />
                        </div>
                        <div>
                            <DialogTitle>
                                {isWarning ? 'Warning' : 'Maximum Violations Reached'}
                            </DialogTitle>
                            <Badge variant={isWarning ? 'outline' : 'destructive'} className="mt-1">
                                {violationCount}/{maxViolations} Violations
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>
                <div className="space-y-3 px-6 pb-6">
                    <div className="text-base text-foreground">{getViolationMessage(violationType)}</div>
                    {isWarning ? (
                        <div className="text-sm text-muted-foreground">
                            You have <strong className="text-yellow-600">{remaining}</strong> warning
                            {remaining !== 1 ? 's' : ''} remaining. After {maxViolations} violations,
                            your interview will be automatically submitted.
                        </div>
                    ) : (
                        <div className="text-sm font-medium text-red-600">
                            Your interview is being submitted due to excessive violations.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
