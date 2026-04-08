import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Scale } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to App
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Scale className="h-6 w-6" />
            <span className="font-bold text-xl uppercase tracking-wider">Mehar Finance</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Terms of Service</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last updated: April 8, 2026</p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              By using the <strong>Mehar Finance</strong> app, you agree to the following terms and conditions. Please read them carefully.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. User Eligibility</h2>
            <p>
              To use our services, you must be at least 18 years of age and capable of forming a binding contract with us. If you are using the app on behalf of a company, you represent and warrant that you have the authority to bind that entity to these Terms.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. Account Registration</h2>
            <p>
              You must provide accurate, current, and complete information during the registration process and keep your account information up to date. You are responsible for all activity that occurs under your account.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Prohibited Conduct</h2>
            <p>
              You agree not to use the app for any illegal purposes or to conduct any financial activity that violates applicable laws. We reserve the right to suspend your account if any fraudulent activity is detected.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Disclaimers</h2>
            <p>
              <strong>Mehar Finance</strong> provides financial tracking and information for educational purposes only. We are not professional financial advisers, and we do not guarantee any financial outcomes based on the use of this app.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Mehar Finance shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your access to our app at any time, for any reason, including without limitation if you breach the Terms of Service.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:info@meharadvisory.com" className="text-blue-600 dark:text-blue-400 hover:underline"><strong>info@meharadvisory.com</strong></a>.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-slate-500 dark:text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Mehar Finance. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
