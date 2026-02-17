'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Save, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function HRProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyExists, setCompanyExists] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        website: '',
        description: '',
        location: '',
        industry: '',
        size: '',
    });

    useEffect(() => {
        const loadProfile = async () => {
            const user = auth.currentUser;
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Try to load company profile
                const companyDoc = await getDoc(doc(db, Collections.COMPANIES, user.uid));
                if (companyDoc.exists()) {
                    const data = companyDoc.data();
                    setCompanyExists(true);
                    setFormData({
                        companyName: data.name || '',
                        website: data.website || '',
                        description: data.description || '',
                        location: data.location || '',
                        industry: data.industry || '',
                        size: data.size || '',
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const user = auth.currentUser;
        if (!user) return;

        try {
            const companyData = {
                name: formData.companyName,
                website: formData.website,
                description: formData.description,
                location: formData.location,
                industry: formData.industry,
                size: formData.size,
                hrId: user.uid,
                updatedAt: new Date(),
            };

            if (companyExists) {
                await updateDoc(doc(db, Collections.COMPANIES, user.uid), companyData);
            } else {
                await setDoc(doc(db, Collections.COMPANIES, user.uid), {
                    ...companyData,
                    createdAt: new Date(),
                });
                setCompanyExists(true);
            }

            toast.success('Company profile saved successfully!');
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
                                <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Company Profile</CardTitle>
                                <CardDescription>Manage your company information</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name</Label>
                                <Input
                                    id="companyName"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    placeholder="Acme Corporation"
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="San Francisco, CA"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Company Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Tell candidates about your company..."
                                    rows={5}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="industry">Industry</Label>
                                    <Input
                                        id="industry"
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        placeholder="Technology, Finance, etc."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="size">Company Size</Label>
                                    <Input
                                        id="size"
                                        value={formData.size}
                                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                        placeholder="1-10, 11-50, 51-200, etc."
                                    />
                                </div>
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
                                            Save Profile
                                        </>
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
        </div>
    );
}
