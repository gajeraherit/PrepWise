import { NextRequest, NextResponse } from 'next/server';
import { analyzeFeedback } from '@/lib/ai/gemini';
import { adminDb } from '@/lib/firebase/admin';
import { Collections } from '@/lib/firebase/schema';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { transcript, jobRole, interviewId, techStack, experienceLevel } = body;

        if (!transcript || transcript.length === 0) {
            return NextResponse.json(
                { error: 'No transcript provided' },
                { status: 400 }
            );
        }

        const feedback = await analyzeFeedback({
            jobRole,
            questions: transcript.map((t: any) => ({ question: t.question })),
            transcript,
            techStack,
            experienceLevel,
        });

        // Save to Firestore using Admin SDK (bypasses security rules)
        if (interviewId) {
            await adminDb.collection(Collections.FEEDBACK).doc(interviewId).set({
                ...feedback,
                interviewId,
                jobRole,
                techStack,
                experienceLevel,
                createdAt: new Date(),
            });
        }

        return NextResponse.json({
            success: true,
            feedback,
        });
    } catch (error) {
        console.error('Error generating feedback:', error);
        return NextResponse.json(
            { error: 'Failed to generate feedback' },
            { status: 500 }
        );
    }
}
