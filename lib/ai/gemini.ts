import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
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

export async function generateInterviewQuestions(params: QuestionGenerationParams) {
    const { jobRole, techStack, experienceLevel, numberOfQuestions = 10 } = params;

    const prompt = `Generate EXACTLY ${numberOfQuestions} interview questions for a ${experienceLevel}-level ${jobRole} position.

CRITICAL: EXACTLY ${numberOfQuestions} questions.

Tech Stack: ${techStack.join(', ')}

JSON array ONLY:
[
  {"question": "?", "category": "technical|behavioral|situational", "difficulty": "easy|medium|hard"}
]`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const questions: any[] = JSON.parse(text);
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

export async function analyzeFeedback(params: FeedbackAnalysisParams) {
    const { jobRole, transcript, techStack = [], experienceLevel = 'mid' } = params;

    const hasRealAnswers = transcript.some((t) => t.answer?.trim().length > 20);
    if (!hasRealAnswers) {
        console.warn('[Gemini] No substantive answers - fallback');
        return generateFallbackFeedback();
    }

    const transcriptText = transcript
        .map((t, i) => `Q${i+1}: ${t.question}
A${i+1}: ${t.answer || '(skipped)'}`
        .join('\\n\\n');

    const prompt = `Senior technical interviewer. Analyze this EXACT transcript. Honest, specific scores ONLY from answers.

Job: ${experienceLevel} ${jobRole}
Stack: ${techStack.join(', ')}

TRANSCRIPT:
${transcriptText}

CRITICAL RULES:
1. Quote SPECIFIC phrases/words from answers in strengths/weaknesses.
2. 3 strengths, 3 weaknesses, 5 tips - NO generic text.
3. Scores based on quality:
   - 0-39: Vague/wrong/short
   - 40-69: Basic/correct but shallow
   - 70-100: Detailed/examples/metrics

EXAMPLE POOR:
Q1: React? A1: "React good framework."
overallScore: 35
technicalScore: 28 (\\"React good\\" - no concepts)
strengths: [\\"Attempted answer\\"]
weaknesses: [\\"No specific knowledge\\", \\"No examples\\"]
improvementTips: [\\"Learn React components\\", \\"Give project examples\\"]

EXAMPLE GOOD:
Q1: React? A1: \\"Built e-commerce with hooks, custom useFetch cached API, 40% faster.\\"
overallScore: 88
technicalScore: 93 (\\"custom useFetch\\" + \\"40% faster\\")
strengths: [\\"Advanced hooks\\", \\"Performance optimization\\"]

JSON ONLY - EXACT schema:
{
  \\"overallScore\\": number,
  \\"communicationScore\\": number,
  \\"technicalScore\\": number,
  \\"problemSolvingScore\\": number,
  \\"confidenceScore\\": number,
  \\"strengths\\": [\\"specific\\"],
  \\"weaknesses\\": [\\"specific\\"],
  \\"improvementTips\\": [\\"specific\\"],
  \\"keyQuotes\\": [\\"direct quotes\\"],
  \\"categoryScores\\": [
    {\\"category\\":\\"Technical Knowledge\\", \\"score\\":num, \\"feedback\\":\\"specific from answers\\"},
    {\\"category\\":\\"Communication\\", \\"score\\":num, \\"feedback\\":\\"specific\\"},
    {\\"category\\":\\"Problem Solving\\", \\"score\\":num, \\"feedback\\":\\"specific\\"},
    {\\"category\\":\\"Cultural Fit\\", \\"score\\":num, \\"feedback\\":\\"specific\\"}
  ],
  \\"aiAnalysis\\": \\"2-3 paragraphs referencing specific answers\\"
}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const feedback = JSON.parse(text);

        const scores = ['overallScore', 'communicationScore', 'technicalScore', 'problemSolvingScore', 'confidenceScore'];
        scores.forEach((field) => {
            feedback[field] = Math.max(0, Math.min(100, Math.round(feedback[field] || 50)));
        });

        console.log(`[Gemini] Feedback ${jobRole}: overall ${feedback.overallScore}`);
        return feedback;
    } catch (error) {
        console.error('[Gemini] Feedback parse error:', error);
        return generateFallbackFeedback();
    }
}

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

function generateFallbackFeedback(jobRole = 'role') {
    return {
        overallScore: 65,
        communicationScore: 68,
        technicalScore: 62,
        problemSolvingScore: 64,
        confidenceScore: 67,
        strengths: [
            'Engaged with questions',
            'Professional tone',
        ],
        weaknesses: [
            'Lacked specific examples',
            'Brief technical responses',
        ],
        improvementTips: [
            'Use STAR method',
            'Add project metrics',
            'Practice detailed answers',
            'Review tech fundamentals',
            'Do mock interviews',
        ],
        keyQuotes: [],
        categoryScores: [
            { category: 'Technical Knowledge', score: 62, feedback: 'Retake for detailed analysis.' },
            { category: 'Communication', score: 68, feedback: 'Clear; add structure.' },
            { category: 'Problem Solving', score: 64, feedback: 'Basic; show process.' },
            { category: 'Cultural Fit', score: 67, feedback: 'Good fit; more stories.' },
        ],
        aiAnalysis: `Unable to analyze transcript. Retake with detailed answers for personalized feedback on your ${jobRole} interview.`,
    };
}
