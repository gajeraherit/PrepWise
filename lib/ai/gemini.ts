import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// Use gemini-1.5-flash — fast, cheap, supports JSON mode, not deprecated
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
        responseMimeType: 'application/json', // Forces clean JSON output — no markdown wrapping
        temperature: 0.7,
    },
});

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
    techStack?: string[];
    experienceLevel?: string;
}

// ── Question Generation ───────────────────────────────────────────────────────

export async function generateInterviewQuestions(params: QuestionGenerationParams) {
    const { jobRole, techStack, experienceLevel, numberOfQuestions = 10 } = params;

    const prompt = `Generate EXACTLY ${numberOfQuestions} interview questions for a ${experienceLevel}-level ${jobRole} position.

CRITICAL INSTRUCTION: You MUST return exactly ${numberOfQuestions} questions in the array. No more, no less.

Tech Stack: ${techStack.join(', ')}

Mix:
- 50% Technical questions (specific to the tech stack)
- 30% Behavioral questions (STAR-method style)
- 20% Situational / problem-solving questions

Return a JSON array ONLY, no explanation:
[
  {
    "question": "...",
    "category": "technical" | "behavioral" | "situational",
    "difficulty": "easy" | "medium" | "hard"
  }
]`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        const questions = JSON.parse(text);
        if (!Array.isArray(questions)) throw new Error('Response is not an array');

        return questions.map((q: any, index: number) => ({
            id: `q-${index + 1}`,
            question: q.question,
            category: q.category || 'technical',
            difficulty: q.difficulty || 'medium',
        }));
    } catch (error) {
        console.error('[Gemini] Error generating questions:', error);
        return generateFallbackQuestions(jobRole, numberOfQuestions);
    }
}

// ── Feedback Analysis ─────────────────────────────────────────────────────────

export async function analyzeFeedback(params: FeedbackAnalysisParams) {
    const { jobRole, transcript, techStack = [], experienceLevel = 'mid' } = params;

    // Guard: if all answers are empty, no point calling the AI
    const hasRealAnswers = transcript.some((t) => t.answer && t.answer.trim().length > 20);
    if (!hasRealAnswers) {
        console.warn('[Gemini] Transcript has no substantive answers — using fallback');
        return generateFallbackFeedback();
    }

    const transcriptText = transcript
        .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer || '(no answer provided)'}`)
        .join('\n\n');

    const prompt = `You are a senior technical interviewer. Analyze this real interview transcript and give ACCURATE, HONEST scores based on the actual quality of answers.

Position: ${experienceLevel}-level ${jobRole}
Tech Stack: ${techStack.length > 0 ? techStack.join(', ') : 'General'}

TRANSCRIPT:
${transcriptText}

INSTRUCTIONS:
- Score each dimension from 0-100 based ONLY on the actual answers given.
- If answers are vague, short, or incorrect, give LOW scores (30-60).
- If answers are strong, detailed, and accurate, give HIGH scores (75-95).
- Do NOT give 70 as a default. Be specific and honest.
- Strengths and weaknesses must be derived from the actual answers, not generic.

Return this JSON object exactly:
{
  "overallScore": <number 0-100>,
  "communicationScore": <number 0-100>,
  "technicalScore": <number 0-100>,
  "problemSolvingScore": <number 0-100>,
  "confidenceScore": <number 0-100>,
  "strengths": ["<specific strength from answers>", "<specific strength>", "<specific strength>"],
  "weaknesses": ["<specific weakness from answers>", "<specific weakness>", "<specific weakness>"],
  "improvementTips": ["<actionable tip>", "<actionable tip>", "<actionable tip>", "<actionable tip>", "<actionable tip>"],
  "categoryScores": [
    { "category": "Technical Knowledge", "score": <number>, "feedback": "<specific feedback based on answers>" },
    { "category": "Communication", "score": <number>, "feedback": "<specific feedback>" },
    { "category": "Problem Solving", "score": <number>, "feedback": "<specific feedback>" },
    { "category": "Cultural Fit", "score": <number>, "feedback": "<specific feedback>" }
  ],
  "aiAnalysis": "<2-3 paragraph honest analysis of this specific candidate's performance, referencing their actual answers>"
}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        console.log('[Gemini] Raw feedback response length:', text.length);

        const feedback = JSON.parse(text);

        // Validate required fields are present and are numbers
        const requiredFields = ['overallScore', 'communicationScore', 'technicalScore', 'problemSolvingScore', 'confidenceScore'];
        for (const field of requiredFields) {
            if (typeof feedback[field] !== 'number') {
                throw new Error(`Invalid feedback field: ${field} = ${feedback[field]}`);
            }
        }

        // Clamp scores to 0-100
        for (const field of requiredFields) {
            feedback[field] = Math.max(0, Math.min(100, Math.round(feedback[field])));
        }

        console.log('[Gemini] ✅ Feedback generated — overall score:', feedback.overallScore);
        return feedback;
    } catch (error) {
        console.error('[Gemini] Error analyzing feedback:', error);
        return generateFallbackFeedback();
    }
}

