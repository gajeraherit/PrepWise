import Link from 'next/link';
import { Brain } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy – PrepWise',
  description: 'Learn how PrepWise collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 gradient-primary rounded-lg flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">PrepWise</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-sm leading-7 text-muted-foreground">

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h2>
            <p>
              When you create a PrepWise account, we collect personal information such as your name, email address,
              and chosen role (Candidate or HR). During interview sessions, we may process voice and text data solely
              to generate AI feedback. We do not store raw audio recordings permanently.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and improve our AI-powered interview coaching service.</li>
              <li>To personalise question sets based on your target role and skill level.</li>
              <li>To generate performance reports and track your progress over time.</li>
              <li>To communicate service updates, security alerts, and support messages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Data Storage & Security</h2>
            <p>
              Your data is stored securely using Google Firebase (Firestore and Authentication). We apply
              industry-standard encryption in transit (TLS) and at rest. Access to user data is restricted to
              authorised personnel only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Third-Party Services</h2>
            <p>
              PrepWise integrates with the following third-party providers to deliver its functionality:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Firebase</strong> – Authentication and database.</li>
              <li><strong>Google Gemini AI</strong> – Generating interview questions and feedback.</li>
              <li><strong>Vapi AI</strong> – Real-time voice interview processing.</li>
              <li><strong>Cloudinary</strong> – Media file storage.</li>
            </ul>
            <p className="mt-2">Each provider operates under its own privacy policy and data-processing agreements.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Cookies</h2>
            <p>
              We use essential cookies to maintain your authenticated session. We do not use advertising or
              tracking cookies. You can disable cookies in your browser settings, but this may affect the
              functionality of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Object to or restrict certain types of processing.</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, please contact us via the email below.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Interview records and feedback
              reports are kept for up to 12 months. You may request earlier deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Children's Privacy</h2>
            <p>
              PrepWise is not directed at children under the age of 16. We do not knowingly collect personal
              information from anyone under 16. If you believe we have inadvertently collected such data,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify registered users of material
              changes by email or via an in-app notice. Continued use of PrepWise after changes become effective
              constitutes your acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or your personal data, please contact us at:{' '}
              <a href="mailto:privacy@prepwise.app" className="text-primary hover:underline">
                privacy@prepwise.app
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6 mt-16">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} PrepWise. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors font-medium text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
