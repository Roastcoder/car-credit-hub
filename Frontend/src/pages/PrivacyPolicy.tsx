import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Shield } from "lucide-react";

const PrivacyPolicy = () => {
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
            <Shield className="h-6 w-6" />
            <span className="font-bold text-xl uppercase tracking-wider">Mehar Finance</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last updated: April 8, 2026</p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              At <strong>Mehar Finance</strong>, we are committed to protecting your personal information and your right to privacy. This policy explains what information we collect and how we use it.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when you register on the app, express an interest in obtaining information about us or our products, or when you participate in activities on the app.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
              <li><strong>Personal Information:</strong> Name, email address, phone number, and physical address.</li>
              <li><strong>Financial Information:</strong> Transaction history, credit information, and account details for tracking features.</li>
              <li><strong>Device Data:</strong> We may collect device information such as your IP address, browser type, and operating system.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
            <p>
              We use your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
              <li>To facilitate account creation and logon process.</li>
              <li>To send administrative information to you.</li>
              <li>To fulfill and manage your orders or financial requests.</li>
              <li>To protect our Services from fraud and illegal activities.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Data Security</h2>
            <p>
              We aim to protect your personal information through a system of organizational and technical security measures. We have implemented appropriate internal security measures designed to protect the security of any personal information we process.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Data Deletion</h2>
            <p>
              You may at any time review or change the information in your account or terminate your account. Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Contact Us</h2>
            <p>
              If you have questions or comments about this policy, you may email us at <a href="mailto:info@meharadvisory.com" className="text-blue-600 dark:text-blue-400 hover:underline"><strong>info@meharadvisory.com</strong></a>.
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

export default PrivacyPolicy;
