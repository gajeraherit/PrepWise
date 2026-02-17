import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

interface QuestionGenerationParams {
    jobRole: string;
    techStack: string[];
    experienceLevel: string;
    numberOfQuestions?: number;
}

interface FeedbackAnalysisParams {
    jobRole: string;
    questions: Array<{ question: string }>;
    transcript: Array<{ question: string; answer: string }>;
}

export async function generateInterviewQuestions(params: QuestionGenerationParams) {
    const { jobRole, techStack, experienceLevel, numberOfQuestions = 10 } = params;

    const prompt = `You are an expert AI interview coach. Generate ${numberOfQuestions} interview questions for a ${experienceLevel} level ${jobRole} position.

Tech Stack: ${techStack.join(', ')}

Generate a mix of:
- Technical questions (50%)
- Behavioral questions (30%)
- Situational questions (20%)

For each question, provide:
1. The question text
2. Category (technical, behavioral, or situational)
3. Difficulty level (easy, medium, or hard)

Return as JSON array with format:
[
  {
    "question": "...",
    "category": "technical|behavioral|situational",
    "difficulty": "easy|medium|hard"
  }
]`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const questions = JSON.parse(jsonMatch[0]);
        return questions.map((q: any, index: number) => ({
            id: `q-${index + 1}`,
            ...q,
        }));
    } catch (error) {
        console.error('Error generating questions:', error);
        // Fallback questions
        return generateFallbackQuestions(jobRole, numberOfQuestions);
    }
}

export async function analyzeFeedback(params: FeedbackAnalysisParams) {
    const { jobRole, transcript } = params;

    const prompt = `You are an expert AI interview coach. Analyze this interview transcript for a ${jobRole} position and provide detailed feedback.

Transcript:
${transcript.map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}`).join('\n\n')}

Provide comprehensive feedback in the following JSON format:
{
  "overallScore": 0-100,
  "communicationScore": 0-100,
  "technicalScore": 0-100,
  "problemSolvingScore": 0-100,
  "confidenceScore": 0-100,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "improvementTips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "categoryScores": [
    {
      "category": "Technical Knowledge",
      "score": 0-100,
      "feedback": "detailed feedback"
    }
  ],
  "aiAnalysis": "Overall detailed analysis paragraph"
}

Be constructive, specific, and encouraging.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI feedback');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error analyzing feedback:', error);
        return generateFallbackFeedback();
    }
}

function generateFallbackQuestions(jobRole: string, count: number) {
    const questions = [
        {
            id: 'q-1',
            question: `Tell me about yourself and your experience related to ${jobRole}.`,
            category: 'behavioral',
            difficulty: 'easy',
        },
        {
            id: 'q-2',
            question: `What motivated you to apply for this ${jobRole} position?`,
            category: 'behavioral',
            difficulty: 'easy',
        },
        {
            id: 'q-3',
            question: `Describe a challenging project you worked on and how you overcame obstacles.`,
            category: 'situational',
            difficulty: 'medium',
        },
        {
            id: 'q-4',
            question: `How do you stay updated with the latest technologies and trends in your field?`,
            category: 'behavioral',
            difficulty: 'easy',
        },
        {
            id: 'q-5',
            question: `Explain a complex technical concept to someone without a technical background.`,
            category: 'technical',
            difficulty: 'medium',
        },
    ];

    return questions.slice(0, count);
}

function generateFallbackFeedback() {
    return {
        overallScore: 70,
        communicationScore: 75,
        technicalScore: 70,
        problemSolvingScore: 68,
        confidenceScore: 72,
        strengths: [
            'Clear communication style',
            'Good understanding of fundamentals',
            'Positive attitude',
        ],
        weaknesses: [
            'Could provide more specific examples',
            'Technical depth could be improved',
            'Answer structure needs refinement',
        ],
        improvementTips: [
            'Practice the STAR method for behavioral questions',
            'Prepare specific examples from your experience',
            'Study common technical topics more deeply',
            'Work on concise and structured answers',
            'Practice mock interviews regularly',
        ],
        categoryScores: [
            {
                category: 'Technical Knowledge',
                score: 70,
                feedback: 'Demonstrates solid fundamentals with room for deeper expertise',
            },
            {
                category: 'Communication',
                score: 75,
                feedback: 'Clear and articulate responses',
            },
        ],
        aiAnalysis: 'Overall, you demonstrated good potential with solid fundamentals. Focus on providing more specific examples and deepening your technical knowledge to improve your performance.',
    };
}
