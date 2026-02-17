'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { nanoid } from 'nanoid';
import { JOB_ROLES } from '@/lib/constants/job-roles';

export default function NewInterviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        jobRole: '',
        techStack: '',
        experienceLevel: 'mid',
        duration: '30',
    });

    const handleRoleChange = (role: string) => {
        const selectedRole = JOB_ROLES.find(r => r.role === role);
        setFormData({
            ...formData,
            jobRole: role,
            techStack: selectedRole ? selectedRole.stack : formData.techStack
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                router.push('/login');
                return;
            }

            // Create interview document
            const interviewData = {
                id: nanoid(),
                candidateId: user.uid,
                candidateName: user.displayName || user.email,
                candidateEmail: user.email,
                jobRole: formData.jobRole,
                techStack: formData.techStack.split(',').map(s => s.trim()),
                experienceLevel: formData.experienceLevel,
                duration: parseInt(formData.duration),
                questions: [],
                transcript: [],
                status: 'scheduled',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, Collections.INTERVIEWS), interviewData);

            // Redirect to interview page
            router.push(`/candidate/interview/${docRef.id}`);
        } catch (error) {
            console.error('Error creating interview:', error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Create New Interview</h1>
                    <p className="text-muted-foreground">Configure your AI mock interview session</p>
                </div>

                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Sparkles className="mr-2 h-5 w-5 text-primary" />
                            Interview Configuration
                        </CardTitle>
                        <CardDescription>Tell us about the role you're preparing for</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="jobRole">Job Role / Position</Label>
                                <Select
                                    value={formData.jobRole}
                                    onValueChange={handleRoleChange}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a job role" />
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

                            <div className="space-y-2">
                                <Label htmlFor="techStack">Tech Stack (comma-separated)</Label>
                                <Input
                                    id="techStack"
                                    placeholder="e.g. React, Node.js, TypeScript, MongoDB"
                                    value={formData.techStack}
                                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="experienceLevel">Experience Level</Label>
                                <Select
                                    value={formData.experienceLevel}
                                    onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                                    disabled={loading}
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
                                <Label htmlFor="duration">Interview Duration (minutes)</Label>
                                <Select
                                    value={formData.duration}
                                    onValueChange={(value) => setFormData({ ...formData, duration: value })}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 minutes</SelectItem>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="45">45 minutes</SelectItem>
                                        <SelectItem value="60">60 minutes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4 space-y-3">
                                <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Interview...
                                        </>
                                    ) : (
                                        'Start Interview'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.back()}
                                    disabled={loading}
                                >
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
