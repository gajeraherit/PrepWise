'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Collections } from '@/lib/firebase/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, History, User, TrendingUp, Clock, Award, Briefcase } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export default function CandidateDashboardPage() {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [stats, setStats] = useState({
        completedInterviews: 0,
        averageScore: 0,
        totalHours: 0,
        skillsAssessed: 0,
    });

    useEffect(() => {
        const loadUserData = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                // Load user profile from Firestore
                const userDoc = await getDoc(doc(db, Collections.USERS, user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserName(userData.displayName || user.email || 'User');
                }

                // Load interview statistics
                const interviewsQuery = query(
                    collection(db, Collections.INTERVIEWS),
                    where('candidateId', '==', user.uid)
                );
                const interviewsSnapshot = await getDocs(interviewsQuery);
                const interviews = interviewsSnapshot.docs.map(doc => doc.data());

                const completed = interviews.filter((i: any) => i.status === 'completed').length;
                const totalMinutes = interviews.reduce((sum: number, i: any) => sum + (i.duration || 0), 0);
                const skills = new Set(interviews.flatMap((i: any) => i.techStack || [])).size;

                // Load feedback to compute average score
                let avgScore = 0;
                try {
                    const feedbackQuery = query(
                        collection(db, Collections.FEEDBACK),
                        where('candidateId', '==', user.uid)
                    );
                    const feedbackSnapshot = await getDocs(feedbackQuery);
                    if (!feedbackSnapshot.empty) {
                        const scores = feedbackSnapshot.docs
                            .map(d => d.data().overallScore)
                            .filter((s: any) => typeof s === 'number');
                        if (scores.length > 0) {
                            avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
                        }
                    }
                } catch {
                    // feedback collection might not exist yet — that's OK
                }

                setStats({
                    completedInterviews: completed,
                    averageScore: avgScore,
                    totalHours: Math.round(totalMinutes / 60),
                    skillsAssessed: skills,
                });
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        loadUserData();
    }, []);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/');
    };

    return (
        <div className="min-h-screen">


            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
                    <p className="text-muted-foreground">Track your progress and continue practicing</p>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <Card className="card-hover">
                        <CardHeader className="pb-2">
                            <CardDescription>Interviews Completed</CardDescription>
                            <CardTitle className="text-3xl">{stats.completedInterviews}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <History className="h-4 w-4 mr-1" />
                                <span>All time</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="card-hover">
                        <CardHeader className="pb-2">
                            <CardDescription>Average Score</CardDescription>
                            <CardTitle className="text-3xl">{stats.averageScore > 0 ? stats.averageScore : '-'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                <span>Out of 100</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="card-hover">
                        <CardHeader className="pb-2">
                            <CardDescription>Hours Practiced</CardDescription>
                            <CardTitle className="text-3xl">{stats.totalHours}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>Total time</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="card-hover">
                        <CardHeader className="pb-2">
                            <CardDescription>Skills Assessed</CardDescription>
                            <CardTitle className="text-3xl">{stats.skillsAssessed}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Award className="h-4 w-4 mr-1" />
                                <span>Categories</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Interviews */}
                <Card className="glass h-full">
                    <CardHeader>
                        <CardTitle>Recent Interviews</CardTitle>
                        <CardDescription>Your latest interview sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-muted-foreground">
                            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No interviews yet. Start your first interview to see your progress here!</p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
