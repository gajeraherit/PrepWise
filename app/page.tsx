import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Brain, Mic, TrendingUp, Users, Shield, Sparkles, BarChart3, Clock, CheckCircle2, PlayCircle, Star, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from '@/components/mobile-nav';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 z-0 bg-mesh opacity-80 pointer-events-none"></div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 mx-4 mt-4 rounded-2xl max-w-7xl md:mx-auto">
        <div className="px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative h-10 w-10">
              <Image
                src="/logo.svg"
                alt="PrepWise Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">PrepWise</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {['Features', 'How It Works'].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover-lift"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" className="hover:bg-primary/5 hover:text-primary">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="gradient-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 rounded-xl">
                  Get Started
                </Button>
              </Link>
            </div>
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 z-10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* Hero Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 px-4 py-1.5 rounded-full mb-8 backdrop-blur-md animate-fade-in-up">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">AI-Powered Interview Coach</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-balance">
                Master the Art of the{' '}
                <span className="text-gradient-primary relative inline-block">
                  Interview
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary opacity-30" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                  </svg>
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed text-balance">
                Practice with an AI that listens, understands, and coaches you to perfection. Real-time feedback, infinite patience.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-2xl gradient-primary text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 transition-all hover:-translate-y-1 group">
                    Start Practicing Free
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-2xl border-2 hover:bg-muted/50 transition-all">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    How it Works
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}&backgroundColor=c0aede`} alt="User" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    +10k
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <span>Trusted over 100k sessions</span>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="flex-1 relative w-full max-w-xl lg:max-w-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] gradient-hero opacity-20 blur-3xl rounded-full animate-pulse-slow"></div>

              <div className="relative bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-2xl animate-float">
                <div className="absolute -top-6 -right-6 glass p-4 rounded-2xl shadow-lg border-none animate-float-delayed z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Offer Received!</p>
                      <p className="text-xs text-muted-foreground">Google, L4 Engineer</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Simulated Chat UI */}
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div className="bg-white/80 dark:bg-white/10 p-4 rounded-2xl rounded-tl-sm backdrop-blur-sm">
                      <p className="text-sm font-medium">Can you explain the difference between TCP and UDP?</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start flex-row-reverse">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 opacity-50" />
                    </div>
                    <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-2xl rounded-tr-sm backdrop-blur-sm border border-primary/10">
                      <div className="flex gap-2 mb-2">
                        <span className="h-2 w-16 bg-primary/40 rounded-full animate-pulse"></span>
                        <span className="h-2 w-8 bg-primary/40 rounded-full animate-pulse delay-75"></span>
                      </div>
                      <p className="text-sm">TCP is connection-oriented and reliable, guaranteeing delivery order. UDP is simpler, connectionless...</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 p-4 rounded-2xl rounded-tl-sm backdrop-blur-sm w-full">
                      <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Great Answer!
                      </p>
                      <p className="text-sm">Your technical accuracy is spot on. To improve, try adding a real-world example of when you'd use each.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-24 relative z-10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Everything you need to <br className="hidden md:block" />crank up your confidence</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI analyzes thousands of data points to give you feedback that actually helps you improve.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Feature 1: Large Card */}
            <div className="md:col-span-2 md:row-span-2 glass-card rounded-3xl p-8 relative overflow-hidden group bento-card cursor-default">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                <Mic className="w-64 h-64 -mr-20 -mt-20" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                    <Mic className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">Real-Time Voice Analysis</h3>
                  <p className="text-lg text-muted-foreground max-w-md">Our advanced speech engine understands nuance, pace, and tone. It feels just like talking to a real potential lead interviewer.</p>
                </div>
                <div className="w-full h-24 bg-background/50 rounded-xl border border-white/10 flex items-center px-4 gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="flex-1 bg-primary/40 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 2: Tall Card */}
            <div className="md:row-span-2 glass-card rounded-3xl p-8 relative overflow-hidden group bento-card cursor-default">
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/80 to-transparent z-10"></div>
              <div className="relative z-20 h-full flex flex-col text-center items-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 text-amber-500">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Smart Scoring</h3>
                <p className="text-muted-foreground mb-8">Get scored against industry standards.</p>

                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/20" />
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="440" strokeDashoffset="44" className="text-primary" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold">
                    92
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Standard Card */}
            <div className="glass-card rounded-3xl p-8 group bento-card cursor-default flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Detailed Analytics</h3>
              </div>
              <p className="text-muted-foreground text-sm">Track your progress over time with beautiful, interactive charts.</p>
            </div>

            {/* Feature 4: Standard Card */}
            <div className="glass-card rounded-3xl p-8 group bento-card cursor-default flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Context Aware</h3>
              </div>
              <p className="text-muted-foreground text-sm">Questions tailored to your specific role, level, and industry.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - "The Journey" */}
      <section id="how-it-works" className="py-24 bg-muted/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent"></div>
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Your Path to Hired</h2>
            <p className="text-muted-foreground">Three simple steps to interview mastery</p>
          </div>

          <div className="relative">
            {/* Connecting Line (hidden on mobile) */}
            <div className="hidden md:block absolute top-24 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent border-t-2 border-dashed border-primary/20"></div>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  step: "01",
                  title: "Setup Profile",
                  desc: "Tell us your target role and upload your resume for personalization.",
                  icon: Users
                },
                {
                  step: "02",
                  title: "Mock Interview",
                  desc: "Engage in a realistic voice conversation with our AI interviewer.",
                  icon: Mic
                },
                {
                  step: "03",
                  title: "Get Hired",
                  desc: "Review detailed feedback, improve your weak spots, and ace the real thing.",
                  icon: TrendingUp
                }
              ].map((item, i) => (
                <div key={i} className="relative z-10 text-center group">
                  <div className="w-20 h-20 mx-auto bg-background border-4 border-muted rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300 group-hover:border-primary/50 relative">
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-lg">
                      {item.step}
                    </div>
                    <item.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm px-4">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="relative bg-black rounded-[2.5rem] p-12 md:p-24 text-center overflow-hidden shadow-2xl">
            {/* Abstract Shapes */}
            <div className="absolute top-0 left-0 w-full h-full opacity-30">
              <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[100%] rounded-full bg-purple-600 blur-[120px] animate-pulse-slow"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] rounded-full bg-blue-600 blur-[100px] animate-pulse-slow delay-1000"></div>
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Ready to Ace It?</h2>
              <p className="text-white/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                Join thousands of candidates who are turning interview anxiety into job offers.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl bg-white text-black hover:bg-white/90 hover:scale-105 transition-all">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
              <p className="mt-8 text-white/40 text-sm">No credit card required • Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 gradient-primary rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">PrepWise</span>
            </div>

            <div className="flex gap-8 text-sm text-black dark:text-white font-medium">
              <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="#" className="hover:text-primary transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-primary transition-colors">LinkedIn</Link>
            </div>

            <p className="text-sm text-black dark:text-white">
              &copy; {new Date().getFullYear()} PrepWise.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
