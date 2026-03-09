'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Vapi from '@vapi-ai/web';

export type VapiMessage = {
    role: 'assistant' | 'user' | 'system';
    content: string;
};

export type VapiCallStatus = 'idle' | 'connecting' | 'active' | 'ending' | 'ended';

interface UseVapiOptions {
    onCallEnd?: (messages: VapiMessage[]) => void;
    onError?: (error: Error) => void;
}

export function useVapi(options: UseVapiOptions = {}) {
    // ── Keep options in a ref so the useEffect never needs to re-run
    // when callbacks change (avoids destroying/recreating the Vapi instance).
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const vapiRef = useRef<Vapi | null>(null);
    const messagesRef = useRef<VapiMessage[]>([]);

    const [callStatus, setCallStatus] = useState<VapiCallStatus>('idle');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(0);
    const [messages, setMessages] = useState<VapiMessage[]>([]);
    const [errorMessage, setErrorMessage] = useState('');

    // ── Create Vapi instance ONCE on mount ──────────────────────────
    useEffect(() => {
        const publicKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
        if (!publicKey) {
            console.error('[Vapi] NEXT_PUBLIC_VAPI_API_KEY is not set');
            return;
        }

        const vapi = new Vapi(publicKey);
        vapiRef.current = vapi;

        // ── call-start ─────────────────────────────────────────────
        vapi.on('call-start', () => {
            console.log('[Vapi] ✅ Call started');
            setCallStatus('active');
            setErrorMessage('');
        });

        // ── call-end ───────────────────────────────────────────────
        vapi.on('call-end', () => {
            console.log('[Vapi] 📴 Call ended');
            setCallStatus('ended');
            setIsSpeaking(false);
            setIsUserSpeaking(false);
            setVolumeLevel(0);
            // Fire callback with the captured messages
            optionsRef.current.onCallEnd?.(messagesRef.current);
        });

        // ── speaking ───────────────────────────────────────────────
        vapi.on('speech-start', () => setIsSpeaking(true));
        vapi.on('speech-end', () => setIsSpeaking(false));

        // ── volume ─────────────────────────────────────────────────
        vapi.on('volume-level', (level: number) => setVolumeLevel(level));

        // ── messages / transcript ──────────────────────────────────
        // The Vapi 'message' event delivers several types:
        //   { type: 'transcript', role: 'user'|'assistant', transcriptType: 'partial'|'final', transcript: string }
        //   { type: 'conversation-update', conversation: [{role, content}] }
        //   { type: 'status-update', status: string }
        vapi.on('message', (msg: any) => {
            console.log('[Vapi] message:', msg?.type, msg);

            if (msg?.type === 'transcript') {
                // Update user speaking state from partials
                if (msg.role === 'user') {
                    setIsUserSpeaking(msg.transcriptType !== 'final');
                }

                // Only persist final transcripts to messages list
                if (msg.transcriptType === 'final') {
                    const newMsg: VapiMessage = {
                        role: msg.role === 'user' ? 'user' : 'assistant',
                        content: msg.transcript,
                    };
                    setMessages((prev) => {
                        const updated = [...prev, newMsg];
                        messagesRef.current = updated;
                        return updated;
                    });
                }
            }

            // conversation-update carries the full conversation at end of call
            if (msg?.type === 'conversation-update' && Array.isArray(msg.conversation)) {
                const mapped: VapiMessage[] = msg.conversation
                    .filter((m: any) => m.role === 'user' || m.role === 'assistant')
                    .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content || '' }));
                messagesRef.current = mapped;
                setMessages(mapped);
            }
        });

        // ── error ──────────────────────────────────────────────────
        vapi.on('error', (error: any) => {
            console.error('[Vapi] ❌ Error:', error);
            const errMsg =
                error?.error?.message ||
                error?.message ||
                (typeof error === 'string' ? error : 'Vapi error — check console');
            setErrorMessage(errMsg);
            setCallStatus('idle');
            optionsRef.current.onError?.(new Error(errMsg));
        });

        // ── call-start-failed ──────────────────────────────────────
        vapi.on('call-start-failed', (event: any) => {
            console.error('[Vapi] 🚫 Call start failed:', event);
            const errMsg = event?.error || 'Failed to start call';
            setErrorMessage(errMsg);
            setCallStatus('idle');
            optionsRef.current.onError?.(new Error(errMsg));
        });

        return () => {
            console.log('[Vapi] Cleanup — stopping vapi');
            vapi.stop();
            vapiRef.current = null;
        };
    }, []); // ← Empty dep array: runs once only

    // ── startCall ────────────────────────────────────────────────────
    // Accepts EITHER:
    //   (a) a string assistant ID  →  vapi.start(id, overrides?)
    //   (b) a full CreateAssistantDTO object → vapi.start(dto)
    const startCall = useCallback(
        async (
            assistantOrId: string | object,
            assistantOverrides?: object
        ) => {
            if (!vapiRef.current) {
                console.error('[Vapi] Not initialized yet');
                return;
            }

            setCallStatus('connecting');
            setMessages([]);
            messagesRef.current = [];

            try {
                if (typeof assistantOrId === 'string') {
                    await vapiRef.current.start(
                        assistantOrId,
                        assistantOverrides as any
                    );
                } else {
                    // Pass the full DTO as the first argument (CreateAssistantDTO)
                    await vapiRef.current.start(assistantOrId as any);
                }
            } catch (err: any) {
                console.error('[Vapi] start() threw:', err);
                setCallStatus('idle');
                const msg = err?.message || 'Failed to start Vapi call';
                setErrorMessage(msg);
                optionsRef.current.onError?.(new Error(msg));
            }
        },
        []
    );

    // ── stopCall ─────────────────────────────────────────────────────
    const stopCall = useCallback(() => {
        if (!vapiRef.current) return;
        setCallStatus('ending');
        vapiRef.current.stop();
    }, []);

    const isCalling = callStatus === 'active' || callStatus === 'connecting';

    return {
        callStatus,
        isCalling,
        isSpeaking,
        isUserSpeaking,
        volumeLevel,
        messages,
        errorMessage,
        startCall,
        stopCall,
    };
}
