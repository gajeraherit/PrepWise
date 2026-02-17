'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, FileText, Shield } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Link from 'next/link';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCandidates: 0,
        totalHRs: 0,
        totalInterviews: 0,
    });

    useEffect(() => {
        const loadStats = async () => {
            try {
                // Count users
                const usersSnapshot = await getDocs(collection(db, Collections.USERS));
                const users = usersSnapshot.docs.map(doc => doc.data());

                // Filter out admin users
                const nonAdminUsers = users.filter((u: any) => u.role !== 'admin');

                // Count interviews
                const interviewsSnapshot = await getDocs(collection(db, Collections.INTERVIEWS));

                setStats({
                    totalUsers: nonAdminUsers.length,
                    totalCandidates: users.filter((u: any) => u.role === 'candidate').length,
                    totalHRs: users.filter((u: any) => u.role === 'hr').length,
                    totalInterviews: interviewsSnapshot.size,
                });
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        };

        loadStats();
    }, []);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/login');
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Platform administration and management</p>
                    </div>
                    <Button variant="outline" onClick={handleSignOut}>
                        Sign Out
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="glass">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Users</p>
                                    <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
                                </div>
                                <Users className="h-10 w-10 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Candidates</p>
                                    <p className="text-3xl font-bold mt-1">{stats.totalCandidates}</p>
                                </div>
                                <Users className="h-10 w-10 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">HR Accounts</p>
                                    <p className="text-3xl font-bold mt-1">{stats.totalHRs}</p>
                                </div>
                                <Briefcase className="h-10 w-10 text-blue-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Interviews</p>
                                    <p className="text-3xl font-bold mt-1">{stats.totalInterviews}</p>
                                </div>
                                <FileText className="h-10 w-10 text-yellow-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card className="glass mb-8">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Link href="/admin/users">
                                <Button className="w-full gradient-primary text-white h-16">
                                    <Shield className="mr-2 h-5 w-5" />
                                    Manage Users
                                </Button>
                            </Link>
                            <Link href="/admin/settings">
                                <Button variant="outline" className="w-full h-16">
                                    <Briefcase className="mr-2 h-5 w-5" />
                                    System Settings
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Platform Overview */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Platform Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                                <span className="text-muted-foreground">System Status</span>
                                <span className="text-green-600 font-medium">Operational</span>
                            </div>
                            <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                                <span className="text-muted-foreground">Database Status</span>
                                <span className="text-green-600 font-medium">Connected</span>
                            </div>
                            <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                                <span className="text-muted-foreground">AI Services</span>
                                <span className="text-green-600 font-medium">Active</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
