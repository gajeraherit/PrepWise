'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Settings, Save, Database, Zap, Shield } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminSettingsPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        allowRegistration: true,
        allowHRRegistration: true,
        maxInterviewDuration: 60,
        defaultInterviewDuration: 30,
        aiEnabled: true,
        vapiEnabled: false,
        emailNotifications: true,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    setSettings(prev => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error('Failed to fetch settings', error);
                toast.error('Failed to load settings');
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success('Settings saved successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-4xl">
                <Link href="/admin/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 gradient-primary rounded-full flex items-center justify-center">
                        <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">System Settings</h1>
                        <p className="text-muted-foreground">Configure platform settings and features</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* General Settings */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                General Settings
                            </CardTitle>
                            <CardDescription>Platform-wide configuration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="maintenance">Maintenance Mode</Label>
                                    <p className="text-sm text-muted-foreground">Disable platform access for maintenance</p>
                                </div>
                                <Switch
                                    id="maintenance"
                                    checked={settings.maintenanceMode}
                                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="registration">Allow New Registrations</Label>
                                    <p className="text-sm text-muted-foreground">Enable candidate registration</p>
                                </div>
                                <Switch
                                    id="registration"
                                    checked={settings.allowRegistration}
                                    onCheckedChange={(checked) => setSettings({ ...settings, allowRegistration: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="hrRegistration">Allow HR Registrations</Label>
                                    <p className="text-sm text-muted-foreground">Enable HR account creation</p>
                                </div>
                                <Switch
                                    id="hrRegistration"
                                    checked={settings.allowHRRegistration}
                                    onCheckedChange={(checked) => setSettings({ ...settings, allowHRRegistration: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Send email alerts to users</p>
                                </div>
                                <Switch
                                    id="emailNotifications"
                                    checked={settings.emailNotifications}
                                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interview Settings */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Interview Settings
                            </CardTitle>
                            <CardDescription>Configure interview parameters</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="maxDuration">Maximum Interview Duration (minutes)</Label>
                                <Input
                                    id="maxDuration"
                                    type="number"
                                    value={settings.maxInterviewDuration || ''}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setSettings({ ...settings, maxInterviewDuration: isNaN(val) ? 0 : val });
                                    }}
                                />
                                <p className="text-sm text-muted-foreground">Maximum allowed interview length</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="defaultDuration">Default Interview Duration (minutes)</Label>
                                <Input
                                    id="defaultDuration"
                                    type="number"
                                    value={settings.defaultInterviewDuration || ''}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setSettings({ ...settings, defaultInterviewDuration: isNaN(val) ? 0 : val });
                                    }}
                                />
                                <p className="text-sm text-muted-foreground">Default duration for new interviews</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Settings */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                AI Features
                            </CardTitle>
                            <CardDescription>Control AI-powered features</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="aiEnabled">Enable AI Question Generation</Label>
                                    <p className="text-sm text-muted-foreground">Use Gemini AI for interview questions</p>
                                </div>
                                <Switch
                                    id="aiEnabled"
                                    checked={settings.aiEnabled}
                                    onCheckedChange={(checked) => setSettings({ ...settings, aiEnabled: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="vapiEnabled">Enable Voice Interviews (Vapi AI)</Label>
                                    <p className="text-sm text-muted-foreground">Allow voice-based interview sessions</p>
                                </div>
                                <Switch
                                    id="vapiEnabled"
                                    checked={settings.vapiEnabled}
                                    onCheckedChange={(checked) => setSettings({ ...settings, vapiEnabled: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex gap-3">
                        <Button
                            className="gradient-primary text-white"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
