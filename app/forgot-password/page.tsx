'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Loader2, ArrowLeft } from 'lucide-react';
import { Check } from 'lucide-react';
import Image from 'next/image';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err: any) {
            console.error('Password reset error:', err);
            if (err.code === 'auth/user-not-found') {
                // For security reasons, we might want to show success even if user not found,
                // but for better UX in this app, we'll show a specific error or generic one.
                // Let's stick to a generic one or specific if needed.
                // Actually, firebase often returns user-not-found.
                setError('No account found with this email.');
            } else {
                setError(err.message || 'Failed to send reset email');
            }
        } finally {
            setLoading(false);
        }
    };

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
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>Enter your email to receive a password reset link</CardDescription>
                </CardHeader>

                <form onSubmit={handleResetPassword}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                <span>Reset link sent! Check your email.</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading || success}
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full gradient-primary text-white" disabled={loading || success}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending Link...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </Button>

                        <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sign In
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
