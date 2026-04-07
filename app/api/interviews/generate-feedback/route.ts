import { NextRequest, NextResponse } from 'next/server';
import { analyzeFeedback } from '@/lib/ai/gemini';
import { adminDb } from '@/lib/firebase/admin';
import { Collections } from '@/lib/firebase/schema';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { transcript, jobRole, interviewId, techStack, experienceLevel, candidateId } = body;

        console.log('[Feedback API] Generating for', jobRole, '- transcript length:', transcript?.length || 0);

        // Check if the candidate actually answered any questions
        const hasRealAnswers = Array.isArray(transcript) &&
            transcript.some((t: any) => t.answer && t.answer.trim().length > 20);

        console.log('[Feedback API] Has substantial answers:', hasRealAnswers);

        if (!hasRealAnswers) {
            // No substantive answers — flag for frontend
            if (interviewId) {
                await adminDb.collection(Collections.FEEDBACK).doc(interviewId).set({
                    interviewId,
                    candidateId: candidateId || null,
                    jobRole: jobRole || 'Unknown Role',
                    noAnswers: true,
                    overallScore: null,
                    createdAt: new Date(),
                });
            }
            return NextResponse.json({ success: true, noAnswers: true });
        }

        // Generate AI feedback
        const feedback = await analyzeFeedback({
            jobRole: jobRole || 'Unknown Role',
            questions: transcript.map((t: any) => ({ question: t.question })),
            transcript,
            techStack,
            experienceLevel,
        });

        console.log('[Feedback API] Generated score:', feedback.overallScore, 'for', jobRole);

        // Save to Firestore
        if (interviewId) {
            await adminDb.collection(Collections.FEEDBACK).doc(interviewId).set({
                ...feedback,
                interviewId,
                candidateId: candidateId || null,
                jobRole: jobRole || 'Unknown Role',
                techStack,
                experienceLevel,
                noAnswers: false,
                createdAt: new Date(),
            });
            console.log('[Feedback API] Saved feedback doc for', interviewId);
        }

        return NextResponse.json({ success: true, feedback });
    } catch (error) {
        console.error('Error generating feedback:', error);
        return NextResponse.json(
            { error: 'Failed to generate feedback' },
            { status: 500 }
        );
    }
}
