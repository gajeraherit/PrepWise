'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Briefcase, Sparkles, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { JOB_ROLES } from '@/lib/constants/job-roles';

export default function NewJobPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [generatingQuestions, setGeneratingQuestions] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [newQuestion, setNewQuestion] = useState({
        question: '',
        difficulty: 'medium',
        category: 'technical'
    });



    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        techStack: '',
        experienceLevel: 'mid',
        location: '',
        jobType: 'full-time',
    });

    const handleRoleChange = (role: string) => {
        const selectedRole = JOB_ROLES.find(r => r.role === role);
        setFormData({
            ...formData,
            title: role,
            techStack: selectedRole ? selectedRole.stack : formData.techStack
        });
    };

    const handleGenerateQuestions = async () => {
        if (!formData.title || !formData.techStack) {
            toast.error('Please fill in Job Title and Tech Stack first');
            return;
        }

        setGeneratingQuestions(true);
        try {
            const response = await fetch('/api/interviews/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobRole: formData.title,
                    techStack: formData.techStack.split(',').map(s => s.trim()).filter(Boolean),
                    experienceLevel: formData.experienceLevel,
                }),
            });

            if (response.ok) {
                const { questions: generatedQuestions } = await response.json();
                setQuestions([...questions, ...generatedQuestions]);
                toast.success('Questions generated successfully!');
            } else {
                throw new Error('Failed to generate questions');
            }
        } catch (error) {
            console.error('Error generating questions:', error);
            toast.error('Failed to generate questions');
        } finally {
            setGeneratingQuestions(false);
        }
    };

    const handleAddQuestion = () => {
        if (!newQuestion.question.trim()) return;
        setQuestions([...questions, { ...newQuestion, id: Date.now().toString() }]);
        setNewQuestion({ ...newQuestion, question: '' });
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const user = auth.currentUser;
        if (!user) return;

        try {
            await addDoc(collection(db, Collections.JOBS), {
                ...formData,
                techStack: formData.techStack.split(',').map(s => s.trim()).filter(Boolean),
                requirements: formData.requirements.split('\n').filter(Boolean),
                questions,
                companyId: user.uid,
                postedBy: user.uid,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            toast.success('Job posted successfully!');
            router.push('/hr/jobs');
        } catch (error) {
            console.error('Error creating job:', error);
            toast.error('Failed to create job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-3xl">
                <Link href="/hr/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>

                <Card className="glass">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-12 w-12 gradient-primary rounded-full flex items-center justify-center">
                                <Briefcase className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Post New Job</CardTitle>
                                <CardDescription>Create a new job posting for candidates</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Job Title</Label>
                                <Select
                                    value={formData.title}
                                    onValueChange={handleRoleChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a job title" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {JOB_ROLES.map((role) => (
                                            <SelectItem key={role.role} value={role.role}>
                                                {role.role}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g., San Francisco, CA"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="jobType">Job Type</Label>
                                    <Select
                                        value={formData.jobType}
                                        onValueChange={(value) => setFormData({ ...formData, jobType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full-time">Full Time</SelectItem>
                                            <SelectItem value="part-time">Part Time</SelectItem>
                                            <SelectItem value="contract">Contract</SelectItem>
                                            <SelectItem value="internship">Internship</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Job Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                                    rows={5}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="techStack">Tech Stack (comma-separated)</Label>
                                <Input
                                    id="techStack"
                                    value={formData.techStack}
                                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                                    placeholder="React, Node.js, TypeScript, MongoDB"
                                    required
                                />
                            </div>


                            <div className="space-y-2">
                                <Label htmlFor="experienceLevel">Experience Level</Label>
                                <Select
                                    value={formData.experienceLevel}
                                    onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                                        <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                                        <SelectItem value="senior">Senior Level (5-10 years)</SelectItem>
                                        <SelectItem value="expert">Expert Level (10+ years)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="requirements">Requirements (one per line)</Label>
                                <Textarea
                                    id="requirements"
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                    placeholder="5+ years of experience with React&#10;Strong understanding of web fundamentals&#10;Experience with REST APIs"
                                    rows={5}
                                    required
                                />
                            </div>

                            {/* Interview Questions Section */}
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <Label className="text-lg">Interview Questions</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateQuestions}
                                        disabled={generatingQuestions}
                                        className="gap-2"
                                    >
                                        {generatingQuestions ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-4 w-4 text-primary" />
                                        )}
                                        Generate with AI
                                    </Button>
                                </div>

                                {/* Questions List */}
                                <div className="space-y-3">
                                    {questions.map((q, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border group">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium">{q.question}</p>
                                                <div className="flex gap-2 text-xs text-muted-foreground capitalize">
                                                    <span className="bg-background px-2 py-0.5 rounded border">{q.category}</span>
                                                    <span className="bg-background px-2 py-0.5 rounded border">{q.difficulty}</span>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleRemoveQuestion(idx)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {questions.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                            <p>No questions added yet.</p>
                                            <p className="text-xs mt-1">Generate with AI or add manually below.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Manual Add */}
                                <div className="flex items-end gap-3 pt-2">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="newQuestion">Add Question Manually</Label>
                                        <Input
                                            id="newQuestion"
                                            value={newQuestion.question}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                                            placeholder="Type your question here..."
                                        />
                                    </div>
                                    <div className="w-[140px] space-y-2">
                                        <Label>Category</Label>
                                        <Select
                                            value={newQuestion.category}
                                            onValueChange={(val) => setNewQuestion({ ...newQuestion, category: val })}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="technical">Technical</SelectItem>
                                                <SelectItem value="behavioral">Behavioral</SelectItem>
                                                <SelectItem value="situational">Situational</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-[120px] space-y-2">
                                        <Label>Difficulty</Label>
                                        <Select
                                            value={newQuestion.difficulty}
                                            onValueChange={(val) => setNewQuestion({ ...newQuestion, difficulty: val })}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="easy">Easy</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="hard">Hard</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="button" onClick={handleAddQuestion} disabled={!newQuestion.question.trim()}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" className="gradient-primary text-white" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Posting...
                                        </>
                                    ) : (
                                        'Post Job'
                                    )}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => router.push('/hr/dashboard')}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
