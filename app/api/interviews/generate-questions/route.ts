import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewQuestions } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { jobRole, techStack, experienceLevel, duration } = body;

        if (!jobRole || !techStack) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        console.log('Generating questions for:', { jobRole, techStack, experienceLevel });

        // Derive number of questions from duration 
        const durationMin = Number(duration) || 30;
        let numberOfQuestions = 8; // Default for 30 mins

        if (durationMin <= 15) numberOfQuestions = 5;
        else if (durationMin <= 30) numberOfQuestions = 8;
        else if (durationMin <= 45) numberOfQuestions = 12;
        else numberOfQuestions = 15; // 60 mins or more

        console.log(`Duration: ${durationMin} min → ${numberOfQuestions} questions`);

        // Generate questions using Gemini AI
        const questions = await generateInterviewQuestions({
            jobRole,
            techStack: Array.isArray(techStack) ? techStack : [techStack],
            experienceLevel: experienceLevel || 'mid',
            numberOfQuestions,
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
