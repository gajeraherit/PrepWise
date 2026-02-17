'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Collections } from '@/lib/firebase/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Users as UsersIcon, Shield } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function UsersManagementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const snapshot = await getDocs(collection(db, Collections.USERS));
            const userData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((user: any) => user.role !== 'admin');
            setUsers(userData);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await updateDoc(doc(db, Collections.USERS, userId), {
                role: newRole,
                updatedAt: new Date(),
            });

            toast.success('User role updated successfully!');
            loadUsers(); // Reload to reflect changes
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error('Failed to update user role');
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-500 text-white';
            case 'hr': return 'bg-blue-500 text-white';
            case 'candidate': return 'bg-green-500 text-white';
            default: return 'bg-gray-500 text-white';
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
            <div className="container mx-auto max-w-7xl">
                <Link href="/admin/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>

                <Card className="glass mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Shield className="h-6 w-6" />
                            <div>
                                <CardTitle className="text-2xl">User Management</CardTitle>
                                <p className="text-muted-foreground mt-1">Manage all platform users and their roles</p>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {users.length === 0 ? (
                    <Card className="glass">
                        <CardContent className="p-12 text-center">
                            <UsersIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">No Users Found</h3>
                            <p className="text-muted-foreground">Users will appear here once they register</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {users.map((user) => (
                            <Card key={user.id} className="glass">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="h-12 w-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                                                {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold">{user.displayName || 'Unnamed User'}</h3>
                                                    <Badge className={getRoleBadgeColor(user.role)}>
                                                        {user.role || 'unknown'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Select
                                                value={user.role || 'candidate'}
                                                onValueChange={(value) => handleRoleChange(user.id, value)}
                                            >
                                                <SelectTrigger className="w-40">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="candidate">Candidate</SelectItem>
                                                    <SelectItem value="hr">HR</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
