/**
 * Vapi AI utility — builds the correct arguments for vapi.start()
 *
 * SDK signature:
 *   vapi.start(assistant: CreateAssistantDTO | string, assistantOverrides?: AssistantOverrides)
 *
 * We use the pre-built assistant ID from .env as the base, then inject
 * interview-specific context (questions, role, etc.) via AssistantOverrides.
 */

export interface InterviewQuestion {
    id: string;
    question: string;
    category: string;
    difficulty: string;
}

export interface InterviewData {
    jobRole: string;
    techStack: string[];
    experienceLevel: string;
    duration: number;
    questions: InterviewQuestion[];
}

/**
 * Builds the system prompt injected into the assistant for this interview session.
 */
export function buildSystemPrompt(interview: InterviewData): string {
    const questionsList = interview.questions
        .map((q, i) => `${i + 1}. [${q.category.toUpperCase()} – ${q.difficulty}] ${q.question}`)
        .join('\n');

    return `You are an expert AI technical interviewer conducting a ${interview.experienceLevel}-level interview for a ${interview.jobRole} position.

Tech Stack: ${interview.techStack.join(', ')}
Interview Duration: approximately ${interview.duration} minutes

Your job is to ask the following questions ONE BY ONE in order. After the candidate answers each question, acknowledge their answer briefly (e.g., "Great, thank you.") and move on to the next question. Do NOT give hints or feedback during the interview.

Questions:
${questionsList}

Important rules:
- Always wait for the candidate to fully finish speaking before responding.
- Keep your transitions natural and professional.
- If the candidate goes off-topic, politely redirect them to the question.
- Be encouraging but neutral — do not reveal scores or ratings.
- After the final question is answered, say: "Thank you for completing the interview. Your responses have been recorded. Goodbye!"`;
}

/**
 * Returns [assistantId, assistantOverrides] to pass to vapi.start().
 *
 * Uses the pre-built Vapi assistant as the base (for voice/transcriber settings
 * already configured in the dashboard), and injects the interview-specific
 * system prompt via overrides.
 */
export function buildVapiStartArgs(interview: InterviewData): [string, object] {
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '';

    const assistantOverrides = {
        model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: buildSystemPrompt(interview),
                },
            ],
        },
    };

    return [assistantId, assistantOverrides];
}

/**
 * Parses the Vapi messages array into our Q&A transcript format.
 * Uses original questions list as source of truth for question text,
 * maps user messages as answers in order.
 */
export function parseVapiTranscript(
    messages: Array<{ role: string; content: string }>,
    questions: InterviewQuestion[]
): Array<{ question: string; answer: string }> {
    // Vapi splits user answers if they pause. 
    // We group all contiguous 'user' messages that appear between 'assistant' messages.
    const groupedUserAnswers: string[] = [];
    let currentAnswerChunks: string[] = [];

    // The assistant usually speaks first (introducing / asking the first question).
    for (const msg of messages) {
        if (msg.role === 'user') {
            currentAnswerChunks.push(msg.content);
        } else if (msg.role === 'assistant') {
            if (currentAnswerChunks.length > 0) {
                groupedUserAnswers.push(currentAnswerChunks.join(' '));
                currentAnswerChunks = [];
            }
        }
    }

    // Push the final chunk if the call ended while the user was speaking
    if (currentAnswerChunks.length > 0) {
        groupedUserAnswers.push(currentAnswerChunks.join(' '));
    }

    return questions.map((q, i) => ({
        question: q.question,
        answer: groupedUserAnswers[i] || '',
    }));
}
