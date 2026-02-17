import { Timestamp } from 'firebase/firestore';

// User Roles
export type UserRole = 'candidate' | 'hr' | 'admin';

export type UserStatus = 'active' | 'pending' | 'suspended';

// User Document
export interface User {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    status: UserStatus;
    photoURL?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Candidate specific fields
    skills?: string[];
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'expert';
    yearsOfExperience?: number;
    resumeURL?: string;

    // HR specific fields
    companyId?: string;
    jobTitle?: string;
    department?: string;
}

// Company Document
export interface Company {
    id: string;
    name: string;
    industry: string;
    size?: string;
    website?: string;
    description?: string;
    logoURL?: string;
    createdBy: string; // HR user ID
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Job Document
export interface Job {
    id: string;
    companyId: string;
    title: string;
    description: string;
    requirements: string[];
    techStack: string[];
    experienceLevel: 'entry' | 'mid' | 'senior' | 'expert';
    location?: string;
    employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
    salary?: {
        min: number;
        max: number;
        currency: string;
    };
    status: 'active' | 'closed' | 'draft';
    createdBy: string; // HR user ID
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Interview Document
export interface Interview {
    id: string;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;

    // Interview Configuration
    jobRole: string;
    techStack: string[];
    experienceLevel: 'entry' | 'mid' | 'senior' | 'expert';
    duration: number; // in minutes

    // Optional: if assigned by HR
    jobId?: string;
    companyId?: string;
    assignedBy?: string; // HR user ID

    // Interview Data
    questions: {
        id: string;
        question: string;
        category: 'technical' | 'behavioral' | 'situational';
        difficulty: 'easy' | 'medium' | 'hard';
    }[];

    // Transcript
    transcript: {
        question: string;
        answer: string;
        timestamp: number;
    }[];

    // Status
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    startedAt?: Timestamp;
    completedAt?: Timestamp;

    // Proctoring
    recordingUrl?: string; // URL to video recording in Firebase Storage
    violations?: {
        type: string;
        timestamp: Timestamp;
    }[];

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Feedback Document
export interface Feedback {
    id: string;
    interviewId: string;
    candidateId: string;

    // Scores (0-100)
    overallScore: number;
    communicationScore: number;
    technicalScore: number;
    problemSolvingScore: number;
    confidenceScore: number;

    // Detailed Analysis
    strengths: string[];
    weaknesses: string[];
    improvementTips: string[];

    // Category Breakdown
    categoryScores: {
        category: string;
        score: number;
        feedback: string;
    }[];

    // AI Analysis
    aiAnalysis: string;

    // HR Notes (optional)
    hrNotes?: string;
    hrRating?: number; // 1-5 stars
    shortlisted?: boolean;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Subscription Document
export interface Subscription {
    id: string;
    userId: string;
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';

    // Limits
    interviewsPerMonth: number;
    interviewsUsed: number;

    // Billing
    currentPeriodStart: Timestamp;
    currentPeriodEnd: Timestamp;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Invitation Document (for HR inviting candidates)
export interface Invitation {
    id: string;
    companyId: string;
    jobId: string;
    hrId: string;
    candidateEmail: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    message?: string;
    interviewId?: string; // Created after candidate accepts

    expiresAt: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Application Document (for candidates applying to jobs)
export interface Application {
    id: string;
    jobId: string;
    candidateId: string;
    candidateEmail: string;
    status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
    appliedAt: Timestamp;
    reviewedAt?: Timestamp;
    notes?: string;
}

// System Settings Document
export interface SystemSettings {
    id: string; // 'general'
    maintenanceMode: boolean;
    allowRegistration: boolean;
    allowHRRegistration: boolean;
    emailNotifications: boolean;

    // Interview Settings
    maxInterviewDuration: number;
    defaultInterviewDuration: number;

    // AI Settings
    aiEnabled: boolean;
    vapiEnabled: boolean;

    updatedAt: Timestamp;
    updatedBy: string; // Admin User ID
}

// Collection Names (for type safety)
export const Collections = {
    USERS: 'users',
    COMPANIES: 'companies',
    JOBS: 'jobs',
    INTERVIEWS: 'interviews',
    FEEDBACK: 'feedback',
    SUBSCRIPTIONS: 'subscriptions',
    INVITATIONS: 'invitations',
    APPLICATIONS: 'applications',
    SETTINGS: 'settings',
} as const;
