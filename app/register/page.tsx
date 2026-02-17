'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections, UserRole, UserStatus } from '@/lib/firebase/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'candidate' as UserRole,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [settings, setSettings] = useState<{ allowRegistration?: boolean, allowHRRegistration?: boolean, maintenanceMode?: boolean } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                    // If candidate registration is disabled but HR is allowed, default to HR
                    if (data.allowRegistration === false && data.allowHRRegistration !== false) {
                        setFormData(prev => ({ ...prev, role: 'hr' }));
                    }
                }
            } catch (error) {
                console.error('Failed to fetch settings', error);
            }
        };
        fetchSettings();
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (settings) {
            if (formData.role === 'candidate' && settings.allowRegistration === false) {
                setError('Candidate registration is currently disabled.');
                setLoading(false);
                return;
            }
            if (formData.role === 'hr' && settings.allowHRRegistration === false) {
                setError('HR registration is currently disabled.');
                setLoading(false);
                return;
            }
        }

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // Create Firestore user document
            const userStatus: UserStatus = 'active';

            await setDoc(doc(db, Collections.USERS, user.uid), {
                uid: user.uid,
                email: formData.email,
                displayName: formData.name,
                role: formData.role,
                status: userStatus,
                photoURL: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Redirect based on role
            if (formData.role === 'hr') {
                router.push('/hr/profile'); // HR needs to complete company profile
            } else {
                router.push('/candidate/dashboard');
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email is already registered');
            } else {
                setError(err.message || 'Failed to create account');
            }
            setLoading(false);
        }
    };

    if (settings && settings.allowRegistration === false && settings.allowHRRegistration === false) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden text-center">
                <div className="absolute inset-0 gradient-hero opacity-10"></div>
                <div className="relative z-10 max-w-md p-8 glass rounded-xl">
                    <h1 className="text-2xl font-bold mb-4">Registration Closed</h1>
                    <p className="text-muted-foreground mb-6">New user registration is currently disabled by the administrator.</p>
                    <Link href="/login">
                        <Button className="gradient-primary text-white">Back to Login</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 gradient-hero opacity-10"></div>

            <Card className="w-full max-w-md glass relative z-10">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative h-16 w-16">
                            <Image
                                src="/logo.svg"
                                alt="PrepWise"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                    <CardDescription>Start your interview preparation journey</CardDescription>
                </CardHeader>

                <form onSubmit={handleRegister}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">I am a...</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="candidate">Candidate (Job Seeker)</SelectItem>
                                    {settings?.allowHRRegistration !== false && (
                                        <SelectItem value="hr">HR / Recruiter</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    disabled={loading}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    disabled={loading}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 pt-4">
                        <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
