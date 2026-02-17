'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Save, ArrowLeft, Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CandidateProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState({
        displayName: '',
        email: '',
        skills: '',
        experienceLevel: 'mid',
        phone: '',
        location: '',
        resumeUrl: '',
        resumeName: '',
    });

    useEffect(() => {
        const loadProfile = async () => {
            const user = auth.currentUser;
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, Collections.USERS, user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setProfile({
                        displayName: data.displayName || '',
                        email: data.email || '',
                        skills: data.skills?.join(', ') || '',
                        experienceLevel: data.experienceLevel || 'mid',
                        phone: data.phone || '',
                        location: data.location || '',
                        resumeUrl: data.resumeUrl || '',
                        resumeName: data.resumeName || '',
                    });
                }
            } catch (error) {
                console.error('Error loading profile:', error);
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [router]);

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a PDF or Word document');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setUploading(true);
        const user = auth.currentUser;
        if (!user) return;

        try {
            const formData = new FormData();
            formData.append('resume', file);
            formData.append('userId', user.uid);

            const response = await fetch('/api/upload-resume', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            const downloadUrl = data.url;

            setProfile(prev => ({
                ...prev,
                resumeUrl: downloadUrl,
                resumeName: file.name
            }));

            toast.success('Resume uploaded successfully!');
        } catch (error: any) {
            console.error('Error uploading resume:', error);
            toast.error(`Failed to upload resume: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveResume = () => {
        setProfile(prev => ({
            ...prev,
            resumeUrl: '',
            resumeName: ''
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const user = auth.currentUser;
        if (!user) return;

        try {
            await updateDoc(doc(db, Collections.USERS, user.uid), {
                displayName: profile.displayName,
                skills: profile.skills.split(',').map(s => s.trim()).filter(Boolean),
                experienceLevel: profile.experienceLevel,
                phone: profile.phone,
                location: profile.location,
                resumeUrl: profile.resumeUrl,
                resumeName: profile.resumeName,
                updatedAt: new Date(),
            });

            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-3xl">
                <Link href="/candidate/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>

                <Card className="glass">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-12 w-12 gradient-primary rounded-full flex items-center justify-center">
                                <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">My Profile</CardTitle>
                                <CardDescription>Manage your personal information and preferences</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Full Name</Label>
                                    <Input
                                        id="displayName"
                                        value={profile.displayName}
                                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={profile.location}
                                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                        placeholder="City, Country"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="skills">Skills (comma-separated)</Label>
                                <Input
                                    id="skills"
                                    value={profile.skills}
                                    onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                                    placeholder="React, Node.js, TypeScript, Python"
                                />
                                <p className="text-sm text-muted-foreground">Enter your technical skills separated by commas</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="experienceLevel">Experience Level</Label>
                                <Select
                                    value={profile.experienceLevel}
                                    onValueChange={(value) => setProfile({ ...profile, experienceLevel: value })}
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
                                <Label>Resume</Label>
                                <Card className="border-dashed bg-transparent p-4">
                                    {profile.resumeUrl ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{profile.resumeName || 'Resume.pdf'}</p>
                                                    <a
                                                        href={profile.resumeUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        View uploaded resume
                                                    </a>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleRemoveResume}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Remove</span>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center py-4">
                                            <div className="h-12 w-12 bg-muted/50 rounded-full flex items-center justify-center mb-3">
                                                <Upload className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <div className="flex flex-col gap-1 items-center">
                                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                                <p className="text-xs text-muted-foreground">PDF, DOC, DOCX (Max 5MB)</p>
                                                <Input
                                                    id="resume-upload"
                                                    type="file"
                                                    className="hidden"
                                                    onChange={handleResumeUpload}
                                                    accept=".pdf,.doc,.docx"
                                                    disabled={uploading}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2"
                                                    onClick={() => document.getElementById('resume-upload')?.click()}
                                                    disabled={uploading}
                                                >
                                                    {uploading ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Uploading...
                                                        </>
                                                    ) : 'Select File'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" className="gradient-primary text-white" disabled={saving || uploading}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => router.push('/candidate/dashboard')}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
