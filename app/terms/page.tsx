import Link from 'next/link';
import { Brain } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service – PrepWise',
  description: 'Read the terms and conditions governing your use of PrepWise.',
};

export default function TermsPage() {
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
        <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-sm leading-7 text-muted-foreground">

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using PrepWise in any way, you agree to be bound by these Terms
              of Service. If you do not agree with any part of these terms, you must not use our service.
              These terms apply to all users, including candidates, HR professionals, and administrators.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Description of Service</h2>
            <p>
              PrepWise is an AI-powered interview preparation platform. We provide mock interview sessions,
              real-time voice analysis, performance scoring, and feedback generation. The platform connects
              job seekers (candidates) with HR professionals who post job listings and review interview results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Account Registration</h2>
            <p>
              You must register for an account to access most features of PrepWise. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete registration information.</li>
              <li>Keep your account credentials confidential and secure.</li>
              <li>Notify us immediately of any unauthorised use of your account.</li>
              <li>Not register multiple accounts or share your account with others.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Acceptable Use</h2>
            <p>You agree not to use PrepWise to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations.</li>
              <li>Upload or share harmful, offensive, or misleading content.</li>
              <li>Attempt to reverse-engineer, scrape, or exploit the platform or its AI models.</li>
              <li>Impersonate another person or misrepresent your identity or qualifications.</li>
              <li>Interfere with or disrupt the integrity or performance of the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. AI-Generated Content</h2>
            <p>
              PrepWise uses artificial intelligence to generate interview questions and feedback. All
              AI-generated content is provided for educational and practice purposes only. It does not
              constitute professional career advice. We do not guarantee the accuracy, completeness, or
              suitability of AI-generated content for any specific job application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Intellectual Property</h2>
            <p>
              All content, branding, software, and materials on PrepWise are owned by or licensed to us.
              You may not copy, reproduce, modify, or distribute any part of the platform without prior
              written consent. You retain ownership of any personal data you submit to the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. HR & Job Listing Rules</h2>
            <p>HR users who post job listings on PrepWise agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Post only genuine, active job opportunities.</li>
              <li>Not discriminate based on protected characteristics.</li>
              <li>Handle candidate data collected through the platform responsibly and in compliance with applicable data protection laws.</li>
              <li>Remove outdated or filled positions promptly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Disclaimers & Limitation of Liability</h2>
            <p>
              PrepWise is provided "as is" without warranties of any kind. We do not guarantee that use of
              our platform will result in successful job placement. To the fullest extent permitted by law,
              PrepWise shall not be liable for any indirect, incidental, special, or consequential damages
              arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations of these
              terms, without prior notice. You may also delete your account at any time through the account
              settings or by contacting us. Upon termination, your access to the platform will cease and
              your data will be handled in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms of Service periodically. We will provide notice of significant
              changes via email or an in-app notification. Continued use of the platform following the
              effective date of changes constitutes your acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">11. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable law. Any disputes
              arising under these terms shall be subject to the exclusive jurisdiction of the competent courts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">12. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:{' '}
              <a href="mailto:legal@prepwise.app" className="text-primary hover:underline">
                legal@prepwise.app
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
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors font-medium text-foreground">Terms</Link>
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
