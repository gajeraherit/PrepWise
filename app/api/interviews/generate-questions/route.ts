import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewQuestions } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { jobRole, techStack, experienceLevel } = body;

        if (!jobRole || !techStack) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        console.log('Generating questions for:', { jobRole, techStack, experienceLevel });

        // Generate questions using Gemini AI
        const questions = await generateInterviewQuestions({
            jobRole,
            techStack: Array.isArray(techStack) ? techStack : [techStack],
            experienceLevel: experienceLevel || 'mid',
            numberOfQuestions: 10,
        });

        console.log('Generated questions:', questions.length);

        return NextResponse.json({ success: true, questions });
    } catch (error: any) {
        console.error('Error generating questions:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate questions' },
            { status: 500 }
        );
    }
}
