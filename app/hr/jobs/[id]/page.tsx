'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        techStack: '',
        experienceLevel: 'mid',
        location: '',
        jobType: 'full-time',
        status: 'active',
    });

    useEffect(() => {
        const loadJob = async () => {
            try {
                const jobDoc = await getDoc(doc(db, Collections.JOBS, params.id as string));
                if (jobDoc.exists()) {
                    const data = jobDoc.data();
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        requirements: Array.isArray(data.requirements) ? data.requirements.join('\n') : data.requirements || '',
                        techStack: Array.isArray(data.techStack) ? data.techStack.join(', ') : data.techStack || '',
                        experienceLevel: data.experienceLevel || 'mid',
                        location: data.location || '',
                        jobType: data.jobType || 'full-time',
                        status: data.status || 'active',
                    });
                }
            } catch (error) {
                console.error('Error loading job:', error);
                toast.error('Failed to load job details');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            loadJob();
        }
    }, [params.id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await updateDoc(doc(db, Collections.JOBS, params.id as string), {
                ...formData,
                techStack: formData.techStack.split(',').map(s => s.trim()).filter(Boolean),
                requirements: formData.requirements.split('\n').filter(Boolean),
                updatedAt: new Date(),
            });

            toast.success('Job updated successfully!');
            router.push('/hr/jobs');
        } catch (error) {
            console.error('Error updating job:', error);
            toast.error('Failed to update job');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this job posting?')) return;

        try {
            await deleteDoc(doc(db, Collections.JOBS, params.id as string));
            toast.success('Job deleted successfully!');
            router.push('/hr/jobs');
        } catch (error) {
            console.error('Error deleting job:', error);
            toast.error('Failed to delete job');
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
                <Link href="/hr/jobs">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Jobs
                    </Button>
                </Link>

                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="text-2xl">Edit Job Posting</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Job Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                                        <SelectItem value="entry">Entry Level</SelectItem>
                                        <SelectItem value="mid">Mid Level</SelectItem>
                                        <SelectItem value="senior">Senior Level</SelectItem>
                                        <SelectItem value="expert">Expert Level</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="requirements">Requirements (one per line)</Label>
                                <Textarea
                                    id="requirements"
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                    rows={5}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" className="gradient-primary text-white" disabled={saving}>
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
                                <Button type="button" variant="outline" onClick={() => router.push('/hr/jobs')}>
                                    Cancel
                                </Button>
                                <Button type="button" variant="destructive" onClick={handleDelete} className="ml-auto">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Job
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
