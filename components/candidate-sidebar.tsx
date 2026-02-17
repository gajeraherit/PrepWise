import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, UserCircle, Briefcase, Mic, History, FileText, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

const sidebarItems = [
    { name: 'Dashboard', href: '/candidate/dashboard', icon: LayoutDashboard },
    { name: 'Profile', href: '/candidate/profile', icon: UserCircle },
    { name: 'Browse Jobs', href: '/candidate/jobs', icon: Briefcase },
    { name: 'Mock Interview', href: '/candidate/interview/new', icon: Mic },
    { name: 'History', href: '/candidate/history', icon: History },
    { name: 'Feedback', href: '/candidate/feedback', icon: FileText },
];

export function CandidateSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/login');
    };

    return (
        <div className="flex flex-col h-screen w-64 bg-card border-r border-border fixed left-0 top-0 overflow-y-auto">
            {/* Logo area */}
            <div className="p-6 flex items-center gap-2 border-b border-border">
                <div className="relative h-8 w-8">
                    <Image
                        src="/logo.svg"
                        alt="PrepWise"
                        fill
                        className="object-contain"
                    />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                    PrepWise
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3 h-12 text-sm font-medium",
                                    isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                                    !isActive && "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.name}
                            </Button>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border space-y-2">
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-sm text-muted-foreground font-medium">Theme</span>
                    <ThemeToggle />
                </div>

                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={handleSignOut}
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