// ── Fallback Generators ───────────────────────────────────────────────────────

function generateFallbackQuestions(jobRole: string, count: number) {
    const questions = [
        { id: 'q-1', question: `Tell me about yourself and your experience relevant to ${jobRole}.`, category: 'behavioral', difficulty: 'easy' },
        { id: 'q-2', question: `What motivated you to pursue a career as a ${jobRole}?`, category: 'behavioral', difficulty: 'easy' },
        { id: 'q-3', question: `Describe a challenging technical problem you solved recently.`, category: 'situational', difficulty: 'medium' },
        { id: 'q-4', question: `How do you approach learning new technologies or frameworks?`, category: 'behavioral', difficulty: 'easy' },
        { id: 'q-5', question: `Explain a complex technical concept as if explaining to a non-technical stakeholder.`, category: 'technical', difficulty: 'medium' },
        { id: 'q-6', question: `What is your experience with code reviews and giving/receiving feedback?`, category: 'behavioral', difficulty: 'medium' },
        { id: 'q-7', question: `How do you ensure code quality and handle technical debt?`, category: 'technical', difficulty: 'medium' },
        { id: 'q-8', question: `Describe a situation where you had to work under tight deadlines. How did you handle it?`, category: 'situational', difficulty: 'medium' },
        { id: 'q-9', question: `What are your long-term career goals as a ${jobRole}?`, category: 'behavioral', difficulty: 'easy' },
        { id: 'q-10', question: `Do you have any questions for us?`, category: 'behavioral', difficulty: 'easy' },
        { id: 'q-11', question: `Tell me about a time you disagreed with a coworker or manager about a technical decision.`, category: 'behavioral', difficulty: 'medium' },
        { id: 'q-12', question: `How do you balance adding new features versus fixing performance issues?`, category: 'situational', difficulty: 'hard' },
        { id: 'q-13', question: `What are the key differences between the architectures you've worked on?`, category: 'technical', difficulty: 'hard' },
        { id: 'q-14', question: `Describe a time when a project you were working on failed. What did you learn?`, category: 'behavioral', difficulty: 'medium' },
        { id: 'q-15', question: `Where do you see the industry heading in the next 5 years for this role?`, category: 'situational', difficulty: 'medium' },
    ];
    return questions.slice(0, count);
}

function generateFallbackFeedback() {
    return {
        overallScore: 65,
        communicationScore: 68,
        technicalScore: 62,
        problemSolvingScore: 64,
        confidenceScore: 67,
        strengths: [
            'Demonstrated willingness to engage with questions',
            'Showed some relevant experience',
            'Professional communication style',
        ],
        weaknesses: [
            'Answers lacked specific technical depth',
            'Could provide more concrete examples',
            'Response structure needs improvement',
        ],
        improvementTips: [
            'Use the STAR method (Situation, Task, Action, Result) for behavioral questions',
            'Prepare 3-5 detailed stories from your experience that showcase different skills',
            'Study core concepts deeply and be ready to explain trade-offs',
            'Practice speaking concisely — aim for 90-second answers',
            'Do mock interviews regularly to build confidence',
        ],
        categoryScores: [
            { category: 'Technical Knowledge', score: 62, feedback: 'AI feedback unavailable — retake the interview for accurate scoring.' },
            { category: 'Communication', score: 68, feedback: 'AI feedback unavailable — retake the interview for accurate scoring.' },
            { category: 'Problem Solving', score: 64, feedback: 'AI feedback unavailable — retake the interview for accurate scoring.' },
            { category: 'Cultural Fit', score: 67, feedback: 'AI feedback unavailable — retake the interview for accurate scoring.' },
        ],
        aiAnalysis: 'We were unable to generate AI feedback for this session — this may be due to an empty transcript or a connectivity issue. Please retake the interview to receive detailed, personalized feedback based on your actual answers.',
    };
}
